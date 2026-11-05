import { Resend } from "resend";
import { escapeHtml } from "@/lib/security";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM_EMAIL || "Дипломни УКТЦ <onboarding@resend.dev>";
const fallbackEmail = ( process.env.RESEND_TEST_FALLBACK_EMAIL || "" ).trim() ;   

const resendClient = resendApiKey && resendApiKey !== "re_placeholder" ? new Resend(resendApiKey) : null;

interface EmailResult {
  success: boolean;
  id?: string;
  mocked?: boolean;
  error?: string;
  fallbackUsed?: boolean;
  deliveredTo?: string;
}

async function sendWithSandboxFallback(options: {
  to: string;
  subject: string;
  html: string;
  targetDescription?: string;
}): Promise<EmailResult> {
  if (!resendClient) {
    console.log(`[Resend Mock Email] To: ${options.to} | Subject: ${options.subject}`);
    return { success: true, mocked: true, id: `mock-${Date.now()}` };
  }

  try {
    const res = await resendClient.emails.send({
      from: resendFrom,
      to: options.to,
      subject: options.subject,
      html: options.html,
    });

    if (res.data?.id) {
      console.log(`[Resend Success] Email delivered to ${options.to} (ID: ${res.data.id})`);
      return { success: true, id: res.data.id, deliveredTo: options.to };
    }

    if (res.error) {
      console.warn(`[Resend Warning] Direct send to ${options.to} rejected:`, res.error.message);

      const match = res.error.message?.match(/\(([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\)/);
      const targetFallback = match?.[1] || fallbackEmail;

      if (targetFallback && targetFallback.toLowerCase() !== options.to.toLowerCase()) {
        console.log(`[Resend Sandbox Fallback] Delivering to account owner: ${targetFallback}`);

        const sandboxNotice = `
          <div style="background-color: #18181b; border: 1px solid #3f3f46; border-radius: 6px; padding: 12px 14px; margin-bottom: 18px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #a1a1aa; line-height: 1.5;">
            <div style="color: #f4f4f5; font-weight: 600; margin-bottom: 2px;">[ТЕСТОВ РЕЖИМ RESEND]</div>
            Имейлът е генериран за <strong style="color: #e4e4e7;">${options.to}</strong>${options.targetDescription ? ` (${options.targetDescription})` : ""}. Понеже в момента се използва тестовият изпращач <code>${resendFrom}</code> (домейнът <code>uktc-bg.com</code> все още не е верифициран в resend.com/domains), Resend доставя съобщението на верифицирания ви адрес: <strong style="color: #f4f4f5;">${targetFallback}</strong>.
          </div>
        `;

        const modifiedHtml = options.html.replace(
          '<div class="card">',
          `<div class="card">${sandboxNotice}`
        );

        const fallbackRes = await resendClient.emails.send({
          from: resendFrom,
          to: targetFallback,
          subject: `${options.subject} [Тест -> ${targetFallback}]`,
          html: modifiedHtml,
        });

        if (fallbackRes.data?.id) {
          console.log(`[Resend Fallback Success] Delivered to ${targetFallback} (ID: ${fallbackRes.data.id})`);
          return {
            success: true,
            id: fallbackRes.data.id,
            fallbackUsed: true,
            deliveredTo: targetFallback,
          };
        } else if (fallbackRes.error) {
          console.error("[Resend Fallback Error]:", fallbackRes.error);
          return { success: false, error: fallbackRes.error.message };
        }
      }

      return { success: false, error: res.error.message };
    }

    return { success: false, error: "Неизвестен отговор от Resend" };
  } catch (err: unknown) {
    console.error("[Resend Exception]:", err);
    return { success: false, error: err instanceof Error ? err.message : "Грешка при изпращане" };
  }
}

export async function sendTicketConfirmationEmail(data: {
  to: string;
  fullName: string;
  ticketNumber: string;
  courseNumber: string;
  ideaTitle: string;
  difficulty: string;
  scope: string;
  budget: number;
  includeCodeComments?: boolean;
}): Promise<EmailResult> {
  const difficultyMap: Record<string, string> = {
    BASIC: "Базово (лесна 5ца)",
    STANDARD: "Стандартно (лесна 6ца)",
    ADVANCED: "Разширено (за любители)",
  };
  const scopeMap: Record<string, string> = {
    SOFTWARE_ONLY: "Само софтуер",
    FULL_PACKAGE: "Софтуер + Документация",
  };

  const safeName = escapeHtml( data.fullName ) ;
  const safeTicket = escapeHtml( data.ticketNumber ) ;   
  const safeCourse = escapeHtml( data.courseNumber ) ;
  const safeIdea = escapeHtml( data.ideaTitle ) ;


  const html = `
    <!DOCTYPE html>
    <html lang="bg">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Заявка ${safeTicket}</title>
      </head>
      <body style="margin: 0; padding: 24px 12px; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <div class="card" style="max-width: 480px; width: 100%; text-align: left; background-color: #121215; border: 1px solid #27272a; border-radius: 8px; padding: 24px; box-sizing: border-box;">
                <div style="margin-bottom: 16px;">
                  <h1 style="font-size: 16px; font-weight: 600; color: #ffffff; margin: 0 0 4px 0;">
                    Заявката е приета
                  </h1>
                  <p style="font-size: 13px; color: #d4d4d8; margin: 0; line-height: 1.4;">
                    Здравейте, ${safeName}. Ще получите имейл при одобрение.
                  </p>
                </div>

                <div style="background-color: #18181c; border: 1px solid #3f3f46; border-radius: 6px; padding: 14px; text-align: center; margin: 16px 0;">
                  <div style="font-size: 10px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; text-transform: uppercase; letter-spacing: 0.12em; color: #a1a1aa; margin-bottom: 4px;">
                    Номер на тикет
                  </div>
                  <div style="font-size: 24px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-weight: 700; color: #ffffff; letter-spacing: 0.08em;">
                    ${safeTicket}
                  </div>
                </div>

                <div style="background-color: #18181c; border: 1px solid #27272a; border-radius: 6px; padding: 12px 16px; margin-bottom: 16px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px;">
                    <tr>
                      <td style="padding: 4px 0; color: #a1a1aa; font-size: 11px; width: 36%;">Име:</td>
                      <td style="padding: 4px 0; color: #ffffff; font-weight: 500;">${safeName}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #a1a1aa; font-size: 11px;">Курсов код:</td>
                      <td style="padding: 4px 0; color: #ffffff; font-weight: 700;">${safeCourse}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #a1a1aa; font-size: 11px;">Тема:</td>
                      <td style="padding: 4px 0; color: #ffffff; font-weight: 500;">${safeIdea}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #a1a1aa; font-size: 11px;">Сложност:</td>
                      <td style="padding: 4px 0; color: #e4e4e7;">${difficultyMap[data.difficulty] || data.difficulty}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #a1a1aa; font-size: 11px;">Обхват:</td>
                      <td style="padding: 4px 0; color: #e4e4e7;">${scopeMap[data.scope] || data.scope}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #a1a1aa; font-size: 11px;">Коментари:</td>
                      <td style="padding: 4px 0; color: #e4e4e7;">${data.includeCodeComments ? "Да" : "Не"}</td>
                    </tr>
                    <tr>
                      <td style="padding: 4px 0; color: #a1a1aa; font-size: 11px;">Бюджет:</td>
                      <td style="padding: 4px 0; color: #ffffff; font-weight: 700;">${data.budget} €</td>
                    </tr>
                  </table>
                </div>

                <div style="border-top: 1px solid #27272a; margin-top: 18px; padding-top: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; color: #71717a; text-align: center;">
                  УКТЦ 2026 • Автоматично съобщение
                </div>

              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendWithSandboxFallback({
    to: data.to,
    subject: `[УКТЦ] Заявка ${data.ticketNumber}`,
    html,
    targetDescription: `ученик: ${data.fullName}`,
  });
}

export async function sendTicketStatusEmail(data: {
  to: string;
  fullName: string;
  ticketNumber: string;
  status: "APPROVED" | "DISAPPROVED" | "CUSTOM";
  subject?: string;
  customMessage?: string;
}): Promise<EmailResult> {
  const isApproved = data.status === "APPROVED";
  const defaultSubject = isApproved
    ? `[Одобрена] Заявка ${data.ticketNumber}`
    : `[Статус] Заявка ${data.ticketNumber}`;

  const statusColor = isApproved ? "#34d399" : data.status === "DISAPPROVED" ? "#f87171" : "#fbbf24";
  const statusBgDot = isApproved ? "#10b981" : data.status === "DISAPPROVED" ? "#ef4444" : "#f59e0b";
  const statusLabel = isApproved
    ? "Одобрена"
    : data.status === "DISAPPROVED"
    ? "Не е одобрена"
    : "Статус";

  const defaultBody = isApproved
    ? `Заявката ви е <strong>одобрена</strong>.<br /><br />
       Ще се свържем с вас по посочения контакт за уточняване на сроковете и детайлите.`
    : `За съжаление не можем да поемем проекта за посочения период.<br /><br />
       Пожелаваме ви успех с дипломирането.`;

  const safeSubj = escapeHtml( data.subject || defaultSubject ) ;
  const safeName = escapeHtml( data.fullName ) ;   
  const safeTicket = escapeHtml( data.ticketNumber ) ;
  const safeCustomBody = data.customMessage ? escapeHtml( data.customMessage ).replace(/\n/g, "<br />") : defaultBody ;   


  const html = `
    <!DOCTYPE html>
    <html lang="bg">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${safeSubj}</title>
      </head>
      <body style="margin: 0; padding: 24px 12px; background-color: #09090b; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f4f4f5;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <div class="card" style="max-width: 480px; width: 100%; text-align: left; background-color: #121215; border: 1px solid #27272a; border-radius: 8px; padding: 24px; box-sizing: border-box;">
                <div style="margin-bottom: 16px;">
                  <h1 style="font-size: 16px; font-weight: 600; color: #ffffff; margin: 0 0 4px 0;">
                    ${isApproved ? "Заявката е одобрена" : "Статус на заявката"}
                  </h1>
                  <p style="font-size: 13px; color: #d4d4d8; margin: 0; line-height: 1.4;">
                    Здравейте, ${safeName}. Тикет: <strong style="color: #ffffff; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;">${safeTicket}</strong>
                  </p>
                </div>

                <div style="background-color: #18181c; border: 1px solid #27272a; border-radius: 6px; padding: 16px; margin: 16px 0; font-size: 13px; line-height: 1.5; color: #e4e4e7;">
                  ${safeCustomBody}
                </div>

                <div style="border-top: 1px solid #27272a; margin-top: 18px; padding-top: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 10px; color: #71717a; text-align: center;">
                  УКТЦ 2026 • Автоматично съобщение
                </div>

              </div>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return sendWithSandboxFallback({
    to: data.to,
    subject: data.subject || defaultSubject,
    html,
    targetDescription: `ученик: ${data.fullName}`,
  });
}
