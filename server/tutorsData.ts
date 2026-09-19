import { TutorProfile, TutorApplication, TutorBooking } from "../src/types";

export let TUTORS_DIRECTORY: TutorProfile[] = [
  {
    id: "tut-1",
    name: "Dr. Babatunde Adeyemi",
    email: "b.adeyemi@tutorhive.ng",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    bio: "Senior Lecturer in Applied Mathematics with 14 years of tutoring experience. Specialized in WAEC Further Maths, JAMB UTME, and Tertiary Engineering Mathematics.",
    specialization: "Calculus, Differential Equations & JAMB Math",
    qualifications: "B.Sc. Mathematics (UNILAG), Ph.D. Applied Math (UI)",
    subjects: ["Mathematics", "Further Mathematics", "Engineering Math"],
    levels: ["Secondary (SS1-SS3)", "JAMB Prep", "Tertiary (100L-400L)"],
    hourlyRate: 8500,
    rating: 4.96,
    reviewCount: 48,
    totalStudentsTaught: 194,
    totalHoursTaught: 340,
    isVerified: true,
    availableDays: ["Monday", "Wednesday", "Friday", "Saturday"],
    location: "Lagos, Nigeria (Online Zoom/Meet)"
  },
  {
    id: "tut-2",
    name: "Amina Bello, M.Sc.",
    email: "amina.bello@tutorhive.ng",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    bio: "Industrial Chemist and STEM educator. Passionate about deconstructing Organic Chemistry mechanisms, Chemical Thermodynamics, and WAEC practical exam preparation.",
    specialization: "Organic & Physical Chemistry, WAEC Practical Prep",
    qualifications: "B.Sc. Industrial Chemistry (ABU Zaria), M.Sc. Chemistry (UNN)",
    subjects: ["Chemistry", "Organic Chemistry", "Secondary Science"],
    levels: ["Secondary (JSS-SSS)", "WAEC/NECO", "Tertiary (100L-200L)"],
    hourlyRate: 7000,
    rating: 4.92,
    reviewCount: 36,
    totalStudentsTaught: 142,
    totalHoursTaught: 215,
    isVerified: true,
    availableDays: ["Tuesday", "Thursday", "Saturday", "Sunday"],
    location: "Abuja, Nigeria (Online Zoom/Meet)"
  },
  {
    id: "tut-3",
    name: "Engr. Chinedu Okafor",
    email: "chinedu.okafor@tutorhive.ng",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    bio: "Electromechanical engineer and Physics tutor. Known for intuitive real-world demonstrations of Electromagnetism, Quantum concepts, and Newton Mechanics.",
    specialization: "Physics & Mechanics, Post-UTME Coaching",
    qualifications: "B.Eng. Electrical Engineering (FUTO), COREN Certified",
    subjects: ["Physics", "Applied Mechanics", "Basic Technology"],
    levels: ["Junior Secondary", "Senior Secondary", "Post-UTME"],
    hourlyRate: 7500,
    rating: 4.88,
    reviewCount: 29,
    totalStudentsTaught: 98,
    totalHoursTaught: 170,
    isVerified: true,
    availableDays: ["Monday", "Tuesday", "Thursday", "Friday"],
    location: "Port Harcourt, Nigeria (Online Zoom/Meet)"
  },
  {
    id: "tut-4",
    name: "Folashade Alabi",
    email: "f.alabi@tutorhive.ng",
    avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    bio: "English Language and Literature specialist. Expert in Lexis & Structure, Essay writing for WAEC/NECO, and JAMB Comprehension speed strategies.",
    specialization: "English Grammar, Literature & Essay Mastery",
    qualifications: "B.A. English (OAU Ile-Ife), Cambridge CELTA",
    subjects: ["English Language", "Literature-in-English", "Creative Writing"],
    levels: ["Primary (P4-P6)", "Secondary (JSS-SSS)", "JAMB Prep"],
    hourlyRate: 6000,
    rating: 4.95,
    reviewCount: 52,
    totalStudentsTaught: 210,
    totalHoursTaught: 380,
    isVerified: true,
    availableDays: ["Monday", "Wednesday", "Friday", "Saturday"],
    location: "Ibadan, Nigeria (Online Zoom/Meet)"
  }
];

export let TUTOR_APPLICATIONS: TutorApplication[] = [
  {
    id: "app-201",
    userId: "usr-guest-77",
    name: "Ibrahim Sani",
    email: "ibrahim.sani@gmail.com",
    phone: "+234 803 123 4567",
    specialization: "Computer Science & Python Coding",
    qualifications: "B.Sc. Computer Science (Bayero University Kano)",
    subjects: ["Computer Science", "Coding for Kids", "Data Processing"],
    experienceYears: 4,
    proposedHourlyRate: 6500,
    statementOfIntent: "I want to help Nigerian secondary and tertiary students build computational thinking and excel in their Computer Studies examinations.",
    status: "approved",
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString()
  }
];

export let TUTOR_BOOKINGS: TutorBooking[] = [
  {
    id: "book-1001",
    tutorId: "tut-1",
    tutorName: "Dr. Babatunde Adeyemi",
    tutorEmail: "b.adeyemi@tutorhive.ng",
    studentId: "std-hauwau",
    studentName: "Hauwau Usman",
    studentEmail: "hauwauusmankandarawa@gmail.com",
    subject: "JAMB Mathematics Prep",
    scheduledDate: "Tomorrow",
    timeSlot: "4:00 PM - 5:00 PM",
    durationMinutes: 60,
    totalAmount: 8500,
    tutorEarnings: 7225, // 85%
    platformCommission: 1275, // 15%
    status: "confirmed",
    meetingLink: "https://meet.google.com/hve-ttrh-abc",
    paymentReference: "TTR-BOOK-94021",
    notes: "Review differential calculus questions from past 5 years JAMB papers.",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  }
];
