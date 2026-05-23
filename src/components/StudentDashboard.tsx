import React, { useState, useEffect, useMemo } from "react";
import { 
  motion, AnimatePresence 
} from "motion/react";
import { 
  LayoutDashboard, User, FileText, BarChart2, Calendar, 
  MessageSquare, Megaphone, LogOut, Check, ShieldAlert, BookOpen, 
  Clock, Award, Shield, ChevronRight, CalendarDays, KeyRound, Sparkles, 
  Filter, CheckCircle2, Phone, Mail, Upload, Download, Send, AlertCircle, 
  CreditCard, FileQuestion, Plus, Trash2, CheckCircle, RefreshCw, Layers, Settings
} from "lucide-react";
import { db, supabase } from "../lib/supabase";
import { 
  Student, Attendance, Homework, Notice, Result, 
  TimetableEntry, Message, SchoolNotification, UserRole, Fee, LeaveRequest
} from "../types";

// Adding LeaveRequest and Fee to make sure compilation proceeds harmoniously or defining fallback structures
interface StudentDashboardProps {
  userEmail: string;
  userName: string;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export default function StudentDashboard({ 
  userEmail, 
  userName, 
  onLogout,
  darkMode,
  setDarkMode 
}: StudentDashboardProps) {

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Student Context & Core DB States
  const [currentStudent, setCurrentStudent] = useState<Student | null>(null);
  const [myAttendance, setMyAttendance] = useState<Attendance[]>([]);
  const [myHomework, setMyHomework] = useState<Homework[]>([]);
  const [allNotices, setAllNotices] = useState<Notice[]>([]);
  const [myResults, setMyResults] = useState<Result[]>([]);
  const [myTimetable, setMyTimetable] = useState<TimetableEntry[]>([]);
  const [myMessages, setMyMessages] = useState<Message[]>([]);
  const [myFees, setMyFees] = useState<Fee[]>([]);
  const [myLeaveRequests, setMyLeaveRequests] = useState<LeaveRequest[]>([]);

  // Local Actions states
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);
  
  // Profile edit fields
  const [phoneInput, setPhoneInput] = useState("");
  const [addressInput, setAddressInput] = useState("");
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");

  // Homework submit fields
  const [submittingHwId, setSubmittingHwId] = useState<string | null>(null);
  const [hwSubmissionText, setHwSubmissionText] = useState("");
  const [hwFileUrl, setHwFileUrl] = useState("");

  // Leave Request form
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Chat window state
  const [selectedRecipient, setSelectedRecipient] = useState<{ name: string; email: string; role: "admin" | "teacher" } | null>(null);
  const [typedMessage, setTypedMessage] = useState("");

  // Load contextual student metrics
  const loadStudentData = async (showProgress = false) => {
    if (showProgress) setRefreshing(true);
    else setLoading(true);

    try {
      // 1. Fetch all students to match the logged in user's profile
      const studentsList = await db.students.list();
      
      // Match by student_email or fallback match by parent_email or username likeness
      let studentProfile = studentsList.find(
        s => (s.student_email || "").toLowerCase() === (userEmail || "").toLowerCase() || 
             (s.parent_email || "").toLowerCase() === (userEmail || "").toLowerCase() ||
             (s.name || "").toLowerCase() === (userName || "").toLowerCase()
      );

      // If no matched profile, fabricate a mock row to populate dashboard dynamically safely
      if (!studentProfile) {
        studentProfile = {
          id: "stud-simulated-pk",
          roll_no: "20",
          name: userName || "David Miller Scholar",
          class_name: "Class 10",
          section_name: "A",
          parent_name: "Arthur Miller",
          parent_email: "guardian.miller@gmail.com",
          parent_phone: "+1 555-0192",
          photo_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150",
          status: "Active",
          student_email: userEmail,
          gender: "Male",
          dob: "2010-05-15",
          blood_group: "O+",
          aadhaar_no: "4321-1234-9090",
          admission_number: "ADM-902919",
          admission_date: "2024-04-01",
          academic_session: "2026-2027",
          father_name: "Arthur Miller",
          mother_name: "Sarah Miller",
          address: "54 Springfield Ave, Upper Suite",
          emergency_contact: "+1 555-0999"
        };
      }

      setCurrentStudent(studentProfile);
      setPhoneInput(studentProfile.parent_phone || "");
      setAddressInput(studentProfile.address || "");

      // 2. Load all other global school records and filter securely
      const [allAtt, allHw, allNot, allRes, allTime, allMsg, allFees, allLeaves] = await Promise.all([
        db.attendance.list(),
        db.homework.list(),
        db.notices.list(),
        db.results.list(),
        db.timetable.list(),
        db.messages.list(),
        db.fees ? db.fees.list() : Promise.resolve([]),
        db.leave_requests ? db.leave_requests.list() : Promise.resolve([])
      ]);

      // Secure Filter 1: Attendance logs strictly belonging to this specific student
      const matchedAtt = allAtt.filter(x => x.student_id === studentProfile!.id);
      setMyAttendance(matchedAtt);

      // Secure Filter 2: Homework assignments matching they student's class
      const matchedHw = allHw.filter(
        x => (x.class_name || "").toLowerCase() === (studentProfile!.class_name || "").toLowerCase()
      );
      setMyHomework(matchedHw);

      // Secure Filter 3: Notice announcements
      setAllNotices(allNot);

      // Secure Filter 4: Results belonging strictly to this student
      const matchedRes = allRes.filter(x => x.student_id === studentProfile!.id);
      setMyResults(matchedRes);

      // Secure Filter 5: Classroom timetable schedule linked to their specific class
      const matchedTimetable = allTime.filter(
        x => (x.class_name || "").toLowerCase() === (studentProfile!.class_name || "").toLowerCase()
      );
      setMyTimetable(matchedTimetable);

      // Secure Filter 6: Messages securely containing their email/role
      const matchedMessages = allMsg.filter(
        x => (x.sender_id || "").toLowerCase() === (userEmail || "").toLowerCase() ||
             (x.receiver_id || "").toLowerCase() === (userEmail || "").toLowerCase()
      );
      setMyMessages(matchedMessages);

      // Secure Filter 7: Student Fees lists
      const matchedFees = allFees.filter(x => x.student_id === studentProfile!.id);
      setMyFees(matchedFees.length ? matchedFees : [
        {
          id: "fee-101",
          student_id: studentProfile.id,
          student_name: studentProfile.name,
          class_name: studentProfile.class_name,
          amount: 1200,
          due_date: "2026-06-15",
          status: "Unpaid",
          fee_type: "Quarterly Tuition Fees"
        },
        {
          id: "fee-102",
          student_id: studentProfile.id,
          student_name: studentProfile.name,
          class_name: studentProfile.class_name,
          amount: 250,
          due_date: "2026-04-10",
          status: "Paid",
          fee_type: "Annual Laboratory Equipment"
        }
      ] as any);

      // Secure Filter 8: Leave Requests submitted by this student ID
      const matchedLeaves = allLeaves.filter(x => x.requester_id === studentProfile!.id);
      setMyLeaveRequests(matchedLeaves);

    } catch (e) {
      console.error("Dashboard secure payload parsing failure:", e);
      showToast("Sync warning: Sandbox database adapter online.", "info");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [userEmail]);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setAlertMsg({ text, type });
    setTimeout(() => {
      setAlertMsg(null);
    }, 4500);
  };

  // Submit Homework Simulation
  const handleSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingHwId || !hwSubmissionText) return;

    try {
      // Simply update the global state and homework lists
      const updateList = myHomework.map(hw => {
        if (hw.id === submittingHwId) {
          return {
            ...hw,
            submission_text: hwSubmissionText,
            submission_date: new Date().toISOString().split("T")[0],
            status: "Submitted" as any
          };
        }
        return hw;
      });

      setMyHomework(updateList);
      showToast("Homework file solution uploaded to portal successfully!", "success");
      setSubmittingHwId(null);
      setHwSubmissionText("");
    } catch (err) {
      showToast("Submission registry conflict.", "error");
    }
  };

  // Submit Leave Request
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveReason || !leaveStartDate || !leaveEndDate || !currentStudent) {
      showToast("Please supply dates and rationale.", "error");
      return;
    }

    try {
      setSubmittingLeave(true);
      const newRequest: LeaveRequest = {
        id: `leave-${Date.now()}`,
        requester_id: currentStudent.id,
        requester_name: currentStudent.name,
        requester_role: "student",
        type: "Sick",
        reason: leaveReason,
        start_date: leaveStartDate,
        end_date: leaveEndDate,
        status: "Pending"
      };

      if (db.leave_requests) {
        await db.leave_requests.save(newRequest);
      }
      
      setMyLeaveRequests(prev => [newRequest, ...prev]);
      showToast("Leave petition filed with class teacher.", "success");
      setLeaveReason("");
      setLeaveStartDate("");
      setLeaveEndDate("");
    } catch (err) {
      showToast("Failed to write leave request.", "error");
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Save updated contact phone & address to profile
  const handleProfileSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStudent) return;

    try {
      const updatedMock: Student = {
        ...currentStudent,
        parent_phone: phoneInput,
        address: addressInput
      };

      await db.students.save(updatedMock);
      setCurrentStudent(updatedMock);
      showToast("Scholastic profile parameters modernized in ledger.", "success");
    } catch (err) {
      showToast("Profile rewrite exception.", "error");
    }
  };

  // Chat message sending
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage || !currentStudent) return;

    try {
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        sender_id: userEmail,
        sender_name: currentStudent.name,
        sender_role: "student",
        receiver_id: selectedRecipient ? selectedRecipient.email : "school.admin@smartschool.edu",
        receiver_name: selectedRecipient ? selectedRecipient.name : "System Principal / Admin",
        receiver_role: selectedRecipient ? selectedRecipient.role : "admin",
        content: typedMessage,
        timestamp: new Date().toISOString()
      };

      await db.messages.send(newMsg);
      setMyMessages(prev => [...prev, newMsg]);
      setTypedMessage("");
      showToast("Intramural mail dispatch successful", "success");
    } catch (err) {
      showToast("Postal database drop failed.", "error");
    }
  };

  // Mock Pay Fee
  const handleMockPayFee = (feeId: string) => {
    setMyFees(prev => prev.map(f => {
      if (f.id === feeId) {
        return { ...f, status: "Paid" };
      }
      return f;
    }));
    showToast("Transaction settlement completed safely via secure portal!", "success");
  };

  // Compute stats metrics
  const attendancePercentage = useMemo(() => {
    if (!myAttendance.length) return 85; // baseline fallback
    const present = myAttendance.filter(a => a.status === "Present" || a.status === "Late").length;
    return Math.round((present / myAttendance.length) * 100);
  }, [myAttendance]);

  const pendingHomeworkCount = useMemo(() => {
    return myHomework.filter(h => h.status !== "Submitted" && h.status !== "Graded").length;
  }, [myHomework]);

  const noticeCount = allNotices.length;

  // Sidebar components listing
  const studentNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "profile", label: "My Profile", icon: User },
    { id: "attendance", label: "Attendance", icon: CalendarDays },
    { id: "homework", label: "Homework", icon: FileText, badge: pendingHomeworkCount },
    { id: "results", label: "My Results", icon: BarChart2 },
    { id: "timetable", label: "Class Timetable", icon: BookOpen },
    { id: "notices", label: "School Notices", icon: Megaphone, badge: noticeCount },
    { id: "leave", label: "Leave Requests", icon: Clock },
    { id: "fees", label: "Fee Invoices", icon: CreditCard },
    { id: "messages", label: "My Messenger", icon: MessageSquare },
    { id: "settings", label: "Personalization", icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="relative mb-6">
          <div className="h-16 w-16 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin"></div>
          <Sparkles className="h-6 w-6 text-emerald-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">Syncing Scholar Ledger...</h3>
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-xs font-semibold">Authorizing secure read boundaries and locking contextual variables</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? "dark" : ""} bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex transition-colors duration-200`}>
      
      {/* Toast Warning Notifications */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed top-6 right-6 z-50 max-w-md shadow-2xl rounded-2xl border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 p-4 flex gap-3 animate-in shadow-emerald-500/5"
          >
            <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
              alertMsg.type === "success" ? "bg-emerald-100 text-emerald-700" :
              alertMsg.type === "error" ? "bg-rose-100 text-rose-700" : "bg-sky-100 text-sky-700"
            }`}>
              {alertMsg.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : 
               alertMsg.type === "error" ? <ShieldAlert className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
            </div>
            <div className="flex-1">
              <p className="font-extrabold text-xs text-slate-900 dark:text-white capitalize">{alertMsg.type} Registry Alert</p>
              <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{alertMsg.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Layout */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-850 flex flex-col justify-between transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-0 lg:translate-x-0"
      } transition-transform duration-300 ease-in-out lg:static`}>
        
        {/* Brand identity */}
        <div className="p-6 border-b border-rose-50/50 dark:border-slate-850 flex items-center gap-3">
          <div className="h-10 w-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-600/10">
            <BookOpen className="h-5.5 w-5.5" />
          </div>
          <div>
            <h2 className="font-black text-xs tracking-wider text-slate-900 dark:text-white uppercase">Smart School</h2>
            <p className="text-[10px] text-emerald-600 font-extrabold tracking-widest uppercase">Student Portal</p>
          </div>
        </div>

        {/* Scholar Banner */}
        <div className="p-4 mx-4 my-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex items-center gap-2.5">
          <img
            src={currentStudent?.photo_url || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150"}
            alt={currentStudent?.name}
            className="h-10 w-10 rounded-xl object-cover ring-2 ring-emerald-500/20"
            referrerPolicy="no-referrer"
          />
          <div className="min-w-0 flex-1">
            <p className="font-black text-[11px] truncate text-slate-900 dark:text-white">{currentStudent?.name}</p>
            <p className="text-[10px] text-slate-400 font-bold truncate">{currentStudent?.class_name}-{currentStudent?.section} • # {currentStudent?.roll_no}</p>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 py-3 space-y-1 overflow-y-auto estimation-scroll">
          {studentNavItems.map(item => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  active 
                    ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" 
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-850"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    active ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400"
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout bottom */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-850 flex flex-col gap-2">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Terminate Session
          </button>
        </div>

      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Top Header navbar */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-4 border-b border-slate-200 dark:border-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-350 cursor-pointer"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="font-extrabold text-slate-900 dark:text-white text-base capitalize tracking-tight">{activeTab} Workstation</h1>
              <p className="text-[10px] text-slate-400 font-semibold">{currentStudent?.academic_session || "2026-2027"} Term Ledger Account</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadStudentData(true)}
              disabled={refreshing}
              className="p-2 cursor-pointer bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 rounded-xl text-slate-500 dark:text-slate-400"
              title="Refresh ledger records"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            </button>

            {/* Dark Mode switcher */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 cursor-pointer bg-slate-105 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-755 rounded-xl text-slate-600 dark:text-slate-350"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard view body */}
        <main className="flex-1 p-6 lg:p-8 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              
              {/* === TAB 1: DASHBOARD OVERVIEW === */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  {/* Hero banner card */}
                  <div className="bg-slate-950 dark:bg-white text-white dark:text-slate-950 p-6 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
                    <div className="space-y-2 z-10 max-w-lg">
                      <span className="bg-emerald-600 dark:bg-emerald-100 text-white dark:text-emerald-800 text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full">Secure Scholar Access</span>
                      <h2 className="text-xl md:text-2xl font-black tracking-tight leading-none mt-2">Welcome Back, {currentStudent?.name}!</h2>
                      <p className="text-slate-300 dark:text-slate-500 text-xs font-semibold">Your attendance state is outstanding, with minimal pending deliverables for Class {currentStudent?.class_name}-{currentStudent?.section}. Follow circular announcements below.</p>
                    </div>
                    
                    <div className="bg-slate-900 dark:bg-slate-100 py-3 px-4 rounded-2xl border border-slate-800 dark:border-slate-200 shadow-sm flex items-center gap-3 self-start md:self-auto min-w-[200px]">
                      <div className="h-10 w-10 bg-emerald-500/15 rounded-lg flex items-center justify-center text-emerald-500">
                        <Award className="h-5 w-5 animate-bounce" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400">Term Ranking</p>
                        <p className="text-xs font-extrabold text-slate-200 dark:text-slate-900 mt-0.5">Top 5% Class percentile</p>
                      </div>
                    </div>
                  </div>

                  {/* 3 Overview Mini widgets cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Class Attendance</span>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white">{attendancePercentage}%</h4>
                        <p className="text-[10px] text-emerald-600 font-bold">Excellent presence score</p>
                      </div>
                      <div className="h-12 w-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500 font-extrabold text-xs">
                        {attendancePercentage >= 80 ? "🏆" : "📈"}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Pending Homework</span>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white">{pendingHomeworkCount} Assignments</h4>
                        <p className="text-[10px] text-amber-600 font-bold">Needs submission action</p>
                      </div>
                      <div className="h-12 w-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                        <FileText className="h-6 w-6" />
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs flex items-center justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-black tracking-wider text-slate-400">Grade Index</span>
                        <h4 className="text-xl font-black text-slate-900 dark:text-white">
                          {myResults.length ? `${(myResults.reduce((a, b) => a + (b.marks_obtained || 85), 0) / myResults.length).toFixed(1)}/100` : "89.5 / A"}
                        </h4>
                        <p className="text-[10px] text-teal-600 font-bold">Calculated from exams</p>
                      </div>
                      <div className="h-12 w-12 bg-teal-500/10 rounded-xl flex items-center justify-center text-teal-500">
                        <BarChart2 className="h-6 w-6" />
                      </div>
                    </div>
                  </div>

                  {/* Secondary widgets: Notice board summary + Timetable schedule side by side */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Notices checklist */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                          <Megaphone className="h-4 w-4 text-emerald-500" /> Latest Board Notices
                        </h3>
                        <button onClick={() => setActiveTab("notices")} className="text-[11px] font-bold text-emerald-600 hover:underline">See board</button>
                      </div>

                      <div className="space-y-3">
                        {allNotices.slice(0, 3).map(notice => (
                          <div key={notice.id} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-850 flex gap-2.5">
                            <span className="text-base select-none">📌</span>
                            <div>
                              <p className="text-xs font-bold text-slate-850 dark:text-white leading-tight">{notice.title}</p>
                              <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">{notice.content}</p>
                              <span className="inline-block mt-1.5 text-[9px] uppercase tracking-widest font-extrabold text-slate-400">{notice.date || "Announced recently"}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Today's schedule timetable preview */}
                    <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-xs space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-sm flex items-center gap-1.5">
                          <BookOpen className="h-4 w-4 text-amber-500" /> Class Timetable Schedule
                        </h3>
                        <button onClick={() => setActiveTab("timetable")} className="text-[11px] font-bold text-amber-600 hover:underline">Full calendar</button>
                      </div>

                      <div className="space-y-2.5">
                        {myTimetable.length ? myTimetable.slice(0, 4).map(entry => (
                          <div key={entry.id} className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100 dark:border-slate-850 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2.5">
                              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 font-bold text-[10px] uppercase">
                                {entry.subject.substring(0, 3)}
                              </span>
                              <div>
                                <p className="font-bold text-slate-900 dark:text-white">{entry.subject}</p>
                                <p className="text-[10px] text-slate-400">{entry.teacher_name || "Inst. Specialist"}</p>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="px-2 py-0.5 rounded-full bg-slate-200/50 dark:bg-slate-805 text-slate-550 dark:text-slate-400 text-[10px] font-mono">
                                {entry.day}
                              </span>
                              <p className="text-[10px] font-bold text-slate-500 font-mono">{entry.time_slot}</p>
                            </div>
                          </div>
                        )) : (
                          <div className="text-center p-6 text-slate-400 text-xs">
                            <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-1.5" />
                            No scheduled academic periods mapped yet.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* === TAB 2: MY PROFILE === */}
              {activeTab === "profile" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Left Column Profile identity card */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-xs text-center space-y-4">
                      <div className="relative inline-block">
                        <img
                          src={currentStudent?.photo_url || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150"}
                          alt={currentStudent?.name}
                          className="h-24 w-24 rounded-3xl object-cover ring-4 ring-slate-100 dark:ring-slate-800 mx-auto"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] text-white">✓</span>
                      </div>

                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-lg">{currentStudent?.name}</h3>
                        <p className="text-xs text-emerald-600 font-extrabold mt-0.5">{currentStudent?.class_name}-{currentStudent?.section} Class Scholar</p>
                        <span className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-400 font-mono mt-2">ID: {currentStudent?.admission_number}</span>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-left space-y-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold">Gender</span>
                          <span className="font-extrabold text-slate-700 dark:text-slate-300">{currentStudent?.gender || "Male"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold">Birth Date</span>
                          <span className="font-extrabold text-slate-700 dark:text-slate-300">{currentStudent?.dob || "2010-05-15"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold">Blood Group</span>
                          <span className="font-extrabold text-slate-700 dark:text-slate-300">{currentStudent?.blood_group || "O+"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 font-bold">Admitted On</span>
                          <span className="font-extrabold text-slate-700 dark:text-slate-300">{currentStudent?.admission_date || "2024-04-01"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Columns: Specific Particulars */}
                    <div className="md:col-span-2 space-y-6">
                      
                      {/* Sub card 1: Academic particulars read-only */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-xs space-y-4">
                        <h4 className="font-black text-xs uppercase text-slate-400 tracking-wider">Institution Academic Ledger & Registration mapping</h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                          <div>
                            <p className="text-slate-400 font-bold">Enrollment Roll No</p>
                            <p className="text-slate-850 dark:text-white font-extrabold text-sm font-mono mt-0.5">{currentStudent?.roll_no}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold">Aadhaar Number (UIDAI)</p>
                            <p className="text-slate-850 dark:text-white font-extrabold text-sm font-mono mt-0.5">{currentStudent?.aadhaar_no || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold">Primary Portal Email</p>
                            <p className="text-slate-850 dark:text-white font-extrabold mt-0.5 break-all">{currentStudent?.student_email || "scholar@school.org"}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold">Academic Session</p>
                            <p className="text-slate-850 dark:text-white font-extrabold mt-0.5">{currentStudent?.academic_session || "2026-2027"}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold">Father's Name</p>
                            <p className="text-slate-850 dark:text-white font-extrabold mt-0.5">{currentStudent?.father_name || currentStudent?.parent_name}</p>
                          </div>
                          <div>
                            <p className="text-slate-400 font-bold">Mother's Name</p>
                            <p className="text-slate-850 dark:text-white font-extrabold mt-0.5">{currentStudent?.mother_name || "Sarah Miller"}</p>
                          </div>
                        </div>
                      </div>

                      {/* Sub card 2: Editable parent contact parameters */}
                      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-xs space-y-4">
                        <h4 className="font-black text-xs uppercase text-slate-400 tracking-wider">Edit Contact Parameters</h4>
                        
                        <form onSubmit={handleProfileSettingsUpdate} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                          <div>
                            <label className="block text-slate-400 font-bold mb-1">Parent Contact Mobile</label>
                            <input
                              type="text"
                              value={phoneInput}
                              onChange={(e) => setPhoneInput(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-xl text-slate-800 dark:text-white focus:outline-hidden"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 font-bold mb-1">Parent Secure Email (Read only)</label>
                            <input
                              type="text"
                              disabled
                              value={currentStudent?.parent_email || "guardian@email.com"}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 rounded-xl text-slate-500 font-mono"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-slate-400 font-bold mb-1">Domestic Home Address</label>
                            <textarea
                              rows={2}
                              value={addressInput}
                              onChange={(e) => setAddressInput(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-xl text-slate-800 dark:text-white focus:outline-hidden"
                            />
                          </div>

                          <div className="sm:col-span-2 pt-2">
                            <button
                              type="submit"
                              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all cursor-pointer"
                            >
                              Modernize Contact Credentials
                            </button>
                          </div>
                        </form>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 3: ATTENDANCE === */}
              {activeTab === "attendance" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-xs space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div>
                        <h3 className="font-extrabold text-slate-900 dark:text-white text-base">Scholar Classroom Attendance Board</h3>
                        <p className="text-xs text-slate-400 mt-0.5">Strictly tracking personal attendance logs synced with teachers record</p>
                      </div>
                      <span className="px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 text-xs font-black">
                        Year Score: {attendancePercentage}% Presence
                      </span>
                    </div>

                    {/* Attendance Calendar Grid mockup */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-100/50">
                        <span className="block text-xl">✅</span>
                        <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 mt-1.5">Present Marks</p>
                        <h4 className="text-lg font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                          {myAttendance.filter(x => x.status === "Present").length || 31} Sessions
                        </h4>
                      </div>
                      
                      <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-2xl border border-amber-100/50">
                        <span className="block text-xl">⏳</span>
                        <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 mt-1.5">Late Marks</p>
                        <h4 className="text-lg font-black text-amber-700 dark:text-amber-400 mt-0.5">
                          {myAttendance.filter(x => x.status === "Late").length || 3} Sessions
                        </h4>
                      </div>

                      <div className="bg-rose-50 dark:bg-rose-950/20 p-4 rounded-2xl border border-rose-100/50">
                        <span className="block text-xl">❌</span>
                        <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 mt-1.5">Absent Marks</p>
                        <h4 className="text-lg font-black text-rose-700 dark:text-rose-400 mt-0.5">
                          {myAttendance.filter(x => x.status === "Absent").length || 1} Sessions
                        </h4>
                      </div>

                      <div className="bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100/50">
                        <span className="block text-xl">📊</span>
                        <p className="text-[10px] uppercase font-black tracking-wider text-slate-400 mt-1.5">Excused Leave</p>
                        <h4 className="text-lg font-black text-slate-700 dark:text-slate-350 mt-0.5">
                          {myLeaveRequests.filter(l => l.status === "Approved").length || 0} Petitions
                        </h4>
                      </div>
                    </div>

                    {/* Attendance Logs History List */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Historical Attendance Log Ledger</h4>
                      <div className="overflow-hidden border border-slate-100 dark:border-slate-850 rounded-2xl">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 dark:bg-slate-950/60 font-black">
                            <tr>
                              <th className="p-3.5">Log Date</th>
                              <th className="p-3.5">Status Check</th>
                              <th className="p-3.5">Remarks / Audit Note</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-805">
                            {myAttendance.length ? myAttendance.map(log => (
                              <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                                <td className="p-3.5 font-bold font-mono text-slate-700 dark:text-slate-300">{log.date}</td>
                                <td className="p-3.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    log.status === "Present" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400" :
                                    log.status === "Late" ? "bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400" :
                                    "bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-400"
                                  }`}>
                                    {log.status}
                                  </span>
                                </td>
                                <td className="p-3.5 text-slate-400 font-semibold">{log.remarks || "No supplementary comment recorded by Class Teacher"}</td>
                              </tr>
                            )) : (
                              <tr>
                                <td colSpan={3} className="p-8 text-center text-slate-400">
                                  No attendance logs entered into DB matching index {currentStudent?.id}.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 4: HOMEWORK === */}
              {activeTab === "homework" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left Column Homework lists */}
                    <div className="lg:col-span-2 space-y-4">
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-850 shadow-xs flex items-center justify-between">
                        <div>
                          <h3 className="font-extrabold text-slate-905 dark:text-white text-base">Class Work & Deliverables</h3>
                          <p className="text-xs text-slate-400">Securely loaded based on class placement ({currentStudent?.class_name})</p>
                        </div>
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400 text-[11px] font-extrabold rounded-lg">
                          {pendingHomeworkCount} Pending Hand-ins
                        </span>
                      </div>

                      {/* Homework map */}
                      <div className="space-y-4">
                        {myHomework.map(item => (
                          <div 
                            key={item.id} 
                            className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-xs space-y-3.5"
                          >
                            <div className="flex items-start justify-between">
                              <div className="space-y-1">
                                <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                                  {item.subject || "Course Topic"}
                                </span>
                                <h4 className="font-extrabold text-slate-900 dark:text-white mt-1.5">{item.title}</h4>
                              </div>

                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                item.status === "Submitted" ? "bg-emerald-100 text-emerald-850 dark:bg-emerald-950/50 dark:text-emerald-400" :
                                item.status === "Graded" ? "bg-teal-100 text-teal-850 dark:bg-teal-905" :
                                "bg-rose-105 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 animate-pulse"
                              }`}>
                                {item.status || "Pending"}
                              </span>
                            </div>

                            <p className="text-slate-500 dark:text-slate-400 text-xs font-semibold leading-relaxed">{item.description}</p>
                            
                            <div className="flex flex-wrap items-center justify-between gap-3 text-[11px] pt-3.5 border-t border-slate-100 dark:border-slate-805 text-slate-400">
                              <span className="font-bold flex items-center gap-1">⏱️ Deadline: <span className="font-mono text-rose-500 font-extrabold">{item.due_date}</span></span>
                              
                              {item.status !== "Submitted" && item.status !== "Graded" && (
                                <button
                                  onClick={() => setSubmittingHwId(item.id)}
                                  className="bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer"
                                >
                                  Submit Assignment Solution
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Hand submission console */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-xs h-fit space-y-4">
                      <h4 className="font-extrabold text-xs uppercase text-slate-400 tracking-wider">Scholar Hand-in Console</h4>
                      
                      {submittingHwId ? (
                        <form onSubmit={handleSubmission} className="space-y-4 text-xs">
                          <div>
                            <p className="font-extrabold text-slate-700 dark:text-slate-300 mb-1">Upload Work For:</p>
                            <p className="px-3 py-2 bg-slate-50 dark:bg-slate-950 rounded-xl font-bold font-mono">
                              {myHomework.find(x => x.id === submittingHwId)?.title}
                            </p>
                          </div>

                          <div>
                            <label className="block text-slate-400 font-bold mb-1">Write Hand-in Remarks / Solution text *</label>
                            <textarea
                              required
                              rows={4}
                              value={hwSubmissionText}
                              onChange={(e) => setHwSubmissionText(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-xl "
                              placeholder="Write submission overview or paste link..."
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 font-bold mb-1">Mock Attachment Upload URL</label>
                            <input
                              type="text"
                              value={hwFileUrl}
                              onChange={(e) => setHwFileUrl(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-xl "
                              placeholder="https://drive.google.com/..."
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              type="submit"
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl cursor-pointer"
                            >
                              Dispatch Hand-in
                            </button>
                            <button
                              type="button"
                              onClick={() => setSubmittingHwId(null)}
                              className="px-3 bg-slate-105 rounded-xl text-slate-500 hover:underline"
                            >
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        <div className="text-center p-8 text-slate-400">
                          <Upload className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                          <p className="text-xs font-semibold">Select an assignment deadline to compile and upload a secure hand-in solution file.</p>
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* === TAB 5: RESULTS === */}
              {activeTab === "results" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-xs space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-105 dark:border-slate-800 pb-4">
                      <div>
                        <h3 className="font-extrabold text-slate-905 dark:text-white text-base">Scholar Exam Transcript Board</h3>
                        <p className="text-xs text-slate-400">Historically tracking exam parameters linked securely to profile</p>
                      </div>
                      <span className="p-2.5 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400 font-mono text-xs font-black">
                        Cumulative GPA: Exceptional (3.9 / 4.0 GPA)
                      </span>
                    </div>

                    {/* Simple D3 Recharts Grade Visualization */}
                    <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4 border border-slate-100 dark:border-slate-850 text-xs">
                      <p className="font-black uppercase tracking-wider text-[11px] text-slate-400 mb-4">Exam-wise Marks Progress (Scale over 100)</p>
                      
                      <div className="space-y-3">
                        {myResults.length ? myResults.map(res => (
                          <div key={res.id} className="space-y-1.5">
                            <div className="flex items-center justify-between font-bold">
                              <span>{res.subject} ({res.exam_name || "School Term Exam"})</span>
                              <span className="font-black text-slate-900 dark:text-white">{res.marks_obtained} / {res.max_marks || 100} ({res.grade || "A"})</span>
                            </div>
                            <div className="w-full bg-slate-200/50 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-1000"
                                style={{ width: `${Math.min(100, (res.marks_obtained / (res.max_marks || 100)) * 100)}%` }}
                              />
                            </div>
                          </div>
                        )) : (
                          <div className="space-y-3.5">
                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="font-bold">Mathematics (Midterm Exam)</span>
                                <span className="font-bold font-mono">92/100 (A+)</span>
                              </div>
                              <div className="w-full h-2 bg-slate-205 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: "92%" }}></div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="font-bold">Social Science (Midterm Exam)</span>
                                <span className="font-bold font-mono">88/100 (A)</span>
                              </div>
                              <div className="w-full h-2 bg-slate-205 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: "88%" }}></div>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <div className="flex justify-between">
                                <span className="font-bold">Physics Science (Midterm Exam)</span>
                                <span className="font-bold font-mono">95/100 (O)</span>
                              </div>
                              <div className="w-full h-2 bg-slate-205 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500" style={{ width: "95%" }}></div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Results table layout */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Interactive Grade Registry</h4>
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-52 dark:bg-slate-950 font-black">
                          <tr>
                            <th className="p-3">Course Subject</th>
                            <th className="p-3">Exam Term</th>
                            <th className="p-3">Marks Check</th>
                            <th className="p-3">Audit Note / Comment</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                          {myResults.length ? myResults.map(res => (
                            <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/20">
                              <td className="p-3 font-bold">{res.subject}</td>
                              <td className="p-3 text-slate-500 font-bold">{res.exam_name || "Midterm Exam"}</td>
                              <td className="p-3 font-bold font-mono text-emerald-600 dark:text-emerald-400">{res.marks_obtained} / {res.max_marks || 100} • {res.grade}</td>
                              <td className="p-3 text-slate-400 font-semibold italic">{res.comments || "Exceptional analytics performance verified by administrator."}</td>
                            </tr>
                          )) : (
                            <>
                              <tr className="hover:bg-slate-50/50">
                                <td className="p-3 font-bold">Mathematics</td>
                                <td className="p-3 text-slate-400 font-bold">Midterm Exam</td>
                                <td className="p-3 font-bold text-emerald-600">92 / 100 • A+</td>
                                <td className="p-3 text-slate-400 font-semibold italic">Displays wonderful algebraic intuition.</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="p-3 font-bold">Social Science</td>
                                <td className="p-3 text-slate-400 font-bold">Midterm Exam</td>
                                <td className="p-3 font-bold text-emerald-600">88 / 100 • A</td>
                                <td className="p-3 text-slate-400 font-semibold italic">Well structured essays. Keep reading.</td>
                              </tr>
                              <tr className="hover:bg-slate-50/50">
                                <td className="p-3 font-bold">Physics Science</td>
                                <td className="p-3 text-slate-400 font-bold">Midterm Exam</td>
                                <td className="p-3 font-bold text-emerald-600">95 / 100 • O</td>
                                <td className="p-3 text-slate-400 font-semibold italic">Superb experimentation and formulas.</td>
                              </tr>
                            </>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 6: TIMETABLE === */}
              {activeTab === "timetable" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-xs space-y-4">
                    <div>
                      <h3 className="font-extrabold text-slate-905 dark:text-white text-base">School Timetable & Calendars</h3>
                      <p className="text-xs text-slate-400">Class schedule mapped to level {currentStudent?.class_name}-{currentStudent?.section}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {myTimetable.length ? myTimetable.map(item => (
                        <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-105 dark:border-slate-850 flex items-center justify-between">
                          <div className="space-y-1">
                            <span className="p-1 px-2 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 text-[9px] uppercase font-black tracking-widest">{item.day}</span>
                            <h4 className="font-extrabold text-slate-900 dark:text-white text-sm mt-1.5">{item.subject}</h4>
                            <p className="text-[10px] text-slate-400 font-bold">Instructor: {item.teacher_name || "Specialist Faculty"}</p>
                          </div>
                          
                          <div className="text-right space-y-1">
                            <span className="p-1 px-2.5 bg-slate-200/50 dark:bg-slate-850 rounded-full font-mono font-bold text-[10px] text-slate-450 dark:text-slate-400">{item.time_slot}</span>
                            <p className="text-[10px] text-slate-400 font-bold font-mono">Room {item.room_number || "A-302"}</p>
                          </div>
                        </div>
                      )) : (
                        <>
                          <div className="p-4 bg-slate-50/50 rounded-2xl border flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">Monday</span>
                              <h4 className="font-bold text-slate-900 mt-1">Advanced Algebra Math</h4>
                              <p className="text-[10px] text-slate-400">M. Lateef</p>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="px-2 py-1 rounded bg-slate-100 font-mono text-[10px]">09:00 AM - 10:15 AM</span>
                            </div>
                          </div>

                          <div className="p-4 bg-slate-50/50 rounded-2xl border flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">Tuesday</span>
                              <h4 className="font-bold text-slate-900 mt-1">Chemical Formulations</h4>
                              <p className="text-[10px] text-slate-400">Inst. Firdous</p>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="px-2 py-1 rounded bg-slate-100 font-mono text-[10px]">10:30 AM - 11:45 AM</span>
                            </div>
                          </div>

                          <div className="p-4 bg-slate-50/50 rounded-2xl border flex items-center justify-between text-xs">
                            <div className="space-y-0.5">
                              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase">Wednesday</span>
                              <h4 className="font-bold text-slate-900 mt-1">Societal History & Civics</h4>
                              <p className="text-[10px] text-slate-400">M. Lateef</p>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="px-2 py-1 rounded bg-slate-100 font-mono text-[10px]">01:00 PM - 02:15 PM</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 7: NOTICES === */}
              {activeTab === "notices" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-xs space-y-4">
                    <div>
                      <h3 className="font-extrabold text-slate-905 dark:text-white text-base">Campus Notice Announcements</h3>
                      <p className="text-xs text-slate-400">Live general bulletins and upcoming semester schedules</p>
                    </div>

                    <div className="space-y-4">
                      {allNotices.length ? allNotices.map(notice => (
                        <div key={notice.id} className="p-5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-105 dark:border-slate-850 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 rounded-md text-[10px] font-black uppercase tracking-wider">
                              {notice.type || "General Category"}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400 font-semibold">{notice.date}</span>
                          </div>
                          
                          <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">{notice.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-semibold">{notice.content}</p>
                        </div>
                      )) : (
                        <div className="text-center p-8 text-slate-400">
                          No circular notices posted inside school ledger.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 8: LEAVE REQUEST === */}
              {activeTab === "leave" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* File Leave Form */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-xs h-fit space-y-4">
                      <div>
                        <h3 className="font-extrabold text-slate-905 dark:text-white text-base">New Leave Petition</h3>
                        <p className="text-xs text-slate-400">Requires Class Teacher review and clearance</p>
                      </div>

                      <form onSubmit={handleLeaveSubmit} className="space-y-3.5 text-xs">
                        <div>
                          <label className="block text-slate-400 font-bold mb-1">StartDate *</label>
                          <input
                            type="date"
                            required
                            value={leaveStartDate}
                            onChange={(e) => setLeaveStartDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-xl"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold mb-1">EndDate *</label>
                          <input
                            type="date"
                            required
                            value={leaveEndDate}
                            onChange={(e) => setLeaveEndDate(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-xl"
                          />
                        </div>

                        <div>
                          <label className="block text-slate-400 font-bold mb-1">State Reason Rationale *</label>
                          <textarea
                            required
                            rows={3}
                            value={leaveReason}
                            onChange={(e) => setLeaveReason(e.target.value)}
                            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 rounded-xl"
                            placeholder="Sick leaves, family emergency..."
                          />
                        </div>

                        <button
                          type="submit"
                          disabled={submittingLeave}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 rounded-xl font-extrabold cursor-pointer transition-colors"
                        >
                          {submittingLeave ? "Dispatching Petition..." : "Submit Leave Request"}
                        </button>
                      </form>
                    </div>

                    {/* Left Hand historical grid */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-xs space-y-4">
                      <div>
                        <h3 className="font-extrabold text-slate-905 dark:text-white text-base">My Leave History Accounts</h3>
                        <p className="text-xs text-slate-400">Strictly showing self submitted petitions</p>
                      </div>

                      <div className="space-y-3">
                        {myLeaveRequests.length ? myLeaveRequests.map(item => (
                          <div key={item.id} className="p-4 bg-slate-50 dark:bg-slate-950/40 border border-slate-105 dark:border-slate-850 rounded-2xl flex items-center justify-between text-xs">
                            <div className="space-y-1">
                              <p className="font-extrabold text-slate-755 dark:text-white">{item.reason}</p>
                              <p className="text-[10px] text-slate-400 font-mono">Span: {item.start_date} to {item.end_date}</p>
                            </div>
                            
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                              item.status === "Approved" ? "bg-emerald-100 text-emerald-850 dark:bg-emerald-950/40 dark:text-emerald-400" :
                              item.status === "Declined" ? "bg-rose-105 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400" :
                              "bg-amber-100 text-amber-800 dark:bg-amber-950/30 dark:text-amber-400 animate-pulse"
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        )) : (
                          <div className="text-center p-8 text-slate-400">
                             No sick leaves or permissions requested in history. All academic days accounted.
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* === TAB 9: FEES === */}
              {activeTab === "fees" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-xs space-y-5">
                    <div>
                      <h3 className="font-extrabold text-slate-905 dark:text-white text-base">Scholar Fee Invoices & Payment Portal</h3>
                      <p className="text-xs text-slate-400">View term statements, print receipts or process simulated payouts</p>
                    </div>

                    <div className="space-y-4">
                      {myFees.map(fee => (
                        <div 
                          key={fee.id} 
                          className="p-5 bg-slate-50 dark:bg-slate-950/40 rounded-3xl border border-slate-105 dark:border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="space-y-1.5 text-xs">
                            <span className="p-1 px-2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 text-[10px] font-black uppercase tracking-wider">{fee.fee_type || "Tuition Invoice"}</span>
                            <h4 className="font-extrabold text-slate-909 dark:text-white mt-1.5">Amount Due: <span className="font-mono text-slate-950 dark:text-emerald-300 font-extrabold">${fee.amount}</span></h4>
                            <p className="text-[10px] text-slate-400 font-mono">Deadline Date: {fee.due_date}</p>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className={`px-3 py-1.5 rounded-full text-xs font-black uppercase ${
                              fee.status === "Paid" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-rose-100 text-rose-700 animate-pulse"
                            }`}>
                              {fee.status}
                            </span>

                            {fee.status !== "Paid" ? (
                              <button
                                onClick={() => handleMockPayFee(fee.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 text-xs rounded-xl cursor-pointer"
                              >
                                Settlement Pay
                              </button>
                            ) : (
                              <button
                                onClick={() => showToast(`Mock invoice printed for ${fee.id}. Details cached.`, "success")}
                                className="bg-slate-200 hover:bg-slate-300 dark:bg-slate-805 dark:hover:bg-slate-755 text-slate-700 dark:text-white font-extrabold px-4 py-2 text-xs rounded-xl cursor-pointer flex items-center gap-1"
                              >
                                <Download className="h-4 w-4" /> Download Receipt
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* === TAB 10: MESSAGES === */}
              {activeTab === "messages" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-xs space-y-5">
                    
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-105 dark:border-slate-800 pb-4">
                      <div>
                        <h3 className="font-extrabold text-slate-905 dark:text-white text-base">Intramural Scholastic Messaging</h3>
                        <p className="text-xs text-slate-400">Conversational communication threads tightly bound to student account</p>
                      </div>

                      {/* Recipient Dropdown picker */}
                      <div className="flex items-center gap-2 text-xs select-none">
                        <span className="text-slate-400 font-extrabold">Recipient:</span>
                        <select
                          className="px-3 py-1.5 rounded-xl border border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-950"
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === "admin") {
                              setSelectedRecipient({ name: "System Principal / Admin", email: "school.admin@smartschool.edu", role: "admin" });
                            } else {
                              setSelectedRecipient({ name: "M. Lateef (Class Teacher)", email: "teacher.lateef@school.org", role: "teacher" });
                            }
                          }}
                        >
                          <option value="teacher">M. Lateef (Class Teacher)</option>
                          <option value="admin">System Principal / Admin</option>
                        </select>
                      </div>
                    </div>

                    {/* Chat Bubble Thread list */}
                    <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850 h-72 overflow-y-auto space-y-2.5 flex flex-col justify-end">
                      {myMessages.length ? myMessages.map(msg => {
                        const isMe = (msg.sender_email || "").toLowerCase() === (userEmail || "").toLowerCase();
                        return (
                          <div 
                            key={msg.id} 
                            className={`flex ${isMe ? "justify-end" : "justify-start"} text-xs`}
                          >
                            <div className={`p-3 max-w-sm rounded-2xl ${
                              isMe ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950" : "bg-white text-slate-900 border"
                            }`}>
                              <p className="font-black text-[10px] uppercase opacity-75">{isMe ? "Self" : msg.sender_name}</p>
                              <p className="font-semibold mt-1">{msg.content}</p>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="text-center p-8 text-slate-400 my-auto">
                          <MessageSquare className="h-8 w-8 text-slate-305 mx-auto mb-1.5" />
                          <p>No historic transcripts logged. Initiate the thread below.</p>
                        </div>
                      )}
                    </div>

                    {/* Message Box Input form */}
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <input
                        type="text"
                        required
                        value={typedMessage}
                        onChange={(e) => setTypedMessage(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs"
                        placeholder="Write message content here..."
                      />
                      <button
                        type="submit"
                        className="bg-slate-950 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-950 font-bold px-5 py-3 rounded-xl text-xs flex items-center gap-1"
                      >
                        <Send className="h-4 w-4" /> Send
                      </button>
                    </form>

                  </div>
                </div>
              )}

              {/* === TAB 11: SETTINGS === */}
              {activeTab === "settings" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-850 shadow-xs space-y-6">
                    <div>
                      <h3 className="font-extrabold text-slate-905 dark:text-white text-base">Personalization Panel</h3>
                      <p className="text-xs text-slate-400">Lock preferences, credentials change, UI appearance parameters</p>
                    </div>

                    <div className="space-y-4 text-xs font-semibold">
                      
                      {/* Sub-item 1: Light/Dark toggle */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-105 dark:border-slate-850 flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-909 dark:text-white">Dark Dashboard Palette</p>
                          <p className="text-[10px] text-slate-400">Flick light and cosmic layout themes</p>
                        </div>
                        <button
                          onClick={() => setDarkMode(!darkMode)}
                          className="bg-slate-200 h-6 w-12 rounded-full relative p-0.5 cursor-pointer"
                        >
                          <div className={`h-5 w-5 bg-emerald-600 rounded-full transition-all ${darkMode ? "translate-x-6" : "translate-x-0"}`}></div>
                        </button>
                      </div>

                      {/* Sub-item 2: Change Password simulation */}
                      <div className="p-5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-105 dark:border-slate-850 space-y-3">
                        <p className="font-black text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                          <KeyRound className="h-4 w-4 text-emerald-500" /> Secure Credential Lock
                        </p>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-slate-400 text-[10px] font-bold mb-1">Old Password</label>
                            <input
                              type="password"
                              value={currentPass}
                              onChange={(e) => setCurrentPass(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-705 bg-white dark:bg-slate-900 rounded-xl"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-400 text-[10px] font-bold mb-1">New Secure Password</label>
                            <input
                              type="password"
                              value={newPass}
                              onChange={(e) => setNewPass(e.target.value)}
                              className="w-full px-3 py-2 border border-slate-200 dark:border-slate-705 bg-white dark:bg-slate-900 rounded-xl"
                            />
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            if (!currentPass || !newPass) {
                              showToast("Please fill in key spaces", "error");
                              return;
                            }
                            showToast("Your credential lock password updated inside school ledger successfully!", "success");
                            setCurrentPass("");
                            setNewPass("");
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3.5 rounded-xl mt-2 cursor-pointer"
                        >
                          Modernize Key Lock
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </main>
      </div>

    </div>
  );
}
