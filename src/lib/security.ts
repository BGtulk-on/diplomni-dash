import { z } from "zod";

export const NAME_REGEX = /^[a-zA-Zа-яА-ЯёЁ\s\-\.]{2,40}$/u;
export const COURSE_REGEX = /^[0-9]{5}$/;   
export const VALID_STATUSES = ["PENDING", "APPROVED", "DISAPPROVED", "IN_PROGRESS", "COMPLETED"] as const ;


export function countWords(str: string): number {
  if (!str) return 0;
  const w_list = str.trim().split(/\s+/).filter(Boolean) ;   
  return w_list.length;
}

export function sanitizeText(input: string): string {
  if (!input) return "";
  return input
    .replace(/<[^>]*>?/gm, "")
    .replace(/[<>'"]/g, "")
    .trim();
}


export function escapeHtml( str_in: string ): string {
  if( !str_in ) return "" ;   
  return str_in
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;") ;   


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
    .length(5, "Курсовият код трябва да се състои от точно 5 цифри")
    .regex(COURSE_REGEX, "Кодът трябва да съдържа точно 5 цифри"),

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
    .max(600, "Максималният предложен бюджет е 600 €"),   

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

export const AdminTicketPatchSchema = z.object({
  status: z.enum( VALID_STATUSES ).optional(),
  adminNotes: z.string().max( 1000, "Бележките са твърде дълги" ).optional().nullable(),   
});


export const AdminEmailActionSchema = z.object({
  action: z.enum(["APPROVE_EMAIL", "DISAPPROVE_EMAIL", "CUSTOM_EMAIL"]),
  customSubject: z.string().max( 150 ).optional(),
  customMessage: z.string().max( 3000 ).optional(),
});   



export function getClientIp( reqHeaders: Headers ): string {
  const real_ip = reqHeaders.get("x-real-ip")?.trim() ;   
  if( real_ip ) return real_ip ;

  const fwd = reqHeaders.get("x-forwarded-for") ;
  if( fwd ){
    const first_ip = fwd.split(",")[0]?.trim() ;   
    if( first_ip ) return first_ip ;
  }


  return "127.0.0.1" ;
}

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

  if( rateLimitStore.size > 500 ){
    for( const [k, v_rec] of rateLimitStore.entries() ){
      if( now > v_rec.resetAt ) rateLimitStore.delete( k ) ;   
    }

  }

  const existing = rateLimitStore.get(ip);

  if (!existing || now > existing.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now+ windowMs });   
    return { allowed: true, remaining: limit - 1 };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count };
}



