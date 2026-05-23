import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import multer from "multer";

// Load configurations
dotenv.config();

const upload = multer({ storage: multer.memoryStorage() });

// Ensure Gemini Client is initialized safely
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Google GenAI client initialized successfully.");
  } catch (e: any) {
    console.error("Failed to initialize Google GenAI client:", e.message);
  }
} else {
  console.warn("GEMINI_API_KEY is not defined in environment variables. Chatbot will use simulated intelligent backups.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // Health endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", time: new Date().toISOString() });
  });

  app.post("/api/upload", upload.single("file"), async (req: express.Request, res: express.Response) => {
    try {
      const file = req.file;
      const bucket = req.body.bucket || "school-gallery";

      if (!file) {
        res.status(400).json({ error: "No file uploaded" });
        return;
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://qywcdbuggdlvwwakirzi.supabase.co";
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseServiceKey) {
        res.status(500).json({ error: "SUPABASE_SERVICE_ROLE_KEY is missing." });
        return;
      }

      const { createClient } = await import("@supabase/supabase-js");
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: { autoRefreshToken: false, persistSession: false }
      });

      const filePath = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (error) {
        console.error("Storage upload error:", error);
        res.status(400).json({ error: error.message });
        return;
      }

      const { data: { publicUrl } } = supabaseAdmin.storage.from(bucket).getPublicUrl(data.path);
      res.json({ publicUrl });

    } catch (e: any) {
      console.error("Server API upload exception caught:", e);
      res.status(500).json({ error: e.message || "A fatal exception occurred during upload." });
    }
  });

  // Admin route to safely register teachers
  app.post("/api/admin/create-teacher", async (req: express.Request, res: express.Response) => {
    try {
      const { name, email, phone, subject, password, qualification, joining_date, class_teacher_of, assigned_class_id, section_name, academic_session } = req.body;

      if (!name || !email) {
        res.status(400).json({ error: "Missing required fields: name and email" });
        return;
      }

      // 1. Password generation if not provided
      const actualPassword = password?.trim() || `Learn-${Math.random().toString(36).substring(2, 10).toUpperCase()}!`;

      const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://qywcdbuggdlvwwakirzi.supabase.co";
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseServiceKey) {
        console.error("SUPABASE_SERVICE_ROLE_KEY is not defined in the backend environment!");
        res.status(400).json({ 
          error: "Supabase Service Role Key is missing. Teacher accounts must be written to the real Supabase Auth/database, so please configure SUPABASE_SERVICE_ROLE_KEY in your settings." 
        });
        return;
      }

      const { createClient } = await import("@supabase/supabase-js");
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // VALIDATION: Prevent duplicate class teacher assignment
      if (assigned_class_id && assigned_class_id !== "None" && assigned_class_id !== "") {
        console.log(`Checking duplicate class teacher assignment for class: ${assigned_class_id}`);
        try {
          const { data: existingClass, error: exErr } = await supabaseAdmin
            .from("classes")
            .select("id, name, class_teacher_id")
            .eq("id", assigned_class_id)
            .maybeSingle();

          if (existingClass && existingClass.class_teacher_id) {
            console.warn(`Class ${assigned_class_id} already has assigned class teacher ID: ${existingClass.class_teacher_id}`);
            res.status(400).json({ error: "This class already has a class teacher" });
            return;
          }
        } catch (clsCheckErr) {
          console.warn("Could not query classes table for duplicate check on Supabase:", clsCheckErr);
        }
      }

      console.log(`Starting real Supabase admin teacher creation for: ${email}`);

      // STEP 1: Create teacher auth account in Supabase Authentication using email and password
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: actualPassword,
        email_confirm: true,
        user_metadata: {
          role: "teacher",
          full_name: name
        }
      });

      if (authError) {
        console.error("Supabase Admin Auth creation failed:", authError);
        const errMsg = authError.message.toLowerCase();
        if (errMsg.includes("already registered") || errMsg.includes("duplicate") || errMsg.includes("conflict") || authError.status === 422) {
          res.status(400).json({ error: "Duplicate Email Error: A user with this email address already exists in the authentication database." });
          return;
        }
        res.status(400).json({ error: `Supabase Auth failure: ${authError.message}` });
        return;
      }

      const authUuid = authData.user?.id;
      if (!authUuid) {
        throw new Error("Supabase Auth failed to return a valid UUID for the created teacher.");
      }

      console.log(`Auth user created successfully with UUID: ${authUuid}. Syncing profiles table.`);

      // STEP 2: Insert teacher into profiles table (with trigger fallback check)
      let profileId = "";
      let profileError = null;

      // Defensively check if a profile was automatically created by a Supabase DB trigger
      const { data: existingProfile, error: fetchErr } = await supabaseAdmin
        .from("profiles")
        .select("*")
        .eq("auth_user_id", authUuid)
        .maybeSingle();

      if (existingProfile) {
        console.log(`Profile was automatically generated via trigger for UUID ${authUuid}. Updating fields.`);
        const { data: updatedProfile, error: updateErr } = await supabaseAdmin
          .from("profiles")
          .update({
            full_name: name,
            email,
            phone: phone || null,
            role: "teacher"
          })
          .eq("auth_user_id", authUuid)
          .select()
          .single();

        if (updateErr) {
          profileError = updateErr;
        } else if (updatedProfile) {
          profileId = updatedProfile.id;
        }
      } else {
        console.log(`No preexisting profile found. Inserting profile for auth UUID: ${authUuid}`);
        const { data: insertedProfile, error: insertErr } = await supabaseAdmin
          .from("profiles")
          .insert({
            auth_user_id: authUuid,
            full_name: name,
            email,
            phone: phone || null,
            role: "teacher"
          })
          .select()
          .single();

        if (insertErr) {
          profileError = insertErr;
        } else if (insertedProfile) {
          profileId = insertedProfile.id;
        }
      }

      if (profileError || !profileId) {
        console.error("Profiles table operations failed. Rolling back auth user.", profileError);
        await supabaseAdmin.auth.admin.deleteUser(authUuid);
        const errMsg = profileError?.message || "Failed to retrieve or generate profile ID.";
        res.status(400).json({ error: `Profiles Sync failure: ${errMsg}` });
        return;
      }

      console.log(`Profile record resolved with ID: ${profileId}. Inserting teachers table row.`);

      // STEP 3: Insert into teachers table
      const finalJoiningDate = joining_date || new Date().toISOString().split("T")[0];
      const { data: teacherData, error: teacherError } = await supabaseAdmin
        .from("teachers")
        .insert({
          profile_id: profileId,
          subject_name: subject || "Mathematics",
          qualification: qualification || "B.Ed",
          joining_date: finalJoiningDate,
          assigned_class_id: assigned_class_id,
          section_name: section_name,
          academic_session: academic_session
        })
        .select()
        .single();

      if (teacherError) {
        console.error("Teachers table insert failed. Rolling back profiles and auth user.", teacherError);
        await supabaseAdmin.from("profiles").delete().eq("id", profileId);
        await supabaseAdmin.auth.admin.deleteUser(authUuid);
        res.status(400).json({ error: `Teachers Table insert failure: ${teacherError.message}` });
        return;
      }

      console.log(`Teacher successfully enrolled in real database with reference ID: ${teacherData.id}`);

      // STEP 4: Assign teacher as class teacher
      if (assigned_class_id && assigned_class_id !== "None" && assigned_class_id !== "") {
        console.log(`STEP 4: Assigning teacher ${teacherData.id} to class: ${assigned_class_id}`);
        try {
          // 1. Unassign this teacher from other classes
          await supabaseAdmin
            .from("classes")
            .update({ class_teacher_id: null })
            .eq("class_teacher_id", teacherData.id);

          // 2. Assign to new class
          const { error: assignError } = await supabaseAdmin
            .from("classes")
            .update({ class_teacher_id: teacherData.id })
            .eq("id", assigned_class_id);

          if (assignError) {
            console.error("Failed to update classes table on Supabase in STEP 4:", assignError.message);
          }
        } catch (clsAssignErr) {
          console.error("Exception in STEP 4 class assignment transaction:", clsAssignErr);
        }
      }

      // STEP 5: Return successful metadata
      res.json({
        success: true,
        message: "Teacher added successfully",
        password: actualPassword,
        auth_user_id: authUuid,
        profile_id: profileId,
        joining_date: finalJoiningDate,
        teacher_id: teacherData.id,
        user: {
          id: teacherData.id,
          name,
          email,
          phone,
          subject,
          qualification: qualification || "B.Ed",
          joining_date: finalJoiningDate,
          classes_assigned: assigned_class_id ? [assigned_class_id] : [],
          photo_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150",
          class_teacher_of: class_teacher_of || null,
          assigned_class_id,
          section_name,
          academic_session
        }
      });

    } catch (e: any) {
      console.error("Server API create-teacher exception caught:", e);
      res.status(500).json({ 
        error: e.message || "A fatal exception occurred during teacher database onboarding." 
      });
    }
  });

  // Admin route to safely register students and their parents
  app.post("/api/admin/create-student", async (req: express.Request, res: express.Response) => {
    try {
      const {
        name, roll_no, class_name, section, photo_url,
        gender, dob, blood_group, aadhaar_no, admission_date, admission_number, academic_session,
        father_name, mother_name, parent_phone, parent_email, address, emergency_contact,
        student_email, student_password, parent_password
      } = req.body;

      if (!name || !roll_no || !class_name || !student_email || !student_password || !parent_email || !parent_password) {
        res.status(400).json({ error: "Missing required fields for student registration." });
        return;
      }

      const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://qywcdbuggdlvwwakirzi.supabase.co";
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseServiceKey) {
        console.error("SUPABASE_SERVICE_ROLE_KEY is missing!");
        res.status(400).json({ 
          error: "Supabase Service Role Key is missing. Student accounts must be written to Supabase Auth/database, please configure SUPABASE_SERVICE_ROLE_KEY." 
        });
        return;
      }

      const { createClient } = await import("@supabase/supabase-js");
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // 1. VALIDATION: No duplicate student email
      try {
        const { data: duplicateEmail } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("email", student_email)
          .maybeSingle();

        if (duplicateEmail) {
          res.status(400).json({ error: `The student email '${student_email}' is already registered in the system.` });
          return;
        }
      } catch (err) {}

      // 2. VALIDATION: No duplicate roll number in same class
      try {
        const { data: duplicateRoll } = await supabaseAdmin
          .from("students")
          .select("id")
          .eq("roll_no", roll_no)
          .eq("class_name", class_name)
          .maybeSingle();

        if (duplicateRoll) {
          res.status(400).json({ error: `Roll number '${roll_no}' already assigned inside '${class_name}' DB ledger.` });
          return;
        }
      } catch (err) {}

      console.log(`Creating student auth user: ${student_email}`);

      // STEP 1: Create student auth account
      const { data: studentAuth, error: studentAuthErr } = await supabaseAdmin.auth.admin.createUser({
        email: student_email,
        password: student_password,
        email_confirm: true,
        user_metadata: {
          role: "student",
          full_name: name
        }
      });

      if (studentAuthErr) {
        res.status(400).json({ error: `Student Auth failure: ${studentAuthErr.message}` });
        return;
      }

      const studentUuid = studentAuth.user?.id;
      if (!studentUuid) {
        throw new Error("Could not retrieve UUID for created student.");
      }

      console.log(`Student Auth resolved (UUID: ${studentUuid}). Creating parent auth user: ${parent_email}`);

      // STEP 2: Create parent auth account (or fetch if preexisting)
      let parentUuid = "";
      const { data: parentAuth, error: parentAuthErr } = await supabaseAdmin.auth.admin.createUser({
        email: parent_email,
        password: parent_password,
        email_confirm: true,
        user_metadata: {
          role: "parent",
          full_name: father_name || mother_name || "Parent"
        }
      });

      if (parentAuthErr) {
        console.warn("Parent Auth failed or parent email already registered. Checking profiles lookup:", parentAuthErr.message);
        // Find existing parent profile
        const { data: parentProfileLookup } = await supabaseAdmin
          .from("profiles")
          .select("auth_user_id")
          .eq("email", parent_email)
          .maybeSingle();

        if (parentProfileLookup) {
          parentUuid = parentProfileLookup.auth_user_id;
        } else {
          // Rollback student auth
          await supabaseAdmin.auth.admin.deleteUser(studentUuid);
          res.status(400).json({ error: `Parent Registration failed: ${parentAuthErr.message}` });
          return;
        }
      } else if (parentAuth.user) {
        parentUuid = parentAuth.user.id;
      }

      if (!parentUuid) {
        // Rollback student auth
        await supabaseAdmin.auth.admin.deleteUser(studentUuid);
        res.status(400).json({ error: "Failed to resolve parent user account association." });
        return;
      }

      console.log(`Parent Auth resolved (UUID: ${parentUuid}). Syncing profiles.`);

      // STEP 3: Insert student profile
      const { data: studentProf, error: studentProfErr } = await supabaseAdmin
        .from("profiles")
        .insert({
          auth_user_id: studentUuid,
          full_name: name,
          email: student_email,
          role: "student"
        })
        .select()
        .single();

      if (studentProfErr || !studentProf) {
        // Rollback
        await supabaseAdmin.auth.admin.deleteUser(studentUuid);
        res.status(400).json({ error: `Student Profile registration failure: ${studentProfErr?.message}` });
        return;
      }

      // STEP 4: Insert parent profile (if not exists)
      let parentProfId = "";
      const { data: existingParentProf } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", parent_email)
        .maybeSingle();

      if (existingParentProf) {
        parentProfId = existingParentProf.id;
      } else {
        const { data: parentProf, error: parentProfErr } = await supabaseAdmin
          .from("profiles")
          .insert({
            auth_user_id: parentUuid,
            full_name: father_name || mother_name || "Parent",
            email: parent_email,
            phone: parent_phone || null,
            role: "parent"
          })
          .select()
          .single();

        if (parentProfErr || !parentProf) {
          // Rollback
          await supabaseAdmin.from("profiles").delete().eq("id", studentProf.id);
          await supabaseAdmin.auth.admin.deleteUser(studentUuid);
          res.status(400).json({ error: `Parent Profile registration failure: ${parentProfErr?.message}` });
          return;
        }
        parentProfId = parentProf.id;
      }

      console.log(`Profiles maps created (Student Prof: ${studentProf.id}, Parent Prof: ${parentProfId}). Creating students record.`);

      // STEP 5 & 6: Insert into students table
      const finalAdmissionNumber = admission_number || `ADM-${Date.now().toString().substring(7)}`;
      const { data: studRow, error: studRowErr } = await supabaseAdmin
        .from("students")
        .insert({
          profile_id: studentProf.id,
          roll_no: roll_no,
          roll_number: roll_no,
          name: name,
          class: class_name,
          section: section || "A",
          photo_url: photo_url || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150",
          dob: dob || null,
          gender: gender || null,
          father_name: father_name || null,
          mother_name: mother_name || null,
          parent_name: father_name || mother_name || "Parent",
          parent_email: parent_email,
          parent_phone: parent_phone || "",
          address: address || null,
          parent_id: parentProfId,
          emergency_contact: emergency_contact || null,
          status: "Active"
        })
        .select()
        .single();

      if (studRowErr || !studRow) {
        console.error("Students row insert failure. Rolling back.", studRowErr);
        await supabaseAdmin.from("profiles").delete().eq("id", studentProf.id);
        await supabaseAdmin.auth.admin.deleteUser(studentUuid);
        res.status(400).json({ error: `Students table registry failure: ${studRowErr?.message}` });
        return;
      }

      // Automatically register a standard parent record in parents table for good relational integrity
      try {
        await supabaseAdmin
          .from("parents")
          .upsert({
            id: parentProfId,
            name: father_name || mother_name || "Parent",
            email: parent_email,
            phone: parent_phone || "",
            students_associated: [studRow.id]
          });
      } catch (pErr) {
        console.warn("Parents table secondary insertion fallback ignored:", pErr);
      }

      // STEP 7 & 8: Success JSON response!
      res.json({
        success: true,
        message: "Student added successfully",
        student_id: studRow.id,
        profile_id: studentProf.id,
        parent_id: parentProfId,
        student: {
          id: studRow.id,
          roll_no: roll_no,
          name: name,
          class_name: class_name,
          section: section,
          parent_name: father_name || mother_name || "Parent",
          parent_email: parent_email,
          parent_phone: parent_phone || "",
          photo_url: photo_url || "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150",
          status: "Active",
          gender: gender,
          dob: dob,
          blood_group: blood_group,
          aadhaar_no: aadhaar_no,
          admission_date: admission_date || new Date().toISOString().split("T")[0],
          admission_number: finalAdmissionNumber,
          academic_session: academic_session,
          father_name: father_name,
          mother_name: mother_name,
          address: address,
          emergency_contact: emergency_contact,
          student_email: student_email,
          parent_id: parentProfId,
          profile_id: studentProf.id
        }
      });

    } catch (err: any) {
      console.error("Fatal exception in student database onboarding:", err);
      res.status(500).json({ error: err.message || "A fatal exception occurred during student backend onboarding." });
    }
  });

  // Chat endpoint for Gemini model 'gemini-3.5-flash'
  app.post("/api/chat", async (req: express.Request, res: express.Response) => {
    const { prompt, history, userRole } = req.body;

    if (!prompt) {
      res.status(400).json({ error: "Prompt is required" });
      return;
    }

    const systemPrompt = `You are "GHSS AI", the dedicated premium AI Chatbot Assistant for "Smart School App" — a modern educational portal.
Your role changes depending on who you talk to (the current user role is: "${userRole || 'general guest'}").
- For ADMINS: Help with management, teacher subject loads, class scheduling, attendance patterns, and financial data analysis.
- For TEACHERS: Assist with designing homework instructions, grading formulas, lecture planning, syllabus content generator, and student motivation emails.
- For STUDENTS: Act as a friendly, step-by-step homework assistant. Help explain mathematics formulas, physics theories, historical incidents, or literature analysis simply. NEVER just print the direct homework answers outright; instead guide the student with key methods.
- For PARENTS: Answer school policies, exam scheduling, holidays calendar, fee payment, transport coordinates, and general feedback channels.

Maintain an encouraging, highly professional, polite, and educational tone. Keep explanations clear, structured, and easy to read using Markdown. Use bullets and bold texts for visually clean highlights. Refer to Smart School App coordinates if appropriate (e.g., advising them to check the "Attendance History", "Homework System", "Result Analytics" or "Fees Management" tabs).`;

    // Try to call human Gemini API
    if (ai) {
      try {
        // Build chat history matching GoogleGenAI spec or use direct generateContent
        const response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: prompt,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
            topP: 0.95,
          }
        });

        const reply = response.text || "I was unable to formulate a response. Please try again.";
        res.json({ success: true, reply });
        return;
      } catch (genError: any) {
        console.error("Gemini API error query:", genError.message || genError);
        // Fallback gracefully below
      }
    }

    // High fidelity fallback response if API key is missing or failed
    console.log("Serving simulated smart school chatbot response.");
    const pLower = prompt.toLowerCase();
    let reply = "";

    if (pLower.includes("hello") || pLower.includes("hi") || pLower.includes("hey")) {
      reply = `Hello! I'm **GHSS AI**, your intelligent virtual assistant for **Smart School App**. 👋\n\nI can help you with:\n- Explain homework questions step-by-step\n- View holiday notifications & exam schedules\n- Guide you on fee statuses\n- Provide advice for classroom tasks\n\nHow can I help you today?`;
    } else if (pLower.includes("math") || pLower.includes("quadratic") || pLower.includes("equation")) {
      reply = `Let's break down quadratic equations! 📐\n\nA quadratic equation is generally written in the form:\n$$\\mathbf{ax^2 + bx + c = 0}$$\n\nTo solve this, we can use the quadratic formula:\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\n**Step-by-Step Guide:**\n1. Identify coefficients $a$, $b$, and $c$.\n2. Calculate the Discriminant: $D = b^2 - 4ac$.\n3. If $D > 0$, you have 2 distinct real solutions.\n4. If $D = 0$, you have exactly 1 real solution.\n5. If $D < 0$, you have complex answers.\n\nType your specific numbers and we can walk through it together!`;
    } else if (pLower.includes("holiday") || pLower.includes("closed") || pLower.includes("vacation")) {
      reply = `📅 **Holiday announcements highlight:**\n\nThe upcoming Summer Vacation starts from **June 1st to June 30th**. Normal classes and schedules will resume on **July 1st, 2026**.\n\nYou can also find this listed in detail in the **Notice Board** section. Let me know if you need any other academic dates!`;
    } else if (pLower.includes("physics") || pLower.includes("friction") || pLower.includes("newton")) {
      reply = `🍎 **Newton's Laws & Friction tips:**\n\nFriction is calculated using the formula:\n$$f_k = \\mu_k F_N$$\n\nWhere:\n- $f_k$ is the kinetic friction force\n- $\\mu_k$ is the coefficient of kinetic friction\n- $F_N$ is the Normal Force (equal to $m \\cdot g$ on a flat horizontal plane)\n\nTry looking at your homework assignment task first to see if the block is on an inclined plane or flat ground!`;
    } else if (pLower.includes("fees") || pLower.includes("paid") || pLower.includes("payout")) {
      reply = `💳 **Fees Management Assistance:**\n\nTo view your status or make a fee payment:\n1. Click the **Fees Management** tab on your role navigation.\n2. You can view Paid, Unpaid or Overdue invoices.\n3. Parents can click 'Pay Online' to generate an instant printable payment receipt.\n\nLet me know if you see any invoice discrepancy!`;
    } else {
      reply = `I am happy to assist you with "${prompt}". 🏫\n\nAs your **Smart School Assistant**, I suggest checking:\n- **Homework tab**: To see current outstanding assignments.\n- **Exams tab**: To view Midterm analytics & report card cards.\n- **Timetables**: To verify correct class times and assigned educators.\n\nLet me know your target topic, and I'll explain it immediately!`;
    }

    res.json({ success: true, reply: reply + "\n\n*(Note: This is an intelligent offline response from GHSS AI)*" });
  });

  // Vite Integration
  if (process.env.NODE_ENV !== "production") {
    console.log("Configuring Vite Development Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    console.log(`Serving static production build from: ${distPath}`);
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart School Server running on http://localhost:${PORT}`);
  });
}

startServer();
