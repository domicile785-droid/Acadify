import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Check, X, Shield, BookOpen, Layers, LibrarySquare, CalendarRange } from "lucide-react";
import { db } from "../lib/supabase";
import { 
  AcademicSession, SubjectItem, ClassItem, SectionItem, TeacherSpecialization, Teacher
} from "../types";

export default function AdminSettings() {
  const [activeTab, setActiveTab] = useState<"sessions" | "subjects" | "classes" | "sections" | "specializations">("sessions");
  
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [sections, setSections] = useState<SectionItem[]>([]);
  const [specializations, setSpecializations] = useState<TeacherSpecialization[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<any>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sess, subj, cls, sects, specs, tchs] = await Promise.all([
        db.academic_sessions.list(),
        db.subjects.list(),
        db.classes.list(),
        db.sections.list(),
        db.teacher_specializations.list(),
        db.teachers.list()
      ]);
      setSessions(sess);
      setSubjects(subj);
      setClasses(cls);
      setSections(sects);
      setSpecializations(specs);
      setTeachers(tchs);
    } catch(e) {
      console.error("Failed to load settings data:", e);
    } finally {
      setLoading(false);
    }
  };

  const saveItem = async (type: string, item: any) => {
    setLoading(true);
    console.log(`DEBUG: Saving ${type}:`, item);
    try {
      if (type === "sessions") {
        // Validate if there's another active session if setting this one to active
        if (item.is_active) {
            const others = sessions.filter(s => s.id !== item.id && s.is_active);
            for (const other of others) {
              await db.academic_sessions.save({ ...other, is_active: false });
            }
        }
        
        const saved = await db.academic_sessions.save(item);
        console.log("DEBUG: Save session response:", saved);
        setSessions(prev => prev.some(s => s.id === saved.id) ? prev.map(s => s.id === saved.id ? saved : s) : [...prev, saved]);
        alert("Session saved successfully");
      }
      if (type === "subjects") {
        const saved = await db.subjects.save(item);
        console.log("DEBUG: Save subject response:", saved);
        setSubjects(prev => prev.some(s => s.id === saved.id) ? prev.map(s => s.id === saved.id ? saved : s) : [...prev, saved]);
        alert("Subject saved successfully");
      }
      if (type === "classes") {
        // Ensure class_name is not empty
        if (!item.class_name) throw new Error("Class name is required.");
        
        const saved = await db.classes.save(item);
        console.log("DEBUG: Save class response:", saved);
        setClasses(prev => prev.some(s => s.id === saved.id) ? prev.map(s => s.id === saved.id ? saved : s) : [...prev, saved]);
        alert("Class saved successfully");
      }
      if (type === "sections") {
        const saved = await db.sections.save(item);
        console.log("DEBUG: Save section response:", saved);
        setSections(prev => prev.some(s => s.id === saved.id) ? prev.map(s => s.id === saved.id ? saved : s) : [...prev, saved]);
        alert("Section saved successfully");
      }
      if (type === "specializations") {
        const saved = await db.teacher_specializations.save(item);
        console.log("DEBUG: Save specialization response:", saved);
        setSpecializations(prev => prev.some(s => s.id === saved.id) ? prev.map(s => s.id === saved.id ? saved : s) : [...prev, saved]);
        alert("Specialization saved successfully");
      }
      setEditItem(null);
    } catch(e: any) {
      console.error(`DEBUG: Failed to save ${type}:`, e);
      alert(e.message || "Error saving item. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (type: string, id: string) => {
    if (!window.confirm("Are you sure you want to delete this item?")) return;
    setLoading(true);
    console.log(`DEBUG: Deleting ${type}:`, id);
    try {
      if (type === "sessions") {
        await db.academic_sessions.delete(id);
        setSessions(prev => prev.filter(x => x.id !== id));
      }
      if (type === "subjects") {
        await db.subjects.delete(id);
        setSubjects(prev => prev.filter(x => x.id !== id));
      }
      if (type === "classes") {
        await db.classes.delete(id);
        setClasses(prev => prev.filter(x => x.id !== id));
      }
      if (type === "sections") {
        await db.sections.delete(id);
        setSections(prev => prev.filter(x => x.id !== id));
      }
      if (type === "specializations") {
        await db.teacher_specializations.delete(id);
        setSpecializations(prev => prev.filter(x => x.id !== id));
      }
      alert("Item deleted successfully");
    } catch(e: any) {
      console.error(`DEBUG: Failed to delete ${type}:`, e);
      alert(e.message || "Error deleting item. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  const navItems = [
    { id: "sessions", label: "Sessions", icon: CalendarRange },
    { id: "subjects", label: "Subjects", icon: BookOpen },
    { id: "classes", label: "Classes", icon: LibrarySquare },
    { id: "sections", label: "Sections", icon: Layers },
    { id: "specializations", label: "Specializations", icon: Shield }
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col sm:flex-row h-full min-h-[500px]">
      
      {/* Sidebar Navigation */}
      <div className="w-full sm:w-64 bg-slate-50 dark:bg-slate-950/40 border-b sm:border-b-0 sm:border-r border-slate-200 dark:border-slate-800 p-4 shrink-0 overflow-y-auto">
        <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider mb-4 px-2">Settings Menu</h3>
        <nav className="space-y-1 block">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id as any);
                setEditItem(null);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all focus:outline-none ${
                activeTab === item.id 
                  ? "bg-indigo-500 text-white font-medium shadow-md shadow-indigo-500/20" 
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              <item.icon className={`h-4 w-4 ${activeTab === item.id ? "text-white" : "text-slate-400"}`} />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-white dark:bg-slate-900 relative">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <span className="h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                {navItems.find(x => x.id === activeTab)?.label} Management
              </h2>
              <button
                onClick={() => setEditItem({ id: `${activeTab}-${Date.now()}` })}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-slate-800 dark:hover:bg-emerald-500 transition-colors"
              >
                <Plus className="h-4 w-4" /> Add New
              </button>
            </div>

            {/* List & Editor */}
            {activeTab === "sessions" && (
              <div className="space-y-4">
                {editItem && (
                  <form onSubmit={(e) => { e.preventDefault(); saveItem("sessions", editItem); }} className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Session Name</label>
                      <input 
                        required
                        type="text" 
                        value={editItem.session_name || ""} 
                        onChange={e => setEditItem({...editItem, session_name: e.target.value})} 
                        className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none dark:bg-slate-900 dark:border-slate-700 bg-white" placeholder="e.g. 2024-25" />
                    </div>
                    <div className="flex items-center h-[38px] px-2 gap-2">
                      <input 
                        type="checkbox" 
                        id="is_active_sess"
                        checked={editItem.is_active || false}
                        onChange={e => setEditItem({...editItem, is_active: e.target.checked})}
                        className="rounded dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <label htmlFor="is_active_sess" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">Active Session</label>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2"><Check className="h-4 w-4"/> Save</button>
                      <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold"><X className="h-4 w-4"/></button>
                    </div>
                  </form>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {sessions.map(s => (
                    <div key={s.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between shadow-xs">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-slate-200">{s.session_name}</div>
                        {s.is_active && <div className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full inline-block mt-1">Active</div>}
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditItem(s)} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"><Edit2 className="h-4 w-4" /></button>
                        <button onClick={() => deleteItem("sessions", s.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/30 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && <div className="text-sm text-slate-500">No sessions configured.</div>}
                </div>
              </div>
            )}

            {activeTab === "subjects" && (
              <div className="space-y-4">
                {editItem && (
                  <form onSubmit={(e) => { e.preventDefault(); saveItem("subjects", editItem); }} className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Subject Name</label>
                      <input 
                        required type="text" value={editItem.subject_name || ""} 
                        onChange={e => setEditItem({...editItem, subject_name: e.target.value})} 
                        className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none dark:bg-slate-900 dark:border-slate-700 bg-white" placeholder="e.g. Mathematics" />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2"><Check className="h-4 w-4"/> Save</button>
                      <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold"><X className="h-4 w-4"/></button>
                    </div>
                  </form>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {subjects.map(s => (
                    <div key={s.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between shadow-xs">
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{s.subject_name}</div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditItem(s)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deleteItem("subjects", s.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                  {subjects.length === 0 && <div className="text-sm text-slate-500">No subjects configured.</div>}
                </div>
              </div>
            )}

            {activeTab === "classes" && (
              <div className="space-y-4">
                {editItem && (
                  <form onSubmit={(e) => { e.preventDefault(); saveItem("classes", editItem); }} className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Class Name</label>
                      <input 
                        required type="text" value={editItem.class_name || ""} 
                        onChange={e => setEditItem({...editItem, class_name: e.target.value})} 
                        className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none dark:bg-slate-900 dark:border-slate-700 bg-white" placeholder="e.g. 10th" />
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Session</label>
                      <select 
                        required value={editItem.session_id || ""} 
                        onChange={e => setEditItem({...editItem, session_id: e.target.value})}
                        className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none dark:bg-slate-900 dark:border-slate-700 bg-white"
                      >
                        <option value="">Select Session</option>
                        {sessions.map(s => <option key={s.id} value={s.id}>{s.session_name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[180px]">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Class Teacher (Optional)</label>
                      <select 
                        value={editItem.class_teacher_id || ""} 
                        onChange={e => setEditItem({...editItem, class_teacher_id: e.target.value || null})}
                        className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none dark:bg-slate-900 dark:border-slate-700 bg-white text-slate-700 dark:text-slate-300"
                      >
                        <option value="">None</option>
                        {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2"><Check className="h-4 w-4"/> Save</button>
                      <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold"><X className="h-4 w-4"/></button>
                    </div>
                  </form>
                )}
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {classes.map(c => {
                    const session = sessions.find(s => s.id === c.session_id);
                    const teacher = teachers.find(t => t.id === c.class_teacher_id);
                    return (
                      <div key={c.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between shadow-xs">
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 text-lg">{c.class_name}</div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                            <span><span className="font-medium">Session:</span> {session?.session_name || "Unknown"}</span>
                            <span>&bull;</span>
                            <span><span className="font-medium">Teacher:</span> {teacher?.name || "None"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditItem(c)} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => deleteItem("classes", c.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/30 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    )
                  })}
                  {classes.length === 0 && <div className="text-sm text-slate-500">No classes configured.</div>}
                </div>
              </div>
            )}

            {activeTab === "sections" && (
              <div className="space-y-4">
                {editItem && (
                  <form onSubmit={(e) => { e.preventDefault(); saveItem("sections", editItem); }} className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Class</label>
                      <select 
                        required value={editItem.class_id || ""} 
                        onChange={e => setEditItem({...editItem, class_id: e.target.value})}
                        className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none dark:bg-slate-900 dark:border-slate-700 bg-white"
                      >
                        <option value="">Select Class</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.class_name}</option>)}
                      </select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Section Name</label>
                      <input 
                        required type="text" value={editItem.section_name || ""} 
                        onChange={e => setEditItem({...editItem, section_name: e.target.value})} 
                        className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none dark:bg-slate-900 dark:border-slate-700 bg-white" placeholder="e.g. A" />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2"><Check className="h-4 w-4"/> Save</button>
                      <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold"><X className="h-4 w-4"/></button>
                    </div>
                  </form>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {sections.map(s => {
                    const cls = classes.find(c => c.id === s.class_id);
                    return (
                      <div key={s.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between shadow-xs">
                        <div>
                          <div className="font-bold text-lg text-slate-800 dark:text-slate-200">Sec {s.section_name}</div>
                          <div className="text-xs text-slate-500 mt-0.5">{cls ? `Class: ${cls.class_name}` : "Unknown Class"}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditItem(s)} className="p-2 text-slate-400 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"><Edit2 className="h-4 w-4" /></button>
                          <button onClick={() => deleteItem("sections", s.id)} className="p-2 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/30 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </div>
                    )
                  })}
                  {sections.length === 0 && <div className="text-sm text-slate-500">No sections configured.</div>}
                </div>
              </div>
            )}

            {activeTab === "specializations" && (
              <div className="space-y-4">
                {editItem && (
                  <form onSubmit={(e) => { e.preventDefault(); saveItem("specializations", editItem); }} className="p-4 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Specialization Name</label>
                      <input 
                        required type="text" value={editItem.specialization_name || ""} 
                        onChange={e => setEditItem({...editItem, specialization_name: e.target.value})} 
                        className="w-full px-3 py-2 rounded-xl text-sm border focus:outline-none dark:bg-slate-900 dark:border-slate-700 bg-white" placeholder="e.g. Science" />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold flex items-center gap-2"><Check className="h-4 w-4"/> Save</button>
                      <button type="button" onClick={() => setEditItem(null)} className="px-4 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-bold"><X className="h-4 w-4"/></button>
                    </div>
                  </form>
                )}
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {specializations.map(s => (
                    <div key={s.id} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 flex items-center justify-between shadow-xs">
                      <div className="font-bold text-sm text-slate-800 dark:text-slate-200">{s.specialization_name}</div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditItem(s)} className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"><Edit2 className="h-3.5 w-3.5" /></button>
                        <button onClick={() => deleteItem("specializations", s.id)} className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </div>
                  ))}
                  {specializations.length === 0 && <div className="text-sm text-slate-500">No specializations configured.</div>}
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
