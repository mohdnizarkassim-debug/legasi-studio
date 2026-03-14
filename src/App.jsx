import { useState, useEffect, useCallback } from "react";

// ============================================================
// PORTFOLIO — Edit unit & harga beli ikut portfolio sebenar kau
// ============================================================
const MY_PORTFOLIO = [
  { code: "1155.KL", display: "MAYBANK",  exchange: "KLSE", unit: 1000, beliPrice: 9.20,  name: "Malayan Banking Bhd",   sector: "Banking"   },
  { code: "1295.KL", display: "PBBANK",   exchange: "KLSE", unit: 2000, beliPrice: 4.10,  name: "Public Bank Bhd",        sector: "Banking"   },
  { code: "1023.KL", display: "CIMB",     exchange: "KLSE", unit: 1500, beliPrice: 7.50,  name: "CIMB Group Holdings",    sector: "Banking"   },
  { code: "5347.KL", display: "TENAGA",   exchange: "KLSE", unit: 500,  beliPrice: 11.00, name: "Tenaga Nasional Bhd",    sector: "Utilities" },
];

// ============================================================
// FALLBACK DATA
// ============================================================
const FALLBACK = {
  "1155.KL": { price: 9.52,  change: 0.12,  pct: 1.28,  pe: 12.3, dy: 5.8, roe: 11.2, high: 10.20, low: 8.60,  volume: "12.3M" },
  "1295.KL": { price: 4.21,  change: -0.03, pct: -0.71, pe: 13.1, dy: 4.2, roe: 13.5, high: 4.80,  low: 3.90,  volume: "8.7M"  },
  "1023.KL": { price: 7.85,  change: 0.15,  pct: 1.95,  pe: 10.8, dy: 5.1, roe: 10.3, high: 8.20,  low: 6.50,  volume: "18.1M" },
  "5347.KL": { price: 11.30, change: 0.08,  pct: 0.71,  pe: 15.6, dy: 3.9, roe: 9.8,  high: 12.50, low: 10.10, volume: "5.2M"  },
};

// ============================================================
// YAHOO FINANCE API — Guna CORS proxy
// ============================================================
const PROXY = "https://corsproxy.io/?";

async function fetchYahooQuote(symbol) {
  try {
    const url = `${PROXY}${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`)}`;
    const res = await fetch(url);
    const data = await res.json();
    const q = data?.chart?.result?.[0];
    if (!q) throw new Error("No data");
    const meta = q.meta;
    const price  = meta.regularMarketPrice;
    const prev   = meta.chartPreviousClose || meta.previousClose;
    const change = price - prev;
    const pct    = (change / prev) * 100;
    return {
      price,
      change,
      pct,
      high:   meta.fiftyTwoWeekHigh  || meta.regularMarketDayHigh,
      low:    meta.fiftyTwoWeekLow   || meta.regularMarketDayLow,
      volume: formatVolume(meta.regularMarketVolume),
    };
  } catch {
    return null;
  }
}

async function fetchYahooCandles(symbol) {
  try {
    const url = `${PROXY}${encodeURIComponent(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1mo`)}`;
    const res = await fetch(url);
    const data = await res.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error();
    const timestamps = result.timestamp;
    const closes     = result.indicators.quote[0].close;
    return timestamps.map((t, i) => ({
      date:  new Date(t * 1000).toISOString().split("T")[0],
      close: closes[i] || 0,
    })).filter(c => c.close > 0);
  } catch {
    return null;
  }
}

function formatVolume(n) {
  if (!n) return "—";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
  return n.toString();
}

// ============================================================
// HELPER COMPONENTS
// ============================================================
const Pill = ({ children, color = "#0F4C81", bg = "#EFF6FF" }) => (
  <span style={{ background: bg, color, borderRadius: 20, padding: "2px 10px", fontSize: 11, fontWeight: 600 }}>{children}</span>
);

const StatBox = ({ label, value, sub, subColor }) => (
  <div style={{ background: "#fff", borderRadius: 12, padding: "16px 18px", border: "1px solid #E2E8F0", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
    <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 600, letterSpacing: 0.6, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 19, fontWeight: 700, fontFamily: "'DM Mono',monospace", letterSpacing: "-0.5px" }}>{value}</div>
    {sub && <div style={{ fontSize: 12, color: subColor || "#64748B", marginTop: 4, fontWeight: 500 }}>{sub}</div>}
  </div>
);

const MiniChart = ({ candles, positive }) => {
  if (!candles || candles.length < 2) {
    const pts = positive
      ? "0,22 20,19 40,15 60,17 80,11 100,8 120,5 140,9 160,4 180,2 200,1"
      : "0,2  20,5  40,7  60,5  80,10 100,12 120,15 140,13 160,17 180,20 200,22";
    return (
      <svg width="100%" height="40" viewBox="0 0 200 24" preserveAspectRatio="none">
        <polyline points={pts} fill="none" stroke={positive ? "#059669" : "#DC2626"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  const closes = candles.map(c => c.close);
  const mn = Math.min(...closes), mx = Math.max(...closes);
  const W = 200, H = 40, pad = 4;
  const pts = closes.map((v, i) => {
    const x = (i / (closes.length - 1)) * W;
    const y = pad + ((mx - v) / (mx - mn || 1)) * (H - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const fillPts = `0,${H} ${pts} ${W},${H}`;
  return (
    <svg width="100%" height="40" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <defs>
        <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={positive ? "#059669" : "#DC2626"} stopOpacity="0.2" />
          <stop offset="100%" stopColor={positive ? "#059669" : "#DC2626"} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={fillPts} fill="url(#cg)" />
      <polyline points={pts} fill="none" stroke={positive ? "#059669" : "#DC2626"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

const LoadingCard = () => (
  <div style={{ background: "#fff", borderRadius: 12, padding: 20, border: "1px solid #E2E8F0" }}>
    {[80, 50, 65].map((w, i) => (
      <div key={i} style={{ height: 14, background: "#F1F5F9", borderRadius: 6, width: `${w}%`, marginBottom: 10, animation: "pulse 1.5s ease-in-out infinite" }} />
    ))}
  </div>
);

// ============================================================
// MAIN APP
// ============================================================
export default function SahamIQ() {
  const [page, setPage]           = useState("dashboard");
  const [stocks, setStocks]       = useState({});
  const [candles, setCandles]     = useState({});
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [watchlist, setWatchlist] = useState(["1155.KL", "1023.KL"]);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const results = {};
    let anyReal = false;

    for (const s of MY_PORTFOLIO) {
      const q = await fetchYahooQuote(s.code);
      if (q) {
        results[s.code] = { ...FALLBACK[s.code], ...q };
        anyReal = true;
      } else {
        results[s.code] = FALLBACK[s.code];
      }
    }

    setStocks(results);
    setUsingFallback(!anyReal);
    setLastUpdate(new Date());
    setLoading(false);

    for (const s of MY_PORTFOLIO) {
      const c = await fetchYahooCandles(s.code);
      if (c) setCandles(prev => ({ ...prev, [s.code]: c }));
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const portfolioStats = MY_PORTFOLIO.map(s => {
    const live = stocks[s.code];
    if (!live) return null;
    const cost    = s.unit * s.beliPrice;
    const current = s.unit * live.price;
    const pl      = current - cost;
    const plPct   = (pl / cost) * 100;
    const divEst  = s.unit * live.price * (live.dy / 100);
    return { ...s, ...live, cost, current, pl, plPct, divEst };
  }).filter(Boolean);

  const totalCost    = portfolioStats.reduce((a, s) => a + s.cost, 0);
  const totalCurrent = portfolioStats.reduce((a, s) => a + s.current, 0);
  const totalPL      = totalCurrent - totalCost;
  const totalPLPct   = (totalPL / totalCost) * 100;
  const totalDiv     = portfolioStats.reduce((a, s) => a + s.divEst, 0);

  const fmt = (n) => n.toLocaleString("ms-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const goDetail = (code) => {
    const s = MY_PORTFOLIO.find(p => p.code === code);
    setSelected({ ...s, ...stocks[code] });
    setPage("detail");
  };

  const getDisplay = (code) => MY_PORTFOLIO.find(p => p.code === code)?.display || code;

  return (
    <div style={{ fontFamily: "'Sora', sans-serif", background: "#F0F4F8", minHeight: "100vh", color: "#0F172A" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .card { animation: fadeIn 0.3s ease forwards; }
        .row-hover:hover { background: #F8FAFC !important; }
        button { font-family: 'Sora', sans-serif; }
      `}</style>

      {/* HEADER */}
      <header style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "0 20px", height: 58, display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 34, height: 34, background: "linear-gradient(135deg,#0F4C81,#2563EB)", borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#fff", fontSize: 15, fontWeight: 800 }}>S</span>
          </div>
          <span style={{ fontSize: 17, fontWeight: 800, letterSpacing: "-0.4px" }}>Saham<span style={{ color: "#0F4C81" }}>IQ</span></span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {usingFallback && <Pill color="#D97706" bg="#FEF3C7">⚠ Demo Data</Pill>}
          {!usingFallback && !loading && <Pill color="#059669" bg="#D1FAE5">● Live</Pill>}
          <button onClick={loadData} style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #E2E8F0", background: "#F8FAFC", cursor: "pointer", fontSize: 14 }}>↻</button>
          {lastUpdate && <span style={{ fontSize: 11, color: "#94A3B8" }}>{lastUpdate.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>
      </header>

      {/* NAV */}
      <nav style={{ background: "#fff", borderBottom: "1px solid #E2E8F0", padding: "0 20px", display: "flex", overflowX: "auto" }}>
        {[
          { id: "dashboard", label: "Dashboard", icon: "⊞" },
          { id: "portfolio", label: "Portfolio",  icon: "◎" },
          { id: "watchlist", label: "Watchlist",  icon: "★" },
          { id: "screener",  label: "Maklumat",   icon: "⊙" },
        ].map(n => (
          <button key={n.id} onClick={() => { setPage(n.id); setSelected(null); }}
            style={{ padding: "12px 16px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: page === n.id ? 700 : 400, color: page === n.id ? "#0F4C81" : "#64748B", borderBottom: page === n.id ? "2.5px solid #0F4C81" : "2.5px solid transparent", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}>
            {n.icon} {n.label}
            {n.id === "watchlist" && <span style={{ background: "#EFF6FF", color: "#0F4C81", borderRadius: 10, padding: "1px 7px", fontSize: 10, fontWeight: 700 }}>{watchlist.length}</span>}
          </button>
        ))}
      </nav>

      <main style={{ maxWidth: 960, margin: "0 auto", padding: "20px 14px" }}>

        {/* DASHBOARD */}
        {page === "dashboard" && (
          <div className="card">
            <div style={{ marginBottom: 20 }}>
              <h1 style={{ fontSize: 21, fontWeight: 800, letterSpacing: "-0.5px" }}>Selamat Datang 👋</h1>
              <p style={{ fontSize: 13, color: "#64748B", marginTop: 3 }}>
                {new Date().toLocaleDateString("ms-MY", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>

            {!loading && (
              <div style={{ background: "linear-gradient(135deg,#0F4C81 0%,#1D6FB8 100%)", borderRadius: 16, padding: "22px 24px", color: "#fff", marginBottom: 20, boxShadow: "0 4px 20px rgba(15,76,129,0.25)" }}>
                <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: 0.6, marginBottom: 6 }}>JUMLAH NILAI PORTFOLIO</div>
                <div style={{ fontSize: 32, fontWeight: 800, fontFamily: "'DM Mono',monospace", letterSpacing: "-1px" }}>RM {fmt(totalCurrent)}</div>
                <div style={{ fontSize: 13, marginTop: 4, opacity: 0.9, fontWeight: 500 }}>
                  {totalPL >= 0 ? "▲" : "▼"} RM {fmt(Math.abs(totalPL))} ({totalPLPct >= 0 ? "+" : ""}{totalPLPct.toFixed(2)}%) keseluruhan
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 18, paddingTop: 18, borderTop: "1px solid rgba(255,255,255,0.2)" }}>
                  {[
                    { label: "Modal Asal",        val: `RM ${fmt(totalCost)}` },
                    { label: "Untung/Rugi",        val: `${totalPL >= 0 ? "+" : ""}RM ${fmt(totalPL)}` },
                    { label: "Est. Dividen/Tahun", val: `RM ${fmt(totalDiv)}` },
                  ].map((item, i) => (
                    <div key={i}>
                      <div style={{ fontSize: 10, opacity: 0.65, marginBottom: 4 }}>{item.label}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{item.val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: "#64748B", letterSpacing: 0.3 }}>SAHAM KAMU</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
              {loading ? MY_PORTFOLIO.map((_, i) => <LoadingCard key={i} />) :
                MY_PORTFOLIO.map(s => {
                  const live = stocks[s.code];
                  if (!live) return null;
                  return (
                    <div key={s.code} className="card" onClick={() => goDetail(s.code)}
                      style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #E2E8F0", cursor: "pointer", transition: "all 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(15,76,129,0.12)"; e.currentTarget.style.borderColor = "#BFDBFE"; }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"; e.currentTarget.style.borderColor = "#E2E8F0"; }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800 }}>{s.display}</div>
                          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 1 }}>{s.sector}</div>
                        </div>
                        <Pill color={live.pct >= 0 ? "#059669" : "#DC2626"} bg={live.pct >= 0 ? "#D1FAE5" : "#FEE2E2"}>
                          {live.pct >= 0 ? "▲" : "▼"} {Math.abs(live.pct).toFixed(2)}%
                        </Pill>
                      </div>
                      <div style={{ height: 40, marginBottom: 8 }}>
                        <MiniChart candles={candles[s.code]} positive={live.pct >= 0} />
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'DM Mono',monospace", letterSpacing: "-0.5px" }}>RM {live.price.toFixed(2)}</div>
                      <div style={{ fontSize: 11, color: "#64748B", marginTop: 4 }}>PE {live.pe} · DY {live.dy}% · ROE {live.roe}%</div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        )}

        {/* PORTFOLIO */}
        {page === "portfolio" && (
          <div className="card">
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, letterSpacing: "-0.5px" }}>◎ Portfolio Kamu</h1>
            {!loading && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 12, marginBottom: 20 }}>
                  <StatBox label="NILAI SEMASA"   value={`RM ${fmt(totalCurrent)}`} sub={`Modal: RM ${fmt(totalCost)}`} />
                  <StatBox label="UNTUNG / RUGI"  value={`${totalPL >= 0 ? "+" : ""}RM ${fmt(totalPL)}`} sub={`${totalPLPct >= 0 ? "+" : ""}${totalPLPct.toFixed(2)}%`} subColor={totalPL >= 0 ? "#059669" : "#DC2626"} />
                  <StatBox label="EST. DIVIDEN"   value={`RM ${fmt(totalDiv)}`} sub="Setahun (anggaran)" />
                  <StatBox label="BILANGAN SAHAM" value={MY_PORTFOLIO.length.toString()} sub="Dalam portfolio" />
                </div>

                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid #E2E8F0", fontSize: 13, fontWeight: 700 }}>Pegangan Saham</div>
                  {portfolioStats.map((s, i) => (
                    <div key={s.code} className="row-hover" style={{ padding: "16px 20px", borderBottom: i < portfolioStats.length - 1 ? "1px solid #F1F5F9" : "none", cursor: "pointer" }} onClick={() => goDetail(s.code)}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#0F4C81" }}>{s.display.slice(0, 2)}</div>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{s.display}</div>
                            <div style={{ fontSize: 11, color: "#94A3B8" }}>{s.unit.toLocaleString()} unit · Beli @ RM {s.beliPrice.toFixed(2)}</div>
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>RM {fmt(s.current)}</div>
                          <div style={{ fontSize: 12, color: s.pl >= 0 ? "#059669" : "#DC2626", fontWeight: 600 }}>
                            {s.pl >= 0 ? "▲ +" : "▼ "}RM {fmt(Math.abs(s.pl))} ({s.plPct >= 0 ? "+" : ""}{s.plPct.toFixed(2)}%)
                          </div>
                        </div>
                      </div>
                      <div style={{ background: "#F1F5F9", borderRadius: 4, height: 5, overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(Math.abs(s.plPct) * 4, 100)}%`, height: "100%", background: s.pl >= 0 ? "#059669" : "#DC2626", borderRadius: 4 }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>Harga semasa: RM {s.price.toFixed(2)}</span>
                        <span style={{ fontSize: 11, color: "#94A3B8" }}>Est. Dividen: RM {fmt(s.divEst)}/tahun</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0", padding: "18px 20px", marginTop: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 14 }}>Agihan Portfolio</div>
                  {portfolioStats.map(s => {
                    const pct = (s.current / totalCurrent) * 100;
                    const colors = { "1155.KL": "#0F4C81", "1295.KL": "#059669", "1023.KL": "#D97706", "5347.KL": "#7C3AED" };
                    return (
                      <div key={s.code} style={{ marginBottom: 10 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{s.display}</span>
                          <span style={{ fontSize: 12, fontFamily: "'DM Mono',monospace", color: "#64748B" }}>{pct.toFixed(1)}%</span>
                        </div>
                        <div style={{ background: "#F1F5F9", borderRadius: 4, height: 8, overflow: "hidden" }}>
                          <div style={{ width: `${pct}%`, height: "100%", background: colors[s.code] || "#0F4C81", borderRadius: 4, transition: "width 1s ease" }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {loading && <div style={{ textAlign: "center", padding: 40, color: "#94A3B8" }}>Memuatkan data portfolio...</div>}
          </div>
        )}

        {/* WATCHLIST */}
        {page === "watchlist" && (
          <div className="card">
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, letterSpacing: "-0.5px" }}>★ Watchlist Kamu</h1>
            {watchlist.length === 0 ? (
              <div style={{ textAlign: "center", padding: "50px 20px", background: "#fff", borderRadius: 14, border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>☆</div>
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Watchlist masih kosong</h3>
                <p style={{ fontSize: 13, color: "#64748B", marginBottom: 18 }}>Pergi ke Maklumat dan tambah saham yang kamu minati.</p>
                <button onClick={() => setPage("screener")} style={{ padding: "10px 22px", background: "#0F4C81", color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer" }}>Buka Maklumat →</button>
              </div>
            ) : (
              <div style={{ display: "grid", gap: 10 }}>
                {MY_PORTFOLIO.filter(s => watchlist.includes(s.code)).map(s => {
                  const live = stocks[s.code];
                  if (!live) return null;
                  return (
                    <div key={s.code} style={{ background: "#fff", borderRadius: 14, padding: "16px 18px", border: "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }} onClick={() => goDetail(s.code)}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#0F4C81" }}>{s.display.slice(0, 2)}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{s.display}</div>
                          <div style={{ fontSize: 11, color: "#94A3B8" }}>{s.name}</div>
                          <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>PE {live.pe} · DY {live.dy}% · ROE {live.roe}%</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                        <div style={{ width: 80 }}><MiniChart candles={candles[s.code]} positive={live.pct >= 0} /></div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 15, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>RM {live.price.toFixed(2)}</div>
                          <div style={{ fontSize: 12, color: live.pct >= 0 ? "#059669" : "#DC2626", fontWeight: 600 }}>{live.pct >= 0 ? "▲" : "▼"} {Math.abs(live.pct).toFixed(2)}%</div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setWatchlist(prev => prev.filter(c => c !== s.code)); }}
                          style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #FED7AA", background: "#FEF9C3", cursor: "pointer", fontSize: 15 }}>★</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MAKLUMAT */}
        {page === "screener" && !selected && (
          <div className="card">
            <h1 style={{ fontSize: 20, fontWeight: 800, marginBottom: 20, letterSpacing: "-0.5px" }}>⊙ Maklumat Saham</h1>
            <div style={{ display: "grid", gap: 10 }}>
              {MY_PORTFOLIO.map(s => {
                const live = stocks[s.code];
                if (!live) return <LoadingCard key={s.code} />;
                return (
                  <div key={s.code} className="row-hover" style={{ background: "#fff", borderRadius: 14, padding: "16px 20px", border: "1px solid #E2E8F0", cursor: "pointer", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", transition: "all 0.15s" }} onClick={() => goDetail(s.code)}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 42, height: 42, borderRadius: 11, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#0F4C81" }}>{s.display.slice(0, 2)}</div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800 }}>{s.display} <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 400 }}>· {s.sector}</span></div>
                          <div style={{ fontSize: 12, color: "#64748B" }}>{s.name}</div>
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>RM {live.price.toFixed(2)}</div>
                          <Pill color={live.pct >= 0 ? "#059669" : "#DC2626"} bg={live.pct >= 0 ? "#D1FAE5" : "#FEE2E2"}>
                            {live.pct >= 0 ? "▲" : "▼"} {Math.abs(live.pct).toFixed(2)}%
                          </Pill>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setWatchlist(prev => prev.includes(s.code) ? prev.filter(c => c !== s.code) : [...prev, s.code]); }}
                          style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #E2E8F0", background: watchlist.includes(s.code) ? "#FEF9C3" : "#F8FAFC", cursor: "pointer", fontSize: 15 }}>
                          {watchlist.includes(s.code) ? "★" : "☆"}
                        </button>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 16, marginTop: 10, paddingTop: 10, borderTop: "1px solid #F1F5F9", flexWrap: "wrap" }}>
                      {[["P/E Ratio", live.pe + "x"], ["Dividen Yield", live.dy + "%"], ["ROE", live.roe + "%"], ["52W High", "RM " + live.high], ["52W Low", "RM " + live.low]].map(([l, v]) => (
                        <div key={l}>
                          <div style={{ fontSize: 10, color: "#94A3B8" }}>{l}</div>
                          <div style={{ fontSize: 12, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DETAIL */}
        {page === "detail" && selected && (
          <div className="card">
            <button onClick={() => { setPage("screener"); setSelected(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#0F4C81", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 6 }}>
              ← Kembali
            </button>

            <div style={{ background: "#fff", borderRadius: 14, padding: "22px", border: "1px solid #E2E8F0", marginBottom: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 12, background: "#EFF6FF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#0F4C81" }}>{selected.display?.slice(0, 2)}</div>
                  <div>
                    <h1 style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px" }}>{selected.display}</h1>
                    <p style={{ fontSize: 13, color: "#64748B" }}>{selected.name} · <Pill>{selected.sector}</Pill></p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 30, fontWeight: 800, fontFamily: "'DM Mono',monospace", letterSpacing: "-1px" }}>RM {selected.price?.toFixed(2)}</div>
                  <div style={{ fontSize: 14, color: (selected.pct || 0) >= 0 ? "#059669" : "#DC2626", fontWeight: 700 }}>
                    {(selected.pct || 0) >= 0 ? "▲" : "▼"} RM {Math.abs(selected.change || 0).toFixed(2)} ({Math.abs(selected.pct || 0).toFixed(2)}%)
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 18, background: "#F8FAFC", borderRadius: 10, padding: "14px 12px", border: "1px solid #E2E8F0" }}>
                <MiniChart candles={candles[selected.code]} positive={(selected.pct || 0) >= 0} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "#94A3B8", marginTop: 4 }}>
                  <span>30 hari lepas</span><span>Semasa</span>
                </div>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(130px,1fr))", gap: 10, marginBottom: 14 }}>
              {[
                ["P/E Ratio",     (selected.pe  || "—") + "x"],
                ["Dividen Yield", (selected.dy  || "—") + "%"],
                ["ROE",           (selected.roe || "—") + "%"],
                ["52W Tinggi",    "RM " + (selected.high || "—")],
                ["52W Rendah",    "RM " + (selected.low  || "—")],
                ["Volume",        selected.volume || "—"],
              ].map(([l, v]) => (
                <div key={l} style={{ background: "#fff", borderRadius: 10, padding: "14px 16px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 10, color: "#94A3B8", marginBottom: 5 }}>{l}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{v}</div>
                </div>
              ))}
            </div>

            {(() => {
              const pos = MY_PORTFOLIO.find(p => p.code === selected.code);
              if (!pos) return null;
              const cost  = pos.unit * pos.beliPrice;
              const curr  = pos.unit * selected.price;
              const pl    = curr - cost;
              const plPct = (pl / cost) * 100;
              return (
                <div style={{ background: "linear-gradient(135deg,#0F4C81,#1D6FB8)", borderRadius: 14, padding: "20px 22px", color: "#fff", marginBottom: 14 }}>
                  <div style={{ fontSize: 11, opacity: 0.75, marginBottom: 10 }}>📊 KEDUDUKAN KAMU</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                    {[
                      ["Unit Dipegang", pos.unit.toLocaleString() + " unit"],
                      ["Harga Beli",    "RM " + pos.beliPrice.toFixed(2)],
                      ["Kos Modal",     "RM " + fmt(cost)],
                      ["Nilai Semasa",  "RM " + fmt(curr)],
                    ].map(([l, v]) => (
                      <div key={l}>
                        <div style={{ fontSize: 10, opacity: 0.65, marginBottom: 3 }}>{l}</div>
                        <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>{v}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.2)", display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontSize: 10, opacity: 0.65 }}>UNTUNG / RUGI</div>
                      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>{pl >= 0 ? "+" : ""}RM {fmt(pl)}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, opacity: 0.65 }}>PERATUSAN</div>
                      <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "'DM Mono',monospace" }}>{plPct >= 0 ? "+" : ""}{plPct.toFixed(2)}%</div>
                    </div>
                  </div>
                </div>
              );
            })()}

            <button onClick={() => setWatchlist(prev => prev.includes(selected.code) ? prev.filter(c => c !== selected.code) : [...prev, selected.code])}
              style={{ width: "100%", padding: 14, borderRadius: 12, border: "none", background: watchlist.includes(selected.code) ? "#F1F5F9" : "#0F4C81", color: watchlist.includes(selected.code) ? "#64748B" : "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
              {watchlist.includes(selected.code) ? "★ Dalam Watchlist" : "☆ Tambah ke Watchlist"}
            </button>
          </div>
        )}

      </main>

      <footer style={{ textAlign: "center", padding: "24px 16px", fontSize: 11, color: "#94A3B8" }}>
        SahamIQ · Data via Yahoo Finance · {usingFallback ? "Demo mode — semak sambungan internet" : "Data KLSE (15 min delay)"}
      </footer>
    </div>
  );
}
