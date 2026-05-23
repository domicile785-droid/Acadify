import React, { useState } from "react";
import { 
  Search, Plus, Edit2, Trash2, UserPlus, Phone, Mail, Hash, BookOpen, Layers, Check, X, Camera, Loader2, Upload
} from "lucide-react";
import { Student } from "../types";
import { uploadImage } from "../lib/supabase";

interface StudentManagerProps {
  students: Student[];
  onSaveStudent: (student: Student) => Promise<void>;
  onDeleteStudent: (id: string) => Promise<void>;
  isAdminOrTeacher: boolean;
}

export default function StudentManager({ 
  students, onSaveStudent, onDeleteStudent, isAdminOrTeacher 
}: StudentManagerProps) {
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClass, setSelectedClass] = useState("All");
  
  // Editing state
  const [isEditing, setIsEditing] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Partial<Student>>({});
  const [errorText, setErrorText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [sectionsList, setSectionsList] = useState<any[]>([]);
  const [sessionsList, setSessionsList] = useState<any[]>([]);

  React.useEffect(() => {
    import("../lib/supabase").then(({ db }) => {
      db.classes.list().then(cl => setClassesList(cl));
      db.sections.list().then(se => setSectionsList(se));
      db.academic_sessions.list().then(ss => setSessionsList(ss));
    }).catch(console.error);
  }, []);

  // Filter students
  const filteredStudents = students.filter(student => {
    const matchesSearch = (student.name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (student.roll_no || "").includes(searchTerm) ||
                          (student.parent_name && student.parent_name.toLowerCase().includes(searchTerm.toLowerCase()));
                          
    const matchesClass = selectedClass === "All" || student.class_name === selectedClass;
    
    return matchesSearch && matchesClass;
  });

  const handleCreateNew = () => {
    setEditingStudent({
      id: `stud-${Date.now()}`,
      roll_no: "",
      name: "",
      class_name: classesList.length > 0 ? classesList[0].class_name : "Class 10",
      section_name: sectionsList.length > 0 ? sectionsList[0].section_name : "A",
      parent_name: "",
      parent_email: "",
      parent_phone: "",
      photo_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150",
      status: "Active",
      
      // Part 1 required fields
      gender: "Male",
      dob: "2010-05-15",
      blood_group: "O+",
      aadhaar_no: "",
      admission_date: new Date().toISOString().split("T")[0],
      admission_number: `ADM-${Date.now().toString().substring(7)}`,
      academic_session: sessionsList.length > 0 ? sessionsList[0].session_name : "2026-2027",
      father_name: "",
      mother_name: "",
      address: "",
      emergency_contact: "",
      student_email: "",
      // Sub credentials
      student_password: `Stud-${Math.random().toString(36).substring(2, 8).toUpperCase()}!`,
      parent_password: `Parent-${Math.random().toString(36).substring(2, 8).toUpperCase()}!`
    } as any);
    setErrorText(null);
    setIsEditing(true);
  };

  const handleEdit = (s: Student) => {
    setEditingStudent({ 
      ...s,
      // Ensure fallbacks for editing view
      gender: s.gender || "Male",
      dob: s.dob || "2010-05-15",
      blood_group: s.blood_group || "O+",
      aadhaar_no: s.aadhaar_no || "",
      admission_date: s.admission_date || new Date().toISOString().split("T")[0],
      admission_number: s.admission_number || `ADM-${Date.now().toString().substring(7)}`,
      academic_session: s.academic_session || "2026-2027",
      father_name: s.father_name || s.parent_name || "",
      mother_name: s.mother_name || "",
      address: s.address || "",
      emergency_contact: s.emergency_contact || "",
      student_email: s.student_email || s.parent_email?.replace("parent", "student") || "student@example.com",
      student_password: "••••••••",
      parent_password: "••••••••"
    } as any);
    setErrorText(null);
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent.name || !editingStudent.roll_no || !editingStudent.class_id || !editingStudent.section_name || !editingStudent.academic_session) {
      setErrorText("Name, Roll Number, Class, Section, and Academic Session are required fields.");
      return;
    }

    const isNew = editingStudent.id?.startsWith("stud-") || !students.some(x => x.id === editingStudent.id);
    
    // UI Duplicates preventer
    if (isNew) {
      const emailDup = students.some(s => s.student_email?.toLowerCase() === editingStudent.student_email?.toLowerCase());
      if (emailDup) {
        setErrorText("Duplicate Student Email: A student profile with this email already exists in the local database.");
        return;
      }

      const rollDup = students.some(s => s.roll_no === editingStudent.roll_no && s.class_id === editingStudent.class_id);
      if (rollDup) {
        setErrorText(`Duplicate Roll: A student with Roll # ${editingStudent.roll_no} is already assigned inside this class.`);
        return;
      }
    }

    try {
      setLoading(true);
      setErrorText(null);
      
      const studentToSave = {
        ...editingStudent,
        // Ensure class_name is also set for backward compatibility
        class_name: classesList.find(c => c.id === editingStudent.class_id)?.class_name || editingStudent.class_name
      };

      await onSaveStudent(studentToSave as Student);
      setIsEditing(false);
      setEditingStudent({});
    } catch (err: any) {
      console.error("Failed saving student profile:", err);
      setErrorText(err.message || "An error occurred while linking and uploading the student registry onto Supabase.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      setUploadingImage(true);
      setErrorText(null);
      // use the "student-images" bucket
      const uploadedUrl = await uploadImage(file, "student-images");
      setEditingStudent(prev => ({ ...prev, photo_url: uploadedUrl }));
    } catch (err: any) {
      console.error("Image upload failed", err);
      setErrorText("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-750 shadow-2xs">
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:max-w-2xl">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, roll # or parent..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 focus:outline-hidden focus:border-emerald-500 text-slate-800 dark:text-white"
            />
          </div>

          {/* Class Filter Dropdown */}
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-700 dark:text-slate-300 cursor-pointer"
          >
            <option value="All">All Classes</option>
            {classesList.length > 0 ? (
              classesList.map(c => <option key={c.id} value={c.class_name}>{c.class_name}</option>)
            ) : (
              <>
                <option value="Class 10">Class 10</option>
                <option value="Class 9">Class 9</option>
              </>
            )}
          </select>
        </div>

        {/* Add Student Button (Admin & Teacher only) */}
        {isAdminOrTeacher && (
          <button
            onClick={handleCreateNew}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 self-start sm:self-auto cursor-pointer shadow-xs transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Add Student
          </button>
        )}
      </div>

      {/* Editing Side panel or Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs transition-opacity p-4 animate-in fade-in duration-200 overflow-y-auto">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-850 overflow-hidden transform animate-in scale-in duration-250 my-8">
            
            {/* Modal Header */}
            <div className="bg-slate-50 dark:bg-slate-950 p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-905 dark:text-white text-lg">
                  {editingStudent.id && students.some(x => x.id === editingStudent.id) ? "Modify Student Record" : "Enlist New Scholar Registry"}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Fill academic, parent contact and secure login details</p>
              </div>
              <button 
                onClick={() => setIsEditing(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Error Banner */}
            {errorText && (
              <div className="bg-rose-50 dark:bg-rose-950/30 border-l-4 border-rose-500 p-4 mx-6 mt-4 rounded-xl text-xs text-rose-700 dark:text-rose-400 font-bold flex items-start gap-2.5">
                <span className="text-base select-none mt-0.5">⚠️</span>
                <div className="flex-1">
                  <p className="font-extrabold">Validation Registry Mismatch</p>
                  <p className="font-semibold text-slate-600 dark:text-rose-300/80 mt-0.5">{errorText}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto estimation-scroll">
              
              {/* Photo Input (top level) */}
              <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="relative">
                  {uploadingImage ? (
                    <div className="h-20 w-20 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center ring-4 ring-emerald-500/10 shadow-xs">
                      <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (
                    <>
                      <img
                        src={editingStudent.photo_url || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150"}
                        alt="academic photo"
                        className="h-20 w-20 rounded-2xl object-cover ring-4 ring-emerald-500/10 shadow-xs"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-1.5 border-2 border-white dark:border-slate-950">
                        <Camera className="h-4 w-4" />
                      </div>
                    </>
                  )}
                </div>
                <div className="flex-1 w-full space-y-2">
                  <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">Student Profile Photo</span>
                  
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
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                    >
                      {uploadingImage ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading to Storage...
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          Choose Image from Device Gallery
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* 1. BASIC DETAILS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black">1</span>
                  Scholar Basic Particulars
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Scholar Full Name *</label>
                    <input
                      type="text"
                      required
                      disabled={loading}
                      value={editingStudent.name || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:border-emerald-500 text-slate-750 dark:text-slate-200 font-bold"
                      placeholder="e.g. David Miller"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Gender *</label>
                    <select
                      disabled={loading}
                      value={editingStudent.gender || "Male"}
                      onChange={(e) => setEditingStudent({ ...editingStudent, gender: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-755 dark:text-slate-200 font-bold"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      required
                      disabled={loading}
                      value={editingStudent.dob || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, dob: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-700 dark:text-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Blood Group *</label>
                    <select
                      disabled={loading}
                      value={editingStudent.blood_group || "O+"}
                      onChange={(e) => setEditingStudent({ ...editingStudent, blood_group: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-700 dark:text-slate-300"
                    >
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Aadhaar Number (Optional)</label>
                    <input
                      type="text"
                      disabled={loading}
                      value={editingStudent.aadhaar_no || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, aadhaar_no: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden font-mono text-slate-700 dark:text-slate-300"
                      placeholder="e.g. 1234-5678-9012"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Admission Date *</label>
                    <input
                      type="date"
                      required
                      disabled={loading}
                      value={editingStudent.admission_date || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, admission_date: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-700 dark:text-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* 2. ACADEMIC DETAILS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-teal-650 dark:text-teal-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="bg-teal-100 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black">2</span>
                  School Academic Placement
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Admission ID (System generated)</label>
                    <input
                      type="text"
                      disabled
                      value={editingStudent.admission_number || ""}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-550 dark:text-slate-400 font-mono font-bold select-all"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Roll Number *</label>
                    <input
                      type="text"
                      required
                      disabled={loading}
                      value={editingStudent.roll_no || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, roll_no: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden font-bold font-mono text-slate-850 dark:text-slate-150"
                      placeholder="e.g. 101"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Class Program *</label>
                    <select
                      disabled={loading}
                      value={editingStudent.class_id || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, class_id: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-755 dark:text-slate-200 font-bold"
                    >
                      <option value="">Select Class</option>
                      {classesList.length > 0 ? (
                        classesList.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)
                      ) : (
                        <>
                          <option value="class-10">Class 10</option>
                          <option value="class-9">Class 9</option>
                          <option value="class-8">Class 8</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Section Dropdown *</label>
                    <select
                      disabled={loading}
                      value={editingStudent.section_name || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, section_name: e.target.value })}
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-755 dark:text-slate-200 font-bold"
                    >
                      <option value="">Select Section</option>
                      {sectionsList.length > 0 ? (
                        [...new Set(sectionsList.map(s => s.section_name))].map(s => <option key={s as string} value={s as string}>Section {s as string}</option>)
                      ) : (
                        <>
                          <option value="A">Section A</option>
                          <option value="B">Section B</option>
                          <option value="C">Section C</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Academic Session Period</label>
                    <select
                      disabled={loading}
                      value={editingStudent.academic_session || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, academic_session: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden font-bold text-slate-700 dark:text-slate-300"
                    >
                      <option value="">Select Session</option>
                      {sessionsList.length > 0 ? (
                        sessionsList.map(s => <option key={s.id} value={s.session_name}>{s.session_name}</option>)
                      ) : (
                        <>
                           <option value="2026-2027">2026-2027</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* 3. PARENT DETAILS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black">3</span>
                  Domestic Guardian / Parent Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Father Full Name *</label>
                    <input
                      type="text"
                      required
                      disabled={loading}
                      value={editingStudent.father_name || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, father_name: e.target.value, parent_name: e.target.value || editingStudent.mother_name })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-200 font-semibold"
                      placeholder="e.g. Arthur Miller"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Mother Full Name *</label>
                    <input
                      type="text"
                      required
                      disabled={loading}
                      value={editingStudent.mother_name || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, mother_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-200 font-semibold"
                      placeholder="e.g. Sarah Miller"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Parent Mobile Contact *</label>
                    <input
                      type="text"
                      required
                      disabled={loading}
                      value={editingStudent.parent_phone || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, parent_phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-200 font-bold"
                      placeholder="e.g. +1 555-0192"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Emergency Secondary Contact</label>
                    <input
                      type="text"
                      disabled={loading}
                      value={editingStudent.emergency_contact || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, emergency_contact: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-200"
                      placeholder="e.g. +1 555-0999"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Parent Contact Email Address *</label>
                    <input
                      type="email"
                      required
                      disabled={loading}
                      value={editingStudent.parent_email || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, parent_email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden font-semibold text-slate-800 dark:text-white"
                      placeholder="guardian.miller@gmail.com"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Parent Residential Address *</label>
                    <textarea
                      required
                      disabled={loading}
                      rows={2}
                      value={editingStudent.address || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-200"
                      placeholder="Input complete parent home address..."
                    />
                  </div>
                </div>
              </div>

              {/* 4. LOGIN DETAILS */}
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 pb-1 border-b border-slate-100 dark:border-slate-800">
                  <span className="bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-black">4</span>
                  Credential login security parameters
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="md:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Student Portal Email Address *</label>
                    <input
                      type="email"
                      required
                      disabled={loading || (editingStudent.id && !editingStudent.id.startsWith("stud-"))}
                      value={editingStudent.student_email || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, student_email: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden font-bold text-indigo-600 dark:text-indigo-300"
                      placeholder="david.m@smartschool.edu"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Student Password *</label>
                    <input
                      type="text"
                      required
                      disabled={loading}
                      value={(editingStudent as any).student_password || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, student_password: e.target.value } as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-200 font-mono"
                      placeholder="Set solid student login password"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Parent Secure Password *</label>
                    <input
                      type="text"
                      required
                      disabled={loading}
                      value={(editingStudent as any).parent_password || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, parent_password: e.target.value } as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-200 font-mono"
                      placeholder="Set guardian portal lock password"
                    />
                  </div>
                </div>
              </div>

              {/* Status checkboxes */}
              <div className="flex flex-col gap-2 pt-2 text-xs border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="activeCheck"
                    disabled={loading}
                    checked={editingStudent.status === "Active"}
                    onChange={(e) => setEditingStudent({ ...editingStudent, status: e.target.checked ? "Active" : "Inactive" })}
                    className="h-4 w-4 rounded-sm border-slate-250 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="activeCheck" className="text-slate-700 dark:text-slate-350 font-bold select-none">
                    Assign profile status as ACTIVE in the school ledger
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:opacity-80 transition-opacity cursor-pointer text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold flex items-center gap-2 transition-colors cursor-pointer text-xs shadow-md disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center gap-1">
                      <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4m2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Updating Ledger...
                    </span>
                  ) : (
                    "Complete Scholar Enrollment"
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Grid of Student Cards (Mobile-first responsive presentation) */}
      {filteredStudents.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-dashed border-slate-200 dark:border-slate-750">
          <BookOpen className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h3 className="font-bold text-slate-700 dark:text-slate-300">No students found</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm mx-auto">
            We couldn't find any students matching your search filters in the database. Please adjust filters or try adding a new student.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <div 
              key={student.id} 
              className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-755 shadow-3xs p-5 relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/20 hover:shadow-xs transition-all duration-300"
            >
              
              {/* Badge for class/roll */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img
                      src={student.photo_url || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150"}
                      alt={student.name}
                      className="h-14 w-14 rounded-xl object-cover ring-2 ring-slate-100 dark:ring-slate-700"
                      referrerPolicy="no-referrer"
                    />
                    <span className={`absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full border-2 border-white dark:border-slate-800 ${student.status === "Active" ? "bg-emerald-500" : "bg-slate-400"}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {student.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1.5 mt-1">
                      <Hash className="h-3 w-3 text-slate-300" /> Roll: {student.roll_no}
                    </span>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="inline-block px-2.5 py-1 rounded-lg bg-teal-50 dark:bg-teal-950/30 text-teal-700 dark:text-teal-400 font-bold border border-teal-100 dark:border-teal-900">
                    {student.class_name}-{student.section_name}
                  </span>
                </div>
              </div>

              {/* Parents details block */}
              <div className="border-t border-slate-50 dark:border-slate-700/50 pt-4 mt-4 space-y-2 text-xs">
                <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                  <span className="font-medium text-[11px]">Academic Guardian:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300 text-[11px]">{student.parent_name || 'Not assigned'}</span>
                </div>

                {student.parent_email && (
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Mail className="h-3.5 w-3.5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    <span className="truncate">{student.parent_email}</span>
                  </div>
                )}

                {student.parent_phone && (
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Phone className="h-3.5 w-3.5 text-slate-300 group-hover:text-teal-500 transition-colors" />
                    <span>{student.parent_phone}</span>
                  </div>
                )}
              </div>

              {/* Action operations */}
              {isAdminOrTeacher && (
                <div className="flex items-center gap-1.5 justify-end mt-4 pt-3 border-t border-slate-50 dark:border-slate-700/50 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEdit(student)}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-emerald-600 rounded-lg transition-colors cursor-pointer"
                    title="Edit enrollment settings"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if(confirm(`Are you absolutely sure you want to delete ${student.name} from the portal?`)) {
                        onDeleteStudent(student.id);
                      }
                    }}
                    className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Remove record"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

            </div>
          ))}
        </div>
      )}

    </div>
  );
}
