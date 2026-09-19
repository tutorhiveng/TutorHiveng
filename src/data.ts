import { Course, ResearchProject, LibraryItem, Package, PayableItem } from "./types";

export const COGNITIVE_PACKAGES: Package[] = [
  {
    id: "pkg-basic",
    name: "Basic Package",
    price: 15000,
    includes: [
      "Live Scheduled Classes",
      "Recorded Video Lessons Archive",
      "Teacher's Lesson Notes Preview",
      "Module Assignments",
      "Weekly Mock Practice Tests",
      "Progress Dashboard Tracking",
    ],
    description: "Ideal foundation for primary, secondary, and exam candidates seeking structured resources.",
  },
  {
    id: "pkg-standard",
    name: "Standard Package",
    price: 25000,
    includes: [
      "Everything in Basic",
      "Unlimited TutorBee AI Access",
      "Premium Interactive Learning Materials",
      "NECO, WAEC & JAMB Real Past Questions Mock Runs",
      "Assignment Automatic Step-By-Step Critique",
    ],
    description: "The most popular tier—unlocks the comprehensive TutorBee AI Advisor for tailored explanations.",
  },
  {
    id: "pkg-premium",
    name: "Premium Package",
    price: 50000,
    includes: [
      "Everything in Standard",
      "Full Digital Library & PDF Notes Downloads",
      "Priority Teacher Support Chat",
      "Advanced Student Performance Analytics",
      "Undergraduate/Postgraduate Research Projects Review",
      "1-on-1 Monthly Project Guidance Session",
    ],
    description: "Ultimate educational package, complete with intensive project research help and personalized guidance.",
  },
];

export const EDUCATIONAL_COURSES: Course[] = [
  {
    id: "jamb-math",
    title: "JAMB Mathematics Prep Course",
    subject: "Mathematics",
    level: "Exam Preparation",
    lessons: [
      {
        id: "jm-1",
        title: "Calculus: Differentiation and Integration Coordinates",
        duration: "45 mins",
        videoUrl: "https://www.youtube.com/embed/grnpHCg7m0Y",
        notes: "### Differentiation\nDifferentiation deals with finding the rate of change of a function. \nFormula: d/dx(x^n) = n * x^(n-1)\n\n### Integration\nIntegration is the inverse process of differentiation.\nFormula: ∫ x^n dx = (x^(n+1))/(n+1) + C, (n ≠ -1)",
        gradedAssignment: "Use differentiation to find the slope of the curve y = 3x^2 + 5x - 2 at x = 3. Show step-by-step calculus reasoning.",
      },
      {
        id: "jm-2",
        title: "Matrix Algebra and Simultaneous Linear Determinants",
        duration: "35 mins",
        videoUrl: "https://www.youtube.com/embed/9N4SbeJ_aLw",
        notes: "### Matrix Representation\nAny system of simultaneous equations can be written as AX = B.\n\n### Cramer's Rule\nEnables solving using determinants:\nx = Det(Ax) / Det(A)",
        gradedAssignment: "Solve using matrix coordinates:\n2x + 3y = 8\nx - 2y = 1",
      },
    ],
    quizzes: [
      {
        id: "q-jm-1",
        question: "Find the derivative of f(x) = 4x^3 - 5x + 7.",
        options: [
          "12x^2 - 5",
          "12x^3 - 5x",
          "4x^2 - 5",
          "12x^2",
        ],
        correctAnswerIndex: 0,
      },
      {
        id: "q-jm-2",
        question: "Evaluate current integral: ∫ (2x + 3) dx.",
        options: [
          "x^2 + 3x + C",
          "2x^2 + 3x + C",
          "x^2 + C",
          "2x + C",
        ],
        correctAnswerIndex: 0,
      },
    ],
    mockExaminations: [
      {
        id: "m-jm-1",
        question: "What is the determinant of matrix A = [[3, 2], [1, 4]]?",
        options: ["10", "14", "12", "8"],
        correctAnswerIndex: 0,
      },
    ],
  },
  {
    id: "chem-petrol",
    title: "Organic Chemistry & Petroleum Hydrocarbons",
    subject: "Chemistry",
    level: "Tertiary Education",
    lessons: [
      {
        id: "cp-1",
        title: "Alkanes, Alkenes, and Alkynes Functional Nomenclatures",
        duration: "50 mins",
        videoUrl: "https://www.youtube.com/embed/6iicPIdl9-8",
        notes: "### Hydrocarbons\nCompounds containing only Carbon and Hydrogen.\n- **Alkanes**: Saturated, single bonds (CnH2n+2)\n- **Alkenes**: Unsaturated, double bond (CnH2n)\n- **Alkynes**: Unsaturated, triple bond (CnH2n-2)",
        gradedAssignment: "Draw the skeletal structural formula of 2-methylbut-2-ene and explain why it is classified as unsaturated.",
      },
      {
        id: "cp-2",
        title: "Fractional Distillation and Petroleum Refining Fractions",
        duration: "40 mins",
        videoUrl: "https://www.youtube.com/embed/K7qE-064RVE",
        notes: "### Petroleum Distillation\nSeparates crude oil hydrocarbons by boiling point gradients:\n1. Refinery Gases (C1-C4) - under 40°C\n2. Petrol/Gasoline (C5-C10) - 40°C - 200°C\n3. Diesel Oil (C15-C20) - 250°C - 350°C",
        gradedAssignment: "Briefly discuss the catalytic cracking process in petroleum refining and its benefit on octane rating.",
      },
    ],
    quizzes: [
      {
        id: "q-cp-1",
        question: "What is the general molecular formula for alkenes?",
        options: ["CnH2n+2", "CnH2n", "CnH2n-2", "CnHn"],
        correctAnswerIndex: 1,
      },
    ],
    mockExaminations: [],
  },
  {
    id: "sec-phys-1",
    title: "SS3 Physics: Electromagnetism & Field Strength",
    subject: "Physics",
    level: "Secondary School",
    lessons: [
      {
        id: "sp-1",
        title: "Magnetic Fields Around Current Carrying Conductors",
        duration: "30 mins",
        videoUrl: "https://www.youtube.com/embed/GrS9_7_2yio",
        notes: "### Ampere's Right Hand Grip Rule\nGrip conductor with right hand: thumb points to current flow, fingers curl to magnetic field circles.",
        gradedAssignment: "Calculate the magnetic flux density B at a point 5cm away from a straight conductor carrying a current of 12A. (Use Permeability Constant μo = 4π × 10^-7 T·m/A)",
      },
    ],
    quizzes: [
      {
        id: "q-sp-1",
        question: "Which rule determines the direction of force on a current conductor in a magnetic field?",
        options: [
          "Fleming's Left-Hand Rule",
          "Lenz's Law",
          "Ohm's Law",
          "Fleming's Right-Hand Rule",
        ],
        correctAnswerIndex: 0,
      },
    ],
    mockExaminations: [],
  },
];

export const RESEARCH_PROJECTS_DATABASE: ResearchProject[] = [
  {
    id: "proj-chem-1",
    title: "Phytochemical Analysis and Antimicrobial Profile of Moringa Oleifera Seeds Oil Extracted via Soxhlet",
    category: "Chemistry",
    abstract: "This project presents the chemical extraction and qualitative and quantitative evaluation of bioactive compounds (alkaloids, flavonoids, tannins) from Nigerian Moringa oleifera seed kernels. Extraction was completed using Soxhlet equipment using n-hexane as solvent. High-yield fatty acids were characterized and antimicrobial screens completed against S. aureus and E. coli.",
    preliminaryPages: "TITLE PAGE\nCERTIFICATION\nDEDICATION\nACKNOWLEDGEMENTS\nTABLE OF CONTENTS\nLIST OF TABLES\nABSTRACT",
    chapterOnePreview: "### CHAPTER ONE\n\n#### 1.1 BACKGROUND OF STUDY\nMoringa oleifera, indigenous to global tropical regions, is widely cultivated throughout Northern and Southern Nigeria where it is valued for its rich phytochemical value. Solid oil fractions contain dense active lipids which hold promise for pharmaceutical synthesis...",
    fullProjectUrl: "https://tutorhive.com/secure/download/phytochemical_moringa_ref102.pdf",
    price: 5000,
    isFreePreview: true,
  },
  {
    id: "proj-comp-2",
    title: "Design and Implementation of a Cloud-Based Remote Patient Telemetry Monitoring System with GSM Integration",
    category: "Computer Science",
    abstract: "Development of a full-scale sensory IoT portal designed to stream clinical telemetry data (pulse rate, temperature, SpO2) from wearable sensor nodes to a central web database. Utilizes microcontrollers for local sensor reading and wireless transmitters for data delivery.",
    preliminaryPages: "TITLE PAGE\nDECLARATION\nDEDICATION\nACKNOWLEDGEMENTS\nTABLE OF CONTENTS\nLIST OF FIGURES\nABSTRACT",
    chapterOnePreview: "### CHAPTER ONE\n\n#### 1.1 INTRODUCTION\nHealthcare accessibility in suburban Nigeria is heavily compromised by institutional spacing. Automated patient monitoring systems present an actionable mechanism to buffer clinical workflows by transmitting sensor indices digitally...",
    fullProjectUrl: "https://tutorhive.com/secure/download/iot_telemetry_ref205.pdf",
    price: 5000,
    isFreePreview: true,
  },
  {
    id: "proj-geol-3",
    title: "Geochemical Characterization and Mineral Potential Analysis of Kaolin Clays in parts of Ogun State, Nigeria",
    category: "Geology",
    abstract: "X-ray fluorescence (XRF) and XRD analytical methods were applied to soil cores collected from clay deposits in southwest Nigeria. Geochemical markers provide insight into industrial suitability of the clays for ceramics, tiles, and paper manufacturing.",
    preliminaryPages: "TITLE PAGE\nDEDICATION\nTABLE OF CONTENTS\nMAP DESCRIPTIONS\nABSTRACT",
    chapterOnePreview: "### CHAPTER ONE\n\n#### 1.0 INTRODUCTION\nIndustrial kaolin resource reservoirs remain largely unmapped inside Southwest geological basins. This research examines local sedimentary clay properties, mineral compositions, and quartz ratios...",
    fullProjectUrl: "https://tutorhive.com/secure/download/geochemical_kaolin_ref309.pdf",
    price: 5000,
    isFreePreview: true,
  },
];

export const DIGITAL_LIBRARY_SHELVES: LibraryItem[] = [
  {
    id: "lib-bk-101",
    title: "Mastering WAEC & NECO Chemistry: Theoretical Principles & Solved Problems",
    author: "Dr. Adebayo Ogunlesi",
    type: "book",
    price: 3500,
    fileUrl: "https://tutorhive.com/library/chemistry_mastery.pdf",
  },
  {
    id: "lib-bk-102",
    title: "Nigerian Secondary Physics Syllabus Notes (JSS - SS Classes)",
    author: "TutorHive Physics Faculty",
    type: "notes",
    price: 0,
    fileUrl: "https://tutorhive.com/library/physics_syllabus_notes.pdf",
  },
  {
    id: "lib-bk-103",
    title: "JAMB Mathematics Past Questions Booklet (2018 - 2025 Worked Solutions)",
    author: "Engr. Yusuf Bello",
    type: "pdf",
    price: 4000,
    fileUrl: "https://tutorhive.com/library/jamb_maths_solutions.pdf",
  },
  {
    id: "lib-bk-104",
    title: "SPSS & Stata Quantitative Data Analysis: Practical Guide with Survey Datasets",
    author: "Prof. Kenneth Madu & Dr. Fatima Sanusi",
    type: "book",
    price: 4500,
    fileUrl: "https://tutorhive.com/library/spss_stata_guide.pdf",
  },
  {
    id: "lib-bk-105",
    title: "Academic Dissertation & Thesis Architecture: From Proposal to Defense",
    author: "Dr. Chinedu Eze & TutorHive Editorial Board",
    type: "book",
    price: 5000,
    fileUrl: "https://tutorhive.com/library/thesis_architecture_manual.pdf",
  },
  {
    id: "lib-bk-106",
    title: "Comprehensive English Lexis, Structure & Oral English for WASSCE/UTME",
    author: "Mrs. Folashade Adeleke (M.Ed)",
    type: "book",
    price: 3000,
    fileUrl: "https://tutorhive.com/library/english_lexis_structure.pdf",
  },
  {
    id: "lib-bk-107",
    title: "Advanced Financial Accounting & IFRS Principles for Tertiary Scholars",
    author: "Alhaji Ibrahim Danladi, FCA",
    type: "book",
    price: 4800,
    fileUrl: "https://tutorhive.com/library/financial_accounting_ifrs.pdf",
  },
];

export function getPayableProductsCatalog(): PayableItem[] {
  const libraryBooks: PayableItem[] = DIGITAL_LIBRARY_SHELVES.filter((b) => b.price > 0).map((b) => ({
    id: b.id,
    type: "library",
    title: b.title,
    subtitle: `Written by ${b.author}`,
    category: "Digital Library Paid Book",
    description: `Complete digital edition of ${b.title}. Includes downloadable PDF, highlighted chapter outlines, and companion problem sheets.`,
    price: b.price,
    badge: "E-BOOK ARCHIVE",
    authorOrDept: b.author,
    fileUrl: b.fileUrl,
    detailsList: [
      "Instant PDF Download & In-Browser High-Res Reader",
      "Perpetual Offline Reading License",
      "Solved Past Questions & Worked Solutions",
      "Curriculum Aligned with WAEC, NECO & UTME Standards",
    ],
  }));

  const packages: PayableItem[] = COGNITIVE_PACKAGES.map((pkg) => ({
    id: pkg.id,
    type: "package",
    title: pkg.name,
    subtitle: "Termly Tuition & Live Interactive Tutoring",
    category: "Tuition & Coaching Package",
    description: pkg.description,
    price: pkg.price,
    badge: "SUBSCRIPTION PLAN",
    authorOrDept: "TutorHive Academic Directorate",
    detailsList: pkg.includes,
  }));

  const researchProjects: PayableItem[] = RESEARCH_PROJECTS_DATABASE.map((proj) => ({
    id: proj.id,
    type: "project",
    title: proj.title,
    subtitle: `Department of ${proj.category}`,
    category: "Academic Research & Thesis",
    description: proj.abstract,
    price: proj.price,
    badge: "RESEARCH MANUSCRIPT",
    authorOrDept: `${proj.category} Faculty Division`,
    fileUrl: proj.fullProjectUrl,
    detailsList: [
      "Complete Chapters 1 to 5 Full Manuscript (.DOCX & .PDF)",
      "Structured Questionnaires, Raw Survey Datasets & SPSS Output Tables",
      "Full References, Bibliography & Turnitin Plagiarism Clearance",
      "1-on-1 Academic Defense & Panel Presentation Guidance",
    ],
  }));

  const courses: PayableItem[] = [
    {
      id: "course-utme-combo",
      type: "course",
      title: "Comprehensive UTME/JAMB 4-Subject Master Class Bundle",
      subtitle: "English, Mathematics, Physics & Chemistry",
      category: "Exam Preparation Course",
      description: "Complete 16-week intensive mastery curriculum with 120 video lectures, weekly mock CBTs, and solved past questions from 1990 to date.",
      price: 18500,
      badge: "ONE-TIME COURSE PASS",
      authorOrDept: "Faculty of Secondary Science & Technology",
      detailsList: [
        "120+ Video Lessons & Downloadable Lecture Slides",
        "Unlimited Timed JAMB CBT Simulation Engine Access",
        "Weekly Live Problem-Solving Clinics",
        "Certificate of Academic Completion",
      ],
    },
    {
      id: "course-tertiary-data",
      type: "course",
      title: "Applied Biostatistics & SPSS Data Analysis for Undergraduates",
      subtitle: "Hands-on Statistical Computing Curriculum",
      category: "Higher Education Analytics",
      description: "Master hypothesis testing, ANOVA, linear regression, factor analysis, and APA 7th edition reporting using IBM SPSS and real Nigerian survey datasets.",
      price: 15000,
      badge: "SKILL CERTIFICATION",
      authorOrDept: "Department of Mathematics & Statistics",
      detailsList: [
        "Raw Datasets (.SAV & .CSV) Included",
        "Step-by-Step Practical Video Walkthroughs",
        "Interpretation & Discussion Chapter Templates",
        "Direct Tutor Support for Project Defense",
      ],
    },
  ];

  const tutorServices: PayableItem[] = [
    {
      id: "tutor-1on1-mastery",
      type: "tutor",
      title: "Private 1-on-1 Dedicated Tutor Coaching (5 Hours Pass)",
      subtitle: "Customized Personal Mentorship",
      category: "Private Tutoring",
      description: "Book 5 hours of private one-on-one virtual interactive sessions with a verified top-tier Nigerian subject specialist for WAEC, JAMB, or University coursework.",
      price: 22500,
      badge: "1-ON-1 SESSIONS",
      authorOrDept: "TutorHive Verified Educator Guild",
      detailsList: [
        "Select Your Preferred Time Slot & Tutor",
        "Interactive Digital Whiteboard & Session Recording",
        "Personalized Homework Review & Grade Diagnosis",
        "Direct WhatsApp Academic Support Channel",
      ],
    },
    {
      id: "academic-spss-service",
      type: "service",
      title: "Statistical Data Cleaning & Chapter 4 Analysis Service",
      subtitle: "Bespoke Research Consultancy",
      category: "Academic Support & Project Services",
      description: "Professional statistical assistance for final-year dissertations: data coding, descriptive statistics, inferential tests, cross-tabulations, and full interpretation notes.",
      price: 28000,
      badge: "ACADEMIC CONSULTING",
      authorOrDept: "Centre for Academic Research & Methodology",
      detailsList: [
        "Cleaned CSV & SPSS .sav Datasets Returned",
        "Publication-Ready Tables & Visual Charts",
        "Full Statistical Interpretation (Chapter 4 Draft)",
        "Turnaround in 72 Hours Guaranteed",
      ],
    },
  ];

  return [...packages, ...libraryBooks, ...courses, ...researchProjects, ...tutorServices];
}

