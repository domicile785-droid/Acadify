/**
 * Type declarations for Smart School App
 */

export type UserRole = "admin" | "teacher" | "student" | "parent";

export interface Student {
  id: string;
  roll_no: string;
  name: string;
  class_id?: string; // New field
  class_name: string; // e.g., "Class 10"
  section_name: string;    // e.g., "A"
  parent_name: string;
  parent_email: string;
  parent_phone: string;
  photo_url: string;
  status: "Active" | "Inactive";
  // Extensible details for premium system
  gender?: string;
  dob?: string;
  blood_group?: string;
  aadhaar_no?: string;
  admission_date?: string;
  admission_number?: string;
  academic_session?: string;
  father_name?: string;
  mother_name?: string;
  address?: string;
  emergency_contact?: string;
  student_email?: string;
  profile_id?: string;
  parent_id?: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  classes_assigned: string[]; // e.g. ["Class 10A", "Class 9B"]
  assigned_class_id?: string; // New foreign key
  photo_url: string;
  profile_id?: string;
  qualification?: string;
  password?: string;
  joining_date?: string;
  class_teacher_of?: string | null;
  section_name?: string;
  academic_session?: string;
}

export interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  students_associated: string[]; // List of student IDs
}

export interface Attendance {
  id: string;
  student_id: string;
  student_name?: string;
  roll_no?: string;
  attendance_date: string; // YYYY-MM-DD
  status: "Present" | "Absent" | "Late";
  marked_by: string; // Teacher/Admin name
  teacher_id: string;
  class_id: string;
  section_name: string;
  academic_session: string;
}

export interface Homework {
  id: string;
  subject: string;
  title: string;
  description: string;
  deadline: string; // YYYY-MM-DD
  class_name: string;
  section: string;
  teacher_name: string;
  file_url?: string;
  created_at: string;
}

export interface Notice {
  id: string;
  title: string;
  content: string;
  type: "general" | "holiday" | "exam" | "emergency";
  date: string; // YYYY-MM-DD
  created_by: string;
}

export interface Result {
  id: string;
  student_id: string;
  student_name?: string;
  subject: string;
  marks: number;
  max_marks: number;
  exam_name: string;
  comments: string;
  date: string;
}

export interface Fee {
  id: string;
  student_id: string;
  student_name?: string;
  class_name?: string;
  amount: number;
  status: "Paid" | "Unpaid" | "Overdue";
  due_date: string; // YYYY-MM-DD
  billing_cycle: string; // e.g., "May 2026", "Annual"
  receipt_no?: string;
}

export interface TimetableEntry {
  id: string;
  class_name: string;
  section: string;
  day_of_week: "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  start_time: string; // e.g., "09:00 AM"
  end_time: string;   // e.g., "09:45 AM"
  subject: string;
  teacher_name: string;
}

export interface LeaveRequest {
  id: string;
  requester_id: string; // student or teacher ID
  requester_name: string;
  requester_role: "student" | "teacher" | "parent";
  type: "Sick" | "Casual" | "Maternity/Paternity" | "Other";
  reason: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  status: "Pending" | "Approved" | "Rejected";
  approved_by?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  url: string;
  type: "image" | "video";
  caption?: string;
  date: string;
}

export interface Message {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: UserRole;
  receiver_id: string;
  receiver_name: string;
  receiver_role: UserRole;
  content: string;
  timestamp: string; // ISO string
}

export interface SchoolNotification {
  id: string;
  title: string;
  content: string;
  type: "homework" | "fee" | "attendance" | "exam" | "general";
  target_role: "all" | UserRole;
  date: string; // ISO string or YYYY-MM-DD
  read?: boolean;
}

export interface AcademicSession {
  id: string;
  session_name: string;
  is_active: boolean;
  created_at?: string;
}

export interface SubjectItem {
  id: string;
  subject_name: string;
  created_at?: string;
}

export interface ClassItem {
  id: string;
  class_name: string;
  session_id: string;
  class_teacher_id?: string;
  created_at?: string;
}

export interface SectionItem {
  id: string;
  class_id: string;
  section_name: string;
  created_at?: string;
}

export interface TeacherSpecialization {
  id: string;
  specialization_name: string;
  created_at?: string;
}
