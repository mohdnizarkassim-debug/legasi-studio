import { useState, useEffect } from "react";

// ============================================================
// CONSTANTS
// ============================================================
const APP_PASSWORD = "legasi2026";
const STORAGE_KEY = "legasi_studio_v2";

const getTime = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const fmt = (n) => Number(n).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (n) => (n >= 0 ? "+" : "") + Number(n).toFixed(2) + "%";

const SECTORS = ["Banking", "Technology", "Property", "Plantation", "Consumer", "Healthcare", "Telco", "Energy", "Industrial", "REITs", "Others"];
const TECHNIQUES = ["Marubozu", "VCP Pattern", "Volume Breakout", "EMA200 Trend", "RSI Oversold", "MACD Cross", "Support Bounce", "Resistance Break"];
const BROKERS = ["Maybank Investment", "OSK Securities", "RHB Investment", "CIMB Securities", "Kenanga", "PublicInvest", "Mplus Online", "Others"];

// ============================================================
// STORAGE
// ============================================================
const loadData = () => {
  try {
    const d = localStorage.getItem(STORAGE_KEY);
    return d ? JSON.parse(d) : null;
  } catch { return null; }
};

const saveData = (data) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
};

const defaultData = () => ({
  settings: { broker: "", modal: "", defaultRRR: "3", pin: "1234", setupDone: false },
  portfolio: [], watchlist: [], analysis: [], huntingList: [], journal: [],
});

// ============================================================
// DESIGN TOKENS
// ============================================================
const C = {
  primary: "#0F4C81", primaryLight: "#EFF6FF", primaryBorder: "#BFDBFE",
  green: "#059669", greenLight: "#D1FAE5",
  red: "#DC2626", redLight: "#FEE2E2",
  amber: "#D97706", amberLight: "#FEF3C7",
  bg: "#F0F4F8", surface: "#FFFFFF",
  border: "#E2E8F0", borderLight: "#F1F5F9",
  text: "#0F172A", textMuted: "#64748B", textFaint: "#94A3B8",
};

const inp = { width: "100%", padding: "10px 14px", borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 13, fontFamily: "'Sora',sans-serif", color: C.text, background: "#FAFBFC", outline: "none", boxSizing: "border-box" };
const btn = { padding: "10px 20px", borderRadius: 8, border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Sora',sans-serif" };
const cardStyle = { background: C.surface, borderRadius: 14, border: `1px solid ${C.border}`, boxShadow: "0 1px 4px rgba(0,0,0,0.05)", padding: "20px 22px" };

// ============================================================
// REUSABLE COMPONENTS
// ============================================================
const Pill = ({ children, color = C.primary, bg = C.primaryLight }) => (
  <span style={{ background: bg, color, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{children}</span>
);

const Lbl = ({ children }) => (
  <label style={{ fontSize: 11, fontWeight: 600, color: C.textMuted, letterSpacing: 0.4, marginBottom: 5, display: "block" }}>{children}</label>
);

const Field = ({ label, children }) => (
  <div style={{ marginBottom: 13 }}>
    <Lbl>{label}</Lbl>
    {children}
  </div>
);

const Inp = (props) => <input style={inp} {...props} />;

const Sel = ({ children, ...props }) => (
  <select style={{ ...inp }} {...props}>{children}</select>
);

const Btn = ({ variant = "primary", children, style: sx, ...props }) => {
  const variants = {
    primary: { background: C.primary, color: "#fff" },
    ghost: { background: C.primaryLight, color: C.primary, border: `1px solid ${C.primaryBorder}` },
    danger: { background: C.redLight, color: C.red, border: `1px solid #FECACA` },
    success: { background: C.green, color: "#fff" },
  };
  return <button style={{ ...btn, ...variants[variant], ...sx }} {...props}>{children}</button>;
};

const StatCard = ({ label, value, sub, subColor, accent }) => (
  <div style={{ ...cardStyle, borderLeft: accent ? `3px solid ${accent}` : undefined, padding: "16px 18px" }}>
    <div style={{ fontSize: 10, color: C.textFaint, fontWeight: 600, letterSpacing: 0.5, marginBottom: 5 }}>{label}</div>
    <div style={{ fontSize: 19, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: subColor || C.textMuted, marginTop: 3, fontWeight: 500 }}>{sub}</div>}
  </div>
);

const Empty = ({ icon, title, sub, action, onAction }) => (
  <div style={{ textAlign: "center", padding: "50px 20px", background: C.surface, borderRadius: 14, border: `1px solid ${C.border}` }}>
    <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
    <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>{title}</div>
    <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>{sub}</div>
    {action && <Btn onClick={onAction}>{action}</Btn>}
  </div>
);

const Modal = ({ title, onClose, children }) => (
  <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
    <div style={{ background: C.surface, borderRadius: 16, padding: 24, width: "100%", maxWidth: 480, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800 }}>{title}</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.textMuted }}>✕</button>
      </div>
      {children}
    </div>
  </div>
);

const TechButtons = ({ selected, onChange }) => (
  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
    {TECHNIQUES.map(t => (
      <Btn key={t} variant={selected.includes(t) ? "primary" : "ghost"}
        style={{ padding: "5px 12px", fontSize: 11 }}
        onClick={() => onChange(selected.includes(t) ? selected.filter(x => x !== t) : [...selected, t])}>
        {t}
      </Btn>
    ))}
  </div>
);

// ============================================================
// LOGIN
// ============================================================
const LoginScreen = ({ onLogin }) => {
  const [pw, setPw] = useState(""); const [err, setErr] = useState(""); const [show, setShow] = useState(false);
  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(135deg, #F0F4F8, #E2EAF4)`, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 370, animation: "fadeIn 0.4s ease" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ width: 64, height: 64, background: `linear-gradient(135deg,${C.primary},#2563EB)`, borderRadius: 18, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px", boxShadow: `0 8px 24px rgba(15,76,129,0.3)` }}>
            <span style={{ color: "#fff", fontSize: 28, fontWeight: 800 }}>L</span>
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "0.5px", color: C.text }}>LEGASI STUDIO</div>
          <div style={{ fontSize: 10, color: C.primary, fontWeight: 700, letterSpacing: "2px", marginTop: 2 }}>BURSA ANALITIK PRO</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 6 }}>Personal Trading Research System</div>
        </div>
        <div style={{ ...cardStyle, padding: 26 }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 18 }}>🔐 Secure Access</div>
          <Field label="PASSWORD">
            <div style={{ position: "relative" }}>
              <Inp type={show ? "text" : "password"} placeholder="Enter app password" value={pw}
                onChange={e => { setPw(e.target.value); setErr(""); }}
                onKeyDown={e => e.key === "Enter" && (pw === APP_PASSWORD ? onLogin() : setErr("Incorrect password."))} />
              <button onClick={() => setShow(!show)} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", fontSize: 13 }}>{show ? "🙈" : "👁"}</button>
            </div>
          </Field>
          {err && <div style={{ background: C.redLight, color: C.red, padding: "9px 13px", borderRadius: 7, fontSize: 12, fontWeight: 600, marginBottom: 12 }}>⚠ {err}</div>}
          <Btn style={{ width: "100%", padding: 13 }} onClick={() => pw === APP_PASSWORD ? onLogin() : setErr("Incorrect password.")}>Enter System →</Btn>
          <div style={{ textAlign: "center", marginTop: 14, fontSize: 10, color: C.textFaint }}>SYSTEM BUILT BY COMMAND, TRADED BY DISCIPLINE</div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PIN SCREEN
// ============================================================
const PinScreen = ({ onUnlock, onCancel, savedPin }) => {
  const [pin, setPin] = useState(""); const [err, setErr] = useState("");
  const handlePin = (d) => {
    if (pin.length >= 4) return;
    const np = pin + d;
    setPin(np);
    if (np.length === 4) {
      if (np === savedPin) setTimeout(onUnlock, 200);
      else setTimeout(() => { setErr("Incorrect PIN"); setPin(""); }, 300);
    }
  };
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: C.surface, borderRadius: 20, padding: 28, width: 290, textAlign: "center", boxShadow: "0 20px 60px rgba(0,0,0,0.2)" }}>
        <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 5 }}>🔐 Portfolio PIN</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 22 }}>Enter your 4-digit PIN</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 22 }}>
          {[0,1,2,3].map(i => <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: i < pin.length ? C.primary : C.border, transition: "all 0.2s" }} />)}
        </div>
        {err && <div style={{ color: C.red, fontSize: 12, marginBottom: 10 }}>{err}</div>}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 10 }}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
            <button key={n} onClick={() => handlePin(String(n))} style={{ padding: "13px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, fontSize: 17, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" }}>{n}</button>
          ))}
          <Btn variant="danger" style={{ padding: "11px", fontSize: 11 }} onClick={onCancel}>Cancel</Btn>
          <button onClick={() => handlePin("0")} style={{ padding: "13px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, fontSize: 17, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Mono',monospace" }}>0</button>
          <button onClick={() => setPin(p => p.slice(0,-1))} style={{ padding: "13px", borderRadius: 9, border: `1px solid ${C.border}`, background: C.bg, fontSize: 15, cursor: "pointer" }}>⌫</button>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SETUP WIZARD
// ============================================================
const SetupWizard = ({ onComplete }) => {
  const [f, setF] = useState({ broker: "", modal: "", defaultRRR: "3", pin: "", pinConfirm: "" });
  const [err, setErr] = useState("");
  const go = () => {
    if (!f.broker) return setErr("Please select your broker.");
    if (!f.modal || isNaN(f.modal)) return setErr("Please enter valid capital.");
    if (f.pin.length !== 4) return setErr("PIN must be 4 digits.");
    if (f.pin !== f.pinConfirm) return setErr("PINs do not match.");
    onComplete({ broker: f.broker, modal: f.modal, defaultRRR: f.defaultRRR, pin: f.pin, setupDone: true });
  };
  return (
    <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 20, fontWeight: 800 }}>Welcome, Encik Bos! 👋</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Let's set up your LEGASI STUDIO</div>
        </div>
        <div style={{ ...cardStyle, padding: 26 }}>
          <Field label="YOUR BROKER"><Sel value={f.broker} onChange={e => setF({...f, broker: e.target.value})}><option value="">Select broker...</option>{BROKERS.map(b => <option key={b}>{b}</option>)}</Sel></Field>
          <Field label="TRADING CAPITAL (RM)"><Inp type="number" placeholder="e.g. 10000" value={f.modal} onChange={e => setF({...f, modal: e.target.value})} /></Field>
          <Field label="DEFAULT RISK-REWARD (1:?)"><Sel value={f.defaultRRR} onChange={e => setF({...f, defaultRRR: e.target.value})}><option value="2">1:2</option><option value="3">1:3</option><option value="4">1:4</option><option value="5">1:5</option></Sel></Field>
          <Field label="SET PORTFOLIO PIN (4 digits)"><Inp type="password" maxLength={4} placeholder="e.g. 1234" value={f.pin} onChange={e => setF({...f, pin: e.target.value.replace(/\D/g, "")})} /></Field>
          <Field label="CONFIRM PIN"><Inp type="password" maxLength={4} placeholder="Repeat PIN" value={f.pinConfirm} onChange={e => setF({...f, pinConfirm: e.target.value.replace(/\D/g, "")})} /></Field>
          {err && <div style={{ background: C.redLight, color: C.red, padding: "9px 13px", borderRadius: 7, fontSize: 12, marginBottom: 12 }}>⚠ {err}</div>}
          <Btn style={{ width: "100%", padding: 13 }} onClick={go}>Complete Setup →</Btn>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// PORTFOLIO PAGE
// ============================================================
const PortfolioPage = ({ data, onUpdate, pinUnlocked, onRequestPin }) => {
  const [showForm, setShowForm] = useState(false);
  const [editIdx, setEditIdx] = useState(null);
  const blankForm = { code: "", name: "", sector: "", unit: "", buyPrice: "", currentPrice: "", date: "", note: "" };
  const [form, setForm] = useState(blankForm);
  const portfolio = data.portfolio || [];

  if (!pinUnlocked) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <div style={{ fontSize: 48, marginBottom: 14 }}>🔐</div>
      <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>Portfolio Locked</div>
      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 20 }}>Enter PIN to view your portfolio</div>
      <Btn onClick={onRequestPin}>Unlock Portfolio</Btn>
    </div>
  );

  const totalCost = portfolio.reduce((a, s) => a + (s.unit * s.buyPrice), 0);
  const totalCurr = portfolio.reduce((a, s) => a + (s.unit * (s.currentPrice || s.buyPrice)), 0);
  const totalPL = totalCurr - totalCost;
  const totalPLPct = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

  const save = () => {
    if (!form.code || !form.unit || !form.buyPrice) return;
    const item = { ...form, unit: +form.unit, buyPrice: +form.buyPrice, currentPrice: +(form.currentPrice || form.buyPrice), id: Date.now() };
    const updated = [...portfolio];
    editIdx !== null ? updated[editIdx] = { ...updated[editIdx], ...item } : updated.push(item);
    onUpdate({ ...data, portfolio: updated });
    setShowForm(false); setEditIdx(null); setForm(blankForm);
  };

  const del = (i) => { if (!window.confirm("Delete this holding?")) return; onUpdate({ ...data, portfolio: portfolio.filter((_, x) => x !== i) }); };
  const edit = (i) => { setForm({ ...portfolio[i] }); setEditIdx(i); setShowForm(true); };
  const updatePrice = (i, p) => { const u = [...portfolio]; u[i] = { ...u[i], currentPrice: +p }; onUpdate({ ...data, portfolio: u }); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.4px" }}>◎ My Portfolio</h1>
        <Btn onClick={() => { setForm(blankForm); setEditIdx(null); setShowForm(true); }}>+ Add</Btn>
      </div>

      {portfolio.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10, marginBottom: 18 }}>
          <StatCard label="CURRENT VALUE" value={`RM ${fmt(totalCurr)}`} sub={`Cost: RM ${fmt(totalCost)}`} accent={C.primary} />
          <StatCard label="UNREALIZED P&L" value={`${totalPL >= 0 ? "+" : ""}RM ${fmt(totalPL)}`} sub={fmtPct(totalPLPct)} subColor={totalPL >= 0 ? C.green : C.red} accent={totalPL >= 0 ? C.green : C.red} />
          <StatCard label="POSITIONS" value={portfolio.length.toString()} sub="Active holdings" accent={C.amber} />
          <StatCard label="CAPITAL" value={`RM ${fmt(data.settings?.modal || 0)}`} sub={data.settings?.broker || "—"} accent={C.primary} />
        </div>
      )}

      {portfolio.length === 0 ? <Empty icon="📊" title="No Holdings" sub="Add your first position to start tracking." action="+ Add Holding" onAction={() => setShowForm(true)} /> : (
        <div style={{ display: "grid", gap: 10 }}>
          {portfolio.map((s, i) => {
            const cost = s.unit * s.buyPrice, curr = s.unit * (s.currentPrice || s.buyPrice), pl = curr - cost, plPct = (pl / cost) * 100;
            return (
              <div key={s.id || i} style={{ ...cardStyle, padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: C.primary }}>{s.code?.slice(0,2)}</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{s.code} <span style={{ fontSize: 11, color: C.textFaint }}>· {s.sector}</span></div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{s.name}</div>
                      <div style={{ fontSize: 10, color: C.textFaint }}>📅 {s.date} · {Number(s.unit).toLocaleString()} units @ RM {fmt(s.buyPrice)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>RM {fmt(curr)}</div>
                    <div style={{ fontSize: 12, color: pl >= 0 ? C.green : C.red, fontWeight: 700 }}>{pl >= 0 ? "▲ +" : "▼ "}RM {fmt(Math.abs(pl))} ({fmtPct(plPct)})</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 10, paddingTop: 10, borderTop: `1px solid ${C.borderLight}` }}>
                  <span style={{ fontSize: 11, color: C.textMuted, whiteSpace: "nowrap" }}>Update price:</span>
                  <input type="number" defaultValue={s.currentPrice || s.buyPrice} step="0.01" onBlur={e => updatePrice(i, e.target.value)} style={{ ...inp, padding: "6px 10px", width: 90, fontSize: 12 }} />
                  <span style={{ fontSize: 11, color: C.textFaint }}>RM</span>
                </div>
                {s.note && <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic", marginBottom: 8 }}>📝 {s.note}</div>}
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <Btn variant="ghost" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => edit(i)}>Edit</Btn>
                  <Btn variant="primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => {
                    const ji = { id: Date.now(), code: s.code, name: s.name, sector: s.sector, entryPrice: s.buyPrice, sl: "", tp: "", lot: s.unit, entryDate: s.date || new Date().toISOString().split("T")[0], techniques: [], note: s.note || "", status: "Open" };
                    onUpdate({ ...data, journal: [ji, ...(data.journal || [])] });
                    alert(`${s.code} added to Trading Journal! ✅`);
                  }}>📒 Add to Journal</Btn>
                  <Btn variant="danger" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => del(i)}>Delete</Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && (
        <Modal title={editIdx !== null ? "Edit Holding" : "Add Holding"} onClose={() => { setShowForm(false); setForm(blankForm); }}>
          <Field label="STOCK CODE"><Inp placeholder="e.g. MAYBANK" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} /></Field>
          <Field label="COMPANY NAME"><Inp placeholder="e.g. Malayan Banking Bhd" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
          <Field label="SECTOR"><Sel value={form.sector} onChange={e => setForm({...form, sector: e.target.value})}><option value="">Select...</option>{SECTORS.map(s => <option key={s}>{s}</option>)}</Sel></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="UNITS"><Inp type="number" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} /></Field>
            <Field label="BUY PRICE (RM)"><Inp type="number" step="0.01" value={form.buyPrice} onChange={e => setForm({...form, buyPrice: e.target.value})} /></Field>
            <Field label="CURRENT PRICE (RM)"><Inp type="number" step="0.01" value={form.currentPrice} onChange={e => setForm({...form, currentPrice: e.target.value})} /></Field>
            <Field label="DATE BOUGHT"><Inp type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></Field>
          </div>
          <Field label="NOTES"><Inp placeholder="Notes..." value={form.note} onChange={e => setForm({...form, note: e.target.value})} /></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn style={{ flex: 1 }} onClick={save}>Save</Btn>
            <Btn variant="ghost" style={{ flex: 1 }} onClick={() => { setShowForm(false); setForm(blankForm); }}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ============================================================
// WATCHLIST PAGE
// ============================================================
const WatchlistPage = ({ data, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [trackIdx, setTrackIdx] = useState(null);
  const [trackP, setTrackP] = useState(""); const [trackN, setTrackN] = useState("");
  const blank = { code: "", name: "", sector: "", targetBuy: "", targetSL: "", lastPrice: "", note: "", date: new Date().toISOString().split("T")[0] };
  const [form, setForm] = useState(blank);
  const watchlist = data.watchlist || [];

  const save = () => {
    if (!form.code) return;
    onUpdate({ ...data, watchlist: [...watchlist, { ...form, id: Date.now(), tracking: [] }] });
    setShowForm(false); setForm(blank);
  };
  const del = (i) => { if (!window.confirm("Remove?")) return; onUpdate({ ...data, watchlist: watchlist.filter((_, x) => x !== i) }); };
  const addTrack = (i) => {
    if (!trackP) return;
    const u = [...watchlist];
    u[i] = { ...u[i], tracking: [...(u[i].tracking || []), { date: new Date().toISOString().split("T")[0], price: +trackP, note: trackN }], lastPrice: +trackP };
    onUpdate({ ...data, watchlist: u });
    setTrackIdx(null); setTrackP(""); setTrackN("");
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.4px" }}>★ Watchlist</h1>
        <Btn onClick={() => setShowForm(true)}>+ Add Stock</Btn>
      </div>

      {watchlist.length === 0 ? <Empty icon="👁" title="Watchlist Empty" sub="Add stocks to monitor daily." action="+ Add Stock" onAction={() => setShowForm(true)} /> : (
        <div style={{ display: "grid", gap: 10 }}>
          {watchlist.map((w, i) => (
            <div key={w.id || i} style={{ ...cardStyle }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: C.amberLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: C.amber }}>{w.code?.slice(0,2)}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800 }}>{w.code} <span style={{ fontSize: 11, color: C.textFaint }}>· {w.sector}</span></div>
                    <div style={{ fontSize: 11, color: C.textMuted }}>{w.name}</div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {w.lastPrice && <div style={{ fontSize: 15, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>RM {fmt(w.lastPrice)}</div>}
                  <div style={{ fontSize: 10, color: C.textFaint }}>Added: {w.date}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
                {w.targetBuy && <div style={{ background: C.greenLight, padding: "4px 10px", borderRadius: 6 }}><div style={{ fontSize: 9, color: C.green }}>TARGET BUY</div><div style={{ fontSize: 12, fontWeight: 700, color: C.green, fontFamily: "'DM Mono',monospace" }}>RM {fmt(w.targetBuy)}</div></div>}
                {w.targetSL && <div style={{ background: C.redLight, padding: "4px 10px", borderRadius: 6 }}><div style={{ fontSize: 9, color: C.red }}>STOP LOSS</div><div style={{ fontSize: 12, fontWeight: 700, color: C.red, fontFamily: "'DM Mono',monospace" }}>RM {fmt(w.targetSL)}</div></div>}
              </div>
              {w.tracking?.length > 0 && (
                <div style={{ background: C.bg, borderRadius: 8, padding: "8px 12px", marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: C.textMuted, marginBottom: 5 }}>PRICE HISTORY</div>
                  {w.tracking.slice(-3).map((t, ti) => (
                    <div key={ti} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 2 }}>
                      <span style={{ color: C.textMuted }}>{t.date}</span>
                      <span style={{ fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>RM {fmt(t.price)}</span>
                      {t.note && <span style={{ color: C.textFaint, fontStyle: "italic" }}>{t.note}</span>}
                    </div>
                  ))}
                </div>
              )}
              {trackIdx === i ? (
                <div style={{ display: "flex", gap: 8, marginBottom: 10, alignItems: "center" }}>
                  <input type="number" step="0.01" placeholder="Price" value={trackP} onChange={e => setTrackP(e.target.value)} style={{ ...inp, width: 90, padding: "7px 10px" }} />
                  <input placeholder="Note" value={trackN} onChange={e => setTrackN(e.target.value)} style={{ ...inp, padding: "7px 10px" }} />
                  <Btn style={{ padding: "7px 14px", whiteSpace: "nowrap" }} onClick={() => addTrack(i)}>Save</Btn>
                  <Btn variant="ghost" style={{ padding: "7px 12px" }} onClick={() => setTrackIdx(null)}>✕</Btn>
                </div>
              ) : null}
              {w.note && <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic", marginBottom: 8 }}>📝 {w.note}</div>}
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <Btn variant="ghost" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => setTrackIdx(trackIdx === i ? null : i)}>+ Track Today</Btn>
                <Btn variant="primary" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => {
                  const ji = { id: Date.now(), code: w.code, name: w.name, sector: w.sector, entryPrice: w.lastPrice || w.targetBuy || "", sl: w.targetSL || "", tp: "", lot: "", entryDate: new Date().toISOString().split("T")[0], techniques: [], note: w.note || "", status: "Open" };
                  onUpdate({ ...data, journal: [ji, ...(data.journal || [])] });
                  alert(`${w.code} added to Trading Journal! ✅`);
                }}>📒 Add to Journal</Btn>
                <Btn variant="danger" style={{ padding: "6px 14px", fontSize: 12 }} onClick={() => del(i)}>Remove</Btn>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Modal title="Add to Watchlist" onClose={() => { setShowForm(false); setForm(blank); }}>
          <Field label="STOCK CODE"><Inp placeholder="e.g. INARI" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} /></Field>
          <Field label="COMPANY NAME"><Inp placeholder="e.g. Inari Amertron Bhd" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
          <Field label="SECTOR"><Sel value={form.sector} onChange={e => setForm({...form, sector: e.target.value})}><option value="">Select...</option>{SECTORS.map(s => <option key={s}>{s}</option>)}</Sel></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="TARGET BUY (RM)"><Inp type="number" step="0.01" value={form.targetBuy} onChange={e => setForm({...form, targetBuy: e.target.value})} /></Field>
            <Field label="STOP LOSS (RM)"><Inp type="number" step="0.01" value={form.targetSL} onChange={e => setForm({...form, targetSL: e.target.value})} /></Field>
          </div>
          <Field label="LAST PRICE (RM)"><Inp type="number" step="0.01" value={form.lastPrice} onChange={e => setForm({...form, lastPrice: e.target.value})} /></Field>
          <Field label="NOTES"><Inp placeholder="Why watching..." value={form.note} onChange={e => setForm({...form, note: e.target.value})} /></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn style={{ flex: 1 }} onClick={save}>Add</Btn>
            <Btn variant="ghost" style={{ flex: 1 }} onClick={() => { setShowForm(false); setForm(blank); }}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ============================================================
// TECHNICAL ANALYSIS PAGE
// ============================================================
const TechnicalPage = ({ data, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [selIdx, setSelIdx] = useState(null);
  const [editIdx, setEditIdx] = useState(null);
  const blank = { code: "", name: "", sector: "", date: new Date().toISOString().split("T")[0], open: "", high: "", low: "", close: "", volume: "", ema200: "", sma20vol: "", techniques: [], note: "", modal: data.settings?.modal || "", rrr: data.settings?.defaultRRR || "3" };
  const [form, setForm] = useState(blank);
  const analysis = data.analysis || [];

  const runAnalysis = (f) => {
    const o = +f.open, h = +f.high, l = +f.low, c = +f.close;
    const vol = +f.volume, smaVol = +f.sma20vol, ema200 = +f.ema200;
    const modal = +f.modal, rrr = +f.rrr || 3;
    
    let score = 0;
    const checks = {};
    const remarks = [];

    // ── STEP 1: TREND FILTER (EMA 200) ──
    // Kalau gagal → STOP terus, tak check lain
    if (!ema200 || !c) {
      checks.ema200 = { label: "TREND: Close > EMA 200", pass: false, value: "Data tidak lengkap", score: 0 };
    } else if (c > ema200) {
      score += 1;
      checks.ema200 = { label: "TREND: Close > EMA 200", pass: true, value: `${c} > ${ema200} ✓`, score: 1 };
      remarks.push("TREND: Lulus (Di atas EMA 200)");
    } else {
      checks.ema200 = { label: "TREND: Close > EMA 200", pass: false, value: `${c} < ${ema200} — GAGAL`, score: 0 };
      remarks.push("TREND: Gagal (Di bawah EMA 200) — STOP");
      // STOP — trend gagal, return terus
      return { checks, score: 0, signal: "WAIT", remarks, sl: l - 0.01, tp: 0, riskPct: 0, tpPct: 0, lotSize: 0, rrr, trendFailed: true };
    }

    // ── STEP 2: VOLUME SURGE (SMA 20) ──
    if (vol && smaVol) {
      const volRatio = vol / smaVol;
      if (volRatio >= 2.0) {
        score += 2;
        checks.volume = { label: "VOLUME: Surge > 2x SMA20", pass: true, value: `${volRatio.toFixed(2)}x — Sangat Kuat 🔥`, score: 2 };
        remarks.push(`VOLUME: Sangat Kuat (${volRatio.toFixed(2)}x)`);
      } else if (volRatio >= 1.5) {
        score += 1;
        checks.volume = { label: "VOLUME: Surge >= 1.5x SMA20", pass: true, value: `${volRatio.toFixed(2)}x — Kuat`, score: 1 };
        remarks.push(`VOLUME: Kuat (${volRatio.toFixed(2)}x)`);
      } else {
        checks.volume = { label: "VOLUME: Surge < 1.5x SMA20", pass: false, value: `${volRatio.toFixed(2)}x — Lemah`, score: 0 };
        remarks.push("VOLUME: Lemah");
      }
    }

    // ── STEP 3: BULLISH MARUBOZU ──
    if (o && h && l && c) {
      const candleRange = h - l;
      const bodyRange = Math.abs(c - o);
      const bodyPct = candleRange > 0 ? (bodyRange / candleRange) * 100 : 0;
      const isBullish = c > o;

      if (bodyPct >= 90 && isBullish) {
        score += 2;
        checks.marubozu = { label: "CANDLE: Bullish Marubozu", pass: true, value: `${bodyPct.toFixed(1)}% — Marubozu ✓`, score: 2 };
        remarks.push(`CANDLE: Bullish Marubozu (${bodyPct.toFixed(1)}%)`);
      } else if (isBullish) {
        checks.marubozu = { label: "CANDLE: Bullish Marubozu", pass: false, value: `${bodyPct.toFixed(1)}% — Normal Bullish`, score: 0 };
        remarks.push(`CANDLE: Normal Bullish (${bodyPct.toFixed(1)}%)`);
      } else {
        checks.marubozu = { label: "CANDLE: Bullish Marubozu", pass: false, value: `${bodyPct.toFixed(1)}% — Bearish`, score: 0 };
        remarks.push("CANDLE: Bearish — tidak layak");
      }
    }

    // ── STEP 4: RISK MANAGEMENT ──
    // SL = Low - 0.01 (1 bid bawah low)
    const sl = l - 0.01;
    const risk = c - sl;
    const tp = c + (risk * rrr);
    const riskPct = c > 0 ? ((c - sl) / c) * 100 : 0;
    const tpPct = c > 0 ? ((tp - c) / c) * 100 : 0;
    const lotSize = risk > 0 ? Math.floor((modal * 0.20) / risk / 100) * 100 : 0;

    // ── STEP 5: FINAL SIGNAL ──
    let signal = "WAIT";
    if (score >= 4) signal = "STRONG BUY";
    else if (score >= 2) signal = "BUY";

    return { checks, score, signal, remarks, sl: +sl.toFixed(3), tp: +tp.toFixed(3), risk, riskPct, tpPct, lotSize, rrr, trendFailed: false };
  };

  const save = () => {
    if (!form.code) return;
    const result = runAnalysis(form);
    const updated = [...analysis];
    if (editIdx !== null) {
      updated[editIdx] = { ...updated[editIdx], ...form, result };
    } else {
      updated.unshift({ ...form, id: Date.now(), result });
    }
    onUpdate({ ...data, analysis: updated });
    setShowForm(false); setEditIdx(null); setForm(blank);
  };

  const edit = (i) => {
    setForm({ ...analysis[i] });
    setEditIdx(i);
    setSelIdx(null);
    setShowForm(true);
  };

  const addToHunting = (a) => {
    const r = a.result;
    const item = { id: Date.now(), code: a.code, name: a.name, sector: a.sector, entry: a.close, sl: r.sl, tp: r.tp, lot: r.lotSize, rrr: a.rrr, signal: r.signal, date: a.date, status: "Pending", note: a.note, techniques: a.techniques };
    onUpdate({ ...data, huntingList: [item, ...(data.huntingList || [])] });
    alert(`${a.code} added to Hunting List! ✅`);
  };

  const del = (i) => { if (!window.confirm("Delete?")) return; onUpdate({ ...data, analysis: analysis.filter((_, x) => x !== i) }); setSelIdx(null); };
  const sel = selIdx !== null ? analysis[selIdx] : null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.4px" }}>❤️ Technical Analysis</h1>
        <Btn onClick={() => { setForm(blank); setSelIdx(null); setShowForm(true); }}>+ New Analysis</Btn>
      </div>

      {/* Detail View */}
      {sel && (
        <div style={{ ...cardStyle, marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{sel.code}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>{sel.name} · {sel.date}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <Pill
                color={sel.result?.signal === "STRONG BUY" ? "#fff" : sel.result?.signal === "BUY" ? C.green : C.textMuted}
                bg={sel.result?.signal === "STRONG BUY" ? C.green : sel.result?.signal === "BUY" ? C.greenLight : C.bg}>
                {sel.result?.signal === "STRONG BUY" ? "🔥 STRONG BUY" : sel.result?.signal === "BUY" ? "🟢 BUY" : "⚪ WAIT"}
              </Pill>
              {sel.result?.score !== undefined && (
                <div style={{ fontSize: 10, color: C.textFaint, marginTop: 3 }}>Score: {sel.result.score}/5</div>
              )}
            </div>
          </div>

          {/* OHLCV */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 14 }}>
            {[["OPEN", sel.open], ["HIGH", sel.high], ["LOW", sel.low], ["CLOSE", sel.close], ["VOLUME", sel.volume]].map(([l, v]) => (
              <div key={l} style={{ background: C.bg, borderRadius: 7, padding: "7px 8px", textAlign: "center" }}>
                <div style={{ fontSize: 9, color: C.textFaint, fontWeight: 600 }}>{l}</div>
                <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{v || "—"}</div>
              </div>
            ))}
          </div>

          {/* Trend Failed Warning */}
          {sel.result?.trendFailed && (
            <div style={{ background: "#FEF2F2", border: `1px solid #FECACA`, borderRadius: 10, padding: "12px 14px", marginBottom: 14, display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 18 }}>🚫</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: C.red }}>ANALISIS DIHENTIKAN</div>
                <div style={{ fontSize: 11, color: C.red }}>Harga tutup di bawah EMA 200 — kaunter tidak layak.</div>
              </div>
            </div>
          )}

          {/* Checks */}
          {sel.result?.checks && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted }}>ANALYSIS CRITERIA</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.primary }}>SCORE: {sel.result.score}/5</div>
              </div>
              {Object.values(sel.result.checks).map((c, ci) => c && (
                <div key={ci} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 12px", background: c.pass ? C.greenLight : C.redLight, borderRadius: 7, marginBottom: 5 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{c.label}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {c.score > 0 && <span style={{ fontSize: 10, background: C.green, color: "#fff", borderRadius: 10, padding: "2px 7px", fontWeight: 700 }}>+{c.score}</span>}
                    <span style={{ fontSize: 12, fontWeight: 700, color: c.pass ? C.green : C.red }}>{c.pass ? "✓" : "✗"} {c.value}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Risk Card */}
          {sel.result && (
            <div style={{ background: `linear-gradient(135deg,${C.primary},#1D6FB8)`, borderRadius: 12, padding: "16px 18px", color: "#fff", marginBottom: 14 }}>
              <div style={{ fontSize: 10, opacity: 0.75, marginBottom: 10 }}>⚡ RISK MANAGEMENT (RRR 1:{sel.result.rrr})</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
                {[["ENTRY", `RM ${fmt(sel.close)}`], ["STOP LOSS", `RM ${fmt(sel.result.sl)}`], ["TARGET", `RM ${fmt(sel.result.tp)}`]].map(([l, v]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, opacity: 0.7, marginBottom: 3 }}>{l}</div>
                    <div style={{ fontSize: 14, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>{v}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                <div><div style={{ fontSize: 9, opacity: 0.7 }}>RISK / REWARD</div><div style={{ fontSize: 12, fontWeight: 700 }}>-{sel.result.riskPct.toFixed(2)}% / +{sel.result.tpPct.toFixed(2)}%</div></div>
                <div><div style={{ fontSize: 9, opacity: 0.7 }}>LOT SIZE (20% capital)</div><div style={{ fontSize: 12, fontWeight: 700 }}>{Number(sel.result.lotSize).toLocaleString()} units</div></div>
              </div>
            </div>
          )}

          {sel.techniques?.length > 0 && <div style={{ marginBottom: 10 }}>{sel.techniques.map(t => <Pill key={t} style={{ marginRight: 5 }}>{t}</Pill>)}</div>}
          {sel.note && <div style={{ fontSize: 12, color: C.textMuted, fontStyle: "italic", marginBottom: 12 }}>📝 {sel.note}</div>}

          <div style={{ display: "flex", gap: 8 }}>
            {(sel.result?.signal === "STRONG BUY" || sel.result?.signal === "BUY") && (
              <Btn variant="success" style={{ flex: 1 }} onClick={() => addToHunting(sel)}>🎯 Add to Hunting List</Btn>
            )}
            <Btn variant="ghost" onClick={() => edit(selIdx)}>✏️ Edit</Btn>
            <Btn variant="ghost" onClick={() => setSelIdx(null)}>← Back</Btn>
          </div>
        </div>
      )}

      {/* List */}
      {!sel && (
        analysis.length === 0 ? <Empty icon="📈" title="No Analysis Yet" sub="Start your first technical analysis." action="+ New Analysis" onAction={() => setShowForm(true)} /> : (
          <div style={{ display: "grid", gap: 8 }}>
            {analysis.map((a, i) => (
              <div key={a.id || i} style={{ ...cardStyle, cursor: "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.borderColor = C.primaryBorder}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }} onClick={() => setSelIdx(i)}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, background: C.primaryLight, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: C.primary }}>{a.code?.slice(0,2)}</div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800 }}>{a.code} <span style={{ fontSize: 11, color: C.textFaint }}>· {a.sector}</span></div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{a.date} · Close: RM {fmt(a.close)}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <Pill
                      color={a.result?.signal === "STRONG BUY" ? "#fff" : a.result?.signal === "BUY" ? C.green : C.textMuted}
                      bg={a.result?.signal === "STRONG BUY" ? C.green : a.result?.signal === "BUY" ? C.greenLight : C.bg}>
                      {a.result?.signal === "STRONG BUY" ? "🔥 STRONG BUY" : a.result?.signal === "BUY" ? "🟢 BUY" : "⚪ WAIT"}
                    </Pill>
                    {a.result?.score !== undefined && <span style={{ fontSize: 10, color: C.textFaint }}>{a.result.score}/5</span>}
                    {(a.result?.signal === "STRONG BUY" || a.result?.signal === "BUY") && (
                      <Btn variant="success" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => addToHunting(a)}>🎯</Btn>
                    )}
                    <Btn variant="ghost" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => edit(i)}>✏️</Btn>
                    <Btn variant="danger" style={{ padding: "5px 10px", fontSize: 11 }} onClick={() => del(i)}>✕</Btn>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {showForm && (
        <Modal title={editIdx !== null ? "Edit Analysis" : "New Technical Analysis"} onClose={() => { setShowForm(false); setEditIdx(null); setForm(blank); }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="STOCK CODE"><Inp placeholder="MAYBANK" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} /></Field>
            <Field label="DATE"><Inp type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></Field>
          </div>
          <Field label="COMPANY NAME"><Inp placeholder="Malayan Banking Bhd" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
          <Field label="SECTOR"><Sel value={form.sector} onChange={e => setForm({...form, sector: e.target.value})}><option value="">Select...</option>{SECTORS.map(s => <option key={s}>{s}</option>)}</Sel></Field>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, margin: "10px 0 8px" }}>OHLCV DATA</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="OPEN (RM)"><Inp type="number" step="0.001" placeholder="0.00" value={form.open} onChange={e => setForm({...form, open: e.target.value})} /></Field>
            <Field label="HIGH (RM)"><Inp type="number" step="0.001" placeholder="0.00" value={form.high} onChange={e => setForm({...form, high: e.target.value})} /></Field>
            <Field label="LOW (RM)"><Inp type="number" step="0.001" placeholder="0.00" value={form.low} onChange={e => setForm({...form, low: e.target.value})} /></Field>
            <Field label="CLOSE (RM)"><Inp type="number" step="0.001" placeholder="0.00" value={form.close} onChange={e => setForm({...form, close: e.target.value})} /></Field>
          </div>
          <Field label="VOLUME"><Inp type="number" placeholder="e.g. 12300000" value={form.volume} onChange={e => setForm({...form, volume: e.target.value})} /></Field>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, margin: "10px 0 8px" }}>INDICATORS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="EMA 200"><Inp type="number" step="0.001" placeholder="e.g. 9.20" value={form.ema200} onChange={e => setForm({...form, ema200: e.target.value})} /></Field>
            <Field label="SMA20 VOLUME"><Inp type="number" placeholder="e.g. 5000000" value={form.sma20vol} onChange={e => setForm({...form, sma20vol: e.target.value})} /></Field>
          </div>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, margin: "10px 0 8px" }}>RISK SETTINGS</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="CAPITAL (RM)"><Inp type="number" value={form.modal} onChange={e => setForm({...form, modal: e.target.value})} /></Field>
            <Field label="RRR (1:?)"><Sel value={form.rrr} onChange={e => setForm({...form, rrr: e.target.value})}><option value="2">1:2</option><option value="3">1:3</option><option value="4">1:4</option><option value="5">1:5</option></Sel></Field>
          </div>
          <Field label="TECHNIQUES"><TechButtons selected={form.techniques} onChange={t => setForm({...form, techniques: t})} /></Field>
          <Field label="NOTES"><textarea value={form.note} onChange={e => setForm({...form, note: e.target.value})} placeholder="Analysis notes..." style={{ ...inp, height: 70, resize: "vertical" }} /></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn style={{ flex: 1 }} onClick={save}>{editIdx !== null ? "Save Changes" : "Run Analysis & Save"}</Btn>
            <Btn variant="ghost" onClick={() => { setShowForm(false); setEditIdx(null); setForm(blank); }}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ============================================================
// HUNTING LIST PAGE
// ============================================================
const HuntingPage = ({ data, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const blank = { code: "", name: "", sector: "", entry: "", sl: "", tp: "", lot: "", rrr: "3", signal: "BUY", date: new Date().toISOString().split("T")[0], note: "", techniques: [] };
  const [form, setForm] = useState(blank);
  const hunting = data.huntingList || [];

  const save = () => {
    if (!form.code || !form.entry) return;
    onUpdate({ ...data, huntingList: [{ ...form, id: Date.now(), status: "Pending" }, ...hunting] });
    setShowForm(false); setForm(blank);
  };

  const execute = (i) => {
    const h = hunting[i];
    const ji = { id: Date.now(), code: h.code, name: h.name, sector: h.sector, entryPrice: h.entry, sl: h.sl, tp: h.tp, lot: h.lot, rrr: h.rrr, techniques: h.techniques, note: h.note, entryDate: new Date().toISOString().split("T")[0], exitPrice: "", exitDate: "", status: "Open" };
    const u = [...hunting]; u[i] = { ...h, status: "Executed" };
    onUpdate({ ...data, huntingList: u, journal: [ji, ...(data.journal || [])] });
    alert(`${h.code} moved to Trading Journal! ✅`);
  };

  const skip = (i) => { const u = [...hunting]; u[i] = { ...u[i], status: "Skipped" }; onUpdate({ ...data, huntingList: u }); };
  const del = (i) => { if (!window.confirm("Remove?")) return; onUpdate({ ...data, huntingList: hunting.filter((_, x) => x !== i) }); };

  const pending = hunting.filter(h => h.status === "Pending");
  const done = hunting.filter(h => h.status !== "Pending");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.4px" }}>🎯 Hunting List</h1>
        <Btn onClick={() => setShowForm(true)}>+ Add</Btn>
      </div>

      {hunting.length === 0 ? <Empty icon="🎯" title="Hunting List Empty" sub="Add stocks you plan to trade tomorrow." action="+ Add" onAction={() => setShowForm(true)} /> : (
        <>
          {pending.length > 0 && <>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>PENDING ({pending.length})</div>
            <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
              {hunting.map((h, i) => h.status !== "Pending" ? null : (
                <div key={h.id || i} style={{ ...cardStyle, borderLeft: `3px solid ${C.green}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{h.code} <span style={{ fontSize: 11, color: C.textFaint }}>· {h.sector}</span></div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>{h.name} · {h.date}</div>
                    </div>
                    <Pill color={C.green} bg={C.greenLight}>{h.signal}</Pill>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6, marginBottom: 10 }}>
                    {[["ENTRY", `RM ${fmt(h.entry)}`], ["SL", `RM ${fmt(h.sl)}`], ["TP", `RM ${fmt(h.tp)}`], ["LOT", `${Number(h.lot || 0).toLocaleString()}u`]].map(([l, v]) => (
                      <div key={l} style={{ background: C.bg, borderRadius: 7, padding: "7px 8px", textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: C.textFaint, fontWeight: 600 }}>{l}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  {h.techniques?.length > 0 && <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>{h.techniques.map(t => <Pill key={t}>{t}</Pill>)}</div>}
                  {h.note && <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic", marginBottom: 10 }}>📝 {h.note}</div>}
                  <div style={{ display: "flex", gap: 8 }}>
                    <Btn variant="success" style={{ flex: 1 }} onClick={() => execute(i)}>✓ Executed</Btn>
                    <Btn variant="ghost" onClick={() => skip(i)}>Skip</Btn>
                    <Btn variant="danger" style={{ padding: "9px 14px" }} onClick={() => del(i)}>✕</Btn>
                  </div>
                </div>
              ))}
            </div>
          </>}
          {done.length > 0 && <>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>HISTORY ({done.length})</div>
            <div style={{ display: "grid", gap: 6 }}>
              {hunting.map((h, i) => h.status === "Pending" ? null : (
                <div key={h.id || i} style={{ ...cardStyle, opacity: 0.75, padding: "14px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div><div style={{ fontSize: 13, fontWeight: 700 }}>{h.code} · {h.date}</div><div style={{ fontSize: 11, color: C.textMuted }}>Entry: RM {fmt(h.entry)}</div></div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Pill color={h.status === "Executed" ? C.green : C.textMuted} bg={h.status === "Executed" ? C.greenLight : C.bg}>{h.status}</Pill>
                      <Btn variant="danger" style={{ padding: "4px 10px", fontSize: 11 }} onClick={() => del(i)}>✕</Btn>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>}
        </>
      )}

      {showForm && (
        <Modal title="Add to Hunting List" onClose={() => { setShowForm(false); setForm(blank); }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="STOCK CODE"><Inp placeholder="INARI" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} /></Field>
            <Field label="DATE"><Inp type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} /></Field>
          </div>
          <Field label="COMPANY NAME"><Inp value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
          <Field label="SECTOR"><Sel value={form.sector} onChange={e => setForm({...form, sector: e.target.value})}><option value="">Select...</option>{SECTORS.map(s => <option key={s}>{s}</option>)}</Sel></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="ENTRY (RM)"><Inp type="number" step="0.01" value={form.entry} onChange={e => setForm({...form, entry: e.target.value})} /></Field>
            <Field label="STOP LOSS (RM)"><Inp type="number" step="0.01" value={form.sl} onChange={e => setForm({...form, sl: e.target.value})} /></Field>
            <Field label="TARGET (RM)"><Inp type="number" step="0.01" value={form.tp} onChange={e => setForm({...form, tp: e.target.value})} /></Field>
            <Field label="LOT SIZE"><Inp type="number" value={form.lot} onChange={e => setForm({...form, lot: e.target.value})} /></Field>
          </div>
          <Field label="TECHNIQUES"><TechButtons selected={form.techniques} onChange={t => setForm({...form, techniques: t})} /></Field>
          <Field label="NOTES"><Inp value={form.note} onChange={e => setForm({...form, note: e.target.value})} /></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn style={{ flex: 1 }} onClick={save}>Add to List</Btn>
            <Btn variant="ghost" style={{ flex: 1 }} onClick={() => { setShowForm(false); setForm(blank); }}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ============================================================
// TRADING JOURNAL PAGE
// ============================================================
const JournalPage = ({ data, onUpdate }) => {
  const [showForm, setShowForm] = useState(false);
  const [closeIdx, setCloseIdx] = useState(null);
  const [exitF, setExitF] = useState({ exitPrice: "", exitDate: new Date().toISOString().split("T")[0], exitNote: "" });
  const blank = { code: "", name: "", sector: "", entryPrice: "", sl: "", tp: "", lot: "", entryDate: new Date().toISOString().split("T")[0], techniques: [], note: "" };
  const [form, setForm] = useState(blank);
  const journal = data.journal || [];

  const closed = journal.filter(j => j.status === "Closed");
  const open = journal.filter(j => j.status === "Open");
  const wins = closed.filter(j => j.pl > 0).length;
  const winRate = closed.length > 0 ? (wins / closed.length) * 100 : 0;
  const totalPL = closed.reduce((a, j) => a + (j.pl || 0), 0);

  const winsByTechnique = {};
  TECHNIQUES.forEach(t => {
    const trades = closed.filter(j => j.techniques?.includes(t));
    if (trades.length > 0) winsByTechnique[t] = { total: trades.length, wins: trades.filter(j => j.pl > 0).length };
  });

  const save = () => {
    if (!form.code || !form.entryPrice) return;
    onUpdate({ ...data, journal: [{ ...form, id: Date.now(), status: "Open", entryPrice: +form.entryPrice }, ...journal] });
    setShowForm(false); setForm(blank);
  };

  const closeT = (i) => {
    if (!exitF.exitPrice) return;
    const j = journal[i], ep = +exitF.exitPrice;
    const pl = (ep - j.entryPrice) * (j.lot || 0);
    const plPct = ((ep - j.entryPrice) / j.entryPrice) * 100;
    const u = [...journal]; u[i] = { ...j, exitPrice: ep, exitDate: exitF.exitDate, exitNote: exitF.exitNote, pl, plPct, status: "Closed" };
    onUpdate({ ...data, journal: u });
    setCloseIdx(null); setExitF({ exitPrice: "", exitDate: new Date().toISOString().split("T")[0], exitNote: "" });
  };

  const del = (i) => { if (!window.confirm("Delete?")) return; onUpdate({ ...data, journal: journal.filter((_, x) => x !== i) }); };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.4px" }}>📒 Trading Journal</h1>
        <Btn onClick={() => setShowForm(true)}>+ Add Trade</Btn>
      </div>

      {/* Stats */}
      {closed.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 14 }}>
            <StatCard label="WIN RATE" value={`${winRate.toFixed(1)}%`} sub={`${wins}W / ${closed.length - wins}L`} accent={winRate >= 50 ? C.green : C.red} subColor={winRate >= 50 ? C.green : C.red} />
            <StatCard label="TOTAL P&L" value={`${totalPL >= 0 ? "+" : ""}RM ${fmt(totalPL)}`} sub={`${closed.length} closed`} accent={totalPL >= 0 ? C.green : C.red} subColor={totalPL >= 0 ? C.green : C.red} />
            <StatCard label="OPEN" value={open.length.toString()} sub="Active trades" accent={C.amber} />
            <StatCard label="TOTAL" value={journal.length.toString()} sub="All trades" accent={C.primary} />
          </div>

          {/* Technique breakdown */}
          {Object.keys(winsByTechnique).length > 0 && (
            <div style={{ ...cardStyle, marginBottom: 14 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.textMuted, marginBottom: 10 }}>PERFORMANCE BY TECHNIQUE</div>
              <div style={{ display: "grid", gap: 6 }}>
                {Object.entries(winsByTechnique).map(([t, s]) => {
                  const wr = (s.wins / s.total) * 100;
                  return (
                    <div key={t} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12 }}>{t}</span>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 80, background: C.borderLight, borderRadius: 3, height: 6, overflow: "hidden" }}>
                          <div style={{ width: `${wr}%`, height: "100%", background: wr >= 60 ? C.green : wr >= 40 ? C.amber : C.red, borderRadius: 3 }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: wr >= 60 ? C.green : wr >= 40 ? C.amber : C.red, width: 40 }}>{wr.toFixed(0)}%</span>
                        <span style={{ fontSize: 11, color: C.textFaint }}>{s.wins}/{s.total}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {journal.length === 0 ? <Empty icon="📒" title="No Trades Yet" sub="Start recording your trades." action="+ Add Trade" onAction={() => setShowForm(true)} /> : (
        <>
          {open.length > 0 && <>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>OPEN ({open.length})</div>
            <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
              {journal.map((j, i) => j.status !== "Open" ? null : (
                <div key={j.id || i} style={{ ...cardStyle, borderLeft: `3px solid ${C.amber}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800 }}>{j.code} <span style={{ fontSize: 11, color: C.textFaint }}>· {j.sector}</span></div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>Entry: RM {fmt(j.entryPrice)} · {j.entryDate} · {Number(j.lot || 0).toLocaleString()} units</div>
                    </div>
                    <Pill color={C.amber} bg={C.amberLight}>OPEN</Pill>
                  </div>
                  <div style={{ display: "flex", gap: 10, marginBottom: 8, flexWrap: "wrap" }}>
                    {j.sl && <span style={{ fontSize: 11 }}>🛡 SL: <strong>RM {fmt(j.sl)}</strong></span>}
                    {j.tp && <span style={{ fontSize: 11 }}>🎯 TP: <strong>RM {fmt(j.tp)}</strong></span>}
                  </div>
                  {j.techniques?.length > 0 && <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 8 }}>{j.techniques.map(t => <Pill key={t}>{t}</Pill>)}</div>}

                  {closeIdx === i ? (
                    <div style={{ background: C.bg, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10 }}>Close Trade</div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
                        <Field label="EXIT PRICE (RM)"><Inp type="number" step="0.01" value={exitF.exitPrice} onChange={e => setExitF({...exitF, exitPrice: e.target.value})} /></Field>
                        <Field label="EXIT DATE"><Inp type="date" value={exitF.exitDate} onChange={e => setExitF({...exitF, exitDate: e.target.value})} /></Field>
                      </div>
                      <Field label="REASON / NOTE"><Inp placeholder="Hit TP / SL / Manual exit..." value={exitF.exitNote} onChange={e => setExitF({...exitF, exitNote: e.target.value})} /></Field>
                      <div style={{ display: "flex", gap: 8 }}>
                        <Btn variant="success" style={{ flex: 1 }} onClick={() => closeT(i)}>Confirm Close</Btn>
                        <Btn variant="ghost" onClick={() => setCloseIdx(null)}>Cancel</Btn>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: 8 }}>
                      <Btn variant="success" onClick={() => setCloseIdx(i)}>Close Trade</Btn>
                      <Btn variant="danger" style={{ padding: "9px 14px" }} onClick={() => del(i)}>✕</Btn>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>}

          {closed.length > 0 && <>
            <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, marginBottom: 8 }}>CLOSED ({closed.length})</div>
            <div style={{ display: "grid", gap: 8 }}>
              {journal.map((j, i) => j.status !== "Closed" ? null : (
                <div key={j.id || i} style={{ ...cardStyle, borderLeft: `3px solid ${j.pl >= 0 ? C.green : C.red}`, padding: "14px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 4 }}>
                        <div style={{ fontSize: 13, fontWeight: 800 }}>{j.code}</div>
                        <Pill color={j.pl >= 0 ? C.green : C.red} bg={j.pl >= 0 ? C.greenLight : C.redLight}>{j.pl >= 0 ? "WIN ✓" : "LOSE ✗"}</Pill>
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>RM {fmt(j.entryPrice)} → RM {fmt(j.exitPrice)} · {j.entryDate} to {j.exitDate}</div>
                      {j.techniques?.length > 0 && <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>{j.techniques.map(t => <Pill key={t}>{t}</Pill>)}</div>}
                      {j.exitNote && <div style={{ fontSize: 11, color: C.textMuted, fontStyle: "italic", marginTop: 3 }}>📝 {j.exitNote}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: j.pl >= 0 ? C.green : C.red, fontFamily: "'DM Mono',monospace" }}>{j.pl >= 0 ? "+" : ""}RM {fmt(j.pl)}</div>
                      <div style={{ fontSize: 11, color: j.pl >= 0 ? C.green : C.red }}>{fmtPct(j.plPct)}</div>
                      <Btn variant="danger" style={{ padding: "3px 9px", fontSize: 10, marginTop: 5 }} onClick={() => del(i)}>✕</Btn>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>}
        </>
      )}

      {showForm && (
        <Modal title="Add Trade Record" onClose={() => { setShowForm(false); setForm(blank); }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="STOCK CODE"><Inp placeholder="MAYBANK" value={form.code} onChange={e => setForm({...form, code: e.target.value.toUpperCase()})} /></Field>
            <Field label="ENTRY DATE"><Inp type="date" value={form.entryDate} onChange={e => setForm({...form, entryDate: e.target.value})} /></Field>
          </div>
          <Field label="COMPANY NAME"><Inp value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
          <Field label="SECTOR"><Sel value={form.sector} onChange={e => setForm({...form, sector: e.target.value})}><option value="">Select...</option>{SECTORS.map(s => <option key={s}>{s}</option>)}</Sel></Field>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="ENTRY PRICE (RM)"><Inp type="number" step="0.01" value={form.entryPrice} onChange={e => setForm({...form, entryPrice: e.target.value})} /></Field>
            <Field label="LOT SIZE"><Inp type="number" value={form.lot} onChange={e => setForm({...form, lot: e.target.value})} /></Field>
            <Field label="STOP LOSS (RM)"><Inp type="number" step="0.01" value={form.sl} onChange={e => setForm({...form, sl: e.target.value})} /></Field>
            <Field label="TARGET (RM)"><Inp type="number" step="0.01" value={form.tp} onChange={e => setForm({...form, tp: e.target.value})} /></Field>
          </div>
          <Field label="TECHNIQUES"><TechButtons selected={form.techniques} onChange={t => setForm({...form, techniques: t})} /></Field>
          <Field label="NOTES"><Inp value={form.note} onChange={e => setForm({...form, note: e.target.value})} /></Field>
          <div style={{ display: "flex", gap: 10 }}>
            <Btn style={{ flex: 1 }} onClick={save}>Save Trade</Btn>
            <Btn variant="ghost" style={{ flex: 1 }} onClick={() => { setShowForm(false); setForm(blank); }}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ============================================================
// SETTINGS PAGE
// ============================================================
const SettingsPage = ({ data, onUpdate, onLogout }) => {
  const [f, setF] = useState({ ...data.settings });
  const [saved, setSaved] = useState(false);

  const saveSett = () => { onUpdate({ ...data, settings: { ...f, setupDone: true } }); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `legasi-studio-${new Date().toISOString().split("T")[0]}.json`; a.click();
  };

  const importData = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => { try { onUpdate(JSON.parse(ev.target.result)); alert("Imported!"); } catch { alert("Invalid file."); } };
    reader.readAsText(file);
  };

  const clearAll = () => { if (!window.confirm("Clear ALL data?")) return; if (!window.confirm("Really sure?")) return; onUpdate(defaultData()); };

  return (
    <div>
      <h1 style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.4px", marginBottom: 18 }}>⚙️ Settings</h1>

      <div style={{ ...cardStyle, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>👤 Trading Profile</div>
        <Field label="BROKER"><Sel value={f.broker} onChange={e => setF({...f, broker: e.target.value})}><option value="">Select...</option>{BROKERS.map(b => <option key={b}>{b}</option>)}</Sel></Field>
        <Field label="TRADING CAPITAL (RM)"><Inp type="number" value={f.modal} onChange={e => setF({...f, modal: e.target.value})} /></Field>
        <Field label="DEFAULT RRR (1:?)"><Sel value={f.defaultRRR} onChange={e => setF({...f, defaultRRR: e.target.value})}><option value="2">1:2</option><option value="3">1:3</option><option value="4">1:4</option><option value="5">1:5</option></Sel></Field>
        <Field label="PORTFOLIO PIN (4 digits)"><Inp type="password" maxLength={4} value={f.pin} onChange={e => setF({...f, pin: e.target.value.replace(/\D/g, "")})} /></Field>
        <Btn onClick={saveSett}>{saved ? "✓ Saved!" : "Save Settings"}</Btn>
      </div>

      <div style={{ ...cardStyle, marginBottom: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>💾 Data Management</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Btn variant="ghost" style={{ textAlign: "left" }} onClick={exportData}>📥 Export Backup</Btn>
          <label style={{ ...btn, background: "#EFF6FF", color: C.primary, border: `1px solid ${C.primaryBorder}`, textAlign: "left", cursor: "pointer" }}>
            📤 Import Backup <input type="file" accept=".json" onChange={importData} style={{ display: "none" }} />
          </label>
          <Btn variant="danger" style={{ textAlign: "left" }} onClick={clearAll}>🗑 Clear All Data</Btn>
        </div>
      </div>

      <div style={{ ...cardStyle }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>🔐 Session</div>
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 14 }}>App password: <strong>legasi2026</strong> (edit in code to change)</div>
        <Btn variant="danger" onClick={onLogout}>🚪 Logout</Btn>
      </div>

      <div style={{ textAlign: "center", marginTop: 24, fontSize: 10, color: C.textFaint }}>
        LEGASI STUDIO v2.0 · Encik Bos<br />
        SYSTEM BUILT BY COMMAND, TRADED BY DISCIPLINE
      </div>
    </div>
  );
};

// ============================================================
// ROOT APP
// ============================================================
export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [pinUnlocked, setPinUnlocked] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [page, setPage] = useState("portfolio");
  const [data, setData] = useState(() => loadData() || defaultData());

  useEffect(() => { saveData(data); }, [data]);

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />;
  if (!data.settings?.setupDone) return <SetupWizard onComplete={(settings) => setData({ ...data, settings })} />;

  const NAV = [
    { id: "portfolio", label: "Portfolio", icon: "◎" },
    { id: "watchlist", label: "Watchlist", icon: "★" },
    { id: "technical", label: "Analysis",  icon: "❤️" },
    { id: "hunting",   label: "Hunting",   icon: "🎯" },
    { id: "journal",   label: "Journal",   icon: "📒" },
    { id: "settings",  label: "Settings",  icon: "⚙️" },
  ];

  return (
    <div style={{ fontFamily: "'Sora',sans-serif", background: C.bg, minHeight: "100vh", color: C.text }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500;600&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        textarea, select, input { font-family:'Sora',sans-serif; }
      `}</style>

      <header style={{ background: `linear-gradient(135deg, #0A3260 0%, #0F4C81 100%)`, padding: "0 18px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 2px 12px rgba(15,76,129,0.3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 38, height: 38, background: "rgba(255,255,255,0.15)", borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
            <span style={{ color: "#fff", fontSize: 16, fontWeight: 800 }}>L</span>
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "0.5px", color: "#fff" }}>LEGASI STUDIO</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.65)", letterSpacing: "1.5px", fontWeight: 600 }}>BURSA ANALITIK PRO</div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{getTime()}, <strong>Encik Bos</strong> 👋</div>
          <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)" }}>{new Date().toLocaleDateString("ms-MY", { weekday: "short", day: "numeric", month: "short" })}</div>
        </div>
      </header>

      <nav style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "0 14px", display: "flex", overflowX: "auto", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        {NAV.map(n => (
          <button key={n.id} onClick={() => setPage(n.id)}
            style={{ padding: "12px 14px", border: "none", background: "none", cursor: "pointer", fontSize: 12, fontWeight: page === n.id ? 700 : 400, color: page === n.id ? C.primary : C.textMuted, borderBottom: page === n.id ? `2.5px solid ${C.primary}` : "2.5px solid transparent", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 5, transition: "all 0.15s", fontFamily: "'Sora',sans-serif" }}>
            <span style={{ fontSize: 13 }}>{n.icon}</span> {n.label}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: 880, margin: "0 auto", padding: "18px 12px", animation: "fadeIn 0.25s ease" }}>
        {/* Page Banner */}
        <div style={{ background: `linear-gradient(135deg, #EFF6FF, #DBEAFE)`, borderRadius: 12, padding: "14px 18px", marginBottom: 18, border: `1px solid ${C.primaryBorder}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, color: C.primary, fontWeight: 700, letterSpacing: 0.5 }}>LEGASI STUDIO · BURSA ANALITIK PRO</div>
            <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>SYSTEM BUILT BY COMMAND, TRADED BY DISCIPLINE</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, color: C.textFaint }}>Modal</div>
            <div style={{ fontSize: 13, fontWeight: 800, fontFamily: "'DM Mono',monospace", color: C.primary }}>RM {Number(data.settings?.modal || 0).toLocaleString()}</div>
          </div>
        </div>
        {page === "portfolio" && <PortfolioPage data={data} onUpdate={setData} pinUnlocked={pinUnlocked} onRequestPin={() => setShowPin(true)} />}
        {page === "watchlist" && <WatchlistPage data={data} onUpdate={setData} />}
        {page === "technical" && <TechnicalPage data={data} onUpdate={setData} />}
        {page === "hunting"   && <HuntingPage   data={data} onUpdate={setData} />}
        {page === "journal"   && <JournalPage   data={data} onUpdate={setData} />}
        {page === "settings"  && <SettingsPage  data={data} onUpdate={setData} onLogout={() => { setLoggedIn(false); setPinUnlocked(false); }} />}
      </main>

      {showPin && <PinScreen savedPin={data.settings?.pin || "1234"} onUnlock={() => { setPinUnlocked(true); setShowPin(false); }} onCancel={() => setShowPin(false)} />}

      <footer style={{ background: `linear-gradient(135deg, #0A3260, #0F4C81)`, padding: "16px 18px", marginTop: 20 }}>
        <div style={{ textAlign: "center", fontSize: 10, color: "rgba(255,255,255,0.5)", letterSpacing: 0.5 }}>
          LEGASI STUDIO · BURSA ANALITIK PRO · v2.0<br />
          <span style={{ fontSize: 9, opacity: 0.6 }}>SYSTEM BUILT BY COMMAND, TRADED BY DISCIPLINE</span>
        </div>
      </footer>
    </div>
  );
}
