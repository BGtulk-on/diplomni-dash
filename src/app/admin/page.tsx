"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  Search,
  RefreshCw,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  Wrench,
  Mail,
  Send,
  MessageSquare,
  Copy,
  Check,
  AlertCircle,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
} from "lucide-react";

interface Ticket {
  id: string;
  ticketNumber: string;
  fullName: string;
  email: string;
  phone: string | null;
  courseNumber: string;
  commPlatform: string;
  commHandle: string;
  hasCustomIdea: boolean;
  ideaTitle: string;
  presetTheme: string | null;
  ideaDescription: string | null;
  supervisor: string;
  scope: string;
  difficulty: string;
  includeCodeComments?: boolean;
  offeredBudget: number;
  additionalNotes: string | null;
  status: string;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  total: number;
  pending: number;
  approved: number;
  disapproved: number;
  inProgress: number;
  completed: number;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    pending: 0,
    approved: 0,
    disapproved: 0,
    inProgress: 0,
    completed: 0,
  });
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Expanded ticket IDs for detail view
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Custom email modal
  const [emailModalTicket, setEmailModalTicket] = useState<Ticket | null>(null);
  const [customSubject, setCustomSubject] = useState("");
  const [customBody, setCustomBody] = useState("");
  const [emailSending, setEmailSending] = useState(false);

  // Notification message
  const [bannerMsg, setBannerMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Check auth on load
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch("/api/admin/logout");
        const data = await res.json();
        setIsAuthenticated(!!data.authenticated);
        if (data.authenticated) {
          fetchTickets();
        }
      } catch {
        setIsAuthenticated(false);
      }
    }
    checkAuth();
  }, []);

  const showBanner = (text: string, type: "success" | "error" = "success") => {
    setBannerMsg({ text, type });
    setTimeout(() => setBannerMsg(null), 4000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setPinLoading(true);
    setPinError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: pin.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        setPinError(data.error || "Невалиден код за достъп.");
      } else {
        setIsAuthenticated(true);
        setPin("");
        fetchTickets();
        showBanner("Успешен вход в Административния панел.");
      }
    } catch {
      setPinError("Грешка при връзка със сървъра.");
    } finally {
      setPinLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      setIsAuthenticated(false);
      setTickets([]);
    } catch {
      // Ignored
    }
  };

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (searchQuery.trim()) params.set("search", searchQuery.trim());

      const res = await fetch(`/api/admin/tickets?${params.toString()}`);
      const data = await res.json();
      if (res.ok) {
        setTickets(data.tickets || []);
        if (data.stats) setStats(data.stats);
      } else if (res.status === 401) {
        setIsAuthenticated(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchTickets();
    }
  }, [statusFilter, searchQuery, isAuthenticated]);

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        showBanner(`Статусът бе обновен на: ${newStatus}`);
        fetchTickets();
      }
    } catch {
      showBanner("Грешка при смяна на статуса", "error");
    }
  };

  const handleAdminNotesSave = async (ticketId: string, notes: string) => {
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminNotes: notes }),
      });
      if (res.ok) {
        showBanner("Вътрешните бележки бяха запаметени");
        fetchTickets();
      }
    } catch {
      showBanner("Грешка при запис на бележките", "error");
    }
  };

  const handleSendEmailAction = async (ticketId: string, action: "APPROVE_EMAIL" | "DISAPPROVE_EMAIL") => {
    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        showBanner(data.message || "Имейлът бе изпратен през Resend успешно!");
        fetchTickets();
      } else {
        showBanner(data.error || "Грешка при изпращане на имейл", "error");
      }
    } catch {
      showBanner("Грешка при комуникация със сървъра", "error");
    }
  };

  const handleSendCustomEmail = async () => {
    if (!emailModalTicket || !customSubject.trim() || !customBody.trim()) return;

    setEmailSending(true);
    try {
      const res = await fetch(`/api/admin/tickets/${emailModalTicket.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "CUSTOM_EMAIL",
          customSubject: customSubject.trim(),
          customMessage: customBody.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        showBanner("Персонализираният имейл бе изпратен успешно през Resend!");
        setEmailModalTicket(null);
        setCustomSubject("");
        setCustomBody("");
        fetchTickets();
      } else {
        showBanner(data.error || "Грешка при изпращане на имейла", "error");
      }
    } catch {
      showBanner("Грешка при комуникация със сървъра", "error");
    } finally {
      setEmailSending(false);
    }
  };

  const handleDeleteTicket = async (ticketId: string, ticketNumber: string) => {
    if (!confirm(`Сигурни ли сте, че желаете да изтриете тикет ${ticketNumber}?`)) return;

    try {
      const res = await fetch(`/api/admin/tickets/${ticketId}`, { method: "DELETE" });
      if (res.ok) {
        showBanner(`Тикет ${ticketNumber} бе изтрит успешно`);
        fetchTickets();
      }
    } catch {
      showBanner("Грешка при изтриване", "error");
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isAuthenticated === null) {
    return (
      <div className="h-screen w-screen bg-[#09090b] flex items-center justify-center">
        <div className="h-4 w-4 animate-spin border-2 border-zinc-400 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-screen overflow-hidden flex flex-col bg-[#09090b] text-[#f4f4f5]">
      {/* Top Bar */}
      <div className="h-10 border-b border-[#1f1f23] bg-[#0d0e11] px-4 flex items-center justify-between text-xs font-mono shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-zinc-100 transition-colors">
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Към въпросника</span>
          </Link>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-300 font-medium">АДМИНИСТРАТИВЕН ПАНЕЛ</span>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-2">
            <button
              onClick={fetchTickets}
              className="inline-flex items-center gap-1.5 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <RefreshCw className={`h-3 w-3 ${loadingTickets ? "animate-spin" : ""}`} />
              <span>Обнови</span>
            </button>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-2 py-1 text-[11px] text-red-400 hover:bg-red-950/30 transition-colors"
            >
              <LogOut className="h-3 w-3" />
              <span>Изход</span>
            </button>
          </div>
        )}
      </div>

      {/* Banner */}
      {bannerMsg && (
        <div
          className={`fixed top-12 right-4 z-50 rounded border px-3 py-1.5 text-xs font-mono shadow-lg ${
            bannerMsg.type === "success"
              ? "border-emerald-500/40 bg-zinc-900 text-emerald-400"
              : "border-red-500/40 bg-zinc-900 text-red-400"
          }`}
        >
          {bannerMsg.text}
        </div>
      )}

      {/* LOGIN VIEW */}
      {!isAuthenticated ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-md border border-zinc-800 bg-[#141417] p-5 space-y-4">
            <div className="flex items-center gap-2 text-zinc-100 font-semibold text-sm">
              <Lock className="h-4 w-4 text-zinc-400" />
              <span>Вход за администратори</span>
            </div>
            <p className="text-xs text-zinc-400">
              Въведете Admin PIN ключ за достъп до тикетите.
            </p>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="Admin PIN..."
                autoFocus
                className="w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:border-zinc-400 focus:outline-none"
              />

              {pinError && (
                <div className="text-[11px] text-red-400 font-mono">{pinError}</div>
              )}

              <button
                type="submit"
                disabled={pinLoading || !pin.trim()}
                className="w-full rounded border border-zinc-200 bg-zinc-100 py-1.5 text-xs font-medium text-zinc-950 hover:bg-zinc-200 transition-colors"
              >
                {pinLoading ? "Проверка..." : "Влез"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        /* AUTHENTICATED T3 VIEW */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Metrics bar */}
          <div className="border-b border-[#1f1f23] bg-[#0d0e11] px-4 py-2 flex items-center gap-3 text-xs font-mono shrink-0 overflow-x-auto">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                statusFilter === "ALL" ? "bg-zinc-800 text-zinc-100 font-bold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Всички ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter("PENDING")}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                statusFilter === "PENDING" ? "bg-zinc-800 text-amber-400 font-bold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Чакащи ({stats.pending})
            </button>
            <button
              onClick={() => setStatusFilter("IN_PROGRESS")}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                statusFilter === "IN_PROGRESS" ? "bg-zinc-800 text-blue-400 font-bold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              В разработка ({stats.inProgress})
            </button>
            <button
              onClick={() => setStatusFilter("APPROVED")}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                statusFilter === "APPROVED" ? "bg-zinc-800 text-emerald-400 font-bold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Одобрени ({stats.approved})
            </button>
            <button
              onClick={() => setStatusFilter("DISAPPROVED")}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                statusFilter === "DISAPPROVED" ? "bg-zinc-800 text-red-400 font-bold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Отхвърлени ({stats.disapproved})
            </button>
            <button
              onClick={() => setStatusFilter("COMPLETED")}
              className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap ${
                statusFilter === "COMPLETED" ? "bg-zinc-800 text-zinc-200 font-bold" : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Завършени ({stats.completed})
            </button>
          </div>

          {/* Search bar */}
          <div className="border-b border-[#1f1f23] bg-[#09090b] px-4 py-2 shrink-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Търсене по номер на тикет, име, имейл, тема или ръководител..."
                className="w-full rounded border border-zinc-800 bg-[#141417] pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Scrollable ticket list table */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {tickets.length === 0 ? (
              <div className="py-12 text-center text-xs text-zinc-500 font-mono">
                Няма намерени тикети.
              </div>
            ) : (
              tickets.map((t) => {
                const isExpanded = expandedId === t.id;
                return (
                  <div
                    key={t.id}
                    className="rounded border border-zinc-800 bg-[#141417] p-3 text-xs space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-zinc-100">{t.ticketNumber}</span>
                        <span className="font-mono text-zinc-500">[{t.courseNumber}]</span>
                        <span className="text-zinc-300 font-medium">{t.fullName}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={t.status}
                          onChange={(e) => handleStatusChange(t.id, e.target.value)}
                          className="rounded border border-zinc-700 bg-zinc-900 px-2 py-0.5 text-[11px] font-mono text-zinc-200 focus:outline-none"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="APPROVED">APPROVED</option>
                          <option value="DISAPPROVED">DISAPPROVED</option>
                          <option value="IN_PROGRESS">IN_PROGRESS</option>
                          <option value="COMPLETED">COMPLETED</option>
                        </select>

                        <button
                          onClick={() => setExpandedId(isExpanded ? null : t.id)}
                          className="rounded p-1 text-zinc-400 hover:text-white hover:bg-zinc-800"
                        >
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-[11px] text-zinc-400 font-mono">
                      <span>Тема: <strong className="text-zinc-200">{t.ideaTitle}</strong></span>
                      <span>Ръководител: {t.supervisor}</span>
                      <span>Бюджет: {t.offeredBudget} €</span>
                    </div>

                    {isExpanded && (
                      <div className="pt-2 border-t border-zinc-800/80 space-y-3 text-xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 font-mono text-[11px] text-zinc-400">
                          <div>Имейл: <span className="text-zinc-200">{t.email}</span></div>
                          <div>Връзка: <span className="text-zinc-200">{t.commPlatform ? `${t.commPlatform}: ` : ""}{t.commHandle}</span></div>
                          <div>Обхват: <span className="text-zinc-200">{t.scope}</span></div>
                          <div>Коментари: <span className="text-zinc-200">{t.includeCodeComments ? "Да (комисия)" : "Не"}</span></div>
                        </div>

                        {t.ideaDescription && (
                          <div className="rounded border border-zinc-800/80 bg-zinc-900/60 p-2 text-zinc-300 text-xs">
                            {t.ideaDescription}
                          </div>
                        )}

                        {t.additionalNotes && (
                          <div className="rounded border border-zinc-800/80 bg-zinc-900/60 p-2 text-zinc-300 text-xs">
                            <span className="text-zinc-500 font-mono text-[11px] block">Бележки:</span>
                            {t.additionalNotes}
                          </div>
                        )}

                        {/* Internal admin notes */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            defaultValue={t.adminNotes || ""}
                            onBlur={(e) => handleAdminNotesSave(t.id, e.target.value)}
                            placeholder="Вътрешна бележка..."
                            className="flex-1 rounded border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none"
                          />
                          <button
                            onClick={(e) => {
                              const input = (e.currentTarget.previousElementSibling as HTMLInputElement)?.value;
                              handleAdminNotesSave(t.id, input);
                            }}
                            className="rounded border border-zinc-700 bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:text-white"
                          >
                            Запази
                          </button>
                        </div>

                        {/* 1-click Resend Actions */}
                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleSendEmailAction(t.id, "APPROVE_EMAIL")}
                              className="rounded border border-emerald-500/30 bg-emerald-950/20 px-2.5 py-1 text-[11px] font-mono text-emerald-400 hover:bg-emerald-950/40"
                            >
                              Одобри & Изпрати имейл
                            </button>
                            <button
                              onClick={() => handleSendEmailAction(t.id, "DISAPPROVE_EMAIL")}
                              className="rounded border border-red-500/30 bg-red-950/20 px-2.5 py-1 text-[11px] font-mono text-red-400 hover:bg-red-950/40"
                            >
                              Откажи & Изпрати имейл
                            </button>
                            <button
                              onClick={() => {
                                setEmailModalTicket(t);
                                setCustomSubject(`[УКТЦ Дипломна Работа] Относно заявка ${t.ticketNumber}`);
                                setCustomBody(`Здравейте, ${t.fullName},\n\nВъв връзка с вашата дипломна работа "${t.ideaTitle}":\n\n`);
                              }}
                              className="rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-[11px] font-mono text-zinc-300 hover:text-white"
                            >
                              Персонализиран имейл
                            </button>
                          </div>

                          <button
                            onClick={() => handleDeleteTicket(t.id, t.ticketNumber)}
                            className="text-zinc-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Custom Email Modal */}
      {emailModalTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80">
          <div className="w-full max-w-md rounded border border-zinc-800 bg-[#141417] p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-mono text-zinc-200">Имейл до: {emailModalTicket.fullName}</span>
              <button onClick={() => setEmailModalTicket(null)} className="text-zinc-500 hover:text-zinc-200 text-xs font-mono">
                [X]
              </button>
            </div>

            <input
              type="text"
              value={customSubject}
              onChange={(e) => setCustomSubject(e.target.value)}
              placeholder="Тема..."
              className="w-full rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-100 focus:outline-none"
            />

            <textarea
              rows={5}
              value={customBody}
              onChange={(e) => setCustomBody(e.target.value)}
              placeholder="Текст на съобщението..."
              className="w-full rounded border border-zinc-700 bg-zinc-900 p-2.5 text-xs text-zinc-100 focus:outline-none resize-none"
            />

            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={() => setEmailModalTicket(null)}
                className="rounded border border-zinc-800 px-3 py-1 text-xs text-zinc-400 hover:text-zinc-200"
              >
                Отказ
              </button>
              <button
                onClick={handleSendCustomEmail}
                disabled={emailSending}
                className="rounded border border-zinc-200 bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-950 hover:bg-zinc-200"
              >
                {emailSending ? "..." : "Изпрати"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
