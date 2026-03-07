import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Home',     to: '/'         },
  { label: 'Expenses', to: '/expenses' },
  { label: 'Analytics',to: '/analytics'},
  { label: 'Profile',  to: '/profile'  },
];

function PillNav({ activeIdx, setActiveIdx }) {
  const pillRef  = useRef(null);
  const linkRefs = useRef([]);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [pill,     setPill]     = useState({ left: 0, width: 0, opacity: 0 });
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
          className={`pill-link${activeIdx === i ? ' pill-link--on' : ''}`}
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
  const initials = ((user?.first_name?.[0] || '') + (user?.last_name?.[0] || '')).toUpperCase() || 'U';
  if (src && !imgErr) return <img src={src} alt={initials} onError={() => setImgErr(true)} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(99,102,241,0.18)', flexShrink: 0 }} />;
  return <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, color: 'white', flexShrink: 0, border: '2px solid rgba(99,102,241,0.18)' }}>{initials}</div>;
}

const Icon = ({ name, size = 16, color = 'currentColor', sw = 2 }) => {
  const paths = {
    'coffee':       <><path d="M17 8h1a4 4 0 0 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" x2="6" y1="2" y2="4"/><line x1="10" x2="10" y1="2" y2="4"/><line x1="14" x2="14" y1="2" y2="4"/></>,
    'truck':        <><path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11v12H5Z"/><path d="M9 17h6M18 17h1a2 2 0 0 0 2-2v-5l-3-4h-3v11"/><circle cx="7" cy="17" r="2"/><circle cx="18" cy="17" r="2"/></>,
    'film':         <><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M7 3v18M17 3v18M3 8h4M17 8h4M3 16h4M17 16h4"/></>,
    'shopping-bag': <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><line x1="3" x2="21" y1="6" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></>,
    'zap':          <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    'home':         <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    'trending-up':  <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
    'target':       <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    'heart':        <><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></>,
    'book-open':    <><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></>,
    'globe':        <><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 1 0 20 14.5 14.5 0 0 1 0-20"/><path d="M2 12h20"/></>,
    'user':         <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    'circle':       <><circle cx="12" cy="12" r="10"/></>,
    'search':       <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></>,
    'edit-2':       <><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></>,
    'trash-2':      <><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></>,
    'bar-chart-2':  <><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></>,
    'layers':       <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
    'chevron-down': <><path d="m6 9 6 6 6-6"/></>,
    'plus':         <><line x1="12" x2="12" y1="5" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    'x':            <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    'check':        <><path d="M20 6 9 17l-5-5"/></>,
    'wallet':       <><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></>,
    'arrow-down-circle': <><circle cx="12" cy="12" r="10"/><path d="m8 12 4 4 4-4"/><path d="M12 8v8"/></>,
    'pie-chart':    <><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      {paths[name] || paths['circle']}
    </svg>
  );
};

const CAT_ICONS = {
  'Food & Dining':'coffee','Transportation':'truck','Entertainment':'film',
  'Shopping':'shopping-bag','Utilities':'zap','Housing':'home','Income':'trending-up',
  'Savings':'target','Healthcare':'heart','Education':'book-open','Travel':'globe',
  'Personal Care':'user','Other':'circle'
};
const CAT_COLORS = {
  'Food & Dining':{bg:'#fff7ed',color:'#ea580c'},
  'Transportation':{bg:'#eff6ff',color:'#2563eb'},
  'Entertainment':{bg:'#fdf4ff',color:'#a21caf'},
  'Shopping':{bg:'#fdf2f8',color:'#db2777'},
  'Utilities':{bg:'#fefce8',color:'#ca8a04'},
  'Housing':{bg:'#f0fdf4',color:'#16a34a'},
  'Income':{bg:'#f0fdf4',color:'#15803d'},
  'Savings':{bg:'#eef2ff',color:'#4338ca'},
  'Healthcare':{bg:'#fff1f2',color:'#e11d48'},
  'Education':{bg:'#f0f9ff',color:'#0284c7'},
  'Travel':{bg:'#ecfdf5',color:'#059669'},
  'Personal Care':{bg:'#faf5ff',color:'#7c3aed'},
  'Other':{bg:'#f8fafc',color:'#475569'}
};
const CATEGORIES = ['Food & Dining','Transportation','Entertainment','Shopping','Utilities','Housing','Healthcare','Education','Travel','Personal Care','Income','Savings','Other'];
const DONUT_COLORS = ['#ea580c','#2563eb','#a21caf','#db2777','#ca8a04','#16a34a','#e11d48','#0284c7','#059669','#7c3aed','#4338ca','#15803d','#475569'];

const fmt  = (n) => '₹' + (Number(n)||0).toLocaleString('en-IN',{maximumFractionDigits:0});
const fmtD = (n) => '₹' + (Number(n)||0).toFixed(2);
const san  = (n) => { const v = Number(n)||0; return (v>0&&v<1) ? Math.round(v*1000*100)/100 : v; };

const parseDateParts = (dateStr) => {
  const p = (dateStr||'').split('-');
  if (p.length !== 3) return null;
  return { y: parseInt(p[0]), m: parseInt(p[1])-1, d: parseInt(p[2]) };
};

const API = 'http://localhost:4000';
const TEST_EMAIL = 'samalanithin18@gmail.com';
const TEST_DAILY_EXP_KEY = 'expenseai:test:dailyExpenses:v1';

function generateOneYearDailyTestExpenses() {
  const categories = [
    'Food & Dining', 'Transportation', 'Entertainment', 'Shopping', 'Utilities',
    'Housing', 'Healthcare', 'Education', 'Travel', 'Personal Care', 'Other'
  ];
  const categoryBase = {
    'Food & Dining': 220,
    'Transportation': 120,
    'Entertainment': 110,
    'Shopping': 180,
    'Utilities': 150,
    'Housing': 480,
    'Healthcare': 90,
    'Education': 130,
    'Travel': 160,
    'Personal Care': 95,
    'Other': 70,
  };
  const now = new Date();
  const rows = [];
  let idCounter = 1;

  for (let m = -11; m <= 0; m++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + m, 1);
    const y = monthDate.getFullYear();
    const mo = monthDate.getMonth();
    const daysInMonth = new Date(y, mo + 1, 0).getDate();
    const monthSeason = (mo === 4 || mo === 11) ? 1.2 : (mo === 9 || mo === 10 ? 1.1 : 1.0);

    for (let d = 1; d <= daysInMonth; d++) {
      const cat = categories[(d + mo) % categories.length];
      const dayWave = 0.88 + (((d * 37 + mo * 17) % 23) / 100);
      const amount = Math.round((categoryBase[cat] || 120) * monthSeason * dayWave);
      const date = `${y}-${String(mo + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      rows.push({
        id: `test-exp-${idCounter++}`,
        title: `${cat} expense`,
        amount,
        category: cat,
        type: 'expense',
        date,
      });
    }

    rows.push({
      id: `test-inc-${y}-${String(mo + 1).padStart(2, '0')}` ,
      title: 'Income',
      amount: 42000,
      category: 'Income',
      type: 'income',
      date: `${y}-${String(mo + 1).padStart(2, '0')}-01`,
    });
  }

  return rows;
}

function loadOrCreateDailyTestExpenses() {
  try {
    const raw = localStorage.getItem(TEST_DAILY_EXP_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 300) return parsed;
    }
  } catch {}
  const generated = generateOneYearDailyTestExpenses();
  localStorage.setItem(TEST_DAILY_EXP_KEY, JSON.stringify(generated));
  return generated;
}

// ─────────────────────────────────────────────────────────────────────────────
//  TOP-LEVEL CHART COMPONENTS — defined outside Expense so they NEVER remount
//  on parent state changes (tooltip hover, etc). Only re-render when their
//  own props (categoryData / trendData) actually change.
// ─────────────────────────────────────────────────────────────────────────────

const CategoryChart = React.memo(function CategoryChart({ categoryData, onTooltip }) {
  const canvasRef = useRef(null);
  const instRef   = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    let mounted = true;

    (async () => {
      try {
        const m = await import('chart.js/auto');
        const Chart = m.default || m;
        if (!mounted) return;
        if (instRef.current) { instRef.current.destroy(); instRef.current = null; }
        if (!categoryData || !categoryData.length) return;

        const labels  = categoryData.map(([c]) => c);
        const data    = categoryData.map(([, v]) => v.total);
        const colors  = labels.map(l => (CAT_COLORS[l]?.color || '#6366f1') + 'cc');
        const borders = labels.map(l => CAT_COLORS[l]?.color || '#6366f1');

        instRef.current = new Chart(canvasRef.current.getContext('2d'), {
          type: 'doughnut',
          data: { labels, datasets: [{ data, backgroundColor: colors, borderColor: borders, borderWidth: 2, hoverOffset: 16 }] },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '66%',
            // Only animate on first load, not on every hover
            animation: { animateScale: true, animateRotate: true, duration: 550 },
            plugins: {
              legend: {
                position: 'right',
                labels: {
                  font: { family: "'Plus Jakarta Sans', sans-serif", size: 12, weight: '600' },
                  padding: 14, usePointStyle: true, pointStyle: 'circle',
                  generateLabels: (chart) => {
                    const d = chart.data;
                    return d.labels.map((label, i) => ({
                      text: `${label}  ₹${d.datasets[0].data[i].toFixed(0)}`,
                      fillStyle: d.datasets[0].backgroundColor[i],
                      strokeStyle: d.datasets[0].borderColor[i],
                      pointStyle: 'circle', index: i,
                    }));
                  },
                },
              },
              tooltip: {
                enabled: false,
                external: ({ chart, tooltip: tt }) => {
                  // Hide
                  if (tt.opacity === 0) { onTooltip(null); return; }
                  const idx = tt.dataPoints?.[0]?.dataIndex;
                  if (idx === undefined || !categoryData[idx]) return;

                  const [cat, catInfo] = categoryData[idx];
                  const total = categoryData.reduce((s, [, v]) => s + v.total, 0);
                  const pct   = total > 0 ? Math.round((catInfo.total / total) * 100) : 0;
                  const rect  = chart.canvas.getBoundingClientRect();

                  onTooltip({
                    visible: true,
                    x: rect.left + tt.caretX,
                    y: rect.top  + tt.caretY,
                    title: `${cat} — ${pct}%`,
                    items: [{
                      color:    CAT_COLORS[cat]?.color || '#6366f1',
                      label:    `${catInfo.items.length} transaction${catInfo.items.length !== 1 ? 's' : ''}`,
                      value:    fmtD(catInfo.total),
                      subItems: catInfo.items
                        .sort((a, b) => b.amount - a.amount)
                        .slice(0, 6)
                        .map(it => ({ name: it.title, amt: fmtD(it.amount) })),
                    }],
                    total: null,
                  });
                },
              },
            },
          },
        });
      } catch (e) { console.warn('category chart error', e); }
    })();

    return () => { mounted = false; if (instRef.current) { instRef.current.destroy(); instRef.current = null; } };
  }, [categoryData]); // ← only data changes trigger rebuild, NOT tooltip state

  if (!categoryData || !categoryData.length) {
    return <div className="chart-empty"><span>🍩</span><p>No expense data yet.<br />Add some expenses to see your spending breakdown!</p></div>;
  }
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
});

const TrendChart = React.memo(function TrendChart({ trendData, hasExpenses }) {
  const canvasRef = useRef(null);
  const instRef   = useRef(null);

  useEffect(() => {
    if (!trendData || !canvasRef.current) return;
    let mounted = true;

    (async () => {
      try {
        const m = await import('chart.js/auto');
        const Chart = m.default || m;
        if (!mounted) return;
        if (instRef.current) { instRef.current.destroy(); instRef.current = null; }

        const ctx  = canvasRef.current.getContext('2d');
        const gPos = ctx.createLinearGradient(0, 0, 0, 280);
        gPos.addColorStop(0, 'rgba(99,102,241,0.22)');
        gPos.addColorStop(1, 'rgba(99,102,241,0.01)');

        instRef.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: trendData.labels,
            datasets: [
              { type: 'bar', label: 'Period Expenses', data: trendData.daily, backgroundColor: 'rgba(239,68,68,0.65)', borderColor: '#ef4444', borderWidth: 1.5, borderRadius: 6, maxBarThickness: 30 },
              { type: 'line', label: 'Cumulative Spending', data: trendData.cumulative, borderColor: '#6366f1', borderWidth: 2.5, backgroundColor: gPos, fill: true, tension: 0.35, pointBackgroundColor: '#6366f1', pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: trendData.labels.length > 20 ? 2 : 4, pointHoverRadius: 7 },
            ],
          },
          options: {
            responsive: true, maintainAspectRatio: false, animation: { duration: 550 },
            interaction: { intersect: false, mode: 'index' },
            scales: {
              y: { beginAtZero: true, grace: '8%', grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { maxTicksLimit: 6, font: { family: "'Plus Jakarta Sans',sans-serif", size: 11 }, callback: v => v >= 1000 ? '\u20B9' + (v / 1000).toFixed(1) + 'k' : '\u20B9' + v } },
              x: { grid: { display: false }, ticks: { font: { family: "'Plus Jakarta Sans',sans-serif", size: 11 }, maxTicksLimit: trendData.labels.length > 12 ? 12 : trendData.labels.length, maxRotation: 0 } },
            },
            plugins: {
              legend: { display: true, labels: { font: { family: "'Plus Jakarta Sans',sans-serif", size: 12 }, usePointStyle: true, pointStyle: 'circle' } },
              tooltip: {
                backgroundColor: 'rgba(255,255,255,0.98)', titleColor: '#1f2937', bodyColor: '#4b5563',
                borderColor: 'rgba(209,213,219,0.8)', borderWidth: 1, cornerRadius: 12, padding: 12, boxPadding: 6, usePointStyle: true,
                callbacks: { label: c => ` ${c.dataset.label}: \u20B9${c.parsed.y.toFixed(2)}` },
              },
            },
          },
        });
      } catch (e) { console.warn('trend chart error', e); }
    })();

    return () => { mounted = false; if (instRef.current) { instRef.current.destroy(); instRef.current = null; } };
  }, [trendData]);

  if (!trendData || !hasExpenses) {
    return <div className="chart-empty"><span>📈</span><p>No data yet.<br />Add expenses to see your spending trends!</p></div>;
  }
  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
});

// ── Custom Tooltip Component ──
function ChartTooltip({ tooltip }) {
  if (!tooltip.visible) return null;
  return (
    <div style={{
      position: 'fixed',
      left: tooltip.x + 12,
      top: tooltip.y - 10,
      zIndex: 9999,
      background: 'rgba(15,23,42,0.97)',
      borderRadius: 14,
      padding: '10px 14px',
      minWidth: 180,
      maxWidth: 260,
      boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
      pointerEvents: 'none',
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {tooltip.title}
      </p>
      {tooltip.items && tooltip.items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: item.color, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.label}
            </span>
            {item.subItems && item.subItems.map((si, j) => (
              <div key={j} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 10.5, color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{si.name}</span>
                <span style={{ fontSize: 10.5, color: '#94a3b8', flexShrink: 0 }}>{si.amt}</span>
              </div>
            ))}
          </div>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{item.value}</span>
        </div>
      ))}
      {tooltip.total && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b' }}>Total</span>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#fff' }}>{tooltip.total}</span>
        </div>
      )}
    </div>
  );
}

export default function Expense({ user, onLogout }) {
  const [navSolid, setNavSolid] = useState(false);
  const [navHide,  setNavHide]  = useState(false);
  const lastScroll = useRef(0);
  const [activeIdx, setActiveIdx] = useState(1);
  const isTestUser = (user?.email || '').toLowerCase() === TEST_EMAIL;

  const [expenses,    setExpenses]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [modalOpen,   setModalOpen]   = useState(false);
  const [editingExp,  setEditingExp]  = useState(null);
  const [timeRange,   setTimeRange]   = useState('this_month');
  const [activeChart, setActiveChart] = useState('overview');
  const [search,      setSearch]      = useState('');
  const [filterCat,   setFilterCat]   = useState('All');
  const [txRange,     setTxRange]     = useState('this_month');
  const [expandedGroups, setExpandedGroups] = useState({});
  const [monthlyBudget, setMonthlyBudget] = useState(()=>{
    try { const p=JSON.parse(localStorage.getItem('expenseai:budget')||'{}'); return Number(p.monthlyBudget||0); } catch { return 0; }
  });

  const [modalMode,      setModalMode]     = useState('manual');
  const [receiptFile,    setReceiptFile]   = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [analyzing,      setAnalyzing]     = useState(false);
  const [analyzedData,   setAnalyzedData]  = useState(null);
  const [selectedItems,  setSelectedItems] = useState({});
  const [itemsExpanded,  setItemsExpanded] = useState(false);
  const [taxPct,         setTaxPct]        = useState('');
  const fileInputRef = useRef();

  const titleRef    = useRef();
  const amountRef   = useRef();
  const categoryRef = useRef();
  const dateRef     = useRef();

  // Custom tooltip state
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, title: '', items: [], total: '' });
  const [selectedOverviewIdx, setSelectedOverviewIdx] = useState(null);

  // Chart data state
  const [overviewData,  setOverviewData]  = useState(null);
  const [categoryData,  setCategoryData]  = useState(null);
  const [trendData,     setTrendData]     = useState(null);

  useEffect(() => {
    const h = () => { const sy=window.scrollY; setNavSolid(sy>10); setNavHide(sy>lastScroll.current+10&&sy>200); lastScroll.current=sy; };
    window.addEventListener('scroll',h,{passive:true}); return () => window.removeEventListener('scroll',h);
  },[]);

  useEffect(() => {
    function syncBudget() {
      try { const p=JSON.parse(localStorage.getItem('expenseai:budget')||'{}'); setMonthlyBudget(Number(p.monthlyBudget||0)); } catch {}
    }
    window.addEventListener('storage', syncBudget);
    window.addEventListener('budgetUpdated', syncBudget);
    return () => { window.removeEventListener('storage', syncBudget); window.removeEventListener('budgetUpdated', syncBudget); };
  },[]);

  useEffect(() => {
    (async () => {
      try {
        if (isTestUser) {
          const testRows = loadOrCreateDailyTestExpenses();
          setExpenses(testRows.map(e => ({ ...e, type: e.type === 'income' || e.category === 'Income' ? 'income' : 'expense', amount: san(e.amount) })));
          return;
        }

        const res = await fetch(`${API}/api/expenses`, { credentials:'include' });
        if (!res.ok) { setLoading(false); return; }
        const data = await res.json();
        setExpenses(
          (data.expenses || []).map(e => ({
            ...e,
            type: e.type === 'income' || e.category === 'Income' ? 'income' : 'expense',
            amount: san(e.amount),
          }))
        );
      } catch(err) { console.warn('Failed to load expenses:', err); }
      finally { setLoading(false); }
    })();
  }, [isTestUser]);

  // ── Build chart data whenever expenses/range/chart changes ──
  useEffect(() => {
    if (!expenses.length) return;
    const now = new Date(), cy = now.getFullYear(), cm = now.getMonth();

    // All expense categories used
    const allCats = [...new Set(expenses.filter(e => e.type === 'expense').map(e => e.category))];

    // ── OVERVIEW: stacked bars by day/month, per category ──
    const buildOverview = () => {
      let labels = [], dateFilter;
      let toIndex = () => -1;

      if (timeRange === 'this_month') {
        if (isTestUser) {
          const days = new Date(cy, cm + 1, 0).getDate();
          labels = Array.from({ length: days }, (_, i) => `${i + 1}`);
          dateFilter = (dp) => dp && dp.y === cy && dp.m === cm;
          toIndex = (dp) => dp.d - 1;
        } else {
          labels = ['W1', 'W2', 'W3', 'W4', 'W5'];
          dateFilter = (dp) => dp && dp.y === cy && dp.m === cm;
          toIndex = (dp) => Math.min(4, Math.floor((dp.d - 1) / 7));
        }
      } else if (timeRange === 'prev_year_same_month') {
        const py = cy - 1;
        if (isTestUser) {
          const days = new Date(py, cm + 1, 0).getDate();
          labels = Array.from({ length: days }, (_, i) => `${i + 1}`);
          dateFilter = (dp) => dp && dp.y === py && dp.m === cm;
          toIndex = (dp) => dp.d - 1;
        } else {
          labels = ['W1', 'W2', 'W3', 'W4', 'W5'];
          dateFilter = (dp) => dp && dp.y === py && dp.m === cm;
          toIndex = (dp) => Math.min(4, Math.floor((dp.d - 1) / 7));
        }
      } else if (timeRange === 'past_3_months') {
        for (let i = 2; i >= 0; i--) {
          const d = new Date(cy, cm - i, 1);
          labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
        }
        dateFilter = (dp) => {
          if (!dp) return false;
          const monthsAgo = (cy - dp.y) * 12 + (cm - dp.m);
          return monthsAgo >= 0 && monthsAgo < 3;
        };
        toIndex = (dp) => {
          const monthsAgo = (cy - dp.y) * 12 + (cm - dp.m);
          return 2 - monthsAgo;
        };
      } else {
        const monthSet = new Set();
        expenses.forEach((e) => {
          if (e.type !== 'expense') return;
          const dp = parseDateParts(e.date);
          if (!dp) return;
          monthSet.add(`${dp.y}-${String(dp.m + 1).padStart(2, "0") }`);
        });
        labels = Array.from(monthSet).sort();
        dateFilter = (dp) => !!dp;
        toIndex = (dp) => labels.indexOf(`${dp.y}-${String(dp.m + 1).padStart(2, "0") }`);
      }

      const catData = {};
      allCats.forEach(cat => {
        catData[cat] = labels.map(() => ({ total: 0, items: [] }));
      });

      expenses.forEach(e => {
        if (e.type !== 'expense') return;
        const dp = parseDateParts(e.date);
        if (!dateFilter(dp)) return;
        const idx = toIndex(dp);
        if (idx < 0 || idx >= labels.length) return;
        if (!catData[e.category]) catData[e.category] = labels.map(() => ({ total: 0, items: [] }));
        catData[e.category][idx].total += san(e.amount);
        catData[e.category][idx].items.push({ title: e.title || e.category, amount: san(e.amount) });
      });

      return { labels, catData, allCats };
    };

    // CATEGORY: totals per category with items
    const buildCategory = () => {
      const filtered = expenses.filter(e => {
        if (e.type !== 'expense') return false;
        const dp = parseDateParts(e.date);
        if (!dp) return false;
        if (timeRange === 'this_month') return dp.y === cy && dp.m === cm;
        if (timeRange === 'prev_year_same_month') return dp.y === cy - 1 && dp.m === cm;
        if (timeRange === 'past_3_months') {
          const ma = (cy - dp.y) * 12 + (cm - dp.m);
          return ma >= 0 && ma < 3;
        }
        return true;
      });
      const cats = {};
      filtered.forEach(e => {
        if (!cats[e.category]) cats[e.category] = { total: 0, items: [] };
        cats[e.category].total += san(e.amount);
        cats[e.category].items.push({ title: e.title || e.category, amount: san(e.amount) });
      });
      const sorted = Object.entries(cats).sort((a, b) => b[1].total - a[1].total);
      return sorted;
    };

    // ?? TRENDS ??
    const buildTrend = () => {
      const now = new Date(), cy = now.getFullYear(), cm = now.getMonth();
      let labels = [], dateFilter;
      let toIndex = () => -1;
      if (timeRange === 'this_month') {
        if (isTestUser) {
          const days = new Date(cy, cm + 1, 0).getDate();
          labels = Array.from({ length: days }, (_, i) => `${i + 1}`);
          dateFilter = (dp) => dp && dp.y === cy && dp.m === cm;
          toIndex = (dp) => dp.d - 1;
        } else {
          labels = ['W1', 'W2', 'W3', 'W4', 'W5'];
          dateFilter = (dp) => dp && dp.y === cy && dp.m === cm;
          toIndex = (dp) => Math.min(4, Math.floor((dp.d - 1) / 7));
        }
      } else if (timeRange === 'prev_year_same_month') {
        const py = cy - 1;
        if (isTestUser) {
          const days = new Date(py, cm + 1, 0).getDate();
          labels = Array.from({ length: days }, (_, i) => `${i + 1}`);
          dateFilter = (dp) => dp && dp.y === py && dp.m === cm;
          toIndex = (dp) => dp.d - 1;
        } else {
          labels = ['W1', 'W2', 'W3', 'W4', 'W5'];
          dateFilter = (dp) => dp && dp.y === py && dp.m === cm;
          toIndex = (dp) => Math.min(4, Math.floor((dp.d - 1) / 7));
        }
      } else if (timeRange === 'past_3_months') {
        for (let i = 2; i >= 0; i--) {
          const d = new Date(cy, cm - i, 1);
          labels.push(d.toLocaleDateString('en-US', { month: 'short' }));
        }
        dateFilter = (dp) => {
          if (!dp) return false;
          const monthsAgo = (cy - dp.y) * 12 + (cm - dp.m);
          return monthsAgo >= 0 && monthsAgo < 3;
        };
        toIndex = (dp) => { const ma = (cy - dp.y) * 12 + (cm - dp.m); return 2 - ma; };
      } else {
        const monthSet = new Set();
        expenses.forEach((e) => {
          if (e.type !== 'expense') return;
          const dp = parseDateParts(e.date);
          if (!dp) return;
          monthSet.add(`${dp.y}-${String(dp.m + 1).padStart(2, "0") }`);
        });
        labels = Array.from(monthSet).sort();
        dateFilter = (dp) => !!dp;
        toIndex = (dp) => labels.indexOf(`${dp.y}-${String(dp.m + 1).padStart(2, "0") }`);
      }
      const daily = Array(labels.length).fill(0);
      expenses.forEach(e => {
        if (e.type !== 'expense') return;
        const dp = parseDateParts(e.date);
        if (!dateFilter(dp)) return;
        const idx = toIndex(dp);
        if (idx >= 0 && idx < labels.length) daily[idx] += san(e.amount);
      });
      let cum = 0;
      const cumulative = daily.map(v => { cum += v; return Math.round(cum * 100) / 100; });
      return { labels, daily, cumulative };
    };

    setOverviewData(buildOverview());
    setCategoryData(buildCategory());
    setTrendData(buildTrend());
  }, [expenses, timeRange, isTestUser]);

  const now=new Date(), cm=now.getMonth(), cy=now.getFullYear();
  const totalExpenses = expenses.filter(e=>e.type==='expense').reduce((s,e)=>s+san(e.amount),0);
  const monthlyExp    = expenses.filter(e=>e.type==='expense'&&(()=>{const dp=parseDateParts(e.date);return dp&&dp.y===cy&&dp.m===cm;})()).reduce((s,e)=>s+san(e.amount),0);
  const leftBalance   = monthlyBudget - monthlyExp;
  const rawBudgetUsedPct = monthlyBudget>0 ? (monthlyExp/monthlyBudget)*100 : 0;
  const budgetUsedPct = Math.min(rawBudgetUsedPct,100);

  const catTotals = () => { const c={}; expenses.forEach(e=>{ if(e.type==='expense') c[e.category]=(c[e.category]||0)+san(e.amount); }); return c; };
  const topCatEntries = Object.entries(catTotals()).sort((a,b)=>b[1]-a[1]);

  function notify(msg,type='success') {
    const c=document.getElementById('notifBox'); if(!c) return;
    const el=document.createElement('div');
    el.style.cssText=`padding:10px 16px;border-radius:10px;margin-bottom:8px;font-size:13.5px;font-weight:600;color:white;animation:slideN .28s cubic-bezier(0.2,0.9,0.1,1);box-shadow:0 4px 14px rgba(0,0,0,0.12);`;
    el.style.background=type==='success'?'#10b981':type==='error'?'#ef4444':'#6366f1';
    el.textContent=msg; c.appendChild(el);
    setTimeout(()=>{el.style.transition='all .3s';el.style.opacity='0';el.style.transform='translateX(60px)';setTimeout(()=>el.remove(),320);},3000);
  }

  function resetModal() { setModalMode('manual');setReceiptFile(null);setReceiptPreview(null);setAnalyzing(false);setAnalyzedData(null);setSelectedItems({});setItemsExpanded(false);setTaxPct(''); }
  function openAdd() { setEditingExp(null);resetModal();setModalOpen(true); setTimeout(()=>{ if(titleRef.current) titleRef.current.value=''; if(amountRef.current) amountRef.current.value=''; if(categoryRef.current) categoryRef.current.value='Food & Dining'; if(dateRef.current) dateRef.current.value=new Date().toISOString().split('T')[0]; },40); }
  function openEdit(id) { const e=expenses.find(x=>x.id===id); if(!e) return; setEditingExp(e);resetModal();setModalOpen(true); setTimeout(()=>{ if(titleRef.current) titleRef.current.value=e.title; if(amountRef.current) amountRef.current.value=e.amount; if(categoryRef.current) categoryRef.current.value=e.category; if(dateRef.current) dateRef.current.value=e.date; },40); }

  async function handleSubmit(ev) {
    ev.preventDefault();
    const category = categoryRef.current?.value||'Food & Dining';
    const payload = { title:titleRef.current?.value||'', amount:Number(amountRef.current?.value||0), category, date:dateRef.current?.value||new Date().toISOString().split('T')[0] };
    try {
      if(editingExp) {
        const res = await fetch(`${API}/api/expenses/${editingExp.id}`, { method:'PUT', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
        const data = await res.json();
        if(!res.ok) { notify(data.message||'Update failed','error'); return; }
        setExpenses(p=>p.map(x=>x.id===editingExp.id?{...x,...data.expense,amount:san(data.expense.amount)}:x));
        notify('Expense updated ✓');
      } else {
        const res = await fetch(`${API}/api/expenses`, { method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
        const data = await res.json();
        if(!res.ok) { notify(data.message||'Add failed','error'); return; }
        setExpenses(p=>[{...data.expense,amount:san(data.expense.amount)},...p]);
        notify('Expense added ✓');
      }
    } catch(err) { notify('Network error','error'); }
    setModalOpen(false); resetModal();
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`${API}/api/expenses/${id}`, { method:'DELETE', credentials:'include' });
      if(!res.ok) { notify('Delete failed','error'); return; }
      setExpenses(p=>p.filter(x=>x.id!==id)); notify('Deleted','error');
    } catch { notify('Network error','error'); }
  }
  async function handleDeleteInModal() { if(!editingExp) return; await handleDelete(editingExp.id); setEditingExp(null); setModalOpen(false); resetModal(); }
  async function handleDeleteGroup(groupId) {
    try {
      const res = await fetch(`${API}/api/expenses/group/${groupId}`, { method:'DELETE', credentials:'include' });
      if(!res.ok) { notify('Delete failed','error'); return; }
      setExpenses(p=>p.filter(x=>x.receiptGroupId!==groupId)); notify('Receipt deleted','error');
    } catch { notify('Network error','error'); }
  }

  async function handleReceiptSelect(e) {
    const file=e.target.files[0]; if(!file) return;
    setReceiptFile(file);setModalMode('receipt');setAnalyzedData(null);setItemsExpanded(false);setTaxPct('');
    if(file.type.startsWith('image/')){ const r=new FileReader(); r.onload=(ev)=>setReceiptPreview(ev.target.result); r.readAsDataURL(file); } else setReceiptPreview(null);
    await analyzeReceipt(file);
  }
  async function analyzeReceipt(file) {
    setAnalyzing(true);setAnalyzedData(null);setItemsExpanded(false);
    const fd=new FormData(); fd.append('image',file);
    try {
      const res=await fetch(`${API}/api/analyze-receipt`,{method:'POST',credentials:'include',body:fd});
      const data=await res.json();
      if(!res.ok){notify(data.message||'Failed to analyze receipt','error');setAnalyzing(false);return;}
      setAnalyzedData(data);
      const init={}; (data.items||[]).forEach((_,i)=>{init[i]=true;}); setSelectedItems(init);
      setAnalyzing(false); setItemsExpanded(true);
    } catch(err){notify('Failed to analyze receipt','error');setAnalyzing(false);}
  }

  const taxRate       = parseFloat(taxPct)||0;
  const itemsSubtotal = analyzedData ? (analyzedData.items||[]).filter((_,i)=>selectedItems[i]??true).reduce((s,item)=>s+(parseFloat(item.amount||0)||0),0) : 0;
  const taxAmount     = itemsSubtotal*(taxRate/100);
  const grandTotal    = itemsSubtotal+taxAmount;
  const selectedCount = analyzedData ? (analyzedData.items||[]).filter((_,i)=>selectedItems[i]??true).length : 0;

  async function confirmReceiptAdd() {
    if (!analyzedData) return;
    const date = new Date().toISOString().split('T')[0];
    const chosen = (analyzedData.items || []).filter((_, i) => selectedItems[i] ?? true);
    if (chosen.length === 0) { notify('Select at least one item', 'error'); return; }
    const groupId = `receipt_${Date.now()}`;
    const merchant = analyzedData.merchant || 'Receipt';
    const newExps = chosen.map(item => {
      const cat = item.category || 'Other';
      const amt = parseFloat(String(item.amount || '0').replace(/[^\d.]/g, '')) || 0;
      return { title: item.name || merchant, amount: amt, category: cat, date, type: cat === 'Income' ? 'income' : 'expense', receiptGroupId: groupId, receiptMerchant: merchant };
    });
    if (taxAmount > 0) {
      newExps.push({ title: `Tax (${taxRate}%)`, amount: Math.round(taxAmount * 100) / 100, category: 'Other', date, type: 'expense', receiptGroupId: groupId, receiptMerchant: merchant, isTax: true });
    }
    try {
      const res = await fetch(`${API}/api/expenses/bulk`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ items: newExps.map(e => ({ title: e.title, amount: e.amount, category: e.category, date, receiptGroupId: groupId, receiptMerchant: merchant, isTax: e.isTax || false })) }) });
      const data = await res.json();
      if (!res.ok) { notify(data.message || 'Save failed', 'error'); return; }
      let savedExpenses = [];
      if (Array.isArray(data)) savedExpenses = data;
      else if (data.expenses && Array.isArray(data.expenses)) savedExpenses = data.expenses;
      else if (data.saved && Array.isArray(data.saved)) savedExpenses = data.saved;
      else if (data.items && Array.isArray(data.items)) savedExpenses = data.items;
      else { notify('Unexpected server response', 'error'); return; }
      const saved = savedExpenses.map(e => ({ ...e, type: e.type === 'income' || e.category === 'Income' ? 'income' : 'expense', amount: san(e.amount) }));
      setExpenses(prev => [...saved, ...prev]);
      notify(`✅ Added ${merchant} — ₹${grandTotal.toFixed(2)}`);
    } catch (err) { notify('Network error', 'error'); return; }
    setModalOpen(false); resetModal();
  }

  const buildDisplayList = () => {
    const sortedExp = [...expenses].sort((a,b)=>new Date(b.date)-new Date(a.date));
    const now = new Date();
    const cy = now.getFullYear();
    const cm = now.getMonth();
    const prev = new Date(cy, cm - 1, 1);
    const py = prev.getFullYear();
    const pm = prev.getMonth();

    const inTxRange = (entry) => {
      const dp = parseDateParts(entry.date);
      if (!dp) return false;
      if (txRange === 'this_month') return dp.y === cy && dp.m === cm;
      if (txRange === 'last_month') return dp.y === py && dp.m === pm;
      if (txRange === 'past_3_months') {
        const ma = (cy - dp.y) * 12 + (cm - dp.m);
        return ma >= 0 && ma < 3;
      }
      return true;
    };

    const matchesFilter = (entry) => {
      const ms = !search || entry.title.toLowerCase().includes(search.toLowerCase()) || entry.category.toLowerCase().includes(search.toLowerCase()) || (entry.receiptMerchant || '').toLowerCase().includes(search.toLowerCase());
      return ms && (filterCat === 'All' || entry.category === filterCat) && inTxRange(entry);
    };

    const groups = {};
    const individual = [];
    sortedExp.forEach(entry => {
      if (entry.receiptGroupId) {
        if (!groups[entry.receiptGroupId]) groups[entry.receiptGroupId] = { groupId: entry.receiptGroupId, merchant: entry.receiptMerchant || 'Receipt', date: entry.date, items: [], isGroup: true };
        groups[entry.receiptGroupId].items.push(entry);
      } else {
        if (matchesFilter(entry)) individual.push(entry);
      }
    });

    const filteredGroups = Object.values(groups).filter(g => {
      const itemMatch = g.items.some(entry => matchesFilter(entry));
      if (!itemMatch) return false;
      if (!search && filterCat === 'All') return true;
      const merchantMatch = !search || g.merchant.toLowerCase().includes(search.toLowerCase());
      return merchantMatch || itemMatch;
    });

    return [...filteredGroups.map(g => ({ ...g, sortDate: g.date })), ...individual.map(entry => ({ ...entry, sortDate: entry.date }))].sort((a,b)=>new Date(b.sortDate)-new Date(a.sortDate));
  };
  const displayList = loading ? [] : buildDisplayList();

  // ── Overview stacked bar chart renderer ──
  const OverviewChart = () => {
    if (!overviewData) return <div className="chart-empty"><span>📊</span><p>No data yet</p></div>;
    const { labels, catData, allCats } = overviewData;

    // Filter cats that have any data
    const activeCats = allCats.filter(cat =>
      catData[cat] && catData[cat].some(d => d.total > 0)
    );
    if (!activeCats.length) return <div className="chart-empty"><span>📊</span><p>No expense data for this period</p></div>;

    // Max value for scaling
    const totals = labels.map((_, i) =>
      activeCats.reduce((s, cat) => s + (catData[cat]?.[i]?.total || 0), 0)
    );
    const maxVal = Math.max(...totals, 1);

    const BAR_W = Math.max(18, Math.min(48, Math.floor(520 / labels.length) - 4));
    const H = 220;

    return (
      <div style={{ width: '100%', overflowX: 'auto', paddingBottom: 4 }} onClick={() => { setTooltip(t => ({ ...t, visible: false })); setSelectedOverviewIdx(null); }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: Math.max(2, Math.min(8, Math.floor(520 / labels.length) - BAR_W)), minWidth: labels.length * (BAR_W + 4), padding: '0 8px' }}>
          {labels.map((label, i) => {
            const dayTotal = totals[i];
            return (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: '0 0 auto' }}>
                {/* Stacked bar */}
                <div
                  style={{ width: BAR_W, height: H, display: 'flex', flexDirection: 'column-reverse', cursor: 'pointer', position: 'relative' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedOverviewIdx === i && tooltip.visible) {
                      setTooltip(t => ({ ...t, visible: false }));
                      setSelectedOverviewIdx(null);
                      return;
                    }
                    if (dayTotal === 0) return;
                    const items = activeCats
                      .filter(cat => (catData[cat]?.[i]?.total || 0) > 0)
                      .map(cat => ({
                        color: CAT_COLORS[cat]?.color || '#6366f1',
                        label: cat,
                        value: fmtD(catData[cat][i].total),
                        subItems: catData[cat][i].items
                          .sort((a, b) => b.amount - a.amount)
                          .slice(0, 5)
                          .map(it => ({ name: it.title, amt: fmtD(it.amount) }))
                      }));
                    setTooltip({
                      visible: true,
                      x: e.clientX,
                      y: e.clientY,
                      title: (timeRange === 'this_month' || timeRange === 'prev_year_same_month')
                        ? (isTestUser ? `Day ${label}` : `Week ${label.replace('W','')}`)
                        : label,
                      items,
                      total: fmtD(dayTotal),
                    });
                    setSelectedOverviewIdx(i);
                  }}>
                  {dayTotal === 0 ? (
                    <div style={{ width: '100%', height: 3, background: '#e2e8f0', borderRadius: 2, marginTop: 'auto' }} />
                  ) : (
                    activeCats.map((cat, ci) => {
                      const val = catData[cat]?.[i]?.total || 0;
                      if (val === 0) return null;
                      const pct = (val / maxVal) * 100;
                      const color = CAT_COLORS[cat]?.color || DONUT_COLORS[ci % DONUT_COLORS.length];
                      const isFirst = activeCats.findIndex(c => (catData[c]?.[i]?.total || 0) > 0) === ci;
                      const isLast  = [...activeCats].reverse().findIndex(c => (catData[c]?.[i]?.total || 0) > 0) === (activeCats.length - 1 - ci);
                      return (
                        <div
                          key={cat}
                          style={{
                            width: '100%',
                            height: `${(pct / 100) * H}px`,
                            background: color,
                            borderRadius: isLast ? '5px 5px 0 0' : isFirst ? '0 0 3px 3px' : 0,
                            opacity: 0.88,
                            transition: 'opacity 0.15s',
                            minHeight: val > 0 ? 3 : 0,
                          }}
                        />
                      );
                    })
                  )}
                </div>
                {/* Label */}
                <span style={{ fontSize: labels.length > 20 ? 9 : 10.5, color: '#94a3b8', fontWeight: 600, userSelect: 'none' }}>
                  {labels.length > 20 && parseInt(label) % 5 !== 0 ? '' : label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 14, paddingLeft: 8 }}>
          {activeCats.map((cat, ci) => (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 9, height: 9, borderRadius: 3, background: CAT_COLORS[cat]?.color || DONUT_COLORS[ci % DONUT_COLORS.length], flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600 }}>{cat}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ── Stable tooltip callback — doesn't change identity on re-render ──
  const handleCategoryTooltip = useCallback((data) => {
    if (!data) setTooltip(t => ({ ...t, visible: false }));
    else setTooltip(data);
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div id="notifBox" style={{position:'fixed',top:16,right:16,zIndex:9999}}/>
      <ChartTooltip tooltip={tooltip} />

      <nav className={`nav${navSolid?' nav--solid':''}${navHide?' nav--hide':''}`}>
        <div className="nav-in">
          <Link to="/" className="logo" onClick={()=>setActiveIdx(0)}>
            <div className="logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <span>ExpenseAI</span>
          </Link>
          <PillNav activeIdx={activeIdx} setActiveIdx={setActiveIdx}/>
          <div className="nav-r">
            {user ? (
              <div className="user-row">
                <Avatar user={user} size={34}/>
                <span className="uname">{user.first_name||user.full_name?.split(' ')[0]||'User'}</span>
                <button className="logout-btn" onClick={async()=>{if(onLogout) await onLogout();}}>Logout</button>
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

      <main className="main">
        <div className="page-hd">
          <div>
            <h1 className="page-title">Expense Dashboard</h1>
            <p className="page-sub">Track, analyse, and take control of your spending</p>
          </div>
          <button className="btn-add" onClick={openAdd}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Expense
          </button>
        </div>

        <div className="cards-row">
          <div className="scard scard--balance">
            <div className="scard-accent"/>
            <div className="scard-top">
              <div>
                <p className="scard-lbl">Left Balance</p>
                <p className="scard-val" style={{color:leftBalance<0?'#dc2626':'#15803d'}}>
                  {leftBalance<0?'-':''}{fmt(Math.abs(leftBalance))}
                </p>
              </div>
              <div className="scard-icon" style={{background:'#dcfce7',color:'#15803d'}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
                </svg>
              </div>
            </div>
            {monthlyBudget>0&&(
              <div className="scard-bar-wrap">
                <div className="scard-bar-track">
                  <div className="scard-bar-fill" style={{width:`${budgetUsedPct}%`,background:budgetUsedPct>85?'#ef4444':'#22c55e'}}/>
                </div>
                <span className="scard-bar-lbl">{budgetUsedPct.toFixed(0)}% of {fmt(monthlyBudget)} used</span>
              </div>
            )}
          </div>

          <div className="scard scard--expenses">
            <div className="scard-accent" style={{background:'linear-gradient(180deg,#fef2f2,transparent)'}}/>
            <div className="scard-top">
              <div>
                <p className="scard-lbl">Total Expenses</p>
                <p className="scard-val" style={{color:'#dc2626'}}>{fmt(totalExpenses)}</p>
              </div>
              <div className="scard-icon" style={{background:'#fee2e2',color:'#dc2626'}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="m8 12 4 4 4-4"/><path d="M12 8v8"/>
                </svg>
              </div>
            </div>
            <p className="scard-meta">{expenses.filter(e=>e.type==='expense').length} expense transaction{expenses.filter(e=>e.type==='expense').length!==1?'s':''}</p>
            <p className="scard-meta" style={{marginTop:2,color:'#ef4444',fontWeight:600}}>This month: {fmt(monthlyExp)}</p>
          </div>

          <div className="scard scard--budget">
            <div className="scard-accent" style={{background:'linear-gradient(180deg,#f5f3ff,transparent)'}}/>
            <div className="scard-top">
              <div>
                <p className="scard-lbl">Spending Limit</p>
                <p className="scard-val" style={{color:monthlyBudget>0?(budgetUsedPct>85?'#dc2626':'#7c3aed'):'#94a3b8'}}>
                  {monthlyBudget>0 ? `${budgetUsedPct.toFixed(0)}% used` : 'No budget set'}
                </p>
              </div>
              <div className="scard-icon" style={{background:'#ede9fe',color:'#7c3aed'}}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
                </svg>
              </div>
            </div>
            {monthlyBudget>0 ? (
              <div className="budget-chart-wrap">
                <div className="budget-bars">
                  <div className="budget-bar-row">
                    <span className="budget-bar-lbl">Spent</span>
                    <div className="budget-bar-track">
                      <div className="budget-bar-fill" style={{width:`${Math.min(budgetUsedPct,100)}%`,background:budgetUsedPct>85?'linear-gradient(90deg,#ef4444,#dc2626)':budgetUsedPct>60?'linear-gradient(90deg,#f59e0b,#ea580c)':'linear-gradient(90deg,#6366f1,#8b5cf6)'}}/>
                    </div>
                    <span className="budget-bar-val">{fmt(monthlyExp)}</span>
                  </div>
                  <div className="budget-bar-row">
                    <span className="budget-bar-lbl">Limit</span>
                    <div className="budget-bar-track" style={{background:'#e0e7ff'}}>
                      <div className="budget-bar-fill" style={{width:'100%',background:'linear-gradient(90deg,#a5b4fc,#c7d2fe)'}}/>
                    </div>
                    <span className="budget-bar-val">{fmt(monthlyBudget)}</span>
                  </div>
                </div>
                <p className="budget-remain" style={{color:leftBalance<0?'#dc2626':'#15803d'}}>
                  {leftBalance<0?`Over by ${fmt(Math.abs(leftBalance))}`:`${fmt(Math.abs(leftBalance))} remaining`}
                </p>
              </div>
            ) : (
              <p className="scard-meta" style={{marginTop:'0.5rem'}}><a href="/profile" style={{color:'#7c3aed',fontWeight:700,textDecoration:'none'}}>Set a budget →</a></p>
            )}
          </div>
        </div>

        <div className="body-grid">
          <aside className="sidebar">
            <div className="sidebar-card">
              <h3 className="sidebar-title">Top Categories</h3>
              <div className="cat-list">
                {topCatEntries.length===0&&<p className="empty-msg">No expenses yet</p>}
                {topCatEntries.slice(0,6).map(([cat,amt])=>{
                  const cc=CAT_COLORS[cat]||CAT_COLORS['Other'];
                  return (
                    <div key={cat} className="cat-row">
                      <div className="cat-ic" style={{background:cc.bg,color:cc.color}}><Icon name={CAT_ICONS[cat]||'circle'} size={15}/></div>
                      <div className="cat-info">
                        <span className="cat-name">{cat}</span>
                        <div className="cat-bar-track"><div className="cat-bar-fill" style={{width:`${topCatEntries[0]?Math.round((amt/topCatEntries[0][1])*100):0}%`,background:cc.color}}/></div>
                      </div>
                      <span className="cat-amt">{fmt(amt)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="sidebar-card" style={{marginTop:'1rem'}}>
              <h3 className="sidebar-title">Quick Stats</h3>
              <div className="qs-list">
                <div className="qs-row"><span className="qs-lbl">Total Transactions</span><span className="qs-val">{expenses.length}</span></div>
                <div className="qs-row"><span className="qs-lbl">Avg. Expense</span><span className="qs-val">{fmt(expenses.filter(e=>e.type==='expense').length>0?totalExpenses/expenses.filter(e=>e.type==='expense').length:0)}</span></div>
                <div className="qs-row"><span className="qs-lbl">Categories Used</span><span className="qs-val">{Object.keys(catTotals()).length}</span></div>
                <div className="qs-row"><span className="qs-lbl">Largest Expense</span><span className="qs-val">{fmt(expenses.filter(e=>e.type==='expense').reduce((m,e)=>san(e.amount)>m?san(e.amount):m,0))}</span></div>
                <div className="qs-row"><span className="qs-lbl">This Month</span><span className="qs-val" style={{color:'#ef4444'}}>{fmt(monthlyExp)}</span></div>
              </div>
            </div>
          </aside>

          <div className="right-area">
            {/* Chart toolbar */}
            <div className="chart-toolbar">
              <div className="chart-tabs">
                {[
                  {id:'overview', label:'📊 Overview'},
                  {id:'categories', label:'🍩 Categories'},
                  {id:'trends', label:'📈 Trends'},
                ].map(t=>(
                  <button key={t.id} className={`chart-tab${activeChart===t.id?' chart-tab--on':''}`} onClick={()=>setActiveChart(t.id)}>
                    {t.label}
                  </button>
                ))}
              </div>
              <div className="chart-controls">
                <select className="range-sel" value={timeRange} onChange={e=>{ setTimeRange(e.target.value); setTooltip(t => ({ ...t, visible: false })); setSelectedOverviewIdx(null); }}>
                  <option value="this_month">This Month</option>
                  <option value="prev_year_same_month">Prev Year Same Month</option>
                  <option value="past_3_months">Past 3 Months</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>

            {/* Chart card */}
            <div className="chart-card">
              <div className="chart-heading">
                {activeChart==='overview' && <><strong>Expense Overview</strong><span className='chart-sub'>Stacked by category by period � click a bar to see breakdown</span></>}
                {activeChart==='categories' && <><strong>Spending by Category</strong><span className='chart-sub'>Hover a slice to see individual items</span></>}
                {activeChart==='trends' && <><strong>Spending Trends</strong><span className='chart-sub'>Period expenses & cumulative spending</span></>}
              </div>
              <div className="chart-area" style={{ height: activeChart === 'overview' ? 'auto' : 260, minHeight: 260 }}>
                {activeChart === 'overview' && <OverviewChart />}
                {activeChart === 'categories' && <CategoryChart categoryData={categoryData} onTooltip={handleCategoryTooltip} />}
                {activeChart === 'trends' && <TrendChart trendData={trendData} hasExpenses={expenses.length > 0} />}
              </div>

              <div className="chart-summary">
                <div className="cs-box" style={{ background: '#fef2f2' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="m8 12 4 4 4-4"/><path d="M12 8v8"/></svg>
                    </div>
                    <p className="cs-lbl" style={{ color: '#dc2626' }}>Total Expenses</p>
                  </div>
                  <p className="cs-val" style={{ color: '#dc2626', fontSize: '1.3rem' }}>{fmt(totalExpenses)}</p>
                </div>
                <div className="cs-box" style={{ background: '#fff7ed' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    </div>
                    <p className="cs-lbl" style={{ color: '#ea580c' }}>This Month</p>
                  </div>
                  <p className="cs-val" style={{ color: '#ea580c', fontSize: '1.3rem' }}>{fmt(monthlyExp)}</p>
                </div>
                <div className="cs-box" style={{ background: '#eff6ff' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                    </div>
                    <p className="cs-lbl" style={{ color: '#2563eb' }}>Transactions</p>
                  </div>
                  <p className="cs-val" style={{ color: '#2563eb', fontSize: '1.3rem' }}>{expenses.length}</p>
                </div>
              </div>
            </div>

            {/* Transactions */}
            <div className="tx-card">
              <div className="tx-head">
                <h2 className="tx-title">Transactions</h2>
                <div className="tx-filters">
                  <div className="search-wrap">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{position:'absolute',left:11,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                    <input className="search-inp" placeholder="Search transactions…" value={search} onChange={e=>setSearch(e.target.value)}/>
                  </div>
                  <select className="range-sel" value={txRange} onChange={e=>setTxRange(e.target.value)}>
                    <option value="this_month">This Month</option>
                    <option value="last_month">Last Month</option>
                    <option value="past_3_months">Past 3 Months</option>
                    <option value="all">All</option>
                  </select>
                  <select className="range-sel" value={filterCat} onChange={e=>setFilterCat(e.target.value)}>
                    <option value="All">All categories</option>
                    {CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                  <button className="btn-add btn-add--sm" onClick={openAdd}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add
                  </button>
                </div>
              </div>
              <div className="tx-list">
                {loading&&[...Array(5)].map((_,i)=>(
                  <div key={i} className="tx-row">
                    <div className="skel" style={{width:38,height:38,borderRadius:11,flexShrink:0}}/>
                    <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
                      <div className="skel" style={{width:`${55+i*8}%`,height:13,borderRadius:6}}/>
                      <div className="skel" style={{width:'38%',height:10,borderRadius:6}}/>
                    </div>
                    <div className="skel" style={{width:70,height:16,borderRadius:6}}/>
                  </div>
                ))}
                {!loading&&displayList.length===0&&(
                  <div className="tx-empty">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9 9h.01M15 9h.01M9 15h6"/></svg>
                    <p>No transactions yet. Add your first expense!</p>
                  </div>
                )}
                {displayList.map(entry => {
                  if(entry.isGroup) {
                    const g=entry;
                    const groupTotal=g.items.reduce((s,e)=>s+san(e.amount),0);
                    const isExpanded=expandedGroups[g.groupId];
                    const dp=parseDateParts(g.date); const d=dp?new Date(dp.y,dp.m,dp.d):new Date();
                    const dateStr=d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:d.getFullYear()!==cy?'numeric':undefined});
                    const taxItem=g.items.find(e=>e.isTax), taxVal=taxItem?san(taxItem.amount):0;
                    const itemCount=g.items.filter(e=>!e.isTax).length;
                    return (
                      <div key={g.groupId} className="receipt-group">
                        <div className="rg-header" onClick={()=>setExpandedGroups(p=>({...p,[g.groupId]:!isExpanded}))}>
                          <div className="rg-ic">🧾</div>
                          <div className="rg-info">
                            <p className="rg-name">{g.merchant}</p>
                            <p className="rg-meta"><span className="rg-badge">Receipt</span>{itemCount} item{itemCount!==1?'s':''}{taxVal>0?' + tax':''} · {dateStr}</p>
                          </div>
                          <div className="rg-right">
                            <p className="rg-total">-{fmtD(groupTotal)}</p>
                            <div className={`rg-chevron${isExpanded?' rg-chevron--up':''}`}>
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                            </div>
                          </div>
                          <div className="tx-actions">
                            <button className="tx-btn tx-btn--del" onClick={e=>{e.stopPropagation();handleDeleteGroup(g.groupId)}}><Icon name="trash-2" size={13}/></button>
                          </div>
                        </div>
                        {isExpanded&&(
                          <div className="rg-items">
                            {g.items.map(e=>{
                              const cc=CAT_COLORS[e.category]||CAT_COLORS['Other'];
                              return (
                                <div key={e.id} className={`rg-item${e.isTax?' rg-item--tax':''}`}>
                                  <div className="rg-item-dot" style={{background:cc.color}}/>
                                  <div className="rg-item-info">
                                    <span className="rg-item-name">{e.title}</span>
                                    {!e.isTax&&<span className="rg-item-cat" style={{color:cc.color}}>{e.category}</span>}
                                  </div>
                                  <span className="rg-item-amt" style={{color:e.isTax?'#b45309':'#dc2626'}}>-{fmtD(san(e.amount))}</span>
                                  <button className="tx-btn tx-btn--del" style={{opacity:0.6}} onClick={()=>handleDelete(e.id)}><Icon name="trash-2" size={11}/></button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }
                  const e=entry;
                  const cc=CAT_COLORS[e.category]||CAT_COLORS['Other'];
                  const dp=parseDateParts(e.date); const d=dp?new Date(dp.y,dp.m,dp.d):new Date();
                  const dateStr=d.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:d.getFullYear()!==cy?'numeric':undefined});
                  return (
                    <div key={e.id} className="tx-row">
                      <div className="tx-ic" style={{background:cc.bg,color:cc.color}}><Icon name={CAT_ICONS[e.category]||'circle'} size={16}/></div>
                      <div className="tx-info">
                        <p className="tx-name">{e.title||e.category}</p>
                        <p className="tx-meta"><span className="tx-cat-dot" style={{background:cc.color}}/>{e.category} · {dateStr}</p>
                      </div>
                      <p className="tx-amt" style={{color:e.type==='income'?'#15803d':'#dc2626'}}>{e.type==='income'?'+':'-'}{fmtD(san(e.amount))}</p>
                      <div className="tx-actions">
                        <button className="tx-btn" onClick={()=>openEdit(e.id)}><Icon name="edit-2" size={13}/></button>
                        <button className="tx-btn tx-btn--del" onClick={()=>handleDelete(e.id)}><Icon name="trash-2" size={13}/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </main>

      {modalOpen&&(
        <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget){setModalOpen(false);resetModal();}}}>
          <div className="modal-box">
            <div className="modal-hd">
              <div className="modal-hd-left">
                <h3>{editingExp?'Edit Transaction':'New Transaction'}</h3>
                {!editingExp&&(
                  <div className="mode-pills">
                    <button className={`mode-pill${modalMode==='manual'?' mode-pill--on':''}`} onClick={()=>{setModalMode('manual');setReceiptFile(null);setReceiptPreview(null);setAnalyzedData(null);setItemsExpanded(false);setTaxPct('');}}>✏️ Manual</button>
                    <button className={`mode-pill${modalMode==='receipt'?' mode-pill--on':''}`} onClick={()=>{setModalMode('receipt');setTimeout(()=>fileInputRef.current?.click(),50);}}>📷 Scan Receipt</button>
                  </div>
                )}
              </div>
              <button className="modal-close" onClick={()=>{setModalOpen(false);resetModal();}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>

            {modalMode==='receipt'&&!editingExp&&(
              <div className="receipt-body">
                <input ref={fileInputRef} type="file" accept="image/*,application/pdf" style={{display:'none'}} onChange={handleReceiptSelect}/>
                {!receiptFile&&(
                  <div className="drop-zone" onClick={()=>fileInputRef.current?.click()}>
                    <div className="drop-icon"><span style={{fontSize:32}}>📷</span></div>
                    <p className="drop-title">Upload your receipt</p>
                    <p className="drop-sub">Click to browse · JPG, PNG or PDF</p>
                    <span className="drop-btn">Choose File</span>
                  </div>
                )}
                {receiptFile&&(
                  <div className="receipt-preview-wrap">
                    {receiptPreview&&<div className="receipt-strip"><img src={receiptPreview} alt="Receipt" className="receipt-strip-img"/><div className="receipt-strip-info"><span className="receipt-strip-name">{receiptFile.name}</span><button className="receipt-change" onClick={()=>fileInputRef.current?.click()}>Change</button></div></div>}
                    {!receiptPreview&&<div className="pdf-placeholder"><span>📄</span><span>{receiptFile.name}</span><button className="receipt-change" onClick={()=>fileInputRef.current?.click()}>Change</button></div>}
                    {analyzing&&<div className="analyzing-state"><div className="ai-spinner"><div className="ai-ring"/></div><p className="analyzing-text">AI is reading your receipt…</p></div>}
                    {!analyzing&&analyzedData&&analyzedData.items&&(
                      <div className="receipt-result-wrap">
                        <div className={`receipt-summary-card${itemsExpanded?' receipt-summary-card--open':''}`} onClick={()=>setItemsExpanded(p=>!p)}>
                          <div className="rsc-left">
                            <div className="rsc-icon">🧾</div>
                            <div className="rsc-meta">
                              <span className="rsc-merchant">{analyzedData.merchant||'Receipt'}</span>
                              <span className="rsc-date">{analyzedData.date} · {(analyzedData.items||[]).length} items</span>
                            </div>
                          </div>
                          <div className="rsc-right">
                            <div className="rsc-total-wrap">
                              <span className="rsc-total-lbl">Receipt Total</span>
                              <span className="rsc-total-amt">₹{parseFloat(analyzedData.total||0).toFixed(2)}</span>
                            </div>
                            <div className="rsc-toggle-hint">{itemsExpanded?'Hide':'Show'} details <div className={`rsc-chevron${itemsExpanded?' rsc-chevron--up':''}`}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg></div></div>
                          </div>
                        </div>
                        <div className={`items-panel${itemsExpanded?' items-panel--open':''}`}>
                          <div className="items-panel-controls">
                            <span className="items-panel-hint">Select items to add</span>
                            <div className="items-ctrl-group">
                              <button className="items-ctrl-btn" onClick={e=>{e.stopPropagation();const all={};analyzedData.items.forEach((_,i)=>{all[i]=true;});setSelectedItems(all);}}>All</button>
                              <button className="items-ctrl-btn" onClick={e=>{e.stopPropagation();setSelectedItems({});}}>None</button>
                            </div>
                          </div>
                          <div className="items-list">
                            {(analyzedData.items||[]).map((item,i)=>{
                              const cc=CAT_COLORS[item.category]||CAT_COLORS['Other'],isChecked=selectedItems[i]??true;
                              return (
                                <div key={i} className={`item-row${isChecked?' item-row--checked':''}`} onClick={e=>{e.stopPropagation();setSelectedItems(p=>({...p,[i]:!isChecked}));}}>
                                  <div className={`item-check${isChecked?' item-check--on':''}`}>{isChecked&&<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}</div>
                                  <div className="item-cat-dot" style={{background:cc.color}}/>
                                  <div className="item-info"><span className="item-name">{item.name}</span><span className="item-cat" style={{color:cc.color}}>{item.category}</span></div>
                                  <span className="item-amt">₹{parseFloat(item.amount||0).toFixed(2)}</span>
                                </div>
                              );
                            })}
                          </div>
                          <div className="tax-row">
                            <div className="tax-left">
                              <label className="tax-lbl">Add Tax</label>
                              <div className="tax-input-wrap">
                                <input className="tax-inp" type="number" min="0" max="100" step="0.5" placeholder="0" value={taxPct} onChange={e=>setTaxPct(e.target.value)} onClick={e=>e.stopPropagation()}/>
                                <span className="tax-pct-symbol">%</span>
                              </div>
                            </div>
                            {taxRate>0&&(
                              <div className="tax-breakdown">
                                <span className="tax-bd-row"><span>Subtotal ({selectedCount} items)</span><span>₹{itemsSubtotal.toFixed(2)}</span></span>
                                <span className="tax-bd-row tax-bd-row--tax"><span>Tax ({taxRate}%)</span><span>+₹{taxAmount.toFixed(2)}</span></span>
                              </div>
                            )}
                          </div>
                          <div className="items-grand-total">
                            <span className="igt-count">{selectedCount} of {(analyzedData.items||[]).length} selected</span>
                            <div className="igt-right">
                              <span className="igt-lbl">{taxRate>0?'Grand Total':'Selected Total'}</span>
                              <span className="igt-val">₹{grandTotal.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                    {!analyzing&&!analyzedData&&receiptFile&&(
                      <div className="retry-state"><p>Analysis failed.</p><button className="retry-btn" onClick={()=>analyzeReceipt(receiptFile)}>Try again</button></div>
                    )}
                  </div>
                )}
                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={()=>{setModalOpen(false);resetModal();}}>Cancel</button>
                  <button type="button" className="btn-save" disabled={!analyzedData||analyzing||selectedCount===0} onClick={confirmReceiptAdd} style={{opacity:(!analyzedData||analyzing||selectedCount===0)?0.5:1}}>
                    {analyzing?'Analyzing…':`Add ${selectedCount>0?selectedCount+' Item'+(selectedCount>1?'s':''):'Items'} — ₹${grandTotal.toFixed(2)}`}
                  </button>
                </div>
              </div>
            )}

            {(modalMode==='manual'||editingExp)&&(
              <form onSubmit={handleSubmit} className="modal-form">
                <div className="mf-field"><label>Title</label><input ref={titleRef} required placeholder="e.g. Lunch at Café" className="mf-inp"/></div>
                <div className="mf-row">
                  <div className="mf-field"><label>Amount (₹)</label><input ref={amountRef} type="number" step="0.01" min="0" required placeholder="0.00" className="mf-inp"/></div>
                  <div className="mf-field"><label>Date</label><input ref={dateRef} type="date" required className="mf-inp"/></div>
                </div>
                <div className="mf-field"><label>Category</label><select ref={categoryRef} className="mf-inp">{CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
                <div className="modal-footer">
                  {editingExp&&<button type="button" className="btn-del" onClick={handleDeleteInModal}><Icon name="trash-2" size={14}/>Delete</button>}
                  <button type="button" className="btn-cancel" onClick={()=>{setModalOpen(false);resetModal();}}>Cancel</button>
                  <button type="submit" className="btn-save">{editingExp?'Update':'Add Transaction'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#f0f2f7;color:#1e293b;overflow-x:hidden;}

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

.main{max-width:1280px;margin:0 auto;padding:90px 2rem 3rem;}
.page-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:1.8rem;}
.page-title{font-size:2rem;font-weight:800;color:#1e293b;letter-spacing:-0.03em;}
.page-sub{font-size:0.87rem;color:#94a3b8;margin-top:3px;font-weight:500;}
.btn-add{display:inline-flex;align-items:center;gap:0.45rem;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;padding:0.62rem 1.3rem;border-radius:9999px;font-size:0.88rem;font-weight:700;cursor:pointer;box-shadow:0 4px 16px rgba(99,102,241,0.3);transition:all 0.22s;font-family:inherit;}
.btn-add:hover{transform:translateY(-2px);box-shadow:0 8px 24px rgba(99,102,241,0.42);}
.btn-add--sm{padding:0.44rem 0.9rem;font-size:0.82rem;}

.cards-row{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.6rem;}
.scard{background:white;border-radius:20px;padding:1.5rem 1.4rem;border:1.5px solid #e8edf5;box-shadow:0 2px 8px rgba(0,0,0,0.04);transition:all 0.22s;animation:fadeUp 0.5s cubic-bezier(0.2,0.9,0.1,1) both;position:relative;overflow:hidden;}
.scard:hover{transform:translateY(-3px);box-shadow:0 10px 28px rgba(0,0,0,0.08);}
.scard-accent{position:absolute;top:0;left:0;right:0;height:80px;background:linear-gradient(180deg,#f0fdf4,transparent);pointer-events:none;}
@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
.scard-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:0.8rem;position:relative;}
.scard-lbl{font-size:0.74rem;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.07em;margin-bottom:6px;}
.scard-val{font-size:1.75rem;font-weight:800;letter-spacing:-0.02em;color:#1e293b;line-height:1.1;}
.scard-meta{font-size:0.78rem;color:#94a3b8;font-weight:500;position:relative;}
.scard-icon{width:46px;height:46px;border-radius:14px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.scard-bar-wrap{display:flex;flex-direction:column;gap:4px;margin-top:0.6rem;position:relative;}
.scard-bar-track{height:5px;background:#f1f5f9;border-radius:99px;overflow:hidden;}
.scard-bar-fill{height:100%;border-radius:99px;transition:width 0.8s cubic-bezier(0.2,0.9,0.1,1);}
.scard-bar-lbl{font-size:0.72rem;color:#94a3b8;font-weight:600;}

.body-grid{display:grid;grid-template-columns:240px 1fr;gap:1.2rem;}
.sidebar-card{background:white;border:1.5px solid #e8edf5;border-radius:18px;padding:1.2rem;box-shadow:0 2px 8px rgba(0,0,0,0.04);}
.sidebar-title{font-size:0.74rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:0.9rem;}
.empty-msg{font-size:0.82rem;color:#cbd5e1;text-align:center;padding:0.6rem 0;}
.cat-list{display:flex;flex-direction:column;gap:0.6rem;}
.cat-row{display:flex;align-items:center;gap:0.6rem;}
.cat-ic{width:32px;height:32px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.cat-info{flex:1;min-width:0;}
.cat-name{font-size:0.82rem;font-weight:600;color:#334155;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:3px;}
.cat-bar-track{height:4px;background:#f1f5f9;border-radius:99px;overflow:hidden;}
.cat-bar-fill{height:100%;border-radius:99px;transition:width 0.7s cubic-bezier(0.2,0.9,0.1,1);}
.cat-amt{font-size:0.82rem;font-weight:700;color:#1e293b;flex-shrink:0;}
.qs-list{display:flex;flex-direction:column;gap:0.5rem;}
.qs-row{display:flex;justify-content:space-between;align-items:center;padding:0.45rem 0;border-bottom:1px solid #f8fafc;}
.qs-row:last-child{border:none;}
.qs-lbl{font-size:0.76rem;color:#94a3b8;font-weight:500;}
.qs-val{font-size:0.82rem;font-weight:700;color:#1e293b;}

.right-area{display:flex;flex-direction:column;gap:1rem;min-width:0;}
.chart-toolbar{background:white;border:1.5px solid #e8edf5;border-radius:16px;padding:0.8rem 1rem;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.6rem;box-shadow:0 2px 8px rgba(0,0,0,0.04);}
.chart-tabs{display:flex;gap:0.3rem;}
.chart-tab{padding:0.4rem 1rem;border-radius:9px;font-size:0.84rem;font-weight:600;border:none;background:transparent;color:#94a3b8;cursor:pointer;transition:all 0.18s;font-family:inherit;}
.chart-tab--on{background:#eef2ff;color:#4338ca;}
.chart-tab:hover:not(.chart-tab--on){background:#f8fafc;color:#475569;}
.chart-controls{display:flex;align-items:center;gap:0.5rem;}
.range-sel{font-size:0.82rem;font-weight:600;color:#475569;background:white;border:1.5px solid #e2e8f0;border-radius:8px;padding:0.3rem 0.6rem;cursor:pointer;transition:border-color 0.18s;font-family:inherit;outline:none;}
.range-sel:focus{border-color:#a5b4fc;}

.chart-card{background:white;border:1.5px solid #e8edf5;border-radius:18px;padding:1.4rem;box-shadow:0 2px 8px rgba(0,0,0,0.04);}
.chart-heading{display:flex;align-items:baseline;gap:0.6rem;margin-bottom:1rem;}
.chart-heading strong{font-size:0.96rem;font-weight:800;color:#1e293b;}
.chart-sub{font-size:0.74rem;color:#94a3b8;font-weight:500;}
.chart-area{position:relative;margin-bottom:1.2rem;}
.chart-area canvas{width:100%!important;height:100%!important;}
.chart-empty{height:260px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0.7rem;color:#94a3b8;}
.chart-empty span{font-size:2.5rem;}
.chart-empty p{font-size:0.84rem;font-weight:500;text-align:center;line-height:1.5;}
.chart-summary{display:grid;grid-template-columns:repeat(3,1fr);gap:0.7rem;}

.cs-box{border-radius:16px;padding:1rem 1.2rem;transition:transform 0.2s ease,box-shadow 0.2s ease;}
.cs-box:hover{transform:translateY(-2px);box-shadow:0 8px 20px rgba(0,0,0,0.06);}
.cs-lbl{font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;opacity:0.7;margin-bottom:3px;}
.cs-val{font-size:1.1rem;font-weight:800;letter-spacing:-0.02em;}

.tx-card{background:white;border:1.5px solid #e8edf5;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);}
.tx-head{padding:1rem 1.2rem;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:0.6rem;}
.tx-title{font-size:1.05rem;font-weight:800;color:#1e293b;}
.tx-filters{display:flex;align-items:center;gap:0.5rem;}
.search-wrap{position:relative;}
.search-inp{padding:0.34rem 0.7rem 0.34rem 2rem;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.82rem;font-weight:500;color:#1e293b;background:white;transition:border-color 0.18s;width:180px;outline:none;font-family:inherit;}
.search-inp:focus{border-color:#a5b4fc;}
.search-inp::placeholder{color:#cbd5e1;}
.tx-list{max-height:480px;overflow-y:auto;}
.tx-list::-webkit-scrollbar{width:4px;}
.tx-list::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.15);border-radius:99px;}
.tx-empty{display:flex;flex-direction:column;align-items:center;gap:0.6rem;padding:3rem;color:#94a3b8;font-size:0.86rem;font-weight:500;}
.tx-row{display:flex;align-items:center;gap:0.9rem;padding:0.85rem 1.2rem;border-bottom:1px solid #f8fafc;transition:background 0.14s;}
.tx-row:last-child{border-bottom:none;}
.tx-row:hover{background:#fafbff;}
.tx-row:hover .tx-actions{opacity:1;}
.tx-ic{width:38px;height:38px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.tx-info{flex:1;min-width:0;}
.tx-name{font-size:0.88rem;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.tx-cat-dot{display:inline-block;width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-right:2px;}
.tx-meta{font-size:0.73rem;color:#94a3b8;font-weight:500;margin-top:2px;display:flex;align-items:center;gap:3px;}
.tx-amt{font-size:0.95rem;font-weight:800;letter-spacing:-0.01em;flex-shrink:0;}
.tx-actions{display:flex;gap:0.28rem;opacity:0;transition:opacity 0.14s;}
.tx-btn{width:28px;height:28px;border-radius:7px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#94a3b8;transition:all 0.16s;}
.tx-btn:hover{background:#eef2ff;color:#6366f1;}
.tx-btn--del:hover{background:#fef2f2;color:#ef4444;}

.receipt-group{border-bottom:1px solid #f1f5f9;}
.receipt-group:last-child{border-bottom:none;}
.rg-header{display:flex;align-items:center;gap:0.9rem;padding:0.9rem 1.2rem;cursor:pointer;transition:background 0.14s;position:relative;}
.rg-header:hover{background:#fafbff;}
.rg-header:hover .tx-actions{opacity:1;}
.rg-ic{font-size:1.6rem;line-height:1;flex-shrink:0;width:38px;height:38px;display:flex;align-items:center;justify-content:center;background:#f0f4ff;border-radius:11px;}
.rg-info{flex:1;min-width:0;}
.rg-name{font-size:0.9rem;font-weight:700;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rg-meta{font-size:0.73rem;color:#94a3b8;margin-top:2px;display:flex;align-items:center;gap:0.35rem;}
.rg-badge{background:#eef2ff;color:#6366f1;font-size:0.65rem;font-weight:700;padding:0.1rem 0.45rem;border-radius:99px;text-transform:uppercase;letter-spacing:0.06em;}
.rg-right{display:flex;align-items:center;gap:0.6rem;flex-shrink:0;}
.rg-total{font-size:0.98rem;font-weight:800;color:#dc2626;}
.rg-chevron{display:flex;align-items:center;color:#94a3b8;transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1);}
.rg-chevron--up{transform:rotate(180deg);}
.rg-items{background:#fafbff;border-top:1px solid #f1f5f9;animation:expandDown 0.25s ease;}
@keyframes expandDown{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}
.rg-item{display:flex;align-items:center;gap:0.7rem;padding:0.55rem 1.2rem 0.55rem 3.8rem;border-bottom:1px solid #f1f5f9;transition:background 0.12s;}
.rg-item:last-child{border-bottom:none;}
.rg-item:hover{background:#f0f4ff;}
.rg-item--tax{background:#fffbeb;}
.rg-item-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.rg-item-info{flex:1;min-width:0;display:flex;align-items:center;gap:0.5rem;}
.rg-item-name{font-size:0.82rem;font-weight:600;color:#334155;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.rg-item-cat{font-size:0.69rem;font-weight:700;opacity:0.75;flex-shrink:0;}
.rg-item-amt{font-size:0.84rem;font-weight:700;flex-shrink:0;}

.modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,0.45);z-index:999;display:flex;align-items:center;justify-content:center;padding:1rem;backdrop-filter:blur(8px);animation:fadeIn .2s;}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
.modal-box{background:white;border-radius:24px;width:100%;max-width:460px;max-height:90vh;overflow-y:auto;box-shadow:0 32px 80px rgba(0,0,0,0.16);animation:scaleIn .22s cubic-bezier(0.34,1.56,0.64,1);}
.modal-box::-webkit-scrollbar{width:3px;}
.modal-box::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.15);border-radius:99px;}
@keyframes scaleIn{from{opacity:0;transform:scale(0.93)}to{opacity:1;transform:scale(1)}}
.modal-hd{padding:1.3rem 1.5rem 0;display:flex;align-items:flex-start;justify-content:space-between;gap:0.8rem;}
.modal-hd-left{display:flex;flex-direction:column;gap:0.7rem;}
.modal-hd h3{font-size:1.15rem;font-weight:800;color:#1e293b;}
.modal-close{width:32px;height:32px;border-radius:8px;border:none;background:#f8fafc;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b;transition:all 0.16s;flex-shrink:0;margin-top:2px;}
.modal-close:hover{background:#fee2e2;color:#ef4444;}
.mode-pills{display:flex;gap:0.3rem;background:#f8fafc;padding:0.25rem;border-radius:10px;width:fit-content;border:1px solid #e2e8f0;}
.mode-pill{display:inline-flex;align-items:center;gap:0.35rem;padding:0.32rem 0.8rem;border-radius:7px;border:none;background:transparent;color:#64748b;font-size:0.78rem;font-weight:600;cursor:pointer;transition:all 0.18s;font-family:inherit;}
.mode-pill--on{background:white;color:#6366f1;box-shadow:0 1px 4px rgba(99,102,241,0.18);}
.modal-form{padding:1.2rem 1.5rem 1.5rem;}
.mf-field{display:flex;flex-direction:column;gap:5px;margin-bottom:0.9rem;}
.mf-row{display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;}
.mf-field label{font-size:0.73rem;font-weight:700;color:#475569;text-transform:uppercase;letter-spacing:0.07em;}
.mf-inp{height:42px;padding:0 12px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:0.9rem;font-weight:500;color:#1e293b;background:#fafbff;transition:border-color 0.18s,box-shadow 0.18s;outline:none;font-family:inherit;width:100%;}
.mf-inp:focus{border-color:#a5b4fc;box-shadow:0 0 0 3px rgba(99,102,241,0.08);background:white;}
.mf-inp::placeholder{color:#cbd5e1;}
.modal-footer{display:flex;align-items:center;gap:0.6rem;justify-content:flex-end;margin-top:1.2rem;padding-top:1rem;border-top:1px solid #f1f5f9;}
.btn-del{display:inline-flex;align-items:center;gap:0.4rem;background:#fef2f2;color:#dc2626;border:none;padding:0.52rem 0.9rem;border-radius:9px;font-size:0.84rem;font-weight:700;cursor:pointer;transition:all 0.18s;font-family:inherit;margin-right:auto;}
.btn-del:hover{background:#fee2e2;}
.btn-cancel{background:#f8fafc;color:#64748b;border:1.5px solid #e2e8f0;padding:0.52rem 1rem;border-radius:9px;font-size:0.84rem;font-weight:600;cursor:pointer;transition:all 0.18s;font-family:inherit;}
.btn-save{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;padding:0.52rem 1.2rem;border-radius:9px;font-size:0.84rem;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(99,102,241,0.28);transition:all 0.18s;font-family:inherit;}
.btn-save:hover{transform:translateY(-1px);box-shadow:0 6px 18px rgba(99,102,241,0.38);}

.receipt-body{padding:1rem 1.5rem 1.5rem;display:flex;flex-direction:column;gap:1rem;}
.drop-zone{border:2px dashed #c7d2fe;border-radius:16px;padding:2.2rem 1.5rem;display:flex;flex-direction:column;align-items:center;gap:0.6rem;cursor:pointer;transition:all 0.2s;background:#fafbff;}
.drop-zone:hover{border-color:#6366f1;background:#eef2ff;}
.drop-icon{margin-bottom:0.3rem;}
.drop-title{font-size:0.96rem;font-weight:700;color:#1e293b;}
.drop-sub{font-size:0.78rem;color:#94a3b8;font-weight:500;}
.drop-btn{margin-top:0.4rem;padding:0.38rem 1rem;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border-radius:8px;font-size:0.8rem;font-weight:700;}
.receipt-preview-wrap{display:flex;flex-direction:column;gap:0.9rem;}
.receipt-strip{display:flex;align-items:center;gap:0.8rem;padding:0.6rem;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;}
.receipt-strip-img{width:52px;height:52px;object-fit:cover;border-radius:8px;flex-shrink:0;border:1px solid #e2e8f0;}
.receipt-strip-info{flex:1;min-width:0;display:flex;align-items:center;justify-content:space-between;gap:0.5rem;}
.receipt-strip-name{font-size:0.78rem;font-weight:600;color:#475569;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:200px;}
.receipt-change{display:inline-flex;padding:0.26rem 0.65rem;background:white;border:1.5px solid #e2e8f0;border-radius:7px;font-size:0.74rem;font-weight:700;color:#475569;cursor:pointer;font-family:inherit;}
.pdf-placeholder{display:flex;align-items:center;gap:0.7rem;padding:1rem 1.2rem;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;}
.pdf-placeholder span{font-size:0.84rem;font-weight:600;color:#475569;flex:1;}
.analyzing-state{display:flex;flex-direction:column;align-items:center;gap:0.7rem;padding:1.4rem;background:linear-gradient(135deg,#eef2ff,#f5f3ff);border-radius:14px;}
.ai-spinner{position:relative;width:48px;height:48px;}
.ai-ring{position:absolute;inset:0;border-radius:50%;border:3px solid transparent;border-top-color:#6366f1;border-right-color:#8b5cf6;animation:spin 0.9s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}
.analyzing-text{font-size:0.85rem;font-weight:600;color:#4338ca;}
.receipt-result-wrap{display:flex;flex-direction:column;border:1.5px solid #e2e8f0;border-radius:14px;overflow:hidden;}
.receipt-summary-card{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:0.95rem 1rem;background:linear-gradient(135deg,#eef2ff,#f5f3ff);cursor:pointer;user-select:none;}
.receipt-summary-card:hover{background:linear-gradient(135deg,#e0e7ff,#ede9fe);}
.receipt-summary-card--open{border-bottom:1.5px solid #c7d2fe;}
.rsc-left{display:flex;align-items:center;gap:0.7rem;min-width:0;}
.rsc-icon{font-size:1.5rem;flex-shrink:0;}
.rsc-meta{display:flex;flex-direction:column;gap:2px;min-width:0;}
.rsc-merchant{font-size:1.02rem;font-weight:800;color:#1e1b4b;}
.rsc-date{font-size:0.71rem;color:#6366f1;font-weight:600;opacity:0.8;}
.rsc-right{display:flex;align-items:center;gap:0.55rem;flex-shrink:0;}
.rsc-total-wrap{display:flex;flex-direction:column;align-items:flex-end;gap:1px;}
.rsc-total-lbl{font-size:0.65rem;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.06em;}
.rsc-total-amt{font-size:1.1rem;font-weight:800;color:#4338ca;}
.rsc-toggle-hint{display:inline-flex;align-items:center;gap:0.3rem;font-size:0.72rem;font-weight:700;color:#6366f1;background:rgba(99,102,241,0.1);padding:0.25rem 0.6rem;border-radius:99px;white-space:nowrap;}
.rsc-chevron{display:flex;transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1);}
.rsc-chevron--up{transform:rotate(180deg);}
.items-panel{max-height:0;overflow:hidden;transition:max-height 0.4s cubic-bezier(0.4,0,0.2,1);}
.items-panel--open{max-height:700px;}
.items-panel-controls{display:flex;align-items:center;justify-content:space-between;padding:0.6rem 1rem;background:#fafbff;border-bottom:1px solid #f1f5f9;}
.items-panel-hint{font-size:0.73rem;font-weight:600;color:#94a3b8;}
.items-ctrl-group{display:flex;gap:0.3rem;}
.items-ctrl-btn{padding:0.22rem 0.65rem;border-radius:6px;border:1.5px solid #c7d2fe;background:white;color:#6366f1;font-size:0.72rem;font-weight:700;cursor:pointer;font-family:inherit;}
.items-list{overflow-y:auto;max-height:200px;}
.item-row{display:flex;align-items:center;gap:0.65rem;padding:0.6rem 1rem;cursor:pointer;transition:background 0.14s;border-bottom:1px solid #f1f5f9;user-select:none;}
.item-row:last-child{border-bottom:none;}
.item-row:hover{background:#f8fafc;}
.item-check{width:18px;height:18px;border-radius:5px;border:2px solid #c7d2fe;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all 0.18s;}
.item-check--on{background:linear-gradient(135deg,#6366f1,#8b5cf6);border-color:transparent;}
.item-cat-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;}
.item-info{flex:1;min-width:0;}
.item-name{display:block;font-size:0.84rem;font-weight:600;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.item-cat{display:block;font-size:0.68rem;font-weight:700;margin-top:1px;opacity:0.8;}
.item-amt{font-size:0.88rem;font-weight:800;color:#1e293b;flex-shrink:0;}
.tax-row{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:0.75rem 1rem;background:#fffbeb;border-top:1.5px dashed #fde68a;}
.tax-left{display:flex;align-items:center;gap:0.6rem;}
.tax-lbl{font-size:0.78rem;font-weight:700;color:#92400e;white-space:nowrap;}
.tax-input-wrap{position:relative;display:flex;align-items:center;}
.tax-inp{width:60px;height:32px;padding:0 22px 0 10px;border:1.5px solid #fcd34d;border-radius:8px;font-size:0.88rem;font-weight:700;color:#92400e;background:white;outline:none;font-family:inherit;text-align:center;}
.tax-pct-symbol{position:absolute;right:7px;font-size:0.8rem;font-weight:700;color:#92400e;pointer-events:none;}
.tax-breakdown{display:flex;flex-direction:column;gap:3px;align-items:flex-end;}
.tax-bd-row{display:flex;gap:1.2rem;font-size:0.73rem;font-weight:600;color:#78350f;}
.tax-bd-row--tax{color:#b45309;font-weight:700;}
.items-grand-total{display:flex;align-items:center;justify-content:space-between;padding:0.7rem 1rem;background:linear-gradient(135deg,#eef2ff,#f5f3ff);border-top:1.5px solid #e2e8f0;}
.igt-count{font-size:0.74rem;font-weight:600;color:#94a3b8;}
.igt-right{display:flex;align-items:center;gap:0.5rem;}
.igt-lbl{font-size:0.74rem;font-weight:700;color:#6366f1;}
.igt-val{font-size:1.05rem;font-weight:800;color:#4338ca;}
.retry-state{display:flex;align-items:center;justify-content:space-between;padding:0.9rem;background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;}
.retry-btn{padding:0.3rem 0.8rem;background:#dc2626;color:white;border:none;border-radius:7px;font-size:0.78rem;font-weight:700;cursor:pointer;font-family:inherit;}

.skel{background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

.budget-chart-wrap{margin-top:0.7rem;}
.budget-bars{display:flex;flex-direction:column;gap:0.55rem;}
.budget-bar-row{display:flex;align-items:center;gap:0.5rem;}
.budget-bar-lbl{font-size:0.68rem;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;width:32px;flex-shrink:0;}
.budget-bar-track{flex:1;height:8px;background:#f1f5f9;border-radius:99px;overflow:hidden;}
.budget-bar-fill{height:100%;border-radius:99px;transition:width 0.9s cubic-bezier(0.2,0.9,0.1,1);}
.budget-bar-val{font-size:0.72rem;font-weight:700;color:#475569;width:52px;text-align:right;flex-shrink:0;}
.budget-remain{font-size:0.74rem;font-weight:700;margin-top:0.6rem;}
@keyframes slideN{from{opacity:0;transform:translateX(40px)}to{opacity:1;transform:translateX(0)}}
@media(max-width:900px){.body-grid{grid-template-columns:1fr;}}
@media(max-width:640px){.pill-nav{display:none;}.cards-row{grid-template-columns:1fr;}.chart-summary{grid-template-columns:repeat(2,1fr);}.main{padding:80px 1rem 2rem;}.page-hd{flex-wrap:wrap;}.tx-filters{flex-wrap:wrap;}}
`;







