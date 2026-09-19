import { DigitalBookRecord } from "../src/types";

export let DIGITAL_LIBRARY_STORE: DigitalBookRecord[] = [
  {
    id: "lib-bk-101",
    title: "Essential Organic Chemistry for West African Tertiary Students",
    author: "Prof. O. K. Adeleke",
    category: "Tertiary STEM",
    level: "Tertiary",
    fileType: "pdf",
    price: 3500,
    downloadCount: 142,
    isPublished: true,
    coverImageUrl: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=300&auto=format&fit=crop&q=80",
    previewUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    createdAt: "2026-02-15T10:00:00Z"
  },
  {
    id: "lib-bk-102",
    title: "JAMB UTME Complete Mathematics 15-Year Solved Papers",
    author: "TutorHive Academic Research Bureau",
    category: "Exam Prep",
    level: "JAMB Prep",
    fileType: "pdf",
    price: 2500,
    downloadCount: 489,
    isPublished: true,
    coverImageUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=300&auto=format&fit=crop&q=80",
    previewUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    createdAt: "2026-02-18T10:00:00Z"
  },
  {
    id: "lib-bk-103",
    title: "Comprehensive Secondary Physics: Mechanics & Waves Guide",
    author: "Engr. Chinedu Okafor",
    category: "Senior Secondary",
    level: "SSS 1-3",
    fileType: "pdf",
    price: 0, // Free resource
    downloadCount: 612,
    isPublished: true,
    coverImageUrl: "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?w=300&auto=format&fit=crop&q=80",
    previewUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    createdAt: "2026-02-22T10:00:00Z"
  },
  {
    id: "lib-bk-104",
    title: "WAEC English Grammar, Oral English & Summary Writing Techniques",
    author: "Folashade Alabi",
    category: "Languages & Arts",
    level: "WAEC/NECO",
    fileType: "pdf",
    price: 2000,
    downloadCount: 310,
    isPublished: true,
    coverImageUrl: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&auto=format&fit=crop&q=80",
    previewUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    createdAt: "2026-03-01T10:00:00Z"
  },
  {
    id: "lib-bk-105",
    title: "Undergraduate Research Methodology & SPSS Data Analysis Handbook",
    author: "Dr. Babatunde Adeyemi",
    category: "Research Projects",
    level: "Tertiary",
    fileType: "pdf",
    price: 5000,
    downloadCount: 204,
    isPublished: true,
    coverImageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=300&auto=format&fit=crop&q=80",
    previewUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    createdAt: "2026-03-05T10:00:00Z"
  }
];
