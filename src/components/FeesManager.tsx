import React, { useState } from "react";
import { 
  CreditCard, Search, DollarSign, Receipt, Printer, Bell, CheckCircle, Clock, AlertTriangle, X, Plus 
} from "lucide-react";
import { Fee, Student } from "../types";

interface FeesManagerProps {
  students: Student[];
  fees: Fee[];
  onAddFee: (fee: Fee) => Promise<void>;
  onUpdateFeeStatus: (id: string, status: "Paid" | "Unpaid" | "Overdue") => Promise<void>;
  onTriggerNotification: (title: string, content: string, role: "student" | "parent" | "teacher" | "all") => Promise<void>;
  isAdmin: boolean;
}

export default function FeesManager({ 
  students, fees, onAddFee, onUpdateFeeStatus, onTriggerNotification, isAdmin 
}: FeesManagerProps) {
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | "Paid" | "Unpaid" | "Overdue">("All");
  
  // Selected printable fee receipt mock state
  const [selectedReceipt, setSelectedReceipt] = useState<Fee | null>(null);

  // New billing card modal state
  const [isAdding, setIsAdding] = useState(false);
  const [targetStudentId, setTargetStudentId] = useState("");
  const [amount, setAmount] = useState<number>(1200);
  const [cycle, setCycle] = useState("May 2026");
  const [dueDate, setDueDate] = useState("2026-05-30");
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (students.length > 0 && !targetStudentId) {
      setTargetStudentId(students[0].id);
    }
  }, [students, targetStudentId]);

  // Compute final filtered fees
  const filteredFees = fees.filter(fee => {
    const student = students.find(s => s.id === fee.student_id);
    const studentName = student ? (student.name || "").toLowerCase() : "";
    const matchesSearch = studentName.includes(searchTerm.toLowerCase()) || fee.id.includes(searchTerm);
    const matchesStatus = statusFilter === "All" || fee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudentId || !amount) return;

    setIsLoading(true);
    const newFee: Fee = {
      id: `fee-${Date.now()}`,
      student_id: targetStudentId,
      amount: Number(amount),
      status: "Unpaid",
      due_date: dueDate,
      billing_cycle: cycle
    };

    await onAddFee(newFee);
    setIsLoading(false);
    setIsAdding(false);
    alert("New tuition fee bill registered in students ledger.");
  };

  const handlePayBill = async (feeId: string) => {
    setIsLoading(true);
    await onUpdateFeeStatus(feeId, "Paid");
    setIsLoading(false);
    alert("Fee Payment accepted online! Official printable receipt is ready under Receipt downloads.");
  };

  const handleTriggerDueAlert = async (fee: Fee) => {
    const student = students.find(s => s.id === fee.student_id);
    if (!student) return;
    
    await onTriggerNotification(
      "Outstanding Fee Alert",
      `Dear Parent, this is a friendly warning that your child ${student.name}'s tuition fee billing cycle ${fee.billing_cycle} of $${fee.amount} is currently ${fee.status}. Deadline coordinate is ${fee.due_date}. Please clear online.`,
      "parent"
    );
    alert(`Fee alert reminder dispatched to parent of ${student.name}`);
  };

  return (
    <div className="space-y-6">
      
      {/* Filters and Admin controls header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-10).dark:border-slate-755 shadow-2xs">
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 w-full md:max-w-xl">
          <div className="relative flex-1 text-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter by pupil name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900 rounded-xl outline-hidden focus:border-emerald-500 text-slate-800 dark:text-white"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-205 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 outline-hidden"
          >
            <option value="All">All Statuses</option>
            <option value="Paid">🟢 Paid Records</option>
            <option value="Unpaid">🔴 Unpaid Records</option>
            <option value="Overdue">⚠️ Overdue Records</option>
          </select>
        </div>

        {isAdmin && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs transition-transform"
          >
            <Plus className="h-4 w-4" />
            Generate New Bill Invoice
          </button>
        )}
      </div>

      {/* Adding Bill Invoice Modal overlay */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-220 dark:border-slate-800 overflow-hidden transform animate-in scale-in duration-200">
            
            <div className="p-5 border-b border-slate-150 bg-slate-50 dark:bg-slate-950 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-sm">Issue Tuition Fee Invoice</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateBill} className="p-6 space-y-4 text-xs">
              
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">Target Student Profile</label>
                <select
                  value={targetStudentId}
                  onChange={(e) => setTargetStudentId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-700 dark:text-slate-200"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Roll: {s.roll_no} - {s.class_name})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-450 mb-1">Bill Amount ($) *</label>
                  <input
                    type="number"
                    required
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-750 dark:text-slate-250"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-455 mb-1">Billing Cycle</label>
                  <input
                    type="text"
                    required
                    value={cycle}
                    onChange={(e) => setCycle(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-705 dark:text-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-450 mb-1 font-mono">Invoice Due Date</label>
                <input
                  type="date"
                  required
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-xl focus:outline-hidden text-slate-700 dark:text-slate-350"
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
                  {isLoading ? "Generating..." : "Post Invoice"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Invoice list presentation cards */}
      {filteredFees.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-12 text-center border">
          <CreditCard className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h4 className="font-bold text-slate-700 dark:text-slate-300">Clean ledger</h4>
          <p className="text-xs text-slate-450 mt-1">No fee invoices recorded under this filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFees.map((fee) => {
            const student = students.find(s => s.id === fee.student_id);
            const statusColor = {
              Paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900",
              Unpaid: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-100 dark:border-amber-900",
              Overdue: "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900"
            }[fee.status];

            return (
              <div 
                key={fee.id} 
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-755 shadow-2xs p-5 flex flex-col justify-between hover:border-emerald-500/20 hover:shadow-xs transition-all duration-300"
              >
                <div>
                  
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] uppercase font-bold tracking-wider font-mono text-slate-400">
                      BILL REF # {fee.id.substring(0, 8).toUpperCase()}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusColor}`}>
                      {fee.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={student ? student.photo_url : "https://images.unsplash.com/photo-1544717305-2782549b5136?w=150"}
                      alt="avatar"
                      className="h-10 w-10 rounded-lg object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800 dark:text-white truncate">
                        {student ? student.name : "Unregistered pupil"}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        Roll: {student ? student.roll_no : "---"} • {student ? student.class_name : "---"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-900/40 p-3.5 rounded-xl border border-slate-50 dark:border-slate-700 space-y-2 text-xs mb-4">
                    <div className="flex justify-between">
                      <span className="text-slate-450">Billing Cycle:</span>
                      <strong className="text-slate-800 dark:text-slate-200 font-semibold">{fee.billing_cycle}</strong>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-450">Amount Enrolled:</span>
                      <strong className="text-lg font-black text-slate-850 dark:text-white font-mono">${fee.amount}</strong>
                    </div>

                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Due Date:</span>
                      <span className="font-mono text-slate-550 dark:text-slate-350">{fee.due_date}</span>
                    </div>
                  </div>

                </div>

                {/* operations */}
                <div className="mt-4 pt-3.5 border-t border-slate-50 dark:border-slate-700/60 flex items-center justify-between gap-1">
                  
                  {fee.status !== "Paid" ? (
                    <button
                      onClick={() => handlePayBill(fee.id)}
                      className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <CreditCard className="h-3.5 w-3.5" /> Pay Online
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedReceipt(fee)}
                      className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-750 text-slate-700 dark:text-slate-300 hover:text-emerald-500 hover:border-emerald-500/20 font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Receipt className="h-3.5 w-3.5 text-emerald-500" /> View Receipt
                    </button>
                  )}

                  {fee.status !== "Paid" && (
                    <button
                      onClick={() => handleTriggerDueAlert(fee)}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 p-2 rounded-xl text-xs flex items-center justify-center cursor-pointer shadow-xs"
                      title="Alert parent coordinates"
                    >
                      <Bell className="h-4 w-4" />
                    </button>
                  )}

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Printable Receipt template popup */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white text-slate-900 rounded-3xl p-6 shadow-2xl relative font-sans text-xs flex flex-col justify-between">
            
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 text-slate-450 hover:text-slate-800 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Receipt headers */}
            <div className="text-center space-y-1.5 border-b-2 border-dashed border-slate-200 pb-4">
              <span className="text-[10px] tracking-wider uppercase font-extrabold text-slate-400 block mb-1">Tuition Fee Receipt</span>
              <h2 className="font-extrabold text-sm text-emerald-800 text-center uppercase">Smart School International</h2>
              <p className="text-[10px] text-slate-500">Transaction Code: #REC-2026{selectedReceipt.id.substring(4,7)}</p>
            </div>

            {/* Receipt body details */}
            <div className="my-5 space-y-2.5 font-mono">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-450">PUPIL REGISTRATION ID:</span>
                <span className="font-bold text-slate-800 uppercase">{students.find(s => s.id === selectedReceipt.student_id)?.name || "Dave Miller"}</span>
              </div>
              
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-450">TRANS REFERENCE:</span>
                <span className="font-bold text-slate-800">ONLINE_CC_SMARTSCHOOL</span>
              </div>

              <div className="flex justify-between text-[11px]">
                <span className="text-slate-450">BILLING CYCLE COVERED:</span>
                <span className="font-bold text-slate-850 uppercase">{selectedReceipt.billing_cycle}</span>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-sm font-sans">
                <span className="font-bold text-slate-600">TOTAL PAID AMOUNT:</span>
                <span className="text-lg font-black font-mono text-emerald-700">${selectedReceipt.amount}.00</span>
              </div>

              <span className="block text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 text-center py-1.5 rounded-lg font-bold my-2 select-none uppercase font-mono tracking-wider">
                ✓ Online Payout Cleared Status
              </span>
            </div>

            {/* Receipt footer print triggers */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-1.5">
              <button
                onClick={() => window.print()}
                className="flex-1 bg-slate-900 text-white font-bold py-2 rounded-xl flex items-center justify-center gap-1 hover:bg-slate-800 cursor-pointer shadow-xs"
              >
                <Printer className="h-3.5 w-3.5" /> Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="bg-slate-100 hover:bg-slate-205 text-slate-700 font-bold px-4 py-2 rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
