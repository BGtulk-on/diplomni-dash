"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Copy,
  AlertCircle,
  MessageSquare,
  Zap,
  Coins,
  ShieldCheck,
} from "lucide-react";
import { FiveBoxInput } from "@/components/FiveBoxInput";
import { PROJECT_THEME_PRESETS, PROJECT_SCOPES, PROJECT_DIFFICULTIES } from "@/lib/constants";
import { countWords, NAME_REGEX, COURSE_REGEX } from "@/lib/security";

interface TicketWizardProps {
  onOpenStatusModal?: () => void;
}

export function TicketWizard({ onOpenStatusModal }: TicketWizardProps) {
  const [currentStep, setCurrentStep] = useState( 0 );   
  const [direction, setDirection] = useState<1 | -1>(1);
  const totalQuestions = 9;

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

  const [fullName, setFullName] = useState("");
  const [courseCode, setCourseCode] = useState("");
  const [commPlatform, setCommPlatform] = useState("");
  const [commHandle, setCommHandle] = useState("");
  const [supervisor, setSupervisor] = useState("");

  const [hasCustomIdea, setHasCustomIdea] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [presetScroled, setPresetScroled] = useState(false);
  const [presetAtEnd, setPresetAtEnd] = useState(false);   
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

  const validateCurrentStep = (): boolean => {
    const errs: Record<string, string> = {};

    if (currentStep === 1) {
      if (!fullName.trim() || fullName.trim().length < 2) {
        errs.fullName = "Въведете име (мин. 2 букви).";
      } else if (!NAME_REGEX.test(fullName.trim())) {
        errs.fullName = "Само букви.";
      } else if (countWords(fullName) > 1) {
        errs.fullName = "Само първо име.";
      }
    } else if (currentStep === 2) {
      if (!courseCode || courseCode.length !== 5 || !COURSE_REGEX.test(courseCode)) {
        errs.courseCode = "Точно 5 знака.";
      }
    } else if (currentStep === 3) {
      if (!commPlatform.trim() || commPlatform.trim().length < 2) {
        errs.commPlatform = "Въведете платформа.";
      }
      if (!commHandle.trim() || commHandle.trim().length < 2) {
        errs.commHandle = "Въведете контакт.";
      }
    } else if (currentStep === 4) {
      if (!supervisor.trim() || supervisor.trim().length < 3) {
        errs.supervisor = "Въведете име на ръководител.";
      } else if (!NAME_REGEX.test(supervisor.trim())) {
        errs.supervisor = "Само букви.";
      }
    } else if (currentStep === 5) {
      if (!ideaTitle.trim() || ideaTitle.trim().length < 5) {
        errs.ideaTitle = "Въведете тема (мин. 5 знака).";
      } else if (countWords(ideaTitle) > 20) {
        errs.ideaTitle = "Максимум 20 думи.";
      }
      if (ideaDescription && countWords(ideaDescription) > 120) {
        errs.ideaDescription = "Максимум 120 думи.";
      }
    } else if (currentStep === 6) {
      if (!scope) errs.scope = "Изберете обхват.";
    } else if (currentStep === 7) {
      if (!difficulty) errs.difficulty = "Изберете трудност.";
    } else if (currentStep === 8) {
      if (!offeredBudget || offeredBudget < 150) {
        errs.offeredBudget = "Минимум 150 €.";
      } else if (offeredBudget > 600) {
        errs.offeredBudget = "Максимум 600 €.";
      }
    } else if (currentStep === 9) {
      if (additionalNotes && countWords(additionalNotes) > 80) {
        errs.additionalNotes = "Максимум 80 думи.";
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
    setCurrentStep((prev) => Math.max(prev- 1, 0));   
  };

  const start_quiz = () => {
    triggerHaptic("light") ;
    setDirection( 1 ) ;   
    setCurrentStep( 1 ) ;


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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      if( currentStep === 0 ){
        e.preventDefault() ;
        start_quiz() ;   
        return ;
      }

      if (currentStep === 3 && !commHandle.trim()) {
        const activeEl = document.activeElement as HTMLElement | null;
        if (activeEl?.getAttribute("placeholder")?.includes("Платформа")) {
          e.preventDefault();
          const nextInput = document.querySelector<HTMLInputElement>(
            '.wizard-card input[placeholder*="Потребителско име"], .wizard-card input[placeholder*="Данни за връзка"]'
          );
          nextInput?.focus();
          return;
        }
      }

      if (currentStep < 10) {
        e.preventDefault();
        handleNext();
      }
    }
  };

  const fluentVariants: Variants = {
    initial: ( dir: number ) => ({
      opacity: 0,
      x: dir > 0 ? 12 : -12,
    }),
    animate: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.20,
        ease: [0.22, 1, 0.36, 1] as const,
      },
      transitionEnd: {
        transform: "none",
      },
    },
    exit: ( dir: number ) => ({
      opacity: 0,
      x: dir > 0 ? -12 : 12,
      transition: {
        duration: 0.15,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    }),
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      const activeInput = document.querySelector<HTMLInputElement>(
        '.wizard-card input[type="text"]:not([name="website_trap"])'
      );
      if (activeInput) {
        activeInput.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [currentStep]);

  return (
    <div
      onKeyDown={handleKeyDown}
      className="min-h-[100dvh] w-full flex flex-col items-center justify-center p-3 sm:p-4 py-5 bg-[#09090b] text-[#f4f4f5]"
    >
      <input
        type="text"
        name="website_trap"
        value={botTrap}
        onChange={(e) => setBotTrap(e.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="text-center mb-4 sm:mb-5 max-w-lg">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white uppercase drop-shadow-[0_0_14px_rgba(255,255,255,0.08)]">   
          ЛЕСНА ДИПЛОМНА
        </h1>
      </div>

      <div className="wizard-card w-full max-w-lg rounded-lg border border-zinc-700/80 bg-[#121215]/80 p-5 sm:p-7 shadow-[0_0_24px_rgba(255,255,255,0.03)] flex flex-col justify-between">
        {currentStep >= 1 && currentStep <= 10 && (
          <div className="mb-5 space-y-1.5 shrink-0">
            <div className="flex items-center justify-between text-xs font-mono text-zinc-300">
              <span className="uppercase tracking-wider text-zinc-400 font-medium">
                {currentStep <= 9 ? `Въпрос ${currentStep} от ${totalQuestions}` : "Преглед"}
              </span>
              <span className="font-semibold text-white">
                {Math.round((Math.min(currentStep, 10) / 10) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden border border-zinc-700/60">
              <motion.div
                className="h-full rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.22)]"   
                initial={false}
                animate={{ width: `${(Math.min(currentStep, 10) / 10) * 100}%` }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] as const }}
              />
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col justify-center">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            {currentStep === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={fluentVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="space-y-5 py-1"
              >
                <div className="space-y-3">
                  <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight leading-snug">
                    Не ти се занимава, нямаш времето или способностите да направиш дипломната си работа?
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                    Няма проблеми! За разумна цена ние ще я направим за теб както <span className="text-white font-bold">ТИ</span> я искаш.
                  </p>
                </div>


                <div className="pt-1">
                  <button
                    type="button"
                    onClick={start_quiz}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white px-5 py-2.5 text-xs sm:text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition-all shadow-[0_0_12px_rgba(255,255,255,0.12)]"   
                  >
                    <span>Спести стрес сега</span>
                    <span className="font-mono">-&gt;</span>


                  </button>
                </div>


              </motion.div>
            )}

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
                  <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    Първо име
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300">
                    Само първо име.
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Мартин"
                    className="w-full rounded-md border border-zinc-700 bg-[#18181c] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-zinc-300 focus:shadow-[0_0_10px_rgba(255,255,255,0.05)] focus:outline-none transition-all"   
                  />
                  {errors.fullName && (
                    <p className="mt-1.5 text-xs text-red-400 font-mono">{errors.fullName}</p>
                  )}
                </div>
              </motion.div>
            )}

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
                  <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    Ученически номер
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300">
                    5 знака:{" "}
                    <span className="font-mono text-emerald-300/90 font-semibold">
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
                  <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    Контакт
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300">
                    Платформа и данни за връзка.
                  </p>
                </div>

                <div className="space-y-3">
                  <div>
                    <input
                      type="text"
                      value={commPlatform}
                      onChange={(e) => setCommPlatform(e.target.value)}
                      placeholder="Платформа (Discord, Telegram...)"
                      autoFocus
                      className="w-full rounded-md border border-zinc-700 bg-[#18181c] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-zinc-300 focus:shadow-[0_0_10px_rgba(255,255,255,0.05)] focus:outline-none transition-all"
                    />
                    {errors.commPlatform && (
                      <p className="mt-1 text-xs text-red-400 font-mono">{errors.commPlatform}</p>
                    )}
                  </div>

                  <div>
                    <input
                      type="text"
                      value={commHandle}
                      onChange={(e) => setCommHandle(e.target.value)}
                      placeholder="Потребителско име или тел."
                      className="w-full rounded-md border border-zinc-700 bg-[#18181c] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-zinc-300 focus:shadow-[0_0_10px_rgba(255,255,255,0.05)] focus:outline-none transition-all"
                    />
                    {errors.commHandle && (
                      <p className="mt-1 text-xs text-red-400 font-mono">{errors.commHandle}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

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
                  <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    Ръководител
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300">
                    Дипломен ръководител.
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    value={supervisor}
                    onChange={(e) => setSupervisor(e.target.value)}
                    placeholder="пр: Гоцева"
                    autoFocus
                    className="w-full rounded-md border border-zinc-700 bg-[#18181c] px-3.5 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-zinc-300 focus:shadow-[0_0_10px_rgba(255,255,255,0.05)] focus:outline-none transition-all"
                  />
                  {errors.supervisor && (
                    <p className="mt-1 text-xs text-red-400 font-mono">{errors.supervisor}</p>
                  )}
                </div>
              </motion.div>
            )}

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
                  <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    Тема на проекта
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300">
                    Изберете или напишете тема.
                  </p>
                </div>

                <div className="relative">
                  <div
                    className={`pointer-events-none absolute top-0 left-0 right-0 h-6 bg-gradient-to-b from-[#101013] via-[#101013]/80 to-transparent backdrop-blur-[2px] [mask-image:linear-gradient(to_bottom,black_35%,transparent_100%)] transition-opacity duration-200 z-10 ${
                      presetScroled ? "opacity-100" : "opacity-0"
                    }`}
                  />

                  <div
                    onScroll={(e) => {
                      const el = e.currentTarget;
                      setPresetScroled( el.scrollTop > 6 );
                      setPresetAtEnd( el.scrollTop + el.clientHeight >= el.scrollHeight - 6 );   
                    }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1 pb-1"
                  >
                    {PROJECT_THEME_PRESETS.map((preset) => {
                      const isSelected = selectedPreset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => handleSelectPreset(preset.id)}
                          className={`rounded-md border p-2.5 text-left transition-all ${
                            isSelected
                              ? "border-zinc-200 bg-zinc-800 text-white shadow-[0_0_10px_rgba(255,255,255,0.06)]"
                              : "border-zinc-700/80 bg-[#18181c] text-zinc-300 hover:border-zinc-500 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 font-medium">
                            <span>{preset.category}</span>
                            {isSelected && <Check className="h-3 w-3 text-white" />}
                          </div>
                          <div className="text-xs sm:text-sm font-medium text-zinc-100 mt-1 leading-snug">
                            {preset.title}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div
                    className={`pointer-events-none absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#101013] via-[#101013]/85 to-transparent backdrop-blur-[2px] [mask-image:linear-gradient(to_top,black_35%,transparent_100%)] transition-opacity duration-200 z-10 ${
                      presetAtEnd ? "opacity-0" : "opacity-100"
                    }`}
                  />
                </div>

                <div>
                  <input
                    type="text"
                    value={ideaTitle}
                    onChange={(e) => setIdeaTitle(e.target.value)}
                    placeholder="Заглавие на темата"
                    className="w-full rounded-md border border-zinc-700 bg-[#18181c] px-3.5 py-2 text-sm text-white placeholder-zinc-500 focus:border-zinc-300 focus:shadow-[0_0_10px_rgba(255,255,255,0.05)] focus:outline-none transition-all"
                  />
                  {errors.ideaTitle && (
                    <p className="mt-1 text-xs text-red-400 font-mono">{errors.ideaTitle}</p>
                  )}
                </div>

                <div>
                  <textarea
                    rows={2}
                    value={ideaDescription}
                    onChange={(e) => setIdeaDescription(e.target.value)}
                    placeholder="Изисквания или насоки (по избор)..."
                    className="w-full rounded-md border border-zinc-700 bg-[#18181c] p-2.5 text-sm text-white placeholder-zinc-500 focus:border-zinc-300 focus:shadow-[0_0_10px_rgba(255,255,255,0.05)] focus:outline-none resize-none transition-all"
                  />
                  {errors.ideaDescription && (
                    <p className="mt-0.5 text-xs text-red-400 font-mono">{errors.ideaDescription}</p>
                  )}
                </div>
              </motion.div>
            )}

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
                  <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    Обхват
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300">
                    Какво да включва проектът.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2.5">
                  {PROJECT_SCOPES.map((sc) => {
                    const isSelected = scope === sc.id;
                    const isExtra = sc.id === "FULL_PACKAGE";

                    return (
                      <button
                        key={sc.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic("selection");
                          setScope(sc.id as "SOFTWARE_ONLY" | "FULL_PACKAGE");
                        }}
                        className={`rounded-md border p-3.5 text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-zinc-200 bg-zinc-800 text-white shadow-[0_0_10px_rgba(255,255,255,0.06)]"
                            : "border-zinc-700/80 bg-[#18181c] text-zinc-300 hover:border-zinc-500 hover:text-white"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <div>
                            <div className="text-sm font-semibold text-zinc-100">{sc.title}</div>
                            <div className="text-xs text-zinc-300 mt-0.5">{sc.subtitle}</div>
                          </div>
                          {isSelected && <Check className="h-4 w-4 text-white shrink-0" />}
                        </div>

                        {isExtra && (
                          <div className="mt-2 flex justify-end w-full">
                            <span className="inline-flex items-center rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-mono font-medium text-amber-200/80 shadow-[0_0_8px_rgba(245,158,11,0.06)]">
                              + към крайната цена
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}

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
                  <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    Сложност
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300">
                    Ниво на проекта.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {PROJECT_DIFFICULTIES.map((diff) => {
                    const isSelected = difficulty === diff.id;
                    const isExtra = diff.id === "STANDARD" || diff.id === "ADVANCED";

                    return (
                      <button
                        key={diff.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic("selection");
                          setDifficulty(diff.id as "BASIC" | "STANDARD" | "ADVANCED");
                        }}
                        className={`rounded-md border p-3 text-left transition-all flex flex-col justify-between ${
                          isSelected
                            ? "border-zinc-200 bg-zinc-800 text-white shadow-[0_0_10px_rgba(255,255,255,0.06)]"
                            : "border-zinc-700/80 bg-[#18181c] text-zinc-300 hover:border-zinc-500 hover:text-white"
                        }`}
                      >
                        <div className="w-full">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-zinc-100">{diff.level}</span>
                              <span className={`text-xs font-mono font-medium rounded border px-2 py-0.5 ${
                                diff.id === "BASIC"
                                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200/80 shadow-[0_0_8px_rgba(16,185,129,0.06)]"
                                  : diff.id === "STANDARD"
                                  ? "border-sky-500/20 bg-sky-500/10 text-sky-200/80 shadow-[0_0_8px_rgba(14,165,233,0.06)]"
                                  : "border-purple-500/20 bg-purple-500/10 text-purple-200/80 shadow-[0_0_8px_rgba(168,85,247,0.06)]"
                              }`}>
                                {diff.targetGrade}
                              </span>
                            </div>
                            {isSelected && <Check className="h-4 w-4 text-white" />}
                          </div>
                          <div className="text-xs text-zinc-300 mt-1 leading-relaxed">
                            {diff.description}
                          </div>
                        </div>

                        {isExtra && (
                          <div className="mt-2 flex justify-end w-full">
                            <span className="inline-flex items-center rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-mono font-medium text-amber-200/80 shadow-[0_0_8px_rgba(245,158,11,0.06)]">
                              + към крайната цена
                            </span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-1 flex items-center justify-center">
                  <label
                    className={`w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border px-3.5 py-2.5 cursor-pointer select-none transition-all ${
                      includeCodeComments
                        ? "border-zinc-200 bg-zinc-800 text-white shadow-[0_0_10px_rgba(255,255,255,0.06)]"
                        : "border-zinc-700/80 bg-[#18181c] text-zinc-300 hover:border-zinc-500 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-4 w-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
                          includeCodeComments
                            ? "border-zinc-200 bg-zinc-100 text-zinc-950"
                            : "border-zinc-500 bg-zinc-900"
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
                        <span className="text-sm font-semibold block leading-tight text-zinc-100">
                          Коментари в кода
                        </span>
                        <span className="text-xs text-zinc-300 block mt-0.5 leading-tight">
                          Пояснения за защитата
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <span className="inline-flex items-center rounded border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-xs font-mono font-medium text-amber-200/80 shadow-[0_0_8px_rgba(245,158,11,0.06)]">
                        + към крайната цена
                      </span>
                    </div>
                  </label>
                </div>
              </motion.div>
            )}

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
                  <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    Бюджет (€)
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300">
                    Предложена сума в евро.
                  </p>
                </div>

                <div className="rounded-md border border-zinc-700 bg-[#18181c] p-4 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-mono text-zinc-300 font-medium">Сума:</span>
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
                        className="w-24 rounded border border-zinc-600 bg-zinc-900 px-2 py-1 text-right text-base font-bold text-emerald-300/90 focus:border-zinc-300 focus:shadow-[0_0_10px_rgba(255,255,255,0.05)] focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"   
                      />
                      <span className="text-sm text-zinc-200 font-bold">€</span>
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
                    className="w-full accent-white cursor-pointer"
                  />
                  <div className="flex justify-between text-xs font-mono text-zinc-400 font-medium">
                    <span>150 €</span>
                    <span>300 €</span>
                    <span>450 €</span>
                    <span>600 €</span>
                  </div>
                </div>
                {errors.offeredBudget && (
                  <p className="text-xs text-red-400 font-mono">{errors.offeredBudget}</p>
                )}
              </motion.div>
            )}

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
                  <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    Допълнително
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300">
                    Бележки или краен срок (по избор).
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 font-medium mb-1.5">
                    <span>Бележки</span>
                    <span>{countWords(additionalNotes)} / 80 думи</span>
                  </div>
                  <textarea
                    rows={4}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Забележки или краен срок..."
                    autoFocus
                    className="w-full rounded-md border border-zinc-700 bg-[#18181c] p-3 text-sm text-white placeholder-zinc-500 focus:border-zinc-300 focus:shadow-[0_0_10px_rgba(255,255,255,0.05)] focus:outline-none resize-none leading-relaxed transition-all"
                  />
                  {errors.additionalNotes && (
                    <p className="mt-1 text-xs text-red-400 font-mono">{errors.additionalNotes}</p>
                  )}
                </div>
              </motion.div>
            )}

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
                  <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    Преглед на заявката
                  </h2>
                </div>

                <div className="rounded-md border border-zinc-700 bg-[#18181c] p-3.5 text-xs font-mono space-y-2.5">
                  <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-zinc-700/80">
                    <div>
                      <span className="text-[11px] text-zinc-400 uppercase font-medium block">Име:</span>
                      <span className="text-zinc-100 font-semibold text-sm">{fullName}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-400 uppercase font-medium block">Курсов код:</span>
                      <span className="text-white font-bold text-sm">{courseCode}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-400 uppercase font-medium block">Служебен имейл:</span>
                      <span className="text-zinc-200 text-xs">{courseCode.toLowerCase()}@uktc-bg.com</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-400 uppercase font-medium block">Връзка:</span>
                      <span className="text-zinc-200 text-xs">{commPlatform ? `${commPlatform}: ` : ""}{commHandle}</span>
                    </div>
                  </div>

                  <div className="pb-2.5 border-b border-zinc-700/80 space-y-1.5">
                    <div>
                      <span className="text-[11px] text-zinc-400 uppercase font-medium block">Тема:</span>
                      <span className="text-white font-medium text-xs sm:text-sm">{ideaTitle}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-400 uppercase font-medium block">Ръководител:</span>
                      <span className="text-zinc-200 text-xs">{supervisor}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[11px] text-zinc-400 uppercase font-medium block">Обхват:</span>
                      <span className="text-zinc-200 font-medium">
                        {scope === "FULL_PACKAGE" ? "Софтуер + Док." : "Софтуер"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-400 uppercase font-medium block">Трудност:</span>
                      <span className="text-zinc-200 font-medium">
                        {difficulty === "BASIC" ? "Базово" : difficulty === "STANDARD" ? "Стандартно" : "Комплексно"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-400 uppercase font-medium block">Коментари:</span>
                      <span className="text-zinc-200 font-medium">
                        {includeCodeComments ? "Да" : "Не"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-zinc-400 uppercase font-medium block">Бюджет:</span>
                      <span className="text-emerald-300/90 font-bold text-sm">{offeredBudget} €</span>
                    </div>
                  </div>
                </div>

                {errors.submit && (
                  <div className="rounded-md border border-red-500/40 bg-red-950/30 p-2.5 text-xs text-red-300 flex items-center gap-1.5">
                    <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
                    <span>{errors.submit}</span>
                  </div>
                )}
              </motion.div>
            )}

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
                  <h2 className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    Номер на тикет
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-300">
                    Ще получите имейл при одобрение.
                  </p>
                </div>

                <div className="rounded-md border border-zinc-600 bg-[#18181c] p-4 text-center space-y-2">
                  <div className="text-xs font-mono uppercase tracking-widest text-zinc-400 font-medium">
                    Номер на тикет
                  </div>
                  <div className="font-mono text-3xl font-bold tracking-wider text-white">
                    {submittedTicket.ticketNumber}
                  </div>
                  <button
                    onClick={copyTicket}
                    className="inline-flex items-center gap-1.5 rounded-md border border-zinc-600 bg-zinc-800 px-3 py-1.5 text-xs font-mono text-white hover:bg-zinc-700 transition-colors"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                        <span>Копирано</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Копирай номер</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-md border border-zinc-700 bg-[#101114] p-3 text-xs font-mono text-zinc-300 space-y-1">
                  <div className="text-white font-medium">Имейл:</div>
                  <div>
                    Изпратен е имейл на <span className="text-zinc-100 font-semibold">{submittedTicket.email}</span>.   
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {currentStep >= 1 && currentStep <= 10 && (
          <div className="pt-5 mt-4 border-t border-zinc-700/80 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handlePrev}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1 text-zinc-300 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors py-2 px-3.5 rounded-md border border-zinc-700 hover:bg-zinc-800 font-medium"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Назад</span>
            </button>

            {currentStep < 10 ? (
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-1 rounded-md border border-zinc-200 bg-white px-5 py-2 text-xs sm:text-sm font-semibold text-zinc-950 hover:bg-zinc-200 transition-all shadow-[0_0_12px_rgba(255,255,255,0.12)]"   
              >
                <span>Напред</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-6 py-2 text-xs sm:text-sm font-semibold text-zinc-950 hover:bg-zinc-200 disabled:opacity-50 transition-all shadow-[0_0_12px_rgba(255,255,255,0.12)]"   
              >
                {isSubmitting ? "Изпращане..." : "Изпрати"}
              </button>
            )}
          </div>
        )}
      </div>

      <div className="w-full max-w-lg sm:max-w-xl mt-4 sm:mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
        <div className="rounded-lg border border-zinc-800/90 bg-[#121215]/80 p-2.5 sm:p-3 text-left shadow-[0_0_14px_rgba(255,255,255,0.02)]">
          <MessageSquare className="h-4 w-4 text-zinc-300" />
          <div className="text-xs font-semibold text-white mt-1.5">Комуникация</div>
          <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
            Директна връзка за всяка идея.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800/90 bg-[#121215]/80 p-2.5 sm:p-3 text-left shadow-[0_0_14px_rgba(255,255,255,0.02)]">
          <Zap className="h-4 w-4 text-zinc-300" />
          <div className="text-xs font-semibold text-white mt-1.5">Бърза изработка</div>
          <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
            Кратки и точни срокове.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800/90 bg-[#121215]/80 p-2.5 sm:p-3 text-left shadow-[0_0_14px_rgba(255,255,255,0.02)]">
          <Coins className="h-4 w-4 text-zinc-300" />
          <div className="text-xs font-semibold text-white mt-1.5">Гъвкава цена</div>
          <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
            По договаряне, без фиксирани суми.
          </p>
        </div>

        <div className="rounded-lg border border-zinc-800/90 bg-[#121215]/80 p-2.5 sm:p-3 text-left shadow-[0_0_14px_rgba(255,255,255,0.02)]">
          <ShieldCheck className="h-4 w-4 text-zinc-300" />
          <div className="text-xs font-semibold text-white mt-1.5">Професионализъм</div>
          <p className="text-[11px] text-zinc-400 mt-0.5 leading-snug">
            Опит и качествено изпълнение.
          </p>
        </div>
      </div>
    </div>
  );
}
