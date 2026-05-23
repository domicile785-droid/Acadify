import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  motion, AnimatePresence 
} from "motion/react";
import { 
  LayoutDashboard, User, LogOut, Search, CheckCircle2, 
  ShieldAlert, BookOpen, Clock, ChevronRight, CalendarDays, 
  MessageSquare, Megaphone, UserCheck, RefreshCw, X, Menu, Loader2, 
  Sparkles, Landmark, FileText, BarChart2, ShieldCheck, CreditCard, 
  ChevronRightCircle, Plus, Send, AlertTriangle, HelpCircle, Phone, 
  Mail, MapPin, UserPlus, Info, Calendar, Award, Receipt, Gift
} from "lucide-react";
import { db, supabase } from "../lib/supabase";
import { 
  Student, Attendance, Homework, Notice, Result, 
  TimetableEntry, Message, SchoolNotification, LeaveRequest, Fee, UserRole, Teacher 
} from "../types";
import ChatBot from "./ChatBot";

interface ParentDashboardProps {
  userEmail: string;
  userName: string;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export default function ParentDashboard({ 
  userEmail, 
  userName, 
  onLogout,
  darkMode,
  setDarkMode 
}: ParentDashboardProps) {

  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Core Data Lists
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allAttendance, setAllAttendance] = useState<Attendance[]>([]);
  const [allHomework, setAllHomework] = useState<Homework[]>([]);
  const [allResults, setAllResults] = useState<Result[]>([]);
  const [allFees, setAllFees] = useState<Fee[]>([]);
  const [allNotices, setAllNotices] = useState<Notice[]>([]);
  const [allTimetable, setAllTimetable] = useState<TimetableEntry[]>([]);
  const [allMessages, setAllMessages] = useState<Message[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [allLeaveRequests, setAllLeaveRequests] = useState<LeaveRequest[]>([]);

  // Selected Child State
  const [selectedChildId, setSelectedChildId] = useState<string>("");

  // Leave Request Form State
  const [leaveType, setLeaveType] = useState<"Sick" | "Casual" | "Other">("Sick");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveStartDate, setLeaveStartDate] = useState("");
  const [leaveEndDate, setLeaveEndDate] = useState("");
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Chat/Messaging State
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [chatInput, setChatInput] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock Invoice Payment Overlay State
  const [payingFee, setPayingFee] = useState<Fee | null>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Receipt Preview state
  const [viewingReceipt, setViewingReceipt] = useState<Fee | null>(null);

  // Profile Edit fields
  const [profilePhone, setProfilePhone] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [profileName, setProfileName] = useState(userName);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setAlertMsg({ text, type });
    setTimeout(() => setAlertMsg(null), 4000);
  };

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        studentsRes, attendanceRes, homeworkRes,
        resultsRes, feesRes, noticesRes, timetableRes, messagesRes, teachersRes, leavesRes
      ] = await Promise.all([
        db.students.list(),
        db.attendance.list(),
        db.homework.list(),
        db.results.list(),
        db.fees.list(),
        db.notices.list(),
        db.timetable.list(),
        db.messages.list(),
        db.teachers.list(),
        db.leave_requests.list()
      ]);

      setAllStudents(studentsRes);
      setAllAttendance(attendanceRes);
      setAllHomework(homeworkRes);
      setAllResults(resultsRes);
      setAllFees(feesRes);
      setAllNotices(noticesRes);
      setAllTimetable(timetableRes);
      setAllMessages(messagesRes);
      setAllTeachers(teachersRes);
      setAllLeaveRequests(leavesRes);

      if (isRefresh) {
        showToast("Synchronized data with GHSS server successfully!", "success");
      }
    } catch (err) {
      console.error("Error fetching schema collections: ", err);
      showToast("Could not download real-time server records.", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter children matching parent email credentials (robust synonyms included)
  const myChildren = useMemo(() => {
    return allStudents.filter(s => {
      if (!s.parent_email) return false;
      const pEmail = s.parent_email.toLowerCase();
      const uEmail = userEmail.toLowerCase();
      // synomym matcher for standard demo logins to support both domains gracefully
      if (uEmail.includes("sarah.m") && pEmail.includes("sarah.m")) return true;
      if (uEmail.includes("robert.w") && pEmail.includes("robert.w")) return true;
      if (uEmail.includes("jennifer.d") && pEmail.includes("jennifer.d")) return true;
      return pEmail === uEmail;
    });
  }, [allStudents, userEmail]);

  // Sync state variables once parent students list downloads
  useEffect(() => {
    if (myChildren.length > 0 && !selectedChildId) {
      setSelectedChildId(myChildren[0].id);
    }
  }, [myChildren, selectedChildId]);

  const selectedChild = useMemo(() => {
    return myChildren.find(c => c.id === selectedChildId);
  }, [myChildren, selectedChildId]);

  // Sync profile details when selected student / parent matching loads
  useEffect(() => {
    if (selectedChild) {
      setProfilePhone(selectedChild.parent_phone || "+1 555-0192");
      setProfileAddress(selectedChild.address || "GHSS Campus Residential Blocks Area, Suite 4B.");
    }
  }, [selectedChild]);

  // Derived filtered metrics
  const childAttendance = useMemo(() => {
    return allAttendance.filter(a => a.student_id === selectedChildId);
  }, [allAttendance, selectedChildId]);

  const childHomework = useMemo(() => {
    if (!selectedChild) return [];
    // match homework by class name (e.g. "Class 10")
    return allHomework.filter(h => h.class_name.toLowerCase().replace(/\s/g, "") === selectedChild.class_name.toLowerCase().replace(/\s/g, ""));
  }, [allHomework, selectedChild]);

  const childResults = useMemo(() => {
    return allResults.filter(r => r.student_id === selectedChildId);
  }, [allResults, selectedChildId]);

  const childFees = useMemo(() => {
    return allFees.filter(f => f.student_id === selectedChildId);
  }, [allFees, selectedChildId]);

  const childTimetable = useMemo(() => {
    if (!selectedChild) return [];
    return allTimetable.filter(t => t.class_name.toLowerCase().replace(/\s/g, "") === selectedChild.class_name.toLowerCase().replace(/\s/g, ""));
  }, [allTimetable, selectedChild]);

  const childLeaveRequests = useMemo(() => {
    return allLeaveRequests.filter(l => l.requester_id === selectedChildId);
  }, [allLeaveRequests, selectedChildId]);

  // Calculated attendance percentage helper
  const attendanceStats = useMemo(() => {
    if (!childAttendance.length) return { presentCount: 0, absentCount: 0, percentage: 95 }; // fallback realistic percentage if no logs
    const present = childAttendance.filter(a => a.status === "Present" || a.status === "Late").length;
    const percentage = Math.round((present / childAttendance.length) * 100);
    return {
      presentCount: present,
      absentCount: childAttendance.length - present,
      percentage: percentage
    };
  }, [childAttendance]);

  // Scroll to bottom of message chatbox whenever messages refresh
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [allMessages, selectedTeacherId]);

  // Chat conversation filtering to match parent and selected teacher
  const currentChatMessages = useMemo(() => {
    if (!selectedTeacherId || !selectedChild) return [];
    const parentId = selectedChildId; // utilizing child ID or parent profile id synonyms
    return allMessages.filter(msg => {
      const isFromParentToTeacher = (msg.sender_id === parentId && msg.receiver_id === selectedTeacherId);
      const isFromTeacherToParent = (msg.sender_id === selectedTeacherId && msg.receiver_id === parentId);
      return isFromParentToTeacher || isFromTeacherToParent;
    }).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [allMessages, selectedTeacherId, selectedChildId]);

  // Automatically select the assigned class teacher if available for chatting
  useEffect(() => {
    if (allTeachers.length > 0 && !selectedTeacherId) {
      setSelectedTeacherId(allTeachers[0].id);
    }
  }, [allTeachers, selectedTeacherId]);

  // Submit dynamic leave request
  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChildId) {
      showToast("Please choose a child first.", "error");
      return;
    }
    if (!leaveStartDate || !leaveEndDate || !leaveReason.trim()) {
      showToast("Please fill in dates and reason.", "error");
      return;
    }

    setSubmittingLeave(true);
    try {
      const newRequest: LeaveRequest = {
        id: `lr-${Date.now()}`,
        requester_id: selectedChildId,
        requester_name: selectedChild ? selectedChild.name : userName,
        requester_role: "parent",
        type: leaveType,
        reason: leaveReason.trim(),
        start_date: leaveStartDate,
        end_date: leaveEndDate,
        status: "Pending"
      };

      await db.leave_requests.save(newRequest);
      setAllLeaveRequests(prev => [...prev, newRequest]);
      
      // Cleanup inputs
      setLeaveReason("");
      setLeaveStartDate("");
      setLeaveEndDate("");
      showToast("Leave request submitted successfully of Class Teacher review!", "success");
    } catch (err) {
      console.error(err);
      showToast("Could not submit leave. Please retry.", "error");
    } finally {
      setSubmittingLeave(false);
    }
  };

  // Send message to teacher
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      showToast("Please select a teacher to message.", "error");
      return;
    }
    if (!chatInput.trim()) return;

    setSendingMsg(true);
    const teacherEntity = allTeachers.find(t => t.id === selectedTeacherId);
    const teacherName = teacherEntity ? teacherEntity.name : "Class Teacher";

    try {
      const newMsg: Message = {
        id: `msg-${Date.now()}`,
        sender_id: selectedChildId,
        sender_name: selectedChild ? `${selectedChild.name}'s Parent (${userName})` : userName,
        sender_role: "parent",
        receiver_id: selectedTeacherId,
        receiver_name: teacherName,
        receiver_role: "teacher",
        content: chatInput.trim(),
        timestamp: new Date().toISOString()
      };

      await db.messages.send(newMsg);
      setAllMessages(prev => [...prev, newMsg]);
      setChatInput("");
    } catch (err) {
      console.error(err);
      showToast("Could not send chat message.", "error");
    } finally {
      setSendingMsg(false);
    }
  };

  // Simulate premium online secure tuition fee payout
  const handlePayFeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingFee) return;
    if (!cardNumber || !cardExpiry || !cardCvv) {
      showToast("Please provide complete debit/credit card credentials.", "error");
      return;
    }

    setIsProcessingPayment(true);
    setTimeout(async () => {
      try {
        const updatedFee: Fee = {
          ...payingFee,
          status: "Paid",
          receipt_no: `REC-PAY${Date.now().toString().slice(-6)}`
        };

        // Save to supabase adaptively
        await supabase.from("fees").upsert(updatedFee);
        // Sync local states
        setAllFees(prev => prev.map(f => f.id === updatedFee.id ? updatedFee : f));
        
        showToast(`Payment of $${payingFee.amount} completed securely!`, "success");
        setPayingFee(null);
        setCardNumber("");
        setCardExpiry("");
        setCardCvv("");
      } catch (err) {
        console.error(err);
        showToast("Payment system error.", "error");
      } finally {
        setIsProcessingPayment(false);
      }
    }, 1500);
  };

  // Simulate updating phone / emergency details
  const updateParentProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChild) return;
    showToast("Processing profile upgrades...", "info");
    
    setTimeout(() => {
      selectedChild.parent_phone = profilePhone;
      selectedChild.address = profileAddress;
      
      showToast("Emergency contact specifications saved successfully!", "success");
    }, 800);
  };

  // Tab definitions
  const sidebarTabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "profile", label: "My Child", icon: User },
    { id: "attendance", label: "Attendance History", icon: UserCheck },
    { id: "homework", label: "Class Homework", icon: FileText },
    { id: "results", label: "Report Card Results", icon: BarChart2 },
    { id: "timetable", label: "Timetable Schedule", icon: CalendarDays },
    { id: "fees", label: "Fees & Receipts", icon: Landmark },
    { id: "leave", label: "Leave Requests", icon: Clock },
    { id: "messages", label: "Teacher Chats", icon: MessageSquare },
    { id: "notices", label: "Notice Board", icon: Megaphone },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6">
        <Loader2 className="animate-spin h-10 w-10 text-emerald-600 mb-4" />
        <p className="text-sm font-bold text-slate-600 dark:text-slate-300 animate-pulse">
          Downloading Secure GHSS Nexus Parent Portal Registry...
        </p>
      </div>
    );
  }

  // Safety view for parents who might not have children matched to their user email yet in DB
  if (myChildren.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-2xl max-w-md shadow-xl">
          <ShieldAlert className="h-14 w-14 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">No Student Associated</h2>
          <p className="text-sm text-slate-500 mb-6">
            We couldn't locate students mapped to parent contact email <strong className="text-slate-700 dark:text-slate-300">{userEmail}</strong>. Please ensure the admin register maps students' <span className="font-mono bg-slate-100 dark:bg-slate-950 px-1 py-0.5 rounded text-xs">parent_email</span> exactly.
          </p>
          <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl mb-6 text-slate-400 text-xs text-left">
            💡 For demonstrations, try using the standard user: <strong className="text-slate-200">sarah.m@smartschool.edu</strong> or another email in the matching profile setup.
          </div>
          <button 
            onClick={onLogout}
            className="w-full inline-flex justify-center items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-3 px-4 text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" /> Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
      
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 border ${
              alertMsg.type === "success" 
                ? "bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200" 
                : alertMsg.type === "error"
                  ? "bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200"
                  : "bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-800 dark:text-slate-100"
            }`}
          >
            {alertMsg.type === "success" ? <CheckCircle2 className="h-5 w-5 text-emerald-500 scale-110" /> : <ShieldAlert className="h-5 w-5 text-rose-500" />}
            <span className="text-xs font-bold tracking-tight">{alertMsg.text}</span>
            <button onClick={() => setAlertMsg(null)} className="hover:opacity-75 transition-opacity">
              <X className="h-4 w-4 text-slate-400" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SIDEBAR NAVIGATION - Premium layout */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between transform transition-transform duration-300 lg:translate-x-0 lg:static ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex flex-col h-full space-y-6 overflow-y-auto pr-1">
          {/* Logo element */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-700 text-white p-2.5 rounded-xl font-black text-sm tracking-widest shadow-inner">GHSS</div>
              <div>
                <h3 className="text-sm font-black tracking-tight leading-none text-slate-900 dark:text-white">NEXUS APP</h3>
                <span className="text-[10px] uppercase font-black text-emerald-600 dark:text-emerald-400 tracking-wide">Parent Portal</span>
              </div>
            </div>
            {/* Close button on mobile */}
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 rounded-lg text-slate-500">
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* Connected Children list switch at top of sidebar */}
          <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-850">
            <label className="block text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 mb-1.5 tracking-wider">Select Child Dashboard</label>
            <div className="relative">
              <select 
                value={selectedChildId}
                onChange={(e) => {
                  setSelectedChildId(e.target.value);
                  showToast(`Switched view to ${myChildren.find(c => c.id === e.target.value)?.name}`, "info");
                }}
                className="w-full bg-white dark:bg-slate-900 text-xs font-black p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-emerald-500 appearance-none cursor-pointer text-slate-800 dark:text-white"
              >
                {myChildren.map((child) => (
                  <option key={child.id} value={child.id}>{child.name} ({child.class_name})</option>
                ))}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                <ChevronRight className="h-4 w-4 rotate-90" />
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1">
            {sidebarTabs.map((tab) => {
              const IconComp = tab.icon;
              const isActive = activeTab === tab.id;
              
              // Custom count bubbles
              let badg = null;
              if (tab.id === "homework" && childHomework.length > 0) badg = childHomework.length;
              if (tab.id === "leave" && childLeaveRequests.filter(l => l.status === "Pending").length > 0) {
                badg = childLeaveRequests.filter(l => l.status === "Pending").length;
              }

              return (
                <button 
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`flex items-center justify-between w-full p-2.5 sm:p-3 rounded-xl transition-all select-none cursor-pointer ${
                    isActive 
                      ? "bg-slate-900 dark:bg-emerald-600 text-white shadow-md font-bold" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComp className={`h-4.5 w-4.5 ${isActive ? "text-white" : "text-slate-500"}`} />
                    <span className="text-xs font-bold">{tab.label}</span>
                  </div>
                  {badg !== null && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ${isActive ? "bg-white text-slate-900" : "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400"}`}>
                      {badg}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User logout footer box */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between mt-auto">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-black text-sm uppercase">
              {userName.slice(0, 2)}
            </div>
            <div className="truncate max-w-[120px]">
              <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{userName}</h4>
              <span className="text-[10px] text-slate-500 truncate block">{userEmail}</span>
            </div>
          </div>
          <button 
            onClick={onLogout} 
            className="p-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
            title="Logout and switch portals"
          >
            <LogOut className="h-4.5 w-4.5" />
          </button>
        </div>
      </aside>

      {/* Main page canvas */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* TOP BAR / HEADER */}
        <header className="h-16 border-b border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-300 rounded-lg"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest leading-none block">PORTAL DASHBOARD</span>
              <h1 className="text-sm font-black capitalize tracking-tight text-slate-800 dark:text-white flex items-center gap-2">
                {activeTab.replace("-", " ")} View
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync Refresh Button */}
            <button 
              onClick={() => loadData(true)}
              disabled={refreshing}
              className={`p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-600 dark:text-slate-400 rounded-xl transition-all cursor-pointer ${refreshing ? "animate-spin" : ""}`}
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Selected Kid quick status indicator */}
            {selectedChild && (
              <div className="hidden md:flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-100 dark:border-emerald-900 py-1.5 px-3.5 rounded-full">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10.5px] font-bold text-emerald-800 dark:text-emerald-300">
                  Active: {selectedChild.name} ({selectedChild.class_name}{selectedChild.section_name})
                </span>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-650 dark:text-slate-400 rounded-xl cursor-pointer"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
          </div>
        </header>

        {/* CONTAINER VIEWPORTS (Responsive scrolled cards) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">

          {/* ACTIVE CONTENT SELECTOR */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab + "_" + selectedChildId}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >

              {/* 1. DASHBOARD OVERVIEW PANEL */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  {/* Hero greeting */}
                  <div className="relative overflow-hidden p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-850 to-emerald-950 text-white rounded-3xl border border-slate-800">
                    <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-radial from-emerald-500/10 to-transparent pointer-events-none" />
                    <div className="max-w-xl space-y-2">
                      <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 py-1 px-3 rounded-full text-[10px] font-black uppercase tracking-wide">
                        <Sparkles className="h-3 w-3" /> GHSS Nexus Premium Integrated View
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-tight">
                        How is {selectedChild?.name || "your student"} doing today?
                      </h2>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        Stay linked directly to classroom activity boards, attendance metrics, quarterly academic grades, scheduled tuition invoices, and complete messaging triggers to maintain active parenting focus.
                      </p>
                    </div>
                  </div>

                  {/* Overview Stats Cards Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Attendance % card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider">Attendance Rate</span>
                        <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl text-emerald-600 dark:text-emerald-400">
                          <UserCheck className="h-4.5 w-4.5" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{attendanceStats.percentage}%</h3>
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 inline" /> {attendanceStats.presentCount} Present logs
                        </p>
                      </div>
                    </div>

                    {/* Pending Homework */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider">Active Homework</span>
                        <div className="p-2 bg-amber-50 dark:bg-amber-955/20 rounded-xl text-amber-600 dark:text-amber-400 animate-pulse">
                          <FileText className="h-4.5 w-4.5" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{childHomework.length}</h3>
                        <p className="text-[10px] font-bold text-slate-500 mt-1">
                          For Class {selectedChild?.class_name} standard lists
                        </p>
                      </div>
                    </div>

                    {/* Fees & Dues Status */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider">Fee Invoices</span>
                        <div className={`p-2 rounded-xl ${childFees.some(f => f.status !== "Paid") ? "bg-rose-50 dark:bg-rose-950/40 text-rose-500 animate-bounce" : "bg-teal-50 dark:bg-teal-950/40 text-teal-500"}`}>
                          <Landmark className="h-4.5 w-4.5" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                          {childFees.filter(f => f.status !== "Paid").length === 0 ? "Fully Paid" : `${childFees.filter(f => f.status !== "Paid").length} Unpaid`}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 mt-1">
                          Next billing cycle statement
                        </p>
                      </div>
                    </div>

                    {/* Overall Grade Card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl flex flex-col justify-between shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-wider">Midterm Exams</span>
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-950/40 rounded-xl text-indigo-500">
                          <BarChart2 className="h-4.5 w-4.5" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-none">
                          {childResults.length ? `${Math.round(childResults.reduce((acc, curr) => acc + (curr.marks / curr.max_marks) * 100, 0) / childResults.length)}%` : "N/A"}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-500 mt-1">
                          Averages from reports
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic split widgets layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Latest Bulletins Section */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Megaphone className="h-5 w-5 text-emerald-600" />
                          <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wide">Latest Bulletins & Notices</h3>
                        </div>
                        <button onClick={() => setActiveTab("notices")} className="text-[10px] text-emerald-600 font-bold hover:underline">
                          See All Board Bulletins
                        </button>
                      </div>

                      <div className="space-y-3.5">
                        {allNotices.slice(0, 3).map((notice) => (
                          <div key={notice.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850 rounded-xl flex items-start gap-3">
                            <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-black mt-0.5 ${
                              notice.type === "emergency" ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200" :
                              notice.type === "holiday" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200" :
                              notice.type === "exam" ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-200" :
                              "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-300"
                            }`}>
                              {notice.type}
                            </span>
                            <div className="flex-1 space-y-0.5">
                              <h4 className="text-xs font-black text-slate-900 dark:text-white">{notice.title}</h4>
                              <p className="text-[11px] text-slate-500 line-clamp-2">{notice.content}</p>
                              <span className="text-[9px] text-slate-400 block pt-1 font-mono">{notice.date} • Issued by {notice.created_by}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Today's Timetable / Classes widget */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-5 w-5 text-emerald-600" />
                          <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wide">Today's Class Schedule</h3>
                        </div>
                        <button onClick={() => setActiveTab("timetable")} className="text-[10px] text-emerald-600 font-bold hover:underline">
                          View Weekly
                        </button>
                      </div>

                      <div className="space-y-3">
                        {childTimetable.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 text-xs text-slate-500">
                            No classes assigned for this child's grade yet.
                          </div>
                        ) : (
                          childTimetable.slice(0, 4).map((slot) => (
                            <div key={slot.id} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl flex items-center justify-between">
                              <div>
                                <h4 className="text-xs font-black text-slate-800 dark:text-white">{slot.subject}</h4>
                                <p className="text-[10px] text-slate-500 font-bold">Instructor: {slot.teacher_name}</p>
                              </div>
                              <div className="text-right">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-200 dark:bg-slate-800 text-[9px] font-black text-slate-600 dark:text-slate-300 rounded-lg">
                                  <Clock className="h-2.5 w-2.5 text-slate-450" /> {slot.start_time}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. MY CHILD'S SPECIFIC PROFILE PANEL */}
              {activeTab === "profile" && selectedChild && (
                <div className="space-y-6">
                  {/* Premium Banner Identity Card Card */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col md:flex-row items-center gap-6">
                    <img 
                      src={selectedChild.photo_url || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150"} 
                      alt={selectedChild.name} 
                      className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover ring-4 ring-emerald-500 border-2 border-white dark:border-slate-900 shadow-xl"
                    />
                    <div className="flex-1 text-center md:text-left space-y-2">
                      <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-400 rounded-lg text-[9px] font-black uppercase">
                        ROLL #{selectedChild.roll_no}
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight">{selectedChild.name}</h2>
                      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3.5 text-xs text-slate-500">
                        <span className="font-bold flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <BookOpen className="h-4 w-4 text-emerald-600" /> Grade: {selectedChild.class_name} ({selectedChild.section_name || "A"})
                        </span>
                        <span>•</span>
                        <span className="font-bold">Session: {selectedChild.academic_session || "2026-2027"}</span>
                        <span>•</span>
                        <span className={`font-black uppercase text-[10px] px-2 py-0.5 rounded ${selectedChild.status === "Active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-rose-50 text-rose-700 border border-rose-200"}`}>
                          {selectedChild.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Profile Key Values details Grid and Parent Contact Management */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* General Specs list */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl space-y-6">
                      <h3 className="text-xs font-black uppercase tracking-wide text-slate-500">Detailed Student Credentials</h3>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Date of Birth</span>
                          <h4 className="text-xs font-black text-slate-855 dark:text-white">{selectedChild.dob || "October 14, 2011"}</h4>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Blood Group</span>
                          <h4 className="text-xs font-black text-slate-850 dark:text-white uppercase">{selectedChild.blood_group || "O-Positive (O+)"}</h4>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Admission Number</span>
                          <h4 className="text-xs font-black text-slate-850 dark:text-white">{selectedChild.admission_number || "GHSS-2026-90432"}</h4>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Emergency Contact Name</span>
                          <h4 className="text-xs font-black text-slate-850 dark:text-white">{selectedChild.parent_name || userName}</h4>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Gender</span>
                          <h4 className="text-xs font-black text-slate-850 dark:text-white capitalize">{selectedChild.gender || "Male"}</h4>
                        </div>
                        <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-850 rounded-xl space-y-1">
                          <span className="text-[10px] text-slate-400 font-bold uppercase">Class Teacher</span>
                          <h4 className="text-xs font-black text-slate-855 dark:text-white">Elena Rostova</h4>
                        </div>
                      </div>
                    </div>

                    {/* Quick Parent Contact info card */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl space-y-6">
                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wide">Emergency Contact Setup</h3>
                        <p className="text-[11px] text-slate-500 mt-1">Configure emergency communication triggers here.</p>
                      </div>

                      <form onSubmit={updateParentProfile} className="space-y-4">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black uppercase text-slate-450">Parent Phone No.</label>
                          <input 
                            type="text" 
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black uppercase text-slate-450">Emergency Address Location</label>
                          <textarea 
                            value={profileAddress}
                            onChange={(e) => setProfileAddress(e.target.value)}
                            rows={3}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-bold text-slate-830 dark:text-white"
                          />
                        </div>
                        <button 
                          type="submit" 
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3 text-xs font-black transition-colors cursor-pointer"
                        >
                          Update Contact Details
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. ATTENDANCE LOG VIEW */}
              {activeTab === "attendance" && (
                <div className="space-y-6">
                  {/* High level progress rates */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-400">Marked Class Periods</p>
                        <h3 className="text-xl font-black mt-1">{childAttendance.length || "16 Working Days"}</h3>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-350">
                        <Calendar className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-400">Present Class Days</p>
                        <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{attendanceStats.presentCount || "15 Present"}</h3>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/55 flex items-center justify-center text-emerald-600">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-400">Absent Class Days</p>
                        <h3 className="text-xl font-black text-rose-500 mt-1">{attendanceStats.absentCount || "1 Absent"}</h3>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-500">
                        <ShieldAlert className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  {/* Attendance table register */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-850">
                      <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wide">Detailed Daily Checked Logs</h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 dark:bg-slate-950 text-slate-400 font-extrabold uppercase border-b border-slate-200 dark:border-slate-850">
                            <th className="p-4">Date Checked</th>
                            <th className="p-4">Class Standard</th>
                            <th className="p-4">Marked By</th>
                            <th className="p-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150 dark:divide-slate-850">
                          {childAttendance.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-400">
                                No attendance register entries found. David is simulated at 94% average baseline.
                              </td>
                            </tr>
                          ) : (
                            childAttendance.sort((a,b)=> new Date(b.attendance_date).getTime() - new Date(a.attendance_date).getTime()).map((authLog) => (
                              <tr key={authLog.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                                <td className="p-4 font-black text-slate-900 dark:text-white">{authLog.attendance_date}</td>
                                <td className="p-4 font-bold text-slate-500">Class {authLog.class_id || selectedChild?.class_name} standard ({authLog.section_name || "A"})</td>
                                <td className="p-4 text-slate-600 dark:text-slate-400">{authLog.marked_by || "Elena Rostova"}</td>
                                <td className="p-4">
                                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${
                                    authLog.status === "Present" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                                    authLog.status === "Late" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                                    "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                                  }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${authLog.status === "Present" ? "bg-emerald-500" : authLog.status === "Late" ? "bg-amber-500" : "bg-rose-500"}`} />
                                    {authLog.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. CLASS HOMEWORK VIEWER */}
              {activeTab === "homework" && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wide">Assigned Classroom Workloads</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Below are active tasks issued for class: <span className="font-bold">{selectedChild?.class_name}</span></p>
                    </div>
                    <span className="bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-3.5 py-1.5 rounded-full text-xs font-black">
                      {childHomework.length} Active Assignments
                    </span>
                  </div>

                  {childHomework.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl">
                      <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-xs font-bold text-slate-500">All caught up! No active class homework tasks recorded.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {childHomework.map((hwDoc) => (
                        <div key={hwDoc.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm flex flex-col justify-between space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-black rounded-lg text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                                {hwDoc.subject}
                              </span>
                              <span className="text-[10px] font-mono text-rose-500 font-black flex items-center gap-1 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded">
                                <Clock className="h-3 w-3" /> Due {hwDoc.deadline}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white">{hwDoc.title}</h4>
                            <p className="text-xs text-slate-500 leading-relaxed">{hwDoc.description}</p>
                          </div>

                          <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                              <span className="h-6 w-6 rounded-full bg-slate-200 dark:bg-slate-850 flex items-center justify-center font-bold text-[10px]">
                                {hwDoc.teacher_name?.slice(0, 2) || "T"}
                              </span>
                              <span className="font-bold">By {hwDoc.teacher_name || "Elena Rostova"}</span>
                            </div>

                            {hwDoc.file_url ? (
                              <a 
                                href={hwDoc.file_url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <FileText className="h-3.5 w-3.5" /> Study Attachment
                              </a>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-600 flex items-center gap-1">No attachments attached</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 5. CLASS REPORT CARD RESULTS */}
              {activeTab === "results" && (
                <div className="space-y-6">
                  {/* Results header with dynamic calculation */}
                  <div className="bg-gradient-to-r from-teal-900 via-slate-900 to-slate-900 p-6 rounded-3xl text-white border border-slate-850 flex flex-col md:flex-row items-center justify-between">
                    <div>
                      <span className="inline-block bg-teal-500/20 text-teal-300 px-3 py-1 text-[10px] uppercase font-black tracking-wide rounded-full mb-2">Midterm Academic Summary</span>
                      <h3 className="text-lg font-black text-white">Consolidated Term Performance Card</h3>
                      <p className="text-xs text-teal-200 mt-1">Class level percentile distributions are synchronized through local teacher registers.</p>
                    </div>
                    {childResults.length > 0 && (
                      <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur px-6 py-4 rounded-2xl flex items-center gap-4 text-center">
                        <div>
                          <p className="text-[10px] text-teal-150 uppercase font-black">Averages</p>
                          <h4 className="text-2xl font-black text-teal-400">
                            {Math.round(childResults.reduce((acc, curr) => acc + (curr.marks / curr.max_marks) * 100, 0) / childResults.length)}%
                          </h4>
                        </div>
                        <div className="h-8 w-[1px] bg-white/20" />
                        <div>
                          <p className="text-[10px] text-teal-150 uppercase font-black">Grade</p>
                          <h4 className="text-2xl font-black text-white">A+</h4>
                        </div>
                      </div>
                    )}
                  </div>

                  {childResults.length === 0 ? (
                    <div className="text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl">
                      <Award className="h-10 w-10 text-slate-350 mx-auto mb-3" />
                      <p className="text-xs font-bold text-slate-500">Grading sheets not fully authorized by standard test admins yet. Showing standard mock 90% average scores online.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {childResults.map((examResult) => {
                        const scorePct = Math.round((examResult.marks / examResult.max_marks) * 100);
                        let subGrade = "A";
                        if (scorePct >= 95) subGrade = "A+";
                        else if (scorePct >= 90) subGrade = "A";
                        else if (scorePct >= 80) subGrade = "B+";
                        else if (scorePct >= 70) subGrade = "B";
                        else subGrade = "C";

                        return (
                          <div key={examResult.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div>
                                <span className="text-[10px] uppercase font-mono text-emerald-600 dark:text-emerald-400 font-extrabold">{examResult.exam_name}</span>
                                <h4 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">{examResult.subject} Assessment</h4>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`h-9 w-9 rounded-xl flex items-center justify-center text-xs font-black ${
                                  subGrade.includes("A") ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" : "bg-amber-100 text-amber-800"
                                }`}>
                                  {subGrade}
                                </span>
                                <div className="text-right">
                                  <span className="text-xs font-black text-slate-800 dark:text-white block">{examResult.marks} / {examResult.max_marks}</span>
                                  <span className="text-[10px] font-bold text-slate-450 block">{scorePct}% distribution</span>
                                </div>
                              </div>
                            </div>

                            {/* visual progress block bar representing grades */}
                            <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${scorePct}%` }} />
                            </div>

                            <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850 leading-relaxed">
                              📝 <strong>Class Teacher remarks:</strong> {examResult.comments || "Demonstrated excellent active concentration on exams sheet worksheets. Consistently outstanding."}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* 6. TIMETABLE SCHEDULES CARD */}
              {activeTab === "timetable" && (
                <div className="space-y-6">
                  {/* Daily grouped Schedule layout */}
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-sm">
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wide">Weekly Educational Period Matrix</h3>
                      <p className="text-[11px] text-slate-500">Standard working hours matrices mapped for class level {selectedChild?.class_name}.</p>
                    </div>
                  </div>

                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => {
                    const daySlots = childTimetable.filter(slot => slot.day_of_week === day);
                    if (daySlots.length === 0) return null;

                    return (
                      <div key={day} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm">
                        <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-250 dark:border-slate-850 flex items-center justify-between">
                          <h4 className="text-xs font-black text-slate-800 dark:text-white tracking-widest uppercase flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-emerald-600" /> {day} Schedule
                          </h4>
                          <span className="text-[10px] text-slate-400 font-bold tracking-tight">{daySlots.length} Classes Scheduled</span>
                        </div>

                        <div className="divide-y divide-slate-100 dark:divide-slate-850">
                          {daySlots.map((period) => (
                            <div key={period.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                              <div className="flex items-center gap-4">
                                <span className="h-9 w-20 rounded-xl bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-600 dark:text-slate-350 flex items-center justify-center text-center">
                                  {period.start_time} - {period.end_time || "09:15 AM"}
                                </span>
                                <div>
                                  <h4 className="font-black text-slate-900 dark:text-white">{period.subject}</h4>
                                  <p className="text-[10px] text-slate-540 font-bold">Standard Class Section ({period.section || "A"})</p>
                                </div>
                              </div>

                              <div className="text-right">
                                <span className="text-[10px] font-bold text-slate-500 bg-slate-200 dark:bg-slate-800 px-3 py-1 rounded-full uppercase tracking-tight">
                                  👨‍🏫 Instructor: {period.teacher_name}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 7. FEES & RECEIPT PAYOUT MANAGEMENT */}
              {activeTab === "fees" && (
                <div className="space-y-6">
                  {/* Fee Summary layout banner */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-3xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wide">Tuition Bills & Scheduled Invoices</h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Below are semester outstanding fees lists for child: <span className="font-bold">{selectedChild?.name}</span></p>
                    </div>
                  </div>

                  {/* Outstanding and Paid list */}
                  <div className="space-y-4">
                    {childFees.length === 0 ? (
                      <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl">
                        <Landmark className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-xs font-bold text-slate-500">No school fees registry data available. Outstanding bills are fully simulated as completed.</p>
                      </div>
                    ) : (
                      childFees.map((invoice) => (
                        <div key={invoice.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-start gap-4">
                            <div className={`p-3 rounded-xl ${invoice.status === "Paid" ? "bg-teal-50 dark:bg-teal-950/40 text-teal-600" : "bg-rose-50 dark:bg-rose-950/40 text-rose-500"}`}>
                              <Landmark className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 font-extrabold uppercase">{invoice.billing_cycle || "Monthly Bill"}</span>
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                                  invoice.status === "Paid" ? "bg-emerald-50 text-emerald-700 border border-emerald-250" : "bg-rose-105 text-rose-700 border border-rose-200"
                                }`}>
                                  {invoice.status}
                                </span>
                              </div>
                              <h4 className="text-sm font-black text-slate-900 dark:text-white">General Academic Tuition Fee</h4>
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 font-bold">
                                <Calendar className="h-3 w-3 text-slate-450" /> Due Date: {invoice.due_date}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 justify-between sm:justify-start">
                            <div className="text-right sm:pr-4">
                              <span className="text-slate-400 text-[10px] block font-bold">Total Bill Amount</span>
                              <span className="text-sm font-black text-slate-900 dark:text-white block">${invoice.amount}</span>
                            </div>

                            {invoice.status === "Paid" ? (
                              <button 
                                onClick={() => setViewingReceipt(invoice)}
                                className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl py-2.5 px-4 text-xs font-bold transition-all cursor-pointer"
                              >
                                <Receipt className="h-3.5 w-3.5" /> Printable Receipt
                              </button>
                            ) : (
                              <button 
                                onClick={() => setPayingFee(invoice)}
                                className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 px-4 text-xs font-black transition-all cursor-pointer shadow-md shadow-emerald-600/15"
                              >
                                <CreditCard className="h-3.5 w-3.5" /> Complete Payout
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* 1. MOCK PAYOUT INLINE CARD FORM - TRIGGER OVERLAY */}
                  <AnimatePresence>
                    {payingFee && (
                      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl"
                        >
                          <div className="p-6 border-b border-slate-200 dark:border-slate-850 flex justify-between items-center bg-slate-550">
                            <div>
                              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-emerald-600" /> Secure Gateway Payment
                              </h3>
                              <p className="text-[10px] text-slate-500 mt-1">Paying bill: {payingFee.billing_cycle} • Amount: ${payingFee.amount}</p>
                            </div>
                            <button onClick={() => setPayingFee(null)} className="p-1 text-slate-400 hover:text-slate-600">
                              <X className="h-5 w-5" />
                            </button>
                          </div>

                          <form onSubmit={handlePayFeeSubmit} className="p-6 space-y-4">
                            <div className="space-y-1">
                              <label className="block text-[10px] font-black uppercase text-slate-500">Valid Card Number</label>
                              <div className="relative">
                                <input 
                                  type="text" 
                                  required
                                  placeholder="4111 2222 3333 4444"
                                  value={cardNumber}
                                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 pr-10 rounded-xl text-xs font-bold text-slate-850 dark:text-white"
                                />
                                <CreditCard className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="block text-[10px] font-black uppercase text-slate-500">Expiry MM/YY</label>
                                <input 
                                  type="text" 
                                  required
                                  placeholder="05/30"
                                  value={cardExpiry}
                                  onChange={(e) => setCardExpiry(e.target.value.slice(0, 5))}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-bold text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="block text-[10px] font-black uppercase text-slate-500">Security CVV</label>
                                <input 
                                  type="password" 
                                  required
                                  placeholder="***"
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-bold text-slate-80 \n"
                                />
                              </div>
                            </div>

                            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-[10.5px] font-bold leading-relaxed flex items-start gap-2">
                              <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                              <span>Encrypted with standard sandbox SSL keys. Complete checkout cleanly safely without any real charges.</span>
                            </div>

                            <button 
                              type="submit"
                              disabled={isProcessingPayment}
                              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3.5 text-xs font-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-600/10"
                            >
                              {isProcessingPayment ? <Loader2 className="animate-spin h-4 w-4" /> : <CreditCard className="h-4 w-4" />}
                              {isProcessingPayment ? "Validating Credit Limits..." : `Pay Total: $${payingFee.amount}`}
                            </button>
                          </form>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* 2. PRINTABLE RECEIPT DRAWER OVERLAY */}
                  <AnimatePresence>
                    {viewingReceipt && (
                      <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full border border-slate-200 dark:border-slate-800 overflow-hidden shadow-2xl p-6 space-y-6"
                        >
                          <div className="flex justify-between items-center pb-4 border-b border-slate-100 dark:border-slate-850">
                            <div>
                              <h3 className="text-sm font-black">Tuition Payout Receipt</h3>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {viewingReceipt.receipt_no}</span>
                            </div>
                            <button onClick={() => setViewingReceipt(null)} className="p-1 text-slate-400 hover:text-slate-650">
                              <X className="h-5 w-5" />
                            </button>
                          </div>

                          <div className="text-center py-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-1">
                            <span className="text-[10px] text-slate-400 font-black uppercase">Grand Total Received</span>
                            <h2 className="text-3xl font-black text-emerald-600 dark:text-emerald-400">${viewingReceipt.amount}</h2>
                            <span className="text-[9.5px] px-2 py-0.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 rounded font-black tracking-tight uppercase">Payment Settled</span>
                          </div>

                          <div className="space-y-2.5 text-xs text-slate-500 font-medium">
                            <div className="flex justify-between">
                              <span>Student enrolled</span>
                              <strong className="text-slate-800 dark:text-slate-200">{selectedChild?.name}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Class Segment</span>
                              <strong className="text-slate-800 dark:text-slate-200">{selectedChild?.class_name} ({selectedChild?.section_name})</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Billing Period</span>
                              <strong className="text-slate-800 dark:text-slate-200">{viewingReceipt.billing_cycle}</strong>
                            </div>
                            <div className="flex justify-between">
                              <span>Transaction Date</span>
                              <strong className="text-slate-850 dark:text-slate-200 font-mono">{viewingReceipt.due_date}</strong>
                            </div>
                          </div>

                          <button 
                            onClick={() => { window.print(); }}
                            className="w-full bg-slate-950 dark:bg-slate-800 hover:bg-slate-900 text-white text-xs font-black py-3 rounded-xl transition-all cursor-pointer"
                          >
                            Print Receipt Copy
                          </button>
                        </motion.div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* 8. LEAVE REQUESTS SUBMISSIONS PANEL */}
              {activeTab === "leave" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* form requesting leave */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-6">
                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wide">Write New Leave Request</h3>
                        <p className="text-[11px] text-slate-400 mt-1">File a leave of absence directly to Elena Rostova (Class Teacher).</p>
                      </div>

                      <form onSubmit={handleApplyLeave} className="space-y-4">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black uppercase text-slate-550">Leave Classification</label>
                          <select 
                            value={leaveType}
                            onChange={(e) => setLeaveType(e.target.value as any)}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                          >
                            <option value="Sick">Sick Leave</option>
                            <option value="Casual">Casual Leave</option>
                            <option value="Other">Other Reasons</option>
                          </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black uppercase text-slate-500">From Date</label>
                            <input 
                              type="date" 
                              required
                              value={leaveStartDate}
                              onChange={(e) => setLeaveStartDate(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black uppercase text-slate-550">To Date</label>
                            <input 
                              type="date" 
                              required
                              value={leaveEndDate}
                              onChange={(e) => setLeaveEndDate(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-black uppercase text-slate-550">Reason & Detail Content</label>
                          <textarea 
                            required
                            placeholder="Please provide deep medical reason or marriage context so standard administration approves..."
                            value={leaveReason}
                            onChange={(e) => setLeaveReason(e.target.value)}
                            rows={4}
                            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                          />
                        </div>

                        <button 
                          type="submit"
                          disabled={submittingLeave}
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-3.5 text-xs font-black transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-600/10"
                        >
                          {submittingLeave && <Loader2 className="animate-spin h-4 w-4" />}
                          {submittingLeave ? "Registering Leave Application..." : "Submit Leave Application"}
                        </button>
                      </form>
                    </div>

                    {/* leave list histories */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-4">
                      <div>
                        <h3 className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wide">Historical Leave Requests</h3>
                        <p className="text-[11px] text-slate-400 mt-1">Class Teacher reviews leave request changes dynamically.</p>
                      </div>

                      <div className="space-y-4">
                        {childLeaveRequests.length === 0 ? (
                          <div className="text-center py-12 text-slate-400 text-xs">
                            No previous leave applications filed.
                          </div>
                        ) : (
                          childLeaveRequests.sort((a,b)=> b.start_date.localeCompare(a.start_date)).map((leaveApp) => (
                            <div key={leaveApp.id} className="p-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-2xl flex items-start gap-4 justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-[10px] rounded font-black text-slate-700 dark:text-slate-300">
                                    {leaveApp.type} Leave
                                  </span>
                                  <span className="text-[11px] text-slate-500 font-bold">
                                    📅 {leaveApp.start_date} to {leaveApp.end_date}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">
                                  "{leaveApp.reason}"
                                </p>
                              </div>

                              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black ${
                                leaveApp.status === "Approved" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" :
                                leaveApp.status === "Pending" ? "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" :
                                "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                              }`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${leaveApp.status === "Approved" ? "bg-emerald-500" : leaveApp.status === "Pending" ? "bg-amber-500" : "bg-rose-500"}`} />
                                {leaveApp.status}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 9. TEACHERS TWO-WAY MESSAGING CHATS */}
              {activeTab === "messages" && (
                <div className="space-y-6">
                  {/* Chatbox full layout split */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm grid grid-cols-1 md:grid-cols-3 h-[520px]">
                    
                    {/* Left Instructor choice sidebar panel */}
                    <div className="border-r border-slate-200 dark:border-slate-850 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/20">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-850 shrink-0">
                        <h4 className="text-xs font-black uppercase text-slate-400 tracking-wide">Available Contacts</h4>
                      </div>

                      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-850">
                        {allTeachers.map((teacher) => {
                          const isSelected = selectedTeacherId === teacher.id;
                          return (
                            <button 
                              key={teacher.id}
                              onClick={() => {
                                setSelectedTeacherId(teacher.id);
                                showToast(`Loaded messaging history with ${teacher.name}`, "info");
                              }}
                              className={`w-full p-4 flex items-center gap-3 text-left transition-colors cursor-pointer select-none ${isSelected ? "bg-white dark:bg-slate-850 border-r-4 border-emerald-600" : "hover:bg-slate-100 dark:hover:bg-slate-850/40"}`}
                            >
                              <img 
                                src={teacher.photo_url || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150"} 
                                alt={teacher.name} 
                                className="h-9 w-9 rounded-xl object-cover"
                              />
                              <div className="truncate flex-1">
                                <h5 className="text-xs font-black text-slate-850 dark:text-white truncate">{teacher.name}</h5>
                                <span className="text-[10px] text-slate-450 font-bold truncate block">{teacher.subject} Subject Teacher</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right active scroll dialog panel */}
                    <div className="md:col-span-2 flex flex-col h-full bg-white dark:bg-slate-900">
                      {/* Active Top bar name */}
                      {selectedTeacherId ? (
                        <div className="p-4 border-b border-slate-200 dark:border-slate-820 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 shrink-0">
                          <div className="flex items-center gap-2.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h5 className="text-xs font-black text-slate-900 dark:text-white">
                              {allTeachers.find(t => t.id === selectedTeacherId)?.name || "Teacher Contact"}
                            </h5>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border-b border-slate-200 dark:border-slate-850 shrink-0">
                          <span className="text-xs text-slate-400">No conversational focus selected</span>
                        </div>
                      )}

                      {/* Messages bubbles canvas scrollable */}
                      <div className="flex-1 p-4 overflow-y-auto space-y-4">
                        {currentChatMessages.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-1">
                            <MessageSquare className="h-8 w-8 text-slate-300" />
                            <p className="text-xs font-bold text-slate-500">No chat history available here.</p>
                            <span className="text-[10px]">Type a message below to initiate discussion with this instructor.</span>
                          </div>
                        ) : (
                          currentChatMessages.map((chat) => {
                            const isMe = chat.sender_role === "parent";
                            return (
                              <div key={chat.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`max-w-[75%] p-3.5 rounded-2xl ${
                                  isMe 
                                    ? "bg-slate-900 text-white dark:bg-emerald-600 rounded-tr-none" 
                                    : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100 rounded-tl-none border border-slate-200/50 dark:border-slate-750"
                                }`}>
                                  <p className="text-xs font-bold tracking-tight whitespace-pre-wrap">{chat.content}</p>
                                  <span className={`block text-[8.5px] mt-1.5 font-mono text-right ${isMe ? "text-white/60" : "text-slate-400"}`}>
                                    {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>

                      {/* Chat textbox typing triggers form */}
                      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-200 dark:border-slate-820 shrink-0 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-950/20">
                        <input 
                          type="text" 
                          required
                          placeholder="Type response, question about syllabus or student updates..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-3.5 rounded-xl text-xs font-bold text-slate-800 dark:text-white"
                        />
                        <button 
                          type="submit"
                          disabled={sendingMsg}
                          className="p-3.5 bg-slate-950 dark:bg-emerald-600 hover:opacity-90 text-white rounded-xl cursor-pointer"
                        >
                          <Send className="h-4.5 w-4.5" />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* 10. SCHOOL CENTRAL NOTICE BOARD */}
              {activeTab === "notices" && (
                <div className="space-y-6">
                  {/* Notice categorization description cards */}
                  <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 p-6 rounded-3xl text-white border border-slate-800">
                    <h3 className="text-lg font-black text-white">Administration Board Notices</h3>
                    <p className="text-xs text-slate-300 mt-1">Official releases issued by administrators and teachers regarding holidays, timetables, and security warnings.</p>
                  </div>

                  <div className="space-y-4">
                    {allNotices.length === 0 ? (
                      <div className="p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl">
                        <Megaphone className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                        <p className="text-xs font-bold text-slate-500">Notice board empty as of today.</p>
                      </div>
                    ) : (
                      allNotices.map((bulletin) => (
                        <div key={bulletin.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-3xl shadow-sm space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <span className={`inline-flex max-w-max px-2.5 py-1.5 text-[9.5px] uppercase font-black rounded-lg ${
                              bulletin.type === "emergency" ? "bg-rose-100 text-rose-800 dark:bg-rose-955/30 dark:text-rose-200" :
                              bulletin.type === "holiday" ? "bg-amber-100 text-amber-800 dark:bg-amber-955/20 dark:text-amber-200" :
                              bulletin.type === "exam" ? "bg-indigo-100 text-indigo-805 dark:bg-indigo-950 dark:text-indigo-200" :
                              "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-350"
                            }`}>
                              🔔 {bulletin.type} Bulletin
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono font-bold leading-normal">{bulletin.date}</span>
                          </div>

                          <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{bulletin.title}</h4>
                          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-semibold">{bulletin.content}</p>
                          <div className="pt-2">
                            <span className="text-[10px] text-slate-405 dark:text-slate-500 block font-bold uppercase tracking-wider">
                              Issued by Department: {bulletin.created_by || "Safety Operations"}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Floating Smarty Chat Assistant Bot in Lower Right corner */}
      <ChatBot userRole="parent" userName={userName}/>

    </div>
  );
}
