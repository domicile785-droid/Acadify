import React, { useState, useEffect, useMemo } from "react";
import AttendanceRecords from './AttendanceRecords';
import { 
  motion, AnimatePresence 
} from "motion/react";
import { 
  LayoutDashboard, Users, UserCheck, FileText, BarChart2, Calendar, 
  MessageSquare, Megaphone, User, LogOut, Search, Plus, Trash2, Edit, 
  Check, ArrowRight, ShieldAlert, BookOpen, Clock, Award, Shield, 
  ChevronRight, CalendarDays, KeyRound, Sparkles, Filter, CheckCircle2,
  Phone, Mail, MessageCircle, RefreshCw, X, Menu, CheckSquare, Loader2, Upload, Camera
} from "lucide-react";
import { db, supabase, uploadImage } from "../lib/supabase";
import { 
  Student, Teacher, Attendance, Homework, Notice, Result, 
  TimetableEntry, Message, SchoolNotification, UserRole 
} from "../types";
import ChatBot from "./ChatBot";

interface TeacherDashboardProps {
  userEmail: string;
  userName: string;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export default function TeacherDashboard({ 
  userEmail, 
  userName, 
  onLogout,
  darkMode,
  setDarkMode 
}: TeacherDashboardProps) {

  // Active Screen Tab
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Database States
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<Attendance[]>([]);
  const [homeworkList, setHomeworkList] = useState<Homework[]>([]);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [timetable, setTimetable] = useState<TimetableEntry[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [notifications, setNotifications] = useState<SchoolNotification[]>([]);
  const [dbClasses, setDbClasses] = useState<any[]>([]);

  // Local state for actions
  const [alertMsg, setAlertMsg] = useState<{ text: string; type: "success" | "error" | "info" } | null>(null);

  // Profile fields editing
  const [profilePhone, setProfilePhone] = useState("");
  const [profileQual, setProfileQual] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [profilePass, setProfilePass] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  // Attendance states
  const [attClass, setAttClass] = useState("");
  const [attDate, setAttDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [attStatusMap, setAttStatusMap] = useState<Record<string, "Present" | "Absent" | "Late">>({});

  // Homework states
  const [hwClass, setHwClass] = useState("");
  const [hwTitle, setHwTitle] = useState("");
  const [hwDesc, setHwDesc] = useState("");
  const [hwDeadline, setHwDeadline] = useState("");
  const [editingHwId, setEditingHwId] = useState<string | null>(null);

  // Results states
  const [resClass, setResClass] = useState("");
  const [resExam, setResExam] = useState("Midterm Exam");
  const [resMarksMap, setResMarksMap] = useState<Record<string, { marks: number; comments: string }>>({});

  // Messages states
  const [selectedContact, setSelectedContact] = useState<{ id: string; name: string; role: string; email?: string; phone?: string } | null>(null);
  const [typedMessage, setTypedMessage] = useState("");
  const [searchMsgContact, setSearchMsgContact] = useState("");

  // Notices write states
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeContent, setNewNoticeContent] = useState("");
  const [newNoticeType, setNewNoticeType] = useState<"general" | "holiday" | "exam" | "emergency">("general");

  // Load all records from actual DB
  const loadData = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setRefreshing(true);
    else setLoading(true);

    try {
      const [
        studentsRes, teachersRes, attendanceRes, homeworkRes,
        noticesRes, resultsRes, timetableRes, messagesRes, notificationsRes, classesRes
      ] = await Promise.all([
        db.students.list(),
        db.teachers.list(),
        db.attendance.list(),
        db.homework.list(),
        db.notices.list(),
        db.results.list(),
        db.timetable.list(),
        db.messages.list(),
        db.notifications.list(),
        db.classes.list()
      ]);

      setAllStudents(studentsRes);
      setAllTeachers(teachersRes);
      setAttendanceLogs(attendanceRes);
      setHomeworkList(homeworkRes);
      setNotices(noticesRes);
      setResults(resultsRes);
      setTimetable(timetableRes);
      setMessages(messagesRes);
      setNotifications(notificationsRes);
      setDbClasses(classesRes);
    } catch (err) {
      console.error("Supabase data fetching error:", err);
      showToast("Error synchronizing school databases", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userEmail]);

  // Utility to launch notifications/toasts
  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setAlertMsg({ text, type });
    setTimeout(() => {
      setAlertMsg(null);
    }, 4500);
  };

  // Find the exact teacher model matching logged in email
  const currentTeacher = useMemo(() => {
    const safeEmail = (userEmail || "").toLowerCase().trim();
    const safeName = (userName || "").toLowerCase().trim();

    const match = allTeachers.find(t => (t.email || "").toLowerCase().trim() === safeEmail);
    if (match) return match;
    
    // Sub-fallback using full name matching
    const nameMatch = allTeachers.find(t => (t.name || "").toLowerCase().trim() === safeName);
    if (nameMatch) return nameMatch;

    // Direct simulated fallback schema
    return {
      id: "teach-1",
      name: userName || "Elena Rostova",
      email: userEmail || "elena.rostova@smartschool.edu",
      phone: "+1 555-0101",
      subject: "Mathematics",
      classes_assigned: ["Class 10A", "Class 10B", "Class 9A"],
      photo_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150",
      qualification: "M.Sc. Mathematics, B.Ed",
      joining_date: "2024-08-15"
    };
  }, [allTeachers, userEmail, userName]);

  // Default editable fields populated on initial loads
  useEffect(() => {
    if (currentTeacher) {
      setProfilePhone(currentTeacher.phone || "");
      setProfileQual(currentTeacher.qualification || "");
      setProfilePhoto(currentTeacher.photo_url || "");
    }
  }, [currentTeacher]);

  // Helper utility to match flexible class naming formats
  const matchesClass = (studentClassName: string | undefined | null, classTeacherOf: string | null | undefined): boolean => {
    if (!classTeacherOf || !studentClassName) return false;
    const s = studentClassName.toLowerCase().replace(/[^a-z0-9]/g, "");
    const c = classTeacherOf.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (s === c) return true;
    if (s.includes(c) || c.includes(s)) return true;
    const sDigits = studentClassName.match(/\d+/)?.[0];
    const cDigits = classTeacherOf.match(/\d+/)?.[0];
    if (sDigits && cDigits && sDigits === cDigits) return true;
    return false;
  };

  // Helper values to resolve assigned classes (derived dynamically from class teacher of assignment)
  const classesAssigned = useMemo(() => {
    console.log("DEBUG: currentTeacher assignment:", currentTeacher?.assigned_class_id, currentTeacher?.section, currentTeacher?.academic_session);
    
    // Using assigned_class_id from Teacher record
    if (currentTeacher?.assigned_class_id) {
      const assignedClass = dbClasses.find(c => c.id === currentTeacher.assigned_class_id);
      if (assignedClass) {
        return [assignedClass.class_name];
      }
      console.warn("DEBUG: Assigned class not found in dbClasses", currentTeacher.assigned_class_id);
    }
    
    // Fallback for legacy support
    const teacherClasses = dbClasses.filter(c => c.class_teacher_id === currentTeacher?.id).map(c => c.class_name);
    const classTeacherOf = currentTeacher?.class_teacher_of;
    if (classTeacherOf && classTeacherOf !== "None" && classTeacherOf !== "" && !teacherClasses.includes(classTeacherOf)) {
      teacherClasses.push(classTeacherOf);
    }
    
    return teacherClasses;
  }, [currentTeacher, dbClasses]);

  const assignedClassIds = useMemo(() => {
    if (currentTeacher?.assigned_class_id) {
       return [currentTeacher.assigned_class_id];
    }
    return dbClasses.filter(c => c.class_teacher_id === currentTeacher?.id).map(c => c.id);
  }, [currentTeacher, dbClasses]);

  // Filter students belonging only to the teacher's assigned class teacher classroom
  const myStudents = useMemo(() => {
    if (!currentTeacher?.section_name || !currentTeacher?.academic_session) return [];

    const students = allStudents.filter(student => {
      const matchClass = student.class_id && assignedClassIds.includes(student.class_id);
      const matchSection = student.section_name === currentTeacher.section_name;
      const matchSession = student.academic_session === currentTeacher.academic_session;
      
      return matchClass && matchSection && matchSession;
    });
    return students;
  }, [allStudents, currentTeacher, assignedClassIds]);

  // Format classes into separate name and sections for select/input fields
  const parsedClasses = useMemo(() => {
    return classesAssigned.map(cls => {
      // Split "Class 10A" -> name: "Class 10", section: "A"
      const match = (cls || "").match(/^(Class\s+\d+)([A-Z])?$/i);
      if (match) {
        return {
          fullName: cls,
          className: match[1],
          section: match[2] || "A"
        };
      }
      return { fullName: cls, className: cls, section: "A" };
    });
  }, [classesAssigned]);

  // Default selectors setup
  useEffect(() => {
    if (parsedClasses.length > 0 && !attClass) {
      setAttClass(parsedClasses[0].fullName);
      setHwClass(parsedClasses[0].fullName);
      setResClass(parsedClasses[0].fullName);
    }
  }, [parsedClasses]);

  // Update profile handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      setUploadingImage(true);
      const uploadedUrl = await uploadImage(file, "teacher-images");
      setProfilePhoto(uploadedUrl);
    } catch (err: any) {
      console.error("Image upload failed", err);
      showToast("Failed to upload image. Please try again.", "error");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedTeacher = {
        ...currentTeacher,
        phone: profilePhone,
        qualification: profileQual,
        photo_url: profilePhoto
      };

      await db.teachers.save(updatedTeacher);
      
      // Update Auth Password if added
      if (profilePass.trim()) {
        const { error } = await supabase.auth.updateUser({ password: profilePass.trim() });
        if (error) {
          showToast(`Password update alert: ${error.message}`, "error");
        } else {
          showToast("Profile credentials & security parameters refreshed successfully", "success");
        }
        setProfilePass("");
      } else {
        showToast("Profile information published successfully!", "success");
      }
      
      await loadData();
    } catch (err: any) {
      console.error(err);
      showToast("Could not publish profile settings", "error");
    }
  };

  // Mark all Attendance save logic
  const handleSaveAttendance = async () => {
    try {
      const filteredClassStudents = myStudents;

      const payload: Attendance[] = filteredClassStudents.map(student => ({
        id: `att-${student.id}-${attDate}`,
        student_id: student.id,
        student_name: student.name,
        roll_no: student.roll_no,
        date: attDate,
        status: attStatusMap[student.id] || "Present",
        marked_by: currentTeacher.name
      }));

      await db.attendance.saveAll(payload);
      showToast(`Successfully registered ${payload.length} attendance checklist entries`, "success");
      await loadData();
    } catch (err: any) {
      console.error(err);
      showToast("Failed to save class attendance registry", "error");
    }
  };

  // Attendance population triggers on class or date modifications
  useEffect(() => {
    if (!attClass) return;

    // Filter students
    const filteredClassStudents = myStudents;

    // Filter existing attendance logs for this class/date combo
    const initialMap: Record<string, "Present" | "Absent" | "Late"> = {};
    filteredClassStudents.forEach(student => {
      const matchedLog = attendanceLogs.find(
        log => log.student_id === student.id && log.date === attDate
      );
      initialMap[student.id] = matchedLog ? matchedLog.status : "Present";
    });

    setAttStatusMap(initialMap);
  }, [attClass, attDate, attendanceLogs, myStudents]);

  // Homework add or modify
  const handleSaveHomework = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hwTitle.trim() || !hwDesc.trim() || !hwDeadline) {
      showToast("Please provide all required homework criteria", "error");
      return;
    }

    const tClass = parsedClasses.find(c => c.fullName === hwClass) || { className: dbClasses.length > 0 ? dbClasses[0].class_name : "Class 10", section: "A" };

    try {
      const hwObj: Homework = {
        id: editingHwId || `hw-${Date.now()}`,
        subject: currentTeacher.subject,
        title: hwTitle,
        description: hwDesc,
        deadline: hwDeadline,
        class_name: tClass.className,
        section: tClass.section,
        teacher_name: currentTeacher.name,
        created_at: new Date().toISOString().split("T")[0]
      };

      await db.homework.save(hwObj);
      showToast(editingHwId ? "Homework modified successfully" : "New homework assignment posted!", "success");

      // Reset
      setHwTitle("");
      setHwDesc("");
      setHwDeadline("");
      setEditingHwId(null);
      await loadData();
    } catch (err) {
      console.error(err);
      showToast("Could not post assignment", "error");
    }
  };

  const handleDeleteHomework = async (id: string) => {
    if (!window.confirm("Are you sure you want to retract/delete this homework?")) return;
    try {
      await db.homework.delete(id);
      showToast("Homework syllabus assignment retracted", "success");
      await loadData();
    } catch (error) {
      showToast("Failure deleting homework", "error");
    }
  };

  // Grade Results save mapper
  const handleSaveResults = async () => {
    try {
      const filteredClassStudents = myStudents;

      const promises = filteredClassStudents.map(student => {
        const studentMarks = resMarksMap[student.id] || { marks: 0, comments: "Satisfactory" };
        const resultPayload: Result = {
          id: `res-${student.id}-${resExam.replace(/\s+/g, "")}-${currentTeacher.subject}`,
          student_id: student.id,
          student_name: student.name,
          subject: currentTeacher.subject,
          marks: Number(studentMarks.marks || 0),
          max_marks: 100,
          exam_name: resExam,
          comments: studentMarks.comments || "Great evaluation effort.",
          date: new Date().toISOString().split("T")[0]
        };
        return db.results.save(resultPayload);
      });

      await Promise.all(promises);
      showToast(`Marks ledger published for ${promises.length} students.`, "success");
      await loadData();
    } catch (e) {
      showToast("Trouble saving grade book", "error");
    }
  };

  // Trigger results mapping on class modifies
  useEffect(() => {
    if (!resClass) return;

    const filteredClassStudents = myStudents;

    const initialMarksMap: Record<string, { marks: number; comments: string }> = {};
    filteredClassStudents.forEach(st => {
      const match = results.find(
        r => r.student_id === st.id && r.exam_name === resExam && r.subject === currentTeacher.subject
      );
      initialMarksMap[st.id] = {
        marks: match ? match.marks : 0,
        comments: match ? match.comments : ""
      };
    });
    setResMarksMap(initialMarksMap);
  }, [resClass, resExam, results, myStudents]);

  // Notice Board add
  const handlePostNotice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoticeTitle.trim() || !newNoticeContent.trim()) {
      showToast("Notice header title and outline content cannot be blank.", "error");
      return;
    }

    try {
      const payload: Notice = {
        id: `notice-${Date.now()}`,
        title: newNoticeTitle.trim(),
        content: newNoticeContent.trim(),
        type: newNoticeType,
        date: new Date().toISOString().split("T")[0],
        created_by: `Tr. ${currentTeacher.name}`
      };

      await db.notices.save(payload);
      showToast("Classroom notice announcement successfully broadcasted", "success");
      setNewNoticeTitle("");
      setNewNoticeContent("");
      await loadData();
    } catch (e) {
      showToast("Notice broadcast failure", "error");
    }
  };

  const handleDeleteNotice = async (id: string) => {
    if (!window.confirm("Retract this notice broadsheet?")) return;
    try {
      await db.notices.delete(id);
      showToast("Notice withdrawn", "success");
      await loadData();
    } catch (err) {
      showToast("Fault retracting notice", "error");
    }
  };

  // Auto-grade mapper helper
  const calculateGrade = (score: number) => {
    if (score >= 90) return { grade: "A+", color: "text-emerald-500 font-black" };
    if (score >= 80) return { grade: "A", color: "text-emerald-400 font-bold" };
    if (score >= 70) return { grade: "B", color: "text-indigo-400 font-bold" };
    if (score >= 60) return { grade: "C", color: "text-yellow-500 font-semibold" };
    if (score >= 50) return { grade: "D", color: "text-orange-500" };
    return { grade: "F", color: "text-rose-500 font-bold" };
  };

  // Contacts dictionary for chat component
  const directoryContacts = useMemo(() => {
    const parentContacts = myStudents.map(s => ({
      id: `parent-${s.id}`,
      name: s.parent_name || `Sarah Miller (${s.name})`,
      role: "Parent",
      email: s.parent_email,
      phone: s.parent_phone,
      assocStudent: s.name
    }));

    const adminContact = {
      id: "admin-1",
      name: "Administrator Principal",
      role: "Admin Office",
      email: "admin@smartschool.edu",
      phone: "+1 800-555-0100"
    };

    const combined = [adminContact, ...parentContacts];
    // De-duplicate contacts list by matching IDs
    const uniqueIds = new Set();
    return combined.filter(c => {
      if (uniqueIds.has(c.id)) return false;
      uniqueIds.add(c.id);
      return true;
    });
  }, [myStudents]);

  // Default selection for Messaging contact
  useEffect(() => {
    if (directoryContacts.length > 0 && !selectedContact) {
      setSelectedContact(directoryContacts[0]);
    }
  }, [directoryContacts]);

  // Filter messages for active thread
  const filteredMessages = useMemo(() => {
    if (!selectedContact) return [];
    return messages.filter(msg => {
      const match1 = msg.sender_id === "me" && msg.receiver_id === selectedContact.id;
      const match2 = msg.receiver_id === "me" && msg.sender_id === selectedContact.id;
      // Also catch mock emails mappings if IDs look synthetic
      const match3 = msg.sender_id === "teach-1" && msg.receiver_id === "par-1" && selectedContact.id === "parent-stud-1";
      const match4 = msg.sender_id === "par-1" && msg.receiver_id === "teach-1" && selectedContact.id === "parent-stud-1";
      return match1 || match2 || match3 || match4;
    });
  }, [messages, selectedContact]);

  // Messaging submission
  const handleSendMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim() || !selectedContact) return;

    try {
      const myMsg: Message = {
        id: `msg-${Date.now()}`,
        sender_id: "me",
        sender_name: currentTeacher.name,
        sender_role: "teacher" as UserRole,
        receiver_id: selectedContact.id,
        receiver_name: selectedContact.name,
        receiver_role: selectedContact.role?.toLowerCase() === "parent" ? "parent" : "admin" as UserRole,
        content: typedMessage.trim(),
        timestamp: new Date().toISOString()
      };

      await db.messages.send(myMsg);
      setTypedMessage("");
      await loadData();

      // Trigger standard reactive parent answer simulation
      setTimeout(async () => {
        const replyMsg: Message = {
          id: `msg-reply-${Date.now()}`,
          sender_id: selectedContact.id,
          sender_name: selectedContact.name,
          sender_role: selectedContact.role?.toLowerCase() === "parent" ? "parent" : "admin" as UserRole,
          receiver_id: "me",
          receiver_name: currentTeacher.name,
          receiver_role: "teacher" as UserRole,
          content: `Thank you for sharing, Tr. ${currentTeacher.name.split(" ")[0]}. I appreciate your dedication and real-time support for our curriculum agenda items!`,
          timestamp: new Date().toISOString()
        };
        await db.messages.send(replyMsg);
        await loadData();
      }, 1500);

    } catch (err) {
      showToast("Failed to transmit chat message", "error");
    }
  };

  // Specific timetable filter for current teacher
  const myTimetable = useMemo(() => {
    return timetable.filter(
      item => {
        const tName = item.teacher_name?.toLowerCase() || "";
        const cName = (currentTeacher.name || "").toLowerCase().split(" ")[0];
        const tSubj = item.subject?.toLowerCase() || "";
        const cSubj = (currentTeacher.subject || "").toLowerCase();
        
        return tName.includes(cName) || tSubj === cSubj;
      }
    );
  }, [timetable, currentTeacher]);

  // Sidebar mapping
  const sidebarTabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "classes", label: "My Classes", icon: BookOpen, badge: `${classesAssigned.length} Zones` },
    { id: "attendance", label: "Attendance Portal", icon: UserCheck },
    { id: "homework", label: "Homework Center", icon: FileText },
    { id: "students", label: "My Students", icon: Users, badge: `${myStudents.length} Pupils` },
    { id: "results", label: "Results Ledger", icon: BarChart2 },
    { id: "timetable", label: "Class Timetable", icon: Calendar },
    { id: "messages", label: "Chat Messenger", icon: MessageSquare },
    { id: "notices", label: "Bulletins & notices", icon: Megaphone },
    { id: "profile", label: "My Profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-950 dark:text-slate-50 flex flex-col md:flex-row antialiased font-sans">
      
      {/* TOAST PANEL ALERT */}
      <AnimatePresence>
        {alertMsg && (
          <motion.div 
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className={`p-4 rounded-2xl shadow-xl border flex items-center gap-3 ${
              alertMsg.type === "success" 
                ? "bg-emerald-500 text-white border-emerald-400" 
                : alertMsg.type === "error"
                  ? "bg-rose-500 text-white border-rose-400"
                  : "bg-slate-900 text-white border-slate-700"
            }`}>
              {alertMsg.type === "success" && <CheckCircle2 className="h-5 w-5 shrink-0" />}
              {alertMsg.type === "error" && <ShieldAlert className="h-5 w-5 shrink-0" />}
              {!["success", "error"].includes(alertMsg.type) && <Sparkles className="h-5 w-5 shrink-0" />}
              <span className="text-xs font-semibold leading-normal">{alertMsg.text}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE HEADER */}
      <header className="md:hidden bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 shrink-0 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white">
            <Award className="h-5 w-5" />
          </div>
          <span className="font-exrabold text-sm tracking-tight capitalize">{currentTeacher.subject} Dashboard</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            disabled={refreshing} 
            onClick={() => loadData(true)} 
            className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin text-emerald-500" : ""}`} />
          </button>
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl"
          >
            {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* SIDEBAR NAVIGATION PANEL */}
      <aside className={`fixed inset-y-0 left-0 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800/80 w-64 transform transition-transform duration-300 z-40 md:relative md:translate-x-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } flex flex-col justify-between shrink-0`}>
        
        <div className="flex flex-col flex-1 min-h-0">
          
          {/* Brand header */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md">
              <Award className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-black text-sm text-slate-900 dark:text-white leading-tight">Smart School</h2>
              <span className="text-[10px] uppercase tracking-wider font-mono text-emerald-600 dark:text-emerald-400 font-bold block mt-0.5">
                Instructor Module
              </span>
            </div>
          </div>

          {/* Navigation Item Scroll Tray */}
          <nav className="p-4 space-y-1 overflow-y-auto flex-1 text-xs">
            {sidebarTabs.map(tab => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  id={`tab-${tab.id}`}
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3.5 py-3 rounded-2xl font-bold tracking-tight cursor-pointer transition-all flex items-center justify-between ${
                    active 
                      ? "bg-slate-950 text-white dark:bg-emerald-600 shadow-sm" 
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{tab.label}</span>
                  </div>
                  {tab.badge && !active && (
                    <span className="px-2 py-0.5 text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer profile log controls */}
        <div className="p-5 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30 text-xs text-slate-650 dark:text-slate-400 space-y-4">
          <div className="flex items-center gap-3">
            <img 
              referrerPolicy="no-referrer"
              src={currentTeacher.photo_url || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150"} 
              alt={currentTeacher.name} 
              className="h-10 w-10 rounded-2xl object-cover ring-2 ring-emerald-500/20"
            />
            <div className="min-w-0">
              <p className="font-extrabold text-slate-900 dark:text-white truncate leading-tight">{currentTeacher.name}</p>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">{currentTeacher.subject} Lead</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setDarkMode(!darkMode)}
              className="px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 font-semibold text-[11px]"
            >
              <span>{darkMode ? "☀️ Light" : "🌙 Dark"}</span>
            </button>
            <button 
              onClick={onLogout} 
              className="px-2.5 py-1.5 rounded-xl hover:bg-rose-500/10 hover:text-rose-500 text-rose-600 transition flex items-center gap-1.5 font-bold cursor-pointer"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Logout</span>
            </button>
          </div>
        </div>

      </aside>

      {/* MAIN SCREEN AREA */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-y-auto space-y-6">
        
        {/* SUB HEADER ROW */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-900 pb-5">
          <div className="space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full font-black">
              LIVE DATABASE CONNECTION
            </span>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {sidebarTabs.find(t => t.id === activeTab)?.label}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Welcome, Tr. {currentTeacher.name} — Connected to school registries.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button 
              disabled={refreshing}
              onClick={() => loadData(true)}
              className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 rounded-2xl text-xs font-bold leading-none cursor-pointer flex items-center gap-2"
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin text-emerald-500" : ""}`} />
              <span>{refreshing ? "Refreshing..." : "Refresh Records"}</span>
            </button>

            <span className="hidden sm:inline-flex px-3.5 py-1.5 rounded-full bg-slate-900 text-white dark:bg-slate-800 font-mono text-[10px] font-bold">
              UTC {new Date().toISOString().substring(11, 16)}
            </span>
          </div>
        </div>

        {/* LOADING BOX CONTAINER */}
        {loading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
            <div className="p-4 rounded-full bg-emerald-100 dark:bg-emerald-950/20 text-emerald-500 animate-pulse">
              <Award className="h-10 w-10 animate-bounce" />
            </div>
            <p className="text-xs font-mono text-slate-550 dark:text-slate-400 animate-pulse">Synchronizing metadata and class profiles from Supabase...</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.22 }}
              className="space-y-6"
            >

              {/* TAB 1: DASHBOARD HOME OVERVIEW */}
              {activeTab === "dashboard" && (
                <div className="space-y-6">
                  
                  {/* HERO BENTO STAT CONTROL GRID */}
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    
                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 space-y-2 relative overflow-hidden">
                      <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 w-fit">
                        <Users className="h-5 w-5" />
                      </div>
                      <p className="text-[10px] uppercase font-bold text-slate-420">My Students</p>
                      <h3 className="text-2xl font-black">{myStudents.length}</h3>
                      <span className="text-[9px] text-indigo-500 font-semibold block">In {classesAssigned.length} zones</span>
                    </div>

                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 space-y-2 relative overflow-hidden">
                      <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 w-fit">
                        <CalendarDays className="h-5 w-5" />
                      </div>
                      <p className="text-[10px] uppercase font-bold text-slate-420">Classes Today</p>
                      <h3 className="text-2xl font-black">
                        {myTimetable.filter(t => t.day_of_week === "Monday" || t.day_of_week === "Friday").length || 3}
                      </h3>
                      <span className="text-[9px] text-emerald-500 font-semibold block">Lessons schedule</span>
                    </div>

                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 space-y-2 relative overflow-hidden">
                      <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 text-amber-500 w-fit">
                        <Clock className="h-5 w-5" />
                      </div>
                      <p className="text-[10px] uppercase font-bold text-slate-420">Active Homework</p>
                      <h3 className="text-2xl font-black">
                        {homeworkList.filter(h => h.teacher_name === currentTeacher.name).length}
                      </h3>
                      <span className="text-[9px] text-amber-500 font-semibold block">Pending reviews</span>
                    </div>

                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 space-y-2 relative overflow-hidden">
                      <div className="p-2.5 rounded-2xl bg-teal-50 dark:bg-teal-950/20 text-teal-400 w-fit">
                        <UserCheck className="h-5 w-5" />
                      </div>
                      <p className="text-[10px] uppercase font-bold text-slate-420">Attendance Rate</p>
                      <h3 className="text-2xl font-black">94.2%</h3>
                      <span className="text-[9px] text-teal-500 font-semibold block">This academic term</span>
                    </div>

                    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/80 space-y-2 relative overflow-hidden col-span-2 lg:col-span-1">
                      <div className="p-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 w-fit">
                        <BarChart2 className="h-5 w-5" />
                      </div>
                      <p className="text-[10px] uppercase font-bold text-slate-420">Total Exams</p>
                      <h3 className="text-2xl font-black">2</h3>
                      <span className="text-[9px] text-rose-500 font-semibold block">Midterm reviews</span>
                    </div>

                  </div>

                  {/* DOUBLE CARD CONTENTSPLIT */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* LEFT PANEL: TIMETABLE & ACTION */}
                    <div className="lg:col-span-2 space-y-6">
                      
                      {/* QUICK ACTION BANNER */}
                      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-emerald-950 text-white shadow-lg space-y-4">
                        <h4 className="text-lg font-black tracking-tight flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-emerald-400" />
                          <span>Quick Instruction Center</span>
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                          As the subject lead, you can quickly write homework sheets, broadcast emergency bulletin announcements, mark daily roll sheets, or upload midterm scores to databases instantly.
                        </p>
                        
                        <div className="flex flex-wrap gap-2 pt-1 text-xs font-bold">
                          <button onClick={() => setActiveTab("attendance")} className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition cursor-pointer">
                            Mark Attendance
                          </button>
                          <button onClick={() => setActiveTab("homework")} className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 transition cursor-pointer">
                            Create Homework
                          </button>
                          <button onClick={() => setActiveTab("results")} className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 transition cursor-pointer">
                            Grade Exam Marks
                          </button>
                        </div>
                      </div>

                      {/* TODAY'S TIMELINE LESSONS */}
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-4">
                        <h4 className="text-xs uppercase font-mono tracking-wider text-slate-500 font-bold">
                          My Teaching Roster Today (Schedule)
                        </h4>
                        
                        <div className="space-y-3">
                          {myTimetable.length > 0 ? (
                            myTimetable.slice(0, 4).map((entry, idx) => (
                              <div key={idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-850 flex items-center justify-between hover:border-emerald-500/20 transition">
                                <div className="flex items-center gap-3.5">
                                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl font-bold text-xs">
                                    Slot {idx + 1}
                                  </div>
                                  <div>
                                    <h5 className="text-xs font-black">{entry.class_name} - {entry.section}</h5>
                                    <p className="text-[10px] text-slate-500">{entry.subject} • {entry.day_of_week}</p>
                                  </div>
                                </div>
                                
                                <span className="px-3 py-1 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-bold">
                                  {entry.start_time} - {entry.end_time}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-xs text-slate-500 dark:text-slate-400 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl text-center">No cataloged lectures today</p>
                          )}
                        </div>
                      </div>

                    </div>

                    {/* RIGHT PANEL: RECENT NOTICES & RECENT HOMEWORKS */}
                    <div className="space-y-6">
                      
                      {/* SCHOOL BULLETINS */}
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs uppercase font-mono tracking-wider text-slate-500 font-bold">
                            Recent School notices
                          </h4>
                          <button onClick={() => setActiveTab("notices")} className="text-[10px] text-emerald-500 font-bold hover:underline flex items-center gap-0.5">
                            <span>All</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="space-y-3 max-h-[300px] overflow-y-auto">
                          {notices.slice(0, 3).map((notice) => {
                            const typeColors = {
                              general: "bg-emerald-500/10 text-emerald-500",
                              holiday: "bg-sky-500/10 text-sky-400",
                              exam: "bg-indigo-500/10 text-indigo-400",
                              emergency: "bg-rose-500/10 text-rose-500"
                            }[notice.type || "general"];

                            return (
                              <div key={notice.id} className="p-3.5 rounded-2xl border border-slate-50 dark:border-slate-800 hover:border-emerald-500/10 transition space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${typeColors}`}>
                                    {notice.type}
                                  </span>
                                  <span className="text-[8px] font-mono text-slate-400">{notice.date}</span>
                                </div>
                                <h5 className="text-xs font-black">{notice.title}</h5>
                                <p className="text-[10px] text-slate-500 dark:text-slate-450 line-clamp-2 leading-relaxed">{notice.content}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* HOMEWORK CENTER TRACKER */}
                      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs uppercase font-mono tracking-wider text-slate-500 font-bold">
                            My Recent Assignments
                          </h4>
                          <button onClick={() => setActiveTab("homework")} className="text-[10px] text-emerald-500 font-bold hover:underline flex items-center gap-0.5">
                            <span>Manage</span>
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          {homeworkList
                            .filter(h => h.teacher_name === currentTeacher.name)
                            .slice(0, 3)
                            .map((hw) => (
                              <div key={hw.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                                <div className="flex items-center justify-between text-[10px]">
                                  <span className="font-bold text-slate-700 dark:text-slate-350">{hw.class_name} - {hw.section}</span>
                                  <span className="text-amber-500 font-mono font-bold">Due {hw.deadline}</span>
                                </div>
                                <h5 className="font-black truncate">{hw.title}</h5>
                              </div>
                            ))
                          }
                          {homeworkList.filter(h => h.teacher_name === currentTeacher.name).length === 0 && (
                            <p className="text-[11px] text-slate-500 text-center py-4">No homework homework posted yet.</p>
                          )}
                        </div>

                      </div>

                    </div>

                  </div>

                </div>
              )}

              {/* TAB 2: MY CLASSES PAGE */}
              {activeTab === "classes" && (
                <div className="space-y-6">
                  <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border space-y-2">
                    <h3 className="text-base font-black">Official Teacher Classroom Allocations</h3>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      You are allocated as the head instruction facilitator for the following classes of Smart School. Students in these sections are filtered into your view auto-populated with correct timetable and results rosters.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {parsedClasses.map((cl, idx) => {
                      // Count of class students
                      const studentCount = allStudents.filter(s => s.class_name === cl.className && s.section === cl.section).length;
                      
                      // Count of subjects or lessons from timetable for this class
                      const classLessons = timetable.filter(t => t.class_name === cl.className && t.section === cl.section).length;

                      return (
                        <div key={idx} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-hidden hover:border-emerald-500/20 transition flex flex-col justify-between">
                          <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 rounded-2xl font-black text-sm">
                                {cl.className} - {cl.section}
                              </span>
                              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-bold">
                                Term 1 Allocation
                              </span>
                            </div>

                            <div className="space-y-2">
                              <h4 className="text-xs uppercase tracking-wider font-mono text-slate-400">Class Metrics</h4>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border">
                                  <p className="text-slate-400 text-[9px]">ENROLLED</p>
                                  <p className="font-bold text-sm">{studentCount} Students</p>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-955 border">
                                  <p className="text-slate-400 text-[9px]">TIMETABLED</p>
                                  <p className="font-bold text-sm">{classLessons} Lectures</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="p-4 border-t bg-slate-50/50 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
                            <span className="text-slate-550">Subject: {currentTeacher.subject}</span>
                            <button onClick={() => { setAttClass(cl.fullName); setActiveTab("attendance"); }} className="text-emerald-500 hover:text-emerald-400 flex items-center gap-0.5 cursor-pointer">
                              <span>Roll Sheet</span>
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: ATTENDANCE PAGE */}
              {activeTab === "attendance" && (
                classesAssigned.length === 0 ? (
                  <div className="p-12 text-center max-w-md mx-auto space-y-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl mt-6">
                    <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-500">
                      <ShieldAlert className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">Attendance Portal Blocked</h3>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                        Only assigned Class Teachers can mark attendance. You are not currently registered as the Class Teacher for any class in the school database.
                      </p>
                    </div>
                  </div>
                ) : (
                  <AttendanceRecords
                    students={myStudents}
                    attendanceLogs={attendanceLogs}
                    onSaveAttendance={async (items) => {
                      try {
                        await db.attendance.saveAll(items);
                        showToast(`Successfully registered ${items.length} attendance checklist entries`, "success");
                        await loadData();
                      } catch (err: any) {
                        console.error(err);
                        showToast("Failed to save class attendance registry", "error");
                      }
                    }}
                    onTriggerNotification={async (title, content, role) => {
                      await db.notifications.create({
                        id: `notif-${Date.now()}`,
                        title,
                        content,
                        type: "attendance",
                        target_role: role,
                        date: new Date().toISOString().split("T")[0],
                        read: false
                      });
                    }}
                    userName={currentTeacher.name}
                    teacherId={currentTeacher.id}
                    classId={currentTeacher.assigned_class_id || ""}
                    sectionName={currentTeacher.section_name || ""}
                    academicSession={currentTeacher.academic_session || ""}
                  />
                )
              )}
              {activeTab === "homework" && (
                classesAssigned.length === 0 ? (
                  <div className="p-12 text-center max-w-md mx-auto space-y-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl mt-6">
                    <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-500">
                      <ShieldAlert className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">Homework Center Blocked</h3>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                        Homework can only be uploaded and managed by Class Teachers for their assigned class. You are not currently registered as the Class Teacher for any class in the school database.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* FORM INTERPRETER */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-6 rounded-3xl space-y-4 h-fit">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-slate-500 font-bold">
                      {editingHwId ? "Edit assignment" : "Post Homework Assignment"}
                    </h4>

                    <form onSubmit={handleSaveHomework} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Target Classroom *</label>
                        <select 
                          value={hwClass}
                          onChange={(e) => setHwClass(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                        >
                          {parsedClasses.map((cl, i) => (
                            <option key={i} value={cl.fullName}>{cl.fullName}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Homework Title *</label>
                        <input 
                          type="text"
                          required
                          placeholder="e.g. Chapter 4 Quadratic Formula Exercises"
                          value={hwTitle}
                          onChange={(e) => setHwTitle(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Syllabus Subject</label>
                        <input 
                          type="text"
                          disabled
                          value={currentTeacher.subject}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-100 dark:bg-slate-950 text-slate-400 font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Submission Deadline *</label>
                        <input 
                          type="date"
                          required
                          value={hwDeadline}
                          onChange={(e) => setHwDeadline(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono font-bold"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Outline Description *</label>
                        <textarea 
                          required
                          rows={4}
                          placeholder="Provide the page numbers, exercises workbooks, and core instruction rules..."
                          value={hwDesc}
                          onChange={(e) => setHwDesc(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                        />
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button 
                          type="submit"
                          className="flex-1 bg-slate-900 dark:bg-emerald-600 hover:opacity-90 text-white font-bold py-2.5 rounded-xl cursor-pointer"
                        >
                          {editingHwId ? "Modify Syllabus" : "Publish Assignment"}
                        </button>
                        {editingHwId && (
                          <button 
                            type="button"
                            onClick={() => { setEditingHwId(null); setHwTitle(""); setHwDesc(""); setHwDeadline(""); }}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 px-4 py-2 rounded-xl"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </form>
                  </div>

                  {/* ACTIVE POSTED TABLE LIST */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider">Currently Posted homework for {currentTeacher.subject}</h3>
                    
                    <div className="space-y-4">
                      {homeworkList
                        .filter(h => h.teacher_name === currentTeacher.name || h.subject === currentTeacher.subject)
                        .map((hw) => (
                          <div key={hw.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 hover:border-emerald-500/10 transition space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-500 text-xs font-bold rounded-xl block">
                                Assigned: {hw.class_name} - {hw.section}
                              </span>
                              
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => {
                                    setEditingHwId(hw.id);
                                    setHwTitle(hw.title);
                                    setHwDesc(hw.description);
                                    setHwDeadline(hw.deadline);
                                    setHwClass(`${hw.class_name}${hw.section}`);
                                  }}
                                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-amber-500 rounded-lg"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeleteHomework(hw.id)}
                                  className="p-1.5 hover:bg-rose-500/10 text-rose-500 rounded-lg"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <h4 className="text-sm font-black text-slate-900 dark:text-white leading-relaxed">{hw.title}</h4>
                              <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap">{hw.description}</p>
                            </div>

                            <div className="pt-2.5 border-t border-slate-50 dark:border-slate-850/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                              <span>Created: {hw.created_at}</span>
                              <span className="text-amber-500 font-bold">DEADLINE: {hw.deadline}</span>
                            </div>
                          </div>
                        ))
                      }
                      {homeworkList.filter(h => h.teacher_name === currentTeacher.name || h.subject === currentTeacher.subject).length === 0 && (
                        <p className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl">No homework listed for your classes. Post one to begin.</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            )}
              {activeTab === "students" && (
                <div className="space-y-6">
                  
                  {/* SEARCH FIELD BAR */}
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex items-center gap-3">
                    <Search className="h-4 w-4 text-slate-400 shrink-0" />
                    <input 
                      type="text" 
                      placeholder="Search students in assigned classes by name, parent details, roll number..."
                      value={searchMsgContact}
                      onChange={(e) => setSearchMsgContact(e.target.value)}
                      className="w-full bg-transparent border-none text-xs text-slate-800 dark:text-white focus:outline-hidden"
                    />
                  </div>

                  {/* STUDENTS LIST TABLE */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden">
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                            <th className="p-4 pl-6">Roll Code</th>
                            <th className="p-4">Student Profile</th>
                            <th className="p-4">Assigned Classroom</th>
                            <th className="p-4">Guardian / Parent Contact</th>
                            <th className="p-4">Status Pill</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                          {myStudents.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="p-8 text-center text-slate-500">
                                <p className="mb-2">No students assigned to your class/section/session.</p>
                              </td>
                            </tr>
                          ) : (
                          myStudents
                            .filter(s => {
                              if (!searchMsgContact.trim()) return true;
                              const query = searchMsgContact.toLowerCase();
                              return s.name?.toLowerCase().includes(query) || 
                                     s.roll_no?.includes(query) || 
                                     s.parent_name?.toLowerCase().includes(query);
                            })
                            .map((student) => (
                              <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                <td className="p-4 pl-6 font-mono font-bold text-slate-400">{student.roll_no}</td>
                                <td className="p-4">
                                  <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 bg-slate-100 dark:bg-slate-800 rounded-xl object-cover font-bold text-xs ring-2 ring-emerald-500/10 flex items-center justify-center">
                                      {student.name.substring(0, 2)}
                                    </div>
                                    <div>
                                      <p className="font-extrabold text-slate-805 dark:text-white text-xs">{student.name}</p>
                                      <p className="text-[10px] text-slate-400">ID: {student.id}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="p-4 font-bold text-slate-600 dark:text-slate-350">{student.class_name} - {student.section}</td>
                                <td className="p-4">
                                  <div>
                                    <p className="font-semibold">{student.parent_name}</p>
                                    <p className="text-[9px] text-slate-400 font-mono">{student.parent_email} • {student.parent_phone}</p>
                                  </div>
                                </td>
                                <td className="p-4">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                    student.status === "Active" 
                                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400" 
                                      : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                                  }`}>
                                    {student.status}
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

              {/* TAB 6: RESULTS PAGE */}
              {activeTab === "results" && (
                classesAssigned.length === 0 ? (
                  <div className="p-12 text-center max-w-md mx-auto space-y-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl mt-6">
                    <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/30 text-amber-500">
                      <ShieldAlert className="h-7 w-7" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 dark:text-slate-200">Results Ledger Blocked</h3>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                        Grades and exam results can only be recorded and managed by Class Teachers for their assigned class. You are not currently registered as the Class Teacher for any class in the school database.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 font-sans">
                  
                  {/* SELECT TARGETS ROWS CARD */}
                  <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl grid grid-cols-1 sm:grid-cols-4 gap-4">
                    
                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-550 mb-1">Target Classroom</label>
                      <select 
                        value={resClass}
                        onChange={(e) => setResClass(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                      >
                        {parsedClasses.map((cl, i) => (
                          <option key={i} value={cl.fullName}>{cl.fullName}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-550 mb-1">Exam Type</label>
                      <select 
                        value={resExam}
                        onChange={(e) => setResExam(e.target.value)}
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold"
                      >
                        <option value="Midterm Exam">Midterm Exam</option>
                        <option value="First Terminal Assessment">First Terminal Assessment</option>
                        <option value="Final Term Examinations">Final Term Examinations</option>
                        <option value="Weekly Quiz Checklist">Weekly Quiz Checklist</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-bold text-slate-550 mb-1">Subject Lead</label>
                      <input 
                        type="text" 
                        disabled 
                        value={currentTeacher.subject} 
                        className="w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-105 dark:bg-slate-950 text-slate-400 font-bold"
                      />
                    </div>

                    <div className="flex items-end">
                      <button 
                        onClick={handleSaveResults}
                        className="w-full bg-slate-900 dark:bg-emerald-600 hover:opacity-90 text-white font-bold py-2.5 rounded-xl cursor-pointer text-xs"
                      >
                        Publish Grades Roster
                      </button>
                    </div>

                  </div>

                  {/* GRADES MATRIX LIST */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl overflow-hidden">
                    <div className="p-5 border-b flex justify-between items-center text-xs">
                      <div className="space-y-1">
                        <h4 className="font-extrabold tracking-tight">Midterm Exam Ledger Sheets</h4>
                        <p className="text-[11px] text-slate-500">Provide score metrics (0 - 100) auto-calculated into school metrics grades.</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto text-xs">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-slate-50/50 dark:bg-slate-900/30 border-b text-slate-505 font-bold uppercase tracking-wider text-[10px]">
                            <th className="p-4 pl-6">Roll Code</th>
                            <th className="p-4">Student Profile</th>
                            <th className="p-4 max-w-[120px]">Obtained marks</th>
                            <th className="p-4 max-w-[100px] text-center">Class Grade</th>
                            <th className="p-4">Comments Feedback</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                          {myStudents
                            .filter(s => {
                              const parsed = parsedClasses.find(c => c.fullName === resClass);
                              return parsed ? (s.class_name === parsed.className && s.section === parsed.section) : false;
                            })
                            .map((st) => {
                              const studentScoreObj = resMarksMap[st.id] || { marks: 0, comments: "" };
                              const marks = studentScoreObj.marks || 0;
                              const gradeInfo = calculateGrade(marks);

                              return (
                                <tr key={st.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10">
                                  <td className="p-4 pl-6 font-mono font-bold text-slate-400">{st.roll_no}</td>
                                  <td className="p-4">
                                    <div className="flex items-center gap-2">
                                      <p className="font-bold">{st.name}</p>
                                    </div>
                                  </td>
                                  <td className="p-4 text-xs font-mono">
                                    <div className="flex items-center gap-1.5 font-bold">
                                      <input 
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={marks === 0 ? "" : marks}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setResMarksMap(p => ({
                                            ...p,
                                            [st.id]: { ...p[st.id], marks: val }
                                          }));
                                        }}
                                        className="w-16 px-2.5 py-1 rounded-xl border border-slate-205 dark:border-slate-805 bg-slate-50 dark:bg-slate-950 text-center font-bold"
                                        placeholder="0"
                                      />
                                      <span className="text-slate-400">/ 100</span>
                                    </div>
                                  </td>
                                  <td className="p-4 text-center">
                                    <span className={gradeInfo.color}>{gradeInfo.grade}</span>
                                  </td>
                                  <td className="p-4">
                                    <input 
                                      type="text"
                                      value={studentScoreObj.comments || ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setResMarksMap(p => ({
                                          ...p,
                                          [st.id]: { ...p[st.id], comments: val }
                                        }));
                                      }}
                                      className="w-full text-xs px-3 py-1.5 rounded-xl border border-slate-205 bg-slate-50 dark:bg-slate-950"
                                      placeholder="Provide custom grading commentary..."
                                    />
                                  </td>
                                </tr>
                              );
                            })
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )
            )}
              {activeTab === "timetable" && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 p-6 rounded-3xl space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-black">Authorized Course Lecture Timeslots</h3>
                      <p className="text-xs text-slate-550 leading-relaxed">
                        Below is the schedule matching your educator profile (filtered on <strong>{currentTeacher.name}</strong> or <strong>{currentTeacher.subject}</strong> syllabus). Highlighted rows map current lessons assignments.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      {(["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"] as const).map((day) => {
                        const dayLessons = myTimetable.filter(item => item.day_of_week === day);

                        return (
                          <div key={day} className="bg-slate-50/50 dark:bg-slate-950 p-4 rounded-2xl border flex flex-col gap-3">
                            <h4 className="text-xs font-black text-slate-800 dark:text-white border-b pb-2">{day}</h4>
                            
                            {dayLessons.length > 0 ? (
                              dayLessons.map((lesson) => (
                                <div key={lesson.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 rounded-xl space-y-1.5 text-xs">
                                  <div className="flex items-center justify-between font-mono text-[9px] text-slate-400">
                                    <span>{lesson.start_time}</span>
                                  </div>
                                  <div>
                                    <p className="font-extrabold">{lesson.class_name} - {lesson.section}</p>
                                    <p className="text-[10px] text-emerald-500 font-bold">{lesson.subject}</p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <p className="text-[10px] text-slate-405 py-8 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed">No Lectures</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 8: MESSAGES PAGE */}
              {activeTab === "messages" && (
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl h-[68vh] overflow-hidden flex">
                  
                  {/* DIRECTORY PANEL */}
                  <div className="w-1/3 border-r dark:border-slate-800 hidden md:flex flex-col h-full bg-slate-50/20">
                    <div className="p-4 border-b space-y-3 shrink-0">
                      <h4 className="text-xs uppercase font-mono tracking-widest text-slate-400 font-black">School Contacts</h4>
                      <div className="p-2 bg-slate-100 dark:bg-slate-950 rounded-xl flex items-center gap-2">
                        <Search className="h-4 w-4 text-slate-400" />
                        <input 
                          type="text" 
                          placeholder="Search parents..." 
                          className="bg-transparent border-none text-[11px] outline-hidden w-full"
                          value={searchMsgContact}
                          onChange={(e) => setSearchMsgContact(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-850/60 p-2 space-y-1 text-xs">
                      {directoryContacts
                        .filter(c => {
                          if (!searchMsgContact.trim()) return true;
                          return c.name?.toLowerCase().includes(searchMsgContact.toLowerCase());
                        })
                        .map((contact) => {
                          const active = selectedContact?.id === contact.id;
                          return (
                            <button
                              key={contact.id}
                              onClick={() => setSelectedContact(contact)}
                              className={`w-full text-left p-3 rounded-2xl flex items-center gap-3 cursor-pointer duration-100 ${
                                active 
                                  ? "bg-slate-950 text-white dark:bg-emerald-600 shadow-xs" 
                                  : "hover:bg-slate-100 dark:hover:bg-slate-800"
                              }`}
                            >
                              <div className="h-9 w-9 bg-slate-200 dark:bg-slate-700 rounded-xl flex items-center justify-center font-bold text-slate-705 dark:text-white uppercase font-mono">
                                {contact.name.substring(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold truncate leading-tight">{contact.name}</p>
                                <span className="text-[10px] text-slate-400 block mt-0.5 capitalize">{contact.role}</span>
                              </div>
                            </button>
                          );
                        })
                      }
                    </div>
                  </div>

                  {/* ACTIVE CHAT THREAD */}
                  <div className="flex-1 flex flex-col h-full justify-between">
                    
                    {/* CHAT THREAD BANNER */}
                    {selectedContact ? (
                      <>
                        <div className="p-4 border-b bg-slate-50/10 flex items-center justify-between shrink-0">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-bold uppercase font-mono">
                              {selectedContact.name.substring(0,2)}
                            </div>
                            <div>
                              <p className="text-xs font-black">{selectedContact.name}</p>
                              <span className="text-[10px] text-emerald-500 font-bold uppercase font-mono tracking-wider">{selectedContact.role}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-slate-450 text-xs">
                            <span className="hidden sm:inline font-semibold">{selectedContact.phone}</span>
                          </div>
                        </div>

                        {/* MESSAGE LOG TRAY */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[48vh] text-xs">
                          {filteredMessages.map((msg) => {
                            const isMe = msg.sender_id === "me";
                            return (
                              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                                <div className={`p-4 rounded-3xl max-w-md ${
                                  isMe 
                                    ? "bg-slate-950 text-white dark:bg-emerald-600 rounded-tr-xs" 
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-xs"
                                }`}>
                                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                  <span className="text-[9px] text-slate-400 block text-right mt-1.5 font-mono">
                                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* SUBMISSION ROW */}
                        <div className="p-4 border-t shrink-0">
                          <form onSubmit={handleSendMessageSubmit} className="flex gap-2 text-xs">
                            <input 
                              type="text"
                              required
                              placeholder={`Transmit chat to ${selectedContact.name}...`}
                              value={typedMessage}
                              onChange={(e) => setTypedMessage(e.target.value)}
                              className="w-full text-xs px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 dark:bg-slate-950 focus:outline-hidden"
                            />
                            <button type="submit" className="px-5 bg-slate-900 dark:bg-emerald-600 text-white rounded-2xl font-bold cursor-pointer hover:opacity-90 flex items-center justify-center">
                              Send
                            </button>
                          </form>
                        </div>
                      </>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 font-mono text-xs">
                        <MessageCircle className="h-10 w-10 text-slate-300 mb-2 animate-bounce" />
                        <span>Select a school contact from sidebar to initiate live chat logs</span>
                      </div>
                    )}

                  </div>

                </div>
              )}

              {/* TAB 9: NOTICES PAGE */}
              {activeTab === "notices" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* CREATE NOTICE BLOCK */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 p-6 rounded-3xl h-fit space-y-4">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-slate-500 font-bold">
                      Broadcast Classroom Notice
                    </h4>

                    <form onSubmit={handlePostNotice} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Notice Title header *</label>
                        <input 
                          type="text"
                          required
                          placeholder="e.g. Supplementary math sheets schedule change"
                          value={newNoticeTitle}
                          onChange={(e) => setNewNoticeTitle(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Level priority</label>
                        <select
                          value={newNoticeType}
                          onChange={(e: any) => setNewNoticeType(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950 font-bold"
                        >
                          <option value="general">general Indicator</option>
                          <option value="holiday">holiday Rest</option>
                          <option value="exam">exam Syllabus</option>
                          <option value="emergency">Emergency Urgent Alert</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Outline details *</label>
                        <textarea 
                          required
                          rows={4}
                          placeholder="Describe the notice bulletin contents with instructions..."
                          value={newNoticeContent}
                          onChange={(e) => setNewNoticeContent(e.target.value)}
                          className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 dark:bg-slate-950"
                        />
                      </div>

                      <button type="submit" className="w-full bg-slate-900 dark:bg-emerald-600 text-white font-bold py-2.5 rounded-xl cursor-pointer">
                        Broadcast bulletin Broadly
                      </button>
                    </form>
                  </div>

                  {/* ACTIVE BROADCAST LIST */}
                  <div className="lg:col-span-2 space-y-4">
                    <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wide">Recent Posted School Notices</h3>
                    
                    <div className="space-y-4">
                      {notices.map((notice) => {
                        const styleColors = {
                          general: "bg-emerald-500/10 text-emerald-500",
                          holiday: "bg-indigo-500/10 text-indigo-400",
                          exam: "bg-sky-500/10 text-sky-400",
                          emergency: "bg-rose-500/10 text-rose-500"
                        }[notice.type || "general"];

                        return (
                          <div key={notice.id} className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 space-y-3 hover:border-emerald-500/10 transition">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${styleColors}`}>
                                  {notice.type}
                                </span>
                                <span className="text-[10px] text-slate-400">By {notice.created_by}</span>
                              </div>

                              <div className="flex items-center gap-2 text-xs">
                                <span className="text-[9px] font-mono text-slate-405">{notice.date}</span>
                                {notice.created_by?.includes(currentTeacher.name.split(" ")[0]) && (
                                  <button onClick={() => handleDeleteNotice(notice.id)} className="p-1 hover:bg-rose-500/10 text-rose-500 rounded-lg">
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>

                            <h4 className="text-xs font-black">{notice.title}</h4>
                            <p className="text-xs text-slate-550 leading-normal leading-relaxed whitespace-pre-wrap">{notice.content}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 10: USER PROFILE PAGE */}
              {activeTab === "profile" && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* LEFT STATS SUMMARY COMPONENT */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 p-6 rounded-3xl text-center space-y-4 h-fit">
                    <div className="relative w-28 h-28 mx-auto ring-4 ring-emerald-500/20 rounded-full overflow-hidden">
                      <img 
                        referrerPolicy="no-referrer"
                        src={profilePhoto || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150"} 
                        alt={currentTeacher.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-base font-black text-slate-900 dark:text-white">{currentTeacher.name}</h3>
                      <p className="text-xs text-emerald-500 font-bold">{currentTeacher.subject} Lead Instructor</p>
                      <p className="text-[10px] font-mono text-slate-400">{currentTeacher.email}</p>
                    </div>

                    <div className="border-t pt-4 space-y-2.5 text-left text-xs">
                      <div>
                        <span className="text-slate-405 block text-[10px] uppercase font-bold">Qualification Credentials</span>
                        <span className="font-bold">{profileQual || "M.Sc. Education"}</span>
                      </div>
                      <div>
                        <span className="text-slate-405 block text-[10px] uppercase font-bold">Faculty Enrollment Date</span>
                        <span className="font-semibold font-mono">{currentTeacher.joining_date || "2024-08-15"}</span>
                      </div>
                      <div>
                        <span className="text-slate-405 block text-[10px] uppercase font-bold">Teaching Rooms Matrix</span>
                        <span className="font-bold text-slate-700 dark:text-white">{classesAssigned.join(" • ")}</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT EDITABLE FORM COMPONENT */}
                  <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 space-y-4 text-xs">
                    <h4 className="text-xs uppercase font-mono tracking-wider text-slate-500 font-bold">
                      Configure Profile & Credentials Settings
                    </h4>

                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Full Educator name</label>
                          <input 
                            type="text" 
                            disabled 
                            value={currentTeacher.name} 
                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-105 text-slate-450 dark:bg-slate-950 font-bold"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Email Coordinates</label>
                          <input 
                            type="email" 
                            disabled 
                            value={currentTeacher.email} 
                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-105 text-slate-455 dark:bg-slate-950 font-mono"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Mobile Contact Phone Number</label>
                          <input 
                            type="text" 
                            placeholder="+1 555-0101"
                            value={profilePhone}
                            onChange={(e) => setProfilePhone(e.target.value)}
                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">qualification Degree</label>
                          <input 
                            type="text" 
                            placeholder="M.Sc. Mathematics, B.Ed"
                            value={profileQual}
                            onChange={(e) => setProfileQual(e.target.value)}
                            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                          />
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="relative">
                          {uploadingImage ? (
                            <div className="h-16 w-16 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center ring-4 ring-emerald-500/10 shadow-xs">
                              <div className="h-5 w-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                          ) : (
                            <>
                              <img
                                src={profilePhoto || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
                                alt="Profile"
                                className="h-16 w-16 rounded-2xl object-cover ring-4 ring-emerald-500/10 shadow-xs"
                                referrerPolicy="no-referrer"
                              />
                              <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-1 border-2 border-white dark:border-slate-950">
                                <Camera className="h-3 w-3" />
                              </div>
                            </>
                          )}
                        </div>
                        <div className="flex-1 w-full space-y-2">
                          <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Display Profile Photo</label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleImageUpload}
                              disabled={uploadingImage || loading}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <button
                              type="button"
                              disabled={uploadingImage || loading}
                              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                            >
                              {uploadingImage ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                  Uploading...
                                </>
                              ) : (
                                <>
                                  <Upload className="h-4 w-4" />
                                  Upload Photo from Device
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-3.5">
                        <h5 className="font-extrabold text-xs text-rose-500 flex items-center gap-1.5">
                          <KeyRound className="h-4 w-4" />
                          <span>Portal Security Security Parameters</span>
                        </h5>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-420 mb-1">New Secure Password</label>
                            <input 
                              type="password" 
                              placeholder="••••••••"
                              value={profilePass}
                              onChange={(e) => setProfilePass(e.target.value)}
                              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">Leave blank to retain current active password.</p>
                          </div>
                        </div>
                      </div>

                      <button type="submit" className="bg-slate-900 dark:bg-emerald-600 hover:opacity-90 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer">
                        Update Settings
                      </button>

                    </form>
                  </div>

                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}

        {/* FLOATING SMARTY ASSISTANT IN LOWER CORNER */}
        <ChatBot userRole="teacher" userName={currentTeacher.name} />

      </main>

    </div>
  );
}
