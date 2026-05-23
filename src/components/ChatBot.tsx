import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles, MessageSquare, X, CornerDownLeft, GraduationCap, CheckCircle } from "lucide-react";
import { UserRole } from "../types";

interface ChatBotProps {
  userRole: UserRole;
  userName: string;
}

interface MessageItem {
  id: string;
  sender: "user" | "bot";
  text: string;
  timestamp: Date;
}

export default function ChatBot({ userRole, userName }: ChatBotProps) {
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "m-init",
      sender: "bot",
      text: `Hello **${userName}** ! I'm **GHSS AI**, your school AI Assistant configured for your **${userRole.toUpperCase()}** dashboard. How can I help you, solve homework, or check school details today?`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [typingText, setTypingText] = useState("");
  const messageEndRef = useRef<HTMLDivElement>(null);

  const SUGGESTED_PROMPTS = {
    student: [
      "Explain Quadratic Equations solver step-by-step",
      "Explain kinetic friction coefficients",
      "Give tips to analyze Shakespeare's Hamlet"
    ],
    parent: [
      "When are the school summer holidays?",
      "How can I see my child's unpaid tuition fees?",
      "Who can I contact for physical attendance discrepancies?"
    ],
    teacher: [
      "Draft a motivating praise message for math homework",
      "Create a brief lesson plan on electrostatics",
      "How do I mark late student attendances?"
    ],
    admin: [
      "How to assign a teacher to a new section?",
      "Analyze late attendance count and peak arrival hour",
      "Summarize current school safety instructions"
    ]
  };

  const currentSuggestions = SUGGESTED_PROMPTS[userRole] || SUGGESTED_PROMPTS.student;

  useEffect(() => {
    if (messageEndRef.current) {
      messageEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMsg: MessageItem = {
      id: `u-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: textToSend,
          userRole: userRole
        })
      });

      const data = await response.json();
      const replyText = data.reply || "No response received. Please check connections.";

      setMessages(prev => [
        ...prev,
        {
          id: `b-${Date.now()}`,
          sender: "bot",
          text: replyText,
          timestamp: new Date()
        }
      ]);
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          id: `b-err-${Date.now()}`,
          sender: "bot",
          text: "⚠️ *Unable to reach the AI assistant right now. Please test again in a moment.*",
          timestamp: new Date()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Safe markdown helper
  const renderMarkdown = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      let formatted = line;
      // Bold checks **
      formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-emerald-900 dark:text-emerald-300">$1</strong>');
      // Subtitle / bullet
      if (line.trim().startsWith("-")) {
        return (
          <li key={i} className="ml-4 list-disc text-sm text-slate-700 dark:text-slate-300 my-1" 
              dangerouslySetInnerHTML={{ __html: formatted.replace(/-\s*/, '') }} />
        );
      }
      return (
        <p key={i} className="text-sm text-slate-700 dark:text-slate-300 my-1 leading-relaxed" 
           dangerouslySetInnerHTML={{ __html: formatted }} />
      );
    });
  };

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        id="chatbot-trigger"
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-full py-2 px-3.5 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.03] flex items-center justify-center border border-emerald-500/10 gap-1.5 cursor-pointer"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-300"></span>
        </span>
        <Bot className="h-4.5 w-4.5" />
        <span className="font-semibold text-xs tracking-tight pr-0.5">Ask GHSS AI</span>
      </button>

      {/* AI Chatbot Slider Modal */}
      {isOpen && (
        <div id="chatbot-modal" className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 h-full flex flex-col shadow-2xl relative border-l border-slate-200 dark:border-slate-800">
            
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-950 p-4 text-white flex items-center justify-between border-b border-emerald-900/30">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold tracking-tight text-base flex items-center gap-1">
                    GHSS AI Assistant
                    <Sparkles className="h-4 w-4 text-teal-300 fill-teal-300 animate-pulse" />
                  </h3>
                  <p className="text-xs text-teal-200 flex items-center gap-1 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping" />
                    Powered by Gemini 3.5
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Hint & Suggestions Rail */}
            <div className="bg-slate-50 dark:bg-slate-950 px-4 py-3 border-b border-slate-200 dark:border-slate-800">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-2 flex items-center gap-1.5">
                <MessageSquare className="h-3 w-3 text-emerald-500" />
                Suggested for current role ({userRole.toUpperCase()}):
              </p>
              <div className="flex flex-wrap gap-1.5">
                {currentSuggestions.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setInput(promptText);
                      handleSend(promptText);
                    }}
                    className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-lg hover:border-emerald-500 dark:hover:border-emerald-400 hover:bg-emerald-50/30 transition-all text-left truncate max-w-full cursor-pointer shadow-2xs"
                  >
                    {promptText}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/40">
              {messages.map((m) => (
                <div key={m.id} className={`flex gap-3 ${m.sender === "user" ? "justify-end" : "justify-start"}`}>
                  {m.sender !== "user" && (
                    <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                      <GraduationCap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-2xs ${
                    m.sender === "user" 
                      ? "bg-slate-900 text-slate-50 rounded-tr-none" 
                      : "bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-850 rounded-tl-none text-slate-800"
                  }`}>
                    {m.sender === "user" ? (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.text}</p>
                    ) : (
                      <div className="space-y-1">
                        {renderMarkdown(m.text)}
                      </div>
                    )}
                    <span className="block text-[10px] text-right mt-1.5 opacity-60 font-mono">
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center shrink-0">
                    <Bot className="h-4 w-4 text-emerald-600 dark:text-teal-400 animate-bounce" />
                  </div>
                  <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-850 rounded-2xl rounded-tl-none px-4 py-3 shadow-2xs max-w-[80%]">
                    <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                      GHSS AI is generating explanation...
                    </div>
                  </div>
                </div>
              )}
              <div ref={messageEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(input);
                }}
                className="flex items-center gap-2 border border-slate-200 dark:border-slate-750 rounded-xl p-2 bg-slate-50 dark:bg-slate-900 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask a school question or explain formulas..."
                  className="flex-1 bg-transparent border-0 ring-0 outline-hidden text-sm px-2 text-slate-800 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white p-2.5 rounded-lg transition-all flex items-center justify-center shrink-0 cursor-pointer shadow-xs"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
              <div className="flex items-center justify-between mt-2.5 px-1">
                <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <CheckCircle className="h-3 w-3 text-emerald-500" />
                  Ask about formulas, school schedules or fees
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Press Enter to send
                </span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
