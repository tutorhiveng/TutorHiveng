import React, { useState } from "react";
import { Search, GraduationCap, ChevronRight, BookOpen, Layers, Library } from "lucide-react";

interface LearningLevelsProps {
  onSelectLevel: (level: string, filterText?: string) => void;
}

export default function LearningLevels({ onSelectLevel }: LearningLevelsProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const levelsData = [
    {
      category: "Early Learning Foundations",
      icon: BookOpen,
      desc: "Laying interactive foundations for early childhood cognitive development.",
      items: ["Pre-Nursery", "Nursery", "Kindergarten"],
    },
    {
      category: "Primary School Curriculum",
      icon: Layers,
      desc: "Nurturing fundamental numeracy, language arts, and basic engineering values.",
      items: ["Primary 1–3", "Primary 4–6"],
    },
    {
      category: "Secondary School Academics",
      icon: Library,
      desc: "Standard Junior (JSS) and Senior (SS) levels mapped to national curriculum benchmarks.",
      items: ["JSS 1–3", "SS 1–3"],
    },
    {
      category: "Core Exam Preparations",
      icon: GraduationCap,
      desc: "Rigorous objectives training designed to clear state examinations.",
      items: ["JAMB Prep", "WAEC Prep", "NECO Prep"],
    },
  ];

  const tertiaryDepartments = [
    "Education",
    "Chemistry",
    "Industrial Chemistry",
    "Petroleum Chemistry",
    "Physics",
    "Biology",
    "Mathematics",
    "Engineering",
    "Computer Science",
    "Geology",
  ];

  // Simple filtering mechanism based on standard input trigger
  const filteredDepartments = tertiaryDepartments.filter((dep) =>
    dep.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#FAF9F6] text-black min-h-screen py-12 px-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* 📚 Learning Levels Masthead */}
        <div className="border-t border-b border-black py-4 text-center max-w-7xl mx-auto w-full space-y-2 mb-8 animate-fade-in">
          <span className="text-[9px] uppercase tracking-[0.3em] font-mono text-[#D4AF37] font-bold block">Academic Mapping & Classroom Blueprints</span>
          <h1 className="text-3xl sm:text-4xl font-serif text-black uppercase tracking-tight">Structured <span className="font-serif italic font-light">Learning Pathways</span></h1>
          <p className="text-neutral-500 text-[11px] leading-relaxed max-w-2xl mx-auto italic font-serif">
            "Explore standardized curriculum maps from introductory nurseries to honors-level university chemistry and geology departments."
          </p>
        </div>

          {/* Search Bar functional filter */}
          <div className="relative max-w-md mx-auto pt-2">
            <Search className="absolute left-3.5 top-5 w-4 h-4 text-black" />
            <input
              type="text"
              placeholder="Search subjects, levels, faculties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-black focus:border-[#D4AF37] text-black py-3 pl-10 pr-4 text-xs tracking-wider uppercase font-bold focus:ring-1 focus:ring-[#D4AF37] focus:outline-none transition-all rounded-none"
            />
          </div>

        {/* Categories grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
          {levelsData.map((lvl, index) => {
            const Icon = lvl.icon;
            return (
              <div
                key={index}
                className="bg-white border border-black rounded-none p-6 transition-all"
              >
                <div className="flex items-center gap-3 border-b border-black pb-3 mb-4">
                  <div className="w-10 h-10 bg-[#FAF9F6] flex items-center justify-center border border-black group-hover:bg-[#D4AF37] transition-all">
                    <Icon className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="text-sm font-serif font-black text-black">
                      {lvl.category}
                    </h3>
                    <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">{lvl.desc}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {lvl.items.map((it, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSelectLevel(it)}
                      className="bg-[#FAF9F6] hover:bg-black border border-black text-black hover:text-[#D4AF37] py-1.5 px-3.5 text-xs font-bold tracking-widest uppercase cursor-pointer transition-colors flex items-center gap-1.5 rounded-none"
                    >
                      {it}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Tertiary Education Block */}
        <div className="bg-white border border-black rounded-none p-6">
          <div className="border-b border-black pb-3 mb-5">
            <h3 className="text-sm font-serif font-black text-black flex items-center gap-2 uppercase tracking-wide">
              <span className="w-2.5 h-2.5 bg-[#D4AF37] inline-block"></span>
              Tertiary Education & Sciences Faculties
            </h3>
            <p className="text-[10px] text-gray-550 font-mono tracking-widest uppercase mt-1">
              Advanced academic training, experimental support, and research analysis services.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {filteredDepartments.map((dep, index) => (
              <div
                key={index}
                onClick={() => onSelectLevel("Tertiary Education", dep)}
                className="bg-[#FAF9F6] hover:bg-black border border-black p-4 text-center cursor-pointer select-none transition-all group rounded-none"
              >
                <div className="text-black text-xs font-bold group-hover:text-[#D4AF37] uppercase tracking-wider font-mono transition-all">
                  {dep}
                </div>
                <div className="text-gray-400 text-[8px] mt-2 font-mono tracking-[0.2em] uppercase">
                  FACULTY INDEX
                </div>
              </div>
            ))}

            {filteredDepartments.length === 0 && (
              <div className="col-span-full py-8 text-gray-400 text-xs text-center font-serif italic">
                No university department matching your search parameters could be found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
