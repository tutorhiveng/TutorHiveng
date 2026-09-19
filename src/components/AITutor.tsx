import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, UserProfile } from "../types";
import { Send, Sparkles, HelpCircle, GraduationCap, ChevronRight, MessageSquare } from "lucide-react";

interface AITutorProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
}

export default function AITutor({ userProfile, onOpenAuth }: AITutorProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      role: "model",
      text: "Hello! I am **TutorBee**, your **TutorHive AI advisor**. \n\nI can assist you with your class homework, solve Mathematics problems step-by-step, clarify Organic Chemistry formulations, draft study notes, or design research project abstracts. \n\nWhat topic are you studying today?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Suggestions panel for fast student exploration
  const SUGGESTED_PROMPTS = [
    { title: "Calculus Helper", prompt: "Explain how to differentiate f(x) = 3x^2 + 5x Using first principles step-by-step." },
    { title: "Chemistry Solver", prompt: "Solve this chemical equation: Al + Fe2O3 -> Al2O3 + Fe, balancing it molecularly and explaining the steps." },
    { title: "JAMB Math Mock", prompt: "Provide 3 JAMB-style Algebra questions with worked explanations." },
    { title: "Geology Thesis", prompt: "Draft a brief Chapter One Introduction template for a Geochemical exploration geological study." },
  ];

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendMessage(promptText: string) {
    if (!promptText.trim()) return;
    if (!userProfile) {
      onOpenAuth();
      return;
    }

    const userMessage: ChatMessage = {
      id: "usr-" + Date.now(),
      role: "user",
      text: promptText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputVal("");
    setLoading(true);

    try {
      // Map existing messages into stateless conversation coordinates
      const history = messages
        .filter((msg) => msg.id !== "init")
        .map((msg) => ({
          role: msg.role,
          text: msg.text,
        }));

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: promptText, history }),
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const modelMessage: ChatMessage = {
        id: "model-" + Date.now(),
        role: "model",
        text: data.text || "I apologize, I lost coordinates. Please try asking again.",
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          role: "model",
          text: `⚠️ **Session Connection Issue**: ${err.message || "Failed to reach the AI response channels."}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-[#FAF9F6] text-black min-h-[calc(100vh-64px)] py-8 px-6 flex flex-col justify-between">
      <div className="max-w-7xl mx-auto w-full space-y-6 flex-grow flex flex-col">
        {/* 🏛️ Academic Dialogue masthead */}
        <div className="border-t border-b border-black py-4 text-center max-w-7xl mx-auto w-full space-y-2">
          <span className="text-[9px] uppercase tracking-[0.3em] font-mono text-[#D4AF37] font-bold block">Chamber of Symbolic & Quantitative Computation</span>
          <h1 className="text-3xl sm:text-4xl font-serif text-black uppercase tracking-tight">The TutorBee <span className="font-serif italic font-light">Discussions</span></h1>
          <p className="text-neutral-500 text-[11px] leading-relaxed max-w-2xl mx-auto italic font-serif">
            "A persistent, step-by-step dialectic companion aligned with WAEC, JAMB UTME, and advanced tertiary STEM formulations."
          </p>
        </div>

        <div className="w-full flex-grow flex flex-col lg:grid lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Quick Suggestions / Help */}
        <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
          <div className="bg-white border border-black rounded-none p-5 space-y-4">
            <div className="flex items-center gap-2 text-black">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest">AI Tutor Suggestions</h3>
            </div>
            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider leading-relaxed">
              Click any option below to instantly trigger our mathematical computations or science descriptions.
            </p>

            <div className="space-y-2.5 pt-3">
              {SUGGESTED_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(prompt.prompt)}
                  disabled={loading}
                  className="w-full text-left p-3.5 bg-[#FAF9F6] hover:bg-black hover:text-[#D4AF37] border border-black rounded-none text-xs transition-colors flex items-center justify-between cursor-pointer group"
                >
                  <div className="truncate pr-2">
                    <span className="font-serif font-black text-black group-hover:text-[#D4AF37] transition-all block">
                      {prompt.title}
                    </span>
                    <span className="block text-[10px] text-gray-400 group-hover:text-gray-300 truncate mt-1">
                      {prompt.prompt}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border-l-4 border-l-[#D4AF37] border-y border-r border-black p-5 rounded-none text-xs text-gray-800 space-y-2 leading-relaxed">
            <span className="font-bold text-black uppercase tracking-wider block font-mono text-[10px]">Nigerian Syllabus Aligned</span>
            TutorBee, your TutorHive AI advisor, utilizes deep learning parameters matching WAEC practicals, JAMB UTME blueprints, and standard federal Nigerian tertiary materials.
          </div>
        </div>

        {/* Right Column: Chat workspace */}
        <div className="lg:col-span-8 bg-white border border-black rounded-none p-5 flex flex-col justify-between min-h-[460px] lg:min-h-0">
          
          {/* Chat dialogue display */}
          <div className="flex-grow overflow-y-auto space-y-4 pr-1 max-h-[500px]">
            {messages.map((msg) => {
              const isAI = msg.role === "model";
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 text-left ${isAI ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-none px-4 py-3.5 text-xs leading-relaxed whitespace-pre-wrap border ${
                      isAI
                        ? "bg-[#FAF9F6] border-black text-gray-850 font-serif"
                        : "bg-black border-black text-white font-sans"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 border-b border-black/10 pb-1 mb-2 text-[8px] font-mono tracking-widest uppercase">
                      {isAI ? (
                        <span className="flex items-center gap-1 text-[#D4AF37] font-bold">
                          <GraduationCap className="w-3.5 h-3.5" /> TUTORBEE AI ADVISOR
                        </span>
                      ) : (
                        <span className="text-gray-400">STUDENT PROFILE CHANNEL</span>
                      )}
                    </div>
                    {msg.text}
                  </div>
                </div>
              );
            })}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="bg-[#FAF9F6] border border-black/30 rounded-none px-4 py-3.5 text-[10px] font-mono uppercase tracking-wider text-[#D4AF37] animate-pulse flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  TutorBee AI Advisor is computing step-by-step instructions...
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* User input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputVal);
            }}
            className="pt-4 border-t border-black flex gap-2"
          >
            <input
              type="text"
              placeholder={userProfile ? "Ask step-by-step equations, assignments guidance, or draft abstracts..." : "Please Sign In to lock into 24/7 TutorBee Workspace"}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              disabled={loading || !userProfile}
              className="flex-grow bg-white border border-black rounded-none py-3 px-4 text-xs focus:ring-1 focus:ring-[#D4AF37] focus:outline-none transition-colors text-black placeholder:text-gray-300"
            />
            <button
              type="submit"
              disabled={loading || !userProfile || !inputVal.trim()}
              className="bg-black hover:bg-[#D4AF37] text-white hover:text-black py-3 px-6 rounded-none font-bold uppercase tracking-widest text-[10px] flex items-center justify-center transition-colors border border-black cursor-pointer shadow-none"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>
    </div>
    </div>
  );
}
