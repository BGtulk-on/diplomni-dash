import { z } from "zod";

export const NAME_REGEX = /^[a-zA-Zа-яА-ЯёЁ\s\-\.]{2,40}$/u;
export const COURSE_REGEX = /^[0-9a-zA-Z]{5}$/;

export function countWords(str: string): number {
  if (!str) return 0;
  return str.trim().split(/\s+/).filter(Boolean).length;
}

export function sanitizeText(input: string): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>?/gm, "")
    .replace(/[<>'"]/g, "")
    .trim();
}

export const TicketSubmissionSchema = z.object({
  fullName: z
    .string()
    .min(2, "Въведете първо име (минимум 2 символа)")
    .max(40, "Името не може да надвишава 40 символа")
    .regex(NAME_REGEX, "Моля, въведете валидно име")
    .refine((val) => countWords(val) <= 1, {
      message: "Моля, въведете само първо име",
    }),

  email: z
    .string()
    .email("Моля, въведете коректен имейл адрес")
    .max(100, "Имейл адресът не може да надвишава 100 символа")
    .optional(),

  courseNumber: z
    .string()
    .length(5, "Курсовият код трябва да се състои от точно 5 символа")
    .regex(COURSE_REGEX, "Кодът трябва да съдържа 5 цифри или букви"),

  commPlatform: z
    .string()
    .min(2, "Въведете платформа за връзка")
    .max(50, "Платформата не може да надвишава 50 символа"),

  commHandle: z
    .string()
    .min(2, "Въведете данни за контакт (потребител или номер)")
    .max(80, "Данните за връзка не могат да надвишават 80 символа"),

  hasCustomIdea: z.boolean(),

  ideaTitle: z
    .string()
    .min(5, "Темата на проекта трябва да съдържа минимум 5 символа")
    .max(120, "Темата не може да надвишава 120 символа")
    .refine((val) => countWords(val) <= 20, {
      message: "Темата съдържа твърде много думи (максимум 20)",
    }),

  presetTheme: z.string().max(80).optional().nullable(),

  ideaDescription: z
    .string()
    .max(800, "Описанието не може да надвишава 800 символа")
    .optional()
    .nullable()
    .refine((val) => !val || countWords(val) <= 120, {
      message: "Описанието надвишава лимита от 120 думи",
    }),

  supervisor: z
    .string()
    .min(3, "Името на ръководителя трябва да съдържа минимум 3 символа")
    .max(70, "Името на ръководителя не може да надвишава 70 символа")
    .regex(NAME_REGEX, "Моля, въведете валидно име на ръководител"),

  scope: z.enum(["SOFTWARE_ONLY", "FULL_PACKAGE"]),

  difficulty: z.enum(["BASIC", "STANDARD", "ADVANCED"]),

  includeCodeComments: z.boolean().default(false),

  offeredBudget: z
    .number()
    .int("Бюджетът трябва да бъде цяло число")
    .min(150, "Минималният предложен бюджет е 150 €")
    .max(5000, "Предложеният бюджет надвишава максимално допустимия лимит"),

  additionalNotes: z
    .string()
    .max(600, "Бележките не могат да надвишават 600 символа")
    .optional()
    .nullable()
    .refine((val) => !val || countWords(val) <= 80, {
      message: "Бележките надвишават лимита от 80 думи",
    }),

  website_trap: z.string().max(0, "Bot detected").optional(),
});

export type TicketSubmissionData = z.infer<typeof TicketSubmissionSchema>;

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export function checkRateLimit(
  ip: string,
  limit = 8,
  windowMs = 10 * 60 * 1000
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const existing = rateLimitStore.get(ip);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count };
}
