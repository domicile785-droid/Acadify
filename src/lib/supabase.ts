import { createClient } from "@supabase/supabase-js";
import { 
  Student, Teacher, Parent, Attendance, Homework, Notice, 
  Result, Fee, TimetableEntry, LeaveRequest, GalleryItem, Message, SchoolNotification,
  AcademicSession, SubjectItem, ClassItem, SectionItem, TeacherSpecialization
} from "../types";

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "CRITICAL: Supabase environment variables are missing!\n" +
    "Please make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables."
  );
}

export const supabase = createClient(supabaseUrl || "", supabaseAnonKey || "");

/**
 * Helper to upload image to Supabase Storage.
 * Tries standard upload to the given bucket, and falls back to a high-fidelity inline Base64 
 * representation if there's any configuration or bucket restriction error.
 */
export async function uploadImage(file: File, bucket: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket);
  
  try {
    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    
    const result = await response.json();
    if (response.ok && result.publicUrl) {
      return result.publicUrl;
    } else {
      console.warn(`Supabase Storage upload to bucket "${bucket}" failed:`, result.error || "Unknown error");
      throw new Error(result.error || "Upload failed");
    }
  } catch (err) {
    console.warn("Storage upload exception, falling back to local encoding:", err);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }
}

// Extensive Realistic Mock Data to pre-populate local storage
const DEFAULT_STUDENTS: Student[] = [];

const DEFAULT_TEACHERS: Teacher[] = [];

const DEFAULT_PARENTS: Parent[] = [];

const DEFAULT_ATTENDANCE: Attendance[] = [];

const DEFAULT_HOMEWORK: Homework[] = [];

const DEFAULT_NOTICES: Notice[] = [];

const DEFAULT_RESULTS: Result[] = [];

const DEFAULT_FEES: Fee[] = [];

const DEFAULT_TIMETABLE: TimetableEntry[] = [];

const DEFAULT_LEAVE_REQUESTS: LeaveRequest[] = [];

const DEFAULT_GALLERY: GalleryItem[] = [];

const DEFAULT_MESSAGES: Message[] = [];

const DEFAULT_NOTIFICATIONS: SchoolNotification[] = [];

// Deleted internal ClassItem

const DEFAULT_SESSIONS: AcademicSession[] = [];

const DEFAULT_SUBJECTS: SubjectItem[] = [];

const DEFAULT_CLASSES: ClassItem[] = [];

const DEFAULT_SECTIONS: SectionItem[] = [];

const DEFAULT_SPECIALIZATIONS: TeacherSpecialization[] = [];

// Read helper from localStorage
function getLocalItem<T>(key: string, defaultValue: T): T {
  const data = localStorage.getItem(`smart_school_${key}`);
  if (data) {
    // If local storage has legacy pre-populated mock details, wipe it to keep state 100% database real
    if (
      data.includes("David Miller") || 
      data.includes("Elena Rostova") || 
      data.includes("Thomas Sterling") || 
      data.includes("Summer Rest") || 
      data.includes("Class 10") || 
      data.includes("sess-3")
    ) {
      localStorage.removeItem(`smart_school_${key}`);
      localStorage.setItem(`smart_school_${key}`, JSON.stringify(defaultValue));
      return defaultValue;
    }
  }
  if (!data) {
    localStorage.setItem(`smart_school_${key}`, JSON.stringify(defaultValue));
    return defaultValue;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return defaultValue;
  }
}

// Write helper to localStorage
function setLocalItem<T>(key: string, value: T): void {
  localStorage.setItem(`smart_school_${key}`, JSON.stringify(value));
}

// Global state controller mimicking database operations.
const state = {
  get students() { return getLocalItem<Student[]>("students", DEFAULT_STUDENTS); },
  set students(v) { setLocalItem("students", v); },

  get teachers() { return getLocalItem<Teacher[]>("teachers", DEFAULT_TEACHERS); },
  set teachers(v) { setLocalItem("teachers", v); },

  get parents() { return getLocalItem<Parent[]>("parents", DEFAULT_PARENTS); },
  set parents(v) { setLocalItem("parents", v); },

  get attendance() { return getLocalItem<Attendance[]>("attendance", DEFAULT_ATTENDANCE); },
  set attendance(v) { setLocalItem("attendance", v); },

  get homework() { return getLocalItem<Homework[]>("homework", DEFAULT_HOMEWORK); },
  set homework(v) { setLocalItem("homework", v); },

  get notices() { return getLocalItem<Notice[]>("notices", DEFAULT_NOTICES); },
  set notices(v) { setLocalItem("notices", v); },

  get results() { return getLocalItem<Result[]>("results", DEFAULT_RESULTS); },
  set results(v) { setLocalItem("results", v); },

  get fees() { return getLocalItem<Fee[]>("fees", DEFAULT_FEES); },
  set fees(v) { setLocalItem("fees", v); },

  get timetable() { return getLocalItem<TimetableEntry[]>("timetable", DEFAULT_TIMETABLE); },
  set timetable(v) { setLocalItem("timetable", v); },

  get leave_requests() { return getLocalItem<LeaveRequest[]>("leave_requests", DEFAULT_LEAVE_REQUESTS); },
  set leave_requests(v) { setLocalItem("leave_requests", v); },

  get gallery() { return getLocalItem<GalleryItem[]>("gallery", DEFAULT_GALLERY); },
  set gallery(v) { setLocalItem("gallery", v); },

  get messages() { return getLocalItem<Message[]>("messages", DEFAULT_MESSAGES); },
  set messages(v) { setLocalItem("messages", v); },

  get notifications() { return getLocalItem<SchoolNotification[]>("notifications", DEFAULT_NOTIFICATIONS); },
  set notifications(v) { setLocalItem("notifications", v); },

  get classes() { return getLocalItem<ClassItem[]>("classes", DEFAULT_CLASSES); },
  set classes(v) { setLocalItem("classes", v); },

  get sessions() { return getLocalItem<AcademicSession[]>("sessions", DEFAULT_SESSIONS); },
  set sessions(v) { setLocalItem("sessions", v); },

  get subjects() { return getLocalItem<SubjectItem[]>("subjects", DEFAULT_SUBJECTS); },
  set subjects(v) { setLocalItem("subjects", v); },

  get sections() { return getLocalItem<SectionItem[]>("sections", DEFAULT_SECTIONS); },
  set sections(v) { setLocalItem("sections", v); },

  get specializations() { return getLocalItem<TeacherSpecialization[]>("specializations", DEFAULT_SPECIALIZATIONS); },
  set specializations(v) { setLocalItem("specializations", v); },
};

/**
 * Universal Database client adapter.
 * Try Supabase operations first. If they fail (e.g. table not there, offline setup, rule issue),
 * gracefully fallback to highly detailed localStorage db representation.
 */
export const db = {
  students: {
    async list(): Promise<Student[]> {
      try {
        const { data, error } = await supabase.from("students").select("*");
        if (data && !error) {
          return data.map((s: any) => ({
            ...s,
            class_name: s.class_name || s.class || "Class 10",
            section_name: s.section_name || s.section || "A",
            parent_name: s.parent_name || s.father_name || s.mother_name || "Parent"
          }));
        }
      } catch (e) {}
      return state.students;
    },
    async save(item: Student): Promise<Student> {
      let savedResult = { ...item };
      try {
        const isNew = item.id.startsWith("stud-") || !(await db.students.list()).some(s => s.id === item.id);
        
        if (isNew) {
          const response = await fetch("/api/admin/create-student", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: item.name,
              roll_no: item.roll_no,
              class_name: item.class_name,
              section: item.section_name || "A",
              photo_url: item.photo_url,
              gender: item.gender,
              dob: item.dob,
              blood_group: item.blood_group,
              aadhaar_no: item.aadhaar_no,
              admission_date: item.admission_date,
              admission_number: item.admission_number,
              academic_session: item.academic_session,
              father_name: item.father_name || item.parent_name,
              mother_name: item.mother_name,
              parent_phone: item.parent_phone,
              parent_email: item.parent_email,
              address: item.address,
              emergency_contact: item.emergency_contact,
              student_email: item.student_email,
              student_password: (item as any).student_password,
              parent_password: (item as any).parent_password
            })
          });

          const resData = await response.json();
          if (response.ok && resData.success && resData.student) {
            savedResult = {
              ...item,
              ...resData.student,
              id: resData.student_id || resData.student.id,
              profile_id: resData.profile_id,
              parent_id: resData.parent_id
            };
          } else {
            throw new Error(resData.error || "Onboarding failed on the remote server.");
          }
        } else {
          // Update preexisting student row
          try {
            if (item.profile_id) {
              await supabase
                .from("profiles")
                .update({
                  full_name: item.name,
                  phone: item.parent_phone
                })
                .eq("id", item.profile_id);
            }
            
            await supabase
              .from("students")
              .update({
                name: item.name,
                roll_no: item.roll_no,
                roll_number: item.roll_no,
                class: item.class_name,
                section_name: item.section_name || "A",
                parent_name: item.parent_name,
                parent_email: item.parent_email,
                parent_phone: item.parent_phone,
                photo_url: item.photo_url,
                dob: item.dob || null,
                gender: item.gender || null,
                father_name: item.father_name || null,
                mother_name: item.mother_name || null,
                address: item.address || null,
                emergency_contact: item.emergency_contact || null,
                status: item.status
              })
              .eq("id", item.id);
          } catch (syncErr) {
            console.warn("Could not sync updated student details to backend:", syncErr);
          }
        }
      } catch (e: any) {
        console.error("Save student registry failure:", e);
        throw e;
      }

      // Sync offline database state
      const arr = state.students;
      const idx = arr.findIndex(x => x.id === savedResult.id || x.roll_no === savedResult.roll_no && x.class_name === savedResult.class_name);
      if (idx > -1) arr[idx] = savedResult;
      else arr.push(savedResult);
      state.students = arr;
      return savedResult;
    },
    async delete(id: string): Promise<boolean> {
      try {
        await supabase.from("students").delete().eq("id", id);
      } catch (e) {}
      const arr = state.students;
      state.students = arr.filter(x => x.id !== id);
      return true;
    }
  },

  teachers: {
    async list(): Promise<Teacher[]> {
      let classesList: ClassItem[] = [];
      let classesLoaded = false;
      try {
        const { data: clsData, error: clsError } = await supabase.from("classes").select("*");
        if (clsData && !clsError) {
          classesList = clsData;
          classesLoaded = true;
        }
      } catch (e) {}
      if (!classesLoaded) {
        classesList = getLocalItem<ClassItem[]>("classes", DEFAULT_CLASSES);
      }

      try {
        const { data, error } = await supabase
          .from("teachers")
          .select(`
            id,
            subject_name,
            qualification,
            joining_date,
            profile_id,
            assigned_class_id,
            section_name,
            academic_session,
            profiles (
              id,
              full_name,
              email,
              phone
            )
          `);
        
        if (data && !error) {
          return data.map((t: any) => {
            const profile = t.profiles || {};
            return {
              id: t.id,
              profile_id: t.profile_id,
              name: profile.full_name || "Faculty Member",
              email: profile.email || "",
              phone: profile.phone || "",
              subject: t.subject_name || "Mathematics",
              qualification: t.qualification || "",
              joining_date: t.joining_date || "",
              classes_assigned: t.assigned_class_id ? [t.assigned_class_id] : [],
              assigned_class_id: t.assigned_class_id,
              section_name: t.section_name,
              academic_session: t.academic_session,
              photo_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150"
            };
          });
        }
      } catch (e) {
        console.error("Joined select failed, falling back to simple teachers select", e);
      }
      try {
        const { data, error } = await supabase.from("teachers").select("*");
        if (data && !error) {
          return data.map((t: any) => {
            const assignedClass = classesList.find(c => c.class_teacher_id === t.id);
            return {
              id: t.id,
              name: t.name || t.full_name || "Faculty Member",
              email: t.email || "",
              phone: t.phone || "",
              subject: t.subject_name || t.subject || "Mathematics",
              classes_assigned: t.classes_assigned || ["Class 10A"],
              photo_url: t.photo_url || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150",
              qualification: t.qualification || "",
              joining_date: t.joining_date || "",
              class_teacher_of: assignedClass ? assignedClass.class_name : null
            };
          });
        }
      } catch (e) {}

      const localTeachers = state.teachers;
      return localTeachers.map(t => {
        const assignedClass = classesList.find(c => c.class_teacher_id === t.id);
        return {
          ...t,
          class_teacher_of: assignedClass ? assignedClass.class_name : (t.class_teacher_of || null)
        };
      });
    },
    async save(item: Teacher): Promise<Teacher> {
      let savedResult = { ...item };
      try {
        const isNew = item.id.startsWith("teach-") || !(await db.teachers.list()).some(t => t.id === item.id);
        
        if (isNew) {
          try {
            const response = await fetch("/api/admin/create-teacher", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: item.name,
                email: item.email,
                phone: item.phone,
                subject: item.subject,
                password: item.password,
                qualification: item.qualification,
                joining_date: item.joining_date,
                assigned_class_id: item.assigned_class_id,
                section_name: item.section_name,
                academic_session: item.academic_session,
                class_teacher_of: item.class_teacher_of
              })
            });

            const resData = await response.json();
            if (response.ok && resData.success && resData.user) {
              const verifiedItem = { 
                ...item, 
                id: resData.user.id,
                profile_id: resData.profile_id,
                joining_date: resData.joining_date || item.joining_date,
                password: resData.password 
              };
              savedResult = verifiedItem;
            } else {
              if (resData.error && resData.error.includes("already has")) {
                throw new Error(resData.error);
              }
              console.warn("Backend failed to register new teacher, saving to offline backup:", resData.error || "Unknown error");
            }
          } catch (fetchErr: any) {
            if (fetchErr.message && fetchErr.message.includes("already has")) {
              throw fetchErr;
            }
            console.warn("Could not enroll educator on backend server (network failure). Saving to local school registry:", fetchErr);
          }
        } else {
          // It's an update!
          try {
            if (item.profile_id) {
              // Update profiles and teachers
              await supabase
                .from("profiles")
                .update({
                  full_name: item.name,
                  email: item.email,
                  phone: item.phone
                })
                .eq("id", item.profile_id);
                
              await supabase
                .from("teachers")
                .update({
                  subject_name: item.subject,
                  qualification: item.qualification,
                  assigned_class_id: item.assigned_class_id,
                  section_name: item.section_name,
                  academic_session: item.academic_session
                })
                .eq("id", item.id);
            } else {
              // Simple table row update fallback
              await supabase.from("teachers").update({
                name: item.name,
                email: item.email,
                phone: item.phone,
                subject_name: item.subject,
                photo_url: item.photo_url,
                assigned_class_id: item.assigned_class_id,
                section_name: item.section_name,
                academic_session: item.academic_session
              }).eq("id", item.id);
            }

            // Update real Supabase classes table
            try {
              // 1. Unassign teacher from any existing class
              await supabase
                .from("classes")
                .update({ class_teacher_id: null })
                .eq("class_teacher_id", item.id);

              // 2. Assign to new class if selected
              if (item.assigned_class_id && item.assigned_class_id !== "None" && item.assigned_class_id !== "") {
                await supabase
                  .from("classes")
                  .update({ class_teacher_id: item.id })
                  .eq("id", item.assigned_class_id);
              }
            } catch (clsErr) {
              console.warn("Could not sync class_teacher_id on Supabase classes:", clsErr);
            }
          } catch (updateErr) {
            console.warn("Could not sync teacher profile changes to remote Supabase server, saving locally:", updateErr);
          }
        }
      } catch (e: any) {
        console.error("Save teacher transaction failure:", e);
        throw e;
      }

      // Local state fallback update
      const arr = state.teachers;
      const idx = arr.findIndex(x => x.id === savedResult.id || x.email === savedResult.email);
      if (idx > -1) arr[idx] = savedResult;
      else arr.push(savedResult);
      state.teachers = arr;

      // Local backup class association sync
      const localClsList = getLocalItem<ClassItem[]>("classes", DEFAULT_CLASSES);
      localClsList.forEach(c => {
        if (c.class_teacher_id === savedResult.id) {
          c.class_teacher_id = null;
        }
      });
      if (savedResult.class_teacher_of && savedResult.class_teacher_of !== "None" && savedResult.class_teacher_of !== "") {
        const found = localClsList.find(c => c.id === savedResult.class_teacher_of || c.class_name === savedResult.class_teacher_of);
        if (found) {
          found.class_teacher_id = savedResult.id;
        }
      }
      setLocalItem("classes", localClsList);

      return savedResult;
    },
    async delete(id: string): Promise<boolean> {
      try {
        await supabase.from("teachers").delete().eq("id", id);
        await supabase.from("classes").update({ class_teacher_id: null }).eq("class_teacher_id", id);
      } catch (e) {}
      const arr = state.teachers;
      state.teachers = arr.filter(x => x.id !== id);

      const localClsList = getLocalItem<ClassItem[]>("classes", DEFAULT_CLASSES);
      localClsList.forEach(c => {
        if (c.class_teacher_id === id) c.class_teacher_id = null;
      });
      setLocalItem("classes", localClsList);
      return true;
    }
  },

  parents: {
    async list(): Promise<Parent[]> {
      try {
        const { data, error } = await supabase.from("parents").select("*");
        if (data && !error) return data;
      } catch (e) {}
      return state.parents;
    }
  },

  attendance: {
    async list(): Promise<Attendance[]> {
      try {
        const { data, error } = await supabase.from("attendance").select("*");
        if (data && !error) return data;
      } catch (e) {}
      return state.attendance;
    },
    async saveAll(items: Attendance[]): Promise<boolean> {
      try {
        for (const item of items) {
          // 1. Check if attendance already exists for this student and date
          const { data: existing } = await supabase
            .from('attendance')
            .select('id')
            .eq('student_id', item.student_id)
            .eq('attendance_date', item.attendance_date)
            .maybeSingle();

          if (existing) {
            // 2. Update
            await supabase
              .from('attendance')
              .update({ status: item.status, marked_by: item.marked_by })
              .eq('id', existing.id);
          } else {
            // 3. Insert
            await supabase
              .from('attendance')
              .insert(item);
          }
        }
      } catch (e) {
        console.error("Attendance upsert failed:", e);
        throw e;
      }

      // Offline state update
      const arr = state.attendance;
      items.forEach(newItem => {
        const idx = arr.findIndex(x => x.id === newItem.id || (x.student_id === newItem.student_id && x.attendance_date === newItem.attendance_date));
        if (idx > -1) arr[idx] = { ...arr[idx], ...newItem };
        else arr.push(newItem);
      });
      state.attendance = arr;
      return true;
    }
  },

  homework: {
    async list(): Promise<Homework[]> {
      try {
        const { data, error } = await supabase.from("homework").select("*");
        if (data && !error) {
          return data.map((h: any) => ({
            ...h,
            class_name: h.class_name || h.class || "Class 10"
          }));
        }
      } catch (e) {}
      return state.homework;
    },
    async save(item: Homework): Promise<Homework> {
      try {
        const { data, error } = await supabase.from("homework").upsert(item).select().single();
        if (data && !error) return data;
      } catch (e) {}
      const arr = state.homework;
      const idx = arr.findIndex(x => x.id === item.id);
      if (idx > -1) arr[idx] = item;
      else arr.push(item);
      state.homework = arr;
      return item;
    },
    async delete(id: string): Promise<boolean> {
      try {
        await supabase.from("homework").delete().eq("id", id);
      } catch (e) {}
      const arr = state.homework;
      state.homework = arr.filter(x => x.id !== id);
      return true;
    }
  },

  notices: {
    async list(): Promise<Notice[]> {
      try {
        const { data, error } = await supabase.from("notices").select("*");
        if (data && !error) return data;
      } catch (e) {}
      return state.notices;
    },
    async save(item: Notice): Promise<Notice> {
      try {
        const { data, error } = await supabase.from("notices").upsert(item).select().single();
        if (data && !error) return data;
      } catch (e) {}
      const arr = state.notices;
      const idx = arr.findIndex(x => x.id === item.id);
      if (idx > -1) arr[idx] = item;
      else arr.push(item);
      state.notices = arr;
      return item;
    },
    async delete(id: string): Promise<boolean> {
      try {
        await supabase.from("notices").delete().eq("id", id);
      } catch (e) {}
      const arr = state.notices;
      state.notices = arr.filter(x => x.id !== id);
      return true;
    }
  },

  results: {
    async list(): Promise<Result[]> {
      try {
        const { data, error } = await supabase.from("results").select("*");
        if (data && !error) return data;
      } catch (e) {}
      return state.results;
    },
    async save(item: Result): Promise<Result> {
      try {
        const { data, error } = await supabase.from("results").upsert(item).select().single();
        if (data && !error) return data;
      } catch (e) {}
      const arr = state.results;
      const idx = arr.findIndex(x => x.id === item.id);
      if (idx > -1) arr[idx] = item;
      else arr.push(item);
      state.results = arr;
      return item;
    },
    async delete(id: string): Promise<boolean> {
      try {
        await supabase.from("results").delete().eq("id", id);
      } catch (e) {}
      const arr = state.results;
      state.results = arr.filter(x => x.id !== id);
      return true;
    }
  },

  fees: {
    async list(): Promise<Fee[]> {
      try {
        const { data, error } = await supabase.from("fees").select("*");
        if (data && !error) return data;
      } catch (e) {}
      return state.fees;
    },
    async save(item: Fee): Promise<Fee> {
      try {
        const { data, error } = await supabase.from("fees").upsert(item).select().single();
        if (data && !error) return data;
      } catch (e) {}
      const arr = state.fees;
      const idx = arr.findIndex(x => x.id === item.id);
      if (idx > -1) arr[idx] = item;
      else arr.push(item);
      state.fees = arr;
      return item;
    }
  },

  timetable: {
    async list(): Promise<TimetableEntry[]> {
      try {
        const { data, error } = await supabase.from("timetable").select("*");
        if (data && !error) return data;
      } catch (e) {}
      return state.timetable;
    }
  },

  leave_requests: {
    async list(): Promise<LeaveRequest[]> {
      try {
        const { data, error } = await supabase.from("leave_requests").select("*");
        if (data && !error) return data;
      } catch (e) {}
      return state.leave_requests;
    },
    async save(item: LeaveRequest): Promise<LeaveRequest> {
      try {
        const { data, error } = await supabase.from("leave_requests").upsert(item).select().single();
        if (data && !error) return data;
      } catch (e) {}
      const arr = state.leave_requests;
      const idx = arr.findIndex(x => x.id === item.id);
      if (idx > -1) arr[idx] = item;
      else arr.push(item);
      state.leave_requests = arr;
      return item;
    }
  },

  gallery: {
    async list(): Promise<GalleryItem[]> {
      try {
        const { data, error } = await supabase.from("gallery").select("*");
        if (data && !error) return data;
      } catch (e) {}
      return state.gallery;
    },
    async add(item: GalleryItem): Promise<GalleryItem> {
      try {
        const { data, error } = await supabase.from("gallery").insert(item).select().single();
        if (data && !error) return data;
      } catch (e) {}
      const arr = state.gallery;
      arr.unshift(item);
      state.gallery = arr;
      return item;
    }
  },

  messages: {
    async list(): Promise<Message[]> {
      try {
        const { data, error } = await supabase.from("messages").select("*");
        if (data && !error) return data;
      } catch (e) {}
      return state.messages;
    },
    async send(item: Message): Promise<Message> {
      try {
        const { data, error } = await supabase.from("messages").insert(item).select().single();
        if (data && !error) return data;
      } catch (e) {}
      const arr = state.messages;
      arr.push(item);
      state.messages = arr;
      return item;
    }
  },

  notifications: {
    async list(): Promise<SchoolNotification[]> {
      try {
        const { data, error } = await supabase.from("notifications").select("*");
        if (data && !error) return data;
      } catch (e) {}
      return state.notifications;
    },
    async markAsRead(id: string): Promise<boolean> {
      try {
        await supabase.from("notifications").update({ read: true }).eq("id", id);
      } catch (e) {}
      const arr = state.notifications;
      const idx = arr.findIndex(x => x.id === id);
      if (idx > -1) {
        arr[idx].read = true;
        state.notifications = arr;
      }
      return true;
    },
    async create(notif: SchoolNotification): Promise<SchoolNotification> {
      try {
        const { data, error } = await supabase.from("notifications").insert(notif).select().single();
        if (data && !error) return data;
      } catch (e) {}
      const arr = state.notifications;
      arr.unshift(notif);
      state.notifications = arr;
      return notif;
    }
  },

  classes: {
    async list(): Promise<ClassItem[]> {
      try {
        const { data, error } = await supabase.from("classes").select("*");
        if (data && !error) return data;
      } catch (e) {}
      return state.classes;
    },
    async save(item: ClassItem): Promise<ClassItem> {
      try {
        const { data, error } = await supabase.from("classes").upsert(item).select().single();
        if (data && !error) return data;
      } catch (e) {}
      const arr = state.classes;
      const idx = arr.findIndex(x => x.id === item.id);
      if (idx > -1) arr[idx] = item;
      else arr.push(item);
      state.classes = arr;
      return item;
    },
    async delete(id: string): Promise<boolean> {
      try {
        await supabase.from("classes").delete().eq("id", id);
      } catch (e) {}
      state.classes = state.classes.filter(x => x.id !== id);
      return true;
    }
  },

  sections: {
    async list(): Promise<SectionItem[]> {
      try {
        const { data, error } = await supabase.from("sections").select("*");
        if (data && !error) return data;
      } catch (e) {}
      return state.sections;
    },
    async save(item: SectionItem): Promise<SectionItem> {
      try {
        const { data, error } = await supabase.from("sections").upsert(item).select().single();
        if (data && !error) return data;
      } catch (e) {}
      const arr = state.sections;
      const idx = arr.findIndex(x => x.id === item.id);
      if (idx > -1) arr[idx] = item;
      else arr.push(item);
      state.sections = arr;
      return item;
    },
    async delete(id: string): Promise<boolean> {
      try {
        await supabase.from("sections").delete().eq("id", id);
      } catch (e) {}
      state.sections = state.sections.filter(x => x.id !== id);
      return true;
    }
  },

  academic_sessions: {
    async list(): Promise<AcademicSession[]> {
      try {
        const { data, error } = await supabase.from("academic_sessions").select("*");
        if (data && !error) return data;
      } catch (e) {}
      return state.sessions;
    },
    async save(item: AcademicSession): Promise<AcademicSession> {
      try {
        const { data, error } = await supabase.from("academic_sessions").upsert(item).select().single();
        if (data && !error) return data;
      } catch (e) {}
      const arr = state.sessions;
      const idx = arr.findIndex(x => x.id === item.id);
      if (idx > -1) arr[idx] = item;
      else arr.push(item);
      state.sessions = arr;
      return item;
    },
    async delete(id: string): Promise<boolean> {
      try {
        await supabase.from("academic_sessions").delete().eq("id", id);
      } catch (e) {}
      state.sessions = state.sessions.filter(x => x.id !== id);
      return true;
    }
  },

  subjects: {
    async list(): Promise<SubjectItem[]> {
      try {
        const { data, error } = await supabase.from("subjects").select("*");
        if (data && !error) return data;
      } catch (e) {}
      return state.subjects;
    },
    async save(item: SubjectItem): Promise<SubjectItem> {
      try {
        const { data, error } = await supabase.from("subjects").upsert(item).select().single();
        if (data && !error) return data;
      } catch (e) {}
      const arr = state.subjects;
      const idx = arr.findIndex(x => x.id === item.id);
      if (idx > -1) arr[idx] = item;
      else arr.push(item);
      state.subjects = arr;
      return item;
    },
    async delete(id: string): Promise<boolean> {
      try {
        await supabase.from("subjects").delete().eq("id", id);
      } catch (e) {}
      state.subjects = state.subjects.filter(x => x.id !== id);
      return true;
    }
  },

  teacher_specializations: {
    async list(): Promise<TeacherSpecialization[]> {
      try {
        const { data, error } = await supabase.from("teacher_specializations").select("*");
        if (data && !error) return data;
      } catch (e) {}
      return state.specializations;
    },
    async save(item: TeacherSpecialization): Promise<TeacherSpecialization> {
      try {
        const { data, error } = await supabase.from("teacher_specializations").upsert(item).select().single();
        if (data && !error) return data;
      } catch (e) {}
      const arr = state.specializations;
      const idx = arr.findIndex(x => x.id === item.id);
      if (idx > -1) arr[idx] = item;
      else arr.push(item);
      state.specializations = arr;
      return item;
    },
    async delete(id: string): Promise<boolean> {
      try {
        await supabase.from("teacher_specializations").delete().eq("id", id);
      } catch (e) {}
      state.specializations = state.specializations.filter(x => x.id !== id);
      return true;
    }
  }
};
