import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

/* ─── Phone formatter (mirrors Momentos smsService) ────────── */
function formatPhone(phone: string, countryCode: string): string {
  let cleaned = phone.trim().replace(/[^\d+]/g, "");
  if (cleaned.startsWith("00")) cleaned = `+${cleaned.slice(2)}`;
  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1).replace(/\D/g, "");
    if (!digits) throw new Error("Invalid phone number");
    if (countryCode && digits.startsWith(`${countryCode}0`))
      return `${countryCode}${digits.slice(countryCode.length + 1)}`;
    return digits;
  }
  const digits = cleaned.replace(/\D/g, "");
  if (!digits) throw new Error("Invalid phone number");
  if (digits.startsWith("0")) return `${countryCode}${digits.slice(1)}`;
  if (digits.length >= 10 && digits.length <= 15) return digits;
  throw new Error("Phone number must include country code");
}

/* ─── Email HTML template ───────────────────────────────────── */
function buildEmailHtml(name: string, familyName: string): string {
  const e = (s: string) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f6f4ef;font-family:Arial,Helvetica,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0"
      style="background:#fff;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">
      <tr><td style="background:#1a1f2e;padding:32px 40px;text-align:center;">
        <p style="margin:0;font-size:11px;letter-spacing:.15em;text-transform:uppercase;color:#f5b950;font-weight:600;">Family Month · 2026</p>
        <h1 style="margin:12px 0 0;font-size:26px;font-weight:700;color:#fff;line-height:1.2;">You're officially in! 🎉</h1>
      </td></tr>
      <tr><td style="padding:36px 40px;">
        <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.7;">Hi <strong>${e(name)}</strong>,</p>
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
          You've been successfully registered for <strong>Family Month 2026</strong>. We're so glad to have you!
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
          style="background:#fdf9f0;border:1px solid #f5d98a;border-radius:10px;margin-bottom:28px;">
          <tr><td style="padding:20px 24px;">
            <p style="margin:0 0 4px;font-size:11px;color:#92793a;text-transform:uppercase;letter-spacing:.1em;font-weight:600;">Your Family</p>
            <p style="margin:0;font-size:20px;font-weight:700;color:#1a1f2e;">${e(familyName)}</p>
            <p style="margin:4px 0 0;font-size:13px;color:#6b7280;">Family Month 2026</p>
          </td></tr>
        </table>
        <p style="margin:0 0 24px;font-size:15px;color:#374151;line-height:1.7;">
          Stay tuned for more details about your family's activities. We can't wait to share this experience with you!
        </p>
        <p style="margin:0;font-size:14px;color:#6b7280;line-height:1.6;">
          With love,<br><strong style="color:#374151;">From Foursquare Jebako</strong>
        </p>
      </td></tr>
      <tr><td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          Powered by <a href="https://usemomentos.xyz" style="color:#9ca3af;">MomentOS</a>
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;
}

/* ─── Main notification action ──────────────────────────────── */
export const sendNotifications = internalAction({
  args: {
    registrationId: v.id("registrations"),
    name:       v.string(),
    email:      v.optional(v.string()),
    phone:      v.optional(v.string()),
    familyName: v.string(),
  },
  handler: async (ctx, args) => {
    const RESEND_API_KEY  = process.env.RESEND_API_KEY  ?? "";
    const TERMII_API_KEY  = process.env.TERMII_API_KEY  ?? "";
    const FROM_EMAIL      = process.env.FROM_EMAIL      ?? "notifications@mail.usemomentos.xyz";
    const FROM_NAME       = process.env.FROM_NAME       ?? "Family Month 2026";
    const TERMII_FROM     = (process.env.TERMII_SMS_FROM    ?? "FamMonth").trim().slice(0, 11);
    const TERMII_CHANNEL  = (process.env.TERMII_SMS_CHANNEL ?? "dnd").trim();
    const COUNTRY_CODE    = (process.env.DEFAULT_PHONE_COUNTRY_CODE ?? "234").replace(/\D/g, "");
    const SMS_TEST_MODE   = ["1","true","yes"].includes((process.env.SMS_TEST_MODE ?? "").toLowerCase());

    let emailSent = false;
    let smsSent   = false;

    /* ── Email via Resend ─────────────────────── */
    if (args.email && RESEND_API_KEY) {
      try {
        const resp = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization:  `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from:    `${FROM_NAME} <${FROM_EMAIL}>`,
            to:      [args.email],
            subject: `You've joined ${args.familyName} – Family Month 2026`,
            html:    buildEmailHtml(args.name, args.familyName),
            text:    `Hi ${args.name}, you've joined ${args.familyName} for Family Month 2026! We're so glad to have you! - From Foursquare Jebako`,
          }),
        });
        const data = await resp.json() as { id?: string; message?: string; name?: string };
        if (resp.ok && data.id) {
          emailSent = true;
          console.log(`[Email] ✅ Sent to ${args.email} — ${data.id}`);
        } else {
          console.error("[Email] ❌", data?.message ?? data?.name);
        }
      } catch (err) {
        console.error("[Email] ❌", err);
      }
    }

    /* ── SMS via Termii ───────────────────────── */
    if (args.phone) {
      if (SMS_TEST_MODE) {
        console.log(`[SMS][MOCK] ✅ To: ${args.phone} — Hi ${args.name.split(" ")[0]}! You joined ${args.familyName}.`);
        smsSent = true;
      } else if (TERMII_API_KEY) {
        try {
          const phone = formatPhone(args.phone, COUNTRY_CODE);
          const first = args.name.split(" ")[0];
          const smsText = `Hi ${first}! You've joined ${args.familyName} for Family Month 2026. We're so glad to have you! - From Foursquare Jebako`;

          // Try primary channel, then fall back to generic if it fails
          const channels = TERMII_CHANNEL === "dnd" ? ["dnd", "generic"] : [TERMII_CHANNEL];
          for (const channel of channels) {
            const resp = await fetch("https://v3.api.termii.com/api/sms/send", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to:      phone,
                from:    TERMII_FROM,
                sms:     smsText,
                type:    "plain",
                channel,
                api_key: TERMII_API_KEY,
              }),
            });
            const data = await resp.json() as { code?: string; message?: string; message_id?: string; balance?: number };
            console.log(`[SMS][${channel}] Termii response:`, JSON.stringify(data));
            const code = `${data.code ?? ""}`.toLowerCase();
            const msg  = `${data.message ?? ""}`.toLowerCase();
            const failed = ["fail","error","invalid","reject"].some(w => code.includes(w) || msg.includes(w));
            smsSent = !failed && (code === "ok" || code === "success" || !!data.message_id || typeof data.balance === "number");
            if (smsSent) {
              console.log(`[SMS] ✅ Sent to ${phone} via ${channel}`);
              break;
            } else {
              console.warn(`[SMS][${channel}] ❌ Failed — "${data.message ?? code}"`);
            }
          }
        } catch (err) {
          console.error("[SMS] ❌ Exception:", err);
        }
      } else {
        console.warn("[SMS] TERMII_API_KEY not set — skipping.");
      }
    }

    /* ── Patch send status back onto the record ── */
    await ctx.runMutation(internal.notifications.updateSendStatus, {
      id: args.registrationId,
      emailSent,
      smsSent,
    });
  },
});

export const updateSendStatus = internalMutation({
  args: {
    id:        v.id("registrations"),
    emailSent: v.boolean(),
    smsSent:   v.boolean(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { emailSent: args.emailSent, smsSent: args.smsSent });
  },
});
