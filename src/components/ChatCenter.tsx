import React, { useState } from "react";
import { 
  Send, MessageSquare, Search, Phone, Mail, Check, AlertCircle, Sparkles 
} from "lucide-react";
import { Message, Student, Teacher, UserRole } from "../types";

interface ChatProps {
  students: Student[];
  teachers: Teacher[];
  onSendMessage: (msg: Message) => Promise<void>;
  userName: string;
}

export default function ChatCenter({ 
  students, teachers, onSendMessage, userName 
}: ChatProps) {
  
  // Custom directory combining both teachers & parent guardians
  const directories = [
    ...teachers.map(t => ({ id: t.id, name: t.name, role: "Teacher", status: "Online", photo: t.photo_url })),
    ...students.map(s => ({ id: s.id, name: `${s.parent_name} (Parent of ${s.name})`, role: "Parent", status: "Offline", photo: s.photo_url }))
  ];

  const [selectedContact, setSelectedContact] = useState<typeof directories[0]>(directories[0]);
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: "m1", 
      sender_id: "teach-1", 
      sender_name: "Elena Rostova", 
      sender_role: "teacher" as UserRole,
      receiver_id: "me", 
      receiver_name: userName,
      receiver_role: "parent" as UserRole,
      content: "Hello! Just wanted to inquire if Sarah received the mathematics worksheet package?", 
      timestamp: new Date(Date.now() - 3600000).toISOString() 
    },
    { 
      id: "m2", 
      sender_id: "me", 
      sender_name: userName, 
      sender_role: "parent" as UserRole,
      receiver_id: "teach-1", 
      receiver_name: "Elena Rostova",
      receiver_role: "teacher" as UserRole,
      content: "Yes! She is completing page 4 right now. Thanks for the guidance.", 
      timestamp: new Date(Date.now() - 3000000).toISOString() 
    }
  ]);

  const [typedText, setTypedText] = useState("");
  const [searchContact, setSearchContact] = useState("");

  const filteredContacts = directories.filter(c => 
    (c.name || "").toLowerCase().includes(searchContact.toLowerCase()) || 
    (c.role || "").toLowerCase().includes(searchContact.toLowerCase())
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedText.trim()) return;

    const myMsg: Message = {
      id: `msg-${Date.now()}`,
      sender_id: "me",
      sender_name: userName,
      sender_role: "parent" as UserRole,
      receiver_id: selectedContact.id,
      receiver_name: selectedContact.name,
      receiver_role: selectedContact.role.toLowerCase() as UserRole,
      content: typedText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, myMsg]);
    setTypedText("");
    await onSendMessage(myMsg);

    // Simulate reactive receipt reply in 1.5 seconds!
    setTimeout(() => {
      const simulatedReply: Message = {
        id: `msg-reply-${Date.now()}`,
        sender_id: selectedContact.id,
        sender_name: selectedContact.name,
        sender_role: selectedContact.role.toLowerCase() as UserRole,
        receiver_id: "me",
        receiver_name: userName,
        receiver_role: "parent" as UserRole,
        content: `Thanks for the update. Let's arrange a brief synchronization review session later this week if needed regarding current syllabus items!`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, simulatedReply]);
    }, 1500);
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-755 shadow-2xs overflow-hidden max-w-6xl mx-auto flex h-[580px] text-xs">
      
      {/* Left contact panel */}
      <div className="w-full sm:w-80 border-r border-slate-100 dark:border-slate-705 flex flex-col justify-between shrink-0">
        
        <div className="p-4 border-b border-slate-50 dark:border-slate-700 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">Discussions Center</h3>
            <span className="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 text-[9px] font-bold px-2 py-0.5 rounded-full font-mono">
              Live Connection
            </span>
          </div>

          <div className="relative text-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchContact}
              onChange={(e) => setSearchContact(e.target.value)}
              className="w-full text-[11px] pl-9 pr-3 py-2 border border-slate-150 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-700 dark:text-white"
            />
          </div>
        </div>

        {/* Contacts directory stack */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50/80 dark:divide-slate-700/40 p-2 space-y-1">
          {filteredContacts.map((contact) => {
            const isSelected = selectedContact.id === contact.id;
            
            return (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all cursor-pointer text-left ${
                  isSelected 
                    ? "bg-slate-900 border-slate-900 text-white dark:bg-slate-700" 
                    : "hover:bg-slate-100/50 text-slate-800 dark:text-slate-300"
                }`}
              >
                <div className="relative shrink-0">
                  <img
                    src={contact.photo}
                    alt={contact.name}
                    className="h-10 w-10 rounded-xl object-cover ring-2 ring-white"
                    referrerPolicy="no-referrer"
                  />
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800 ${contact.status === "Online" ? "bg-emerald-500" : "bg-slate-400"}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className={`font-extrabold uppercase tracking-wide px-1.5 py-0.2 rounded-lg ${
                      isSelected ? "text-slate-100" : "text-emerald-600 dark:text-emerald-400"
                    }`}>
                      {contact.role}
                    </span>
                  </div>
                  
                  <h4 className="font-extrabold text-xs truncate mt-0.5 tracking-tight leading-snug">
                    {contact.name}
                  </h4>
                </div>

              </button>
            );
          })}
        </div>

      </div>

      {/* Right chat logs window */}
      <div className="flex-1 flex flex-col justify-between bg-slate-50/20 dark:bg-slate-900/10">
        
        {/* Connected headers */}
        <div className="p-4 bg-white dark:bg-slate-850 border-b border-slate-100 dark:border-slate-705 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <img
              src={selectedContact.photo}
              alt={selectedContact.name}
              className="h-9 w-9 rounded-lg object-cover ring-2 ring-emerald-505"
              referrerPolicy="no-referrer"
            />
            <div>
              <h4 className="font-extrabold text-slate-800 dark:text-white">{selectedContact.name}</h4>
              <p className="text-[10px] text-slate-450 mt-0.5">Role Classification: {selectedContact.role} • {selectedContact.status}</p>
            </div>
          </div>
        </div>

        {/* Message logs scrolling space */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((msg) => {
            const isMe = msg.sender_id === "me";

            return (
              <div 
                key={msg.id} 
                className={`flex ${isMe ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-200`}
              >
                <div className={`max-w-[75%] rounded-2xl p-3.5 shadow-3xs space-y-1.5 ${
                  isMe 
                    ? "bg-slate-900 text-slate-50 dark:bg-emerald-600" 
                    : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-850 dark:text-slate-100"
                }`}>
                  <p className="leading-relaxed leading-normal whitespace-pre-wrap">{msg.content}</p>
                  
                  <div className="flex items-center gap-1.5 justify-end text-[9px] text-slate-400 font-mono">
                    <span>{msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</span>
                    {isMe && <Check className="h-3 w-3 text-emerald-400" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Messaging footer input field */}
        <form onSubmit={handleSend} className="p-4 bg-white dark:bg-slate-850 border-t border-slate-100 dark:border-slate-705 flex gap-2">
          <input
            type="text"
            placeholder={`Type messages with ${selectedContact.name}...`}
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-205 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:outline-hidden text-slate-850 dark:text-white"
          />
          <button
            type="submit"
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-4 flex items-center justify-center cursor-pointer shadow-sm progress-colors duration-200 shrink-0"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>

      </div>

    </div>
  );
}
