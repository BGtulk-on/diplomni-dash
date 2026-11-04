"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Copy,
  AlertCircle,
} from "lucide-react";
import { FiveBoxInput } from "@/components/FiveBoxInput";
import { PROJECT_THEME_PRESETS, PROJECT_SCOPES, PROJECT_DIFFICULTIES } from "@/lib/constants";
import { countWords, NAME_REGEX, COURSE_REGEX } from "@/lib/security";

interface TicketWizardProps {
  onOpenStatusModal?: () => void;
}

export function TicketWizard({ onOpenStatusModal }: TicketWizardProps) {
  // Total 9 question steps + 1 review + 1 confirmation screen
  // 1: Name (First name)
  // 2: 5-symbol code (email is auto-derived as code@uktc-bg.com)
  // 3: Начин за връзка
  // 4: Дипломен ръководител
  // 5: Тема на проекта
  // 6: Обхват (софтуер / софтуер + документация)
  // 7: Ниво на сложност
  // 8: Бюджет
  // 9: Допълнителна информация
  // 10: Преглед
  // 11: Потвърждение
  const [currentStep, setCurrentStep] = useState(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const totalQuestions = 9;

  // Haptic feedback helper for mobile and touch interactions
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

  // Form State
  const [fullName, setFullName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [commPlatform, setCommPlatform] = useState("");
  const [commHandle, setCommHandle] = useState("");
  const [supervisor, setSupervisor] = useState("");

  const [hasCustomIdea, setHasCustomIdea] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaDescription, setIdeaDescription] = useState("");

  const [scope, setScope] = useState<"SOFTWARE_ONLY" | "FULL_PACKAGE">("FULL_PACKAGE");
  const [difficulty, setDifficulty] = useState<"BASIC" | "STANDARD" | "ADVANCED">("STANDARD");
  const [includeCodeComments, setIncludeCodeComments] = useState(false);
  const [offeredBudget, setOfferedBudget] = useState<number>(300);
  const [additionalNotes, setAdditionalNotes] = useState("");

  const [botTrap, setBotTrap] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<{
    ticketNumber: string;
    fullName: string;
    email: string;
    courseNumber: string;
    commPlatform: string;
    commHandle: string;
    ideaTitle: string;
    scope: string;
    difficulty: string;
    includeCodeComments: boolean;
    offeredBudget: number;
  } | null>(null);

  // Single step validator
  const validateCurrentStep = (): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!fullName.trim() || fullName.trim().length < 2) {
        errs.fullName = "Въведете вашето първо име (минимум 2 символа).";
      } else if (!NAME_REGEX.test(fullName.trim())) {
        errs.fullName = "Името трябва да съдържа само букви.";
      } else if (countWords(fullName) > 1) {
        errs.fullName = "Моля, въведете само първо име (без фамилия).";
      }
    } else if (currentStep === 2) {
      if (!courseCode || courseCode.length !== 5 || !COURSE_REGEX.test(courseCode)) {
        errs.courseCode = "Въведете точно 5 символа в полетата (букви или цифри).";
      }
    } else if (currentStep === 3) {
      if (!commPlatform.trim() || commPlatform.trim().length < 2) {
        errs.commPlatform = "Въведете платформа за връзка (напр. Discord, Telegram).";
      }
      if (!commHandle.trim() || commHandle.trim().length < 2) {
        errs.commHandle = "Въведете потребителско име или номер за контакт.";
      }
    } else if (currentStep === 4) {
      if (!supervisor.trim() || supervisor.trim().length < 3) {
        errs.supervisor = "Въведете името на вашия дипломен ръководител.";
      } else if (!NAME_REGEX.test(supervisor.trim())) {
        errs.supervisor = "Името на ръководителя трябва да съдържа само букви.";
      }
    } else if (currentStep === 5) {
      if (!ideaTitle.trim() || ideaTitle.trim().length < 5) {
        errs.ideaTitle = "Въведете или изберете тема на проекта (минимум 5 символа).";
      } else if (countWords(ideaTitle) > 20) {
        errs.ideaTitle = "Заглавието надвишава лимита от 20 думи.";
      }
      if (ideaDescription && countWords(ideaDescription) > 120) {
        errs.ideaDescription = "Описанието надвишава лимита от 120 думи.";
      }
    } else if (currentStep === 6) {
      if (!scope) errs.scope = "Изберете обхват на проекта.";
    } else if (currentStep === 7) {
      if (!difficulty) errs.difficulty = "Изберете ниво на трудност.";
    } else if (currentStep === 8) {
      if (!offeredBudget || offeredBudget < 150) {
        errs.offeredBudget = "Минималният предложен бюджет е 150 €.";
      } else if (offeredBudget > 600) {
        errs.offeredBudget = "Максималният предложен бюджет е 600 €.";
      }
    } else if (currentStep === 9) {
      if (additionalNotes && countWords(additionalNotes) > 80) {
        errs.additionalNotes = "Бележките не могат да надвишават 80 думи.";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      triggerHaptic("light");
      setDirection(1);
      setErrors({});
      setCurrentStep((prev) => Math.min(prev + 1, 10));
    } else {
      triggerHaptic("error");
    }
  };

  const handlePrev = () => {
    triggerHaptic("selection");
    setDirection(-1);
    setErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSelectPreset = (presetId: string) => {
    triggerHaptic("selection");
    setSelectedPreset(presetId);
    const found = PROJECT_THEME_PRESETS.find((p) => p.id === presetId);
    if (found && found.id !== "custom") {
      setHasCustomIdea(false);
      setIdeaTitle(found.title);
      if (!ideaDescription) setIdeaDescription(found.summary);
    } else {
      setHasCustomIdea(true);
      if (selectedPreset !== "custom") {
        setIdeaTitle("");
        setIdeaDescription("");
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrors({});

    try {
      const derivedEmail = `${courseCode.trim().toLowerCase()}@uktc-bg.com`;

      const payload = {
        fullName: fullName.trim(),
        email: derivedEmail,
        courseNumber: courseCode.trim().toUpperCase(),
        commPlatform: commPlatform.trim(),
        commHandle: commHandle.trim(),
        supervisor: supervisor.trim(),
        hasCustomIdea,
        ideaTitle: ideaTitle.trim(),
        presetTheme: selectedPreset,
        ideaDescription: ideaDescription.trim() || null,
        scope,
        difficulty,
        includeCodeComments,
        offeredBudget: Number(offeredBudget),
        additionalNotes: additionalNotes.trim() || null,
        website_trap: botTrap,
      };

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        triggerHaptic("error");
        setErrors({ submit: data.error || "Възникна грешка при обработка на заявката." });
      } else {
        triggerHaptic("success");
        setSubmittedTicket({
          ticketNumber: data.ticketNumber,
          fullName: payload.fullName,
          email: derivedEmail,
          courseNumber: payload.courseNumber,
          commPlatform: payload.commPlatform,
          commHandle: payload.commHandle,
          ideaTitle: payload.ideaTitle,
          scope: payload.scope,
          difficulty: payload.difficulty,
          includeCodeComments: payload.includeCodeComments,
          offeredBudget: payload.offeredBudget,
        });
        setDirection(1);
        setCurrentStep(11);
      }
    } catch {
      triggerHaptic("error");
      setErrors({ submit: "Грешка при връзка със сървъра. Опитайте отново." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyTicket = () => {
    if (submittedTicket) {
      navigator.clipboard.writeText(submittedTicket.ticketNumber);
      triggerHaptic("success");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Keyboard enter to proceed
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if (currentStep === 3 && !commHandle.trim()) {
        const activeEl = document.activeElement as HTMLElement | null;
        if (activeEl?.getAttribute("placeholder")?.includes("Платформа")) {
          e.preventDefault();
          const nextInput = document.querySelector<HTMLInputElement>(
            '.wizard-card input[placeholder*="Данни за връзка"]'
          );
          nextInput?.focus();
          nextInput?.select();
          return;
        }
      }

      if (currentStep < 10) {
        e.preventDefault();
        handleNext();
      }
    }
  };

  // Fluent directional transition variants
  const fluentVariants: Variants = {
    initial: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? 14 : -14,
      scale: 0.99,
    }),
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    },
    exit: (dir: number) => ({
      opacity: 0,
      x: dir > 0 ? -14 : 14,
      scale: 0.99,
      transition: {
        duration: 0.16,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    }),
  };

  // Auto-focus and select the active input ONLY ONCE when step changes/appears
  useEffect(() => {
    const timer = setTimeout(() => {
      const activeInput = document.querySelector<HTMLInputElement>(
        '.wizard-card input[type="text"]:not([name="website_trap"])'
      );
      if (activeInput) {
        activeInput.focus();
        activeInput.select();
      }
    }, 60);
    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div
      onKeyDown={handleKeyDown}
      className="h-[100dvh] w-screen overflow-hidden flex items-center justify-center p-3 sm:p-4 bg-[#09090b] text-[#f4f4f5] select-none"
    >
      {/* Hidden honeypot */}
      <input
        type="text"
        name="website_trap"
        value={botTrap}
        onChange={(e) => setBotTrap(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      {/* Main Centered Box with fluid mobile support */}
      <div className="wizard-card w-full max-w-lg rounded-md border border-zinc-800 bg-[#141417] p-4 sm:p-6 shadow-2xl flex flex-col justify-between max-h-[92dvh] overflow-y-auto">
        {/* Sleek animated progress bar replacing 01/9, 02/9... */}
        {currentStep <= 10 && (
          <div className="mb-4 space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="uppercase tracking-wider text-zinc-500">
                {currentStep <= 9 ? `Въпрос ${currentStep} от ${totalQuestions}` : "Финално потвърждение"}
              </span>
              <span className="font-semibold text-zinc-300">
                {Math.round((Math.min(currentStep, 10) / 10) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-800/80 overflow-hidden border border-zinc-800/80">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-zinc-400 via-zinc-200 to-white"
                initial={false}
                animate={{ width: `${(Math.min(currentStep, 10) / 10) * 100}%` }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] as const }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            {/* 1. FIRST NAME */}
            {currentStep === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={fluentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Първо име
                  </h2>
                  <p className="text-[12px] text-zinc-400">
                    Въведете само вашето първо име.
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Мартин"
                    autoFocus
                    className="w-full rounded border border-zinc-800 bg-[#18181b] px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
                  />
                  {errors.fullName && (
                    <p className="mt-1.5 text-[12px] text-red-400 font-mono">{errors.fullName}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* 2. COURSE NUMBER (5 BOXES) */}
            {currentStep === 2 && (
              <motion.div
                key="step-2"
                custom={direction}
                variants={fluentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Ученически номер (5 символа)
                  </h2>
                  <p className="text-[12px] text-zinc-400">
                    Въведете вашия 5-цифрен номер:{" "}
                    <span className="font-mono text-zinc-200">
                      {courseCode ? `${courseCode.toLowerCase()}@uktc-bg.com` : "xxxxx@uktc-bg.com"}
                    </span>
                  </p>
                </div>

                <div className="pt-1">
                  <FiveBoxInput
                    value={courseCode}
                    onChange={(val) => setCourseCode(val)}
                    error={errors.courseCode}
                  />
                </div>
              </motion.div>
            )}

            {/* 3. НАЧИН ЗА ВРЪЗКА */}
            {currentStep === 3 && (
              <motion.div
                key="step-3"
                custom={direction}
                variants={fluentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Начин за връзка
                  </h2>
                  <p className="text-[12px] text-zinc-400">
                    Въведете платформа и данни за връзка.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={commPlatform}
                      onChange={(e) => setCommPlatform(e.target.value)}
                      placeholder="Платформа (напр. Discord, Telegram, Телефон, Viber)"
                      autoFocus
                      className="w-full rounded border border-zinc-800 bg-[#18181b] px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
                    />
                    {errors.commPlatform && (
                      <p className="mt-1 text-[11px] text-red-400 font-mono">{errors.commPlatform}</p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      value={commHandle}
                      onChange={(e) => setCommHandle(e.target.value)}
                      placeholder="Данни за връзка (потребителско име или номер)"
                      className="w-full rounded border border-zinc-800 bg-[#18181b] px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
                    />
                    {errors.commHandle && (
                      <p className="mt-1 text-[11px] text-red-400 font-mono">{errors.commHandle}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* 4. SUPERVISOR */}
            {currentStep === 4 && (
              <motion.div
                key="step-4"
                custom={direction}
                variants={fluentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Дипломен ръководител
                  </h2>
                  <p className="text-[12px] text-zinc-400">
                    Име на вашия преподавател / ръководител.
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                    placeholder="пр: Гоцева"
                    autoFocus
                    className="w-full rounded border border-zinc-800 bg-[#18181b] px-3.5 py-2.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
                  />
                  {errors.supervisor && (
                    <p className="mt-1 text-[12px] text-red-400 font-mono">{errors.supervisor}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* 5. PROJECT THEME / PRESETS */}
            {currentStep === 5 && (
              <motion.div
                key="step-5"
                custom={direction}
                variants={fluentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-3"
              >
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Тема на дипломната работа
                  </h2>
                  <p className="text-[12px] text-zinc-400">
                    Изберете шаблон или напишете собствена тема.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                  {PROJECT_THEME_PRESETS.map((preset) => {
                    const isSelected = selectedPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.id)}
                        className={`rounded border p-2 text-left transition-colors ${
                          isSelected
                            ? "border-zinc-400 bg-zinc-800/80 text-zinc-100"
                            : "border-zinc-800 bg-[#18181b] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                          <span>{preset.category}</span>
                          {isSelected && <Check className="h-2.5 w-2.5 text-zinc-200" />}
                        </div>
                        <div className="text-[11px] font-medium text-zinc-200 mt-0.5 leading-snug">
                          {preset.title}
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div>
                  <input
                    type="text"
                    value={ideaTitle}
                    onChange={(e) => setIdeaTitle(e.target.value)}
                    placeholder="Заглавие на темата"
                    className="w-full rounded border border-zinc-800 bg-[#18181b] px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none"
                  />
                  {errors.ideaTitle && (
                    <p className="mt-1 text-[11px] text-red-400 font-mono">{errors.ideaTitle}</p>
                  )}
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={ideaDescription}
                    onChange={(e) => setIdeaDescription(e.target.value)}
                    placeholder="Специфични изисквания или насоки (опционално)..."
                    className="w-full rounded border border-zinc-800 bg-[#18181b] p-2 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none resize-none"
                  />
                  {errors.ideaDescription && (
                    <p className="mt-0.5 text-[11px] text-red-400 font-mono">{errors.ideaDescription}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* 6. SCOPE */}
            {currentStep === 6 && (
              <motion.div
                key="step-6"
                custom={direction}
                variants={fluentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Обхват на разработката
                  </h2>
                  <p className="text-[12px] text-zinc-400">
                    Изберете дали желаете проектът да включва и дипломна документация.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {PROJECT_SCOPES.map((sc) => {
                    const isSelected = scope === sc.id;
                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic("selection");
                          setScope(sc.id as "SOFTWARE_ONLY" | "FULL_PACKAGE");
                        }}
                        className={`rounded border p-3 text-left transition-colors flex items-center justify-between ${
                          isSelected
                            ? "border-zinc-400 bg-zinc-800/80 text-zinc-100"
                            : "border-zinc-800 bg-[#18181b] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <div>
                          <div className="text-xs font-semibold text-zinc-100">{sc.title}</div>
                          <div className="text-[11px] text-zinc-400 mt-0.5">{sc.subtitle}</div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-zinc-100 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* 7. DIFFICULTY */}
            {currentStep === 7 && (
              <motion.div
                key="step-7"
                custom={direction}
                variants={fluentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-3"
              >
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Ниво на сложност
                  </h2>
                  <p className="text-[12px] text-zinc-400">
                    Изберете очакваното ниво на сложност за софтуера.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {PROJECT_DIFFICULTIES.map((diff) => {
                    const isSelected = difficulty === diff.id;
                    return (
                      <button
                        key={diff.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic("selection");
                          setDifficulty(diff.id as "BASIC" | "STANDARD" | "ADVANCED");
                        }}
                        className={`rounded border p-2.5 text-left transition-colors ${
                          isSelected
                            ? "border-zinc-400 bg-zinc-800/80 text-zinc-100"
                            : "border-zinc-800 bg-[#18181b] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-zinc-100">{diff.level}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-zinc-200" />}
                        </div>
                        <div className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">
                          {diff.description}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Centered Checkbox matching T3 Code design */}
                <div className="pt-1 flex items-center justify-center">
                  <label
                    className={`w-full flex items-center justify-center gap-3 rounded border px-3.5 py-2.5 cursor-pointer select-none transition-colors ${
                      includeCodeComments
                        ? "border-zinc-400 bg-zinc-800/80 text-zinc-100"
                        : "border-zinc-800 bg-[#18181b] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                    }`}
                  >
                    <div
                      className={`h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                        includeCodeComments
                          ? "border-zinc-200 bg-zinc-100 text-zinc-950"
                          : "border-zinc-700 bg-zinc-900"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={includeCodeComments}
                        onChange={(e) => {
                          triggerHaptic("selection");
                          setIncludeCodeComments(e.target.checked);
                        }}
                        className="sr-only"
                      />
                      {includeCodeComments && <Check className="h-3 w-3 stroke-[3]" />}
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-semibold block leading-tight">
                        Коментари в кода за подготовка и защита
                      </span>
                      <span className="text-[10px] text-zinc-400 block mt-0.5 leading-tight">
                        Специално съобразени с въпросите, които комисията ще зададе
                      </span>
                    </div>
                  </label>
                </div>
              </motion.div>
            )}

            {/* 8. BUDGET */}
            {currentStep === 8 && (
              <motion.div
                key="step-8"
                custom={direction}
                variants={fluentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Предлагана сума (€)
                  </h2>
                  <p className="text-[12px] text-zinc-400">
                    Сумата в евро, която сте готови да заплатите за проекта.
                  </p>
                </div>

                <div className="rounded border border-zinc-800 bg-[#18181b] p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-zinc-400">Сума:</span>
                    <div className="flex items-center gap-1.5 font-mono">
                      <input
                        type="number"
                        min={150}
                        max={600}
                        step={10}
                        value={offeredBudget}
                        onChange={(e) => {
                          triggerHaptic("selection");
                          setOfferedBudget(Number(e.target.value));
                        }}
                        autoFocus
                        className="w-24 rounded border border-zinc-700 bg-zinc-900 px-2 py-1 text-right text-sm font-bold text-zinc-100 focus:border-zinc-400 focus:outline-none"
                      />
                      <span className="text-xs text-zinc-300 font-bold">€</span>
                    </div>
                  </div>

                  <input
                    type="range"
                    min={150}
                    max={600}
                    step={10}
                    value={offeredBudget}
                    onChange={(e) => {
                      triggerHaptic("selection");
                      setOfferedBudget(Number(e.target.value));
                    }}
                    className="w-full accent-zinc-200 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500">
                    <span>150 €</span>
                    <span>300 €</span>
                    <span>450 €</span>
                    <span>600 €</span>
                  </div>
                </div>
                {errors.offeredBudget && (
                  <p className="text-[12px] text-red-400 font-mono">{errors.offeredBudget}</p>
                )}
              </motion.div>
            )}

            {/* 9. ADDITIONAL INFO / QUESTIONS */}
            {currentStep === 9 && (
              <motion.div
                key="step-9"
                custom={direction}
                variants={fluentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <div className="space-y-1">
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Допълнителна информация
                  </h2>
                  <p className="text-[12px] text-zinc-400">
                    Малък параграф за крайни срокове или специфични изисквания (опционално).
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 mb-1">
                    <span>Бележки</span>
                    <span>{countWords(additionalNotes)} / 80 думи</span>
                  </div>
                  <textarea
                    rows={4}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Напишете ваши забележки или краен срок..."
                    autoFocus
                    className="w-full rounded border border-zinc-800 bg-[#18181b] p-3 text-xs text-zinc-100 placeholder-zinc-600 focus:border-zinc-500 focus:outline-none resize-none leading-relaxed"
                  />
                  {errors.additionalNotes && (
                    <p className="mt-1 text-[12px] text-red-400 font-mono">{errors.additionalNotes}</p>
                  )}
                </div>
              </motion.div>
            )}

            {/* 10. REVIEW & FINAL CONFIRMATION */}
            {currentStep === 10 && (
              <motion.div
                key="step-10"
                custom={direction}
                variants={fluentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-3"
              >
                <div className="space-y-0.5">
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Потвърждение на заявката
                  </h2>
                </div>

                <div className="rounded border border-zinc-800 bg-[#18181b] p-3 text-xs font-mono space-y-2">
                  <div className="grid grid-cols-2 gap-2 pb-2 border-b border-zinc-800">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Име:</span>
                      <span className="text-zinc-200 font-medium">{fullName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Курсов код:</span>
                      <span className="text-zinc-200 font-bold">{courseCode}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Служебен имейл:</span>
                      <span className="text-zinc-200">{courseCode.toLowerCase()}@uktc-bg.com</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Връзка:</span>
                      <span className="text-zinc-200">{commPlatform ? `${commPlatform}: ` : ""}{commHandle}</span>
                    </div>
                  </div>

                  <div className="pb-2 border-b border-zinc-800 space-y-1">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Тема:</span>
                      <span className="text-zinc-100 font-medium">{ideaTitle}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Ръководител:</span>
                      <span className="text-zinc-300">{supervisor}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Обхват:</span>
                      <span className="text-zinc-300">
                        {scope === "FULL_PACKAGE" ? "Софтуер + Док." : "Софтуер"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Трудност:</span>
                      <span className="text-zinc-300">
                        {difficulty === "BASIC" ? "Базово" : difficulty === "STANDARD" ? "Стандартно" : "Комплексно"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Коментари:</span>
                      <span className="text-zinc-300">
                        {includeCodeComments ? "Да (комисия)" : "Не"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-500 block">Бюджет:</span>
                      <span className="text-zinc-100 font-bold">{offeredBudget} €</span>
                    </div>
                  </div>
                </div>

                {errors.submit && (
                  <div className="rounded border border-red-500/30 bg-red-950/20 p-2 text-xs text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{errors.submit}</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* 11. TICKET CONFIRMATION SCREEN */}
            {currentStep === 11 && submittedTicket && (
              <motion.div
                key="step-11"
                custom={direction}
                variants={fluentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-4"
              >
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 uppercase tracking-wider">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    Заявката е приета
                  </div>
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Уникален номер на заявката
                  </h2>
                  <p className="text-[12px] text-zinc-400">
                    Ще получите последващ имейл веднага след одобрението на проекта.
                  </p>
                </div>

                <div className="rounded border border-zinc-700 bg-[#18181b] p-4 text-center space-y-2">
                  <div className="text-[11px] font-mono uppercase tracking-widest text-zinc-500">
                    Номер на тикет
                  </div>
                  <div className="font-mono text-2xl font-bold tracking-wider text-zinc-100">
                    {submittedTicket.ticketNumber}
                  </div>
                  <button
                    onClick={copyTicket}
                    className="inline-flex items-center gap-1.5 rounded border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-mono text-zinc-200 hover:bg-zinc-700 hover:text-white transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-emerald-400" />
                        <span>Копирано</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        <span>Копирай номер</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded border border-zinc-800 bg-[#101114] p-3 text-xs font-mono text-zinc-400 space-y-1">
                  <div className="text-zinc-300 font-medium">Потвърждение по имейл:</div>
                  <div>
                    Изпратено е официално системно писмо на вашия училищен адрес <span className="text-zinc-200">{submittedTicket.email}</span>.
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => {
                      setSubmittedTicket(null);
                      setCurrentStep(1);
                      setFullName("");
                      setCourseCode("");
                      setCommPlatform("");
                      setCommHandle("");
                      setSupervisor("");
                      setIdeaTitle("");
                      setIdeaDescription("");
                      setIncludeCodeComments(false);
                      setOfferedBudget(300);
                      setAdditionalNotes("");
                    }}
                    className="flex-1 rounded border border-zinc-800 bg-[#18181b] py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                  >
                    Подай нова заявка
                  </button>
                  {onOpenStatusModal && (
                    <button
                      onClick={onOpenStatusModal}
                      className="flex-1 rounded border border-zinc-200 bg-zinc-100 py-2 text-xs font-medium text-zinc-950 hover:bg-zinc-200 transition-colors"
                    >
                      Провери статус
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Action Buttons: Embedded directly inside the center card */}
        {currentStep <= 10 && (
          <div className="pt-5 mt-4 border-t border-zinc-800/80 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handlePrev}
              disabled={currentStep === 1 || isSubmitting}
              className="inline-flex items-center gap-1 text-zinc-400 hover:text-zinc-100 disabled:opacity-30 disabled:pointer-events-none transition-colors py-1.5 px-3 rounded border border-zinc-800 hover:bg-zinc-800/50"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Назад</span>
            </button>

            {currentStep < 10 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1 rounded border border-zinc-200 bg-zinc-50 px-4 py-1.5 text-xs font-medium text-zinc-950 hover:bg-zinc-200 transition-colors"
              >
                <span>Напред</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded border border-zinc-200 bg-zinc-50 px-5 py-1.5 text-xs font-medium text-zinc-950 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Регистриране..." : "Потвърди и Изпрати"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
