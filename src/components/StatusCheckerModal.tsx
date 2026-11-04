"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, CheckCircle2, Clock, XCircle, Wrench, ShieldCheck, ArrowRight } from "lucide-react";

interface StatusCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTicket?: string;
}

interface TicketStatusData {
  ticketNumber: string;
  courseNumber: string;
  ideaTitle: string;
  status: string;
  scope: string;
  difficulty: string;
  createdAt: string;
  updatedAt: string;
}

export function StatusCheckerModal({ isOpen, onClose, initialTicket = "" }: StatusCheckerModalProps) {
  const [ticketInput, setTicketInput] = useState(initialTicket);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<TicketStatusData | null>(null);

  const triggerHaptic = (type: "light" | "selection" | "success" | "error" = "selection") => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        switch (type) {
          case "selection":
            navigator.vibrate(8);
            break;
          case "light":
            navigator.vibrate(15);
            break;
          case "success":
            navigator.vibrate([15, 30, 20]);
            break;
          case "error":
            navigator.vibrate([30, 40, 30]);
            break;
        }
      } catch {}
    }
  };

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!ticketInput.trim()) return;

    triggerHaptic("light");
    setLoading(true);
    setError(null);
    setTicket(null);

    try {
      const res = await fetch(`/api/tickets?ticketNumber=${encodeURIComponent(ticketInput.trim())}`);
      const data = await res.json();

      if (!res.ok) {
        triggerHaptic("error");
        setError(data.error || "Не бе открита заявка с посочения номер.");
      } else {
        triggerHaptic("success");
        setTicket(data.ticket);
      }
    } catch {
      triggerHaptic("error");
      setError("Възникна грешка при връзка със сървъра.");
    } finally {
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-mono text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Одобрена заявка
          </span>
        );
      case "DISAPPROVED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[11px] font-mono text-red-400">
            <XCircle className="h-3 w-3" />
            Не е одобрена
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 rounded border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[11px] font-mono text-blue-400">
            <Wrench className="h-3 w-3" />
            В разработка
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 px-2 py-0.5 text-[11px] font-mono text-zinc-300">
            <ShieldCheck className="h-3 w-3" />
            Завършен
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[11px] font-mono text-amber-400">
            <Clock className="h-3 w-3" />
            Преглед
          </span>
        );
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={() => {
              triggerHaptic("selection");
              onClose();
            }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] as const }}
            className="relative w-full max-w-md rounded-md border border-zinc-800 bg-[#0d0e11] p-5 shadow-2xl z-10"
          >
            <button
              onClick={() => {
                triggerHaptic("selection");
                onClose();
              }}
              className="absolute right-3.5 top-3.5 rounded p-1 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-4">
              <h3 className="text-sm font-semibold text-zinc-100">Проверка на статус на тикет</h3>
              <p className="text-[12px] text-zinc-400 mt-0.5">
                Въведете вашия входящ номер (напр. UKTC-2026-XXXX).
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2 mb-4">
              <input
                type="text"
                value={ticketInput}
                onChange={(e) => setTicketInput(e.target.value.toUpperCase())}
                placeholder="UKTC-2026-..."
                className="flex-1 rounded-md border border-zinc-800 bg-[#141417] px-3 py-1.5 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading || !ticketInput.trim()}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-950 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                {loading ? "..." : "Провери"}
                <ArrowRight className="h-3 w-3" />
              </button>
            </form>

            {error && (
              <div className="rounded-md border border-red-500/30 bg-red-950/20 p-2.5 text-xs text-red-400">
                {error}
              </div>
            )}

            {ticket && (
              <div className="mt-4 rounded-md border border-zinc-800 bg-[#141417] p-3.5 text-xs space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
                  <div>
                    <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-mono">Номер</span>
                    <div className="font-mono text-xs font-semibold text-zinc-100">{ticket.ticketNumber}</div>
                  </div>
                  <div>{getStatusBadge(ticket.status)}</div>
                </div>

                <div>
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-mono">Тема</span>
                  <p className="text-zinc-200 font-medium text-xs mt-0.5">{ticket.ideaTitle}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[12px] pt-1 border-t border-zinc-800/80">
                  <div>
                    <span className="text-zinc-500 text-[11px]">Курсов код:</span>
                    <p className="text-zinc-300 font-mono">{ticket.courseNumber}</p>
                  </div>
                  <div>
                    <span className="text-zinc-500 text-[11px]">Сложност:</span>
                    <p className="text-zinc-300">
                      {ticket.difficulty === "BASIC"
                        ? "Базово"
                        : ticket.difficulty === "STANDARD"
                        ? "Стандартно"
                        : "Комплексно"}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
