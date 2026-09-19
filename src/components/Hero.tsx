import { motion } from "motion/react";
import {
  GraduationCap,
  PlayCircle,
  FileSpreadsheet,
  Award,
  BookOpen,
  Atom,
  HelpCircle,
  FileCheck,
  Briefcase,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Lock,
  UserCheck,
  CreditCard,
  Cloud,
  Fingerprint,
} from "lucide-react";

interface HeroProps {
  onExplorePackages: () => void;
  onExploreLevels: () => void;
  onStartAI: () => void;
  onOpenAuth: () => void;
  isLoggedIn: boolean;
}

export default function Hero({
  onExplorePackages,
  onExploreLevels,
  onStartAI,
  onOpenAuth,
  isLoggedIn,
}: HeroProps) {
  // Service highlights as requested in the prompt
  const services = [
    {
      icon: GraduationCap,
      title: "Live Classes",
      desc: "Daily interactive real-time lessons led by expert teachers using premium virtual boards and slides.",
    },
    {
      icon: PlayCircle,
      title: "Recorded Classes",
      desc: "Access the video archive anytime to revise difficult concepts at your own comfortable pace.",
    },
    {
      icon: FileCheck,
      title: "WAEC Preparation",
      desc: "Curated syllabus guides, structured essays, and practical objectives to pass your West African Senior School Certificate Examination.",
    },
    {
      icon: Award,
      title: "NECO Preparation",
      desc: "Tailored mock papers covering basic and senior NECO categories to ensure candidates graduate with distinction.",
    },
    {
      icon: TrendingUp,
      title: "JAMB Preparation",
      desc: "Rigorous diagnostic mock testing, timed environments, and past question compilations for maximum score goals.",
    },
    {
      icon: BookOpen,
      title: "Primary School Lessons",
      desc: "Interactive, gamified foundational learning covering numeracy, literacy, and sciences from Primary 1 through 6.",
    },
    {
      icon: Atom,
      title: "Secondary School Lessons",
      desc: "Comprehensive JSS 1–3 and SS 1–3 core curriculums following physical classroom milestones.",
    },
    {
      icon: Briefcase,
      title: "University Courses",
      desc: "Advanced tertiary tutoring in STEM disciplines: Petroleum Chemistry, Engineering, Physics, Geology, and Algebra.",
    },
    {
      icon: FileSpreadsheet,
      title: "Project Support",
      desc: "Structure, proofread, and format your undergraduate chapters with structured, professional layouts.",
    },
    {
      icon: TrendingUp,
      title: "Data Analysis Services",
      desc: "Scientific SPSS computations, descriptive charts, hypothesis evaluations, and statistical regressions support.",
    },
    {
      icon: Award,
      title: "Research Support",
      desc: "Step-by-step assistance with thesis structures, preliminary pages templates, abstracts, and plagiarism reduction check reviews.",
    },
    {
      icon: HelpCircle,
      title: "TutorBee AI Advisor",
      desc: "Our interactive 24/7 assistant solves complex calculus problems step-by-step with tailored science reviews.",
    },
  ];

  return (
    <div className="bg-[#FAF9F6] text-black">
      {/* 📰 Broad Sheet Masthead Block */}
      <div className="max-w-7xl mx-auto px-6 pt-4 hidden md:block">
        <div className="border-t border-b border-black py-2.5 flex justify-between items-center text-[10px] uppercase font-mono font-bold tracking-[0.2em] text-neutral-600">
          <span>Abuja &bull; Kaduna &bull; Lagos &bull; Kano</span>
          <span className="font-serif italic text-black font-semibold text-xs">The Scholar's Companion &bull; Est. 2024</span>
          <span>Vol. II &bull; No. VI &bull; {new Date().toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Hero Banner Section */}
      <section className="relative py-16 lg:py-20 overflow-hidden border-b border-black px-6">
        {/* Decorative Editorial Watermark Background */}
        <div className="absolute top-10 right-10 text-[150px] font-serif italic text-gray-100/50 select-none pointer-events-none leading-none z-0">
          Hive
        </div>
        
        <div className="max-w-7xl mx-auto relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6 text-left border-r border-black/10 pr-0 lg:pr-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37] text-[10px] uppercase tracking-widest font-bold text-[#D4AF37]">
              <span>🎓 Premium Nigerian EdTech Portal</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-serif italic leading-tight text-black tracking-tight">
              Elevate Your <br />
              <span className="text-[#D4AF37] font-serif font-black underline decoration-black/20 decoration-[3px] underline-offset-8">Learning</span> Experience.
            </h1>
            
            <p className="text-gray-750 text-sm sm:text-base max-w-xl leading-relaxed font-sans first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:float-left first-letter:mr-2.5 first-letter:text-black">
              TutorHive delivers top-tier online live instruction, comprehensive exam mocks 
              for <span className="font-bold underline decoration-[#D4AF37] decoration-2">JAMB, WAEC, & NECO</span>, 
              complete undergraduate research support, and our proprietary 24/7 step-by-step AI mathematics solver. Our platform coordinates premium curriculum support tailored directly for student excellence.
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={onExploreLevels}
                className="px-6 py-3 bg-[#D4AF37] text-white text-xs font-bold uppercase tracking-widest cursor-pointer hover:bg-black hover:text-[#D4AF37] transition-all border border-transparent hover:border-black"
              >
                Get Started
              </button>
              <button
                onClick={onExplorePackages}
                className="px-6 py-3 border border-black text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white cursor-pointer transition-colors"
              >
                View Packages
              </button>
              {!isLoggedIn && (
                <button
                  onClick={onOpenAuth}
                  className="px-6 py-3 text-xs tracking-widest text-[#D4AF37] hover:text-black uppercase font-bold border-b border-dashed border-[#D4AF37] hover:border-black transition-colors"
                >
                  Register Account
                </button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-6 pt-6 border-t border-black">
              <div>
                <div className="text-xl sm:text-2xl font-serif font-bold text-black font-serif">100%</div>
                <div className="text-gray-500 font-mono text-[9px] uppercase tracking-wider">Curriculum Aligned</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-serif font-bold text-[#D4AF37] font-serif">24/7</div>
                <div className="text-gray-500 font-mono text-[9px] uppercase tracking-wider">AI Problem Solving</div>
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-serif font-bold text-black font-serif">₦5k</div>
                <div className="text-gray-500 font-mono text-[9px] uppercase tracking-wider">Research Entry</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative mt-6 lg:mt-0 flex justify-center">
            {/* Visual element placeholder representing premium TutorHive hub dashboard */}
            <div className="border border-black bg-white p-6 relative w-full max-w-sm text-left">
              <div className="flex items-center justify-between border-b border-black pb-3 mb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 bg-black"></div>
                  <div className="w-2.5 h-2.5 bg-[#D4AF37]"></div>
                  <div className="w-2.5 h-2.5 bg-gray-300"></div>
                </div>
                <span className="text-[10px] font-mono text-black uppercase tracking-wider">TUTORHIVE CONSOLE</span>
              </div>
              <div className="space-y-4">
                <div className="bg-[#FAF9F6] border border-black p-3 relative flex items-center gap-3">
                  <GraduationCap className="w-8 h-8 text-[#D4AF37] shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-black uppercase tracking-wider">Continuous Assessment</h4>
                    <span className="text-[10px] font-mono text-gray-550">MATHS - Linear Calculus</span>
                  </div>
                </div>
                <div className="bg-[#FAF9F6] border border-black p-3 relative space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-mono font-bold">
                    <span className="text-black uppercase tracking-wide">JAMB progress</span>
                    <span className="text-[#D4AF37]">85%</span>
                  </div>
                  <div className="w-full bg-gray-200 h-1">
                    <div className="bg-[#D4AF37] h-full" style={{ width: "85%" }}></div>
                  </div>
                </div>
                <div className="bg-white border-l-4 border-[#D4AF37] border-y border-r border-black p-3 relative flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-serif italic text-black font-semibold">TutorBee AI Workspace</h5>
                    <p className="text-[9px] font-mono text-gray-400">Status: Active</p>
                  </div>
                  <button
                    onClick={onStartAI}
                    className="bg-black hover:bg-[#D4AF37] text-white hover:text-black font-bold text-[9px] uppercase py-1 px-3 border border-black transition-colors"
                  >
                    Open Chat
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 🌟 Refined Platform Overview & Mission Section */}
      <section className="border-b border-black bg-zinc-950 text-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          {/* Header Block */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-4 text-left">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-bold font-mono">Platform Identity</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white leading-tight">
                TutorHive <span className="text-[#D4AF37] italic">Platform Overview</span>
              </h2>
              <div className="w-12 h-[1px] bg-[#D4AF37]"></div>
            </div>
            
            <div className="lg:col-span-7 text-left space-y-4">
              <p className="text-zinc-300 text-sm sm:text-base leading-relaxed font-sans">
                TutorHive is a premium, all-in-one online academic learning and support platform designed to help students excel at every stage of their education.
              </p>
              <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed font-sans mt-2">
                We deliver <strong className="text-white">high-quality live instruction</strong>, structured learning paths, and personalized academic support for learners from secondary school through university level.
              </p>
            </div>
          </div>

          {/* Two-Column Midsection: Mission & What Makes Us Different */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            
            {/* Card 1: Our Mission */}
            <div className="border border-zinc-800 p-6 sm:p-8 bg-zinc-900/40 relative flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30">
                  <span className="text-lg">🎯</span>
                </div>
                <h3 className="text-lg sm:text-xl font-serif text-white font-semibold">Our Mission</h3>
                <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed italic border-l-2 border-[#D4AF37] pl-4">
                  "To make high-quality education accessible, understandable, and interactive for every learner—regardless of location or academic level."
                </p>
              </div>
              <div className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-mono font-bold">
                TUTORHIVE IMPACT COHORT
              </div>
            </div>

            {/* Card 2: What Makes Us Different */}
            <div className="border border-zinc-800 p-6 sm:p-8 bg-zinc-900/40 relative flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="w-10 h-10 bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/30">
                  <span className="text-lg">🚀</span>
                </div>
                <h3 className="text-lg sm:text-xl font-serif text-white font-semibold">What Makes TutorHive Different</h3>
                <p className="text-[#D4AF37] text-xs leading-relaxed">
                  TutorHive is not just a learning platform—it is a complete academic ecosystem combining:
                </p>
                <ul className="space-y-2">
                  {[
                    "Live human instruction",
                    "AI-powered tutoring (TutorBee Advisor)",
                    "Exam-focused preparation systems (WAEC, JAMB, NECO)",
                    "Research and project support services",
                    "Continuous academic guidance"
                  ].map((item, idx) => (
                    <li key={idx} className="flex items-center gap-2.5 text-xs text-zinc-300">
                      <span className="w-1.5 h-1.5 bg-[#D4AF37] shrink-0"></span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <p className="text-[10px] text-zinc-500 font-mono tracking-wider">
                BRIDGING TRADITIONAL LEARNING & INTELLIGENT EDUCATION
              </p>
            </div>
            
          </div>

          {/* Core Platform Deliverables Section */}
          <div className="space-y-8 text-left pt-4">
            <div className="border-b border-zinc-800 pb-3 flex justify-between items-center">
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-zinc-400">
                Core Deliverables Blueprint
              </h3>
              <span className="text-[9px] font-mono text-[#D4AF37] uppercase tracking-wider">Five Interactive Frameworks</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {[
                {
                  emoji: "🎓",
                  title: "Live Classes",
                  desc: "Interactive online sessions that simplify complex topics and ensure deep understanding across key subjects."
                },
                {
                  emoji: "📝",
                  title: "Exam Prep",
                  desc: "Comprehensive mock examinations, past-question practice, and targeted revision materials design for WAEC, JAMB & NECO."
                },
                {
                  emoji: "📚",
                  title: "Research Support",
                  desc: "Full academic assistance for undergraduate projects, research guidance, thesis structuring, and scientific data analysis."
                },
                {
                  emoji: "🤖",
                  title: "24/7 AI tutor",
                  desc: "Our proprietary step-by-step TutorBee learning companion that helps solve maths and science concepts anytime."
                },
                {
                  emoji: "📖",
                  title: "Digital Resources",
                  desc: "Organized courses, study materials, and academic content compiled meticulously from base levels to tertiary excellence."
                }
              ].map((del, dIdx) => (
                <div key={dIdx} className="bg-zinc-900 border border-zinc-800 p-5 space-y-3 hover:border-[#D4AF37]/50 transition-colors">
                  <div className="text-2xl">{del.emoji}</div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] font-mono">
                    {del.title}
                  </h4>
                  <p className="text-zinc-400 text-[11px] leading-relaxed">
                    {del.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* Services Overview Grid */}
      <section className="py-20 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-bold">Our Services Blueprint</span>
          <h2 className="text-3xl sm:text-4xl font-serif text-black leading-tight">
            Comprehensive <span className="text-[#D4AF37] italic">Tutoring & Research</span>
          </h2>
          <div className="w-12 h-[1px] bg-black mx-auto my-4"></div>
          <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
            TutorHive hosts comprehensive features mapping the entire academic lifecycle 
            from foundational prep to university research.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {services.map((srv, index) => {
            const Icon = srv.icon;
            return (
              <motion.div
                key={index}
                whileHover={{ y: -2 }}
                className="bg-white border border-black p-5 group cursor-pointer hover:bg-black transition-all text-left flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="w-8 h-8 bg-[#FAF9F6] border border-black group-hover:bg-[#D4AF37] group-hover:border-[#D4AF37] flex items-center justify-center text-black group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-gray-400 group-hover:text-[#D4AF37] uppercase tracking-wider">Service {String(index+1).padStart(2, '0')}</span>
                    <h3 className="text-base font-serif font-black mt-1 text-black group-hover:text-white transition-colors">{srv.title}</h3>
                  </div>
                  <p className="text-gray-500 group-hover:text-gray-300 text-xs leading-relaxed transition-colors">{srv.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 🔐 Trust & Security Badge Section */}
      <motion.section 
        className="py-24 bg-[#FAF9F6] border-t border-black/10 text-left"
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
      >
        <div className="max-w-7xl mx-auto px-6 space-y-16">
          
          {/* Section Titles */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-[10px] uppercase tracking-[0.35em] text-[#D4AF37] font-bold font-mono">Platform Integrity & Security</span>
            <h2 className="text-3xl sm:text-4xl font-serif text-black uppercase tracking-tight">
              Trusted. Secure. <span className="font-serif italic font-light lowercase">Reliable.</span>
            </h2>
            <div className="w-12 h-[1px] bg-black mx-auto my-3"></div>
            <p className="text-neutral-500 text-xs sm:text-sm leading-relaxed font-sans max-w-xl mx-auto font-medium">
              TutorHive is built with modern security standards to ensure all user data, learning progress, and payments remain safe, private, and protected at all times.
            </p>
          </div>

          {/* Six-Column Grid of Minimal Security Cards with small Icons above text and absolutely no heavy borders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-10 max-w-5xl mx-auto">
            
            {/* 1. Secure Authentication */}
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex justify-center sm:justify-start">
                <div className="p-2 border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] mb-2">
                  <Fingerprint className="w-5 h-5 stroke-[1.25]" />
                </div>
              </div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black">Secure Authentication</h4>
              <p className="text-gray-500 text-[11px] leading-relaxed max-w-xs mx-auto sm:mx-0">
                Powered by state-of-the-art secure user authentication protocols mapping standard learning profiles safely.
              </p>
            </div>

            {/* 2. Data Encryption */}
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex justify-center sm:justify-start">
                <div className="p-2 border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] mb-2">
                  <ShieldCheck className="w-5 h-5 stroke-[1.25]" />
                </div>
              </div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black">Data Encryption</h4>
              <p className="text-gray-500 text-[11px] leading-relaxed max-w-xs mx-auto sm:mx-0">
                All application details, student correspondence and messaging histories are fully secured using HTTPS/SSL.
              </p>
            </div>

            {/* 3. Privacy Protected */}
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex justify-center sm:justify-start">
                <div className="p-2 border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] mb-2">
                  <Lock className="w-5 h-5 stroke-[1.25]" />
                </div>
              </div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black">Privacy Protected</h4>
              <p className="text-gray-500 text-[11px] leading-relaxed max-w-xs mx-auto sm:mx-0">
                Your personal and academic files are treated with full discretion, and are never sold or shared with any third party.
              </p>
            </div>

            {/* 4. Secure Payments */}
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex justify-center sm:justify-start">
                <div className="p-2 border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] mb-2">
                  <CreditCard className="w-5 h-5 stroke-[1.25]" />
                </div>
              </div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black">Secure Payments</h4>
              <p className="text-gray-500 text-[11px] leading-relaxed max-w-xs mx-auto sm:mx-0">
                Undergraduate research fees and premium tuition package invoices are safely handled, logged, and audited.
              </p>
            </div>

            {/* 5. Cloud Protected System */}
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex justify-center sm:justify-start">
                <div className="p-2 border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] mb-2">
                  <Cloud className="w-5 h-5 stroke-[1.25]" />
                </div>
              </div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black">Cloud Protected System</h4>
              <p className="text-gray-500 text-[11px] leading-relaxed max-w-xs mx-auto sm:mx-0">
                Hosted inside specialized remote databases backed with strong access rules preventing external queries.
              </p>
            </div>

            {/* 6. Role-Based Access */}
            <div className="space-y-2 text-center sm:text-left">
              <div className="flex justify-center sm:justify-start">
                <div className="p-2 border border-[#D4AF37]/30 bg-[#D4AF37]/5 text-[#D4AF37] mb-2">
                  <UserCheck className="w-5 h-5 stroke-[1.25]" />
                </div>
              </div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-black">Role-Based Access</h4>
              <p className="text-gray-500 text-[11px] leading-relaxed max-w-xs mx-auto sm:mx-0">
                Users only get viewing privileges matching their exact profile roles. Unauthorized files and tables are locked.
              </p>
            </div>

          </div>

          {/* 🧠 OPTIONAL TRUST LINE (EDITORIAL STYLE) */}
          <div className="text-center max-w-3xl mx-auto pt-10 border-t border-black/5">
            <blockquote className="text-neutral-700 italic font-serif text-sm sm:text-base leading-relaxed">
              “Your learning journey is private, secure, and fully protected within TutorHive.”
            </blockquote>
          </div>

        </div>
      </motion.section>
    </div>
  );
}
