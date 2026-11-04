"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap, ShieldCheck, Search, PlusCircle } from "lucide-react";

interface NavbarProps {
  onOpenStatusModal?: () => void;
}

export function Navbar({ onOpenStatusModal }: NavbarProps) {
  const pathname = usePathname();
  const isAdmin = pathname.startsWith("/admin");

  return (
    <header className="sticky top-0 z-40 border-b border-[#1c2233] bg-[#090a0f]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#2a344d] bg-[#121622] text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.15)] group-hover:border-blue-500/50 group-hover:bg-[#161c2c] transition-all">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight text-white text-base">ДИПЛОМНИ УКТЦ</span>
              <span className="rounded-md border border-blue-500/30 bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium tracking-wider text-blue-400">
                2026
              </span>
            </div>
            <p className="text-[11px] text-[#78859e]">Академични & Софтуерни Разработки</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors haptic-press ${
              !isAdmin
                ? "bg-[#181d2b] border border-[#27324b] text-white shadow-sm"
                : "text-[#8e9bb0] hover:bg-[#121622] hover:text-white"
            }`}
          >
            <PlusCircle className="h-3.5 w-3.5 text-blue-400" />
            <span className="hidden sm:inline">Ново Заявление</span>
            <span className="sm:hidden">Форма</span>
          </Link>

          {onOpenStatusModal ? (
            <button
              onClick={onOpenStatusModal}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-[#8e9bb0] hover:bg-[#121622] hover:text-white transition-colors haptic-press border border-transparent hover:border-[#27324b]"
            >
              <Search className="h-3.5 w-3.5 text-[#60a5fa]" />
              <span>Проверка на Статус</span>
            </button>
          ) : (
            <Link
              href="/?checkStatus=true"
              className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium text-[#8e9bb0] hover:bg-[#121622] hover:text-white transition-colors haptic-press border border-transparent hover:border-[#27324b]"
            >
              <Search className="h-3.5 w-3.5 text-[#60a5fa]" />
              <span>Проверка на Статус</span>
            </Link>
          )}

          <Link
            href="/admin"
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors haptic-press border ${
              isAdmin
                ? "bg-blue-600/20 border-blue-500/40 text-blue-300"
                : "border-[#222a3d] bg-[#10141f] text-[#8e9bb0] hover:border-[#2f3b56] hover:text-white"
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">Администрация</span>
            <span className="sm:hidden">Админ</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
