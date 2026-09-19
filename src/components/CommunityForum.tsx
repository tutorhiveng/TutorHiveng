import React, { useState, useEffect } from "react";
import { MessageSquare, ArrowUp, ThumbsUp, Sparkles, User, Tag, Send, AlertCircle } from "lucide-react";
import { UserProfile } from "../types";

interface ForumThread {
  id: string;
  title: string;
  content: string;
  category: string;
  author: string;
  authorRole: string;
  upvotes: number;
  commentsCount: number;
  comments: ForumComment[];
  createdAt: string;
}

interface ForumComment {
  id: string;
  author: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

interface CommunityForumProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
}

const CATEGORIES = ["All Topics", "WAEC & JAMB Hacks", "Mathematics Proofs", "SPSS & Data Analysis", "Chemistry & Lab Practicals", "Admissions", "Mentorship"];

const SEED_THREADS: ForumThread[] = [
  {
    id: "thread-1",
    title: "How to resolve Section B Circle Theorem questions in WAEC General Maths? Let's compile proofs!",
    content: "Theorem 1 (angle at center is twice angle at circumference) is tested in almost every WAEC section B paper. I have compiled the essential geometric constructions needed. Post any questions you find tricky below!",
    category: "Mathematics Proofs",
    author: "Hauwa Usman Kandarawa",
    authorRole: "Supervisor",
    upvotes: 24,
    commentsCount: 3,
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    comments: [
      {
        id: "c-1",
        author: "Chinedu Okafor",
        authorRole: "Student",
        content: "Thank you Dr. Hauwa! Does this also apply to alternate segment theorem? In 2023 we had a question centered on tangents.",
        createdAt: new Date(Date.now() - 3.5 * 3600 * 1000).toISOString()
      },
      {
        id: "c-2",
        author: "Hauwa Usman Kandarawa",
        authorRole: "Supervisor",
        content: "Yes, Chinedu! The alternate segment theorem is directly derived from standard tangent rules. I will post a detailed step-by-step diagram outline in the WAEC channel soon.",
        createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      },
      {
        id: "c-3",
        author: "Balogun Segun",
        authorRole: "Student",
        content: "Following this closely. Circle theorems were the only reason I missed an A1 last year, re-taking WAEC for a clean slate.",
        createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    id: "thread-2",
    title: "Selecting variables in SPSS for Linear Regression: Common Pitfalls in Dissertation Writing",
    content: "When testing hypotheses with SPSS, many students get confused about the differences between independent control metrics and dummy variables. If your variables are categorical, make sure you code them properly before writing a regression model.",
    category: "SPSS & Data Analysis",
    author: "Prof. Joshua Babatunde",
    authorRole: "Admin",
    upvotes: 18,
    commentsCount: 1,
    createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    comments: [
      {
        id: "c-4",
        author: "Aminu Katsina",
        authorRole: "Student",
        content: "Is there an automated SPSS macro recommended for checking multicollinearity (VIF values)? My supervisor insisted on it.",
        createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString()
      }
    ]
  },
  {
    id: "thread-3",
    title: "Chevening Scholarship SOP Draft Feedback Channel",
    content: "I am preparing my Statement of Purpose draft for the upcoming Chevening application window. I want to study Advanced Computational Chemical Engineering. Is anyone available to critique my academic leadership essay?",
    category: "Mentorship",
    author: "Fatima Aliyu",
    authorRole: "Student",
    upvotes: 12,
    commentsCount: 0,
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    comments: []
  }
];

export default function CommunityForum({ userProfile, onOpenAuth }: CommunityForumProps) {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All Topics");
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("WAEC & JAMB Hacks");
  
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("tutorhive_forum_threads");
    if (stored) {
      try {
        setThreads(JSON.parse(stored));
      } catch (e) {
        setThreads(SEED_THREADS);
      }
    } else {
      setThreads(SEED_THREADS);
      localStorage.setItem("tutorhive_forum_threads", JSON.stringify(SEED_THREADS));
    }
  }, []);

  const saveThreads = (updated: ForumThread[]) => {
    setThreads(updated);
    localStorage.setItem("tutorhive_forum_threads", JSON.stringify(updated));
  };

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile) {
      onOpenAuth();
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) return;

    const newThread: ForumThread = {
      id: "thread-" + Date.now(),
      title: newTitle.trim(),
      content: newContent.trim(),
      category: newCategory,
      author: userProfile.name,
      authorRole: userProfile.role === "admin" ? "Admin" : "Student",
      upvotes: 1,
      commentsCount: 0,
      comments: [],
      createdAt: new Date().toISOString()
    };

    const updated = [newThread, ...threads];
    saveThreads(updated);
    setNewTitle("");
    setNewContent("");
    setNotification("Discussion thread broadcasted to TutorHive Community!");
    setTimeout(() => setNotification(null), 4000);
  };

  const handleUpvote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = threads.map((th) => {
      if (th.id === id) {
        return { ...th, upvotes: th.upvotes + 1 };
      }
      return th;
    });
    saveThreads(updated);
  };

  const handleAddComment = (e: React.FormEvent, threadId: string) => {
    e.preventDefault();
    if (!userProfile) {
      onOpenAuth();
      return;
    }
    if (!newCommentText.trim()) return;

    const newComment: ForumComment = {
      id: "comment-" + Date.now(),
      author: userProfile.name,
      authorRole: userProfile.role === "admin" ? "Admin" : "Student",
      content: newCommentText.trim(),
      createdAt: new Date().toISOString()
    };

    const updated = threads.map((th) => {
      if (th.id === threadId) {
        return {
          ...th,
          comments: [...th.comments, newComment],
          commentsCount: th.commentsCount + 1
        };
      }
      return th;
    });

    saveThreads(updated);
    setNewCommentText("");
  };

  const filteredThreads = threads.filter((th) => {
    if (selectedCategory === "All Topics") return true;
    return th.category === selectedCategory;
  });

  const activeThread = threads.find((th) => th.id === activeThreadId);

  return (
    <div className="bg-[#FAF9F6] text-black min-h-screen py-10 px-6">
      <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
        
        {/* Academic Broad-Sheet / Letter Masthead */}
        <div className="border-t border-b border-black py-4 text-center max-w-6xl mx-auto w-full space-y-2">
          <span className="text-[9px] uppercase tracking-[0.3em] font-mono text-[#D4AF37] font-bold block">Academic Dispatches & Correspondence</span>
          <h1 className="text-3xl sm:text-4xl font-serif text-black uppercase tracking-tight">The Scholarly <span className="font-serif italic font-light">Letters</span></h1>
          <p className="text-neutral-500 text-[11px] leading-relaxed max-w-2xl mx-auto italic font-serif">
            "Engage with regional subject experts, WAEC/JAMB exam consultants, and research peers on active STEM formulations."
          </p>
        </div>

        {/* Categories Bar */}
        <div className="flex overflow-x-auto gap-1 bg-white border border-black p-1 max-w-full rounded-none scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setActiveThreadId(null);
              }}
              className={`flex-shrink-0 px-4 py-2 text-[10px] tracking-widest uppercase transition-all rounded-none font-bold select-none cursor-pointer ${
                selectedCategory === cat
                  ? "bg-black text-[#D4AF37] font-black border border-black"
                  : "text-gray-400 hover:text-black hover:bg-neutral-50"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {notification && (
          <div className="bg-emerald-50 border border-emerald-500 text-emerald-800 text-xxs font-mono uppercase tracking-widest p-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#D4AF37] animate-pulse" />
            <span>{notification}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main discussions feed */}
          <div className="lg:col-span-8 space-y-4 text-left">
            {activeThread ? (
              // Individual Thread Detail View
              <div className="bg-white border border-black p-6 space-y-6">
                <button
                  onClick={() => setActiveThreadId(null)}
                  className="text-gray-400 hover:text-black font-semibold text-xxs font-mono tracking-widest uppercase p-1.5 border border-neutral-200"
                >
                  &larr; Back to Feed
                </button>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] tracking-widest font-bold text-[#D4AF37] uppercase bg-black/5 px-2 py-0.5">
                      {activeThread.category}
                    </span>
                    <span className="font-mono text-gray-400 text-[10px]">
                      Posted by {activeThread.author} ({activeThread.authorRole})
                    </span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-serif font-black text-black leading-snug">
                    {activeThread.title}
                  </h2>
                  <p className="text-gray-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {activeThread.content}
                  </p>
                </div>

                {/* Thread Upvote */}
                <div className="flex items-center gap-4 border-y border-black/5 py-3">
                  <button
                    onClick={(e) => handleUpvote(activeThread.id, e)}
                    className="flex items-center gap-2 px-3 py-1.5 border border-black text-xs font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4 text-[#D4AF37]" />
                    <span>{activeThread.upvotes} Upvotes</span>
                  </button>
                  <span className="text-xxs font-mono text-gray-400 uppercase">
                    {activeThread.commentsCount} Peer Responses
                  </span>
                </div>

                {/* Comments Section */}
                <div className="space-y-4">
                  <h3 className="text-xxs font-mono font-bold uppercase tracking-widest text-black">
                    Discussion Responses
                  </h3>
                  
                  <div className="space-y-3.5 pt-1">
                    {activeThread.comments.map((comment) => (
                      <div key={comment.id} className="p-4 bg-[#FAF9F6] border border-black/10 rounded-none text-left">
                        <div className="flex justify-between items-center text-xxs font-mono text-gray-400">
                          <span className="font-bold text-black uppercase tracking-wider flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                            {comment.author} ({comment.authorRole})
                          </span>
                          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-gray-700 mt-2 font-serif leading-relaxed">
                          {comment.content}
                        </p>
                      </div>
                    ))}
                    {activeThread.comments.length === 0 && (
                      <p className="text-gray-400 italic font-mono text-xxs uppercase tracking-widest py-4">
                        No peers have replied to this topic yet. Be the first to coordinate answer structures!
                      </p>
                    )}
                  </div>

                  {/* Add comment Form */}
                  <form onSubmit={(e) => handleAddComment(e, activeThread.id)} className="pt-4 border-t border-black/5">
                    <div className="space-y-2">
                      <label className="block text-xxs font-bold uppercase tracking-widest text-gray-500 font-mono">
                        Write a Step-by-Step Response
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder={userProfile ? "Share your insight or ask follow-up questions..." : "Please Sign In to participate in discussions"}
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          disabled={!userProfile}
                          className="flex-grow bg-white border border-black p-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded-none font-semibold placeholder:text-gray-300 disabled:bg-neutral-50"
                          required
                        />
                        <button
                          type="submit"
                          disabled={!userProfile}
                          className="px-5 bg-black hover:bg-[#D4AF37] text-white hover:text-black font-bold text-xs uppercase tracking-widest cursor-pointer transition-all border border-black rounded-none flex items-center justify-center disabled:bg-neutral-300 disabled:border-neutral-300 disabled:text-neutral-500"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            ) : (
              // Thread Feed list
              <div className="space-y-4">
                {filteredThreads.map((thread) => (
                  <div
                    key={thread.id}
                    onClick={() => setActiveThreadId(thread.id)}
                    className="bg-white border border-black p-5 rounded-none hover:shadow transition-all group cursor-pointer text-left flex flex-col justify-between min-h-[160px]"
                  >
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-mono text-[9px] tracking-widest font-bold text-[#D4AF37] uppercase bg-black/5 px-2 py-0.5">
                          {thread.category}
                        </span>
                        <span className="font-mono text-gray-400 text-[9px]">
                          {new Date(thread.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base font-serif font-black text-black leading-snug group-hover:text-[#D4AF37] transition-colors">
                        {thread.title}
                      </h3>
                      <p className="text-gray-500 text-xs leading-relaxed line-clamp-2">
                        {thread.content}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-black/5 flex items-center justify-between text-xxs font-mono text-gray-400">
                      <span>Posted by {thread.author} ({thread.authorRole})</span>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => handleUpvote(thread.id, e)}
                          className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors font-bold cursor-pointer"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                          <span>{thread.upvotes}</span>
                        </button>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                          <span>{thread.commentsCount}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredThreads.length === 0 && (
                  <div className="py-20 text-center bg-white border border-black text-xs text-gray-400 uppercase tracking-widest font-mono font-bold">
                    No active discussion threads matching selected category parameters.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Area: Start a new Discussion Thread */}
          <div className="lg:col-span-4 bg-white border border-black p-5 space-y-4 text-left">
            <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#D4AF37] flex items-center gap-2 border-b border-black/10 pb-3">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Create Discussion
            </h3>

            {userProfile ? (
              <form onSubmit={handleCreatePost} className="space-y-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase tracking-widest font-extrabold text-black">
                    Thread Title
                  </label>
                  <input
                    type="text"
                    placeholder="E.G., HOW CAN I STUDY ORGANIC ACIDS MECHANISMS?"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-white border border-black p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded-none uppercase font-semibold placeholder:text-gray-300"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase tracking-widest font-extrabold text-black">
                    Topic Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full bg-white border border-black p-2.5 text-xs focus:outline-none rounded-none uppercase font-bold tracking-wider text-gray-700"
                  >
                    {CATEGORIES.slice(1).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-mono uppercase tracking-widest font-extrabold text-black">
                    Elaborate Details
                  </label>
                  <textarea
                    rows={4}
                    placeholder="DESCRIBE THE CORE ISSUE AND ACCREDITE SPECIFIC SUB SECTIONS NEEDING ASSISTANCE..."
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    className="w-full bg-white border border-black p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded-none uppercase font-semibold placeholder:text-gray-300"
                    required
                  ></textarea>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-black hover:bg-[#D4AF37] text-white hover:text-black font-bold text-xs uppercase tracking-widest cursor-pointer transition-all rounded-none border border-black"
                >
                  Broadcast to Forum
                </button>
              </form>
            ) : (
              <div className="space-y-4 py-4 text-center">
                <AlertCircle className="w-10 h-10 text-[#D4AF37] mx-auto opacity-75" />
                <p className="text-xs text-gray-500 leading-relaxed font-serif italic">
                  Join the academic swarm to broadcast mathematical queries, dissertation questions, and scholarship blueprints.
                </p>
                <button
                  onClick={onOpenAuth}
                  className="w-full py-2.5 bg-[#D4AF37] hover:bg-black text-white font-bold text-xxs uppercase tracking-widest cursor-pointer transition-all border border-transparent hover:border-black rounded-none"
                >
                  Authorize Profile
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
