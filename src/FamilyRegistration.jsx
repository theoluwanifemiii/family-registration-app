import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

const STORAGE_KEY = "fm2026_registered";
const MAX_SLOTS   = 15;
const ADMIN_PIN   = import.meta.env.VITE_ADMIN_PIN || "1234";

const FAMILIES = [
  { id:  1, name: "Blessing Homes"        },
  { id:  2, name: "Faith Foundations"     },
  { id:  3, name: "Love Lights"           },
  { id:  4, name: "Hope Havens"           },
  { id:  5, name: "Joyful Hearts"         },
  { id:  6, name: "Judah Praise"          },
  { id:  7, name: "Zion Blessings"        },
  { id:  8, name: "Shalom Homes"          },
  { id:  9, name: "Bethel Lights"         },
  { id: 10, name: "Roots of Love"         },
  { id: 11, name: "Garden of Praise"      },
  { id: 12, name: "Fruits of Love"        },
  { id: 13, name: "Abundance Family"      },
  { id: 14, name: "Harvest of Joy"        },
  { id: 15, name: "The Pathfinders"       },
  { id: 16, name: "Wellspring Family"     },
  { id: 17, name: "Oasis Family"          },
  { id: 18, name: "Eden of Peace Family"  },
  { id: 19, name: "Crown of Glory Family" },
  { id: 20, name: "Anchor Family"         },
];

const PALETTE = {
  1:  { color: "#B45309", bg: "#FEF3C7" },
  2:  { color: "#1D4ED8", bg: "#EFF6FF" },
  3:  { color: "#9D174D", bg: "#FDF2F8" },
  4:  { color: "#065F46", bg: "#ECFDF5" },
  5:  { color: "#C2410C", bg: "#FFF7ED" },
  6:  { color: "#4C1D95", bg: "#F5F3FF" },
  7:  { color: "#9D174D", bg: "#FDF2F8" },
  8:  { color: "#065F46", bg: "#ECFDF5" },
  9:  { color: "#166534", bg: "#F0FDF4" },
  10: { color: "#92400E", bg: "#FFFBEB" },
  11: { color: "#4C1D95", bg: "#F5F3FF" },
  12: { color: "#065F46", bg: "#ECFDF5" },
  13: { color: "#991B1B", bg: "#FEF2F2" },
  14: { color: "#92400E", bg: "#FFFBEB" },
  15: { color: "#1D4ED8", bg: "#EFF6FF" },
  16: { color: "#166534", bg: "#F0FDF4" },
  17: { color: "#C2410C", bg: "#FFF7ED" },
  18: { color: "#065F46", bg: "#ECFDF5" },
  19: { color: "#4C1D95", bg: "#F5F3FF" },
  20: { color: "#1D4ED8", bg: "#EFF6FF" },
};

const css = `
  @keyframes fadeUp  { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes scaleIn { from{opacity:0;transform:scale(.97)} to{opacity:1;transform:scale(1)} }
  @keyframes checkPop{ 0%{transform:scale(0)} 60%{transform:scale(1.15)} 100%{transform:scale(1)} }
  @keyframes pulse   { 0%,100%{opacity:1} 50%{opacity:.4} }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { background: #FAFAF7; min-height: 100vh; }
  input, button { font-family: inherit; }
  input::placeholder { color: #C4BAB0; }
`;

/* ── Slot bar ── */
function SlotBar({ count, color }) {
  const full = count >= MAX_SLOTS;
  const pct  = Math.round((count / MAX_SLOTS) * 100);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 5, color: "#9C9188" }}>
        <span>{count} of {MAX_SLOTS} joined</span>
        {full
          ? <span style={{ color: "#DC2626", fontWeight: 600 }}>Full</span>
          : <span style={{ color, fontWeight: 500 }}>{MAX_SLOTS - count} spots left</span>
        }
      </div>
      <div style={{ height: 4, background: "#EDE8E3", borderRadius: 99 }}>
        <div style={{
          height: "100%", width: `${pct}%`, borderRadius: 99,
          background: full ? "#DC2626" : color,
          transition: "width .4s ease",
        }} />
      </div>
    </div>
  );
}

/* ── Field ── */
function Field({ label, optional, type = "text", placeholder, value, onChange, error, accentColor }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: error ? "#DC2626" : "#3D3530" }}>
          {label}
        </label>
        {optional && (
          <span style={{ fontSize: 11, color: "#9C9188", background: "#F0EDE8", padding: "1px 8px", borderRadius: 20 }}>
            optional
          </span>
        )}
        {error && <span style={{ fontSize: 11, color: "#DC2626", marginLeft: "auto" }}>{error}</span>}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: "#FFFFFF",
          border: `1.5px solid ${error ? "#FCA5A5" : focused ? accentColor : "#DDD8D2"}`,
          borderRadius: 10,
          padding: "11px 14px",
          fontSize: 15,
          color: "#1A1714",
          outline: "none",
          transition: "border-color .15s",
          boxShadow: focused ? `0 0 0 3px ${accentColor}18` : "none",
        }}
      />
    </div>
  );
}

/* ── Back button ── */
function BackBtn({ label, onClick }) {
  return (
    <button onClick={onClick} style={{
      all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center",
      gap: 5, fontSize: 13, color: "#9C9188", marginBottom: 24,
    }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      {label}
    </button>
  );
}

/* ── Main ── */
export default function FamilyRegistration() {
  const rawCounts  = useQuery(api.registrations.getCounts);
  const rawRegs    = useQuery(api.registrations.getAll);
  const doRegister = useMutation(api.registrations.register);

  const counts = rawCounts
    ? Object.fromEntries(Object.entries(rawCounts).map(([k, v]) => [Number(k), v]))
    : Object.fromEntries(FAMILIES.map(f => [f.id, 0]));
  const regs = rawRegs
    ? Object.fromEntries(Object.entries(rawRegs).map(([k, v]) => [Number(k), v]))
    : Object.fromEntries(FAMILIES.map(f => [f.id, []]));

  const isLoading = rawCounts === undefined;

  const [alreadyReg, setAlreadyReg] = useState(null);
  useEffect(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      if (s) setAlreadyReg(JSON.parse(s));
    } catch {}
    // Auto-enter admin view if visiting /admin
    if (window.location.pathname.startsWith("/admin")) setView("admin");
  }, []);

  const [view, setView]         = useState("user");
  const [step, setStep]         = useState("select");
  const [selectedId, setSelId]  = useState(null);
  const [form, setForm]         = useState({ name: "", email: "", phone: "" });
  const [errors, setErrors]     = useState({});
  const [submitting, setSub]    = useState(false);
  const [submitErr, setSubErr]  = useState(null);
  const [adminOk, setAdminOk]   = useState(false);
  const [pin, setPin]           = useState("");
  const [pinErr, setPinErr]     = useState(false);
  const [expanded, setExpanded] = useState(null);

  const selFam    = FAMILIES.find(f => f.id === selectedId);
  const selColors = selectedId ? PALETTE[selectedId] : null;
  const totalRegs = Object.values(regs).reduce((s, arr) => s + (arr?.length ?? 0), 0);

  function setField(k) {
    return v => { setForm(p => ({ ...p, [k]: v })); setErrors(p => ({ ...p, [k]: undefined })); };
  }

  function validateForm() {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (form.email.trim() && !/\S+@\S+\.\S+/.test(form.email)) e.email = "Invalid email";
    if (Object.keys(e).length) { setErrors(e); return false; }
    return true;
  }

  async function handleConfirm() {
    if (!selFam) return;
    setSub(true); setSubErr(null);
    try {
      await doRegister({
        name:       form.name.trim(),
        email:      form.email.trim() || undefined,
        phone:      form.phone.trim() || undefined,
        familyId:   selectedId,
        familyName: selFam.name,
      });
      const record = { name: form.name.trim(), familyName: selFam.name };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
      setAlreadyReg(record);
      setStep("success");
    } catch (err) {
      setSubErr(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSub(false);
    }
  }

  function exportCSV() {
    const rows = [["Family", "Name", "Email", "Phone"]];
    FAMILIES.forEach(f => {
      (regs[f.id] || []).forEach(m => {
        rows.push([f.name, m.name, m.email || "", m.phone || ""]);
      });
    });
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = Object.assign(document.createElement("a"), {
      href: url, download: `family-month-2026-${new Date().toISOString().slice(0,10)}.csv`,
    });
    document.body.appendChild(a); a.click();
    document.body.removeChild(a); URL.revokeObjectURL(url);
  }

  /* ── Shared tokens ── */
  const TEXT   = "#1A1714";
  const MUTED  = "#9C9188";
  const BORDER = "#E8E3DC";
  const ACCENT = "#C97B15";

  const CARD = {
    background: "#FFFFFF",
    border: `1px solid ${BORDER}`,
    borderRadius: 12,
    padding: "16px 20px",
  };

  const PAGE = {
    minHeight: "100vh",
    background: "#FAFAF7",
    color: TEXT,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: `0 16px ${view === "user" && step === "select" && selFam ? "110px" : "60px"}`,
  };

  return (
    <>
      <style>{css}</style>
      <div style={PAGE}>
        <div style={{ maxWidth: 540, margin: "0 auto" }}>

          {/* ── Header ── */}
          <div style={{ padding: "36px 0 20px", marginBottom: 20, borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{
                  display: "inline-block", background: "#FEF3C7", color: "#92400E",
                  fontSize: 11, fontWeight: 600, padding: "3px 10px",
                  borderRadius: 20, marginBottom: 12, letterSpacing: ".03em",
                }}>
                  Family Month 2026
                </div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: TEXT, lineHeight: 1.2, marginBottom: 6 }}>
                  Welcome to Family Month
                </h1>
                <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6 }}>
                  Pick the family you'd like to join. Up to {MAX_SLOTS} members each.
                </p>
              </div>
              <button
                onClick={() => {
                  const next = view === "admin" ? "user" : "admin";
                  setView(next);
                  window.history.pushState(null, "", next === "admin" ? "/admin" : "/");
                }}
                style={{
                  all: "unset", cursor: "pointer", fontSize: 12, fontWeight: 500,
                  color: view === "admin" ? ACCENT : MUTED,
                  background: view === "admin" ? "#FEF3C7" : "transparent",
                  border: `1px solid ${view === "admin" ? "#F5D98A" : BORDER}`,
                  padding: "6px 14px", borderRadius: 8, flexShrink: 0, marginTop: 6,
                }}
              >
                {view === "admin" ? "← Back" : "Admin"}
              </button>
            </div>
          </div>

          {/* ── Already registered ── */}
          {alreadyReg && view === "user" && !isLoading && (
            <div style={{ textAlign: "center", padding: "48px 0", animation: "scaleIn .35s ease" }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%",
                background: "#ECFDF5", border: "2px solid #6EE7B7",
                display: "flex", alignItems: "center", justifyContent: "center",
                margin: "0 auto 20px", animation: "checkPop .4s ease",
              }}>
                <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
                  <path d="M2 10L9.5 17.5L24 2" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: TEXT, marginBottom: 8 }}>
                You're registered!
              </h2>
              <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, marginBottom: 28 }}>
                <strong style={{ color: TEXT }}>{alreadyReg.name}</strong> is already signed up<br />
                for <strong style={{ color: ACCENT }}>{alreadyReg.familyName}</strong>.
              </p>
              <div style={{
                ...CARD, display: "inline-block", textAlign: "left", minWidth: 200,
                borderColor: "#FDE68A",
              }}>
                <p style={{ fontSize: 11, color: MUTED, fontWeight: 500, marginBottom: 4 }}>YOUR FAMILY</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: ACCENT }}>{alreadyReg.familyName}</p>
                <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Family Month 2026</p>
              </div>
            </div>
          )}

          {/* ── Loading ── */}
          {!alreadyReg && isLoading && (
            <p style={{ textAlign: "center", padding: "40px 0", color: MUTED, fontSize: 14, animation: "pulse 1.5s ease infinite" }}>
              Loading…
            </p>
          )}

          {/* ══════ ADMIN ══════ */}
          {!isLoading && view === "admin" && (
            <div style={{ animation: "scaleIn .3s ease" }}>
              {!adminOk ? (
                <div style={CARD}>
                  <p style={{ fontSize: 14, color: MUTED, marginBottom: 14 }}>Enter your admin PIN to continue.</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      type="password" maxLength={6} placeholder="PIN"
                      value={pin}
                      onChange={e => { setPin(e.target.value); setPinErr(false); }}
                      onKeyDown={e => e.key === "Enter" && (pin === ADMIN_PIN ? setAdminOk(true) : setPinErr(true))}
                      style={{
                        flex: 1, background: "#FAFAF7",
                        border: `1.5px solid ${pinErr ? "#FCA5A5" : "#DDD8D2"}`,
                        borderRadius: 8, padding: "10px 14px", fontSize: 16,
                        color: TEXT, outline: "none", letterSpacing: ".25em",
                      }}
                    />
                    <button
                      onClick={() => pin === ADMIN_PIN ? setAdminOk(true) : setPinErr(true)}
                      style={{
                        all: "unset", cursor: "pointer", background: ACCENT, color: "#fff",
                        fontWeight: 600, fontSize: 13, padding: "10px 20px", borderRadius: 8,
                      }}
                    >
                      Enter
                    </button>
                  </div>
                  {pinErr && <p style={{ fontSize: 12, color: "#DC2626", marginTop: 8 }}>Incorrect PIN.</p>}
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <p style={{ fontSize: 13, color: MUTED }}>{totalRegs} registered across {FAMILIES.length} families</p>
                    <button
                      onClick={exportCSV}
                      style={{
                        all: "unset", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
                        fontSize: 13, fontWeight: 600, color: ACCENT,
                        background: "#FEF3C7", border: "1px solid #F5D98A",
                        padding: "7px 14px", borderRadius: 8,
                      }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M7 1v8M4 6l3 3 3-3M1 10v1a2 2 0 002 2h8a2 2 0 002-2v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Export CSV
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 20 }}>
                    {[["Registered", totalRegs], ["Families", FAMILIES.length], ["Spots Left", FAMILIES.length * MAX_SLOTS - totalRegs]].map(([label, val]) => (
                      <div key={label} style={CARD}>
                        <p style={{ fontSize: 11, color: MUTED, fontWeight: 500, marginBottom: 4 }}>{label.toUpperCase()}</p>
                        <p style={{ fontSize: 26, fontWeight: 700, color: ACCENT }}>{val}</p>
                      </div>
                    ))}
                  </div>
                  {FAMILIES.map(f => {
                    const members = regs[f.id] || [];
                    const { color, bg } = PALETTE[f.id];
                    const open = expanded === f.id;
                    return (
                      <div key={f.id} style={{
                        ...CARD, padding: 0, marginBottom: 6, overflow: "hidden",
                        borderColor: open ? color + "60" : BORDER,
                      }}>
                        <button
                          onClick={() => setExpanded(open ? null : f.id)}
                          style={{
                            all: "unset", cursor: "pointer", width: "100%",
                            display: "flex", alignItems: "center", justifyContent: "space-between",
                            padding: "12px 16px",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0, display: "inline-block" }} />
                            <span style={{ fontWeight: 500, fontSize: 14, color: TEXT }}>{f.name}</span>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                            <span style={{ fontSize: 12, color, background: bg, padding: "2px 10px", borderRadius: 20, fontWeight: 500 }}>
                              {members.length}/{MAX_SLOTS}
                            </span>
                            <span style={{ color: MUTED, fontSize: 10 }}>{open ? "▲" : "▼"}</span>
                          </div>
                        </button>
                        {open && (
                          <div style={{ padding: "0 16px 14px", borderTop: `1px solid ${BORDER}` }}>
                            {members.length === 0
                              ? <p style={{ fontSize: 13, color: MUTED, padding: "10px 0", fontStyle: "italic" }}>No members yet.</p>
                              : (
                                <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
                                  <thead>
                                    <tr>
                                      {["#", "Name", "Email", "Phone"].map(h => (
                                        <th key={h} style={{
                                          textAlign: "left", fontSize: 10, color: MUTED, fontWeight: 600,
                                          padding: "4px 8px 4px 0", borderBottom: `1px solid ${BORDER}`,
                                          textTransform: "uppercase", letterSpacing: ".05em",
                                        }}>{h}</th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {members.map((m, i) => (
                                      <tr key={i}>
                                        <td style={{ padding: "7px 8px 7px 0", fontSize: 12, color: MUTED }}>{i + 1}</td>
                                        <td style={{ padding: "7px 8px 7px 0", fontSize: 13, fontWeight: 500, color: TEXT }}>{m.name}</td>
                                        <td style={{ padding: "7px 8px 7px 0", fontSize: 12, color: MUTED }}>{m.email || "—"}</td>
                                        <td style={{ padding: "7px 8px 7px 0", fontSize: 12, color: MUTED }}>{m.phone || "—"}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* ══════ USER VIEW ══════ */}
          {!isLoading && view === "user" && !alreadyReg && (
            <>
              {/* ── SELECT ── */}
              {step === "select" && (
                <div style={{ animation: "fadeUp .3s ease" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {FAMILIES.map((f, i) => {
                      const { color, bg } = PALETTE[f.id];
                      const n    = counts[f.id] ?? 0;
                      const full = n >= MAX_SLOTS;
                      const sel  = selectedId === f.id;
                      return (
                        <button
                          key={f.id}
                          onClick={() => !full && setSelId(sel ? null : f.id)}
                          disabled={full && !sel}
                          style={{
                            all: "unset",
                            cursor: full && !sel ? "not-allowed" : "pointer",
                            display: "block", width: "100%", padding: "14px 16px",
                            background: sel ? bg : "#FFFFFF",
                            border: `1.5px solid ${sel ? color + "80" : BORDER}`,
                            borderRadius: 12, position: "relative",
                            boxShadow: sel ? `0 2px 12px ${color}20` : "0 1px 3px rgba(0,0,0,.04)",
                            opacity: full && !sel ? 0.4 : 1,
                            transition: "all .15s ease",
                            animation: `fadeUp .35s ease ${i * 15}ms both`,
                          }}
                        >
                          {sel && (
                            <div style={{
                              position: "absolute", top: 14, right: 14,
                              width: 22, height: 22, borderRadius: "50%",
                              background: color, display: "flex", alignItems: "center",
                              justifyContent: "center", animation: "checkPop .25s ease",
                            }}>
                              <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                                <path d="M1 4.5L4 7.5L10 1" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            </div>
                          )}
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                            <span style={{
                              width: 28, height: 28, borderRadius: 8, background: bg,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              fontSize: 11, fontWeight: 700, color, flexShrink: 0,
                            }}>
                              {f.id}
                            </span>
                            <span style={{ fontSize: 15, fontWeight: 600, color: TEXT }}>{f.name}</span>
                          </div>
                          <SlotBar count={n} color={color} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── FORM ── */}
              {step === "form" && selFam && selColors && (
                <div style={{ animation: "scaleIn .25s ease" }}>
                  <BackBtn label="Back to families" onClick={() => setStep("select")} />
                  <div style={{
                    display: "flex", alignItems: "center", gap: 12,
                    background: selColors.bg, border: `1px solid ${selColors.color}40`,
                    borderRadius: 10, padding: "12px 16px", marginBottom: 24,
                  }}>
                    <span style={{ width: 10, height: 10, borderRadius: "50%", background: selColors.color, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: TEXT }}>{selFam.name}</p>
                      <p style={{ fontSize: 12, color: MUTED }}>Family Month 2026</p>
                    </div>
                    <span style={{ fontSize: 12, color: selColors.color, fontWeight: 500 }}>
                      {MAX_SLOTS - (counts[selectedId] ?? 0)} spots left
                    </span>
                  </div>

                  <Field label="Full Name" placeholder="Your full name"
                    value={form.name} onChange={setField("name")}
                    error={errors.name} accentColor={selColors.color} />
                  <Field label="Email" optional type="email" placeholder="you@example.com"
                    value={form.email} onChange={setField("email")}
                    error={errors.email} accentColor={selColors.color} />
                  <Field label="Phone" optional type="tel" placeholder="08012345678"
                    value={form.phone} onChange={setField("phone")}
                    accentColor={selColors.color} />

                  <p style={{ fontSize: 12, color: MUTED, marginBottom: 20, lineHeight: 1.7 }}>
                    We'll send a confirmation to whatever contact details you provide.
                  </p>
                  <button
                    onClick={() => validateForm() && setStep("confirm")}
                    style={{
                      all: "unset", cursor: "pointer", display: "block", width: "100%",
                      textAlign: "center", padding: "13px", borderRadius: 10,
                      background: selColors.color, color: "#fff",
                      fontSize: 15, fontWeight: 600,
                    }}
                  >
                    Review & Confirm
                  </button>
                </div>
              )}

              {/* ── CONFIRM ── */}
              {step === "confirm" && selFam && selColors && (
                <div style={{ animation: "scaleIn .25s ease" }}>
                  <BackBtn label="Edit details" onClick={() => setStep("form")} />
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: TEXT, marginBottom: 4 }}>Confirm your details</h2>
                  <p style={{ fontSize: 13, color: MUTED, marginBottom: 20 }}>Double-check before joining.</p>

                  <div style={{ ...CARD, marginBottom: 20, borderColor: selColors.color + "50" }}>
                    {[
                      ["Family", <span style={{ color: selColors.color, fontWeight: 600 }}>{selFam.name}</span>],
                      ["Full Name", form.name],
                      ["Email", form.email.trim() || <span style={{ color: MUTED, fontStyle: "italic" }}>Not provided</span>],
                      ["Phone", form.phone.trim() || <span style={{ color: MUTED, fontStyle: "italic" }}>Not provided</span>],
                    ].map(([label, value], i, arr) => (
                      <div key={label} style={{
                        paddingBottom: i < arr.length - 1 ? 12 : 0,
                        marginBottom: i < arr.length - 1 ? 12 : 0,
                        borderBottom: i < arr.length - 1 ? `1px solid ${BORDER}` : "none",
                      }}>
                        <p style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 3, textTransform: "uppercase", letterSpacing: ".05em" }}>{label}</p>
                        <p style={{ fontSize: 14, color: TEXT, fontWeight: 500 }}>{value}</p>
                      </div>
                    ))}
                  </div>

                  {(form.email.trim() || form.phone.trim()) && (
                    <p style={{ fontSize: 12, color: MUTED, marginBottom: 16, lineHeight: 1.7 }}>
                      A confirmation will be sent via{" "}
                      {[form.email.trim() && "email", form.phone.trim() && "SMS"].filter(Boolean).join(" and ")}.
                    </p>
                  )}

                  {submitErr && (
                    <div style={{
                      padding: "12px 14px", background: "#FEF2F2", border: "1px solid #FCA5A5",
                      borderRadius: 8, marginBottom: 16, fontSize: 13, color: "#DC2626",
                    }}>
                      {submitErr}
                    </div>
                  )}

                  <button
                    onClick={handleConfirm} disabled={submitting}
                    style={{
                      all: "unset", cursor: submitting ? "not-allowed" : "pointer",
                      display: "block", width: "100%", textAlign: "center", padding: "13px",
                      background: submitting ? "#D1C9C0" : selColors.color,
                      borderRadius: 10, fontSize: 15, fontWeight: 600, color: "#fff",
                      transition: "background .2s",
                    }}
                  >
                    {submitting ? "Joining…" : `Join ${selFam.name}`}
                  </button>
                </div>
              )}

              {/* ── SUCCESS ── */}
              {step === "success" && selFam && selColors && (
                <div style={{ textAlign: "center", padding: "48px 0", animation: "scaleIn .4s ease" }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: "50%",
                    background: "#ECFDF5", border: "2px solid #6EE7B7",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    margin: "0 auto 20px", animation: "checkPop .45s ease",
                  }}>
                    <svg width="28" height="22" viewBox="0 0 28 22" fill="none">
                      <path d="M2 11L10 19L26 2" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 700, color: TEXT, marginBottom: 8 }}>You're in!</h2>
                  <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.8, marginBottom: 28 }}>
                    Welcome to <strong style={{ color: selColors.color }}>{selFam.name}</strong>.<br />
                    {form.email.trim() && form.phone.trim()
                      ? "Confirmation sent to your email and phone."
                      : form.email.trim() ? "Check your email for a confirmation."
                      : form.phone.trim() ? "Check your phone for a confirmation SMS."
                      : "Your registration is confirmed."}
                  </p>
                  <div style={{ ...CARD, display: "inline-block", textAlign: "left", minWidth: 200, borderColor: selColors.color + "50" }}>
                    <p style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginBottom: 4, textTransform: "uppercase" }}>Your Family</p>
                    <p style={{ fontSize: 16, fontWeight: 700, color: selColors.color }}>{selFam.name}</p>
                    <p style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>Family Month 2026</p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Sticky continue button ── */}
      {view === "user" && step === "select" && selFam && selColors && (
        <div style={{
          position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 50,
          padding: "12px 16px 24px",
          background: "linear-gradient(to top, #FAFAF7 70%, transparent)",
          pointerEvents: "none",
        }}>
          <div style={{ maxWidth: 540, margin: "0 auto", pointerEvents: "auto" }}>
            <button
              onClick={() => setStep("form")}
              style={{
                all: "unset", cursor: "pointer", display: "block", width: "100%",
                textAlign: "center", padding: "14px", borderRadius: 12,
                background: selColors.color, color: "#fff",
                fontSize: 15, fontWeight: 600,
                boxShadow: `0 4px 20px ${selColors.color}40`,
                animation: "fadeUp .2s ease",
              }}
            >
              Continue with {selFam.name}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
