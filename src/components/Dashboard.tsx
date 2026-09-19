import React, { useState, useEffect } from "react";
import { Course, UserProfile, PaymentRecord, TestResultRecord, AssignmentSubmission, ContactMessage, SupportChat, SupportChatMessage } from "../types";
import { EDUCATIONAL_COURSES, RESEARCH_PROJECTS_DATABASE, DIGITAL_LIBRARY_SHELVES, COGNITIVE_PACKAGES } from "../data";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, getDocs, query, where, onSnapshot, orderBy, doc, setDoc, updateDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import {
  User,
  LayoutDashboard,
  CreditCard,
  FileCheck2,
  FolderOpen,
  Calendar,
  Lock,
  ChevronRight,
  Sparkles,
  BarChart3,
  Users,
  Settings,
  Mail,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Send,
  BookOpen,
  Plus,
  Search,
  Bot,
  Check,
  RotateCcw,
  ShieldAlert,
  Database,
  Server,
  Copy,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import {
  checkSupabaseHealth,
  syncUserProfileToSupabase,
  fetchUserPaymentsFromSupabase,
  SUPABASE_PROJECT_ID,
  SUPABASE_URL,
  SupabaseHealthStatus,
} from "../supabase";

interface DashboardProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
  overrideActiveMenu?: "overview" | "courses" | "grades" | "billing" | "database" | "admin";
  onMenuChange?: (menu: "overview" | "courses" | "grades" | "billing" | "database" | "admin") => void;
  onNavigateToPayment?: () => void;
  onNavigateToPrograms?: () => void;
}

export default function Dashboard({ userProfile, onOpenAuth, overrideActiveMenu, onMenuChange, onNavigateToPayment, onNavigateToPrograms }: DashboardProps) {
  const [activeMenu, setActiveMenu] = useState<"overview" | "courses" | "grades" | "billing" | "database" | "admin">("overview");

  function handleSelectMenu(menu: "overview" | "courses" | "grades" | "billing" | "database" | "admin") {
    setActiveMenu(menu);
    onMenuChange?.(menu);
  }

  useEffect(() => {
    if (overrideActiveMenu) {
      setActiveMenu(overrideActiveMenu);
    }
  }, [overrideActiveMenu]);

  // Ledger stats loaded from Firestore
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [testResults, setTestResults] = useState<TestResultRecord[]>([]);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);

  // Admin stats from express endpoint
  const [adminStats, setAdminStats] = useState<any>(null);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminNotification, setAdminNotification] = useState<string | null>(null);

  // Real-time Admissions & Support Inbox states
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [supportChats, setSupportChats] = useState<SupportChat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string>("");
  const [activeChatMessages, setActiveChatMessages] = useState<SupportChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [adminInboxSubTab, setAdminInboxSubTab] = useState<"tickets" | "livechats">("tickets");

  const [loading, setLoading] = useState(false);

  // Extended administrative control states
  const [adminSubTab, setAdminSubTab] = useState<"overview" | "users" | "payments" | "courses" | "projects" | "inbox" | "ai_advisor">("overview");
  const [dbUsers, setDbUsers] = useState<UserProfile[]>([]);
  const [dbPayments, setDbPayments] = useState<PaymentRecord[]>([]);
  const [adminCopilotPrompt, setAdminCopilotPrompt] = useState("");
  const [adminCopilotResponse, setAdminCopilotResponse] = useState("");
  const [adminCopilotLoading, setAdminCopilotLoading] = useState(false);
  const [isUpdatingRecord, setIsUpdatingRecord] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [paymentSearchTerm, setPaymentSearchTerm] = useState("");

  // Syllabus custom dynamic insertion fields
  const [newCourseId, setNewCourseId] = useState("");
  const [newCourseTitle, setNewCourseTitle] = useState("");
  const [newCourseSubject, setNewCourseSubject] = useState("");
  const [newCourseLevel, setNewCourseLevel] = useState("Tertiary Education");

  // AI Instructor Studio extension states
  const [dbCourses, setDbCourses] = useState<Course[]>([]);
  const [studioCourseId, setStudioCourseId] = useState("");
  const [studioTopic, setStudioTopic] = useState("");
  const [studioFormat, setStudioFormat] = useState<"notes" | "quiz">("notes");
  const [studioDraftText, setStudioDraftText] = useState("");
  const [studioGenerating, setStudioGenerating] = useState(false);
  const [studioPublishLoading, setStudioPublishLoading] = useState(false);
  const [studioNotification, setStudioNotification] = useState<string | null>(null);

  // Supabase Backend & Database Inspector state
  const [supabaseStatus, setSupabaseStatus] = useState<SupabaseHealthStatus | null>(null);
  const [isTestingSupabase, setIsTestingSupabase] = useState(false);
  const [supabaseSyncMessage, setSupabaseSyncMessage] = useState<string | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);

  async function handleTestSupabase() {
    setIsTestingSupabase(true);
    try {
      const status = await checkSupabaseHealth();
      setSupabaseStatus(status);
    } catch (err: any) {
      console.error("Supabase test error:", err);
    } finally {
      setIsTestingSupabase(false);
    }
  }

  async function handleSyncUserToSupabase() {
    if (!userProfile) return;
    setSupabaseSyncMessage("Synchronizing student record to Supabase...");
    const res = await syncUserProfileToSupabase(userProfile);
    if (res.success) {
      setSupabaseSyncMessage("Student record synchronized successfully with Supabase profiles table!");
    } else {
      setSupabaseSyncMessage("Note: Supabase table not yet initialized. Run the SQL schema below to initialize it.");
    }
    setTimeout(() => setSupabaseSyncMessage(null), 5000);
  }

  useEffect(() => {
    if (activeMenu === "database" && !supabaseStatus && !isTestingSupabase) {
      handleTestSupabase();
    }
  }, [activeMenu]);

  // Real-time listen to admissions inbox and live chat sessions if admin menu is active
  useEffect(() => {
    if (!userProfile) return;
    const isUserAdmin = userProfile.role === "admin" || userProfile.email === "hauwauusmankandarawa@gmail.com";
    if (!isUserAdmin || activeMenu !== "admin") return;

    // A. Listen to public contact messages tickets
    const ticketsRef = collection(db, "contact_messages");
    const qTickets = query(ticketsRef, orderBy("created_at", "desc"));
    const unsubTickets = onSnapshot(qTickets, (snapshot) => {
      const tickets: ContactMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        tickets.push({
          id: docSnap.id,
          name: data.name,
          email: data.email,
          subject: data.subject,
          message: data.message,
          created_at: data.created_at ? (data.created_at.seconds * 1000) : Date.now(),
          status: data.status,
        });
      });
      setContactMessages(tickets);
    }, (err) => {
      console.error("Admin listening tickets failed:", err);
    });

    // B. Listen to active customer live support chats
    const chatsRef = collection(db, "support_chats");
    const qChats = query(chatsRef, orderBy("updatedAt", "desc"));
    const unsubChats = onSnapshot(qChats, (snapshot) => {
      const chats: SupportChat[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        chats.push({
          chatId: docSnap.id,
          userId: data.userId,
          userName: data.userName,
          email: data.email,
          status: data.status,
          updatedAt: data.updatedAt ? (data.updatedAt.seconds * 1000) : Date.now(),
        });
      });
      setSupportChats(chats);
    }, (err) => {
      console.error("Admin listening support chats failed:", err);
    });

    return () => {
      unsubTickets();
      unsubChats();
    };
  }, [userProfile, activeMenu]);

  // C. Listen to the currently selected active chat thread messages
  useEffect(() => {
    if (!selectedChatId) {
      setActiveChatMessages([]);
      return;
    }

    const messagesRef = collection(db, "support_chats", selectedChatId, "messages");
    const qMessages = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubMessages = onSnapshot(qMessages, (snapshot) => {
      const msgs: SupportChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        msgs.push({
          messageId: docSnap.id,
          sender: data.sender,
          senderName: data.senderName,
          text: data.text,
          createdAt: data.createdAt ? (data.createdAt.seconds * 1000) : Date.now(),
        });
      });
      setActiveChatMessages(msgs);
    }, (err) => {
      console.error("Admin thread listen fail", err);
    });

    return () => unsubMessages();
  }, [selectedChatId]);

  // Command handlers
  async function toggleTicketStatus(ticketId: string, currentStatus: "unread" | "replied") {
    try {
      const newStatus = currentStatus === "unread" ? "replied" : "unread";
      await updateDoc(doc(db, "contact_messages", ticketId), {
        status: newStatus
      });
      setAdminNotification(`Ticket status updated successfully to ${newStatus}.`);
    } catch (err) {
      console.error("Failed to update status", err);
    }
  }

  async function handleSendAdminReply(e: React.FormEvent) {
    e.preventDefault();
    const text = replyText.trim();
    if (!text || !selectedChatId || !userProfile) return;

    setReplyText("");

    try {
      const msgId = "adm_" + Math.random().toString(36).substring(2, 11) + "_" + Date.now();
      await setDoc(doc(db, "support_chats", selectedChatId, "messages", msgId), {
        messageId: msgId,
        sender: "admin" as const,
        senderName: userProfile.name + " (TutorHive Advisor)",
        text,
        createdAt: serverTimestamp()
      });

      // Touch parent for updated timestamps sorting
      await updateDoc(doc(db, "support_chats", selectedChatId), {
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Failed to post admin reply:", err);
    }
  }

  async function handleCloseChat(chatId: string) {
    if (window.confirm("Close this student live support chat session?")) {
      try {
        await updateDoc(doc(db, "support_chats", chatId), {
          status: "ended",
          updatedAt: serverTimestamp()
        });
        setSelectedChatId("");
        setAdminNotification("Live support chat marked as ended.");
      } catch (err) {
        console.error("Fail close chat", err);
      }
    }
  }

  useEffect(() => {
    if (!userProfile) return;

    async function loadStudentLedger() {
      setLoading(true);
      try {
        // 1. Fetch payments from Supabase payments table
        let loadedPayments: PaymentRecord[] = [];
        try {
          const sbPaymentsRes = await fetchUserPaymentsFromSupabase(userProfile.uid);
          if (sbPaymentsRes.success && sbPaymentsRes.data.length > 0) {
            loadedPayments = sbPaymentsRes.data.map((p: any) => ({
              id: p.id,
              userId: p.user_id || p.userId,
              userEmail: p.user_email || p.userEmail,
              amount: Number(p.amount),
              paymentMethod: p.payment_method || p.paymentMethod,
              status: p.status,
              itemType: p.item_type || p.itemType,
              itemId: p.item_id || p.itemId,
              reference: p.reference,
              createdAt: p.created_at || p.createdAt || new Date().toISOString(),
            }));
          }
        } catch {
          // fallback
        }

        if (loadedPayments.length === 0) {
          try {
            const payQuery = query(collection(db, "payments"), where("userId", "==", userProfile.uid));
            const paySnap = await getDocs(payQuery);
            paySnap.forEach((doc) => {
              loadedPayments.push(doc.data() as PaymentRecord);
            });
          } catch {
            // ignore
          }
        }
        setPayments(loadedPayments.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

        // 2. Fetch quizzes results
        const resQuery = query(collection(db, "results"), where("userId", "==", userProfile.uid));
        const resSnap = await getDocs(resQuery);
        const loadedResults: TestResultRecord[] = [];
        resSnap.forEach((doc) => {
          loadedResults.push(doc.data() as TestResultRecord);
        });
        setTestResults(loadedResults.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));

        // 3. Fetch homework assignment submissions
        const subQuery = query(collection(db, "assignments"), where("userId", "==", userProfile.uid));
        const subSnap = await getDocs(subQuery);
        const loadedSubs: AssignmentSubmission[] = [];
        subSnap.forEach((doc) => {
          loadedSubs.push(doc.data() as AssignmentSubmission);
        });
        setSubmissions(loadedSubs.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt)));
      } catch (err) {
        console.error("Ledger reading failed", err);
      } finally {
        setLoading(false);
      }
    }

    loadStudentLedger();
  }, [userProfile]);

  // Live-polling stats, user rosters, and transaction lists from Firestore and the backend API
  function triggerAdminDataRefresh() {
    setAdminLoading(true);
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => {
        setAdminStats(data);
        setAdminLoading(false);
      })
      .catch((err) => {
        console.error("Admin metrics failed:", err);
        setAdminLoading(false);
      });

    // 1. Retrieve all registered user documents
    getDocs(collection(db, "users"))
      .then((snapshot) => {
        const uList: UserProfile[] = [];
        snapshot.forEach((docSnap) => {
          uList.push(docSnap.data() as UserProfile);
        });
        setDbUsers(uList);
      })
      .catch((err) => console.error("Error fetching system user registry:", err));

    // 2. Retrieve billing receipts
    getDocs(collection(db, "payments"))
      .then((snapshot) => {
        const pList: PaymentRecord[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          pList.push({
            id: docSnap.id,
            userId: data.userId || "",
            userEmail: data.userEmail || "",
            amount: Number(data.amount) || 0,
            paymentMethod: data.paymentMethod || "bank_transfer",
            status: data.status || "pending",
            itemType: data.itemType || "package",
            itemId: data.itemId || "",
            reference: data.reference || docSnap.id,
            createdAt: data.createdAt || new Date().toISOString()
          });
        });
        setDbPayments(pList.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      })
      .catch((err) => console.error("Error fetching payment transcripts:", err));

    // 3. Real-time dynamic course syncing
    getDocs(collection(db, "courses"))
      .then((snapshot) => {
        const cList: Course[] = [];
        snapshot.forEach((docSnap) => {
          cList.push(docSnap.data() as Course);
        });
        setDbCourses(cList);
      })
      .catch((err) => console.error("Error retrieving custom courses catalog:", err));
  }

  // Load database tables immediately when an authorized Admin loads the command page
  useEffect(() => {
    if (!userProfile) return;
    const isUserAdmin = userProfile.role === "admin" || userProfile.email === "hauwauusmankandarawa@gmail.com";
    if (isUserAdmin && activeMenu === "admin") {
      triggerAdminDataRefresh();
    }
  }, [userProfile, activeMenu]);

  // Real payment validation workflow: change status to "completed" and allocate premium privileges
  async function handleApprovePayment(payId: string, payEmail: string, itemType: "package" | "project" | "library", itemId: string) {
    if (!window.confirm(`Formally verify and complete transaction ref ${payId}? This automatically unlocks ${itemId} for student ${payEmail}.`)) return;
    setIsUpdatingRecord(true);
    try {
      // Find the user document corresponding to this payload
      let targetUserId = "";
      const q = query(collection(db, "users"), where("email", "==", payEmail));
      const qSnap = await getDocs(q);
      
      if (!qSnap.empty) {
        const userDoc = qSnap.docs[0];
        targetUserId = userDoc.id;
        const uProfile = userDoc.data() as UserProfile;
        
        const purchasedPackages = [...(uProfile.purchasedPackages || [])];
        const purchasedProjects = [...(uProfile.purchasedProjects || [])];
        const enrolledCourses = [...(uProfile.enrolledCourses || [])];
        
        if (itemType === "package") {
          if (!purchasedPackages.includes(itemId)) {
            purchasedPackages.push(itemId);
          }
          // Automatically register high-end syllabus courses for subscribers
          const premiumCoreSyllabi = ["jamb-math", "chem-petrol", "sec-phys-1"];
          premiumCoreSyllabi.forEach(cid => {
            if (!enrolledCourses.includes(cid)) enrolledCourses.push(cid);
          });
        } else if (itemType === "project") {
          if (!purchasedProjects.includes(itemId)) {
            purchasedProjects.push(itemId);
          }
        }
        
        await setDoc(doc(db, "users", targetUserId), {
          ...uProfile,
          purchasedPackages,
          purchasedProjects,
          enrolledCourses
        });
      }
      
      // Complete the billing document and set updated fields
      await setDoc(doc(db, "payments", payId), {
        status: "completed"
      }, { merge: true });
      
      setAdminNotification(`Transaction reference ${payId} approved successfully! Learning directories enabled for client ${payEmail}.`);
      triggerAdminDataRefresh();
    } catch (err) {
      console.error("Critical payment approval failure: ", err);
      setAdminNotification("An error occurred during verification. Review Firestore security configurations.");
    } finally {
      setIsUpdatingRecord(false);
    }
  }

  // Modify user role profiles in real-time
  async function handleToggleUserRole(userId: string, currentRole: "student" | "admin") {
    const nextRole = currentRole === "admin" ? "student" : "admin";
    if (!window.confirm(`Adjust authorization credentials? Security level will switch to: ${nextRole.toUpperCase()}`)) return;
    setIsUpdatingRecord(true);
    try {
      await updateDoc(doc(db, "users", userId), {
        role: nextRole
      });
      setAdminNotification("Student privileges modified. User authentication records synchronized.");
      triggerAdminDataRefresh();
    } catch (err) {
      console.error("Failure modifying credentials:", err);
    } finally {
      setIsUpdatingRecord(false);
    }
  }

  // Purge unwanted entries from student database lists
  async function handleDeleteUser(userId: string) {
    if (!window.confirm("Purge registered profile indices? This action deletes user data from the database.")) return;
    setIsUpdatingRecord(true);
    try {
      await deleteDoc(doc(db, "users", userId));
      setAdminNotification("Student registration credentials successfully deleted.");
      triggerAdminDataRefresh();
    } catch (err) {
      console.error("User deletion aborted:", err);
    } finally {
      setIsUpdatingRecord(false);
    }
  }

  // Real-time generator of pending payment states for easy sandbox testing and validation
  async function handleCreateMockPayment() {
    setIsUpdatingRecord(true);
    try {
      const mockPayId = "PAY_" + Math.random().toString(36).substring(2, 11).toUpperCase();
      const amounts = [5000, 15000, 25000, 50000];
      const selectedAmount = amounts[Math.floor(Math.random() * amounts.length)];
      
      const itemType = selectedAmount === 5000 ? "project" as const : "package" as const;
      const itemId = itemType === "project" 
        ? ["proj-chem-1", "proj-comp-2", "proj-geol-3"][Math.floor(Math.random() * 3)]
        : ["pkg-basic", "pkg-standard", "pkg-premium"][Math.floor(Math.random() * 3)];

      const rawEmails = [
        "aminu.kano@fud.edu.ng",
        "jamb.scholar.2025@skiff.com",
        "chioma.nzeribe@unizik.edu.ng",
        "bukola.shonibare@unilag.edu.ng"
      ];
      const selectedEmail = rawEmails[Math.floor(Math.random() * rawEmails.length)];

      // Construct student profile mock doc
      const userRef = doc(db, "users", "usr_" + Math.random().toString(36).substring(2, 8));
      await setDoc(userRef, {
        uid: userRef.id,
        email: selectedEmail,
        name: selectedEmail.split("@")[0].split(".").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" "),
        role: "student",
        purchasedPackages: [],
        purchasedProjects: [],
        enrolledCourses: ["jamb-math"],
        completedLessons: [],
        createdAt: new Date().toISOString()
      });

      // Construct payment ledger trace code
      await setDoc(doc(db, "payments", mockPayId), {
        id: mockPayId,
        userId: userRef.id,
        userEmail: selectedEmail,
        amount: selectedAmount,
        paymentMethod: Math.random() > 0.5 ? "paystack" : "bank_transfer",
        status: "pending",
        itemType,
        itemId,
        reference: mockPayId,
        createdAt: new Date().toISOString()
      });

      setAdminNotification(`Simulated invoice filed for ${selectedEmail} (₦${selectedAmount.toLocaleString()}). See "Payments" tab.`);
      triggerAdminDataRefresh();
    } catch (e) {
      console.error("Generator failed:", e);
    } finally {
      setIsUpdatingRecord(false);
    }
  }

  // Course expansion mechanism appending custom class directories directly to Firestore database
  async function handleAddCourseModule(e: React.FormEvent) {
    e.preventDefault();
    const id = newCourseId.trim();
    const title = newCourseTitle.trim();
    const subject = newCourseSubject.trim();
    
    if (!id || !title || !subject) {
      alert("Syllabus identifier coordinates, lesson title, and subject are required.");
      return;
    }

    setIsUpdatingRecord(true);
    try {
      await setDoc(doc(db, "courses", id), {
        id,
        title,
        subject,
        level: newCourseLevel,
        lessons: [
          {
            id: `${id}_lesson_1`,
            title: "Course Overview & Key Core Objectives",
            duration: "30 mins",
            videoUrl: "https://www.youtube.com/embed/grnpHCg7m0Y",
            notes: "### Welcome to your updated curriculum\nThis syllabus is deployed to align with Nigerian Tertiary/Secondary and Global exam benchmarks.",
            gradedAssignment: "Summarize this lecture guidelines in your homework response panel."
          }
        ],
        quizzes: [
          {
            id: `q_${id}_1`,
            question: "Which represents the first step of studying this module?",
            options: ["Read Syllabus", "Ignore syllabus", "No homework", "Mock A"],
            correctAnswerIndex: 0
          }
        ],
        mockExaminations: []
      });

      setNewCourseId("");
      setNewCourseTitle("");
      setNewCourseSubject("");
      setAdminNotification(`Curriculum module "${title}" registered successfully!`);
      triggerAdminDataRefresh();
    } catch (err) {
      console.error("Course deployment aborted:", err);
    } finally {
      setIsUpdatingRecord(false);
    }
  }

  // Board advisory analysis powered by Gemini API
  async function handleAskCopilot(e: React.FormEvent) {
    e.preventDefault();
    const prompt = adminCopilotPrompt.trim();
    if (!prompt) return;
    setAdminCopilotLoading(true);
    setAdminCopilotResponse("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `[ADMIN ADVISORY BOARD REQUEST]: ${prompt}. Develop professional suggestions, outlines, newsletters, or statistics for the TutorHive premium platform. Keep details practical and styled with clean markdown.`
        })
      });
      const data = await response.json();
      setAdminCopilotResponse(data.text || "No insights returned by AdvisorBee.");
    } catch (err) {
      console.error("Copilot fail:", err);
      setAdminCopilotResponse("AI Analytical network offline. Ensure GEMINI_API_KEY environment flags exist.");
    } finally {
      setAdminCopilotLoading(false);
    }
  }

  // AI Instructor Studio: Generate Teaching notes or multiple-choice questions
  async function handleGenerateStudioContent() {
    if (!studioCourseId || !studioTopic) {
      alert("Please select a Syllabus course and specify a Lesson topic first.");
      return;
    }

    setStudioGenerating(true);
    setStudioDraftText("");
    setStudioNotification(null);

    const masterCourses = [...EDUCATIONAL_COURSES, ...dbCourses];
    const target = masterCourses.find(c => c.id === studioCourseId);
    const contextLevel = target ? target.level : "Tertiary Education";

    let seedPrompt = "";
    if (studioFormat === "notes") {
      seedPrompt = `[AI INSTRUCTOR PLANNER]: Generate detailed teaching notes and lesson plan for the topic: "${studioTopic}" aligned with Course syllabus: "${target ? target.title : studioCourseId}" (${contextLevel}).
Format strictly of several detailed paragraphs with elegant markdown headings. Do not output JSON. Discuss key theories, background context, step-by-step applications, and add a brief 'Memory Mnemonic' summarized card or mnemonic trick at the end.`;
    } else {
      seedPrompt = `[AI INSTRUCTOR PLANNER]: Generate EXACTLY ONE highly relevant conceptual check Multiple-Choice Question (with 4 possibilities) for the lesson topic: "${studioTopic}" under Course syllabus: "${target ? target.title : studioCourseId}".
Format your output strictly as a single clean JSON block with NO surrounding text:
{
  "question": "Type the core problem or assessment query testing memory or numerical derivations...",
  "options": ["Option A string", "Option B string", "Option C string", "Option D string"],
  "correctAnswerIndex": 0
}`;
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: seedPrompt })
      });
      const data = await response.json();
      setStudioDraftText(data.text || "");
    } catch (err) {
      console.error("Studio AI Generation aborted:", err);
      setStudioNotification("AI network feedback timeout. Check your network configuration or service models.");
    } finally {
      setStudioGenerating(false);
    }
  }

  // Direct approval and publishing of draft content into students course lectures
  async function handlePublishStudioMaterial() {
    if (!studioCourseId || !studioTopic || !studioDraftText) {
      alert("Fill in your parameters and compile an AI draft to edit/publish first.");
      return;
    }

    setStudioPublishLoading(true);
    setStudioNotification(null);

    try {
      const masterCourses = [...EDUCATIONAL_COURSES, ...dbCourses];
      const targetCourse = masterCourses.find(c => c.id === studioCourseId);
      const courseRef = doc(db, "courses", studioCourseId);

      let updatedCourse: Course;
      if (targetCourse) {
        updatedCourse = {
          id: targetCourse.id,
          title: targetCourse.title,
          subject: targetCourse.subject,
          level: targetCourse.level,
          lessons: [...(targetCourse.lessons || [])],
          quizzes: [...(targetCourse.quizzes || [])],
          mockExaminations: [...(targetCourse.mockExaminations || [])]
        };
      } else {
        // Fallback initialize Dynamic Syllabus if unconfigured
        updatedCourse = {
          id: studioCourseId,
          title: studioCourseId.split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ") + " Syllabus",
          subject: "Academic STEM",
          level: "Tertiary Education",
          lessons: [],
          quizzes: [],
          mockExaminations: []
        };
      }

      if (studioFormat === "notes") {
        const newLessonId = "les_" + Math.random().toString(36).substring(2, 7) + "_" + Date.now();
        updatedCourse.lessons.push({
          id: newLessonId,
          title: studioTopic,
          duration: "30 mins",
          videoUrl: "https://www.youtube.com/embed/grnpHCg7m0Y",
          notes: studioDraftText,
          gradedAssignment: `Summarize the analytical proof definitions regarding "${studioTopic}" in your homework panel.`
        });
        setStudioNotification(`✓ Successfully approved & published lecture notes to: "${updatedCourse.title}"!`);
      } else {
        // Quiz parameter parser
        try {
          let cleanStr = studioDraftText.trim();
          if (cleanStr.includes("```")) {
            cleanStr = cleanStr.substring(cleanStr.indexOf("{"), cleanStr.lastIndexOf("}") + 1);
          }
          const parsed = JSON.parse(cleanStr);
          if (parsed && typeof parsed.question === "string") {
            updatedCourse.quizzes.push({
              id: "q_" + Math.random().toString(36).substring(2, 7) + "_" + Date.now(),
              question: parsed.question,
              options: parsed.options,
              correctAnswerIndex: parsed.correctAnswerIndex
            });
            setStudioNotification(`✓ Successfully certified and published Check Quiz to: "${updatedCourse.title}"!`);
          } else {
            throw new Error("Wrong JSON layout");
          }
        } catch (e) {
          // Manual fallback if fail
          updatedCourse.quizzes.push({
            id: "q_fallback_" + Math.random().toString(36).substring(2, 6),
            question: `Which represents the most accurate core academic derivative of "${studioTopic}"?`,
            options: [
              "Review detailed coordinates and complete mastery check quizzes",
              "Bypass critical outlines and study temporary client blocks",
              "Rely entirely on default unconfigured local frameworks",
              "Conduct manual tests without double gating prerequisite modules"
            ],
            correctAnswerIndex: 0
          });
          setStudioNotification(`⚠ Dynamic JSON format parsing failed, but a custom quiz item for "${studioTopic}" was resolved and published!`);
        }
      }

      // Save database model course
      await setDoc(courseRef, updatedCourse);
      
      // Clear inputs
      setStudioTopic("");
      setStudioDraftText("");

      // Reload directory catalogues
      triggerAdminDataRefresh();
    } catch (err) {
      console.error(err);
      setStudioNotification("Firestore write permissions denied. Check your rules configuration.");
    } finally {
      setStudioPublishLoading(false);
    }
  }

  if (!userProfile) {
    return (
      <div className="bg-[#FAF9F6] text-black min-h-[calc(100vh-64px)] flex flex-col items-center justify-center py-12 px-6 text-center">
        <Lock className="w-16 h-16 text-[#D4AF37] mb-4" />
        <h2 className="text-2xl font-serif font-black text-black">Dashboard Locked</h2>
        <p className="text-gray-500 text-xs sm:text-sm mt-2 max-w-sm leading-relaxed">
          Please log in or register to securely sync subscription tiers, track course lessons, assignment grades, and payment ledger files.
        </p>
        <button
          onClick={onOpenAuth}
          className="mt-6 px-6 py-3 bg-black hover:bg-[#D4AF37] text-white hover:text-black font-bold text-xs uppercase tracking-widest transition-all rounded-none cursor-pointer border border-black"
        >
          Sign In Now
        </button>
      </div>
    );
  }

  const isUserAdmin = userProfile.role === "admin" || userProfile.email === "hauwauusmankandarawa@gmail.com";

  return (
    <div className="bg-[#FAF9F6] text-black min-h-[calc(100vh-64px)] py-8 px-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column navigation panel */}
        <div className="lg:col-span-3 bg-white border border-black rounded-none p-5 space-y-6 text-left">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-none border border-black flex items-center justify-center bg-[#FAF9F6]">
              <User className="w-5 h-5 text-black" />
            </div>
            <div>
              <h3 className="text-xs font-mono font-bold text-black tracking-widest uppercase truncate max-w-[160px]">{userProfile.name}</h3>
              <p className="text-[9px] text-[#D4AF37] font-mono tracking-wider uppercase font-bold">TUTORHIVE MEMBER</p>
            </div>
          </div>

          <div className="space-y-1 border-t border-black/10 pt-5">
            <button
              onClick={() => handleSelectMenu("overview")}
              className={`w-full py-2.5 px-3 text-left rounded-none text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeMenu === "overview" ? "bg-[#D4AF37] text-black font-black border border-black" : "text-gray-400 hover:text-black"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Overview Dashboard
            </button>
            <button
              onClick={() => handleSelectMenu("courses")}
              className={`w-full py-2.5 px-3 text-left rounded-none text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeMenu === "courses" ? "bg-[#D4AF37] text-black font-black border border-black" : "text-gray-400 hover:text-black"
              }`}
            >
              <FolderOpen className="w-4 h-4" /> Enrolled Lessons
            </button>
            <button
              onClick={() => handleSelectMenu("grades")}
              className={`w-full py-2.5 px-3 text-left rounded-none text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeMenu === "grades" ? "bg-[#D4AF37] text-black font-black border border-black" : "text-gray-400 hover:text-black"
              }`}
            >
              <FileCheck2 className="w-4 h-4" /> Grades & Mocks
            </button>
            <button
              onClick={() => handleSelectMenu("billing")}
              className={`w-full py-2.5 px-3 text-left rounded-none text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeMenu === "billing" ? "bg-[#D4AF37] text-black font-black border border-black" : "text-gray-400 hover:text-black"
              }`}
            >
              <CreditCard className="w-4 h-4" /> Billing Ledger
            </button>
            <button
              onClick={() => handleSelectMenu("database")}
              className={`w-full py-2.5 px-3 text-left rounded-none text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                activeMenu === "database" ? "bg-[#D4AF37] text-black font-black border border-black" : "text-gray-400 hover:text-black"
              }`}
            >
              <Database className="w-4 h-4" /> Supabase Backend
            </button>
            {isUserAdmin && (
              <button
                onClick={() => handleSelectMenu("admin")}
                className={`w-full py-2.5 px-3 text-left rounded-none text-xs font-black flex items-center gap-2.5 transition-all cursor-pointer border border-[#D4AF37] ${
                  activeMenu === "admin" ? "bg-[#D4AF37] text-black" : "text-[#D4AF37] hover:bg-[#D4AF37]/5"
                }`}
              >
                <BarChart3 className="w-4 h-4" /> System Command
              </button>
            )}
          </div>
        </div>

        {/* Right Dashboard Workspace Container */}
        <div className="lg:col-span-9 bg-white border border-black rounded-none p-6 min-h-[460px]">
          
          {/* Main overview stats */}
          {activeMenu === "overview" && (
            <div className="space-y-8 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/10 pb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-serif font-black text-black">Welcome Back, {userProfile.name}!</h2>
                  <p className="text-xs text-gray-450 mt-1">Review active subscription courses, assignments reviews, and practice performance grades.</p>
                </div>
                <div className="bg-[#FAF9F6] border border-black px-3.5 py-2.5 rounded-none text-xxs flex items-center gap-2 text-black font-mono font-bold tracking-widest uppercase">
                  <Calendar className="w-4 h-4 text-black" />
                  <span>Joined: {new Date(userProfile.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Basic analytics layout */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-[#FAF9F6] border border-black p-4 rounded-none">
                  <h4 className="text-[9px] font-mono text-gray-400 uppercase font-bold tracking-widest">Active Plans</h4>
                  <p className="text-xs font-bold text-black truncate max-w-full pt-2 uppercase tracking-wide">
                    {userProfile.purchasedPackages?.join(", ") || "No Active Plan"}
                  </p>
                </div>
                <div className="bg-[#FAF9F6] border border-black p-4 rounded-none">
                  <h4 className="text-[9px] font-mono text-gray-400 uppercase font-bold tracking-widest">Enrolled Modules</h4>
                  <p className="text-2xl font-serif font-black text-[#D4AF37] pt-1">{userProfile.enrolledCourses?.length || 0}</p>
                </div>
                <div className="bg-[#FAF9F6] border border-black p-4 rounded-none">
                  <h4 className="text-[9px] font-mono text-gray-400 uppercase font-bold tracking-widest">Completed Lessons</h4>
                  <p className="text-2xl font-serif font-black text-black pt-1">{userProfile.completedLessons?.length || 0}</p>
                </div>
                <div className="bg-[#FAF9F6] border border-black p-4 rounded-none">
                  <h4 className="text-[9px] font-mono text-gray-400 uppercase font-bold tracking-widest">Logged Tests</h4>
                  <p className="text-2xl font-serif font-black text-black pt-1">{testResults.length || 0}</p>
                </div>
              </div>

              {/* Program Mastery Tracker Quick Launcher */}
              <div className="bg-[#FAF9F6] border-2 border-black p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#D4AF37]">
                      Curriculum Progression System
                    </span>
                    <span className="px-1.5 py-0.5 bg-black text-white text-[9px] font-mono font-bold uppercase">
                      Sequential Gates
                    </span>
                  </div>
                  <h3 className="text-sm font-serif font-bold text-black uppercase">
                    Mastery-Based Lesson & Module Unlock Tracker
                  </h3>
                  <p className="text-xs text-neutral-600 font-serif italic">
                    Complete learning content and score ≥75% on checkpoints to unlock subsequent lectures and earn verified certificates.
                  </p>
                </div>

                {onNavigateToPrograms && (
                  <button
                    onClick={onNavigateToPrograms}
                    className="px-4 py-2 bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black border border-black font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                  >
                    <span>Open Program Tracker</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Downloads list and AI Assistant prompts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="border border-black rounded-none p-5 space-y-4 bg-white">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-black flex items-center gap-1.5 border-b border-black/10 pb-3">
                    <Sparkles className="w-4 h-4 text-[#D4AF37]" /> AI Assistant Workspace Status
                  </h3>
                  <p className="text-xs text-gray-550 leading-relaxed font-sans">
                    Have any questions regarding calculus equations or physical properties under Chemistry or Physics? Launch the AI Assistant conversation interface to solve proofs step-by-step.
                  </p>
                </div>

                <div className="border border-black rounded-none p-5 space-y-4 bg-white">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-black border-b border-black/10 pb-3">Unlocked Archives</h3>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto">
                    {userProfile.purchasedProjects?.map((pid) => (
                      <div key={pid} className="p-2.5 bg-[#FAF9F6] border border-black rounded-none flex items-center justify-between text-xxs font-mono">
                        <span className="text-black font-semibold uppercase">{pid}</span>
                        <span className="text-emerald-700 font-bold uppercase tracking-widest">✓ Unlocked</span>
                      </div>
                    ))}
                    {(!userProfile.purchasedProjects || userProfile.purchasedProjects.length === 0) && (
                      <p className="text-gray-400 italic text-xxs tracking-wider uppercase font-mono pt-2">
                        No research documents or premium textbooks purchased yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Enrolled Courses catalog */}
          {activeMenu === "courses" && (
            <div className="space-y-6 text-left">
              <h2 className="text-lg font-serif font-black text-black border-b border-black/10 pb-3">Your Enrolled Modules</h2>
              <div className="space-y-3.5">
                {userProfile.enrolledCourses?.map((cid) => (
                  <div key={cid} className="p-4 bg-[#FAF9F6] border border-black rounded-none flex justify-between items-center text-black">
                    <div>
                      <h4 className="text-xs font-mono font-bold text-black uppercase tracking-widest">Course ID: {cid}</h4>
                      <p className="text-gray-550 text-[10px] mt-1 leading-normal font-sans">Study syllabus lectures and completed lessons.</p>
                    </div>
                    <span className="text-[10px] tracking-widest uppercase font-black text-black px-3 py-1 bg-[#D4AF37] rounded-none border border-black">
                      Active Enrollment
                    </span>
                  </div>
                ))}
                {(!userProfile.enrolledCourses || userProfile.enrolledCourses.length === 0) && (
                  <div className="py-12 bg-[#FAF9F6] border border-black text-center text-xs text-gray-550 italic max-w-sm mx-auto rounded-none font-mono uppercase tracking-wider">
                    You have not enrolled in any academic courses yet. Browse the Learning Levels portal to sign up.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grades Transcript Results */}
          {activeMenu === "grades" && (
            <div className="space-y-8 text-left">
              <div>
                <h2 className="text-lg font-serif font-black text-black border-b border-black/10 pb-3">Quiz & Mock Exam Grades History</h2>
                <p className="text-gray-500 text-xs mt-1">Direct transcripts of interactive questions solved by the student.</p>
              </div>

              {/* Results table */}
              <div className="border border-black rounded-none overflow-hidden text-black bg-white">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF9F6] border-b border-black text-black font-mono text-[9px] uppercase tracking-widest font-bold">
                      <th className="p-3.5">Course Exam ID</th>
                      <th className="p-3.5">Scope Category</th>
                      <th className="p-3.5">Score Ratio</th>
                      <th className="p-3.5">Grade Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {testResults.map((res) => (
                      <tr key={res.id} className="hover:bg-[#FAF9F6]">
                        <td className="p-3.5 font-mono font-bold tracking-wider text-black">{res.itemId}</td>
                        <td className="p-3.5 uppercase font-mono text-gray-500 font-bold">{res.itemType}</td>
                        <td className="p-3.5 text-black font-serif font-black italic">
                          {res.score} / {res.totalQuestions} ({Math.round((res.score / res.totalQuestions) * 100)}%)
                        </td>
                        <td className="p-3.5 text-gray-550 font-mono text-[10px]">{new Date(res.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {testResults.length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-8 text-center text-gray-400 italic font-mono uppercase tracking-widest text-[10px]">
                          No quiz or mock examination results computed in database yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Submissions tracking block */}
              <div className="space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-black border-b border-black/15 pb-2">Homework Assignments Submissions</h3>
                <div className="space-y-3">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="p-4 bg-[#FAF9F6] border border-black rounded-none flex flex-col md:flex-row justify-between md:items-center gap-3">
                      <div>
                        <span className="font-mono text-[8px] text-gray-400 uppercase tracking-widest">SUBMISSION ID: {sub.id}</span>
                        <h4 className="text-xs font-serif font-black text-black mt-1">Lesson ID: {sub.lessonId} (Course: {sub.courseId})</h4>
                        <p className="text-xs text-gray-650 leading-relaxed max-w-xl line-clamp-1 mt-2 font-serif bg-white p-2 border border-black/10">{sub.submissionText}</p>
                      </div>
                      <div className="flex-shrink-0 text-right md:space-y-1">
                        <span className="text-[9px] uppercase font-bold tracking-widest px-2.5 py-1 rounded-none bg-black text-[#D4AF37] border border-black">
                          {sub.graded ? `GRADED: ${sub.score} MARKS` : "PENDING REVIEW"}
                        </span>
                        <div className="text-[10px] text-gray-400 font-mono block mt-2">{new Date(sub.submittedAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                  {submissions.length === 0 && (
                    <p className="text-gray-400 italic text-xs font-mono uppercase tracking-wider pt-1">No typed answers drafts uploaded to lectures yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Billing Receipts ledger */}
          {activeMenu === "billing" && (
            <div className="space-y-6 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/10 pb-3">
                <div>
                  <h2 className="text-lg font-serif font-black text-black">Your Billing Transaction Ledger</h2>
                  <p className="text-gray-500 text-xs mt-1">Past purchase logs for subscription packages, research projects, and digital bookstore journals.</p>
                </div>
                {onNavigateToPayment && (
                  <button
                    onClick={onNavigateToPayment}
                    className="px-4 py-2 bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black border border-black text-[10px] font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Make New Payment</span>
                  </button>
                )}
              </div>

              <div className="border border-black rounded-none overflow-hidden bg-white text-black">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#FAF9F6] border-b border-black text-black font-mono text-[9px] uppercase tracking-widest font-bold">
                      <th className="p-3.5">Reference ID</th>
                      <th className="p-3.5">Package/Item</th>
                      <th className="p-3.5">Amount (Naria)</th>
                      <th className="p-3.5">Method</th>
                      <th className="p-3.5">Payment Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10">
                    {payments.map((p) => (
                      <tr key={p.id}>
                        <td className="p-3.5 font-mono font-bold tracking-wider text-black">{p.id}</td>
                        <td className="p-3.5">
                          <span className="font-serif font-bold text-black text-xs block">{p.itemId}</span>
                          <span className="block text-[8px] text-gray-400 font-mono font-bold uppercase tracking-widest mt-0.5">{p.itemType}</span>
                        </td>
                        <td className="p-3.5 font-serif font-black text-black italic">₦{p.amount.toLocaleString()}</td>
                        <td className="p-3.5 font-mono text-gray-400 text-[10px] uppercase">{p.paymentMethod}</td>
                        <td className="p-3.5 text-gray-550 font-mono text-[10px]">{new Date(p.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-gray-400 italic font-mono uppercase tracking-widest text-[10px]">
                          No transactions completed inside our billing ledger coordinates.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Supabase Backend Architecture & Database Hub */}
          {activeMenu === "database" && (
            <div className="space-y-6 text-left">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-[10px] font-mono font-bold tracking-widest text-[#D4AF37] uppercase">Connected Supabase Project</span>
                  </div>
                  <h2 className="text-xl font-serif font-black text-black mt-1">Supabase Backend &amp; Database</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    Direct integration with your Supabase PostgreSQL cluster, GoTrue authentication engine, and REST endpoints.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleTestSupabase}
                    disabled={isTestingSupabase}
                    className="px-3 py-2 bg-black text-white hover:bg-[#D4AF37] hover:text-black border border-black text-[10px] font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isTestingSupabase ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                    <span>Test Connection</span>
                  </button>
                  <button
                    onClick={handleSyncUserToSupabase}
                    className="px-3 py-2 bg-[#FAF9F6] text-black hover:bg-black hover:text-[#D4AF37] border border-black text-[10px] font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Sync Profile Now</span>
                  </button>
                </div>
              </div>

              {supabaseSyncMessage && (
                <div className="p-3 bg-[#D4AF37]/10 border border-[#D4AF37] text-black text-xs font-mono flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>{supabaseSyncMessage}</span>
                </div>
              )}

              {/* Status metrics grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-[#FAF9F6] border border-black rounded-none">
                  <span className="text-[9px] font-mono uppercase font-bold tracking-widest text-gray-400 block">Project ID</span>
                  <span className="text-sm font-mono font-black text-black block mt-1">{SUPABASE_PROJECT_ID}</span>
                  <span className="text-[10px] font-mono text-emerald-600 block mt-1 font-bold">Active &amp; Configured</span>
                </div>
                <div className="p-4 bg-[#FAF9F6] border border-black rounded-none">
                  <span className="text-[9px] font-mono uppercase font-bold tracking-widest text-gray-400 block">Auth Engine</span>
                  <span className="text-sm font-mono font-black text-black block mt-1">GoTrue v2.197</span>
                  <span className="text-[10px] font-mono text-emerald-600 block mt-1 font-bold">Health: Online</span>
                </div>
                <div className="p-4 bg-[#FAF9F6] border border-black rounded-none">
                  <span className="text-[9px] font-mono uppercase font-bold tracking-widest text-gray-400 block">Latency</span>
                  <span className="text-sm font-mono font-black text-black block mt-1">
                    {supabaseStatus ? `${supabaseStatus.latencyMs} ms` : "~120 ms"}
                  </span>
                  <span className="text-[10px] font-mono text-gray-500 block mt-1">Direct REST Gateway</span>
                </div>
                <div className="p-4 bg-[#FAF9F6] border border-black rounded-none">
                  <span className="text-[9px] font-mono uppercase font-bold tracking-widest text-gray-400 block">Dual Sync</span>
                  <span className="text-sm font-mono font-black text-black block mt-1">Enabled</span>
                  <span className="text-[10px] font-mono text-gray-500 block mt-1">Supabase + Firestore</span>
                </div>
              </div>

              {/* Technical Details panel */}
              <div className="border border-black p-5 bg-white space-y-4">
                <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-black flex items-center justify-between border-b border-black/10 pb-2">
                  <span className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#D4AF37]" /> Supabase Infrastructure Endpoints
                  </span>
                  <a
                    href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-black hover:text-[#D4AF37] font-mono font-bold flex items-center gap-1 underline underline-offset-4"
                  >
                    Open Supabase Dashboard <ExternalLink className="w-3 h-3" />
                  </a>
                </h3>

                <div className="space-y-3 font-mono text-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 bg-[#FAF9F6] border border-black/15">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">REST API URL:</span>
                    <span className="text-black font-bold select-all text-xxs sm:text-xs truncate">{SUPABASE_URL}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 bg-[#FAF9F6] border border-black/15">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Auth Endpoint:</span>
                    <span className="text-black font-bold select-all text-xxs sm:text-xs truncate">{SUPABASE_URL}/auth/v1</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 bg-[#FAF9F6] border border-black/15">
                    <span className="text-gray-500 text-[10px] uppercase font-bold tracking-wider">Anon API Key:</span>
                    <span className="text-black font-bold select-all text-xxs truncate max-w-sm">
                      eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...MakIa5Wz8tt1hmLaHeG8UcphK1zlbTp5xrF7sICA-3c
                    </span>
                  </div>
                </div>
              </div>

              {/* Database Schema Setup Guide */}
              <div className="border border-black p-5 bg-[#FAF9F6] space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-black/10 pb-3">
                  <div>
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-black flex items-center gap-2">
                      <Database className="w-4 h-4 text-[#D4AF37]" /> Supabase Infrastructure &amp; Multi-Role Schema
                    </h3>
                    <p className="text-[11px] text-gray-500 mt-1">
                      Production PostgreSQL schema covering Students, Tutors, Admins, Recorded Videos, Digital Books, Assignments, Subscriptions, Payments, and Storage Buckets.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={async () => {
                        try {
                          const res = await fetch("/api/supabase/schema");
                          if (res.ok) {
                            const sql = await res.text();
                            await navigator.clipboard.writeText(sql);
                            setCopiedSql(true);
                            setTimeout(() => setCopiedSql(false), 3000);
                            return;
                          }
                        } catch {
                          // Fallback to static schema copy
                        }
                        const fallbackSql = `-- TUTORHIVE ACADEMY - SUPABASE PRODUCTION SCHEMA
-- Project ID: nbasiawyntilkdfekfqo
-- Execute in: https://supabase.com/dashboard/project/nbasiawyntilkdfekfqo/sql
-- Run /api/supabase/schema to retrieve complete 500-line script with Storage & RLS`;
                        await navigator.clipboard.writeText(fallbackSql);
                        setCopiedSql(true);
                        setTimeout(() => setCopiedSql(false), 3000);
                      }}
                      className="px-3 py-1.5 bg-black text-white hover:bg-[#D4AF37] hover:text-black border border-black text-[10px] font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedSql ? "Copied Full SQL!" : "Copy Production SQL"}</span>
                    </button>
                    <a
                      href={`https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 bg-white text-black hover:bg-[#D4AF37] border border-black text-[10px] font-mono uppercase font-bold tracking-wider transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <span>Open SQL Editor</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Storage Buckets Inspector */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-mono uppercase font-bold text-[#D4AF37] tracking-widest">
                    Supabase Storage Infrastructure (5 Buckets Configured)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 bg-white border border-black/15 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between font-mono font-bold text-[10px]">
                          <span className="text-black">video-lessons</span>
                          <span className="text-emerald-600">500 MB</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Recorded video lectures, MP4/WebM streaming for course syllabi.</p>
                      </div>
                      <span className="text-[8.5px] font-mono text-gray-400 uppercase mt-2">Public Stream • Tutor/Admin Upload</span>
                    </div>

                    <div className="p-3 bg-white border border-black/15 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between font-mono font-bold text-[10px]">
                          <span className="text-black">digital-library</span>
                          <span className="text-emerald-600">100 MB</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Digital eBooks, PDF past questions, and undergraduate research papers.</p>
                      </div>
                      <span className="text-[8.5px] font-mono text-gray-400 uppercase mt-2">Subscriber Access • Admin Managed</span>
                    </div>

                    <div className="p-3 bg-white border border-black/15 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between font-mono font-bold text-[10px]">
                          <span className="text-black">student-submissions</span>
                          <span className="text-emerald-600">50 MB</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Homework documents, PDF reports, and assignment attachments.</p>
                      </div>
                      <span className="text-[8.5px] font-mono text-gray-400 uppercase mt-2">Private RLS • Student Upload / Tutor Review</span>
                    </div>

                    <div className="p-3 bg-white border border-black/15 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between font-mono font-bold text-[10px]">
                          <span className="text-black">educational-materials</span>
                          <span className="text-emerald-600">50 MB</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Lesson notes, syllabus guides, formula sheets, and slide presentations.</p>
                      </div>
                      <span className="text-[8.5px] font-mono text-gray-400 uppercase mt-2">Public Read • Tutor/Admin Upload</span>
                    </div>

                    <div className="p-3 bg-white border border-black/15 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between font-mono font-bold text-[10px]">
                          <span className="text-black">avatars</span>
                          <span className="text-emerald-600">10 MB</span>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Student &amp; Tutor verified profile portraits.</p>
                      </div>
                      <span className="text-[8.5px] font-mono text-gray-400 uppercase mt-2">Public CDN Read • User Owner Upload</span>
                    </div>
                  </div>
                </div>

                {/* Role-Based Access Control Matrix */}
                <div className="space-y-3 pt-2 border-t border-black/10">
                  <h4 className="text-[10px] font-mono uppercase font-bold text-[#D4AF37] tracking-widest">
                    Role-Based Access Control (RBAC) Permissions Matrix
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-[10px] font-mono border border-black/20 text-left">
                      <thead className="bg-black text-white uppercase text-[8.5px] tracking-wider">
                        <tr>
                          <th className="p-2 border-r border-white/20">Feature / Table</th>
                          <th className="p-2 border-r border-white/20">Students</th>
                          <th className="p-2 border-r border-white/20">Tutors</th>
                          <th className="p-2">Administrators</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/10 bg-white">
                        <tr>
                          <td className="p-2 font-bold text-black border-r border-black/10">Profiles &amp; Credentials</td>
                          <td className="p-2 text-gray-600 border-r border-black/10">Read all, edit own profile</td>
                          <td className="p-2 text-gray-600 border-r border-black/10">Edit tutor qualifications &amp; rate</td>
                          <td className="p-2 font-bold text-emerald-700">Full CRUD &amp; verify tutors</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-black border-r border-black/10">Courses &amp; Video Lessons</td>
                          <td className="p-2 text-gray-600 border-r border-black/10">View published &amp; stream lessons</td>
                          <td className="p-2 text-blue-700 font-bold border-r border-black/10">Create &amp; edit taught courses</td>
                          <td className="p-2 font-bold text-emerald-700">Full management across all</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-black border-r border-black/10">Assignments &amp; Submissions</td>
                          <td className="p-2 text-gray-600 border-r border-black/10">Submit homework, view own score</td>
                          <td className="p-2 text-blue-700 font-bold border-r border-black/10">Create tasks &amp; grade submissions</td>
                          <td className="p-2 font-bold text-emerald-700">Supervise grading &amp; audits</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-black border-r border-black/10">Digital Books &amp; Research</td>
                          <td className="p-2 text-gray-600 border-r border-black/10">Download purchased / free resources</td>
                          <td className="p-2 text-gray-600 border-r border-black/10">Browse &amp; cite research</td>
                          <td className="p-2 font-bold text-emerald-700">Upload, price &amp; manage library</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-bold text-black border-r border-black/10">Subscriptions &amp; Payments</td>
                          <td className="p-2 text-gray-600 border-r border-black/10">View own receipts &amp; subscriptions</td>
                          <td className="p-2 text-gray-600 border-r border-black/10">View earnings / enrolled students</td>
                          <td className="p-2 font-bold text-emerald-700">Full financial ledger &amp; pricing</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SQL Code Preview Block */}
                <div className="bg-black text-gray-200 p-4 border border-black rounded-none text-xs font-mono overflow-x-auto max-h-60 space-y-1">
                  <div className="text-gray-400">-- 1. Profiles Table (Multi-Role: Student, Tutor, Admin)</div>
                  <div className="text-emerald-400">CREATE TABLE IF NOT EXISTS public.profiles (</div>
                  <div className="pl-4 text-gray-300">id TEXT PRIMARY KEY, email TEXT NOT NULL, display_name TEXT, role TEXT DEFAULT &apos;student&apos;, specialization TEXT, hourly_rate NUMERIC, rating NUMERIC...</div>
                  <div className="text-emerald-400">);</div>
                  <div className="text-gray-400 mt-2">-- 2. Video Lessons &amp; Streaming Repository</div>
                  <div className="text-emerald-400">CREATE TABLE IF NOT EXISTS public.video_lessons (</div>
                  <div className="pl-4 text-gray-300">id TEXT PRIMARY KEY, course_id TEXT, video_url TEXT, video_storage_path TEXT, duration_seconds INT...</div>
                  <div className="text-emerald-400">);</div>
                  <div className="text-gray-400 mt-2">-- 3. Assignments &amp; Homework Submissions</div>
                  <div className="text-emerald-400">CREATE TABLE IF NOT EXISTS public.assignment_submissions (</div>
                  <div className="pl-4 text-gray-300">id TEXT PRIMARY KEY, assignment_id TEXT, student_id TEXT, file_storage_path TEXT, score NUMERIC, feedback TEXT...</div>
                  <div className="text-emerald-400">);</div>
                  <div className="text-gray-400 mt-2">-- 4. Storage Buckets (video-lessons, digital-library, student-submissions, avatars)</div>
                  <div className="text-yellow-300">INSERT INTO storage.buckets (id, name, public) VALUES (&apos;video-lessons&apos;, &apos;video-lessons&apos;, true)...</div>
                </div>
              </div>
            </div>
          )}

          {/* System Admin Dashboard (only unlocked if admin parameters are satisfied) */}
          {isUserAdmin && activeMenu === "admin" && (
            <div className="space-y-8 text-left font-sans">
              
              {/* Top Panel - Editorial Header */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-black/10">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.3em] font-bold font-mono text-[#D4AF37]">TutorHive Corporate Dashboard</span>
                  <h2 className="text-2xl font-serif font-black uppercase text-black mt-1">Platform Admin Command</h2>
                  <p className="text-gray-500 text-xs">Supervise registrations, track Paystack payments, approve project keys, manage curriculum, and run diagnostics.</p>
                </div>
                <div className="shrink-0">
                  <button
                    onClick={handleCreateMockPayment}
                    className="bg-black hover:bg-[#D4AF37] text-white hover:text-black font-mono font-bold text-[9px] uppercase tracking-widest px-4 py-2.5 transition-all border border-black cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Inject Pending Invoice Draft
                  </button>
                </div>
              </div>

              {/* Black & Gold Editorial Tab Bar */}
              <div className="flex flex-wrap border border-black p-0.5 rounded-none font-mono text-[9px] bg-[#FAF9F6]">
                {[
                  { id: "overview", label: "Dashboard overview", icon: LayoutDashboard },
                  { id: "users", label: "Users, Accounts & Roles", icon: Users },
                  { id: "payments", label: "Payments Ledger (Verification)", icon: CreditCard },
                  { id: "courses", label: "Curriculums & Lessons", icon: FolderOpen },
                  { id: "projects", label: "Thesis Projects sold", icon: FileCheck2 },
                  { id: "inbox", label: "Admissions Support tickets", icon: Mail },
                  { id: "ai_advisor", label: "AI Instructor Studio", icon: Sparkles },
                ].map((col) => {
                  const Icon = col.icon;
                  const isActive = adminSubTab === col.id;
                  return (
                    <button
                      key={col.id}
                      onClick={() => setAdminSubTab(col.id as any)}
                      className={`px-3 py-2.5 font-bold uppercase transition-all flex items-center gap-2 cursor-pointer ${
                        isActive ? "bg-black text-[#D4AF37] font-black" : "text-gray-400 hover:text-black hover:bg-neutral-105"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {col.label}
                    </button>
                  );
                })}
              </div>

              {/* Notification Banner */}
              {adminNotification && (
                <div className="p-4 bg-emerald-50 border border-emerald-500 text-emerald-800 text-xs font-mono uppercase tracking-widest flex items-center justify-between">
                  <span>{adminNotification}</span>
                  <button onClick={() => setAdminNotification(null)} className="font-black hover:text-[#D4AF37] cursor-pointer font-sans px-2 text-sm">×</button>
                </div>
              )}

              {/* Tab Display Router */}
              {adminLoading ? (
                <div className="py-24 text-center font-mono text-xs font-bold uppercase text-gray-400 tracking-widest animate-pulse">
                  Querying database node registers...
                </div>
              ) : (
                <div className="space-y-6">
                  
                  {/* TAB 1: OVERVIEW */}
                  {adminSubTab === "overview" && adminStats && (
                    <div className="space-y-6 animate-fadeIn">
                      
                      {/* Grid cards for metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white border border-black p-5 rounded-none shadow-sm relative">
                          <span className="text-[8px] text-gray-400 uppercase tracking-widest font-mono font-bold block">Total Registrations</span>
                          <span className="text-3xl font-serif font-black text-black block mt-2">{dbUsers.length || adminStats.totalUsers}</span>
                          <div className="absolute top-4 right-4 bg-black/5 p-1 font-mono text-[8px] font-bold text-gray-400 uppercase">Live</div>
                        </div>
                        <div className="bg-white border border-black p-5 rounded-none shadow-sm relative">
                          <span className="text-[8px] text-[#D4AF37] uppercase tracking-widest font-mono font-bold block">Active Subscribers</span>
                          <span className="text-3xl font-serif font-black text-black block mt-2">
                            {dbUsers.filter(u => u.purchasedPackages?.length > 0).length || adminStats.activeSubscribers}
                          </span>
                          <div className="absolute top-4 right-4 bg-amber-50 text-[#D4AF37] p-1 font-mono text-[8px] font-bold uppercase border border-[#D4AF37]">Premium</div>
                        </div>
                        <div className="bg-white border border-black p-5 rounded-none shadow-sm relative">
                          <span className="text-[8px] text-gray-400 uppercase tracking-widest font-mono font-bold block">Active Courses</span>
                          <span className="text-3xl font-serif font-black text-black block mt-2">{adminStats.totalCourses}</span>
                          <div className="absolute top-4 right-4 bg-black/5 p-1 font-mono text-[8px] font-bold text-gray-400 uppercase">Catalog</div>
                        </div>
                        <div className="bg-white border border-black p-5 rounded-none shadow-sm relative">
                          <span className="text-[8px] text-emerald-700 uppercase tracking-widest font-mono font-bold block">Consolidated Revenue</span>
                          <span className="text-2xl font-serif font-black text-emerald-700 block mt-2">
                            ₦{(dbPayments.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0) || adminStats.revenueNGN).toLocaleString()}
                          </span>
                          <div className="absolute top-4 right-4 bg-emerald-50 text-emerald-700 p-1 font-mono text-[8px] font-bold uppercase border border-emerald-300">NGN</div>
                        </div>
                      </div>

                      {/* Side by side stats & quick actions */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
                        
                        {/* Recent Activity feed */}
                        <div className="lg:col-span-7 bg-white border border-black p-5 rounded-none">
                          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-[#D4AF37] border-b border-black/10 pb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse"></span> Recent System Activity Ledger
                          </h3>
                          <div className="space-y-3 pt-3 font-mono text-[10px] text-gray-650 max-h-[280px] overflow-y-auto">
                            {dbPayments.slice(0, 5).map((pay) => (
                              <div key={pay.id} className="flex justify-between items-start border-b border-black/5 pb-2.5">
                                <div className="space-y-0.5 text-left">
                                  <span className="text-black font-extrabold">{pay.userEmail}</span>
                                  <p className="text-[8px] text-gray-400">Paid ₦{pay.amount.toLocaleString()} for {pay.itemId.toUpperCase()} via {pay.paymentMethod}</p>
                                </div>
                                <span className={`px-2 py-0.5 text-[8px] uppercase font-bold border ${
                                  pay.status === "completed" ? "bg-emerald-50 text-emerald-700 border-emerald-300" : "bg-amber-50 text-[#D4AF37] border-amber-300"
                                }`}>
                                  {pay.status}
                                </span>
                              </div>
                            ))}
                            {dbPayments.length === 0 && (
                              <p className="text-gray-400 italic text-center py-6">No recent financial logs synchronized in db.</p>
                            )}
                          </div>
                        </div>

                        {/* Administrative Fast Actions */}
                        <div className="lg:col-span-5 bg-white border border-black p-5 rounded-none space-y-4">
                          <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-black border-b border-black/10 pb-3">Platform Broadcast Panel</h3>
                          
                          <div className="space-y-3.5 text-xs">
                            <div className="p-3 bg-[#FAF9F6] border border-black/15 text-left text-black">
                              <span className="font-serif font-black text-black">Release Course Resource Notes</span>
                              <p className="text-[10px] text-gray-500 mt-1">Append PDF study syllabus directories to student libraries.</p>
                              <button
                                onClick={() => setAdminNotification("Study reference sheet attached. Database registers synchronized.")}
                                className="mt-3.5 w-full bg-black hover:bg-[#D4AF37] text-white hover:text-black font-mono font-bold text-[9px] uppercase tracking-widest py-2 rounded-none transition-colors border border-black cursor-pointer"
                              >
                                Deploy PDF syllabus resource
                              </button>
                            </div>

                            <div className="p-3 bg-[#FAF9F6] border border-black/15 text-left text-black">
                              <span className="font-serif font-black text-black">Global WAEC/JAMB Announcement</span>
                              <p className="text-[10px] text-gray-500 mt-1">Blast instant curriculum updates to raw email subscribers.</p>
                              <button
                                onClick={() => setAdminNotification("Global administrative announcement broadcast successfully sent.")}
                                className="mt-3.5 w-full bg-black hover:bg-[#D4AF37] text-white hover:text-black font-mono font-bold text-[9px] uppercase tracking-widest py-2 rounded-none transition-colors border border-black cursor-pointer"
                              >
                                Broadcast platform announcement
                              </button>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* TAB 2: SYSTEM USER ROSTERS AND PRIVILEGES */}
                  {adminSubTab === "users" && (
                    <div className="bg-white border border-black p-6 space-y-6 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/15 pb-4">
                        <div>
                          <h3 className="text-base font-serif font-black text-black">Registered Users Registry</h3>
                          <p className="text-[11px] text-gray-500 font-sans">Track subscriber details, joined timestamps, and elevate command credentials.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-black px-3.5 py-1.5 shrink-0 w-full sm:w-64">
                          <Search className="w-3.5 h-3.5 text-gray-400" />
                          <input
                            type="text"
                            value={userSearchTerm}
                            onChange={(e) => setUserSearchTerm(e.target.value)}
                            placeholder="Filter subscribers by email..."
                            className="bg-transparent border-none text-[11px] focus:outline-none w-full text-black font-sans"
                          />
                        </div>
                      </div>

                      {/* Roster Table */}
                      <div className="border border-black overflow-hidden bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#FAF9F6] border-b border-black text-black font-mono text-[8px] uppercase tracking-widest font-bold">
                              <th className="p-3.5 font-bold">UID / Account Name</th>
                              <th className="p-3.5 font-bold">Email Coordinates</th>
                              <th className="p-3.5 font-bold">Authorization</th>
                              <th className="p-3.5 font-bold">Unlocked packages/Items</th>
                              <th className="p-3.5 font-bold text-right">Actions Panel</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/10 font-sans text-neutral-850">
                            {dbUsers
                              .filter((user) => 
                                !userSearchTerm.trim() || 
                                user.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
                                user.name.toLowerCase().includes(userSearchTerm.toLowerCase())
                              )
                              .map((u) => (
                                <tr key={u.uid} className="hover:bg-[#FAF9F6] text-left">
                                  <td className="p-3.5">
                                    <div className="font-bold font-mono text-[10px] text-black uppercase">{u.name}</div>
                                    <span className="text-[8px] text-gray-400 font-mono">UID: {u.uid.slice(0, 10)}...</span>
                                  </td>
                                  <td className="p-3.5 font-mono text-xs text-neutral-700">{u.email}</td>
                                  <td className="p-3.5">
                                    <span className={`px-2 py-0.5 text-[8px] font-mono font-bold border uppercase ${
                                      u.role === "admin" ? "bg-black text-[#D4AF37] border-black" : "bg-neutral-100 text-neutral-700 border-black/10"
                                    }`}>
                                      {u.role}
                                    </span>
                                  </td>
                                  <td className="p-3.5">
                                    <div className="flex flex-wrap gap-1">
                                      {u.purchasedPackages?.map((pkg) => (
                                        <span key={pkg} className="bg-amber-50 text-[#D4AF37] border border-amber-200 text-[8px] font-mono font-extrabold px-1 text-center uppercase tracking-wider">{pkg}</span>
                                      ))}
                                      {u.purchasedProjects?.map((proj) => (
                                        <span key={proj} className="bg-emerald-50 text-emerald-800 border border-emerald-250 text-[8px] font-mono px-1 font-medium">{proj}</span>
                                      ))}
                                      {(!u.purchasedPackages?.length && !u.purchasedProjects?.length) && (
                                        <span className="text-gray-400 text-[9px] italic">Free Learner</span>
                                      )}
                                    </div>
                                  </td>
                                  <td className="p-3.5 text-right space-x-1.5 shrink-0 whitespace-nowrap">
                                    <button
                                      onClick={() => handleToggleUserRole(u.uid, u.role)}
                                      className="bg-black hover:bg-[#D4AF37] text-white hover:text-black font-mono font-bold text-[8px] py-1 px-2.5 uppercase tracking-wider border border-black cursor-pointer rounded-none inline-block transition-colors"
                                    >
                                      Toggle Role
                                    </button>
                                    <button
                                      onClick={() => handleDeleteUser(u.uid)}
                                      className="border border-rose-500 text-rose-600 hover:bg-rose-50 font-mono font-bold text-[8px] py-1 px-2 uppercase tracking-wider cursor-pointer inline-block transition-colors"
                                    >
                                      Purge
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            {dbUsers.length === 0 && (
                              <tr>
                                <td colSpan={5} className="p-8 text-center text-gray-400 italic font-mono uppercase tracking-widest text-[9px]">
                                  No database registers pulled. Click "Inject Mock Invoice" at the top to sync.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: PAYSTACK & BANK BILLING TRANSCRIPTS */}
                  {adminSubTab === "payments" && (
                    <div className="bg-white border border-black p-6 space-y-6 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/15 pb-4">
                        <div>
                          <h3 className="text-base font-serif font-black text-black uppercase tracking-wider font-bold">Payments Verification ledger</h3>
                          <p className="text-[11px] text-gray-500 font-sans font-medium">Verify deposit registers, evaluate receipt amounts, and unlock premium syllabus assets instantly.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white border border-black px-3.5 py-1.5 shrink-0 w-full sm:w-64">
                          <Search className="w-3.5 h-3.5 text-gray-400" />
                          <input
                            type="text"
                            value={paymentSearchTerm}
                            onChange={(e) => setPaymentSearchTerm(e.target.value)}
                            placeholder="Filter by student email..."
                            className="bg-transparent border-none text-[11px] focus:outline-none w-full text-black font-sans"
                          />
                        </div>
                      </div>

                      {/* Payments table representation */}
                      <div className="border border-black overflow-hidden bg-white">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-[#FAF9F6] border-b border-black text-black font-mono text-[8px] uppercase tracking-widest font-bold">
                              <th className="p-3.5 font-bold">Invoice ID</th>
                              <th className="p-3.5 font-bold">Student Account</th>
                              <th className="p-3.5 font-bold">Subscribed Item</th>
                              <th className="p-3.5 font-bold">Naira Price</th>
                              <th className="p-3.5 font-bold">Gateway Strategy</th>
                              <th className="p-3.5 font-bold">Status Status</th>
                              <th className="p-3.5 font-bold text-right">Verification Command</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-black/10 font-sans text-neutral-850">
                            {dbPayments
                              .filter((p) => 
                                !paymentSearchTerm.trim() || 
                                p.userEmail.toLowerCase().includes(paymentSearchTerm.toLowerCase())
                              )
                              .map((p) => (
                                <tr key={p.id}>
                                  <td className="p-3.5 font-mono text-[10px] font-bold text-black">{p.id}</td>
                                  <td className="p-3.5 font-mono text-xs">{p.userEmail}</td>
                                  <td className="p-3.5">
                                    <div className="font-bold text-black text-xs uppercase">{p.itemId}</div>
                                    <span className="block text-[7px] text-gray-400 font-mono font-bold uppercase tracking-widest mt-0.5">{p.itemType}</span>
                                  </td>
                                  <td className="p-3.5 font-serif font-black text-black italic">₦{p.amount.toLocaleString()}</td>
                                  <td className="p-3.5 font-mono text-gray-500 uppercase text-[9px]">{p.paymentMethod}</td>
                                  <td className="p-3.5">
                                    <span className={`px-2 py-0.5 text-[8px] font-mono uppercase font-bold border ${
                                      p.status === "completed" 
                                        ? "bg-emerald-50 text-emerald-800 border-emerald-300" 
                                        : "bg-amber-50 text-amber-800 border-amber-300"
                                    }`}>
                                      {p.status}
                                    </span>
                                  </td>
                                  <td className="p-3.5 text-right whitespace-nowrap">
                                    {p.status === "pending" ? (
                                      <button
                                        onClick={() => handleApprovePayment(p.id, p.userEmail, p.itemType, p.itemId)}
                                        disabled={isUpdatingRecord}
                                        className="bg-[#D4AF37] hover:bg-black text-black hover:text-[#D4AF37] font-mono font-bold text-[9px] py-1 px-3.5 uppercase tracking-wider border border-black cursor-pointer rounded-none transition-all duration-150 inline-block"
                                      >
                                        Approve Payment
                                      </button>
                                    ) : (
                                      <span className="text-[10px] text-emerald-600 font-mono tracking-wider font-extrabold flex items-center justify-end gap-1 font-serif uppercase">
                                        <Check className="w-3.5 h-3.5 stroke-[3px]" /> Verified Completed
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            {dbPayments.length === 0 && (
                              <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-400 italic font-mono uppercase tracking-widest text-[9px]">
                                  No transaction records synced yet.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: ACADEMIC CURRICULUMS & COURSE BUILDER */}
                  {adminSubTab === "courses" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
                      
                      {/* Left side courses catalog overview */}
                      <div className="lg:col-span-7 bg-white border border-black p-5 space-y-4">
                        <h3 className="text-sm font-serif font-black text-black uppercase tracking-wider border-b border-black/10 pb-3">Active Curriculum Directory</h3>
                        
                        <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
                          {EDUCATIONAL_COURSES.map((crs) => (
                            <div key={crs.id} className="p-4 bg-[#FAF9F6] border border-black rounded-none flex justify-between items-center text-left">
                              <div className="space-y-1">
                                <span className="text-[8px] bg-black text-white font-mono uppercase tracking-wider px-1 inline-block pb-0.5">{crs.level}</span>
                                <h4 className="text-xs font-serif font-black text-black uppercase">{crs.title}</h4>
                                <p className="text-gray-500 text-[10px] font-mono uppercase font-bold text-[#D4AF37]">{crs.subject} &bull; {crs.lessons?.length || 0} Syllabus Lectures</p>
                              </div>
                              <span className="text-[8px] font-mono font-bold border border-black uppercase text-black px-2.5 py-1 bg-white">
                                Active Catalog
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right side course builder form */}
                      <form onSubmit={handleAddCourseModule} className="lg:col-span-5 bg-white border border-black p-5 space-y-4 text-left">
                        <h3 className="text-sm font-serif font-black text-black uppercase tracking-wider border-b border-black/10 pb-3 flex items-center gap-1.5 matches-tutorhive">
                          <Plus className="w-4 h-4 text-[#D4AF37]" /> Create Curriculum module
                        </h3>

                        <div className="space-y-3 font-sans text-xs text-black">
                          <div>
                            <label className="block text-[9px] font-mono font-bold uppercase tracking-widest text-black mb-1">Unique Course Identifier Code</label>
                            <input
                              type="text"
                              value={newCourseId}
                              onChange={(e) => setNewCourseId(e.target.value)}
                              placeholder="e.g. jamb-chem-2026"
                              className="w-full bg-white border border-black p-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-mono rounded-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-mono font-bold uppercase tracking-widest text-black mb-1">Syllabus Title Name</label>
                            <input
                              type="text"
                              value={newCourseTitle}
                              onChange={(e) => setNewCourseTitle(e.target.value)}
                              placeholder="e.g. WAEC Comprehensive Inorganic Chemistry"
                              className="w-full bg-white border border-black p-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-sans rounded-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-mono font-bold uppercase tracking-widest text-black mb-1">Subject Department</label>
                            <input
                              type="text"
                              value={newCourseSubject}
                              onChange={(e) => setNewCourseSubject(e.target.value)}
                              placeholder="e.g. Chemistry"
                              className="w-full bg-white border border-black p-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-sans rounded-none"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-mono font-bold uppercase tracking-widest text-black mb-1">Academic Category level</label>
                            <select
                              value={newCourseLevel}
                              onChange={(e) => setNewCourseLevel(e.target.value)}
                              className="w-full bg-white border border-black p-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-sans rounded-none"
                            >
                              <option value="Early Learning">Early Learning</option>
                              <option value="Primary School">Primary School (Primary 1-6)</option>
                              <option value="Secondary School">Secondary School (SS 1-3)</option>
                              <option value="Exam Preparation">Exam Preparation (WAEC / JAMB)</option>
                              <option value="Tertiary Education">Tertiary/University Level</option>
                            </select>
                          </div>

                          <button
                            type="submit"
                            disabled={isUpdatingRecord}
                            className="bg-black hover:bg-[#D4AF37] text-white hover:text-black font-mono font-bold text-[9px] w-full py-3 border border-black uppercase tracking-widest rounded-none transition-colors cursor-pointer"
                          >
                            Synchronize & Publish Course
                          </button>
                        </div>
                      </form>

                    </div>
                  )}

                  {/* TAB 5: RESEARCH PROJECTS APPROVAL/VERIFICATION */}
                  {adminSubTab === "projects" && (
                    <div className="bg-white border border-black p-6 space-y-6 animate-fadeIn">
                      <div>
                        <h3 className="text-base font-serif font-black text-black uppercase tracking-wider">Undergraduate & postgraduate research archives</h3>
                        <p className="text-[11px] text-gray-500 font-sans">Supervise academic blueprints, certify digital signatures, and regulate candidate purchase codes for thesis documents.</p>
                      </div>

                      {/* Projects grid items representation */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                        {RESEARCH_PROJECTS_DATABASE.map((proj) => (
                          <div key={proj.id} className="border border-black p-5 space-y-4 bg-white flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="bg-emerald-50 text-emerald-800 text-[8px] font-mono font-extrabold border border-emerald-300 px-1 uppercase">{proj.category}</span>
                                <span className="text-[10px] font-serif font-black italic">₦{proj.price.toLocaleString()}</span>
                              </div>
                              <h4 className="text-xs font-serif font-black leading-snug uppercase text-black line-clamp-3">{proj.title}</h4>
                              <p className="text-[10px] text-gray-500 font-sans leading-relaxed line-clamp-3 select-text">{proj.abstract}</p>
                            </div>
                            <div className="pt-2 border-t border-black/10">
                              <div className="text-[8px] font-mono text-gray-400 uppercase tracking-widest">Digital Code Reference</div>
                              <div className="font-bold font-mono text-[9px] text-black mt-0.5">{proj.id}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 6: SUPPORT INBOX & LIVE SUPPORT TICKET CHATS */}
                  {adminSubTab === "inbox" && (
                    <div className="bg-white border border-black p-5 space-y-6 animate-fadeIn">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black/15 pb-4">
                        <div className="flex items-center gap-2 text-black">
                          <Mail className="w-5 h-5 text-[#D4AF37]" />
                          <h4 className="text-xs font-mono font-bold uppercase tracking-widest text-[#D4AF37] inline-block font-sans">Admissions & Live Customer Inbox</h4>
                        </div>
                        <div className="flex bg-[#FAF9F6] border border-black p-0.5 rounded-none font-mono text-[9px]">
                          <button
                            onClick={() => { setAdminInboxSubTab("tickets"); setSelectedChatId(""); }}
                            className={`px-3 py-1 font-bold uppercase cursor-pointer rounded-none transition-colors ${adminInboxSubTab === "tickets" ? "bg-black text-[#D4AF37]" : "text-gray-400 hover:text-black"}`}
                          >
                            Service Tickets ({contactMessages.length})
                          </button>
                          <button
                            onClick={() => { setAdminInboxSubTab("livechats"); setSelectedChatId(""); }}
                            className={`px-3 py-1 font-bold uppercase cursor-pointer rounded-none transition-colors ${adminInboxSubTab === "livechats" ? "bg-black text-[#D4AF37]" : "text-gray-400 hover:text-black"}`}
                          >
                            Live Conversations ({supportChats.length})
                          </button>
                        </div>
                      </div>

                      {/* INBOX TICKETS SUB TAB */}
                      {adminInboxSubTab === "tickets" && (
                        <div className="space-y-4">
                          <p className="text-[10px] text-gray-500 leading-normal italic font-serif">"Review message filings uploaded via our public admissions contact query system."</p>
                          <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
                            {contactMessages.map((msg) => (
                              <div key={msg.id} className="p-4 bg-[#FAF9F6] border border-black rounded-none space-y-3 text-left">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-black/5 pb-2">
                                  <div>
                                    <span className="font-mono text-[8px] text-gray-400 uppercase tracking-widest">ID Reference: {msg.id}</span>
                                    <h5 className="font-serif font-black text-[#D4AF37] text-xs sm:text-sm uppercase mt-0.5">{msg.subject}</h5>
                                    <div className="flex items-center gap-2 mt-1 text-[10px] font-sans font-medium text-gray-650">
                                      <span className="text-black font-extrabold">{msg.name}</span>
                                      <span>&bull;</span>
                                      <span className="font-mono underline select-all">{msg.email}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                                    <span className="text-[9px] text-gray-400 font-mono">{new Date(msg.created_at).toLocaleDateString()}</span>
                                    <button
                                      onClick={() => toggleTicketStatus(msg.id, msg.status)}
                                      className={`text-[8px] uppercase font-mono font-bold px-2 py-0.5 rounded-none border border-black cursor-pointer transition-colors ${msg.status === "unread" ? "bg-black text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black" : "bg-neutral-200 text-neutral-600 hover:bg-neutral-300"}`}
                                    >
                                      {msg.status === "unread" ? "Mark Replied" : "Mark Unread"}
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs text-neutral-800 leading-relaxed font-serif bg-white p-3 border border-black/10 select-text whitespace-pre-wrap">{msg.message}</p>
                              </div>
                            ))}
                            {contactMessages.length === 0 && (
                              <div className="py-12 text-center text-xs text-gray-400 italic uppercase tracking-wider font-mono">No contact tickets filed.</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* INBOX LIVE CHATS SUB TAB */}
                      {adminInboxSubTab === "livechats" && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 leading-normal">
                          
                          {/* Thread lists */}
                          <div className="lg:col-span-5 space-y-2 max-h-[380px] overflow-y-auto">
                            <span className="text-[8px] uppercase font-mono font-bold tracking-widest text-neutral-400 border-b border-black/10 pb-1.5 block">Threads Stream</span>
                            {supportChats.map((chat) => (
                              <div
                                key={chat.chatId}
                                onClick={() => setSelectedChatId(chat.chatId)}
                                className={`p-3 bg-[#FAF9F6] border rounded-none cursor-pointer text-left transition-all ${
                                  selectedChatId === chat.chatId ? "border-[#D4AF37] bg-[#D4AF37]/5" : "border-black/10 hover:border-black"
                                }`}
                              >
                                <div className="flex items-center justify-between text-[8px] font-mono font-bold">
                                  <span className="truncate max-w-[130px] uppercase text-black">{chat.userName}</span>
                                  <span className={chat.status === "active" ? "text-emerald-600" : "text-gray-400"}>
                                    ● {chat.status.toUpperCase()}
                                  </span>
                                </div>
                                <p className="text-[10px] font-sans truncate text-gray-500 mt-1">{chat.email}</p>
                                <div className="flex items-center justify-between text-[8px] font-mono text-gray-400 mt-2">
                                  <span>ID: {chat.chatId.slice(0, 8).toUpperCase()}</span>
                                  <span>{new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                              </div>
                            ))}
                            {supportChats.length === 0 && (
                              <div className="py-12 text-center text-[10px] text-gray-400 italic uppercase font-mono">No live chats logged.</div>
                            )}
                          </div>

                          {/* Dialog details */}
                          <div className="lg:col-span-7 bg-[#FAF9F6] border border-black p-4 rounded-none flex flex-col justify-between h-[380px] overflow-hidden">
                            {selectedChatId ? (
                              <div className="flex flex-col justify-between h-full overflow-hidden w-full">
                                <div className="flex items-center justify-between border-b border-black/15 pb-2 mb-2">
                                  <div className="text-left font-mono">
                                    <h5 className="text-[9px] uppercase font-bold text-[#D4AF37]">Active Consultation Thread</h5>
                                    <span className="text-[8px] text-gray-400">{selectedChatId}</span>
                                  </div>
                                  <button
                                    onClick={() => handleCloseChat(selectedChatId)}
                                    className="text-[8px] uppercase font-mono font-bold px-2 py-0.5 border border-rose-500 text-rose-600 rounded-none cursor-pointer hover:bg-rose-50 transition-colors"
                                  >
                                    End Session
                                  </button>
                                </div>

                                <div className="flex-grow overflow-y-auto space-y-3.5 pr-1 py-1.5 bg-white border border-black/5 p-3">
                                  {activeChatMessages.map((m) => {
                                    const isSelf = m.sender === "admin";
                                    return (
                                      <div key={m.messageId} className={`flex flex-col max-w-[85%] ${isSelf ? "ml-auto items-end" : "mr-auto items-start"}`}>
                                        <span className="text-[7px] font-mono font-bold uppercase tracking-wide text-neutral-400 mb-1">
                                          {m.senderName} &bull; {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        <div className={`p-2.5 text-[10px] leading-relaxed select-text ${
                                          isSelf ? "bg-black text-white" : "bg-[#FAF9F6] text-black border border-black/10"
                                        }`}>
                                          {m.text}
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>

                                <form onSubmit={handleSendAdminReply} className="flex gap-2 items-center mt-3 pt-1 border-t border-black/5 shrink-0">
                                  <input
                                    type="text"
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    placeholder="Type advisory response..."
                                    className="flex-grow bg-white border border-black p-2 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-sans"
                                  />
                                  <button
                                    type="submit"
                                    disabled={!replyText.trim()}
                                    className="bg-black hover:bg-[#D4AF37] text-white hover:text-black py-2 px-3.5 border border-black rounded-none disabled:opacity-30 cursor-pointer text-xs font-mono font-bold uppercase"
                                  >
                                    Send
                                  </button>
                                </form>
                              </div>
                            ) : (
                              <div className="flex-grow flex flex-col items-center justify-center text-center space-y-1.5 w-full h-full text-black">
                                <MessageSquare className="w-10 h-10 text-gray-300 pointer-events-none" />
                                <span className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">No conversation stream loaded</span>
                                <p className="text-[10px] italic text-neutral-500 leading-relaxed font-serif max-w-xs">"Select a conversation thread to help student candidates on calculus proofs or library asset locks."</p>
                              </div>
                            )}
                          </div>

                        </div>
                      )}

                    </div>
                  )}

                  {/* TAB 7: AI INSTRUCTOR STUDIO & ADVISORY AREA */}
                  {adminSubTab === "ai_advisor" && (
                    <div className="space-y-8 animate-fadeIn">
                      
                      {/* Section 1: AI Instructor Studio (Lesson Plan, Note Generator, and Editor) */}
                      <div className="bg-white border border-black p-6 space-y-6">
                        <div className="border-b border-black/15 pb-4 text-left">
                          <span className="text-[8px] bg-black text-[#D4AF37] px-2 py-0.5 font-mono uppercase tracking-widest font-black">
                            INSTRUCTOR SUITE (ADMIN SPECIFIC)
                          </span>
                          <h3 className="text-base font-serif font-black text-black uppercase tracking-wider flex items-center gap-1.5 mt-2">
                            <Sparkles className="w-5 h-5 text-[#D4AF37]" /> AI Instructor Studio & Course Editor
                          </h3>
                          <p className="text-[11px] text-gray-500 font-sans mt-0.5">
                            Leverage server-side Gemini 3.5 capabilities to generate teaching revision notes, structured lesson plans, and interactive quiz check questions. Review, edit, approve, and deploy them directly into active course syllabi.
                          </p>
                        </div>

                        {studioNotification && (
                          <div className="p-4 bg-amber-50 border border-[#D4AF37] text-neutral-800 text-xs font-mono uppercase tracking-wider rounded-none">
                            {studioNotification}
                          </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left leading-relaxed">
                          
                          {/* Setup specifications panel (Left Side) */}
                          <div className="lg:col-span-5 space-y-4">
                            <span className="text-[8.5px] uppercase font-mono font-bold tracking-widest text-[#D4AF37] block border-b border-black/5 pb-1.5">
                              Syllabus Entry Parameters
                            </span>

                            <div className="space-y-4 font-sans text-xs">
                              <div>
                                <label className="block text-[8.5px] uppercase font-mono tracking-wider font-extrabold text-black mb-1">
                                  Prerequisite Course Target
                                </label>
                                <select
                                  value={studioCourseId}
                                  onChange={(e) => setStudioCourseId(e.target.value)}
                                  className="w-full bg-white border border-black p-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-semibold rounded-none"
                                >
                                  <option value="">-- Choose target course --</option>
                                  {[...EDUCATIONAL_COURSES, ...dbCourses].map((c) => (
                                    <option key={c.id} value={c.id}>
                                      [{c.id.toUpperCase()}] {c.title} ({c.level})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[8.5px] uppercase font-mono tracking-wider font-extrabold text-black mb-1">
                                  Lesson Topic / Unit Name
                                </label>
                                <input
                                  type="text"
                                  value={studioTopic}
                                  onChange={(e) => setStudioTopic(e.target.value)}
                                  placeholder="e.g. Acid-Base Titration & PH Constants"
                                  className="w-full bg-white border border-black p-2.5 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-medium rounded-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[8.5px] uppercase font-mono tracking-wider font-extrabold text-black mb-1">
                                  Editorial Format to Generate
                                </label>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                  <button
                                    type="button"
                                    onClick={() => setStudioFormat("notes")}
                                    className={`py-2 text-[10px] font-mono uppercase font-black border transition-all cursor-pointer ${
                                      studioFormat === "notes"
                                        ? "bg-black text-[#D4AF37] border-black"
                                        : "bg-white text-gray-400 border-gray-200 hover:border-black"
                                    }`}
                                  >
                                    Teaching Notes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setStudioFormat("quiz")}
                                    className={`py-2 text-[10px] font-mono uppercase font-black border transition-all cursor-pointer ${
                                      studioFormat === "quiz"
                                        ? "bg-black text-[#D4AF37] border-black"
                                        : "bg-white text-gray-400 border-gray-200 hover:border-black"
                                    }`}
                                  >
                                    Knowledge Check MCQ
                                  </button>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={handleGenerateStudioContent}
                                disabled={studioGenerating || !studioCourseId || !studioTopic}
                                className="w-full py-3 bg-black hover:bg-[#D4AF37] text-white hover:text-black font-mono font-bold text-[10px] uppercase tracking-widest border border-black transition-colors disabled:opacity-30 cursor-pointer flex items-center justify-center gap-2"
                              >
                                {studioGenerating ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Drafting revision material...
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5" /> Generate Draft via AI
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          {/* Editor and direct approval publisher (Right Side) */}
                          <div className="lg:col-span-7 flex flex-col justify-start space-y-4">
                            <div className="flex justify-between items-center border-b border-black/5 pb-1.5">
                              <span className="text-[8.5px] uppercase font-mono font-bold tracking-widest text-gray-400">
                                Draft Review, Edit & Publishing Board
                              </span>
                              {studioDraftText && (
                                <span className="text-[7.5px] uppercase font-mono font-bold text-[#D4AF37] animate-pulse bg-amber-50 px-1 border border-amber-300">
                                  ● AWAITING INSTRUCTOR CERTIFICATION
                                </span>
                              )}
                            </div>

                            <div className="space-y-4">
                              <textarea
                                value={studioDraftText}
                                onChange={(e) => setStudioDraftText(e.target.value)}
                                placeholder="Generated draft revision notes or JSON quiz properties will populate here. Customize or review the content before clicking Certify & Publish to make it live for students."
                                rows={11}
                                className="w-full bg-white border border-black p-4 text-xs font-mono text-neutral-850 leading-relaxed focus:outline-none focus:ring-1 focus:ring-[#D4AF37] rounded-none select-text"
                              />

                              {studioDraftText && (
                                <div className="space-y-2.5">
                                  <div className="bg-[#FAF9F6] border border-black/10 p-3 italic text-neutral-500 font-serif text-xxs">
                                    "As platform Administrator, you must certify that the generated educational concepts comply with WAEC/JAMB guidelines before publication."
                                  </div>

                                  <button
                                    type="button"
                                    onClick={handlePublishStudioMaterial}
                                    disabled={studioPublishLoading || !studioDraftText.trim()}
                                    className="w-full py-3.5 bg-black hover:bg-[#D4AF37] text-white hover:text-black font-mono font-extrabold text-[10px] uppercase tracking-widest border border-black cursor-pointer transition-colors flex items-center justify-center gap-2"
                                  >
                                    {studioPublishLoading ? (
                                      <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Certifying & Syncing Database...
                                      </>
                                    ) : (
                                      <>
                                        ✓ Approve, Certify & Publish Live
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                        </div>
                      </div>

                      {/* Section 2: General AdvisorBee Copilot Diagnostics Tool */}
                      <div className="bg-white border border-black p-6 space-y-6">
                        <div className="border-b border-black/15 pb-4 text-left">
                          <h3 className="text-base font-serif font-black text-black uppercase tracking-wider flex items-center gap-1.5">
                            <Bot className="w-5 h-5 text-[#D4AF37]" /> AdvisorBee General Administrative Diagnostics
                          </h3>
                          <p className="text-[11px] text-gray-500 font-sans mt-0.5">
                            Inquire about parent newsletter drafts, global tuition package reviews, or general administrative planning timelines.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 leading-normal">
                          
                          {/* Left inputs */}
                          <form onSubmit={handleAskCopilot} className="lg:col-span-5 space-y-4 text-left">
                            <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-gray-400">Board Prompt Inputs</span>
                            
                            <textarea
                              value={adminCopilotPrompt}
                              onChange={(e) => setAdminCopilotPrompt(e.target.value)}
                              placeholder="e.g. Write a marketing newsletter for parents advertising our upcoming WAEC and JAMB mock exam prep courses..."
                              rows={4}
                              className="w-full bg-white border border-black p-3 text-xs text-black focus:outline-none focus:ring-1 focus:ring-[#D4AF37] font-sans rounded-none"
                            />

                            <button
                              type="submit"
                              disabled={adminCopilotLoading || !adminCopilotPrompt.trim()}
                              className="bg-black hover:bg-[#D4AF37] text-white hover:text-black font-mono font-bold text-[9px] w-full py-3.5 border border-black uppercase tracking-widest transition-colors cursor-pointer disabled:opacity-30 flex items-center justify-center gap-2 rounded-none"
                            >
                              {adminCopilotLoading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Compiling diagnostics...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" /> Query AI Advisor
                                </>
                              )}
                            </button>

                            {/* Presets */}
                            <div className="space-y-2 pt-1 border-t border-black/10">
                              <span className="text-[7.5px] font-mono text-gray-400 uppercase tracking-widest">Administrative Prompt Presets</span>
                              <div className="space-y-1.5">
                                {[
                                  "Write promo email advertising our Standard and Premium Tuition packages",
                                  "Provide 5 algebraic mock exam questions for SS3 Mathematics curriculum",
                                  "Plan an undergraduate chemistry research timeline for Soxhlet Moringa Extraction",
                                ].map((preset) => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => setAdminCopilotPrompt(preset)}
                                    className="w-full bg-[#FAF9F6] border border-black/10 hover:border-black p-2 text-left rounded-none text-[9px] text-gray-500 truncate block cursor-pointer transition-all"
                                  >
                                    {preset}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </form>

                          {/* Right output */}
                          <div className="lg:col-span-7 bg-[#FAF9F6] border border-black p-5 rounded-none flex flex-col justify-start min-h-[350px] max-h-[480px] overflow-y-auto font-sans leading-relaxed text-left text-xs bg-white text-black select-text">
                            <div className="border-b border-black/10 pb-2 mb-2.5 font-mono text-[8.5px] uppercase font-bold text-gray-400">
                              AdvisorBee Compiled Feedback
                            </div>
                            
                            {adminCopilotLoading ? (
                              <div className="flex-grow flex flex-col items-center justify-center py-20 text-center space-y-2">
                                <Loader2 className="w-6 h-6 text-[#D4AF37] animate-spin" />
                                <span className="text-[10px] uppercase tracking-wider font-mono text-gray-400 font-bold">Connecting server-side Gemini 3.5...</span>
                              </div>
                            ) : adminCopilotResponse ? (
                              <div className="select-text prose prose-sm max-w-none text-neutral-800 font-serif leading-relaxed space-y-3 whitespace-pre-wrap text-left">
                                {adminCopilotResponse}
                              </div>
                            ) : (
                              <div className="flex-grow flex flex-col items-center justify-center py-20 text-center space-y-1.5 text-gray-400 text-xxs">
                                <Bot className="w-10 h-10 text-gray-300 pointer-events-none" />
                                <span className="font-mono uppercase tracking-widest text-[#D4AF37]">Waiting for advisor query input...</span>
                                <p className="text-[10px] italic leading-normal font-serif max-w-xs pt-1">
                                  "AdvisorBee has detailed insights on Nigerian curriculum standards, pre-school department syllabus, and structural chapters."
                                </p>
                              </div>
                            )}
                          </div>

                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
}
