import React, { useState } from "react";
import { 
  Users, Mail, Phone, BookOpen, Layers, Edit2, Trash2, Plus, X, ShieldAlert, BadgeCheck, Sparkles, Loader2, Upload, Camera 
} from "lucide-react";
import { Teacher } from "../types";
import { uploadImage } from "../lib/supabase";

interface TeacherManagerProps {
  teachers: Teacher[];
  onSaveTeacher: (teacher: Teacher) => Promise<Teacher>;
  onDeleteTeacher: (id: string) => Promise<void>;
  isAdmin: boolean;
}

export default function TeacherManager({ 
  teachers, onSaveTeacher, onDeleteTeacher, isAdmin 
}: TeacherManagerProps) {
  
  const [editingTeacher, setEditingTeacher] = useState<Partial<Teacher>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [successTeacher, setSuccessTeacher] = useState<{ name: string; email: string; password?: string } | null>(null);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [subjectList, setSubjectList] = useState<any[]>([]);
  const [sectionsList, setSectionsList] = useState<any[]>([]);
  const [sessionsList, setSessionsList] = useState<any[]>([]);

  React.useEffect(() => {
    import("../lib/supabase").then(({ db }) => {
      db.classes.list().then(cl => setClassesList(cl));
      db.subjects.list().then(sb => setSubjectList(sb));
      db.sections.list().then(se => setSectionsList(se));
      db.academic_sessions.list().then(ss => setSessionsList(ss));
    }).catch(console.error);
  }, []);
  
  const handleAddNew = () => {
    setErrorText(null);
    setSuccessTeacher(null);
    setEditingTeacher({
      id: `teach-${Date.now()}`,
      name: "",
      email: "",
      phone: "",
      subject: subjectList.length > 0 ? subjectList[0].subject_name : "Mathematics",
      classes_assigned: classesList.length > 0 ? [`${classesList[0].class_name}A`] : ["Class 10A"],
      photo_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150",
      qualification: "",
      password: ""
    });
    setIsEditing(true);
  };

  const handleEdit = (t: Teacher) => {
    setErrorText(null);
    setSuccessTeacher(null);
    setEditingTeacher({ ...t });
    setIsEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher.name || !editingTeacher.email || !editingTeacher.section_name || !editingTeacher.academic_session || !editingTeacher.assigned_class_id) {
      setErrorText("Name, Email, Class, Section, and Academic Session are required.");
      return;
    }

    setLoading(true);
    setErrorText(null);

    try {
      if (editingTeacher.assigned_class_id && editingTeacher.assigned_class_id !== "None" && editingTeacher.assigned_class_id !== "") {
        const hasDuplicate = teachers.some(
          t => t.id !== editingTeacher.id && t.assigned_class_id === editingTeacher.assigned_class_id
        );
        if (hasDuplicate) {
          setErrorText("This class already has a class teacher assigned.");
          setLoading(false);
          return;
        }
      }

      const isNew = !teachers.some(x => x.id === editingTeacher.id);
      
      const teacherToSave = {
        ...editingTeacher,
        class_teacher_of: classesList.find(c => c.id === editingTeacher.assigned_class_id)?.class_name || editingTeacher.class_teacher_of
      };

      const savedTeacher = await onSaveTeacher(teacherToSave as Teacher);
      
      if (isNew) {
        setSuccessTeacher({
          name: savedTeacher?.name || editingTeacher.name || "",
          email: savedTeacher?.email || editingTeacher.email || "",
          password: savedTeacher?.password || editingTeacher.password || "Success"
        });
        alert("Teacher added successfully");
      } else {
        setIsEditing(false);
        setEditingTeacher({});
        alert("Teacher updated successfully");
      }
    } catch (err: any) {
      console.error("Failed to save teacher:", err);
      setErrorText(err.message || "An unexpected error occurred during teacher registration.");
    } finally {
      setLoading(false);
    }
  };

  const handleAssignedClassesChange = (valStr: string) => {
    const list = valStr.split(",").map(x => x.trim()).filter(Boolean);
    setEditingTeacher({ ...editingTeacher, classes_assigned: list });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    try {
      setUploadingImage(true);
      setErrorText(null);
      // use the "teacher-images" bucket
      const uploadedUrl = await uploadImage(file, "teacher-images");
      setEditingTeacher(prev => ({ ...prev, photo_url: uploadedUrl }));
    } catch (err: any) {
      console.error("Image upload failed", err);
      setErrorText("Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const isNewEducator = !teachers.some(x => x.id === editingTeacher.id);

  return (
    <div className="space-y-6">
      
      {/* Banner / Controller action */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-750 shadow-2xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Faculty Directory</h2>
          <p className="text-xs text-slate-400 mt-1">Specialized subject educators and classroom loads</p>
        </div>

        {isAdmin && (
          <button
            onClick={handleAddNew}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Faculty Member
          </button>
        )}
      </div>

      {/* Editing overlay */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs transition-opacity p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform animate-in scale-in duration-200">
            
            <div className="p-5 border-b border-slate-150 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <h3 className="font-bold text-slate-800 dark:text-white text-sm">
                {successTeacher 
                  ? "Registration Completed" 
                  : (isNewEducator ? "Register New Educator" : "Modify Educator Details")}
              </h3>
              <button 
                onClick={() => setIsEditing(false)} 
                disabled={loading}
                className="text-slate-400 hover:text-slate-600 cursor-pointer disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {successTeacher ? (
              <div className="p-6 space-y-5 text-center text-xs">
                <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/45 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <BadgeCheck className="h-6 w-6 animate-bounce" />
                </div>
                
                <div className="space-y-1.5">
                  <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">Educator Sign Up Complete</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    The auth user credentials, school profile metadata, and faculty indexes have been generated successfully.
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-150 dark:border-slate-800 text-left space-y-3 font-medium">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block uppercase tracking-wider">Full Name</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{successTeacher.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-extrabold block uppercase tracking-wider">Email Address / Login ID</span>
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">{successTeacher.email}</span>
                  </div>
                  {successTeacher.password && (
                    <div className="pt-2 border-t border-slate-150 dark:border-slate-800">
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-extrabold block uppercase tracking-wider">Credentials Temporary Password</span>
                      <div className="flex items-center justify-between gap-2 mt-1.5 bg-emerald-500/5 dark:bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                        <span className="text-xs font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {successTeacher.password}
                        </span>
                        <button 
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(successTeacher.password || "");
                            alert("Educator credentials temporary password copied successfully!");
                          }}
                          className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline font-extrabold cursor-pointer"
                        >
                          Copy Password
                        </button>
                      </div>
                      <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-2 font-medium">
                        * Deliver this password to the faculty member. They are registered on the Auth Server and can sign in to their portal immediately.
                      </p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setSuccessTeacher(null);
                  }}
                  className="w-full bg-slate-900 dark:bg-emerald-600 hover:opacity-90 text-white font-bold py-2.5 rounded-xl cursor-pointer text-xs"
                >
                  Close & Refresh Faculty List
                </button>
              </div>
            ) : (
              <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
                
                {errorText && (
                  <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl border border-rose-100 dark:border-rose-900/50 flex gap-2.5 leading-relaxed">
                    <ShieldAlert className="h-5 w-5 shrink-0" />
                    <div>
                      <p className="font-extrabold text-[11px] uppercase tracking-wider">Registration Error</p>
                      <p className="mt-0.5 mt-0.5">{errorText}</p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Educator Full Name *</label>
                  <input
                    type="text"
                    required
                    disabled={loading}
                    value={editingTeacher.name || ""}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, name: e.target.value })}
                    placeholder="e.g. Elena Rostova"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-300 disabled:opacity-50"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      disabled={loading}
                      value={editingTeacher.email || ""}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, email: e.target.value })}
                      placeholder="name@smartschool.edu"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-300 disabled:opacity-50"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Phone Coordinate</label>
                    <input
                      type="text"
                      disabled={loading}
                      value={editingTeacher.phone || ""}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, phone: e.target.value })}
                      placeholder="+1 555-0101"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-300 disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Section *</label>
                    <select
                      required
                      disabled={loading}
                      value={editingTeacher.section_name || ""}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, section_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-200 font-bold"
                    >
                      <option value="">Select Section</option>
                      {sectionsList.map(s => <option key={s.id} value={s.section_name}>{s.section_name}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Academic Session *</label>
                    <select
                      required
                      disabled={loading}
                      value={editingTeacher.academic_session || ""}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, academic_session: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-200 font-bold"
                    >
                      <option value="">Select Session</option>
                      {sessionsList.map(s => <option key={s.id} value={s.session_name}>{s.session_name}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Assigned Class *</label>
                  <select
                    required
                    disabled={loading}
                    value={editingTeacher.assigned_class_id || ""}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, assigned_class_id: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-200 font-bold"
                  >
                    <option value="">Select Class</option>
                    {classesList.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Primary Subject Specialty</label>
                    <select
                      disabled={loading}
                      value={editingTeacher.subject || ""}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, subject: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-200 disabled:opacity-50"
                    >
                      <option value="">Select Specialization</option>
                      {subjectList.length > 0 ? (
                        subjectList.map(s => <option key={s.id} value={s.subject_name}>{s.subject_name}</option>)
                      ) : (
                        <>
                          <option value="Mathematics">Mathematics</option>
                          <option value="Physics">Physics</option>
                          <option value="Chemistry">Chemistry</option>
                          <option value="English Literature">English Literature</option>
                          <option value="Computer Science">Computer Science</option>
                          <option value="Biology">Biology</option>
                        </>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">Academic Qualification</label>
                    <input
                      type="text"
                      disabled={loading}
                      value={editingTeacher.qualification || ""}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, qualification: e.target.value })}
                      placeholder="e.g. B.Ed, M.Sc"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-300 disabled:opacity-50"
                    />
                  </div>
                </div>

                {isNewEducator && (
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Set Login Password <span className="text-slate-400 font-normal">(Leave empty to auto-generate)</span>
                    </label>
                    <input
                      type="password"
                      disabled={loading}
                      value={editingTeacher.password || ""}
                      onChange={(e) => setEditingTeacher({ ...editingTeacher, password: e.target.value })}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-300 disabled:opacity-50"
                    />
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="relative">
                    {uploadingImage ? (
                      <div className="h-20 w-20 rounded-2xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center ring-4 ring-emerald-500/10 shadow-xs">
                        <div className="h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : (
                      <>
                        <img
                          src={editingTeacher.photo_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
                          alt="Teacher profile"
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
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400">Educator Avatar Icon</label>
                    
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

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Class Room Assignments (comma separated loads)
                  </label>
                  <input
                    type="text"
                    disabled={loading}
                    value={editingTeacher.classes_assigned ? editingTeacher.classes_assigned.join(", ") : ""}
                    onChange={(e) => handleAssignedClassesChange(e.target.value)}
                    placeholder="e.g. Class 10A, Class 9B, Class 10B"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-300 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                    Class Teacher Of
                  </label>
                  <select
                    disabled={loading}
                    value={editingTeacher.class_teacher_of || "None"}
                    onChange={(e) => setEditingTeacher({ ...editingTeacher, class_teacher_of: e.target.value === "None" || e.target.value === "" ? null : e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden text-slate-750 dark:text-slate-200 disabled:opacity-50 font-bold"
                  >
                    <option value="None">None</option>
                    {classesList.map((cls) => (
                      <option key={cls.id || cls.class_name} value={cls.class_name}>
                        {cls.class_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    disabled={loading}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:opacity-85 disabled:opacity-50 cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || uploadingImage}
                    className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer text-xs"
                  >
                    {(loading || uploadingImage) && (
                      <span className="h-3 w-3 border-2 border-white/35 border-t-white rounded-full animate-spin" />
                    )}
                    {isNewEducator ? "Register Educator" : "Update Educator"}
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      )}

      {/* Directory Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {teachers.map((teacher) => (
          <div 
            key={teacher.id} 
            className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-750 shadow-2xs p-5 relative overflow-hidden group hover:border-emerald-500/20 hover:shadow-xs transition-all duration-300"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-teal-500/5 to-transparent rounded-bl-full pointer-events-none" />
            
            <div className="flex gap-4">
              <img
                src={teacher.photo_url || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150"}
                alt={teacher.name}
                className="h-16 w-16 rounded-2xl object-cover ring-4 ring-slate-50 dark:ring-slate-900 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h3 className="font-extrabold text-slate-800 dark:text-slate-100 tracking-tight truncate max-w-full">
                    {teacher.name}
                  </h3>
                  <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-[9px] font-extrabold px-1.5 py-0.5 rounded-md flex items-center gap-0.5 border border-emerald-100 dark:border-emerald-900/60 font-mono">
                    <BadgeCheck className="h-3 w-3" /> VERIFIED
                  </span>
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-slate-300" />
                  Educator Specialty: <span className="text-slate-800 dark:text-slate-200 font-bold">{teacher.subject}</span>
                </p>
                {teacher.class_teacher_of && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-extrabold flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-amber-500" />
                    Class Teacher of: <span className="underline decoration-wavy decoration-amber-500/40">{teacher.class_teacher_of}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Email / Contact info */}
            <div className="mt-5 pt-4 border-t border-slate-50 dark:border-slate-700/50 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <Mail className="h-4 w-4 text-slate-300 shrink-0" />
                <span className="truncate font-mono">{teacher.email}</span>
              </div>
              
              {teacher.phone && (
                <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <Phone className="h-4 w-4 text-slate-300 shrink-0" />
                  <span className="font-mono">{teacher.phone}</span>
                </div>
              )}
            </div>

            {/* Classroom load tags */}
            <div className="mt-4 pt-3.5 border-t border-slate-50 dark:border-slate-700/50">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-slate-500 block mb-2">Classroom Loads</span>
              <div className="flex flex-wrap gap-1.5">
                {teacher.classes_assigned.map((cls, idx) => (
                  <span key={idx} className="text-[10px] font-mono font-bold bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-750 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-sm">
                    {cls}
                  </span>
                ))}
              </div>
            </div>

            {/* Editing actions */}
            {isAdmin && (
              <div className="flex items-center gap-1 justify-end mt-4 pt-3 border-t border-slate-50 dark:border-slate-700/50 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(teacher)}
                  className="p-1.5 hover:bg-slate-150 dark:hover:bg-slate-700 text-slate-450 hover:text-emerald-500 rounded-lg cursor-pointer transition-colors"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Are you absolutely sure you want to delete ${teacher.name}?`)) {
                      onDeleteTeacher(teacher.id);
                    }
                  }}
                  className="p-1.5 hover:bg-slate-150 dark:hover:bg-slate-700 text-slate-450 hover:text-rose-600 rounded-lg cursor-pointer transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}

          </div>
        ))}
      </div>

    </div>
  );
}
