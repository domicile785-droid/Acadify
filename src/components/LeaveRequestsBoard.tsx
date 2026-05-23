import React, { useState } from "react";
import { 
  FileText, Plus, Calendar, CheckCircle, Clock, X, AlertTriangle, Send 
} from "lucide-react";
import { LeaveRequest, UserRole } from "../types";

interface LeaveProps {
  leaveList: LeaveRequest[];
  onAddLeave: (item: LeaveRequest) => Promise<void>;
  onUpdateLeaveStatus: (id: string, status: "Approved" | "Rejected", approvedBy: string) => Promise<void>;
  isAdminOrTeacher: boolean;
  userRole: UserRole;
  userName: string;
}

export default function LeaveRequestsBoard({ 
  leaveList, onAddLeave, onUpdateLeaveStatus, isAdminOrTeacher, userRole, userName 
}: LeaveProps) {
  
  const [isAdding, setIsAdding] = useState(false);
  
  // Form submission state
  const [type, setType] = useState<"Sick" | "Casual" | "Maternity/Paternity" | "Other">("Sick");
  const [reason, setReason] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || !startDate) return;

    setIsLoading(true);
    const newRequest: LeaveRequest = {
      id: `lr-${Date.now()}`,
      requester_id: `user-${Date.now()}`,
      requester_name: userName || "Sarah Miller",
      requester_role: userRole === "admin" ? "teacher" : userRole as any,
      type,
      reason,
      start_date: startDate,
      end_date: endDate,
      status: "Pending"
    };

    await onAddLeave(newRequest);
    setIsLoading(false);
    setIsAdding(false);
    setReason("");
    alert("Leave application forwarded successfully and pending admin approval.");
  };

  const handleApprove = async (id: string) => {
    await onUpdateLeaveStatus(id, "Approved", userName);
    alert("Leave request APPROVED. Status notification will sync with parent.");
  };

  const handleReject = async (id: string) => {
    await onUpdateLeaveStatus(id, "Rejected", userName);
    alert("Leave request REJECTED.");
  };

  return (
    <div className="space-y-6">
      
      {/* Upper header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-75) shadow-2xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-800 dark:text-slate-100 tracking-tight">Leave Administration</h2>
          <p className="text-xs text-slate-400 mt-1">Submit sabbatical / sick-leave applications or authorize pending pupil sabbaticals</p>
        </div>

        {/* Anyone can submit leave */}
        <button
          onClick={() => setIsAdding(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform"
        >
          <Plus className="h-4 w-4" />
          Request Leave Sabbatical
        </button>
      </div>

      {/* Addition Modal Overlay */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-205 dark:border-slate-800 overflow-hidden transform animate-in scale-in duration-200">
            
            <div className="p-5 border-b border-slate-150 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-805 dark:text-white text-sm">Apply For Official Leave</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Leave Classification</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-700 dark:text-slate-350"
                >
                  <option value="Sick">🤢 Sick Leave (Medical check)</option>
                  <option value="Casual">🏖️ Casual / Family obligations</option>
                  <option value="Other">📝 Other (Emergency state)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-700 dark:text-slate-350"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-700 dark:text-slate-350"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Reason / Description Details *</label>
                <textarea
                  required
                  rows={4}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Clearly state medical condition or trip plans..."
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-700 dark:text-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:opacity-85"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700"
                >
                  {isLoading ? "Submitting..." : "Send Application"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Grid view of leave requests */}
      {leaveList.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border">
          <CheckCircle className="h-10 w-10 text-slate-300 mx-auto mb-2" />
          <h4 className="font-bold text-slate-700 dark:text-slate-200">No active sabbatical logs</h4>
          <p className="text-xs text-slate-400 mt-1">Sabbatical applications queue is currently empty.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
          {leaveList.map((leave) => {
            const statusColor = {
              Pending: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100",
              Approved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100",
              Rejected: "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100"
            }[leave.status];

            return (
              <div 
                key={leave.id} 
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-755 shadow-2xs p-5 relative overflow-hidden flex flex-col justify-between group hover:border-emerald-500/10 transition-all duration-300"
              >
                <div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-slate-450 block">
                      USER: {leave.requester_name} ({leave.requester_role.toUpperCase()})
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                      {leave.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mb-3 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 border px-2 py-0.5 rounded">
                      {leave.type} Case
                    </span>
                    <span className="font-mono text-[10px] text-slate-400">
                      📅 {leave.start_date} to {leave.end_date}
                    </span>
                  </div>

                  <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-sans mb-4 whitespace-pre-line">
                    "{leave.reason}"
                  </p>

                </div>

                {/* Operations */}
                {leave.status === "Pending" && isAdminOrTeacher ? (
                  <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-700/60 flex gap-2">
                    <button
                      onClick={() => handleApprove(leave.id)}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer shadow-sm transition-colors"
                    >
                      ✓ Approve Leave
                    </button>
                    <button
                      onClick={() => handleReject(leave.id)}
                      className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      ✗ Reject Case
                    </button>
                  </div>
                ) : (
                  leave.approved_by && (
                    <div className="mt-4 pt-3.5 border-t border-slate-50 dark:border-slate-700/60 text-[10px] font-mono text-slate-400 text-right">
                      Authorized by: {leave.approved_by}
                    </div>
                  )
                )}

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
