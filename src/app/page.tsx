"use client";

import { useState } from "react";
import { TicketWizard } from "@/components/TicketWizard";
import { StatusCheckerModal } from "@/components/StatusCheckerModal";

export default function HomePage() {
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  return (
    <main className="min-h-[100dvh] w-screen overflow-x-hidden overflow-y-auto bg-[#09090b] text-[#f4f4f5]">
      {/* Non-scrollable single-question wizard without headers or marketing banners */}
      <TicketWizard onOpenStatusModal={() => setIsStatusOpen(true)} />

      {/* Clean status checker modal */}
      <StatusCheckerModal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} />
    </main>
  );
}
