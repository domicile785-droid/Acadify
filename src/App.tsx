import React, { useState, useEffect } from "react";
import { 
  Menu, X, Sun, Moon, LogOut, LayoutDashboard, Users, Award, UserCheck, 
  FileText, Megaphone, BarChart2, DollarSign, Calendar, Landmark, Image, MessageSquare, Bell, Settings 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { db, supabase } from "./lib/supabase";
// @ts-ignore
import schoolLogo from "./assets/images/school_emblem_1779511074103.png";
import { 
  Student, Teacher, Attendance, Homework, Notice, Result, Fee, 
  TimetableEntry, LeaveRequest, GalleryItem, Message, SchoolNotification, UserRole 
} from "./types";

// Import modular pages
import DashboardView from "./components/DashboardView";
import StudentManager from "./components/StudentManager";
import TeacherManager from "./components/TeacherManager";
import AttendanceRecords from "./components/AttendanceRecords";
import HomeworkBoard from "./components/HomeworkBoard";
import NoticeBoardView from "./components/NoticeBoardView";
import ResultsAnalytics from "./components/ResultsAnalytics";
import FeesManager from "./components/FeesManager";
import TimetableGrid from "./components/TimetableGrid";
import LeaveRequestsBoard from "./components/LeaveRequestsBoard";
import SchoolGalleryView from "./components/SchoolGalleryView";
import ChatCenter from "./components/ChatCenter";
import PushNotificationCenter from "./components/PushNotificationCenter";
import ChatBot from "./components/ChatBot";
import TeacherDashboard from "./components/TeacherDashboard";
import StudentDashboard from "./components/StudentDashboard";
import ParentDashboard from "./components/ParentDashboard";
import AdminSettings from "./components/AdminSettings";

export default function App() {
  
  // Theme state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem("smart_school_dark_mode") === "true";
  });

  // Splash Screen state
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Auth States
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("smart_school_logged_in") === "true";
  });
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem("smart_school_user_role") as UserRole) || "admin";
  });
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem("smart_school_user_name") || "Elena Rostova";
  });
  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem("smart_school_user_email") || "elena.rostova@smartschool.edu";
  });
  
  // Auth Form Inputs
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [forgotEmail, setForgotEmail] = useState("");
  const [isForgot, setIsForgot] = useState(false);

  // Database lists
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [fees, setFees] = useState<Fee[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [notifications, setNotifications] = useState<SchoolNotification[]>([]);

  // UI Navigation Sidebar state
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Toggle Dark Mode
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("smart_school_dark_mode", String(darkMode));
  }, [darkMode]);

  // Fetch all initial data
  const loadAllData = async () => {
    try {
      const [
        studList, teachList, attList, hwList, notList, resList, 
        feeList, ttList, leaveList, galList, notifList
      ] = await Promise.all([
        db.students.list(),
        db.teachers.list(),
        db.attendance.list(),
        db.homework.list(),
        db.notices.list(),
        db.results.list(),
        db.fees.list(),
        db.timetable.list(),
        db.leave_requests.list(),
        db.gallery.list(),
        db.notifications.list()
      ]);

      setStudents(studList);
      setTeachers(teachList);
      setAttendance(attList);
      setHomework(hwList);
      setNotices(notList);
      setResults(resList);
      setFees(feeList);
      setTimetable(ttList);
      setLeaveRequests(leaveList);
      setGalleryItems(galList);
      setNotifications(notifList);
    } catch (e) {
      console.error("Database pre-populate load error:", e);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Splash screen transition timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  // Save changes callback handlers
  const handleSaveStudent = async (student: Student) => {
    await db.students.save(student);
    const updated = await db.students.list();
    setStudents(updated);
  };

  const handleDeleteStudent = async (id: string) => {
    await db.students.delete(id);
    const updated = await db.students.list();
    setStudents(updated);
  };

  const handleSaveTeacher = async (teacher: Teacher) => {
    const saved = await db.teachers.save(teacher);
    const updated = await db.teachers.list();
    setTeachers(updated);
    return saved;
  };

  const handleDeleteTeacher = async (id: string) => {
    await db.teachers.delete(id);
    const updated = await db.teachers.list();
    setTeachers(updated);
  };

  const handleSaveAttendance = async (items: Attendance[]) => {
    await db.attendance.saveAll(items);
    const updated = await db.attendance.list();
    setAttendance(updated);
  };

  const handleAddHomework = async (item: Homework) => {
    await db.homework.save(item);
    const updated = await db.homework.list();
    setHomework(updated);
  };

  const handleAddNotice = async (item: Notice) => {
    await db.notices.save(item);
    const updated = await db.notices.list();
    setNotices(updated);
  };

  const handleAddResult = async (item: Result) => {
    await db.results.save(item);
    const updated = await db.results.list();
    setResults(updated);
  };

  const handleAddFee = async (fee: Fee) => {
    await db.fees.save(fee);
    const updated = await db.fees.list();
    setFees(updated);
  };

  const handleUpdateFeeStatus = async (id: string, status: "Paid" | "Unpaid" | "Overdue") => {
    const fee = fees.find(f => f.id === id);
    if (fee) {
      const updatedFee = { ...fee, status, receipt_no: status === "Paid" ? `REC-${Date.now().toString().substring(5)}` : undefined };
      await db.fees.save(updatedFee);
      const updated = await db.fees.list();
      setFees(updated);
    }
  };

  const handleAddLeave = async (item: LeaveRequest) => {
    await db.leave_requests.save(item);
    const updated = await db.leave_requests.list();
    setLeaveRequests(updated);
  };

  const handleUpdateLeaveStatus = async (id: string, status: "Approved" | "Rejected", approvedBy: string) => {
    const leave = leaveRequests.find(l => l.id === id);
    if (leave) {
      const updatedLeave = { ...leave, status, approved_by: approvedBy };
      await db.leave_requests.save(updatedLeave);
      const updated = await db.leave_requests.list();
      setLeaveRequests(updated);
    }
  };

  const handleAddGalleryItem = async (item: GalleryItem) => {
    await db.gallery.add(item);
    const updated = await db.gallery.list();
    setGalleryItems(updated);
  };

  const handleSendMessage = async (msg: Message) => {
    await db.messages.send(msg);
  };

  const handleTriggerNotification = async (title: string, content: string, role: "student" | "parent" | "teacher" | "all") => {
    const notifObj: SchoolNotification = {
      id: `notif-${Date.now()}`,
      title,
      content,
      type: "general",
      target_role: role,
      date: new Date().toISOString().split("T")[0],
      read: false
    };
    await db.notifications.create(notifObj);
    const updated = await db.notifications.list();
    setNotifications(updated);
  };

  const handleClearNotification = async (id: string) => {
    await db.notifications.markAsRead(id);
    const updated = await db.notifications.list();
    setNotifications(updated);
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const credential = emailInput.trim();
    const pass = passwordInput.trim();

    if (!pass) return;

    // 1. Try real Supabase Auth first if initialized
    if ((import.meta as any).env.VITE_SUPABASE_URL) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: credential,
          password: pass
        });

        if (authData?.user && !authError) {
          const userObj = authData.user;
          let discoveredRole = userRole;
          let fullName = userObj.user_metadata?.full_name || "Faculty Member";

          // Lookup matching profile record
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("*")
              .eq("auth_user_id", userObj.id)
              .single();

            if (profile) {
              discoveredRole = profile.role as any;
              fullName = profile.full_name || fullName;
            } else if (userObj.user_metadata?.role) {
              discoveredRole = userObj.user_metadata.role;
            }
          } catch (profileErr) {}

          setIsLoggedIn(true);
          setUserRole(discoveredRole);
          setUserName(fullName);
          setUserEmail(userObj.email || "");

          localStorage.setItem("smart_school_logged_in", "true");
          localStorage.setItem("smart_school_user_role", discoveredRole);
          localStorage.setItem("smart_school_user_name", fullName);
          localStorage.setItem("smart_school_user_email", userObj.email || "");

          alert(`Successfully signed in onto Supabase as ${discoveredRole.toUpperCase()} Account: ${fullName}`);
          return;
        } else if (authError) {
          const errMsg = authError.message ? authError.message.toLowerCase() : "";
          const isNetworkError = errMsg.includes("fetch") || errMsg.includes("network") || errMsg.includes("load failed") || errMsg.includes("unreachable") || errMsg.includes("cors");

          if (isNetworkError) {
            console.warn("Supabase auth server is unreachable. Falling back to secure offline simulation mode.", authError);
            alert("The school network database is currently in sandbox mode / unreachable. Logging you in via high-fidelity offline simulation registry.");
            // We do NOT return: we fall through to the mock login block so the user is never locked out!
          } else {
            // If it's a real non-demo sign up login attempt, notify user of credentials mismatch
            const isDemoAccount = ["admin", "teacher", "student", "parent"].includes(userRole) && 
                                  (credential.includes("smartschool.edu") || credential.includes("555") || credential === "");
            if (!isDemoAccount) {
              alert(`Authentication failed: ${authError.message}`);
              return;
            }
          }
        }
      } catch (err) {
        console.error("Supabase sign in caught error:", err);
      }
    }

    // Direct simulation mapper matching the credentials requested by user
    let loggedName = "Elena Rostova";
    if (userRole === "admin") loggedName = "Administrator (School Principal)";
    if (userRole === "teacher") loggedName = "Elena Rostova";
    if (userRole === "student") loggedName = "David Miller";
    if (userRole === "parent") loggedName = "Sarah Miller";

    const defaultEmail = {
      admin: "admin@smartschool.edu",
      teacher: "elena.rostova@smartschool.edu",
      student: "david.m@smartschool.edu",
      parent: "sarah.m@smartschool.edu"
    }[userRole] || "";

    setIsLoggedIn(true);
    setUserName(loggedName);
    setUserEmail(credential || defaultEmail);

    localStorage.setItem("smart_school_logged_in", "true");
    localStorage.setItem("smart_school_user_role", userRole);
    localStorage.setItem("smart_school_user_name", loggedName);
    localStorage.setItem("smart_school_user_email", credential || defaultEmail);

    alert(`Successfully signed in onto the Smart School registry as ${userRole.toUpperCase()} Account (Simulated demo).`);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("smart_school_logged_in");
    localStorage.removeItem("smart_school_user_role");
    localStorage.removeItem("smart_school_user_name");
    localStorage.removeItem("smart_school_user_email");
  };

  // Sidebar items mapped dynamically for quick toggles
  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "students", label: "Student Management", icon: Users },
    { id: "teachers", label: "Teacher Management", icon: Award },
    { id: "attendance", label: "Attendance Portal", icon: UserCheck },
    { id: "homework", label: "Homework Center", icon: FileText },
    { id: "notices", label: "Notice Board", icon: Megaphone },
    { id: "results", label: "Grades & Results", icon: BarChart2 },
    { id: "fees", label: "Fees & Ledger", icon: DollarSign },
    { id: "timetable", label: "Lecture Schedule", icon: Calendar },
    { id: "leaves", label: "Leave Requests", icon: Landmark },
    { id: "gallery", label: "Event Gallery", icon: Image },
    { id: "chat", label: "Live Chat Hub", icon: MessageSquare },
    { id: "notifications", label: "Push Notification", icon: Bell },
    { id: "settings", label: "Admin Settings", icon: Settings }
  ];

  return (
    <AnimatePresence mode="wait">
      {showSplash ? (
        <motion.div
          key="splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-4 bg-slate-950 text-white selection:bg-emerald-500/20 select-none w-full min-h-screen"
        >
          {/* Decorative ambient light */}
          <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Symmetrical design matching the school's aesthetic */}
          <div className="flex flex-col items-center max-w-lg text-center space-y-6 sm:space-y-8 relative z-10">
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 95 }}
              className="relative p-1 rounded-full bg-gradient-to-b from-amber-400 to-amber-600 shadow-[0_0_55px_rgba(245,158,11,0.25)]"
            >
              <div className="rounded-full bg-slate-950 p-1.5 flex items-center justify-center">
                <img
                  src={schoolLogo}
                  alt="Govt Higher Secondary School Hygam"
                  className="w-44 h-44 sm:w-52 sm:h-52 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
            </motion.div>

            <div className="space-y-3 px-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
              >
                <span className="text-[10px] tracking-[0.25em] font-black uppercase text-amber-500 bg-amber-500/10 px-3.5 py-1 rounded-full border border-amber-500/25">
                  Welcome to App Portal
                </span>
              </motion.div>

              <motion.h1
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.5 }}
                className="text-2xl sm:text-3.5xl font-extrabold tracking-tight text-white uppercase leading-tight"
              >
                Govt Higher Secondary School
                <span className="block mt-1 font-black text-amber-400 text-3xl sm:text-4.5xl font-serif tracking-wide select-text">Hygam</span>
              </motion.h1>

              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="text-xs font-semibold text-teal-400 tracking-widest uppercase font-mono mt-1"
              >
                Knowledge • Discipline • Service
              </motion.p>
            </div>

            {/* Premium Loader Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="w-48 sm:w-56 h-1 bg-slate-800 rounded-full overflow-hidden relative"
            >
              <motion.div
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-teal-500 via-amber-400 to-teal-500 rounded-full"
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              className="text-[10px] text-slate-500 font-mono tracking-wider"
            >
              Connecting Secure School Network...
            </motion.p>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="main-app"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans antialiased selection:bg-emerald-500/20 selection:text-emerald-900 w-full"
        >
      
      {/* AUTHENTICATION VIEW */}
      {!isLoggedIn ? (
        <div className="flex-1 flex items-center justify-center p-4 bg-radial from-slate-900 via-teal-950 to-slate-950 antialiased relative overflow-hidden">
          
          <div className="absolute top-0 right-0 w-[550px] h-[550px] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-96 h-96 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="w-full max-w-md transform transition-all duration-300 scale-100 animate-in fade-in zoom-in duration-300">
            
            <div className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-800 p-6 sm:p-8 space-y-6">
              
              {/* BRANDING HEADER */}
              <div className="text-center space-y-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md">
                  <Landmark className="h-6 w-6" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">Smart School Portal</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Classrooms, Attendance logs & Grading indices synced in real-time</p>
              </div>

              {isForgot ? (
                /* FORGOT PASSWORD FORM */
                <form onSubmit={(e) => { e.preventDefault(); alert("Verification OTP code reset instructions dispatched to email."); setIsForgot(false); }} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Enter your registered Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="name@smartschool.edu"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-white"
                    />
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl cursor-pointer">
                    Request Password Reset
                  </button>
                  <button type="button" onClick={() => setIsForgot(false)} className="w-full text-center text-slate-500 hover:text-emerald-500 block font-semibold cursor-pointer">
                    Back to Login
                  </button>
                </form>
              ) : (
                /* PRINCIPAL LOGIN FORM */
                <form onSubmit={handleLogin} className="space-y-4 text-xs">
                  
                  {/* ROLE PICKER SELECTOR (Admin, Teacher, Student, Parent) */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">Select Portal Role Access</label>
                    <div className="grid grid-cols-4 gap-1.5 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border">
                      {(["admin", "teacher", "student", "parent"] as const).map((role) => (
                        <button
                          key={role}
                          type="button"
                          onClick={() => {
                            setUserRole(role);
                            // Set suggestions
                            if (role === "admin") { setEmailInput("admin@smartschool.edu"); setPhoneInput("80055501"); }
                            if (role === "teacher") { setEmailInput("elena.rostova@smartschool.edu"); setPhoneInput("5550101"); }
                            if (role === "student") { setEmailInput("david.m@smartschool.edu"); setPhoneInput("5550192"); }
                            if (role === "parent") { setEmailInput("sarah.m@smartschool.edu"); setPhoneInput("5550193"); }
                          }}
                          className={`py-2 rounded-lg capitalize font-bold text-[10px] sm:text-[11px] select-none transition-all cursor-pointer ${
                            userRole === role 
                              ? "bg-slate-900 text-white dark:bg-emerald-600" 
                              : "text-slate-550 hover:text-slate-800"
                          }`}
                        >
                          {role}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Mobile number or Email Address</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. name@smartschool.edu or +1 555-0101"
                      value={emailInput || phoneInput}
                      onChange={(e) => { setEmailInput(e.target.value); setPhoneInput(e.target.value); }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-705 bg-white dark:bg-slate-950 focus:outline-hidden text-slate-800 dark:text-white"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-bold text-slate-505 dark:text-slate-404">Secure Password</label>
                      <button type="button" onClick={() => setIsForgot(true)} className="text-[10px] text-emerald-600 hover:text-emerald-700 font-semibold cursor-pointer">
                        Forgot Password?
                      </button>
                    </div>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-705 bg-white dark:bg-slate-950 focus:outline-hidden text-slate-800 dark:text-white"
                    />
                  </div>

                  {/* SUBMIT ACCREDITATION */}
                  <button
                    type="submit"
                    className="w-full bg-slate-900 dark:bg-emerald-600 hover:opacity-90 text-white font-bold py-3 rounded-xl transition-all shadow-md cursor-pointer text-xs"
                  >
                    Authenticate Secure Sign In
                  </button>

                  <div className="border-t border-slate-100 dark:border-slate-800 pt-3 text-center text-[10px] text-slate-400 leading-relaxed space-y-1">
                    <p>💡 Preloaded demo logins enabled. Choose any role & type any credentials to authenticate instantly.</p>
                  </div>

                </form>
              )}

            </div>
          </div>
        </div>
      ) : (isLoggedIn && userRole === "teacher") ? (
        <TeacherDashboard 
          userEmail={userEmail}
          userName={userName}
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      ) : (isLoggedIn && userRole === "student") ? (
        <StudentDashboard 
          userEmail={userEmail}
          userName={userName}
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      ) : (isLoggedIn && userRole === "parent") ? (
        <ParentDashboard
          userEmail={userEmail}
          userName={userName}
          onLogout={handleLogout}
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
      ) : (
        /* MAIN LANDING VIEW INCLUDING REAL SIDEBARS */
        <div className="flex-1 flex flex-col md:flex-row min-h-screen">
          
          {/* Mobile responsive Header line */}
          <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 sticky top-0 z-40 p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-black text-sm">
                S
              </div>
              <span className="font-extrabold text-sm tracking-tight text-slate-900 dark:text-white">Smart School Portal</span>
            </div>
            
            <div className="flex items-center gap-1.5">
              <button onClick={() => setDarkMode(!darkMode)} className="p-1.5 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg">
                {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 text-slate-500 dark:text-slate-450 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg">
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </header>

          {/* Mobile Overlay Backdrop */}
          {sidebarOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/70 z-40 md:hidden transition-opacity duration-200"
              onClick={() => setSidebarOpen(false)}
            />
          )}

          {/* SIDEBAR NAVIGATION GRID */}
          <aside className={`fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 w-64 transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          } md:relative md:translate-x-0 shrink-0 flex flex-col justify-between transition-transform duration-250 ease-in-out`}>
            
            <div>
              {/* Brand descriptor */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-xs">
                  <Landmark className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-black text-sm text-slate-900 dark:text-white tracking-tight">Smart School App</h2>
                  <span className="text-[9px] uppercase font-mono bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 px-1.5 py-0.2 rounded-full font-bold">
                    Authenticated
                  </span>
                </div>
              </div>

              {/* Navigation Tabs List Stack */}
              <nav className="p-3.5 space-y-1 overflow-y-auto max-h-[70vh]">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold tracking-tight transition-all cursor-pointer ${
                        isActive 
                          ? "bg-slate-900 text-slate-50 dark:bg-emerald-600 shadow-sm" 
                          : "text-slate-550 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/65"
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Profile bottom footer controls */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3.5">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 bg-slate-100 dark:bg-slate-805 rounded-xl border object-cover ring-2 ring-emerald-500/10 flex items-center justify-center font-bold text-slate-800 dark:text-white uppercase font-mono">
                  {userName.substring(0, 2)}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-extrabold text-slate-800 dark:text-white truncate" title={userName}>{userName}</p>
                  <span className="text-[10px] text-slate-400 capitalize block">Role: {userRole}</span>
                </div>
              </div>

              {/* Theme toggle & logout */}
              <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className="flex items-center gap-1 text-slate-450 hover:text-slate-750 dark:hover:text-white select-none cursor-pointer"
                >
                  {darkMode ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4" />}
                  <span>{darkMode ? "Light" : "Dark"}</span>
                </button>

                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-rose-500 hover:text-rose-600 font-bold cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>

          </aside>

          {/* MAIN PAGE VIEW FRAMEWORK */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto space-y-6">
            
            {/* Navigated Sub Route switches */}
            {activeTab === "dashboard" && (
              <DashboardView 
                role={userRole} 
                students={students} 
                teachers={teachers} 
                notices={notices} 
                fees={fees} 
                homework={homework} 
                onNavigate={(tab) => {
                  if (navItems.some(item => item.id === tab)) {
                    setActiveTab(tab);
                  }
                }}
              />
            )}

            {activeTab === "students" && (
              <StudentManager 
                students={students} 
                onSaveStudent={handleSaveStudent} 
                onDeleteStudent={handleDeleteStudent} 
                isAdminOrTeacher={userRole === "admin" || userRole === "teacher"}
              />
            )}

            {activeTab === "teachers" && (
              <TeacherManager 
                teachers={teachers} 
                onSaveTeacher={handleSaveTeacher} 
                onDeleteTeacher={handleDeleteTeacher} 
                isAdmin={userRole === "admin"}
              />
            )}

            {activeTab === "attendance" && (
              <AttendanceRecords 
                students={students} 
                attendanceLogs={attendance} 
                onSaveAttendance={handleSaveAttendance} 
                onTriggerNotification={handleTriggerNotification} 
                userName={userName}
              />
            )}

            {activeTab === "homework" && (
              <HomeworkBoard 
                homeworkList={homework} 
                onAddHomework={handleAddHomework} 
                isAdminOrTeacher={userRole === "admin" || userRole === "teacher"}
                teacherName={userName}
              />
            )}

            {activeTab === "notices" && (
              <NoticeBoardView 
                notices={notices} 
                onAddNotice={handleAddNotice} 
                isAdminOrTeacher={userRole === "admin" || userRole === "teacher"}
              />
            )}

            {activeTab === "results" && (
              <ResultsAnalytics 
                students={students} 
                results={results} 
                onAddResult={handleAddResult} 
                isAdminOrTeacher={userRole === "admin" || userRole === "teacher"}
              />
            )}

            {activeTab === "fees" && (
              <FeesManager 
                students={students} 
                fees={fees} 
                onAddFee={handleAddFee} 
                onUpdateFeeStatus={handleUpdateFeeStatus} 
                onTriggerNotification={handleTriggerNotification} 
                isAdmin={userRole === "admin"}
              />
            )}

            {activeTab === "timetable" && (
              <TimetableGrid 
                entries={timetable} 
              />
            )}

            {activeTab === "leaves" && (
              <LeaveRequestsBoard 
                leaveList={leaveRequests} 
                onAddLeave={handleAddLeave} 
                onUpdateLeaveStatus={handleUpdateLeaveStatus} 
                isAdminOrTeacher={userRole === "admin" || userRole === "teacher"}
                userRole={userRole}
                userName={userName}
              />
            )}

            {activeTab === "gallery" && (
              <SchoolGalleryView 
                galleryItems={galleryItems} 
                onAddGalleryItem={handleAddGalleryItem} 
                isAdminOrTeacher={userRole === "admin" || userRole === "teacher"}
              />
            )}

            {activeTab === "chat" && (
              <ChatCenter 
                students={students} 
                teachers={teachers} 
                onSendMessage={handleSendMessage} 
                userName={userName}
              />
            )}

            {activeTab === "notifications" && (
              <PushNotificationCenter 
                notifications={notifications} 
                onTriggerNotification={handleTriggerNotification} 
                onClearNotification={handleClearNotification} 
                isAdmin={userRole === "admin"}
              />
            )}

            {activeTab === "settings" && (
              <AdminSettings />
            )}

          </main>

          {/* FLOATING SMARTY ASSISTANT IN LOWER CORNER */}
          <ChatBot userRole={userRole} userName={userName} />

        </div>
      )}

        </motion.div>
      )}
    </AnimatePresence>
  );
}
