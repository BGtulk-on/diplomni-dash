"use client";

import { useEffect, useRef } from "react";

interface FiveBoxInputProps {
  value: string;
  onChange: (val: string) => void;
  error?: string;
}

export function FiveBoxInput({ value, onChange, error }: FiveBoxInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Array of 5 chars
  const chars = Array.from({ length: 5 }, (_, i) => value[i] || "");

  // Auto-focus and select first box when component appears
  useEffect(() => {
    requestAnimationFrame(() => {
      const firstEmpty = chars.findIndex((c) => !c);
      const targetIdx = firstEmpty === -1 ? 0 : firstEmpty;
      inputsRef.current[targetIdx]?.focus();
      inputsRef.current[targetIdx]?.select();
    });
  }, []);

  const triggerHaptic = () => {
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      try {
        navigator.vibrate(8);
      } catch {}
    }
  };

  const handleCharChange = (index: number, charVal: string) => {
    const cleaned = charVal.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (!cleaned) {
      // Backspaced or cleared
      const nextChars = [...chars];
      nextChars[index] = "";
      onChange(nextChars.join("").trimEnd());
      return;
    }

    triggerHaptic();

    // Handle single char or paste
    if (cleaned.length === 1) {
      const nextChars = [...chars];
      nextChars[index] = cleaned;
      const combined = nextChars.join("");
      onChange(combined);

      // Auto-focus next input
      if (index < 4) {
        inputsRef.current[index + 1]?.focus();
      }
    } else if (cleaned.length > 1) {
      // Pasted multi-character code
      const pasted = cleaned.slice(0, 5);
      onChange(pasted);
      const nextFocus = Math.min(pasted.length, 4);
      inputsRef.current[nextFocus]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !chars[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 4) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData("text").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (pastedText) {
      const trimmed = pastedText.slice(0, 5);
      onChange(trimmed);
      const targetIndex = Math.min(trimmed.length, 4);
      inputsRef.current[targetIndex]?.focus();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 max-w-full">
        {[0, 1, 2, 3, 4].map((i) => (
          <input
            key={i}
            ref={(el) => {
              inputsRef.current[i] = el;
            }}
            type="text"
            maxLength={1}
            value={chars[i] || ""}
            onChange={(e) => handleCharChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            onPaste={handlePaste}
            className={`h-12 w-11 sm:h-14 sm:w-12 rounded-md border text-center font-mono text-lg sm:text-xl font-bold tracking-wider text-zinc-100 transition-colors focus:border-zinc-400 focus:outline-none ${
              error ? "border-red-500/60 bg-red-950/20" : "border-zinc-800 bg-zinc-900/90 hover:border-zinc-700"
            }`}
          />
        ))}
      </div>
      {error && <p className="text-[12px] text-red-400 font-mono text-center sm:text-left">{error}</p>}
    </div>
  );
}
