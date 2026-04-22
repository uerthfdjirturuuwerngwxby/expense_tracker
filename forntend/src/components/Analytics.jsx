import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";

// ─── Constants ───────────────────────────────────────────────────────────────
const APP_API = "http://localhost:4000";
const PREDICTION_API = "http://localhost:5000";


const NAV_LINKS = [
  { label: "Home", to: "/" },
  { label: "Expenses", to: "/expenses" },
  { label: "Analytics", to: "/analytics" },
  { label: "Profile", to: "/profile" },
];

const MODEL_TO_UI = {
  Food_Dining: "Food & Dining",
  Transportation: "Transportation",
  Entertainment: "Entertainment",
  Shopping: "Shopping",
  Utilities: "Utilities",
  Housing: "Housing",
  Healthcare: "Healthcare",
  Education: "Education",
  Travel: "Travel",
  Personal_Care: "Personal Care",
  Other: "Other",
};

const UI_TO_MODEL = Object.fromEntries(
  Object.entries(MODEL_TO_UI).map(([k, v]) => [v, k])
);

const CAT_COLORS = {
  "Food & Dining":  { bg: "#fff7ed", color: "#ea580c", grad: "linear-gradient(135deg,#fb923c,#ea580c)" },
  Transportation:   { bg: "#eff6ff", color: "#2563eb", grad: "linear-gradient(135deg,#60a5fa,#2563eb)" },
  Entertainment:    { bg: "#fdf4ff", color: "#a21caf", grad: "linear-gradient(135deg,#c084fc,#a21caf)" },
  Shopping:         { bg: "#fdf2f8", color: "#db2777", grad: "linear-gradient(135deg,#f472b6,#db2777)" },
  Utilities:        { bg: "#fefce8", color: "#ca8a04", grad: "linear-gradient(135deg,#fbbf24,#ca8a04)" },
  Housing:          { bg: "#f0fdf4", color: "#16a34a", grad: "linear-gradient(135deg,#4ade80,#16a34a)" },
  Healthcare:       { bg: "#fff1f2", color: "#e11d48", grad: "linear-gradient(135deg,#fb7185,#e11d48)" },
  Education:        { bg: "#f0f9ff", color: "#0284c7", grad: "linear-gradient(135deg,#38bdf8,#0284c7)" },
  Travel:           { bg: "#ecfdf5", color: "#059669", grad: "linear-gradient(135deg,#34d399,#059669)" },
  "Personal Care":  { bg: "#faf5ff", color: "#7c3aed", grad: "linear-gradient(135deg,#a78bfa,#7c3aed)" },
  Other:            { bg: "#f8fafc", color: "#475569", grad: "linear-gradient(135deg,#94a3b8,#475569)" },
};

const CAT_ICONS = {
  "Food & Dining": "coffee", Transportation: "truck", Entertainment: "film",
  Shopping: "shopping-bag", Utilities: "zap", Housing: "home",
  Healthcare: "heart", Education: "book-open", Travel: "globe",
  "Personal Care": "user", Other: "circle",
};

const HYDERABAD_AREAS = [
  "Madhapur","Hitech City","Gachibowli","Banjara Hills","Jubilee Hills",
  "Kondapur","Kukatpally","Secunderabad","Ameerpet","Begumpet",
  "Mehdipatnam","LB Nagar","Uppal","Dilsukhnagar","Abids",
  "Somajiguda","Panjagutta","KPHB","Miyapur","Bachupally",
];

const fmt = (n) =>
  "₹" + (Number(n) || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 });

const san = (n) => {
  const v = Number(n) || 0;
  return v > 0 && v < 1 ? Math.round(v * 1000 * 100) / 100 : v;
};

const TEST_EMAIL = "samalanithin18@gmail.com";
const TEST_BUDGET = 15000;
const TEST_MONTHLY_ROWS_KEY = "expenseai:test:monthlyRows:v1";
const TEST_DAILY_EXP_KEY = "expenseai:test:dailyExpenses:v1";

function normalizeExpenseEntry(entry) {
  return {
    ...entry,
    amount: san(entry.amount),
    type: entry.type === "income" || entry.category === "Income" ? "income" : "expense",
  };
}

function monthShift(baseDate, deltaMonths) {
  return new Date(baseDate.getFullYear(), baseDate.getMonth() + deltaMonths, 1);
}

function createTestMonthlyRows() {
  const baseWeights = {
    Food_Dining: 0.18, Transportation: 0.08, Entertainment: 0.06, Shopping: 0.10, Utilities: 0.08,
    Housing: 0.28, Healthcare: 0.05, Education: 0.06, Travel: 0.05, Personal_Care: 0.04, Other: 0.02,
  };
  const keys = Object.keys(MODEL_TO_UI);
  const rows = [];
  const now = new Date();

  for (let i = -11; i <= 0; i++) {
    const d = monthShift(now, i);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const seasonal = {
      Travel: [4, 11].includes(d.getMonth()) ? 1.25 : 1,
      Shopping: [9, 10].includes(d.getMonth()) ? 1.2 : 1,
      Utilities: [3, 4, 5].includes(d.getMonth()) ? 1.18 : 1,
      Education: d.getMonth() === 5 ? 1.2 : 1,
    };

    const drift = 1 + ((Math.sin((i + 12) * 1.7) + 1) * 0.04 - 0.04);
    const monthTotal = Math.round(TEST_BUDGET * drift);
    let row = { area: "Uppal", month, Income: 42000, Total_Expense: 0 };
    let scoreSum = 0;
    const scores = {};

    keys.forEach((k) => {
      const wave = 1 + ((Math.cos((i + 12) * (k.length % 5 + 1)) + 1) * 0.02 - 0.02);
      const s = (baseWeights[k] || 0.02) * (seasonal[k] || 1) * wave;
      scores[k] = s;
      scoreSum += s;
    });

    keys.forEach((k) => {
      row[k] = Math.max(120, Math.round((scores[k] / scoreSum) * monthTotal));
      row.Total_Expense += row[k];
    });
    row.Income = Math.max(35000, row.Total_Expense + 15000);
    rows.push(row);
  }

  return rows;
}

function loadOrCreateTestRows() {
  try {
    const raw = localStorage.getItem(TEST_MONTHLY_ROWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length >= 12) return parsed;
    }
  } catch {}

  const rows = createTestMonthlyRows();
  localStorage.setItem(TEST_MONTHLY_ROWS_KEY, JSON.stringify(rows));
  localStorage.setItem("expenseai:budget", JSON.stringify({ monthlyBudget: TEST_BUDGET }));
  return rows;
}

function loadDailyTestExpenses() {
  try {
    const raw = localStorage.getItem(TEST_DAILY_EXP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 300) return parsed;
    }
  } catch {}
  return null;
}

function monthlyRowsToExpenses(rows) {
  const expenses = [];
  rows.forEach((r) => {
    Object.keys(MODEL_TO_UI).forEach((k, idx) => {
      expenses.push({
        id: `${r.month}-${k}`,
        title: MODEL_TO_UI[k],
        amount: r[k],
        category: MODEL_TO_UI[k],
        type: "expense",
        date: `${r.month}-${String((idx % 25) + 1).padStart(2, "0")}`,
      });
    });
    expenses.push({
      id: `${r.month}-income`,
      title: "Income",
      amount: r.Income || 0,
      category: "Income",
      type: "income",
      date: `${r.month}-01`,
    });
  });
  return expenses;
}

function parseDateParts(dateStr) {
  const parts = String(dateStr || "").split("-");
  if (parts.length !== 3) return null;
  const year = parseInt(parts[0], 10);
  const monthIndex = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  if (Number.isNaN(year) || Number.isNaN(monthIndex) || Number.isNaN(day)) return null;
  return { y: year, m: monthIndex, d: day };
}

function monthKeyFromDate(dateStr) {
  const parsed = parseDateParts(dateStr);
  if (!parsed) return "";
  return `${parsed.y}-${String(parsed.m + 1).padStart(2, "0")}`;
}

function buildMonthlyRowsFromExpenses(expenses, area) {
  const monthMap = new Map();
  expenses.forEach((e) => {
    const month = monthKeyFromDate(e.date);
    if (!month) return;
    if (!monthMap.has(month)) {
      const init = { area, month, Income: 0, Total_Expense: 0 };
      Object.keys(MODEL_TO_UI).forEach((k) => { init[k] = 0; });
      monthMap.set(month, init);
    }
    const row = monthMap.get(month);
    const amount = san(e.amount);
    if (e.type === "income" || e.category === "Income") {
      row.Income += amount;
      return;
    }
    const modelKey = UI_TO_MODEL[e.category] || "Other";
    row[modelKey] += amount;
    row.Total_Expense += amount;
  });
  return Array.from(monthMap.values()).sort((a, b) => a.month.localeCompare(b.month));
}

function buildLocalPredictionPayload({ area, monthlyRows, monthlyTarget, selectedMonth, targetMonth }) {
  const rows = selectedMonth && selectedMonth !== "ALL"
    ? monthlyRows.filter((r) => r.month <= selectedMonth)
    : monthlyRows;
  const base = rows.slice(-6);
  const latest = base[base.length - 1] || rows[rows.length - 1];
  if (!latest) return null;

  const totals = base.map((r) => r.Total_Expense || 0);
  const avgGrowth = totals.length > 1
    ? totals.slice(1).reduce((acc, v, i) => acc + ((v - (totals[i] || 1)) / (totals[i] || 1)), 0) / (totals.length - 1)
    : 0.02;
  const growth = Math.max(-0.08, Math.min(0.12, avgGrowth || 0.02));

  const [y, m] = latest.month.split("-").map(Number);
  const normalizedTargetMonth = targetMonth && targetMonth > latest.month
    ? targetMonth
    : monthStartString(1);
  const targetDistance = Math.max(
    1,
    ((Number(normalizedTargetMonth.slice(0, 4)) - y) * 12) + (Number(normalizedTargetMonth.slice(5, 7)) - m),
  );
  const forecastPeriods = Math.max(3, targetDistance + 2);
  const forecastStartIndex = Math.max(0, targetDistance - 1);
  const forecastSeries = [];
  let rolling = latest.Total_Expense || 0;
  for (let i = 1; i <= forecastPeriods; i++) {
    const date = new Date(y, (m - 1) + i, 1);
    rolling = Math.max(0, rolling * (1 + growth + i * 0.006));
    forecastSeries.push({ month: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`, expense: Math.round(rolling) });
  }
  const forecast = forecastSeries.slice(forecastStartIndex, forecastStartIndex + 3);

  const target = monthlyTarget > 0 ? monthlyTarget : (latest.Total_Expense || 0);
  const sumActual = Object.keys(MODEL_TO_UI).reduce((s, k) => s + (latest[k] || 0), 0) || 1;
  const recommended_spending = {};
  Object.keys(MODEL_TO_UI).forEach((k) => {
    recommended_spending[k] = Math.round(((latest[k] || 0) / sumActual) * target);
  });

  const advice = [];
  Object.keys(MODEL_TO_UI).forEach((k) => {
    const actual = latest[k] || 0;
    const rec = recommended_spending[k] || 0;
    if (!rec) return;
    if (actual > rec * 1.15) advice.push(`Reduce ${k.replace("_", " ")} by about ${Math.round(actual - rec)}.`);
    if (actual < rec * 0.75) advice.push(`You can spend slightly more on ${k.replace("_", " ")} up to ${Math.round(rec)}.`);
  });

  return {
    area,
    prediction_target_month: normalizedTargetMonth,
    forecast,
    advice: advice.slice(0, 6),
    recommended_spending,
    charts: {
      line: [...rows.slice(-6).map((r) => ({ month: r.month, expense: r.Total_Expense, type: "actual" })), ...forecast.map((f) => ({ ...f, type: "predicted" }))],
      pie: Object.keys(MODEL_TO_UI).map((k) => ({ category: k, value: latest[k] || 0 })),
      bar: [{ area, area_average: target, expense: target }],
    },
  };
}
// ─── Icons ───────────────────────────────────────────────────────────────────
function monthStartString(offset = 0) {
  const d = new Date();
  const dt = new Date(d.getFullYear(), d.getMonth() + offset, 1);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
}

function guessAreaFromAddress(address = {}) {
  const probes = [
    address.suburb, address.neighbourhood, address.city_district,
    address.state_district, address.town, address.city,
  ].filter(Boolean).map((x) => String(x).toLowerCase());
  for (const probe of probes) {
    const found = HYDERABAD_AREAS.find((a) => probe.includes(a.toLowerCase()) || a.toLowerCase().includes(probe));
    if (found) return found;
  }
  return null;
}

const Icon = ({ name, size = 16, color = "currentColor", sw = 2 }) => {
  const paths = {
    coffee: <><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></>,
    truck: <><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11v12H5Z"/><path d="M9 17h6M18 17h1a2 2 0 0 0 2-2v-5l-3-4h-3v11"/><circle cx="7" cy="17" r="2"/><circle cx="18" cy="17" r="2"/></>,
    film: <><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M17 3v18M3 8h4M17 8h4M3 16h4M17 16h4"/></>,
    "shopping-bag": <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>,
    zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    heart: <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>,
    "book-open": <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 1 0 20 14.5 14.5 0 0 1 0-20"/><path d="M2 12h20"/></>,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    circle: <><circle cx="12" cy="12" r="10"/></>,
    "trending-up": <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
    "trending-down": <><polyline points="22 17 13.5 8.5 8.5 13.5 2 7"/><polyline points="16 17 22 17 22 11"/></>,
    "bar-chart": <><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></>,
    "pie-chart": <><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></>,
    sparkles: <><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></>,
    "alert-triangle": <><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></>,
    "check-circle": <><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>,
    "map-pin": <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
    "refresh-cw": <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></>,
    "chevron-down": <><path d="m6 9 6 6 6-6"/></>,
    "x": <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    wallet: <><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></>,
    lightbulb: <><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {paths[name] || paths["circle"]}
    </svg>
  );
};

// ─── Navbar (same as Expense page) ───────────────────────────────────────────
function PillNav({ activeIdx, setActiveIdx }) {
  const pillRef = useRef(null);
  const linkRefs = useRef([]);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [pill, setPill] = useState({ left: 0, width: 0, opacity: 0 });

  const updatePill = (idx) => {
    const el = linkRefs.current[idx], con = pillRef.current;
    if (!el || !con) return;
    const cR = con.getBoundingClientRect(), eR = el.getBoundingClientRect();
    setPill({ left: eR.left - cR.left, width: eR.width, opacity: 1 });
  };

  useEffect(() => { updatePill(hoverIdx !== null ? hoverIdx : activeIdx); }, [hoverIdx, activeIdx]);
  useEffect(() => { const t = setTimeout(() => updatePill(activeIdx), 120); return () => clearTimeout(t); }, []);

  return (
    <div className="pill-nav" ref={pillRef}>
      <span className="pill-bg" style={{ left: pill.left, width: pill.width, opacity: pill.opacity }} />
      {NAV_LINKS.map((link, i) => (
        <Link key={link.label} to={link.to} ref={el => linkRefs.current[i] = el}
          className={`pill-link${activeIdx === i ? " pill-link--on" : ""}`}
          onClick={() => setActiveIdx(i)} onMouseEnter={() => setHoverIdx(i)} onMouseLeave={() => setHoverIdx(null)}>
          {link.label}
        </Link>
      ))}
    </div>
  );
}

function Avatar({ user, size = 34 }) {
  const [imgErr, setImgErr] = useState(false);
  const src = user?.avatar_url;
  const initials = ((user?.first_name?.[0] || "") + (user?.last_name?.[0] || "")).toUpperCase() || "U";
  if (src && !imgErr)
    return <img src={src} alt={initials} onError={() => setImgErr(true)} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(99,102,241,0.18)", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 800, color: "white", flexShrink: 0, border: "2px solid rgba(99,102,241,0.18)" }}>
      {initials}
    </div>
  );
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────
function Sparkline({ data, color = "#6366f1", height = 40, width = 100 }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height * 0.85 - height * 0.075;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id={`sg-${color.replace("#","")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#sg-${color.replace("#","")})`} />
    </svg>
  );
}

// ─── Donut Chart ──────────────────────────────────────────────────────────────
function DonutChart({ data, size = 200 }) {
  const [hovered, setHovered] = useState(null);
  if (!data || !data.length) return null;

  const total = data.reduce((s, d) => s + d.value, 0);
  const cx = size / 2, cy = size / 2, r = size * 0.38, ir = size * 0.24;
  let angle = -Math.PI / 2;

  const slices = data.map((d, i) => {
    const ratio = d.value / total;
    const sweep = ratio * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(angle + sweep);
    const y2 = cy + r * Math.sin(angle + sweep);
    const xi1 = cx + ir * Math.cos(angle);
    const yi1 = cy + ir * Math.sin(angle);
    const xi2 = cx + ir * Math.cos(angle + sweep);
    const yi2 = cy + ir * Math.sin(angle + sweep);
    const large = sweep > Math.PI ? 1 : 0;
    const path = `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi2} ${yi2} A ${ir} ${ir} 0 ${large} 0 ${xi1} ${yi1} Z`;
    const midAngle = angle + sweep / 2;
    angle += sweep;
    return { ...d, path, midAngle, ratio, color: CAT_COLORS[d.name]?.color || "#6366f1" };
  });

  const hoveredSlice = hovered !== null ? slices[hovered] : null;

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {slices.map((s, i) => {
          const isHov = hovered === i;
          const scale = isHov ? 1.05 : 1;
          const tx = cx + (Math.cos(s.midAngle) * (isHov ? 8 : 0));
          const ty = cy + (Math.sin(s.midAngle) * (isHov ? 8 : 0));
          return (
            <g key={i} style={{ cursor: "pointer" }}
              transform={`translate(${tx - cx} ${ty - cy})`}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}>
              <path d={s.path} fill={s.color} opacity={hovered !== null && !isHov ? 0.55 : 1}
                style={{ transition: "all 0.2s", filter: isHov ? `drop-shadow(0 4px 12px ${s.color}55)` : "none" }} />
            </g>
          );
        })}
        <circle cx={cx} cy={cy} r={ir - 2} fill="white" />
        {hoveredSlice ? (
          <>
            <text x={cx} y={cy - 8} textAnchor="middle" fontSize="11" fontWeight="700" fill="#64748b" fontFamily="'Plus Jakarta Sans',sans-serif">
              {hoveredSlice.name.length > 12 ? hoveredSlice.name.slice(0, 12) + "…" : hoveredSlice.name}
            </text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize="15" fontWeight="800" fill="#1e293b" fontFamily="'Plus Jakarta Sans',sans-serif">
              {fmt(hoveredSlice.value)}
            </text>
            <text x={cx} y={cy + 26} textAnchor="middle" fontSize="11" fontWeight="700" fill="#94a3b8" fontFamily="'Plus Jakarta Sans',sans-serif">
              {(hoveredSlice.ratio * 100).toFixed(1)}%
            </text>
          </>
        ) : (
          <>
            <text x={cx} y={cy - 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="#94a3b8" fontFamily="'Plus Jakarta Sans',sans-serif">TOTAL</text>
            <text x={cx} y={cy + 14} textAnchor="middle" fontSize="14" fontWeight="800" fill="#1e293b" fontFamily="'Plus Jakarta Sans',sans-serif">
              {fmt(total)}
            </text>
          </>
        )}
      </svg>
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────
function BarCompare({ actual, predicted, label }) {
  const max = Math.max(actual, predicted, 1);
  const actualPct = (actual / max) * 100;
  const predPct = (predicted / max) * 100;
  const diff = predicted - actual;
  const diffPct = actual > 0 ? ((diff / actual) * 100).toFixed(1) : null;

  return (
    <div className="bar-compare">
      <div className="bc-label">{label}</div>
      <div className="bc-bars">
        <div className="bc-bar-row">
          <span className="bc-tag bc-tag--actual">Actual</span>
          <div className="bc-track">
            <div className="bc-fill bc-fill--actual" style={{ width: `${actualPct}%` }} />
          </div>
          <span className="bc-val">{fmt(actual)}</span>
        </div>
        <div className="bc-bar-row">
          <span className="bc-tag bc-tag--pred">Predicted</span>
          <div className="bc-track">
            <div className="bc-fill bc-fill--pred" style={{ width: `${predPct}%` }} />
          </div>
          <span className="bc-val">{fmt(predicted)}</span>
        </div>
      </div>
      {diffPct !== null && (
        <div className={`bc-diff ${diff > 0 ? "bc-diff--up" : "bc-diff--down"}`}>
          <Icon name={diff > 0 ? "trending-up" : "trending-down"} size={11} />
          {Math.abs(diffPct)}% {diff > 0 ? "increase" : "decrease"} predicted
        </div>
      )}
    </div>
  );
}

// ─── Forecast Line ────────────────────────────────────────────────────────────
function ForecastLine({ forecast, actualMonths }) {
  const allData = [...(actualMonths || []), ...(forecast || [])];
  if (!allData.length) return null;

  const maxVal = Math.max(...allData.map(d => d.expense || d.Total_Expense || 0), 1);
  const W = 560, H = 180, PAD = { l: 52, r: 20, t: 20, b: 36 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;
  const n = allData.length;

  const getX = (i) => PAD.l + (i / (n - 1)) * chartW;
  const getY = (v) => PAD.t + chartH - ((v / maxVal) * chartH);

  const actualPts = (actualMonths || []).map((d, i) => ({ x: getX(i), y: getY(d.Total_Expense || 0), v: d.Total_Expense || 0, label: d.month }));
  const forecastPts = (forecast || []).map((d, i) => ({ x: getX((actualMonths?.length || 0) + i), y: getY(d.expense || 0), v: d.expense || 0, label: d.month }));
  const allPts = [...actualPts, ...forecastPts];

  const buildPath = (pts) => pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `C ${cpx} ${prev.y} ${cpx} ${p.y} ${p.x} ${p.y}`;
  }).join(" ");

  const actualPath = buildPath(actualPts);
  const forecastPath = forecastPts.length && actualPts.length
    ? buildPath([actualPts[actualPts.length - 1], ...forecastPts])
    : buildPath(forecastPts);

  const areaPath = actualPath + ` L ${actualPts[actualPts.length - 1]?.x} ${PAD.t + chartH} L ${PAD.l} ${PAD.t + chartH} Z`;

  const yTicks = 4;
  const [selectedPt, setSelectedPt] = useState(null);

  return (
    <div style={{ position: "relative", width: "100%", overflowX: "auto" }}>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", minWidth: 360 }}>
        <defs>
          <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0.01" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* Grid */}
        {Array.from({ length: yTicks + 1 }, (_, i) => {
          const y = PAD.t + (i / yTicks) * chartH;
          const val = maxVal - (i / yTicks) * maxVal;
          return (
            <g key={i}>
              <line x1={PAD.l} y1={y} x2={W - PAD.r} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={PAD.l - 6} y={y + 4} textAnchor="end" fontSize="9" fill="#94a3b8" fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight="600">
                {val >= 1000 ? `₹${(val / 1000).toFixed(0)}k` : `₹${val.toFixed(0)}`}
              </text>
            </g>
          );
        })}

        {/* Actual area + line */}
        {actualPts.length > 1 && (
          <>
            <path d={areaPath} fill="url(#actualGrad)" />
            <path d={actualPath} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" filter="url(#glow)" />
          </>
        )}

        {/* Forecast dashed line */}
        {forecastPts.length > 0 && (
          <path d={forecastPath} fill="none" stroke="#f97316" strokeWidth="2.5" strokeDasharray="7 4" strokeLinecap="round" filter="url(#glow)" />
        )}

        {/* Divider line */}
        {actualPts.length > 0 && forecastPts.length > 0 && (
          <line
            x1={actualPts[actualPts.length - 1].x} y1={PAD.t}
            x2={actualPts[actualPts.length - 1].x} y2={PAD.t + chartH}
            stroke="#e2e8f0" strokeWidth="1.5" strokeDasharray="4 3"
          />
        )}

        {/* X labels */}
        {allPts.map((p, i) => {
          const show = n <= 9 || i % Math.ceil(n / 9) === 0 || i === n - 1;
          if (!show) return null;
          return (
            <text key={i} x={p.x} y={H - 6} textAnchor="middle" fontSize="9" fill="#94a3b8" fontFamily="'Plus Jakarta Sans',sans-serif" fontWeight="600">
              {p.label?.slice(2) || ""}
            </text>
          );
        })}

        {/* Points */}
        {actualPts.map((p, i) => (
          <g key={`a${i}`} style={{ cursor: "pointer" }} onClick={() => setSelectedPt({ ...p, type: "Actual" })}>
            <circle
              cx={p.x}
              cy={p.y}
              r={selectedPt?.label === p.label && selectedPt?.type === "Actual" ? "6.5" : "5"}
              fill="#6366f1"
              stroke="white"
              strokeWidth="2"
            />
          </g>
        ))}
        {forecastPts.map((p, i) => (
          <g key={`f${i}`} style={{ cursor: "pointer" }} onClick={() => setSelectedPt({ ...p, type: "Forecast" })}>
            <circle
              cx={p.x}
              cy={p.y}
              r={selectedPt?.label === p.label && selectedPt?.type === "Forecast" ? "6.5" : "5"}
              fill="#f97316"
              stroke="white"
              strokeWidth="2"
            />
          </g>
        ))}

        
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", gap: "1.2rem", marginTop: "0.5rem", paddingLeft: "3.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 24, height: 3, background: "#6366f1", borderRadius: 99 }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Actual</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <svg width="24" height="3"><line x1="0" y1="1.5" x2="24" y2="1.5" stroke="#f97316" strokeWidth="2.5" strokeDasharray="6 3" /></svg>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>Forecast</span>
        </div>
      </div>
      <div style={{ marginTop: "0.55rem", paddingLeft: "3.5rem" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "6px 10px" }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>Selected</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
            {selectedPt ? `${selectedPt.label} (${selectedPt.type})` : "Click a point"}
          </span>
          <span style={{ fontSize: 12, fontWeight: 800, color: "#111827" }}>
            {selectedPt ? fmt(selectedPt.v) : "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Analytics Component ─────────────────────────────────────────────────
export default function Analytics({ user, onLogout }) {
  const [navSolid, setNavSolid] = useState(false);
  const [navHide, setNavHide] = useState(false);
  const lastScroll = useRef(0);

  const [expenses, setExpenses] = useState([]);
  const [expLoading, setExpLoading] = useState(true);

  const [area, setArea] = useState("Uppal");
  const [predLoading, setPredLoading] = useState(false);
  const [predData, setPredData] = useState(null);
  const [predError, setPredError] = useState("");
  const [forecastData, setForecastData] = useState(null);
  const [predictionBaseMonth, setPredictionBaseMonth] = useState("ALL");
  const [predictionTargetMode, setPredictionTargetMode] = useState("NEXT_MONTH");
  const [customTargetMonth, setCustomTargetMonth] = useState(monthStartString(0));

  const [activeSection, setActiveSection] = useState("overview");
  const isTestUser = (user?.email || "").toLowerCase() === TEST_EMAIL;
  const userArea = user?.area || user?.location || "Uppal";

  useEffect(() => {
    const h = () => {
      const sy = window.scrollY;
      setNavSolid(sy > 10);
      setNavHide(sy > lastScroll.current + 10 && sy > 200);
      lastScroll.current = sy;
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    if (!isTestUser && userArea) {
      setArea(userArea);
    }
  }, [isTestUser, userArea]);

  // Load expenses
  useEffect(() => {
    (async () => {
      try {
        if (isTestUser) {
          const dailyRows = loadDailyTestExpenses();
          if (dailyRows?.length) {
            setExpenses(dailyRows.map(normalizeExpenseEntry));
            return;
          }
        }

        const res = await fetch(`${APP_API}/api/expenses`, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const realExpenses = (data.expenses || []).map(normalizeExpenseEntry);
          if (realExpenses.length > 0) {
            setExpenses(realExpenses);
            return;
          }
        }

        if (isTestUser) {
          const rows = loadOrCreateTestRows();
          setArea(rows[rows.length - 1]?.area || "Uppal");
          setExpenses(monthlyRowsToExpenses(rows).map(normalizeExpenseEntry));
        }
      } catch (e) { console.warn("expenses load failed", e); }
      finally { setExpLoading(false); }
    })();
  }, [isTestUser]);

  const allMonthlyRows = useMemo(() => buildMonthlyRowsFromExpenses(expenses, area), [expenses, area]);
  const predictionMonthOptions = useMemo(() => allMonthlyRows.map(r => r.month), [allMonthlyRows]);
  const currentMonthKey = monthStartString(0);
  const currentMonthRow = useMemo(() => (
    allMonthlyRows.find((r) => r.month === currentMonthKey) || null
  ), [allMonthlyRows, currentMonthKey]);
  const scopedMonthlyRows = useMemo(() => (
    predictionBaseMonth !== "ALL"
      ? allMonthlyRows.filter((r) => r.month <= predictionBaseMonth)
      : allMonthlyRows
  ), [allMonthlyRows, predictionBaseMonth]);
  const selectedActualRow = useMemo(() => (
    scopedMonthlyRows[scopedMonthlyRows.length - 1] || allMonthlyRows[allMonthlyRows.length - 1] || null
  ), [scopedMonthlyRows, allMonthlyRows]);
  const selectedActualMonth = selectedActualRow?.month || monthStartString(0);
  const selectedMonthExpenses = useMemo(() => (
    expenses.filter((e) => monthKeyFromDate(e.date) === selectedActualMonth)
  ), [expenses, selectedActualMonth]);
  const catTotals = useMemo(() => {
    const totals = {};
    Object.keys(MODEL_TO_UI).forEach((k) => { totals[k] = Number(selectedActualRow?.[k] || 0); });
    return { ...totals, Income: Number(selectedActualRow?.Income || 0) };
  }, [selectedActualRow]);
  const monthlyHistory = useMemo(() => (
    scopedMonthlyRows.slice(-6).map((r) => ({
      month: r.month,
      label: new Date(`${r.month}-01`).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      Total_Expense: Number(r.Total_Expense || 0),
    }))
  ), [scopedMonthlyRows]);
  const targetPredictionMonth = useMemo(() => {
    if (predictionTargetMode === "THIS_MONTH") return monthStartString(0);
    if (predictionTargetMode === "NEXT_MONTH") return monthStartString(1);
    return customTargetMonth || monthStartString(1);
  }, [predictionTargetMode, customTargetMonth]);
  const totalMonthly = Object.entries(catTotals)
    .filter(([k]) => k !== "Income")
    .reduce((s, [, v]) => s + v, 0);
  const currentMonthExpenses = useMemo(() => (
    expenses.filter((e) => e.type === "expense" && monthKeyFromDate(e.date) === currentMonthKey)
  ), [expenses, currentMonthKey]);
  const currentMonthTotal = useMemo(() => (
    currentMonthExpenses.reduce((sum, e) => sum + san(e.amount), 0)
  ), [currentMonthExpenses]);
  const currentMonthCategoryCount = new Set(currentMonthExpenses.map((e) => UI_TO_MODEL[e.category] || e.category)).size;
  const currentMonthTransactionCount = currentMonthExpenses.length;
  const currentMonthHistoryIndex = allMonthlyRows.findIndex((r) => r.month === currentMonthKey);
  const previousMonthRow = currentMonthHistoryIndex > 0 ? allMonthlyRows[currentMonthHistoryIndex - 1] : null;
  const currentMonthChange = previousMonthRow?.Total_Expense > 0
    ? ((currentMonthTotal - Number(previousMonthRow.Total_Expense || 0)) / Number(previousMonthRow.Total_Expense || 1) * 100).toFixed(1)
    : null;

  async function runPrediction() {
    setPredLoading(true);
    setPredError("");
    setPredData(null);
    setForecastData(null);
    try {
      if (isTestUser) {
        const localPayload = buildLocalPredictionPayload({
          area,
          monthlyRows: allMonthlyRows,
          monthlyTarget,
          selectedMonth: predictionBaseMonth,
          targetMonth: targetPredictionMonth,
        });
        if (!localPayload) throw new Error("Not enough local data for prediction.");
        setPredData(localPayload);
        setForecastData(localPayload);
        return;
      }

      const query = new URLSearchParams({ area });
      if (predictionBaseMonth !== "ALL") query.set("base_month", predictionBaseMonth);
      query.set("predict_for_month", targetPredictionMonth);
      const res = await fetch(`${PREDICTION_API}/api/analytics/prediction?${query.toString()}`, {
        credentials: "include",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Prediction request failed");
      setPredData(json);
      setForecastData(json);
    } catch (e) {
      if (isTestUser) {
        const localPayload = buildLocalPredictionPayload({
          area,
          monthlyRows: allMonthlyRows,
          monthlyTarget,
          selectedMonth: predictionBaseMonth,
          targetMonth: targetPredictionMonth,
        });
        if (localPayload) {
          setPredData(localPayload);
          setForecastData(localPayload);
          setPredError("Using local prediction based on available previous months.");
          return;
        }
      }
      setPredError(e?.message || "Could not fetch prediction from trained model service.");
    } finally {
      setPredLoading(false);
    }
  }

  // Pie data from forecast or current expenses
  const pieData = useMemo(() => {
    const src = forecastData?.charts?.pie;
    if (src?.length) return src.map(p => ({ name: MODEL_TO_UI[p.category] || p.category, value: Number(p.value || 0) })).filter(d => d.value > 0);
    return Object.entries(catTotals)
      .filter(([k]) => k !== "Income" && catTotals[k] > 0)
      .map(([k, v]) => ({ name: MODEL_TO_UI[k] || k, value: v }));
  }, [forecastData, catTotals]);

  const forecast = forecastData?.forecast || [];
  const nextMonthExp = Number(forecast[0]?.expense || predData?.predicted_expense || 0);
  const areaBarEntry = forecastData?.charts?.bar?.find(b => b.area === area);
  const areaAvg = Number(areaBarEntry?.predicted_total || areaBarEntry?.area_average || areaBarEntry?.expense || 0);

  const backendAdvice = forecastData?.advice || predData?.advice || [];
  const recommended = forecastData?.recommended_spending || predData?.recommended_spending || {};
  const backendCatComparison = forecastData?.category_actual_vs_predicted || predData?.category_actual_vs_predicted || [];

  const monthlyTarget = (() => {
    try {
      const rawBudget = localStorage.getItem("expenseai:budget");
      const parsed = rawBudget ? JSON.parse(rawBudget) : {};
      return Number(parsed?.monthlyBudget || 0);
    } catch {
      return 0;
    }
  })();
  const hasMonthlyBudget = monthlyTarget > 0;
  const predictionTotal = nextMonthExp > 0 ? nextMonthExp : 0;
  const budgetPlanTotal = hasMonthlyBudget ? monthlyTarget : predictionTotal;
  const isViewingCurrentMonth = selectedActualMonth === monthStartString(0);
  const actualCardLabel = isViewingCurrentMonth ? "This Month's Expenses" : `Expenses (${selectedActualMonth})`;
  const actualTxCount = selectedMonthExpenses.filter((e) => e.type !== "income" && e.category !== "Income").length;
  const actualCategoryCount = new Set(
    selectedMonthExpenses
      .filter((e) => e.type !== "income" && e.category !== "Income")
      .map((e) => UI_TO_MODEL[e.category] || e.category)
  ).size;

  const predictedByCategory = useMemo(() => {
    if (backendCatComparison.length > 0) {
      const out = {};
      backendCatComparison.forEach((row) => {
        out[row.category] = Number(row.predicted || 0);
      });
      return out;
    }
    const modelKeys = Object.keys(MODEL_TO_UI);
    const recSum = modelKeys.reduce((s, k) => s + (Number(recommended[k]) || 0), 0);
    const actualSum = modelKeys.reduce((s, k) => s + (Number(catTotals[k]) || 0), 0);
    const denominator = recSum > 0 ? recSum : (actualSum > 0 ? actualSum : modelKeys.length);

    const out = {};
    modelKeys.forEach((k) => {
      const base = recSum > 0 ? (Number(recommended[k]) || 0) : (actualSum > 0 ? (Number(catTotals[k]) || 0) : 1);
      out[k] = denominator > 0 ? Math.round((base / denominator) * predictionTotal) : 0;
    });
    return out;
  }, [backendCatComparison, recommended, catTotals, predictionTotal]);

  // Category comparison: actual vs model-predicted next month allocation
  const catComparison = useMemo(() => {
    if (backendCatComparison.length > 0) {
      return backendCatComparison.map((row) => ({
        key: row.category,
        label: MODEL_TO_UI[row.category] || row.category,
        actual: Number(row.actual || 0),
        predicted: Number(row.predicted || 0),
        delta: Number(row.delta || 0),
      })).filter((d) => d.actual > 0 || d.predicted > 0);
    }
    return Object.entries(MODEL_TO_UI).map(([key, label]) => ({
      key,
      label,
      actual: catTotals[key] || 0,
      predicted: predictedByCategory[key] || 0,
      delta: (catTotals[key] || 0) - (predictedByCategory[key] || 0),
    })).filter(d => d.actual > 0 || d.predicted > 0);
  }, [backendCatComparison, catTotals, predictedByCategory]);

  const sparkValues = allMonthlyRows.slice(-6).map(m => Number(m.Total_Expense || 0));

  const highSpendCats = catComparison
    .filter(c => c.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);

  const lowSpendCats = catComparison
    .filter(c => c.delta < 0)
    .sort((a, b) => a.delta - b.delta)
    .slice(0, 2);

  const budgetGap = hasMonthlyBudget ? (totalMonthly - monthlyTarget) : 0;
  const reductionNeeded = highSpendCats.reduce((s, c) => s + (c.delta > 0 ? c.delta : 0), 0);
  const essentialKeys = ["Housing", "Utilities", "Healthcare", "Education"];
  const essentialStats = catComparison
    .filter(c => essentialKeys.includes(c.label))
    .reduce((acc, c) => ({ actual: acc.actual + c.actual, predicted: acc.predicted + c.predicted }), { actual: 0, predicted: 0 });
  const selectedMonthLabel = selectedActualMonth || "Selected month";
  const displayReportLines = (forecastData?.deep_report || predData?.deep_report || []).length >= 5
    ? (forecastData?.deep_report || predData?.deep_report || [])
    : null;

  const reportLines = displayReportLines ? displayReportLines.map((text, i) => ({
    label: `Insight ${i + 1}`,
    text,
  })) : [
    {
      label: "Current Month",
      text: `For ${currentMonthKey} in ${area}, your actual recorded expense total is ${fmt(currentMonthTotal)} based on the expenses you added on the Expense page.`,
    },
    {
      label: "Prediction",
      text: `Using ${predictionBaseMonth === "ALL" ? "all previous months available in the database" : `${selectedMonthLabel} and the months before it`}, the trained model predicts ${fmt(predictionTotal)} for ${targetPredictionMonth}.`,
    },
    {
      label: "Budget Status",
      text: hasMonthlyBudget
        ? `Your budget target is ${fmt(monthlyTarget)}. Against the current month actuals, you are ${budgetGap > 0 ? `${fmt(budgetGap)} over budget` : `${fmt(Math.abs(budgetGap))} under budget`}.`
        : "Monthly budget is not added yet. Add it to get accurate budget-based category recommendations.",
    },
    {
      label: "High Spend Categories",
      text: highSpendCats.length
        ? `${highSpendCats.map(c => `${c.label} (${fmt(c.actual)} -> ${fmt(c.predicted)})`).join(", ")} should be reduced first. Total recommended reduction: ${fmt(reductionNeeded)}.`
        : "No high-risk overspending category is detected right now; maintain control on discretionary spends.",
    },
    {
      label: "Where You Can Spend More",
      text: lowSpendCats.length
        ? `${lowSpendCats.map(c => `${c.label} (${fmt(c.actual)} -> ${fmt(c.predicted)})`).join(", ")} can be increased moderately for balance without hurting your target.`
        : "Most categories are already near balanced levels; keep the same allocation pattern for stability.",
    },
    {
      label: "Outcome Plan",
      text: hasMonthlyBudget
        ? `Your predicted spend is ${fmt(predictionTotal)} and your budget target is ${fmt(monthlyTarget)}. Use the category plan below to reduce the gap while protecting essentials first.`
        : `Set a monthly budget first, then run prediction again to get precise category limits and savings-oriented guidance.`,
    },
  ];

  const smartInsights = backendAdvice.length > 0 ? backendAdvice.map((text, i) => ({
    title: `Model Insight ${i + 1}`,
    detail: text,
  })) : [
    {
      title: "Budget Control",
      detail: hasMonthlyBudget
        ? (budgetGap > 0
            ? `You are above budget by ${fmt(budgetGap)}. Start cuts from Shopping, Entertainment, Travel, and Food before touching essentials.`
            : `You are under budget by ${fmt(Math.abs(budgetGap))}. Keep this cushion for savings or emergency fund.`)
        : "Budget not set. Category optimization is currently estimate-based. Add monthly budget for precise control.",
    },
    ...highSpendCats.slice(0, 3).map(c => ({
      title: `Reduce ${c.label}`,
      detail: `Current is ${fmt(c.actual)} vs recommended ${fmt(c.predicted)}. Cut around ${fmt(c.delta)} (${c.actual > 0 ? Math.round((c.delta / c.actual) * 100) : 0}%) over the next 30 days.`,
    })),
    ...lowSpendCats.slice(0, 2).map(c => ({
      title: `Increase ${c.label} Carefully`,
      detail: `Current is ${fmt(c.actual)} and healthy target is ${fmt(c.predicted)}. You can increase by up to ${fmt(Math.abs(c.delta))} if needed.`,
    })),
    {
      title: "Essential Category Protection",
      detail: `Essentials (Housing + Utilities + Healthcare + Education) are ${fmt(essentialStats.actual)} now vs ${fmt(essentialStats.predicted)} planned. Keep these funded before lifestyle categories.`,
    },
    {
      title: "Execution Rule",
      detail: "Review weekly: if a category crosses 75% of its monthly planned amount before week 3, freeze non-essential spend in that category.",
    },
    {
      title: "Monthly Outcome",
      detail: hasMonthlyBudget
        ? `The model predicts around ${fmt(predictionTotal)} next month, while your budget target is ${fmt(monthlyTarget)}. Focus on the highest positive deltas first to bring predicted spend closer to target.`
        : "Once budget is added, re-run prediction for sharper targets and stronger savings outcomes.",
    },
  ].slice(0, 8);

  return (
    <>
      <style>{CSS}</style>

      {/* Navbar */}
      <nav className={`nav${navSolid ? " nav--solid" : ""}${navHide ? " nav--hide" : ""}`}>
        <div className="nav-in">
          <Link to="/" className="logo">
            <div className="logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span>ExpenseAI</span>
          </Link>
          <PillNav activeIdx={2} setActiveIdx={() => {}} />
          <div className="nav-r">
            {user ? (
              <div className="user-row">
                <Avatar user={user} size={34} />
                <span className="uname">{user.first_name || user.full_name?.split(" ")[0] || "User"}</span>
                <button className="logout-btn" onClick={onLogout}>Logout</button>
              </div>
            ) : (
              <div className="auth-row">
                <Link to="/login" className="login-link">Login</Link>
                <Link to="/signup" className="signup-link">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      <main className="an-main">
        {/* Page Header */}
        <div className="an-header">
          <div className="an-header-left">
            <div className="an-header-icon">
              <Icon name="bar-chart" size={22} color="white" />
            </div>
            <div>
              <h1 className="an-title">Spending Analytics</h1>
              <p className="an-sub">AI-powered predictions based on your actual expenses</p>
            </div>
          </div>

          {/* Area + Predict */}
          <div className="predict-controls">
            <div className="area-select-wrap">
              <Icon name="refresh-cw" size={14} color="#6366f1" />
              <select className="area-select" value={predictionBaseMonth} onChange={e => setPredictionBaseMonth(e.target.value)}>
                <option value="ALL">All Months (Default)</option>
                {predictionMonthOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="area-select-wrap">
              <Icon name="calendar" size={14} color="#6366f1" />
              <select className="area-select" value={predictionTargetMode} onChange={e => setPredictionTargetMode(e.target.value)}>
                <option value="THIS_MONTH">Predict This Month</option>
                <option value="NEXT_MONTH">Predict Next Month (Default)</option>
                <option value="CUSTOM">Select Month</option>
              </select>
            </div>
            {predictionTargetMode === "CUSTOM" && (
              <div className="area-select-wrap">
                <input className="area-select" type="month" value={customTargetMonth} onChange={e => setCustomTargetMonth(e.target.value)} style={{ minWidth: 130 }} />
              </div>
            )}
            <button className={`predict-btn${predLoading ? " predict-btn--loading" : ""}`} onClick={runPrediction} disabled={predLoading || expLoading}>
              {predLoading ? (
                <><div className="pred-spinner" /><span>Analysing…</span></>
              ) : (
                <><Icon name="sparkles" size={15} color="white" /><span>Predict My Expenses</span></>
              )}
            </button>
          </div>
        </div>

        {/* Error */}
        {predError && (
          <div className="pred-error">
            <Icon name="alert-triangle" size={16} color="#b91c1c" />
            <span>{predError}</span>
          </div>
        )}

        {/* Top Stats */}
        <div className="stats-grid">
          <div className="stat-card stat-card--primary">
            <div className="stat-bg-glow" style={{ background: "radial-gradient(circle at 70% 30%, rgba(99,102,241,0.18) 0%, transparent 65%)" }} />
            <div className="stat-top">
              <div>
                <p className="stat-label">This Month's Expenses</p>
                <p className="stat-val">{fmt(currentMonthTotal)}</p>
                {currentMonthChange !== null && (
                  <p className={`stat-change ${Number(currentMonthChange) > 0 ? "stat-change--up" : "stat-change--down"}`}>
                    <Icon name={Number(currentMonthChange) > 0 ? "trending-up" : "trending-down"} size={12} />
                    {Math.abs(currentMonthChange)}% vs previous month
                  </p>
                )}
              </div>
              <div className="stat-spark">
                <Sparkline data={sparkValues} color="#6366f1" height={44} width={90} />
              </div>
            </div>
            <p className="stat-meta">{currentMonthCategoryCount} categories · {currentMonthTransactionCount} transactions</p>
          </div>

          <div className="stat-card">
            <div className="stat-bg-glow" style={{ background: "radial-gradient(circle at 70% 30%, rgba(249,115,22,0.12) 0%, transparent 65%)" }} />
            <div className="stat-top">
              <div>
                <p className="stat-label">Predicted Spend</p>
                <p className="stat-val" style={{ color: predictionTotal > 0 ? (predictionTotal > totalMonthly ? "#ea580c" : "#16a34a") : "#94a3b8" }}>
                  {predictionTotal > 0 ? fmt(predictionTotal) : "—"}
                </p>
                {predictionTotal > 0 && currentMonthTotal > 0 && (
                  <p className={`stat-change ${predictionTotal > currentMonthTotal ? "stat-change--up" : "stat-change--down"}`}>
                    <Icon name={predictionTotal > currentMonthTotal ? "trending-up" : "trending-down"} size={12} />
                    {Math.abs(((predictionTotal - currentMonthTotal) / currentMonthTotal) * 100).toFixed(1)}% vs current
                  </p>
                )}
              </div>
              <div className="stat-icon" style={{ background: "#fff7ed", color: "#ea580c" }}>
                <Icon name="sparkles" size={22} color="#ea580c" />
              </div>
            </div>
            <p className="stat-meta">{forecast.length > 0 ? `${forecast.length}-month trained-model forecast for ${area}` : "Run prediction to see trained-model forecast"}</p>
            <p className="stat-meta">{forecast.length > 0 ? `Based on ${predictionBaseMonth === "ALL" ? "all previous months in database" : `${selectedActualMonth} and earlier months`}` : `Prediction target: ${targetPredictionMonth}`}</p>
          </div>

          <div className="stat-card">
            <div className="stat-bg-glow" style={{ background: "radial-gradient(circle at 70% 30%, rgba(16,185,129,0.12) 0%, transparent 65%)" }} />
            <div className="stat-top">
              <div>
                <p className="stat-label">Area Model Average ({area})</p>
                <p className="stat-val" style={{ color: areaAvg > 0 ? "#059669" : "#94a3b8" }}>
                  {areaAvg > 0 ? fmt(areaAvg) : "—"}
                </p>
                {areaAvg > 0 && currentMonthTotal > 0 && (
                  <p className={`stat-change ${currentMonthTotal > areaAvg ? "stat-change--up" : "stat-change--down"}`}>
                    <Icon name={currentMonthTotal > areaAvg ? "trending-up" : "trending-down"} size={12} />
                    You spend {Math.abs(((currentMonthTotal - areaAvg) / areaAvg) * 100).toFixed(1)}% {currentMonthTotal > areaAvg ? "more" : "less"}
                  </p>
                )}
              </div>
              <div className="stat-icon" style={{ background: "#ecfdf5", color: "#059669" }}>
                <Icon name="map-pin" size={22} color="#059669" />
              </div>
            </div>
            <p className="stat-meta">{areaAvg > 0 ? `Model-based area comparison using ${currentMonthKey}` : "Run prediction to compare"}</p>
          </div>
        </div>

        <div className="report-card">
          <div className="report-card-icon"><Icon name="lightbulb" size={18} color="#7c3aed" /></div>
          <div>
            <p className="report-card-title">Monthly AI Report</p>
            <div className="report-card-text">{reportLines.map((line, i) => (<p key={line.label} className="report-line"><strong>{line.label}:</strong> {line.text}</p>))}</div>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="section-tabs">
          {[
            { id: "overview", label: "Trend & Forecast", icon: "trending-up" },
            { id: "categories", label: "Category Breakdown", icon: "pie-chart" },
            { id: "comparison", label: "Actual vs Predicted", icon: "bar-chart" },
            { id: "advice", label: "Smart Insights", icon: "lightbulb" },
          ].map(t => (
            <button key={t.id} className={`sec-tab${activeSection === t.id ? " sec-tab--on" : ""}`} onClick={() => setActiveSection(t.id)}>
              <Icon name={t.icon} size={14} />
              {t.label}
            </button>
          ))}
        </div>

        {/* ── Section: Trend ── */}
        {activeSection === "overview" && (
          <div className="section-body">
            <div className="chart-panel">
              <div className="chart-panel-header">
                <div>
                  <h3 className="chart-panel-title">Monthly Trend + Forecast</h3>
                  <p className="chart-panel-sub">Last 6 months of actual spending with AI-predicted future months</p>
                </div>
                {!forecastData && (
                  <div className="chart-panel-cta">
                    <Icon name="sparkles" size={13} color="#6366f1" />
                    <span>Run prediction to see forecast</span>
                  </div>
                )}
              </div>
              <ForecastLine forecast={forecast} actualMonths={monthlyHistory} />
            </div>

            {/* Monthly history cards */}
            <div className="history-grid">
              {monthlyHistory.map((m, i) => {
                const isCurrent = i === monthlyHistory.length - 1;
                const prev = monthlyHistory[i - 1];
                const change = prev?.Total_Expense > 0 ? ((m.Total_Expense - prev.Total_Expense) / prev.Total_Expense * 100).toFixed(1) : null;
                return (
                  <div key={m.month} className={`history-card${isCurrent ? " history-card--current" : ""}`}>
                    <p className="hc-month">{m.label}{isCurrent && <span className="hc-badge">Now</span>}</p>
                    <p className="hc-val">{fmt(m.Total_Expense)}</p>
                    {change !== null && (
                      <p className={`hc-change ${Number(change) > 0 ? "hc-change--up" : "hc-change--down"}`}>
                        {Number(change) > 0 ? "▲" : "▼"} {Math.abs(change)}%
                      </p>
                    )}
                  </div>
                );
              })}
              {forecast.slice(0, 3).map((f, i) => (
                <div key={f.month} className="history-card history-card--forecast">
                  <p className="hc-month">{f.month?.slice(2)}<span className="hc-badge hc-badge--pred">Pred</span></p>
                  <p className="hc-val" style={{ color: "#f97316" }}>{fmt(f.expense)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Section: Categories ── */}
        {activeSection === "categories" && (
          <div className="section-body">
            <div className="cat-section-grid">
              <div className="chart-panel" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", padding: "2rem" }}>
                <div>
                  <h3 className="chart-panel-title" style={{ textAlign: "center" }}>Spending Distribution</h3>
                  <p className="chart-panel-sub" style={{ textAlign: "center" }}>
                    {forecastData?.charts?.pie?.length ? "Based on prediction model" : "Current month's expenses"}
                  </p>
                </div>
                {pieData.length > 0 ? (
                  <DonutChart data={pieData} size={220} />
                ) : (
                  <div className="empty-state">
                    <span style={{ fontSize: 40 }}>🍩</span>
                    <p>No expense data yet</p>
                  </div>
                )}
              </div>

              <div className="cat-legend-panel">
                <h3 className="chart-panel-title" style={{ marginBottom: "1rem" }}>Category Totals</h3>
                <div className="cat-legend-list">
                  {pieData.map((d, i) => {
                    const cc = CAT_COLORS[d.name] || CAT_COLORS["Other"];
                    const pct = totalMonthly > 0 ? ((d.value / totalMonthly) * 100).toFixed(1) : 0;
                    return (
                      <div key={d.name} className="cat-legend-row" style={{ animationDelay: `${i * 0.05}s` }}>
                        <div className="clr-left">
                          <div className="clr-icon" style={{ background: cc.bg, color: cc.color }}>
                            <Icon name={CAT_ICONS[d.name] || "circle"} size={14} />
                          </div>
                          <div>
                            <p className="clr-name">{d.name}</p>
                            <div className="clr-bar-track">
                              <div className="clr-bar-fill" style={{ width: `${pct}%`, background: cc.color }} />
                            </div>
                          </div>
                        </div>
                        <div className="clr-right">
                          <span className="clr-amt">{fmt(d.value)}</span>
                          <span className="clr-pct">{pct}%</span>
                        </div>
                      </div>
                    );
                  })}
                  {pieData.length === 0 && <p className="empty-msg">Add expenses to see breakdown</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Section: Comparison ── */}
        {activeSection === "comparison" && (
          <div className="section-body">
            {predData || Object.keys(predictedByCategory).length > 0 ? (
              <div className="comparison-grid">
                <div className="chart-panel">
                  <h3 className="chart-panel-title">Your Spending vs Model Prediction</h3>
                  <p className="chart-panel-sub">Actual vs trained-model category prediction for {selectedActualMonth} in {area}</p>
                  <div className="bar-compare-list">
                    {catComparison.filter(d => d.actual > 0 || d.predicted > 0).map((d, i) => (
                      <BarCompare key={d.label} label={d.label} actual={d.actual} predicted={d.predicted} />
                    ))}
                    {catComparison.filter(d => d.actual > 0 || d.predicted > 0).length === 0 && (
                      <div className="empty-state">
                        <Icon name="bar-chart" size={36} color="#e2e8f0" />
                        <p>Run prediction to see comparison</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="compare-summary">
                  <div className="chart-panel" style={{ padding: "1.5rem" }}>
                    <h3 className="chart-panel-title">Summary</h3>
                    <div className="compare-sum-list">
                      <div className="csl-row">
                        <div className="csl-dot" style={{ background: "#6366f1" }} />
                        <span className="csl-label">Your Total</span>
                        <span className="csl-val">{fmt(totalMonthly)}</span>
                      </div>
                      {predictionTotal > 0 && (
                        <div className="csl-row">
                          <div className="csl-dot" style={{ background: "#f97316" }} />
                          <span className="csl-label">Predicted</span>
                          <span className="csl-val">{fmt(predictionTotal)}</span>
                        </div>
                      )}
                      {hasMonthlyBudget && (
                        <div className="csl-row">
                          <div className="csl-dot" style={{ background: "#8b5cf6" }} />
                          <span className="csl-label">Budget Target</span>
                          <span className="csl-val">{fmt(monthlyTarget)}</span>
                        </div>
                      )}
                      {areaAvg > 0 && (
                        <div className="csl-row">
                          <div className="csl-dot" style={{ background: "#059669" }} />
                          <span className="csl-label">Area Average</span>
                          <span className="csl-val">{fmt(areaAvg)}</span>
                        </div>
                      )}
                    </div>

                    {areaAvg > 0 && totalMonthly > 0 && (
                      <div className="vs-badge" style={{ background: totalMonthly > areaAvg ? "#fef2f2" : "#f0fdf4", color: totalMonthly > areaAvg ? "#dc2626" : "#16a34a", marginTop: "1rem" }}>
                        <Icon name={totalMonthly > areaAvg ? "trending-up" : "trending-down"} size={16} />
                        <div>
                          <p style={{ fontWeight: 800, fontSize: "0.95rem" }}>
                            {totalMonthly > areaAvg ? "Above" : "Below"} Area Average
                          </p>
                          <p style={{ fontSize: "0.76rem", opacity: 0.8 }}>
                            by {fmt(Math.abs(totalMonthly - areaAvg))} ({Math.abs(((totalMonthly - areaAvg) / areaAvg) * 100).toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-cta-card">
                <div className="ecc-icon"><Icon name="sparkles" size={28} color="#6366f1" /></div>
                <h3>No Prediction Data Yet</h3>
                <p>Select a base month and click <strong>Predict My Expenses</strong> to compare your actual expenses with the trained-model prediction.</p>
                <button className="predict-btn" onClick={runPrediction} disabled={predLoading}>
                  <Icon name="sparkles" size={15} color="white" /><span>Run Prediction Now</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── Section: Advice ── */}
        {activeSection === "advice" && (
          <div className="section-body">
            {smartInsights.length > 0 ? (
              <div className="advice-grid">
                <div className="advice-panel">
                  <div className="advice-panel-header">
                    <div className="advice-header-icon"><Icon name="lightbulb" size={20} color="#ca8a04" /></div>
                    <div>
                      <h3 className="chart-panel-title">Smart Spending Insights</h3>
                      <p className="chart-panel-sub">Model-based guidance using your selected month and previous expense history for {area}</p>
                    </div>
                  </div>
                  <div className="advice-list">
                    {smartInsights.map((item, i) => (
                      <div key={i} className="advice-item" style={{ animationDelay: `${i * 0.08}s` }}>
                        <div className="advice-num">{i + 1}</div>
                        <div className="advice-text">
                          <Icon name="check-circle" size={14} color="#16a34a" />
                          <p><strong>{item.title}:</strong> {item.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {Object.keys(predictedByCategory).length > 0 && (
                  <div className="rec-panel">
                    <h3 className="chart-panel-title" style={{ marginBottom: "1.2rem" }}>Model Category Plan</h3>
                    <div className="rec-list">
                      {Object.entries(predictedByCategory).map(([k, v]) => {
                        const uiName = MODEL_TO_UI[k] || k;
                        const cc = CAT_COLORS[uiName] || CAT_COLORS["Other"];
                        const actual = catTotals[k] || 0;
                        const over = actual > v;
                        return (
                          <div key={k} className="rec-row">
                            <div className="rec-icon" style={{ background: cc.bg, color: cc.color }}>
                              <Icon name={CAT_ICONS[uiName] || "circle"} size={14} />
                            </div>
                            <div className="rec-info">
                              <p className="rec-name">{uiName}</p>
                              <div className="rec-bar-track">
                                <div className="rec-bar-fill" style={{
                                  width: `${v > 0 ? Math.min((actual / v) * 100, 100) : 0}%`,
                                  background: over ? "#ef4444" : cc.color,
                                }} />
                              </div>
                            </div>
                            <div className="rec-vals">
                              <span className="rec-amount">{fmt(v)}</span>
                              {actual > 0 && (
                                <span className={`rec-actual-badge ${over ? "rec-actual-badge--over" : "rec-actual-badge--ok"}`}>
                                  {over ? "↑" : "✓"} {fmt(actual)}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-cta-card">
                <div className="ecc-icon"><Icon name="lightbulb" size={28} color="#ca8a04" /></div>
                <h3>No Insights Yet</h3>
                <p>Run prediction to generate deeper budget-driven insights. If monthly budget is missing, add it for accurate category targets.</p>
                <button className="predict-btn" onClick={runPrediction} disabled={predLoading}>
                  <Icon name="sparkles" size={15} color="white" /><span>Generate Insights</span>
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#f0f2f7;color:#1e293b;overflow-x:hidden;}

/* ── Nav (same as Expense) ── */
.nav{position:fixed;top:0;left:0;right:0;z-index:200;padding:1rem 2.5rem;transition:transform 0.4s cubic-bezier(0.4,0,0.2,1),background 0.3s,box-shadow 0.3s,padding 0.3s;}
.nav--solid{background:rgba(255,255,255,0.95);backdrop-filter:blur(24px) saturate(180%);box-shadow:0 1px 0 rgba(99,102,241,0.08),0 4px 24px rgba(99,102,241,0.06);padding:0.55rem 2.5rem;}
.nav--hide{transform:translateY(-110%);}
.nav-in{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;}
.logo{display:flex;align-items:center;gap:0.55rem;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.18rem;color:#1e1b4b;text-decoration:none;flex-shrink:0;}
.logo-icon{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(99,102,241,0.35);flex-shrink:0;transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.25s;}
.logo:hover .logo-icon{transform:scale(1.1) rotate(-8deg);box-shadow:0 6px 20px rgba(99,102,241,0.48);}
.pill-nav{position:relative;display:flex;align-items:center;background:rgba(255,255,255,0.82);border:1px solid rgba(99,102,241,0.14);border-radius:9999px;padding:0.3rem;backdrop-filter:blur(14px);box-shadow:0 2px 14px rgba(99,102,241,0.08),inset 0 1px 0 rgba(255,255,255,0.85);}
.pill-bg{position:absolute;top:0.3rem;bottom:0.3rem;background:white;border-radius:9999px;box-shadow:0 2px 10px rgba(99,102,241,0.18),0 1px 3px rgba(0,0,0,0.06);transition:left 0.28s cubic-bezier(0.34,1.56,0.64,1),width 0.28s cubic-bezier(0.34,1.56,0.64,1),opacity 0.15s;pointer-events:none;z-index:0;}
.pill-link{position:relative;z-index:1;padding:0.4rem 1.1rem;border-radius:9999px;font-size:0.86rem;font-weight:500;color:#64748b;text-decoration:none;transition:color 0.18s;white-space:nowrap;user-select:none;}
.pill-link:hover{color:#6366f1;}
.pill-link--on{color:#6366f1;font-weight:700;}
.nav-r{display:flex;align-items:center;gap:0.9rem;flex-shrink:0;}
.user-row{display:flex;align-items:center;gap:0.55rem;}
.uname{font-size:0.86rem;font-weight:600;color:#1e1b4b;}
.logout-btn{background:#fee2e2;border:none;color:#b91c1c;padding:0.26rem 0.82rem;border-radius:9999px;font-size:0.78rem;font-weight:600;cursor:pointer;transition:background 0.18s;font-family:inherit;}
.logout-btn:hover{background:#fecaca;}
.auth-row{display:flex;align-items:center;gap:0.8rem;}
.login-link{color:#64748b;text-decoration:none;font-size:0.86rem;font-weight:500;}
.signup-link{display:inline-flex;align-items:center;gap:0.4rem;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;padding:0.42rem 1.1rem;border-radius:9999px;font-size:0.86rem;font-weight:700;text-decoration:none;box-shadow:0 4px 14px rgba(99,102,241,0.34);}

/* ── Page ── */
.an-main{max-width:1280px;margin:0 auto;padding:96px 2rem 3rem;}

.an-header{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:1rem;margin-bottom:2rem;}
.an-header-left{display:flex;align-items:center;gap:1rem;}
.an-header-icon{width:48px;height:48px;border-radius:14px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;box-shadow:0 6px 20px rgba(99,102,241,0.32);flex-shrink:0;}
.an-title{font-size:1.9rem;font-weight:800;color:#1e293b;letter-spacing:-0.03em;line-height:1.1;}
.an-sub{font-size:0.84rem;color:#94a3b8;font-weight:500;margin-top:3px;}

.predict-controls{display:flex;align-items:center;gap:0.6rem;flex-wrap:wrap;}
.area-select-wrap{display:flex;align-items:center;gap:0.4rem;background:white;border:1.5px solid #e2e8f0;border-radius:10px;padding:0.3rem 0.7rem;box-shadow:0 2px 8px rgba(0,0,0,0.04);}
.area-select{font-size:0.84rem;font-weight:600;color:#1e293b;background:transparent;border:none;outline:none;cursor:pointer;font-family:inherit;}
.area-auto-btn{display:inline-flex;align-items:center;gap:0.35rem;background:white;border:1.5px solid #e2e8f0;border-radius:10px;padding:0.42rem 0.7rem;font-size:0.78rem;font-weight:700;color:#475569;cursor:pointer;font-family:inherit;box-shadow:0 2px 8px rgba(0,0,0,0.04);}
.area-auto-btn:hover:not(:disabled){background:#f8fafc;color:#1f2937;}
.area-auto-btn:disabled{opacity:0.6;cursor:not-allowed;}
.predict-btn{display:inline-flex;align-items:center;gap:0.45rem;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;padding:0.65rem 1.3rem;border-radius:10px;font-size:0.86rem;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(99,102,241,0.3);transition:all 0.22s;font-family:inherit;}
.predict-btn:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 8px 24px rgba(99,102,241,0.42);}
.predict-btn:disabled{opacity:0.65;cursor:not-allowed;}
.predict-btn--loading{background:linear-gradient(135deg,#818cf8,#a78bfa);}
.pred-spinner{width:15px;height:15px;border:2.5px solid rgba(255,255,255,0.35);border-top-color:white;border-radius:50%;animation:spin 0.85s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}

\n.report-card{display:flex;align-items:flex-start;gap:0.8rem;background:linear-gradient(135deg,#faf5ff,#eef2ff);border:1.5px solid #ddd6fe;border-radius:14px;padding:0.9rem 1rem;margin-bottom:1.2rem;}\n.report-card-icon{width:34px;height:34px;border-radius:10px;background:#ede9fe;display:flex;align-items:center;justify-content:center;flex-shrink:0;}\n.report-card-title{font-size:0.78rem;font-weight:800;color:#6d28d9;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.2rem;}\n.report-card-text{display:flex;flex-direction:column;gap:0.32rem;font-size:0.85rem;color:#334155;line-height:1.55;}\n.report-line{font-weight:560;}\n.report-line strong{color:#4c1d95;font-weight:800;}\n

/* ── Stats Grid ── */
.stats-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.6rem;}
.stat-card{background:white;border-radius:20px;padding:1.4rem;border:1.5px solid #e8edf5;box-shadow:0 2px 8px rgba(0,0,0,0.04);position:relative;overflow:hidden;transition:transform 0.2s,box-shadow 0.2s;animation:fadeUp 0.5s cubic-bezier(0.2,0.9,0.1,1) both;}
.stat-card:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(0,0,0,0.08);}
.stat-card--primary{border-color:rgba(99,102,241,0.2);}
.stat-bg-glow{position:absolute;inset:0;pointer-events:none;}
.stat-top{display:flex;align-items:flex-start;justify-content:space-between;gap:0.5rem;margin-bottom:0.6rem;position:relative;}
.stat-label{font-size:0.73rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:5px;}
.stat-val{font-size:1.75rem;font-weight:800;letter-spacing:-0.02em;color:#1e293b;line-height:1.1;}
.stat-change{display:inline-flex;align-items:center;gap:4px;font-size:0.72rem;font-weight:700;margin-top:5px;border-radius:99px;padding:0.18rem 0.5rem;}
.stat-change--up{background:#fef2f2;color:#dc2626;}
.stat-change--down{background:#f0fdf4;color:#16a34a;}
.stat-icon{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.stat-spark{flex-shrink:0;opacity:0.8;}
.stat-meta{font-size:0.76rem;color:#94a3b8;font-weight:500;position:relative;}

@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}

/* ── Section Tabs ── */
.section-tabs{display:flex;gap:0.4rem;background:white;border:1.5px solid #e8edf5;border-radius:14px;padding:0.35rem;box-shadow:0 2px 8px rgba(0,0,0,0.04);margin-bottom:1.2rem;flex-wrap:wrap;}
.sec-tab{display:inline-flex;align-items:center;gap:0.4rem;padding:0.5rem 1.1rem;border-radius:10px;border:none;background:transparent;font-size:0.84rem;font-weight:600;color:#64748b;cursor:pointer;transition:all 0.18s;font-family:inherit;}
.sec-tab:hover{background:#f8fafc;color:#475569;}
.sec-tab--on{background:#eef2ff;color:#4338ca;box-shadow:0 1px 4px rgba(99,102,241,0.15);}

/* ── Section Body ── */
.section-body{animation:fadeUp 0.3s cubic-bezier(0.2,0.9,0.1,1);}

/* ── Chart Panel ── */
.chart-panel{background:white;border:1.5px solid #e8edf5;border-radius:18px;padding:1.6rem;box-shadow:0 2px 8px rgba(0,0,0,0.04);}
.chart-panel-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:1.4rem;gap:1rem;}
.chart-panel-title{font-size:1rem;font-weight:800;color:#1e293b;margin-bottom:3px;}
.chart-panel-sub{font-size:0.76rem;color:#94a3b8;font-weight:500;}
.chart-panel-cta{display:inline-flex;align-items:center;gap:0.4rem;background:#eef2ff;color:#6366f1;font-size:0.75rem;font-weight:700;padding:0.35rem 0.8rem;border-radius:99px;white-space:nowrap;}

/* ── History Grid ── */
.history-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:0.7rem;margin-top:1rem;}
.history-card{background:white;border:1.5px solid #e8edf5;border-radius:14px;padding:0.85rem 0.9rem;transition:all 0.2s;animation:fadeUp 0.4s cubic-bezier(0.2,0.9,0.1,1) both;}
.history-card:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.07);}
.history-card--current{border-color:rgba(99,102,241,0.3);background:linear-gradient(135deg,#fafbff,#f0f2ff);}
.history-card--forecast{border:1.5px dashed #fed7aa;background:#fffbf5;}
.hc-month{font-size:0.7rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;display:flex;align-items:center;gap:4px;}
.hc-badge{font-size:0.6rem;font-weight:800;padding:0.1rem 0.35rem;border-radius:99px;background:#eef2ff;color:#6366f1;letter-spacing:0.04em;}
.hc-badge--pred{background:#fff7ed;color:#ea580c;}
.hc-val{font-size:1rem;font-weight:800;color:#1e293b;letter-spacing:-0.01em;}
.hc-change{font-size:0.69rem;font-weight:700;margin-top:3px;}
.hc-change--up{color:#dc2626;}
.hc-change--down{color:#16a34a;}

/* ── Category Section ── */
.cat-section-grid{display:grid;grid-template-columns:auto 1fr;gap:1.2rem;align-items:start;}
.cat-legend-panel{background:white;border:1.5px solid #e8edf5;border-radius:18px;padding:1.6rem;box-shadow:0 2px 8px rgba(0,0,0,0.04);}
.cat-legend-list{display:flex;flex-direction:column;gap:0.7rem;}
.cat-legend-row{display:flex;align-items:center;justify-content:space-between;gap:0.7rem;padding:0.55rem 0.6rem;border-radius:10px;transition:background 0.15s;animation:fadeUp 0.4s cubic-bezier(0.2,0.9,0.1,1) both;}
.cat-legend-row:hover{background:#f8fafc;}
.clr-left{display:flex;align-items:center;gap:0.7rem;flex:1;min-width:0;}
.clr-icon{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.clr-name{font-size:0.84rem;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:130px;margin-bottom:4px;}
.clr-bar-track{width:100%;max-width:120px;height:4px;background:#f1f5f9;border-radius:99px;overflow:hidden;}
.clr-bar-fill{height:100%;border-radius:99px;transition:width 0.8s cubic-bezier(0.2,0.9,0.1,1);}
.clr-right{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0;}
.clr-amt{font-size:0.88rem;font-weight:800;color:#1e293b;}
.clr-pct{font-size:0.69rem;font-weight:700;color:#94a3b8;}
.empty-msg{font-size:0.82rem;color:#cbd5e1;text-align:center;padding:0.8rem 0;}
.empty-state{display:flex;flex-direction:column;align-items:center;gap:0.7rem;padding:2.5rem;color:#94a3b8;font-size:0.86rem;font-weight:500;}

/* ── Bar Compare ── */
.bar-compare-list{display:flex;flex-direction:column;gap:1rem;margin-top:1rem;}
.bar-compare{padding:0.9rem 0;border-bottom:1px solid #f1f5f9;}
.bar-compare:last-child{border-bottom:none;}
.bc-label{font-size:0.8rem;font-weight:700;color:#334155;margin-bottom:0.5rem;}
.bc-bars{display:flex;flex-direction:column;gap:0.35rem;}
.bc-bar-row{display:flex;align-items:center;gap:0.5rem;}
.bc-tag{font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;width:46px;flex-shrink:0;}
.bc-tag--actual{color:#6366f1;}
.bc-tag--pred{color:#f97316;}
.bc-track{flex:1;height:8px;background:#f1f5f9;border-radius:99px;overflow:hidden;}
.bc-fill{height:100%;border-radius:99px;transition:width 0.9s cubic-bezier(0.2,0.9,0.1,1);}
.bc-fill--actual{background:linear-gradient(90deg,#818cf8,#6366f1);}
.bc-fill--pred{background:linear-gradient(90deg,#fb923c,#f97316);}
.bc-val{font-size:0.78rem;font-weight:700;color:#1e293b;width:66px;text-align:right;flex-shrink:0;}
.bc-diff{display:inline-flex;align-items:center;gap:4px;font-size:0.7rem;font-weight:700;margin-top:4px;opacity:0.75;}
.bc-diff--up{color:#dc2626;}
.bc-diff--down{color:#16a34a;}

/* ── Comparison Section ── */
.comparison-grid{display:grid;grid-template-columns:1fr 280px;gap:1.2rem;align-items:start;}
.compare-summary{}
.compare-sum-list{display:flex;flex-direction:column;gap:0.6rem;margin-top:1rem;}
.csl-row{display:flex;align-items:center;gap:0.6rem;padding:0.5rem 0;border-bottom:1px solid #f8fafc;}
.csl-row:last-child{border:none;}
.csl-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;}
.csl-label{font-size:0.8rem;font-weight:600;color:#64748b;flex:1;}
.csl-val{font-size:0.9rem;font-weight:800;color:#1e293b;}
.vs-badge{display:flex;align-items:center;gap:0.6rem;border-radius:12px;padding:0.85rem 1rem;}

/* ── Advice ── */
.advice-grid{display:grid;grid-template-columns:1fr 340px;gap:1.2rem;align-items:start;}
.advice-panel{background:white;border:1.5px solid #e8edf5;border-radius:18px;padding:1.6rem;box-shadow:0 2px 8px rgba(0,0,0,0.04);}
.advice-panel-header{display:flex;align-items:flex-start;gap:0.85rem;margin-bottom:1.4rem;padding-bottom:1rem;border-bottom:1px solid #f1f5f9;}
.advice-header-icon{width:44px;height:44px;border-radius:12px;background:#fefce8;border:1.5px solid #fde68a;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.advice-list{display:flex;flex-direction:column;gap:0.7rem;}
.advice-item{display:flex;align-items:flex-start;gap:0.75rem;padding:0.8rem;border-radius:12px;background:#f8fafc;border:1px solid #f1f5f9;animation:fadeUp 0.4s cubic-bezier(0.2,0.9,0.1,1) both;transition:box-shadow 0.2s,transform 0.2s;}
.advice-item:hover{box-shadow:0 4px 16px rgba(0,0,0,0.06);transform:translateX(3px);}
.advice-num{width:22px;height:22px;border-radius:6px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;font-size:0.7rem;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;}
.advice-text{display:flex;align-items:flex-start;gap:0.5rem;flex:1;}
.advice-text p{font-size:0.86rem;font-weight:500;color:#334155;line-height:1.6;}\n.advice-text p strong{color:#1e293b;font-weight:800;}
.rec-panel{background:white;border:1.5px solid #e8edf5;border-radius:18px;padding:1.4rem;box-shadow:0 2px 8px rgba(0,0,0,0.04);}
.rec-list{display:flex;flex-direction:column;gap:0.7rem;}
.rec-row{display:flex;align-items:center;gap:0.6rem;animation:fadeUp 0.4s cubic-bezier(0.2,0.9,0.1,1) both;}
.rec-icon{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.rec-info{flex:1;min-width:0;}
.rec-name{font-size:0.77rem;font-weight:700;color:#334155;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rec-bar-track{height:5px;background:#f1f5f9;border-radius:99px;overflow:hidden;}
.rec-bar-fill{height:100%;border-radius:99px;transition:width 0.8s cubic-bezier(0.2,0.9,0.1,1);}
.rec-vals{display:flex;flex-direction:column;align-items:flex-end;gap:2px;flex-shrink:0;}
.rec-amount{font-size:0.8rem;font-weight:800;color:#1e293b;}
.rec-actual-badge{font-size:0.64rem;font-weight:700;padding:0.1rem 0.35rem;border-radius:99px;}
.rec-actual-badge--over{background:#fef2f2;color:#dc2626;}
.rec-actual-badge--ok{background:#f0fdf4;color:#16a34a;}

/* ── Empty CTA ── */
.empty-cta-card{background:white;border:1.5px dashed #c7d2fe;border-radius:20px;padding:3rem 2rem;display:flex;flex-direction:column;align-items:center;gap:1rem;text-align:center;}
.ecc-icon{width:60px;height:60px;border-radius:16px;background:linear-gradient(135deg,#eef2ff,#e0e7ff);display:flex;align-items:center;justify-content:center;}
.empty-cta-card h3{font-size:1.1rem;font-weight:800;color:#1e293b;}
.empty-cta-card p{font-size:0.86rem;color:#64748b;font-weight:500;max-width:380px;line-height:1.6;}

@media(max-width:900px){
  .stats-grid{grid-template-columns:1fr 1fr;}
  .cat-section-grid{grid-template-columns:1fr;}
  .comparison-grid{grid-template-columns:1fr;}
  .advice-grid{grid-template-columns:1fr;}
}
@media(max-width:640px){
  .stats-grid{grid-template-columns:1fr;}
  .pill-nav{display:none;}
  .an-main{padding:80px 1rem 2rem;}
  .an-header{flex-wrap:wrap;}
  .section-tabs{gap:0.25rem;}
  .sec-tab{padding:0.4rem 0.7rem;font-size:0.78rem;}
}
`;
















