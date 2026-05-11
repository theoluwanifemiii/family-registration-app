import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { Resend } from "resend";
import axios from "axios";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app  = express();
const PORT = process.env.PORT || 3001;

/* ─── CORS ─────────────────────────────────────────────────── */
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://localhost:3001")
  .split(",").map(o => o.trim()).filter(Boolean);

app.use(cors({
  origin: (origin, cb) => (!origin || allowedOrigins.includes(origin) ? cb(null, true) : cb(new Error("Not allowed by CORS"))),
  credentials: true,
}));
app.use(express.json());

/* ─── EMAIL (Resend) ───────────────────────────────────────── */
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.FROM_EMAIL || "notifications@mail.usemomentos.xyz";
const FROM_NAME  = process.env.FROM_NAME  || "Family Month 2026";

async function sendEmail({ to, subject, html, text }) {
  if (!resend) {
    console.warn("[Email] RESEND_API_KEY not set — skipping.");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }
  try {
    const result = await resend.emails.send({ from: `${FROM_NAME} <${FROM_EMAIL}>`, to, subject, html, text });
    if (result.error) throw new Error(result.error.message);
    console.log(`[Email] ✅ Sent to ${to} — ${result.data?.id}`);
    return { success: true };
  } catch (err) {
    console.error("[Email] ❌", err?.message);
    return { success: false, error: err?.message || "Email failed" };
  }
}

/* ─── SMS (Termii) ─────────────────────────────────────────── */
const TERMII_KEY     = process.env.TERMII_API_KEY  || "";
const TERMII_FROM    = (process.env.TERMII_SMS_FROM || "FamMonth").trim().slice(0, 11);
const TERMII_CHANNEL = (process.env.TERMII_SMS_CHANNEL || "generic").trim();
const SMS_TEST_MODE  = ["1","true","yes"].includes((process.env.SMS_TEST_MODE || "").toLowerCase());
const COUNTRY_CODE   = (process.env.DEFAULT_PHONE_COUNTRY_CODE || "234").replace(/\D/g, "");

function formatPhone(phone) {
  let cleaned = phone.trim().replace(/[^\d+]/g, "");
  if (cleaned.startsWith("00")) cleaned = `+${cleaned.slice(2)}`;
  if (cleaned.startsWith("+")) {
    const digits = cleaned.slice(1).replace(/\D/g, "");
    if (!digits) throw new Error("Invalid phone number");
    if (COUNTRY_CODE && digits.startsWith(`${COUNTRY_CODE}0`))
      return `${COUNTRY_CODE}${digits.slice(COUNTRY_CODE.length + 1)}`;
    return digits;
  }
  const digits = cleaned.replace(/\D/g, "");
  if (!digits) throw new Error("Invalid phone number");
  if (digits.startsWith("0")) return `${COUNTRY_CODE}${digits.slice(1)}`;
  if (digits.length >= 10 && digits.length <= 15) return digits;
  throw new Error("Phone number must include country code");
}

async function sendSMS({ to, message }) {
  if (SMS_TEST_MODE) {
    console.log(`[SMS][MOCK] ✅ To: ${to} | "${message}"`);
    return { success: true, mocked: true };
  }
  if (!TERMII_KEY) {
    console.warn("[SMS] TERMII_API_KEY not set — skipping.");
    return { success: false, error: "TERMII_API_KEY not configured" };
  }
  try {
    const phone = formatPhone(to);
    const resp  = await axios.post("https://v3.api.termii.com/api/sms/send", {
      to: phone, from: TERMII_FROM, sms: message,
      type: "plain", channel: TERMII_CHANNEL, api_key: TERMII_KEY,
    });
    const data    = resp.data || {};
    const code    = `${data.code || ""}`.toLowerCase();
    const msg     = `${data.message || ""}`.toLowerCase();
    const failed  = ["fail","error","invalid","reject"].some(w => code.includes(w) || msg.includes(w));
    const success = !failed && (code === "ok" || code === "success" || !!data.message_id);
    if (success) { console.log(`[SMS] ✅ Sent to ${phone}`); return { success: true }; }
    console.error("[SMS] ❌", data.message || code);
    return { success: false, error: data.message || "Provider rejected the request" };
  } catch (err) {
    const detail = err?.response?.data?.message || err?.message || "SMS failed";
    console.error("[SMS] ❌", detail);
    return { success: false, error: detail };
  }
}

/* ─── EMAIL TEMPLATE ───────────────────────────────────────── */
function buildEmailHtml(name, familyName) {
  const e = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
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
          With love,<br><strong style="color:#374151;">The Family Month 2026 Team</strong>
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

/* ─── REGISTRATION ROUTE ───────────────────────────────────── */
app.post("/api/family-registration", async (req, res) => {
  const { name, email, phone, familyId, familyName } = req.body || {};

  if (!name?.trim())       return res.status(400).json({ error: "Full name is required." });
  if (!familyName?.trim()) return res.status(400).json({ error: "Family selection is required." });

  const cleanName  = name.trim();
  const cleanEmail = (email  || "").trim();
  const cleanPhone = (phone  || "").trim();
  const hasEmail   = cleanEmail.includes("@");
  const hasPhone   = cleanPhone.length >= 7;

  const notifications = { emailSent: false, emailError: null, smsSent: false, smsError: null };

  if (hasEmail) {
    const r = await sendEmail({
      to:      cleanEmail,
      subject: `Welcome to ${familyName} – Family Month 2026`,
      html:    buildEmailHtml(cleanName, familyName),
      text:    `Hi ${cleanName}, you've been added to ${familyName} for Family Month 2026!`,
    });
    notifications.emailSent  = r.success;
    notifications.emailError = r.error || null;
  }

  if (hasPhone) {
    const first = cleanName.split(" ")[0];
    const r = await sendSMS({
      to:      cleanPhone,
      message: `Hi ${first}! 🎉 You've joined ${familyName} for Family Month 2026. We're so glad to have you! – MomentOS`,
    });
    notifications.smsSent  = r.success;
    notifications.smsError = r.error || null;
  }

  console.log(`[Registration] ${cleanName} → ${familyName} | email:${notifications.emailSent} sms:${notifications.smsSent}`);
  return res.status(201).json({ success: true, name: cleanName, family: familyName, notifications });
});

/* ─── SERVE BUILT REACT APP IN PRODUCTION ─────────────────── */
const distPath = path.join(__dirname, "dist");
app.use(express.static(distPath));
app.get("*", (_req, res) => {
  res.sendFile(path.join(distPath, "index.html"));
});

app.listen(PORT, () => {
  console.log(`\n🎉 Family Registration API → http://localhost:${PORT}\n`);
});
