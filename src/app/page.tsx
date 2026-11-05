"use client";

import { useState } from "react";
import { TicketWizard } from "@/components/TicketWizard";
import { StatusCheckerModal } from "@/components/StatusCheckerModal";

export default function HomePage() {
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  return (
    <main className="min-h-[100dvh] w-screen overflow-x-hidden overflow-y-auto bg-[#09090b] text-[#f4f4f5]">
      <TicketWizard onOpenStatusModal={() => setIsStatusOpen(true)} />

      <StatusCheckerModal isOpen={isStatusOpen} onClose={() => setIsStatusOpen(false)} />
    </main>
  );
}
