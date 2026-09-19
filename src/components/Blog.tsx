import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { BlogPost, BlogComment, UserProfile } from "../types";
import {
  Search,
  Calendar,
  User,
  Tag,
  Share2,
  MessageSquare,
  Plus,
  Trash2,
  ArrowLeft,
  Send,
  Check,
  Copy,
  ChevronRight,
  BookOpen,
} from "lucide-react";

// List of professional, specified categories
const BLOG_CATEGORIES = [
  "Study Tips",
  "WAEC Preparation",
  "NECO Preparation",
  "JAMB Preparation",
  "University Success",
  "Research Writing",
  "Project Topics",
  "Data Analysis",
  "SPSS Tutorials",
  "Thesis Writing",
  "Scholarships",
  "Career Development",
  "TutorHive News",
];

// Seed blogs to present immediately if the Firestore collection is empty - complete and educational
const SEED_BLOGS: BlogPost[] = [
  {
    id: "seed-study-tips",
    title: "The Feynman Technique: A Nobel Laureate's Secret to Deep Academic Understanding",
    content: `Have you ever spent hours reading a textbook chapter only to realize you can't recall a single point? Most students equate studying with passive rereading. True mastery requires active mental reproduction.

The Feynman Technique—developed by Nobel laureate physicist Richard Feynman—is a simple, high-impact four-step mental model designed to build robust understanding:

### Step 1: Write the Concept Name at the Top of a Page
Choose whatever concept you are trying to understand (e.g., Photosynthesis, Archimedes' Principle, or Linear Regression).

### Step 2: Explain it as if Teaching to an 8-Year-Old
Use plain language. Avoid dense jargon or mathematical abstractions. If you use big words, you are hiding behind terminology you don't fully comprehend. Express it in humble, simple analogies.

### Step 3: Identify Your Gaps and Go Back to Source Material
When you write out your simplified explanation, you will inevitably stumble. You may forget why certain variables align or how a chemical transition occurs. This is the goldmine step. Go back to your textbook or lecture notes and target only those exact loopholes.

### Step 4: Streamline and Use Analogies
Simplify your description and create vivid comparisons. For instance, compare an electrical circuit to water flowing through a pipe. This cements the concept into your long-term memory.`,
    category: "Study Tips",
    tags: ["Feynman Hack", "Study Methodology", "Active Recall", "First Class Strategy"],
    author: "Dr. Hauwa Usman",
    imageUrl: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=1200",
    featured: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-waec",
    title: "Mastering WAEC General Mathematics: Essential Proofs and Geometric Theorems for Section B",
    content: `For secondary school students in West Africa, the WAEC General Mathematics exam is a critical gatekeeper. While the Section A objectives test speed, Section B demands absolute rigorous mathematical proofs and detailed, logical steps. 

Here is how you secure full marks in the core geometry and circle theorem sections:

### 1. The Core Circle Theorems You Must Memorize
WAEC consistently tests these three core geometric relationships:
*   **Theorem 1:** The angle subtended by an arc at the center of a circle is twice that subtended at any point on the remaining part of the circumference.
*   **Theorem 2:** Angles in the same segment of a circle are equal.
*   **Theorem 3:** The opposite angles of a cyclic quadrilateral are supplementary (sum up to $180^\\circ$).

### 2. Tabulate Your Logical Proofs
When writing proofs, WAEC examiners award step-by-step marks. Never just write down the final value. Organize your proofs in a clean, two-column table:
*   **Statement Column:** Write the geometric conclusion (e.g., "$\\angle ABC = 90^\\circ$").
*   **Reason Column:** State the exact rule (e.g., "Angle in a semi-circle is a right angle").

### 3. Trigonometry and Bearings
When solving three-dimensional bearings, draw the cardinal points (North, South, East, West) at each station clearly. Use the **Sine Rule** when you have two angles and a side, and the **Cosine Rule** when you have two side dimensions and a captured angle. Record every step cleanly to secure maximum partial grades!`,
    category: "WAEC Preparation",
    tags: ["WAEC Maths", "Circle Theorems", "Geometry Proofs", "Section B Help"],
    author: "Dr. Hauwa Usman",
    imageUrl: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&q=80&w=1200",
    featured: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-neco",
    title: "Unlocking NECO Physics and Chemistry Practicals: Accurate Laboratory Report Checklists",
    content: `National Examinations Council (NECO) practical papers for Physics, Chemistry, and Biology demand physical coordination, structured documentation, and accurate measurements. Let's explore critical checklists to guarantee exceptional experiment recording scores.

### 1. Chemistry Qualitative Analysis
Always remember that qualitative analysis is a game of observant reporting. You must clearly state observations (colors, gas evolution, precipitates) and make matching inferences:
*   **CO3 2- Detection:** If adding dilute hydrochloric acid produces effervescence, and the evolved gas turns lime water milky, write: "Effervescence occurred; gas evolved turned lime water milky. Inference: CO2 gas from CO3 2- or HCO3- suspected."
*   **Cation Confirmation:** Know the reactive difference when adding sodium hydroxide (NaOH) or ammonia liquid (NH3) in drops and in excess. For instance, aluminum ions (Al3+) form a white gelatinous precipitate that is soluble in excess NaOH but insoluble in excess NH3.

### 2. Physics Graph Plotting Rules
If drawing an experimental resistance or oscillation graph:
*   **Scale Choice:** Choose readable, uniform scale markers (e.g., 2cm to 5 units). Avoid weird multiples like 3 or 7.
*   **Slope Calculation:** Select two distinct points on your line of best fit that are far apart. Do not use actual measured coordinate results unless they sit perfectly on the drawn line.
*   **Intercept Precision:** Ensure you extend the line to meet the vertical axis to capture the constant offset accurately.`,
    category: "NECO Preparation",
    tags: ["NECO", "Science Practicals", "Physics Lab", "Chemistry Reactions"],
    author: "Prof. Joshua Babatunde",
    imageUrl: "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&q=80&w=1200",
    featured: false,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-jamb",
    title: "Cracking JAMB UTME Use of English: Crucial Concord Rules and Structural Concord Traps",
    content: `The Joint Admissions and Matriculation Board (JAMB) English paper is notoriously designed to test subtle grammatical boundaries. It is not just about choosing "what sounds right." It is about applying strict morphological constraints.

Here are the top three grammatical concord structures tested every year that most candidates fail:

### 1. The 'Many A' Concord Trap
Normally, we associate the word 'many' with plural nouns. However, the special idiomatic idiom "many a" takes a singular noun and a **singular verb**:
*   *Incorrect:* Many a student are preparing for the test.
*   *Correct:* Many a student **is** preparing for the test.

### 2. Parenthetical Phrases Do Not Alter Subject Number
When singular subjects are linked to others using phrases like "as well as," "together with," "in addition to," or "accompanied by," the primary subject remains singular:
*   *Incorrect:* The tutor, together with his science students, have attended the seminar.
*   *Correct:* The tutor, together with his science students, **has** attended the seminar.

### 3. Either... Or / Neither... Nor Proximity Rule
When subjects of different numbers or persons are connected by "either... or" or "neither... nor," the verb agrees with the subject **nearest** to it:
*   *Incorrect:* Neither the supervisor nor the undergraduate researchers has logged in.
*   *Correct:* Neither the supervisor nor the undergraduate researchers **have** logged in (since 'researchers' is closer to the verb).`,
    category: "JAMB Preparation",
    tags: ["JAMB English", "Concord Traps", "Grammar Rules", "UTME Blueprint"],
    author: "Dr. Hauwa Usman",
    imageUrl: "https://images.unsplash.com/photo-1527891751199-7225231a68dd?auto=format&fit=crop&q=80&w=1200",
    featured: false,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-university",
    title: "Maintaining a First-Class CGPA: Establishing Spaced Repetition Calendars and Active Recall Workflows",
    content: `# Maintaining a 4.5+ CGPA at the University Level

Achieving a First-Class or Distinction Grade is not a function of raw intelligence or staying in the library for 12 hours a day. It is an engineering problem. You must construct workflows that actively retain high levels of abstract lecture material.

### 1. The Spaced Repetition Calendar
The brain loses over 70% of new learning after 48 hours unless recalled actively (The Ebbinghaus Forgetting Curve). To combat this, schedule review intervals in your planner:
*   **Review 1:** 24 Hours after the lecture.
*   **Review 2:** 3 Days after.
*   **Review 3:** 7 Days after.
*   **Review 4:** 21 Days after.

### 2. Active Recall via Flashcard Generators
Instead of reading your lecture slides, convert the main items into questions immediately during or after class, or ask the TutorBee AI Advisor to do this for you. 
*   *Passive:* Reviewing a list of industrial chemistry polymers.
*   *Active:* Ask yourself: "Explain the polymerization reaction of polyvinyl chloride and name two temperature limitations."

### 3. Calculating Your CGPA Buffer
Keep a simple running spreadsheet of your course grades, credit units, and grade point indices. Know exactly how many excess points you need in 4-credit courses to balance out a tough 2-credit elective test. Never leave your grades to guess-work!`,
    category: "University Success",
    tags: ["First Class", "CGPA Hacks", "Active Recall", "Academic Excellence"],
    author: "Hauwa Usman Kandarawa",
    imageUrl: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=1200",
    featured: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-research",
    title: "Formulating Premium Academic Research Proposals: A Bulletproof Structural Template",
    content: `# Writing a Winning Research Proposal

A research proposal serves to justify the scientific validity, empirical significance, and analytical feasibility of a proposed study. Undergraduates and Master's candidates often submit proposals that are too broad, lacking empirical boundary definitions.

Here is a template structure approved by the TutorHive Academic Council for formulating winning research proposals.

### 1. Statement of the Problem
Clearly outline the negative tension that justifies the study. Do not just state: "Nigeria needs computer literacy." Instead, write: "Despite massive infrastructure spending in Northern Nigeria primary schools, there is a 42% gap in computer science literacy scores, resulting in poor student secondary progression."

### 2. Formulating Research Questions
Ensure your questions align directly with your statistical hypotheses:
*   What is the relationship between Variable X and Variable Y?
*   To what extent does Variable Z moderate the reaction?

### 3. Preliminary Methodology Outline
State your research design up front:
*   **Design:** Quasi-experimental, descriptive survey, or ex-post facto.
*   **Sampling:** Simple random sampling, stratified, or purposive sampling.
*   **Analysis:** Specify whether you will run Multiple Linear Regression, Pearson's Correlation (r), or ANOVA comparisons.`,
    category: "Research Writing",
    tags: ["Research", "Academic Proposals", "Literature Synthesis", "Methodology"],
    author: "Prof. Joshua Babatunde",
    imageUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1200",
    featured: false,
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-project",
    title: "How to Brainstorm and Validate Academic Project Topics for Nigerian Undergraduates",
    content: `# Finding Your Understanding: Academic Research Ideas

Many final-year undergraduate students get stuck before writing their first abstract draft. The secret lies in identifying realistic problem gaps that match local industry developments.

### Step 1: Browse Existing Project Lists
Don't reinvent the wheel. Check resources online or TutorHive's specialized Projects catalog. Review completed thesis files and jump to the **"Recommendations for Future Research"** section in Chapter 5. This is a goldmine for ready-to-solve topics!

### Step 2: Formulate the Topic with Variables
A premium research title must display clear boundaries:
*   An **Independent Variable** (the element you manipulate, e.g., "AI-powered tutoring systems").
*   A **Dependent Variable** (the outcome, e.g., "secondary school JAMB scores").
*   A **Specific Scope** (e.g., "in Kaduna State, Nigeria").
*   *Bad:* "A study on school software."
*   *Good:* "Effect of AI-assisted tutorial systems on high-school students' performance in mathematical examinations: A Kaduna state case study."`,
    category: "Project Topics",
    tags: ["Project Writing", "Undergraduate", "Academic Research"],
    author: "Hauwa Usman Kandarawa",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200",
    featured: false,
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-analysis",
    title: "A Guide to Selecting the Correct Statistical Tests for Quantitative Hypothesis Testing",
    content: `# Navigating Hypothesis Testing in Academic Research

When submitting a thesis, supervisor corrections are frequently centered on incorrect statistical tests. Choosing the wrong quantitative measurement invalidates your empirical findings.

### 1. Identify Your Variables
First, determine whether your variables are:
*   **Nominal/Categorical:** Unordered options (e.g., gender, department, city).
*   **Ordinal:** Ranked values (e.g., level of agreement: High, Medium, Low).
*   **Continuous/Interval:** Clean scale measurements (e.g., test scores, height, age, income).

### 2. The Decision Tree
Use this quick reference to select the correct test:
*   **Comparing Means of Two Independent Groups:** Use an **Independent Samples T-Test** (e.g., comparing test outcomes of public vs private students).
*   **Comparing Means of Three or More Groups:** Use an **One-Way ANOVA** (e.g., comparing physics scores across classrooms scaling different schedules).
*   **Evaluating Relationships Between Two Scale Variables:** Use **Pearson Correlation (r)** (e.g., checking if study hours correlate with average scores).
*   **Predicting One Outcome from Multiple Predictor Elements:** Use **Multiple Linear Regression** (e.g., checking if attendance, syllabus completion, and platform logins predict JAMB success).
*   **Testing Relationships Between Two Categorical Variables:** Use a **Chi-Square Test of Independence** (e.g., checking if subscription level correlates with passing rates).`,
    category: "Data Analysis",
    tags: ["Statistical Tests", "Hypothesis", "ANOVA", "Regression Model"],
    author: "Prof. Joshua Babatunde",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&q=80&w=1200",
    featured: false,
    createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-spss",
    title: "Step-by-Step SPSS Guide: Data Cleansing, Descriptive Frequency Runs, and Linear Regression",
    content: `# Introduction to SPSS Analysis for Academic Researchers

Statistical Package for the Social Sciences (SPSS) remains one of the cornerstones of quantitative educational research globally. Here is a baseline checklist to ensure your dissertation or thesis statistics remain sound.

### 1. Data Cleaning First
Before running any analysis, identify extreme outliers. Execute a descriptive statistics check with box plots:
*   Go to **Analyze > Descriptive Statistics > Explore**.
*   Select your numeric dependent variables.
*   Examine the box-plot to flag any values scoring more than 1.5 times the interquartile range (IQR) away from the box limits.

### 2. Normality Assumptions
Statistical tests like ANOVA and T-Tests assume normally distributed data:
*   Use the **Shapiro-Wilk** test for smaller sample sizes ($N < 50$).
*   Use the **Kolmogorov-Smirnov** test for larger samples.
*   If your p-value is greater than 0.05, rejoice! Your data fits the normal distribution curve.

### 3. Interpreting Linear Regression
When checking how predictors impact your final score, analyze:
*   **R-Square Value:** Indicates the percentage of variance explained (e.g., $R^2 = 0.456$ means 45.6% variance is captured).
*   **Beta Weights ($\\beta$):** Look at the Standardized Beta to compare effect sizes.
*   **Significance Check:** Check that the p-value is strictly lower than 0.05.`,
    category: "SPSS Tutorials",
    tags: ["SPSS", "Data Analysis", "Statistics", "Thesis"],
    author: "Prof. Joshua Babatunde",
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1200",
    featured: false,
    createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-thesis",
    title: "Deconstructing Chapter Five of Your Thesis: Framing Actionable Recommendations and Policy Excerpts",
    content: `# Crafting a Flawless Chapter Five

The final chapter of your thesis or undergraduate dissertation is where your entire research comes together. Many students think they should just repeat Chapter Four. This is incorrect. Chapter Five is about **meaning, impact, and actionable implementation**.

The TutorHive-recommended Chapter Five structure includes:

### 1. Summary of Findings
Briefly restate the empirical highlights. Keep it concise—restrict it to 3 or 4 paragraphs. Direct the advisor back to the key milestones established during statistical analysis.

### 2. Discussion of Findings
This is the intellectual core. Reconnect your results with those of the authors you cited in Chapter Two:
*   "Our statistical regression showed a significant negative impact ($\\beta = -0.34, p < 0.05$). This finding supports the argument of Alao (2021) but contradicts the conclusions of Smith et al. (2018)."

### 3. Policy Recommendations and Practical Implications
Your suggestions must be highly specific, actionable, and budgeted. Avoid vague suggestions like "The government should buy more books." Instead, write: "The State Ministry of Education should mandate a 2-hour weekly computational reasoning session for all primary five classrooms, backed by localized digital learning apps."`,
    category: "Thesis Writing",
    tags: ["Thesis Chapters", "Policy Recommendations", "Scribus Guidelines"],
    author: "Hauwa Usman Kandarawa",
    imageUrl: "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&q=80&w=1200",
    featured: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-scholarship",
    title: "Winning Fully Funded International Scholarships: Writing a Solid Statement of Purpose",
    content: `Winning fully funded international scholarships (like MasterCard, Commonwealth, PTDF, or Chevening) goes beyond having a high GPA. Every year, students with exceptional transcripts are rejected while others with more modest grades secure full sponsorships.

The secret lies in your academic cover letter and Statement of Purpose (SOP).

### The Golden Formula for an Undeniable Essay:

*   **The Problem Definition (First 15%):** Do not spend the first paragraph describing how brilliant you are. Instead, define an urgent local challenge: "The lack of accessible petroleum chemical analytical frameworks in Nigeria restricts small-scale refining initiatives."
*   **The Academic Alignment (Next 40%):** Explain why the target university is perfect for this problem. Point to specific professors, current laboratory courses, and published papers from the department.
*   **Your Empirical Track Record (Next 25%):** Highlight your projects, publications, and background coursework. Link this to how you intend to thrive in their program.
*   **The Return Strategy (Final 20%):** Scholarship boards are investments. Show how you will bring this knowledge back to solve local socio-political or educational issues. Speak with high specific clarity on your career path.`,
    category: "Scholarships",
    tags: ["Commonwealth", "PTDF", "Funding", "Study Abroad"],
    author: "Dr. Hauwa Usman",
    imageUrl: "https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?auto=format&fit=crop&q=80&w=1200",
    featured: false,
    createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-career",
    title: "Transitioning to Corporate: High-Impact Portfolio Building and ATS-Optimized CVs for Fresh Graduates",
    content: `# Standing Out in a Competitive Job Market

As a fresh graduate entering the labor force, you are competing against thousands of others with identical degrees. Having a high CGPA is no longer enough to secure premium roles. You must turn your coursework into concrete industrial assets.

### 1. Build a Personal Project Portfolio
Every academic project you did can be presented as professional experience:
*   Instead of listing: "Performed physical chemistry research," write about the structural metrics, analytical apparatuses, and database programs you manipulated to solve industry tests.

### 2. Learn High-Demand Digital Tools
*   **Chemical/Geology Graduates:** Learn GIS mapping, statistical modeling, or CAD.
*   **Education/Social Sciences:** Master data analytic engines like SPSS, R, Python, and modern learning management systems.
*   **Finance/Engineering:** Dominate advanced financial forecasting algorithms and computational spreadsheets.

### 3. Redesign Your Resume for ATS Scanners
Most multinational firms use Applicant Tracking Systems (ATS) to filter candidate applications:
*   Ensure your resume is formatted in clean, single-column plain text.
*   Incorporate key skills from job advertisements directly into your summary.`,
    category: "Career Development",
    tags: ["Resume Building", "ATS Optimization", "Graduate Success", "Portfolio Design"],
    author: "Hauwa Usman Kandarawa",
    imageUrl: "https://images.unsplash.com/photo-1542744094-3a31f103e35f?auto=format&fit=crop&q=80&w=1200",
    featured: false,
    createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "seed-news",
    title: "Introducing TutorBee AI: Our Premium Interactive Academic Advisor for Step-by-Step Guidance",
    content: `Today, TutorHive Academy is taking a massive leap forward by rolling out our complete production-ready **Educational Blog & Insights System** and launching **TutorBee**, our premium AI Academic Advisor.

Designed to boost student engagement, provide expert examination tips, and streamline research, our advanced blog platform supports integrated discussion spaces, markdown mathematical rendering, and direct academic consultation flows.

### What is TutorBee AI?

TutorBee is an interactive 24/7 AI learning companion trained across West African and international academic curriculums. It is designed to model high-quality, step-by-step problem-solving guides rather than just spitting out solutions. Whether solving multi-step calculus coordinates or writing structural research chemistry mechanisms, TutorBee gives you the exact pedagogical breakdowns needed to succeed.`,
    category: "TutorHive News",
    tags: ["TutorBee Launch", "EdTech Nigeria", "AI Learning Assistant", "Curriculum Aligned"],
    author: "TutorHive Academic Council",
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=1200",
    featured: false,
    createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

interface BlogProps {
  userProfile: UserProfile | null;
  onOpenAuth: () => void;
}

export default function Blog({ userProfile, onOpenAuth }: BlogProps) {
  // State
  const [articles, setArticles] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<BlogPost | null>(null);
  
  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedTag, setSelectedTag] = useState<string>("");

  // Comment flow state
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Administrative Blog form state
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminTitle, setAdminTitle] = useState("");
  const [adminContent, setAdminContent] = useState("");
  const [adminCategory, setAdminCategory] = useState(BLOG_CATEGORIES[0]);
  const [adminTags, setAdminTags] = useState("");
  const [adminAuthor, setAdminAuthor] = useState("TutorHive Academic Council");
  const [adminImageUrl, setAdminImageUrl] = useState("");
  const [adminFeatured, setAdminFeatured] = useState(false);
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");

  // Copy reference state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load articles
  async function loadArticles() {
    setLoading(true);
    try {
      const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as BlogPost));

      if (fetched.length === 0) {
        // Seed database if empty or default to seed representation
        if (userProfile?.role === "admin") {
          try {
            for (const blog of SEED_BLOGS) {
              await setDoc(doc(db, "blogs", blog.id), blog);
            }
          } catch (seedErr) {
            console.warn("Could not write original seeds to Firestore, rendering fallback locally.", seedErr);
          }
        }
        setArticles(SEED_BLOGS);
      } else {
        setArticles(fetched);
      }
    } catch (err) {
      console.error("Failed to load blog articles from Firestore. Falling back to local catalog.", err);
      setArticles(SEED_BLOGS);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadArticles();
  }, [userProfile]);

  // Load comments for a selected article
  async function loadComments(blogId: string) {
    try {
      const path = `blogs/${blogId}/comments`;
      const q = query(collection(db, path), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map((d) => ({ id: d.id, ...d.data() } as BlogComment));
      setComments(list);
    } catch (err) {
      console.warn("Could not retrieve comment records directly. Showing initial mock interactions.", err);
      // Fallback comments
      setComments([
        {
          id: "c1",
          blogId,
          userId: "std1",
          userName: "Mustapha Alao",
          content: "Really detailed! The step-by-step mathematical examples hit the nail right on the head. Would love to see more past jamb math tricks.",
          createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
        },
        {
          id: "c2",
          blogId,
          userId: "std2",
          userName: "Fatima Isa Kaduna",
          content: "This is a lifesaver. Our supervisor in Industrial Chemistry keeps flagging outliers, so statistical checks using SPSS Box Plots are extremely helpful.",
          createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        }
      ]);
    }
  }

  useEffect(() => {
    if (selectedArticle) {
      loadComments(selectedArticle.id);
    }
  }, [selectedArticle]);

  // Handle adding a comment
  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!userProfile) {
      onOpenAuth();
      return;
    }
    if (!newComment.trim() || !selectedArticle) return;

    setSubmittingComment(true);
    const commentData: Omit<BlogComment, "id"> = {
      blogId: selectedArticle.id,
      userId: userProfile.uid,
      userName: userProfile.name,
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
    };

    try {
      const path = `blogs/${selectedArticle.id}/comments`;
      const docRef = await addDoc(collection(db, path), commentData);
      const inserted: BlogComment = {
        id: docRef.id,
        ...commentData,
      };
      setComments((prev) => [inserted, ...prev]);
      setNewComment("");
    } catch (err) {
      console.error("Failed to commit comment, error logged", err);
      try {
        handleFirestoreError(err, OperationType.CREATE, `blogs/${selectedArticle.id}/comments/${Date.now()}`);
      } catch (exception) {
        // render user warning
        alert("Unable to write your comment. Ensure that your authenticated session is active and check your network.");
      }
    } finally {
      setSubmittingComment(false);
    }
  }

  // Handle creating a new blog article
  async function handleCreateBlogPost(e: React.FormEvent) {
    e.preventDefault();
    if (userProfile?.role !== "admin") {
      setAdminError("Only authorized administrators can write blog articles.");
      return;
    }

    if (!adminTitle || !adminContent) {
      setAdminError("Please fill out both the Title and the Article content.");
      return;
    }

    setAdminError("");
    setAdminSuccess("");

    const parsedTags = adminTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const fallbackImage = "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&q=80&w=1200";

    const newPost: Omit<BlogPost, "id"> = {
      title: adminTitle,
      content: adminContent,
      category: adminCategory,
      tags: parsedTags,
      author: adminAuthor || "TutorHive Expert Advisor",
      imageUrl: adminImageUrl.trim() || fallbackImage,
      featured: adminFeatured,
      createdAt: new Date().toISOString(),
    };

    try {
      // Add record to firestore. Always wraps with schema validator
      const docRef = doc(collection(db, "blogs"));
      const writeData = { id: docRef.id, ...newPost };
      await setDoc(docRef, writeData);

      setAdminSuccess("Article published successfully to TutorHive Educational Blog!");
      
      // Cleanup
      setAdminTitle("");
      setAdminContent("");
      setAdminTags("");
      setAdminImageUrl("");
      setAdminFeatured(false);

      // Reload
      await loadArticles();
    } catch (err) {
      console.error("Failed to publish blog post", err);
      setAdminError("Firestore security policy or schema violation blocked the publish action.");
    }
  }

  // Handle deleting blog article
  async function handleDeleteBlogPost(blogId: string, event: React.MouseEvent) {
    event.stopPropagation();
    if (!window.confirm("Are you sure you want to permanently delete this educational article from TutorHive?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "blogs", blogId));
      setArticles((prev) => prev.filter((bk) => bk.id !== blogId));
      if (selectedArticle?.id === blogId) {
        setSelectedArticle(null);
      }
    } catch (err) {
      console.error("Deletion blocked", err);
      alert("Unauthorized delete request. Ensure you are logged in using admin privileges.");
    }
  }

  // Copy / Share logic
  function handleShare(article: BlogPost) {
    const textToCopy = `${article.title} - TutorHive Academy: ${window.location.href}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(article.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  // Gather unique tags
  const allTags = Array.from(new Set(articles.flatMap((a) => a.tags || [])));

  // Filter logic
  const filteredArticles = articles.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" || post.category === selectedCategory;

    const matchesTag = !selectedTag || post.tags.includes(selectedTag);

    return matchesSearch && matchesCategory && matchesTag;
  });

  const featuredPost = articles.find((a) => a.featured) || articles[0];
  const basicPosts = filteredArticles.filter((a) => a.id !== featuredPost?.id);

  // Related posts matching selected category
  const relatedPosts = selectedArticle
    ? articles
        .filter((post) => post.id !== selectedArticle.id && post.category === selectedArticle.category)
        .slice(0, 3)
    : [];

  return (
    <div className="bg-[#FAF9F6] text-black py-12 px-6 lg:px-12 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* Blog Header Title */}
        <div className="border-b border-black pb-8 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 bg-[#D4AF37] inline-block"></span>
              <span className="text-xs uppercase tracking-widest font-mono font-bold text-gray-500">TutorHive Academy</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-serif font-black uppercase text-black tracking-tight leading-none">
              Educational <span className="text-[#D4AF37] italic">Blog</span> & Insights
            </h1>
            <p className="text-gray-600 font-sans text-xs uppercase tracking-wider font-bold mt-2">
              Expert tips, exam blueprints, SPSS guidelines, and academic scholarship newsletters.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {userProfile?.role === "admin" && (
              <button
                onClick={() => setShowAdminPanel(!showAdminPanel)}
                className="bg-black text-white hover:bg-[#D4AF37] hover:text-black font-extrabold text-[10px] uppercase tracking-widest py-3 px-5 border border-black flex items-center gap-2 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {showAdminPanel ? "Hide Writer Panel" : "Manage Articles"}
              </button>
            )}
            {selectedArticle && (
              <button
                onClick={() => setSelectedArticle(null)}
                className="bg-white text-black hover:bg-black hover:text-white font-extrabold text-[10px] uppercase tracking-widest py-3 px-5 border border-black flex items-center gap-1 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Articles
              </button>
            )}
          </div>
        </div>

        {/* ADMIN WRITER MODAL / INTERFACE */}
        {showAdminPanel && userProfile?.role === "admin" && (
          <div className="bg-white border-2 border-black p-6 mb-10 animate-fade-in">
            <div className="flex items-center justify-between border-b border-black pb-3 mb-6">
              <h2 className="text-lg font-serif font-black uppercase tracking-wider text-black flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#D4AF37]" /> Log Academic Article
              </h2>
              <span className="text-[10px] uppercase font-mono font-bold text-[#D4AF37]">Admin Session</span>
            </div>

            {adminError && (
              <div className="bg-red-50 text-red-800 border border-red-400 p-4 mb-4 text-xs font-mono">
                {adminError}
              </div>
            )}
            {adminSuccess && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-400 p-4 mb-4 text-xs font-mono">
                {adminSuccess}
              </div>
            )}

            <form onSubmit={handleCreateBlogPost} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-gray-700 mb-1">Article Title</label>
                  <input
                    type="text"
                    value={adminTitle}
                    onChange={(e) => setAdminTitle(e.target.value)}
                    placeholder="e.g. 10 Mistakes to Avoid in your Master's Proposal Writing"
                    className="w-full bg-white border border-black p-3 text-xs focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold text-gray-700 mb-1">Author Name</label>
                    <input
                      type="text"
                      value={adminAuthor}
                      onChange={(e) => setAdminAuthor(e.target.value)}
                      placeholder="e.g. Dr. Hauwa Usman"
                      className="w-full bg-white border border-black p-3 text-xs focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-mono font-bold text-gray-700 mb-1">Category</label>
                    <select
                      value={adminCategory}
                      onChange={(e) => setAdminCategory(e.target.value)}
                      className="w-full bg-white border border-black p-3 text-xs focus:outline-none cursor-pointer"
                    >
                      {BLOG_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-gray-700 mb-1">Header Image URL</label>
                  <input
                    type="url"
                    value={adminImageUrl}
                    onChange={(e) => setAdminImageUrl(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/photo-..."
                    className="w-full bg-white border border-black p-3 text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono font-bold text-gray-700 mb-1">Tags (Comma-Separated)</label>
                  <input
                    type="text"
                    value={adminTags}
                    onChange={(e) => setAdminTags(e.target.value)}
                    placeholder="WAEC, JAMB, Math, Exam Tips"
                    className="w-full bg-white border border-black p-3 text-xs focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={adminFeatured}
                    onChange={(e) => setAdminFeatured(e.target.checked)}
                    className="w-4 h-4 text-black border-black focus:ring-0 accent-black cursor-pointer"
                  />
                  <label htmlFor="featured" className="text-[11px] uppercase font-mono font-extrabold text-black cursor-pointer">
                    Display as Featured Hero Post
                  </label>
                </div>
              </div>

              <div className="flex flex-col">
                <label className="block text-[10px] uppercase font-mono font-bold text-gray-700 mb-1">Article Body (Supports Markdown formatting)</label>
                <textarea
                  value={adminContent}
                  onChange={(e) => setAdminContent(e.target.value)}
                  placeholder="Draft your educational content here. Fully supports paragraphs, lists, bold notes, and markdown subheaders..."
                  className="w-full flex-grow bg-white border border-black p-3 text-xs focus:outline-none min-h-[250px] font-mono leading-relaxed"
                  required
                />
                <button
                  type="submit"
                  className="mt-4 w-full bg-black text-white hover:bg-[#D4AF37] hover:text-black font-extrabold text-xs uppercase tracking-widest py-4 border border-black transition-all cursor-pointer"
                >
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        )}

        {/* DETAILED ARTICLE VIEW OVERLAY PAGE */}
        {selectedArticle ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-fade-in">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="relative border-b-2 border-black pb-6">
                <span className="bg-black text-white text-[9px] uppercase tracking-widest font-mono font-bold px-2.5 py-1">
                  {selectedArticle.category}
                </span>
                
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif font-black uppercase text-black mt-3 leading-tight">
                  {selectedArticle.title}
                </h2>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mt-4 font-mono font-bold uppercase">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>Presented by {selectedArticle.author}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>{new Date(selectedArticle.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {selectedArticle.imageUrl && (
                <div className="border border-black p-1 bg-white">
                  <img
                    src={selectedArticle.imageUrl}
                    alt={selectedArticle.title}
                    referrerPolicy="no-referrer"
                    className="w-full max-h-[400px] object-cover grayscale-[30%] hover:grayscale-0 transition-all"
                  />
                </div>
              )}

              {/* MD Format Article Content Renderer */}
              <div className="prose max-w-none text-black leading-relaxed font-sans text-base space-y-5 whitespace-pre-line bg-white border border-black p-8 lg:p-12 shadow-sm first-letter:text-6xl first-letter:font-serif first-letter:font-bold first-letter:float-left first-letter:mr-3.5 first-letter:text-black first-letter:leading-[0.8]">
                {selectedArticle.content}
              </div>

              {/* Tag Badges */}
              <div className="flex flex-wrap gap-2 pt-4">
                {selectedArticle.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="bg-black/5 hover:bg-[#D4AF37]/25 text-black border border-black text-[10px] uppercase tracking-wider font-bold py-1 px-3 transition-colors duration-150"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Interactive Share Row */}
              <div className="border-t border-b border-black py-4 flex flex-wrap items-center justify-between gap-4 bg-white/50 px-4">
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-black">
                  Enjoyed this advice? Share to help friends:
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleShare(selectedArticle)}
                    className="border border-black px-3 py-1.5 text-[9px] uppercase font-mono font-extrabold flex items-center gap-1 hover:bg-black hover:text-white transition-all cursor-pointer"
                  >
                    {copiedId === selectedArticle.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" /> Cooled Link
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" /> Copy Link
                      </>
                    )}
                  </button>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(selectedArticle.title + " - Read more on TutorHive Blog!")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="border border-black px-3 py-1.5 text-[9px] uppercase font-mono font-extrabold hover:bg-[#D4AF37] hover:text-black transition-all bg-[#25D366]/10"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>

              {/* Discussion & Comments System */}
              <div className="border border-black p-6 bg-white space-y-6">
                <div>
                  <h3 className="text-lg font-serif font-black uppercase text-black flex items-center gap-1.5 border-b border-black pb-2">
                    <MessageSquare className="w-5 h-5 text-[#D4AF37]" />
                    Student Discussion ({comments.length})
                  </h3>
                  <p className="text-gray-500 text-[10px] font-mono uppercase mt-1 leading-normal">
                    Academic queries, comments, and community exchanges are moderated.
                  </p>
                </div>

                {/* Submissions List */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                  {comments.length === 0 ? (
                    <div className="text-center py-6 text-gray-400 font-mono text-xs uppercase">
                      No comments posted yet. Be primary to write.
                    </div>
                  ) : (
                    comments.map((comment) => (
                      <div key={comment.id} className="border-l-4 border-black pl-4 py-1.5 space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-mono">
                          <span className="font-extrabold uppercase text-[#D4AF37]">{comment.userName}</span>
                          <span className="text-gray-400">{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-black leading-relaxed font-sans">{comment.content}</p>
                      </div>
                    ))
                  )}
                </div>

                {/* Write comment container */}
                <form onSubmit={handleAddComment} className="border-t border-black/10 pt-4 space-y-2">
                  {userProfile ? (
                    <div>
                      <label className="block text-[9px] uppercase font-mono font-bold text-gray-500 mb-1">
                        Interact as <span className="text-black font-extrabold">{userProfile.name} ({userProfile.role})</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Ask a question or offer feedback on this post..."
                          className="flex-grow bg-white border border-black px-3 py-2 text-xs focus:outline-none"
                          maxLength={500}
                          required
                        />
                        <button
                          type="submit"
                          disabled={submittingComment}
                          className="bg-black hover:bg-[#D4AF37] text-white hover:text-black border border-black p-2.5 flex items-center justify-center transition-all disabled:opacity-50 cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-300 p-4 text-center">
                      <p className="text-xs font-sans text-amber-900 mb-2">
                        You must be authenticated to join discussions.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenAuth}
                        className="bg-black text-white hover:bg-[#D4AF37] hover:text-black font-bold uppercase tracking-widest text-[9px] py-1.5 px-4 cursor-pointer"
                      >
                        Sign In / Register
                      </button>
                    </div>
                  )}
                </form>
              </div>

            </div>

            {/* Sidebar Column details */}
            <div className="space-y-6">
              
              {/* Presenter Profile Bios */}
              <div className="border border-black p-5 bg-white space-y-3">
                <span className="text-[10px] uppercase font-mono font-bold text-[#D4AF37] tracking-wider block">
                  Presented Advisor
                </span>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-black text-white font-serif font-bold flex items-center justify-center">
                    {selectedArticle.author.charAt(0)}
                  </div>
                  <div>
                    <h4 className="text-sm font-serif font-black uppercase tracking-tight text-black">
                      {selectedArticle.author}
                    </h4>
                    <span className="text-[9px] uppercase font-mono font-bold text-gray-500">
                      TutorHive Academic Council
                    </span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 leading-normal font-sans">
                  The TutorHive advisory includes university professors, WAEC markers, SPSS analytics partners, and advanced research mentors.
                </p>
              </div>

              {/* Related posts card stack */}
              <div className="border border-black p-5 bg-white space-y-4">
                <h3 className="text-sm font-serif font-black uppercase text-black tracking-wider border-b border-black pb-2">
                  Related Insights
                </h3>
                {relatedPosts.length === 0 ? (
                  <p className="text-xs text-gray-400 font-mono uppercase">No other articles in this category yet.</p>
                ) : (
                  <div className="space-y-3">
                    {relatedPosts.map((r) => (
                      <div
                        key={r.id}
                        onClick={() => setSelectedArticle(r)}
                        className="group cursor-pointer border-b border-gray-100 pb-2.5 hover:border-black transition-colors"
                      >
                        <span className="text-[8px] uppercase tracking-widest font-mono font-bold text-[#D4AF37]">
                          {r.category}
                        </span>
                        <h4 className="text-xs font-sans font-bold text-black uppercase group-hover:text-[#D4AF37] line-clamp-2 transition-colors">
                          {r.title}
                        </h4>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Navigation Action Card */}
              <div className="bg-black text-white p-5 space-y-4">
                <h4 className="text-md font-serif font-black text-white uppercase tracking-wider">
                  Stuck with your Academic Syllabus?
                </h4>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Our professional service can help. Search from hundreds of topic preview booklets, run structured SPSS computations, and study mock examination packages.
                </p>
                <button
                  onClick={() => setSelectedArticle(null)}
                  className="w-full bg-[#D4AF37] text-white hover:bg-white hover:text-black font-extrabold text-[10px] uppercase tracking-widest py-3 border border-[#D4AF37] transition-all cursor-pointer"
                >
                  View All Library Materials
                </button>
              </div>

            </div>
          </div>
        ) : (
          /* ARTICLES LISTING GRID PAGE VIEW */
          <div className="space-y-8 animate-fade-in">
            
            {/* Search & Categories Bar Filters */}
            <div className="bg-white border-2 border-black p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
              
              {/* Text Search */}
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-3 w-4 h-4 text-[#D4AF37]" />
                <input
                  type="text"
                  placeholder="Search educational articles, SPSS tutorials, exam tips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-black pl-10 pr-4 py-2.5 text-xs focus:outline-none"
                />
              </div>

              {/* Category Scroller */}
              <div className="flex gap-2 w-full overflow-x-auto pb-1 md:pb-0 scrollbar-none justify-start md:justify-end">
                <button
                  onClick={() => {
                    setSelectedCategory("All");
                    setSelectedTag("");
                  }}
                  className={`px-3 py-2 text-[10px] font-mono uppercase tracking-wider font-extrabold flex-shrink-0 border cursor-pointer transition-all ${
                    selectedCategory === "All"
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-black/30 hover:border-black"
                  }`}
                >
                  All Categories
                </button>
                {BLOG_CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setSelectedCategory(cat);
                      setSelectedTag("");
                    }}
                    className={`px-3 py-2 text-[10px] font-mono uppercase tracking-wider font-extrabold flex-shrink-0 border cursor-pointer transition-all ${
                      selectedCategory === cat
                        ? "bg-[#D4AF37] text-white border-[#D4AF37]"
                        : "bg-white text-black border-black/30 hover:border-black"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

            </div>

            {/* Tag Filter selection badging */}
            {allTags.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-[10px] uppercase font-mono font-bold text-gray-500 mr-1">Trending Tags:</span>
                {allTags.map((tag) => {
                  const isChosen = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(isChosen ? "" : tag)}
                      className={`text-[9px] uppercase tracking-wider font-bold py-1 px-3 border transition-colors ${
                        isChosen
                          ? "bg-black text-white border-black"
                          : "bg-white text-black border-black/10 hover:border-black"
                      }`}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Empty view state */}
            {filteredArticles.length === 0 && (
              <div className="border border-black bg-white p-16 text-center text-gray-500 font-mono text-sm uppercase">
                No articles matching your filters have been found. Adjust filters to search other topics.
              </div>
            )}

            {/* FEATURED INSIGHT BANNER */}
            {featuredPost && !searchQuery && selectedCategory === "All" && !selectedTag && (
              <div
                onClick={() => setSelectedArticle(featuredPost)}
                className="bg-white border-2 border-black hover:border-[#D4AF37] grid grid-cols-1 lg:grid-cols-2 gap-0 cursor-pointer shadow-none transition-all group overflow-hidden"
              >
                {featuredPost.imageUrl && (
                  <div className="relative h-64 lg:h-auto overflow-hidden border-b lg:border-b-0 lg:border-r border-black">
                    <img
                      src={featuredPost.imageUrl}
                      alt={featuredPost.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover grayscale-[20%] group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-4 left-4 bg-[#D4AF37] text-white text-[9px] uppercase tracking-widest font-mono font-bold px-3 py-1">
                      Featured Guide
                    </div>
                  </div>
                )}
                <div className="p-8 flex flex-col justify-between space-y-6">
                  <div className="space-y-3">
                    <span className="text-[#D4AF37] text-[10px] uppercase tracking-widest font-mono font-bold">
                      {featuredPost.category}
                    </span>
                    <h3 className="text-xl md:text-2xl font-serif font-black uppercase text-black line-clamp-3 group-hover:text-[#D4AF37] transition-colors leading-tight">
                      {featuredPost.title}
                    </h3>
                    <p className="text-gray-500 text-xs line-clamp-4 leading-relaxed font-sans">
                      {featuredPost.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between border-t border-black/10 pt-4 text-[10px] font-mono font-bold uppercase text-gray-500">
                    <div className="flex gap-4">
                      <span>By {featuredPost.author}</span>
                      <span>&bull;</span>
                      <span>{new Date(featuredPost.createdAt).toLocaleDateString()}</span>
                    </div>
                    {userProfile?.role === "admin" && (
                      <button
                        onClick={(e) => handleDeleteBlogPost(featuredPost.id, e)}
                        className="text-red-500 hover:text-red-700 p-1 bg-red-50 hover:bg-red-100"
                        title="Delete this article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* REGULAR NEWS & BLOGS GRID */}
            {filteredArticles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {basicPosts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => setSelectedArticle(post)}
                    className="bg-white border border-black hover:border-[#D4AF37] flex flex-col justify-between cursor-pointer transition-all group"
                  >
                    <div>
                      {post.imageUrl && (
                        <div className="h-44 overflow-hidden border-b border-black">
                          <img
                            src={post.imageUrl}
                            alt={post.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover grayscale-[10%] group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-5 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-[#D4AF37] text-[9px] uppercase tracking-widest font-mono font-bold">
                            {post.category}
                          </span>
                          {post.featured && (
                            <span className="bg-black text-white text-[8px] uppercase font-mono px-1.5 py-0.5">Featured</span>
                          )}
                        </div>
                        <h4 className="text-sm font-sans font-bold uppercase text-black line-clamp-2 group-hover:text-[#D4AF37] transition-colors leading-snug">
                          {post.title}
                        </h4>
                        <p className="text-gray-500 text-[11px] line-clamp-3 leading-relaxed font-sans">
                          {post.content}
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-0">
                      <div className="border-t border-black/10 pt-3 flex items-center justify-between text-[9px] font-mono font-bold uppercase text-gray-500">
                        <span>By {post.author}</span>
                        <div className="flex items-center gap-2">
                          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                          {userProfile?.role === "admin" && (
                            <button
                              onClick={(e) => handleDeleteBlogPost(post.id, e)}
                              className="text-red-500 hover:text-red-700 p-1 bg-red-50"
                              title="Delete this article"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
