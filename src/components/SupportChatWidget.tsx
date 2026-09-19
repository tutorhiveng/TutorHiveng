import React, { useState, useEffect, useRef } from "react";
import { MessageSquare, X, Send, MessageCircle, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { db } from "../firebase";
import { UserProfile, SupportChatMessage } from "../types";
import { collection, doc, getDoc, setDoc, onSnapshot, query, orderBy, serverTimestamp, addDoc, updateDoc } from "firebase/firestore";

interface SupportChatWidgetProps {
  userProfile: UserProfile | null;
}

export default function SupportChatWidget({ userProfile }: SupportChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [chatId, setChatId] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "joining" | "chatting">("idle");
  const [messages, setMessages] = useState<SupportChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [aiTyping, setAiTyping] = useState(false);
  const [errorText, setErrorText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync / Autofill details from logged-in student profile
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name);
      setEmail(userProfile.email);
    }
  }, [userProfile]);

  // Check LocalStorage for persistent active chat session coordinates
  useEffect(() => {
    const savedSession = localStorage.getItem("tutorhive_chat_session");
    if (savedSession) {
      try {
        const parsed = JSON.parse(savedSession);
        if (parsed.chatId) {
          // Verify chat exists in Firestore to avoid permission or missing document errors
          getDoc(doc(db, "support_chats", parsed.chatId))
            .then((docSnap) => {
              if (docSnap.exists()) {
                setChatId(parsed.chatId);
                setName(parsed.name || "Guest");
                setEmail(parsed.email || "");
                setStatus("chatting");
              } else {
                // Stale or deleted session, remove from localStorage
                localStorage.removeItem("tutorhive_chat_session");
                setChatId("");
                setStatus("idle");
              }
            })
            .catch(() => {
              localStorage.removeItem("tutorhive_chat_session");
              setChatId("");
              setStatus("idle");
            });
        }
      } catch (err) {
        console.error("Stale session corrupt", err);
        localStorage.removeItem("tutorhive_chat_session");
      }
    }
  }, []);

  // Set up Firebase Real-Time snapshot syncing for student active dialogue message strings
  useEffect(() => {
    if (!chatId || status !== "chatting") return;

    const messagesRef = collection(db, "support_chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: SupportChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        // Skip messages that have no valid createdAt timestamp during local pending writes
        loadedMessages.push({
          messageId: docSnap.id,
          sender: data.sender,
          senderName: data.senderName,
          text: data.text,
          createdAt: data.createdAt ? (data.createdAt.seconds * 1000) : Date.now(),
        });
      });
      setMessages(loadedMessages);
      
      // Auto-scrolling to the latest dialogue turn
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }, (error) => {
      console.warn("Live support snapshot subscription ended or invalid:", error.message || error);
      // If permissions or document access fails, gracefully clear stale session rather than unhandled exception
      localStorage.removeItem("tutorhive_chat_session");
      setStatus("idle");
      setChatId("");
    });

    return () => unsubscribe();
  }, [chatId, status]);

  // Triggering scroll whenever active messaging logs update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, aiTyping]);

  async function handleStartChat(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setErrorText("Please provide your name and email.");
      return;
    }

    setStatus("joining");
    setErrorText("");

    try {
      const activeChatId = userProfile ? userProfile.uid : "chat_" + Math.random().toString(36).substring(2, 11);
      
      const chatSession = {
        chatId: activeChatId,
        userId: userProfile ? userProfile.uid : "guest",
        userName: name.trim(),
        email: email.trim(),
        status: "active" as const,
        updatedAt: serverTimestamp(),
      };

      // Set/instantiate support chat document
      await setDoc(doc(db, "support_chats", activeChatId), chatSession);

      // Welcome message from artificial assistant
      const welcomeMsgId = "wel_" + Date.now();
      await setDoc(doc(db, "support_chats", activeChatId, "messages", welcomeMsgId), {
        messageId: welcomeMsgId,
        sender: "assistant",
        senderName: "TutorBee Support Assistant",
        text: `Hello ${name.trim()}! Welcome to TutorHive live support. 🌟 How can we help you coordinate your WAEC/JAMB mocks, project downloads, or 1-on-1 tutoring syllabus options today?`,
        createdAt: serverTimestamp(),
      });

      // Save credentials context locally
      localStorage.setItem("tutorhive_chat_session", JSON.stringify({
        chatId: activeChatId,
        name: name.trim(),
        email: email.trim()
      }));

      setChatId(activeChatId);
      setStatus("chatting");
    } catch (err) {
      console.error("Failed to establish support coordinates:", err);
      setErrorText("Could not initiate support line. Verify connection.");
      setStatus("idle");
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    const text = inputText.trim();
    if (!text || !chatId) return;

    setInputText("");

    try {
      const msgId = "msg_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      const messageDoc = {
        messageId: msgId,
        sender: "user" as const,
        senderName: name,
        text,
        createdAt: serverTimestamp()
      };

      // 1. Post message doc to the Firestore collection
      await setDoc(doc(db, "support_chats", chatId, "messages", msgId), messageDoc);
      
      // 2. Touch the parent document for order sorting
      await updateDoc(doc(db, "support_chats", chatId), {
        updatedAt: serverTimestamp()
      });

      // 3. Connect AI auto-reply support assistant
      setAiTyping(true);

      // Compile conversation history for contextual AI replies (last 10 turns)
      const userHistory = messages.slice(-10).map(m => ({
        role: m.sender === "user" ? "user" : "model",
        text: m.text
      }));

      // Fire asynchronous call to Gemini Proxy endpoint
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `The user ${name} is chatting in the Live Support channel. Here is their ticket query: "${text}". Please play the role of TutorBee Academic Support. Help them answer queries about pricing (Basic ₦10k/m, Standard ₦25k/m, Premium ₦50k/m... and Research Project entry is ₦5k), WAEC/JAMB exam mocks, digital library textbooks downloads, or contacting us at tutorhiveng@gmail.com / 08070691713. Answer politely, keep the response under 3 sentences for short support dialogs.`,
          history: userHistory
        })
      });

      if (response.ok) {
        const data = await response.json();
        const aiResponseText = data.text || "I have noted down your request. A live advisor will review this shortly.";
        
        // Write the tutor's simulated reply directly to our real-time board
        const aiMsgId = "ai_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
        await setDoc(doc(db, "support_chats", chatId, "messages", aiMsgId), {
          messageId: aiMsgId,
          sender: "assistant" as const,
          senderName: "TutorBee Advisor",
          text: aiResponseText,
          createdAt: serverTimestamp()
        });
      }
    } catch (err) {
      console.error("Failed to route customer service dialogue:", err);
    } finally {
      setAiTyping(false);
    }
  }

  function handleEndSession() {
    if (window.confirm("Are you sure you want to end this active live support session? Your history will be preserved.")) {
      localStorage.removeItem("tutorhive_chat_session");
      setChatId("");
      setMessages([]);
      setStatus("idle");
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 font-sans text-left">
      {/* 🔴 Trigger Floating bubble */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 bg-black hover:bg-[#D4AF37] hover:text-black text-white hover:scale-105 active:scale-95 transition-all p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-2xl border-2 border-black font-mono font-black text-xs uppercase tracking-widest cursor-pointer group shadow-[#D4AF37]/5 shrink-0"
        >
          <MessageCircle className="w-5 h-5 text-[#D4AF37] group-hover:text-black mt-[-1px] shrink-0 fill-[#D4AF37]/20" />
          <span className="hidden sm:inline">Ask TutorBee</span>
        </button>
      )}

      {/* 🏛️ Expanded Support Messenger board */}
      {isOpen && (
        <div className="bg-[#FAF9F6] border-2 border-black w-[350px] sm:w-[380px] h-[520px] shadow-2xl flex flex-col justify-between animate-fade-in text-black">
          
          {/* Header */}
          <div className="bg-black text-[#D4AF37] px-4.5 py-4 border-b border-black flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <div>
                <h4 className="text-xs font-mono font-black uppercase tracking-widest text-[#D4AF37]">TutorBee Support</h4>
                <p className="text-[9px] text-gray-450 uppercase font-bold tracking-wider">Live Support Desk</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Core Body switcher */}
          <div className="flex-grow flex flex-col justify-between overflow-hidden">
            
            {/* Tab 1: Configuration Gate selection */}
            {status === "idle" && (
              <div className="p-6 overflow-y-auto flex-grow flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5 text-center">
                    <span className="text-[8px] uppercase tracking-[0.25em] text-[#D4AF37] font-mono font-bold block">Academic Dialogues</span>
                    <h3 className="text-base font-serif font-black text-black">Let's Connect</h3>
                    <p className="text-xxs text-neutral-500 uppercase tracking-wider leading-relaxed font-semibold">Instant remote assistance coordinates</p>
                  </div>

                  {/* 🟢 WhatsApp direct route action */}
                  <a
                    href="https://wa.me/2348070691713?text=Hello%20TutorHive%20Support!%20I%20have%20questions%20about%20my%20learning%20path."
                    target="_blank"
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3.5 bg-emerald-50 hover:bg-emerald-100/70 border border-emerald-500 transition-all text-xs font-mono rounded-none font-bold text-emerald-950 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">💬</span>
                      <div className="text-left">
                        <span className="block uppercase text-[10px] tracking-wider text-emerald-800">Support Hotline Channel</span>
                        <span className="block text-[11px] font-sans font-medium text-emerald-900 mt-0.5">Chat instantly on WhatsApp</span>
                      </div>
                    </div>
                    <span className="text-emerald-700 bg-white border border-emerald-500 text-[10px] px-2 py-0.5 rounded-none font-bold shrink-0 uppercase tracking-widest group-hover:bg-emerald-500 group-hover:text-white transition-colors">08070691713</span>
                  </a>

                  <div className="relative text-center my-3">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/10"></div></div>
                    <span className="relative bg-[#FAF9F6] px-3.5 text-[9px] uppercase font-mono text-neutral-400 font-bold">Or live support system</span>
                  </div>

                  <form onSubmit={handleStartChat} className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[8px] font-mono uppercase tracking-wider font-bold mb-1 text-neutral-600">Enter Your Name</label>
                      <input
                        type="text"
                        required
                        placeholder="Hauwa Usman"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-white border border-black p-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded-none uppercase tracking-wider font-semibold placeholder:text-gray-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[8px] font-mono uppercase tracking-wider font-bold mb-1 text-neutral-600">Your Email Address</label>
                      <input
                        type="email"
                        required
                        placeholder="hauwa@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white border border-black p-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded-none uppercase tracking-wider font-semibold placeholder:text-gray-300"
                      />
                    </div>

                    {errorText && (
                      <div className="p-2.5 bg-rose-50 border border-rose-500 text-rose-800 text-[10px] font-mono rounded-none flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>{errorText}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full py-3 bg-black text-white hover:bg-[#D4AF37] hover:text-black font-mono font-bold text-xxs uppercase tracking-widest transition-all rounded-none cursor-pointer border border-black"
                    >
                      Begin Live Chat
                    </button>
                  </form>
                </div>
                
                <p className="text-[10px] font-serif text-neutral-400 line-clamp-2 italic text-center">
                  "Our prompt support platform maps queries directly with WAEC examiners and local STEM advisors."
                </p>
              </div>
            )}

            {status === "joining" && (
              <div className="flex-grow flex flex-col items-center justify-center space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37]" />
                <span className="text-[10px] font-mono font-black uppercase tracking-widest text-[#D4AF37]">Initializing Secure Wire...</span>
              </div>
            )}

            {/* Tab 2: Message log space */}
            {status === "chatting" && (
              <div className="flex-grow flex flex-col justify-between overflow-hidden">
                {/* Chat items list */}
                <div className="flex-grow overflow-y-auto p-4.5 space-y-3.5 bg-[#FAF9F6]">
                  {messages.map((m) => {
                    const isSelf = m.sender === "user";
                    return (
                      <div
                        key={m.messageId}
                        className={`flex flex-col max-w-[85%] ${isSelf ? "ml-auto items-end" : "mr-auto items-start"}`}
                      >
                        <span className="text-[8px] font-mono font-bold uppercase tracking-wide text-neutral-400 mb-1">
                          {m.senderName} &bull; {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <div
                          className={`p-3.5 text-[11px] leading-relaxed select-text ${
                            isSelf
                              ? "bg-black text-white border border-black rounded-none"
                              : "bg-white text-black border border-black rounded-none shadow-sm"
                          }`}
                        >
                          {m.text}
                        </div>
                      </div>
                    );
                  })}

                  {/* AI Tutor thinking effect */}
                  {aiTyping && (
                    <div className="mr-auto items-start max-w-[85%] flex flex-col">
                      <span className="text-[8px] font-mono font-bold uppercase tracking-wide text-amber-600 mb-1 animate-pulse">
                        TutorBee typing...
                      </span>
                      <div className="p-3 bg-white text-neutral-500 border border-amber-400 border-dashed rounded-none text-xxs font-mono flex items-center gap-1.5">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500 shrink-0" />
                        <span>Formulating analytical reply...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Footer inputs */}
                <div className="p-3 bg-white border-t border-black">
                  <form onSubmit={handleSendMessage} className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type your message for review..."
                      className="flex-grow bg-[#FAF9F6] border border-black p-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded-none uppercase tracking-wider font-semibold placeholder:text-gray-300"
                    />
                    <button
                      type="submit"
                      disabled={!inputText.trim()}
                      className="bg-black hover:bg-[#D4AF37] text-white hover:text-black p-2.5 border border-black rounded-none disabled:opacity-30 cursor-pointer transition-colors"
                    >
                      <Send className="w-4 h-4 shrink-0" />
                    </button>
                  </form>
                  <div className="flex justify-between items-center px-1 pt-1.5">
                    <span className="text-[8px] font-mono text-emerald-600 font-bold uppercase tracking-wider">● System Connected</span>
                    <button
                      onClick={handleEndSession}
                      className="text-[9px] font-mono text-rose-600 hover:text-rose-800 font-bold uppercase tracking-widest cursor-pointer hover:underline"
                    >
                      End session
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>
      )}
    </div>
  );
}
