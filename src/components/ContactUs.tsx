import React, { useState } from "react";
import { Mail, Phone, MapPin, CheckCircle2, MessageSquare, AlertCircle, Loader2 } from "lucide-react";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { submitContactMessageToSupabase } from "../supabase";

export default function ContactUs() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorText, setErrorText] = useState("");

  async function handleSubmitMessage(e: React.FormEvent) {
    e.preventDefault();
    
    // Strict validations
    if (!name.trim() || !email.trim() || !subject.trim() || !message.trim()) {
      setStatus("error");
      setErrorText("Please fill out all required fields.");
      return;
    }

    setStatus("loading");
    setErrorText("");

    try {
      const id = "msg_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      const messageDoc = {
        id,
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        created_at: serverTimestamp(),
        status: "unread" as const
      };

      // Write to Supabase contact_messages table
      await submitContactMessageToSupabase({
        id,
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
        createdAt: new Date().toISOString(),
      });

      // Dual-sync to Firestore if accessible
      try {
        await setDoc(doc(db, "contact_messages", id), messageDoc);
      } catch {
        // ignore
      }
      
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error("Failed to append contact record to database:", err);
      setStatus("error");
      setErrorText("A network disruption occurred. Please try again or reach out directly via WhatsApp/Email.");
      try {
        handleFirestoreError(err, OperationType.CREATE, "contact_messages");
      } catch (e) {
        // logged
      }
    }
  }

  // Social channels list under @tutorhiveng
  const socialChannels = [
    { name: "Twitter", url: "https://twitter.com/tutorhiveng", handle: "@tutorhiveng" },
    { name: "Facebook", url: "https://facebook.com/tutorhiveng", handle: "@tutorhiveng" },
    { name: "LinkedIn", url: "https://linkedin.com/company/tutorhiveng", handle: "@tutorhiveng" },
    { name: "TikTok", url: "https://tiktok.com/@tutorhiveng", handle: "@tutorhiveng" },
    { name: "Instagram", url: "https://instagram.com/tutorhiveng", handle: "@tutorhiveng" },
    { name: "Telegram", url: "https://t.me/tutorhiveng", handle: "@tutorhiveng" },
    { name: "Linktree", url: "https://linktr.ee/tutorhiveng", handle: "tutorhiveng" }
  ];

  return (
    <div className="bg-[#FAF9F6] text-black min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* 📚 Support and Admissions Correspondence Masthead */}
        <div className="border-t border-b border-black py-4 text-center max-w-7xl mx-auto w-full space-y-2 mb-8 animate-fade-in">
          <span className="text-[9px] uppercase tracking-[0.3em] font-mono text-[#D4AF37] font-bold block">Admissions & Support Communications Channels</span>
          <h1 className="text-3xl sm:text-4xl font-serif text-black uppercase tracking-tight">Support & <span className="font-serif italic font-light">Inquiries</span></h1>
          <p className="text-neutral-500 text-[11px] leading-relaxed max-w-2xl mx-auto italic font-serif">
            "Submit academic service inquiries, schedule 1-on-1 tutorial consultancies, or request administrative help on project downloads."
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 max-w-5xl mx-auto items-stretch">
          
          {/* Left: Contact Coordinates cards */}
          <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
            <div className="bg-white border border-black p-6 rounded-none space-y-6 text-left">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#D4AF37]">Official Coordinates</h3>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-xs border-b border-black/5 pb-4">
                  <MapPin className="w-5 h-5 text-black shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-serif font-bold text-black text-sm">Office Address</h4>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-700 px-1.5 py-0.5 rounded-none mt-1 inline-block">Online Only</span>
                    <p className="text-[11px] text-gray-500 mt-2 leading-relaxed font-sans font-medium">
                      TutorHive operates <span className="font-bold text-black pb-0.5 border-b border-black/20">fully online and remotely</span> to deliver high-quality academic and scientific assistance.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs border-b border-black/5 pb-4">
                  <Mail className="w-5 h-5 text-black shrink-0 mt-1" />
                  <div>
                    <h4 className="font-serif font-bold text-black text-sm">Official Support Email</h4>
                    <p className="text-[11px] text-gray-500 mt-1 font-mono hover:text-[#D4AF37]"><a href="mailto:tutorhiveng@gmail.com">tutorhiveng@gmail.com</a></p>
                  </div>
                </div>

                <div className="flex items-start gap-3 text-xs">
                  <Phone className="w-5 h-5 text-black shrink-0 mt-1" />
                  <div>
                    <h4 className="font-serif font-bold text-black text-sm">Hotline Contact Channel</h4>
                    <p className="text-[11px] text-gray-500 mt-1 font-mono text-xs font-bold">+234 (0) 807 069 1713</p>
                  </div>
                </div>
              </div>

              {/* Explicit Virtual Platform Warning Notice */}
              <div className="bg-[#FAF9F6] border border-black/10 p-4.5 rounded-none space-y-2">
                <span className="text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest">Platform Statement</span>
                <p className="text-[11px] text-neutral-700 italic font-serif leading-relaxed">
                  “TutorHive is a fully online academic platform. All services are delivered digitally and remotely. There is no physical office location at this time.”
                </p>
              </div>
            </div>

            {/* Social Coordinates Section */}
            <div className="bg-white border border-black p-6 rounded-none space-y-4 text-left">
              <h3 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#D4AF37]">Digital Dispatch Handles</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {socialChannels.map((soc) => (
                  <a 
                    key={soc.name} 
                    href={soc.url} 
                    target="_blank" 
                    referrerPolicy="no-referrer"
                    rel="noopener noreferrer" 
                    className="flex flex-col border border-black/5 p-2 bg-[#FAF9F6] hover:border-[#D4AF37] transition-all"
                  >
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-black">{soc.name}</span>
                    <span className="text-[10px] font-serif italic text-gray-500">{soc.handle}</span>
                  </a>
                ))}
              </div>
            </div>

            <div className="p-5 bg-white border-l-4 border-l-[#D4AF37] border-y border-r border-black rounded-none text-xs text-gray-800 leading-relaxed text-left font-sans flex flex-col gap-2">
              <span className="font-bold text-black uppercase tracking-wider block font-mono text-[10px]">Response Time SLA</span>
              <p className="text-[11px] leading-relaxed">
                Email consultations and support tickets submitted through this portal are filed securely inside our student database. An academic advisor will reply within 24 to 48 hours.
              </p>
            </div>
          </div>

          {/* Right: Interactive Support submission sheet */}
          <div className="lg:col-span-7 bg-white border border-black p-6 rounded-none text-left">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#D4AF37] mb-4">Submit Academic Inquiry</h3>
            
            <form onSubmit={handleSubmitMessage} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-black text-[10px] uppercase tracking-wider font-bold mb-1 font-mono">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Hauwa Usman"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={status === "loading"}
                    className="w-full bg-white border border-black p-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded-none uppercase tracking-wider font-semibold placeholder:text-gray-300 disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-black text-[10px] uppercase tracking-wider font-bold mb-1 font-mono">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="you@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "loading"}
                    className="w-full bg-white border border-black p-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded-none uppercase tracking-wider font-semibold placeholder:text-gray-300 disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-black text-[10px] uppercase tracking-wider font-bold mb-1 font-mono">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Inquiry regarding JAMB Physics preparation"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={status === "loading"}
                  className="w-full bg-white border border-black p-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded-none uppercase tracking-wider font-semibold placeholder:text-gray-300 disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-black text-[10px] uppercase tracking-wider font-bold mb-1 font-mono">Your Message</label>
                <textarea
                  rows={6}
                  required
                  placeholder="State your dynamic questions or details about your academic support needs..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={status === "loading"}
                  className="w-full bg-white border border-black p-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded-none uppercase tracking-wider font-semibold placeholder:text-gray-300 disabled:opacity-50 resize-none"
                ></textarea>
              </div>

              {status === "error" && (
                <div className="p-3.5 bg-rose-50 border border-rose-500 text-rose-800 text-xs rounded-none flex items-center gap-2 font-mono">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorText}</span>
                </div>
              )}

              {status === "success" && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-500 text-emerald-800 text-xs rounded-none flex items-start gap-2 font-mono">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    “Thank you for contacting TutorHive. We will respond within 24–48 hours.”
                  </span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="py-3 px-6 bg-black text-white hover:bg-[#D4AF37] hover:text-black font-bold text-xs uppercase tracking-widest transition-all rounded-none cursor-pointer border border-black inline-flex items-center gap-2 disabled:opacity-50"
              >
                {status === "loading" && <Loader2 className="w-4 h-4 animate-spin text-white shrink-0" />}
                Submit Message
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
