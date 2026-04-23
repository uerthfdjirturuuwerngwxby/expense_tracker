import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE } from './apiBase';

const NAV_LINKS = [
  { label: 'Home', to: '/' },
  { label: 'Expenses', to: '/expenses' },
  { label: 'Analytics', to: '/analytics' },
  { label: 'Profile', to: '/profile' },
];
const NAV_ICONS = { Home: 'globe', Expenses: 'wallet', Analytics: 'bar-chart-2', Profile: 'user' };
const API = API_BASE;
const PROFILE_PREFS_KEY = 'expenseai:profilePrefs';
const HYDERABAD_AREAS = [
  'Madhapur','Hitech City','Gachibowli','Banjara Hills','Jubilee Hills',
  'Kondapur','Kukatpally','Secunderabad','Ameerpet','Begumpet',
  'Mehdipatnam','LB Nagar','Uppal','Dilsukhnagar','Abids',
  'Somajiguda','Panjagutta','KPHB','Miyapur','Bachupally',
];

const loadStoredJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const Icon = ({ name, size = 16, color = 'currentColor', strokeWidth = 2 }) => {
  const paths = {
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    mail: <><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>,
    'map-pin': <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
    calendar: <><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></>,
    edit2: <><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></>,
    check: <><path d="M20 6 9 17l-5-5"/></>,
    x: <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    bell: <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
    shield: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></>,
    'trash-2': <><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></>,
    wallet: <><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></>,
    'bar-chart': <><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></>,
    'bar-chart-2': <><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 1 0 20 14.5 14.5 0 0 1 0-20"/><path d="M2 12h20"/></>,
    zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    star: <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    'trending-up': <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
    award: <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></>,
    info: <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></>,
    'refresh-cw': <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></>,
    'alert-circle': <><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></>,
    'chevron-right': <><path d="m9 18 6-6-6-6"/></>,
    receipt: <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8H8"/><path d="M16 12H8"/><path d="M12 16H8"/></>,
    'arrow-up-circle': <><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></>,
    'pie-chart': <><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      {paths[name]}
    </svg>
  );
};

function PillNav({ activeIdx, setActiveIdx }) {
  const pillRef = useRef(null);
  const linkRefs = useRef([]);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [pill, setPill] = useState({ left: 0, width: 0, opacity: 0 });
  const updatePill = (idx) => {
    const el = linkRefs.current[idx];
    const con = pillRef.current;
    if (!el || !con) return;
    const cR = con.getBoundingClientRect();
    const eR = el.getBoundingClientRect();
    setPill({ left: eR.left - cR.left, width: eR.width, opacity: 1 });
  };
  useEffect(() => { updatePill(hoverIdx !== null ? hoverIdx : activeIdx); }, [hoverIdx, activeIdx]);
  useEffect(() => { const t = setTimeout(() => updatePill(activeIdx), 120); return () => clearTimeout(t); }, []);
  return (
    <div className="pill-nav" ref={pillRef}>
      <span className="pill-bg" style={{ left: pill.left, width: pill.width, opacity: pill.opacity }} />
      {NAV_LINKS.map((link, i) => (
        <Link
          key={link.label}
          to={link.to}
          ref={(el) => { linkRefs.current[i] = el; }}
          className={`pill-link${activeIdx === i ? ' pill-link--on' : ''}`}
          onClick={() => setActiveIdx(i)}
          onMouseEnter={() => setHoverIdx(i)}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Icon name={NAV_ICONS[link.label]} size={13} />
            {link.label}
          </span>
        </Link>
      ))}
    </div>
  );
}

function Avatar({ user, size = 34 }) {
  const [imgErr, setImgErr] = useState(false);
  const src = user?.avatar_url;
  const initials = (user?.first_name?.[0] || user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase();
  if (src && !imgErr) return <img src={src} alt={initials} onError={() => setImgErr(true)} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(180,129,76,0.18)', flexShrink: 0 }} />;
  return <div style={{ width: size, height: size, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.38, fontWeight: 800, color: 'white', flexShrink: 0 }}>{initials}</div>;
}

function Toggle({ checked, onChange }) {
  return (
    <button className={`toggle${checked ? ' toggle--on' : ''}`} onClick={() => onChange(!checked)} type="button">
      <span className="toggle-knob" />
    </button>
  );
}

function SectionCard({ title, icon, accent, className = '', children }) {
  return (
    <section className={`prof-section${className ? ` ${className}` : ''}`}>
      <div className="prof-section-hd">
        <div className="prof-section-icon" style={{ background: `${accent}18`, color: accent }}>
          <Icon name={icon} size={15} />
        </div>
        <h2 className="prof-section-title">{title}</h2>
      </div>
      {children}
    </section>
  );
}

const fmt = (n) => 'INR ' + (Number(n) || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const san = (n) => {
  const v = Number(n) || 0;
  return (v > 0 && v < 1) ? Math.round(v * 1000 * 100) / 100 : v;
};
const parseDateParts = (dateStr) => {
  const p = (dateStr || '').split('-');
  if (p.length !== 3) return null;
  return { y: parseInt(p[0], 10), m: parseInt(p[1], 10) - 1, d: parseInt(p[2], 10) };
};

export default function Profile({ user, onLogout, onUserUpdate }) {
  const navigate = useNavigate();
  const [activeIdx, setActiveIdx] = useState(3);
  const [navSolid, setNavSolid] = useState(false);
  const [navHide, setNavHide] = useState(false);
  const lastScroll = useRef(0);

  const [expenses, setExpenses] = useState([]);
  const [expLoading, setExpLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  const [location, setLocation] = useState(null);
  const [areaChoice, setAreaChoice] = useState(user?.area || user?.location || 'Uppal');
  const [locLoading, setLocLoading] = useState(false);
  const [locErr, setLocErr] = useState('');
  const [regionSaving, setRegionSaving] = useState(false);
  const [regionMsg, setRegionMsg] = useState('');

  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [budgetSaved, setBudgetSaved] = useState(false);

  const [notifs, setNotifs] = useState({ emailDigest: true, budgetAlerts: true, weeklyReport: false, overspendWarning: true });
  const [notifSaved, setNotifSaved] = useState(false);
  const [prefs, setPrefs] = useState({ currency: 'INR', fiscalStartDay: '1', privacyMode: true, aiInsights: true });
  const [prefsSaved, setPrefsSaved] = useState(false);

  const [deletePhase, setDeletePhase] = useState(0);
  const [deleteMsg, setDeleteMsg] = useState('');
  const [exporting, setExporting] = useState(false);

  const memberSince = useMemo(() => {
    const d = new Date(user?.created_at || Date.now());
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }, [user?.created_at]);

  useEffect(() => {
    const h = () => {
      const sy = window.scrollY;
      setNavSolid(sy > 10);
      setNavHide(sy > lastScroll.current + 10 && sy > 200);
      lastScroll.current = sy;
    };
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    const savedBudget = loadStoredJson('expenseai:budget', null);
    if (savedBudget?.monthlyBudget) setMonthlyBudget(String(savedBudget.monthlyBudget));
    const savedNotifs = loadStoredJson('expenseai:notifs', null);
    if (savedNotifs) setNotifs((prev) => ({ ...prev, ...savedNotifs }));
    const savedPrefs = loadStoredJson(PROFILE_PREFS_KEY, null);
    if (savedPrefs) setPrefs((prev) => ({ ...prev, ...savedPrefs }));
  }, []);

  useEffect(() => {
    setFirstName(user?.first_name || '');
    setLastName(user?.last_name || '');
    setAreaChoice(user?.area || user?.location || 'Uppal');
  }, [user?.first_name, user?.last_name, user?.area, user?.location]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API}/api/expenses`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        setExpenses((data.expenses || []).map((e) => ({ ...e, amount: san(e.amount) })));
      } catch (err) {
        console.warn('Failed to load expenses for profile:', err);
      } finally {
        setExpLoading(false);
      }
    })();
  }, []);

  const now = new Date();
  const cy = now.getFullYear();
  const cm = now.getMonth();
  const totalExpenses = expenses.filter((e) => e.type === 'expense').reduce((s, e) => s + san(e.amount), 0);
  const totalIncome = expenses.filter((e) => e.type === 'income').reduce((s, e) => s + san(e.amount), 0);
  const monthlyExp = expenses.filter((e) => {
    if (e.type !== 'expense') return false;
    const dp = parseDateParts(e.date);
    return dp && dp.y === cy && dp.m === cm;
  }).reduce((s, e) => s + san(e.amount), 0);
  const budget = Number(monthlyBudget) || 0;
  const budgetUsedPct = budget > 0 ? Math.min((monthlyExp / budget) * 100, 100) : 0;
  const expenseCount = expenses.filter((e) => e.type === 'expense').length;
  const netBalance = totalIncome - totalExpenses;
  const initials = (firstName?.[0] || user?.full_name?.[0] || user?.email?.[0] || 'U').toUpperCase();

  async function detectLocation() {
    if (!navigator.geolocation) { setLocErr('Geolocation not supported.'); return; }
    setLocLoading(true);
    setLocErr('');
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords;
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const data = await res.json();
        const addr = data.address || {};
        const city = addr.city || addr.town || addr.village || addr.suburb || '';
        setLocation({
          city,
          state: addr.state || '',
          country: addr.country || '',
          display: [city, addr.state, addr.country].filter(Boolean).join(', '),
        });
        if (HYDERABAD_AREAS.includes(city)) setAreaChoice(city);
      } catch {
        setLocErr('Could not fetch location details.');
      }
      setLocLoading(false);
    }, () => {
      setLocErr('Location access denied.');
      setLocLoading(false);
    });
  }

  async function saveProfile() {
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch(`${API}/api/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          area: areaChoice,
          location: location?.display || user?.location || areaChoice,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to save.');
      setSaveMsg('Profile updated.');
      setEditing(false);
      if (onUserUpdate && data.user) onUserUpdate(data.user);
    } catch (err) {
      setSaveMsg(err.message || 'Network error.');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(''), 2500);
    }
  }

  function saveBudget() {
    const val = Number(monthlyBudget) || 0;
    localStorage.setItem('expenseai:budget', JSON.stringify({ monthlyBudget: val }));
    window.dispatchEvent(new Event('budgetUpdated'));
    setBudgetSaved(true);
    setTimeout(() => setBudgetSaved(false), 1800);
  }

  function saveNotifications() {
    localStorage.setItem('expenseai:notifs', JSON.stringify(notifs));
    setNotifSaved(true);
    setTimeout(() => setNotifSaved(false), 1800);
  }

  function savePreferences() {
    localStorage.setItem(PROFILE_PREFS_KEY, JSON.stringify(prefs));
    setPrefsSaved(true);
    setTimeout(() => setPrefsSaved(false), 1800);
  }

  async function saveRegion() {
    setRegionSaving(true);
    setRegionMsg('');
    try {
      const res = await fetch(`${API}/api/profile`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ area: areaChoice, location: location?.display || areaChoice }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to save region.');
      if (onUserUpdate && data.user) onUserUpdate(data.user);
      setRegionMsg('Region updated.');
    } catch (err) {
      setRegionMsg(err.message || 'Failed to save region.');
    } finally {
      setRegionSaving(false);
      setTimeout(() => setRegionMsg(''), 2500);
    }
  }

  async function exportData() {
    setExporting(true);
    try {
      const res = await fetch(`${API}/api/expenses/export.csv`, { credentials: 'include' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Export failed.');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'expenseai-expenses.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSaveMsg('CSV exported successfully.');
    } catch (err) {
      setSaveMsg(err.message || 'Export failed.');
    } finally {
      setExporting(false);
      setTimeout(() => setSaveMsg(''), 2500);
    }
  }

  async function deleteAccount() {
    setDeletePhase(2);
    setDeleteMsg('');
    try {
      const res = await fetch(`${API}/api/account`, { method: 'DELETE', credentials: 'include' });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Failed to delete account.');
      localStorage.removeItem('expenseai:budget');
      localStorage.removeItem('expenseai:notifs');
      localStorage.removeItem(PROFILE_PREFS_KEY);
      localStorage.removeItem('expenseai:test:monthlyRows:v1');
      localStorage.removeItem('expenseai:test:dailyExpenses:v1');
      setDeleteMsg('Account deleted successfully.');
      setTimeout(() => navigate('/', { replace: true }), 700);
    } catch (err) {
      setDeleteMsg(err.message || 'Failed to delete account.');
      setDeletePhase(1);
    }
  }

  return (
    <>
      <style>{CSS}</style>

      <nav className={`nav${navSolid ? ' nav--solid' : ''}${navHide ? ' nav--hide' : ''}`}>
        <div className="nav-in">
          <Link to="/" className="logo" onClick={() => setActiveIdx(0)}>
            <div className="logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <span>ExpenseAI</span>
          </Link>
          <PillNav activeIdx={activeIdx} setActiveIdx={setActiveIdx} />
          <div className="nav-r">
            {user ? (
              <div className="user-row">
                <Avatar user={{ ...user, first_name: firstName, last_name: lastName }} size={34} />
                <span className="uname">{firstName || user?.full_name?.split(' ')[0] || 'User'}</span>
                <button className="logout-btn" onClick={async () => { if (onLogout) await onLogout(); }}>Logout</button>
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      <main className="prof-main">
        <div className="prof-page-hd">
          <div>
            <h1 className="page-title">My Profile</h1>
            <p className="page-sub">Manage your account, region, budget, and preferences from one place.</p>
          </div>
        </div>

        <div className="prof-grid">
          <div className="prof-left">
            <section className="hero-card">
              <div className="hero-top">
                <div className="hero-pattern" />
                <div className="avatar-wrap">
                  <div className="avatar-ring">
                    <div className="big-avatar">
                      {user?.avatar_url ? <img src={user.avatar_url} alt={initials} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} /> : <span>{initials}</span>}
                    </div>
                  </div>
                  <div className="avatar-badge"><Icon name="star" size={10} color="white" /></div>
                </div>
                <div className="hero-copy">
                  {editing ? (
                    <div className="name-edit-row">
                      <input className="name-inp" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" autoFocus />
                      <input className="name-inp" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" />
                      <div className="name-edit-actions">
                        <button className="icon-btn icon-btn--success" onClick={saveProfile} disabled={saving}>{saving ? <div className="spin-sm" /> : <Icon name="check" size={14} />}</button>
                        <button className="icon-btn icon-btn--danger" onClick={() => { setEditing(false); setFirstName(user?.first_name || ''); setLastName(user?.last_name || ''); }}><Icon name="x" size={14} /></button>
                      </div>
                    </div>
                  ) : (
                    <div className="hero-name-row">
                      <h2 className="hero-name">{[firstName, lastName].filter(Boolean).join(' ') || user?.full_name || 'Your Name'}</h2>
                      <button className="icon-btn" onClick={() => setEditing(true)} title="Edit name"><Icon name="edit2" size={14} /></button>
                    </div>
                  )}
                  <div className="hero-email"><Icon name="mail" size={13} color="#7b8794" /><span>{user?.email || 'email@example.com'}</span></div>
                  <div className="hero-tags">
                    <span className="hero-tag hero-tag--plan"><Icon name="zap" size={11} />Free plan</span>
                    <span className="hero-tag"><Icon name="calendar" size={11} />Since {memberSince}</span>
                    <span className="hero-tag hero-tag--area"><Icon name="map-pin" size={11} />{areaChoice}</span>
                  </div>
                  <div className="hero-kpis">
                    <div className="hero-kpi"><span className="hero-kpi-label">Monthly budget</span><strong>{budget > 0 ? fmt(budget) : 'Not set'}</strong></div>
                    <div className="hero-kpi"><span className="hero-kpi-label">Current pace</span><strong>{expLoading ? 'Loading…' : fmt(monthlyExp)}</strong></div>
                  </div>
                </div>
              </div>

              <div className="hero-stats">
                <div className="stat-badge stat-badge--warm">
                  <div className="stat-icon-box" style={{ background: '#ffedd5', color: '#c2410c' }}><Icon name="receipt" size={15} color="#c2410c" /></div>
                  <div><p className="tiny-label">This Month</p><p className="tiny-value">{expLoading ? '…' : fmt(monthlyExp)}</p></div>
                </div>
                <div className="stat-badge stat-badge--green">
                  <div className="stat-icon-box" style={{ background: '#dcfce7', color: '#15803d' }}><Icon name="arrow-up-circle" size={15} color="#15803d" /></div>
                  <div><p className="tiny-label">Income</p><p className="tiny-value">{expLoading ? '…' : fmt(totalIncome)}</p></div>
                </div>
                <div className="stat-badge stat-badge--sand">
                  <div className="stat-icon-box" style={{ background: '#ede9fe', color: '#7c3aed' }}><Icon name="pie-chart" size={15} color="#7c3aed" /></div>
                  <div><p className="tiny-label">Budget Used</p><p className="tiny-value">{budget > 0 ? `${budgetUsedPct.toFixed(0)}%` : 'No budget'}</p></div>
                </div>
                <div className="stat-badge stat-badge--rose">
                  <div className="stat-icon-box" style={{ background: '#dbeafe', color: '#2563eb' }}><Icon name="award" size={15} color="#2563eb" /></div>
                  <div><p className="tiny-label">Status</p><p className="tiny-value">Active</p></div>
                </div>
              </div>

              {!expLoading && expenseCount > 0 && (
                <div className="hero-spending-bar">
                  <div className="hsb-row"><span className="hsb-lbl">Total spent</span><span className="hsb-val hsb-val--red">{fmt(totalExpenses)}</span></div>
                  <div className="hsb-row"><span className="hsb-lbl">This month</span><span className="hsb-val hsb-val--amber">{fmt(monthlyExp)}</span></div>
                  {budget > 0 && (
                    <>
                      <div className="hsb-track"><div className="hsb-fill" style={{ width: `${budgetUsedPct}%`, background: budgetUsedPct > 85 ? '#dc2626' : budgetUsedPct > 60 ? '#8b5cf6' : '#6366f1' }} /></div>
                      <p className="hsb-caption">{budgetUsedPct.toFixed(0)}% of {fmt(budget)} used this month</p>
                    </>
                  )}
                </div>
              )}
              {saveMsg && <p className="inline-msg">{saveMsg}</p>}
            </section>

            <SectionCard title="Location & Region" icon="map-pin" accent="#6366f1">
              <p className="prof-hint">Choose the area you live in so analytics compare you against a more realistic local benchmark.</p>
              <div className="region-grid">
                <label className="field-block">
                  <span className="field-label">Primary Area</span>
                  <select className="form-input" value={areaChoice} onChange={(e) => setAreaChoice(e.target.value)}>
                    {HYDERABAD_AREAS.map((areaName) => <option key={areaName} value={areaName}>{areaName}</option>)}
                  </select>
                </label>
                <div className="region-actions">
                  <button className="detect-btn" onClick={detectLocation} disabled={locLoading}>
                    {locLoading ? <><div className="spin-sm" /><span>Detecting…</span></> : <><Icon name="map-pin" size={15} /><span>Detect My Location</span></>}
                  </button>
                  <button className="save-btn save-btn--soft" onClick={saveRegion} disabled={regionSaving}>
                    {regionSaving ? <><div className="spin-sm" /><span>Saving…</span></> : <><Icon name="check" size={14} /><span>Save Region</span></>}
                  </button>
                </div>
              </div>
              {location && (
                <div className="loc-result">
                  <div className="loc-result-icon"><Icon name="map-pin" size={18} color="#6366f1" /></div>
                  <div style={{ flex: 1 }}>
                    <p className="loc-city">{location.city || location.state}</p>
                    <p className="loc-detail">{location.display}</p>
                  </div>
                  <button className="text-btn" onClick={() => setLocation(null)}><Icon name="x" size={13} /></button>
                </div>
              )}
              {locErr && <div className="loc-err"><Icon name="alert-circle" size={13} color="#dc2626" /><span>{locErr}</span></div>}
              {regionMsg && <div className="loc-ok"><Icon name="check" size={13} color="#15803d" /><span>{regionMsg}</span></div>}
            </SectionCard>
          </div>

          <div className="prof-right">
            <SectionCard title="Spending Overview" icon="bar-chart" accent="#9a3412" className="prof-section--compact">
              <p className="prof-hint">A quick snapshot of how your account is performing right now.</p>
              <div className="overview-shell">
              {expLoading ? (
                <div className="overview-loading"><div className="spin-sm" /><span>Loading your data…</span></div>
              ) : expenseCount === 0 ? (
                <div className="overview-empty"><p>No expenses yet. <Link to="/expenses">Add your first expense</Link></p></div>
              ) : (
                <div className="overview-grid">
                  <div className="ov-card"><p className="ov-lbl">All-Time Expenses</p><p className="ov-val ov-val--red">{fmt(totalExpenses)}</p><p className="ov-sub">{expenseCount} transactions</p></div>
                  <div className="ov-card"><p className="ov-lbl">All-Time Income</p><p className="ov-val ov-val--green">{fmt(totalIncome)}</p><p className="ov-sub">{expenses.filter((e) => e.type === 'income').length} records</p></div>
                  <div className="ov-card"><p className="ov-lbl">This Month</p><p className="ov-val ov-val--amber">{fmt(monthlyExp)}</p><p className="ov-sub">{areaChoice} spending pace</p></div>
                  <div className="ov-card"><p className="ov-lbl">Net Balance</p><p className={`ov-val ${netBalance < 0 ? 'ov-val--red' : 'ov-val--green'}`}>{fmt(netBalance)}</p><p className="ov-sub">Income minus expenses</p></div>
                </div>
              )}
              </div>
            </SectionCard>

            <SectionCard title="Monthly Budget" icon="wallet" accent="#6366f1">
              <p className="prof-hint">Set a monthly limit so Expenses and Analytics can compare actual spend against your target.</p>
              <div className="budget-input-row">
                <label className="field-block" style={{ flex: 1 }}>
                  <span className="field-label">Monthly Budget</span>
                  <div className="currency-input">
                    <span>INR</span>
                    <input className="form-input form-input--plain" type="number" min="0" step="100" placeholder="10000" value={monthlyBudget} onChange={(e) => setMonthlyBudget(e.target.value)} />
                  </div>
                </label>
                <button className={`save-btn${budgetSaved ? ' save-btn--done' : ''}`} onClick={saveBudget}>
                  {budgetSaved ? <><Icon name="check" size={14} /><span>Saved!</span></> : <><Icon name="wallet" size={14} /><span>Save Budget</span></>}
                </button>
              </div>
              {budget > 0 && (
                <>
                  <div className="budget-hint-box"><Icon name="info" size={13} color="#6366f1" /><span>Daily guide: <strong>INR {(budget / 30).toFixed(0)}</strong> and weekly guide: <strong>INR {(budget / 4).toFixed(0)}</strong></span></div>
                  <div className="budget-progress">
                    <div className="budget-progress-row"><span>This month vs limit</span><strong>{budgetUsedPct.toFixed(0)}%</strong></div>
                    <div className="hsb-track"><div className="hsb-fill" style={{ width: `${budgetUsedPct}%`, background: budgetUsedPct > 85 ? '#dc2626' : budgetUsedPct > 60 ? '#8b5cf6' : '#6366f1' }} /></div>
                    <p className="budget-footnote">{budgetUsedPct >= 100 ? `Over budget by ${fmt(monthlyExp - budget)}` : `${fmt(Math.max(budget - monthlyExp, 0))} remaining this month`}</p>
                  </div>
                </>
              )}
            </SectionCard>

            <SectionCard title="Notifications" icon="bell" accent="#8b5cf6">
              <div className="notif-list">
                {[
                  { key: 'emailDigest', title: 'Weekly Email Digest', desc: 'Spending summary every Sunday morning' },
                  { key: 'budgetAlerts', title: 'Budget Limit Alerts', desc: 'Warn me when I hit 80% of my monthly budget' },
                  { key: 'weeklyReport', title: 'Weekly Expense Report', desc: 'Share a weekly breakdown of category spend' },
                  { key: 'overspendWarning', title: 'Overspend Warning', desc: 'Highlight categories that are running hot early' },
                ].map((item) => (
                  <div key={item.key} className="notif-row">
                    <div className="notif-copy">
                      <p className="notif-title">{item.title}</p>
                      <p className="notif-desc">{item.desc}</p>
                    </div>
                    <Toggle checked={notifs[item.key]} onChange={(v) => setNotifs((prev) => ({ ...prev, [item.key]: v }))} />
                  </div>
                ))}
              </div>
              <button className={`save-btn${notifSaved ? ' save-btn--done' : ''}`} onClick={saveNotifications}>
                {notifSaved ? <><Icon name="check" size={14} /><span>Saved!</span></> : <><Icon name="bell" size={14} /><span>Save Preferences</span></>}
              </button>
            </SectionCard>

            <SectionCard title="Spending Intelligence" icon="refresh-cw" accent="#8b5e34">
              <p className="prof-hint">These controls were static before. They now store your personal viewing preferences for the app.</p>
              <div className="prefs-grid">
                <label className="field-block">
                  <span className="field-label">Currency</span>
                  <select className="form-input" value={prefs.currency} onChange={(e) => setPrefs((prev) => ({ ...prev, currency: e.target.value }))}>
                    <option value="INR">INR</option>
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                  </select>
                </label>
                <label className="field-block">
                  <span className="field-label">Fiscal Month Starts</span>
                  <select className="form-input" value={prefs.fiscalStartDay} onChange={(e) => setPrefs((prev) => ({ ...prev, fiscalStartDay: e.target.value }))}>
                    <option value="1">1st of month</option>
                    <option value="5">5th of month</option>
                    <option value="10">10th of month</option>
                    <option value="15">15th of month</option>
                  </select>
                </label>
                <div className="pref-row">
                  <div><p className="notif-title">Private Profile Mode</p><p className="notif-desc">Keep account data personal on this device.</p></div>
                  <Toggle checked={prefs.privacyMode} onChange={(v) => setPrefs((prev) => ({ ...prev, privacyMode: v }))} />
                </div>
                <div className="pref-row">
                  <div><p className="notif-title">AI Insights</p><p className="notif-desc">Allow analytics to show guidance and prediction-focused summaries.</p></div>
                  <Toggle checked={prefs.aiInsights} onChange={(v) => setPrefs((prev) => ({ ...prev, aiInsights: v }))} />
                </div>
              </div>
              <button className={`save-btn${prefsSaved ? ' save-btn--done' : ''}`} onClick={savePreferences}>
                {prefsSaved ? <><Icon name="check" size={14} /><span>Saved!</span></> : <><Icon name="refresh-cw" size={14} /><span>Save App Settings</span></>}
              </button>
            </SectionCard>

            <SectionCard title="Data & Privacy" icon="shield" accent="#b91c1c">
              <p className="prof-hint">Export a copy of your transaction history or permanently remove your account when needed.</p>
              <div className="data-actions">
                <button className="data-btn data-btn--export" onClick={exportData} disabled={exporting}><Icon name="download" size={15} /><span>{exporting ? 'Exporting…' : 'Export as CSV'}</span></button>
                {deletePhase === 0 && <button className="data-btn data-btn--danger" onClick={() => setDeletePhase(1)}><Icon name="trash-2" size={15} /><span>Delete Account</span></button>}
                {deletePhase === 1 && (
                  <div className="delete-confirm">
                    <Icon name="alert-circle" size={15} color="#dc2626" />
                    <span>This is permanent. Are you sure?</span>
                    <button className="data-btn data-btn--danger data-btn--sm" onClick={deleteAccount}>Yes, Delete</button>
                    <button className="data-btn data-btn--ghost data-btn--sm" onClick={() => setDeletePhase(0)}>Cancel</button>
                  </div>
                )}
                {deletePhase === 2 && <div className="delete-confirm"><div className="spin-sm" /><span>Deleting account…</span></div>}
                {deleteMsg && <div className="delete-confirm delete-confirm--toast">{deleteMsg}</div>}
              </div>
            </SectionCard>
          </div>
        </div>
      </main>
    </>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
*,*::before,*::after{box-sizing:border-box;}
body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#f0f2f7;color:#1f2937;overflow-x:hidden;}
.nav{position:fixed;top:0;left:0;right:0;z-index:200;padding:1rem 2.5rem;transition:transform .35s ease,background .25s ease,box-shadow .25s ease,padding .25s ease;}
.nav--solid{background:rgba(255,255,255,.95);backdrop-filter:blur(24px) saturate(180%);box-shadow:0 1px 0 rgba(99,102,241,.08),0 4px 24px rgba(99,102,241,.06);padding:.55rem 2.5rem;}
.nav--hide{transform:translateY(-110%);}
.nav-in{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;}
.logo{display:flex;align-items:center;gap:.55rem;font-weight:800;font-size:1.18rem;color:#1f2937;text-decoration:none;}
.logo-icon{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(99,102,241,.35);}
.pill-nav{position:relative;display:flex;align-items:center;background:rgba(255,255,255,.82);border:1px solid rgba(99,102,241,.14);border-radius:999px;padding:.3rem;box-shadow:0 2px 14px rgba(99,102,241,.08),inset 0 1px 0 rgba(255,255,255,.85);}
.pill-bg{position:absolute;top:.3rem;bottom:.3rem;background:white;border-radius:999px;box-shadow:0 2px 10px rgba(31,41,55,.08);transition:left .28s,width .28s,opacity .15s;}
.pill-link{position:relative;z-index:1;padding:.4rem 1.1rem;border-radius:999px;font-size:.86rem;font-weight:500;color:#64748b;text-decoration:none;}
.pill-link--on,.pill-link:hover{color:#6366f1;}
.nav-r{display:flex;align-items:center;gap:.9rem;}
.user-row{display:flex;align-items:center;gap:.55rem;}
.uname{font-size:.86rem;font-weight:600;color:#1f2937;}
.logout-btn{background:#fee2e2;border:none;color:#b91c1c;padding:.28rem .82rem;border-radius:999px;font-size:.78rem;font-weight:600;cursor:pointer;font-family:inherit;}

.prof-main{max-width:1280px;margin:0 auto;padding:92px 2rem 3rem;}
.prof-page-hd{margin-bottom:1.8rem;}
.page-title{font-size:2.15rem;font-weight:800;color:#1f2937;letter-spacing:-.03em;}
.page-sub{font-size:.92rem;color:#7b8794;margin-top:4px;font-weight:500;}
.prof-grid{display:grid;grid-template-columns:360px 1fr;gap:1.2rem;align-items:start;}
.prof-left,.prof-right{display:flex;flex-direction:column;gap:1.2rem;}

.hero-card,.prof-section{background:white;border:1.5px solid #e8edf5;border-radius:24px;box-shadow:0 4px 20px rgba(0,0,0,.06);}
.hero-card{overflow:hidden;}
.hero-top{position:relative;padding:1.5rem;}
.hero-pattern{position:absolute;inset:0 0 auto 0;height:148px;background:radial-gradient(circle at 15% 10%,rgba(255,255,255,.28),transparent 26%),linear-gradient(135deg,#6ea43a 0%,#7fbf4d 38%,#5ca36d 72%,#3f7f68 100%);}
.avatar-wrap{position:relative;z-index:1;width:max-content;margin-top:2.2rem;}
.avatar-ring{width:88px;height:88px;border-radius:50%;padding:3px;background:linear-gradient(135deg,#ffffff,#dbeafe);}
.big-avatar{width:82px;height:82px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:1.95rem;font-weight:900;color:white;border:4px solid white;overflow:hidden;}
.avatar-badge{position:absolute;right:2px;bottom:0;width:24px;height:24px;border-radius:50%;background:linear-gradient(135deg,#d97706,#b45309);border:2px solid white;display:flex;align-items:center;justify-content:center;}
.hero-copy{position:relative;z-index:1;margin-top:1rem;}
.hero-name-row{display:flex;align-items:center;gap:.5rem;margin-bottom:.25rem;}
.hero-name{font-size:1.38rem;font-weight:800;color:#1f2937;letter-spacing:-.03em;}
.hero-email{display:flex;align-items:center;gap:.45rem;font-size:.82rem;color:#6b7280;font-weight:500;margin-bottom:.75rem;}
.hero-tags{display:flex;flex-wrap:wrap;gap:.45rem;}
.hero-tag{display:inline-flex;align-items:center;gap:.32rem;padding:.26rem .62rem;border-radius:999px;background:#f1f5f9;border:1px solid #e2e8f0;color:#475569;font-size:.72rem;font-weight:700;}
.hero-tag--plan{background:linear-gradient(135deg,#eef2ff,#f5f3ff);border-color:#c7d2fe;color:#6366f1;}
.hero-tag--area{background:#eff6ff;border-color:#bfdbfe;color:#2563eb;}
.hero-kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:.7rem;margin-top:1rem;}
.hero-kpi{padding:.85rem 1rem;border-radius:18px;background:rgba(255,255,255,.64);border:1px solid rgba(255,255,255,.65);backdrop-filter:blur(8px);}
.hero-kpi-label{display:block;font-size:.7rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#6366f1;margin-bottom:.28rem;}
.hero-kpi strong{font-size:.95rem;color:#1f2937;}

.name-edit-row{display:flex;flex-wrap:wrap;gap:.5rem;align-items:center;}
.name-inp,.form-input{width:100%;height:46px;padding:0 14px;border:1.5px solid #e2e8f0;border-radius:14px;font-size:.96rem;font-weight:700;color:#1f2937;background:#fafbff;outline:none;font-family:inherit;}
.name-inp{width:140px;height:38px;}
.name-inp:focus,.form-input:focus{border-color:#a5b4fc;box-shadow:0 0 0 3px rgba(99,102,241,.08);}
.name-edit-actions{display:flex;gap:.3rem;}
.icon-btn{width:32px;height:32px;border-radius:10px;border:1px solid #e2e8f0;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#94a3b8;}
.icon-btn--success{background:#dcfce7;border-color:#bbf7d0;color:#166534;}
.icon-btn--danger{background:#fef2f2;border-color:#fecaca;color:#b91c1c;}

.hero-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:.7rem;padding:0 1.35rem 1rem;}
.stat-badge{display:flex;align-items:center;gap:.7rem;padding:.78rem .85rem;border-radius:16px;border:1px solid transparent;}
.stat-badge--warm{background:#fff7ed;border-color:#fed7aa;}
.stat-badge--green{background:#f0fdf4;border-color:#bbf7d0;}
.stat-badge--sand{background:#fffbeb;border-color:#fde68a;}
.stat-badge--rose{background:#fdf2f8;border-color:#fbcfe8;}
.stat-icon-box{width:34px;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.tiny-label{font-size:.68rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:2px;}
.tiny-value{font-size:.95rem;font-weight:800;color:#1f2937;}

.hero-spending-bar{padding:1rem 1.35rem 1.3rem;border-top:1px solid #f1f5f9;background:#f8fafc;}
.hsb-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.hsb-lbl{font-size:.75rem;font-weight:700;color:#6b7280;}
.hsb-val{font-size:.86rem;font-weight:800;}
.hsb-val--red{color:#b91c1c;}
.hsb-val--amber{color:#7c3aed;}
.hsb-track{height:9px;background:#e2e8f0;border-radius:999px;overflow:hidden;}
.hsb-fill{height:100%;border-radius:999px;transition:width .7s ease;}
.hsb-caption,.budget-footnote,.inline-msg{font-size:.75rem;font-weight:600;color:#7b8794;margin-top:.45rem;}

.prof-section{padding:1.35rem;}
.prof-section--compact{max-width:740px;padding:1.05rem 1.15rem;}
.prof-section--compact .prof-section-hd{margin-bottom:.65rem;}
.prof-section--compact .prof-hint{margin-bottom:.75rem;font-size:.76rem;}
.prof-section-hd{display:flex;align-items:center;gap:.7rem;margin-bottom:.85rem;}
.prof-section-icon{width:32px;height:32px;border-radius:10px;display:flex;align-items:center;justify-content:center;}
.prof-section-title{font-size:1rem;font-weight:800;color:#1f2937;letter-spacing:-.02em;}
.prof-hint{font-size:.8rem;color:#7b8794;line-height:1.55;margin-bottom:1rem;font-weight:500;}

.region-grid,.prefs-grid{display:grid;gap:.9rem;}
.field-block{display:flex;flex-direction:column;gap:.42rem;}
.field-label{font-size:.74rem;font-weight:800;color:#6366f1;text-transform:uppercase;letter-spacing:.06em;}
.region-actions{display:flex;gap:.7rem;flex-wrap:wrap;}
.detect-btn,.save-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border:none;border-radius:14px;padding:.72rem 1rem;font-size:.84rem;font-weight:800;cursor:pointer;font-family:inherit;}
.detect-btn{background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;}
.save-btn{background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;box-shadow:0 10px 20px rgba(99,102,241,.16);}
.save-btn--soft{background:white;color:#6366f1;border:1px solid #c7d2fe;box-shadow:none;}
.save-btn--done{background:linear-gradient(135deg,#16a34a,#15803d);}
.loc-result,.loc-err,.loc-ok,.budget-hint-box,.delete-confirm{display:flex;align-items:center;gap:.7rem;padding:.78rem .9rem;border-radius:14px;margin-top:.9rem;}
.loc-result{background:#eef2ff;border:1px solid #c7d2fe;}
.loc-result-icon{width:38px;height:38px;border-radius:12px;background:#e0e7ff;display:flex;align-items:center;justify-content:center;}
.loc-city{font-size:.92rem;font-weight:800;color:#4338ca;}
.loc-detail{font-size:.76rem;color:#6366f1;font-weight:600;margin-top:2px;}
.loc-err{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;}
.loc-ok{background:#eef2ff;border:1px solid #c7d2fe;color:#4338ca;}
.text-btn{background:none;border:none;cursor:pointer;color:#6366f1;}

.overview-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.58rem;}
.overview-shell{max-width:620px;}
.overview-loading,.overview-empty{padding:.55rem 0;color:#7b8794;font-size:.8rem;font-weight:600;}
.overview-empty a{color:#6366f1;font-weight:800;}
.ov-card{padding:.62rem .72rem;border-radius:14px;background:white;border:1px solid #e8edf5;min-height:84px;display:flex;flex-direction:column;justify-content:center;}
.ov-lbl{font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#94a3b8;margin-bottom:4px;}
.ov-val{font-size:.9rem;font-weight:800;letter-spacing:-.02em;margin-bottom:2px;line-height:1.05;}
.ov-val--red{color:#b91c1c;}
.ov-val--green{color:#15803d;}
.ov-val--amber{color:#7c3aed;}
.ov-sub{font-size:.64rem;color:#7b8794;font-weight:600;line-height:1.2;}

.budget-input-row{display:flex;gap:.8rem;align-items:end;flex-wrap:wrap;}
.currency-input{display:flex;align-items:center;border:1.5px solid #e2e8f0;border-radius:14px;background:#fafbff;overflow:hidden;}
.currency-input span{padding:0 .9rem;font-size:.88rem;font-weight:800;color:#6366f1;}
.form-input--plain{border:none;box-shadow:none;background:transparent;}
.budget-progress{margin-top:1rem;}
.budget-progress-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;font-size:.78rem;font-weight:700;color:#6b7280;}
.budget-hint-box{background:#eef2ff;border:1px solid #c7d2fe;color:#4338ca;}

.notif-list{display:flex;flex-direction:column;gap:.2rem;margin-bottom:1rem;}
.notif-row,.pref-row{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:.85rem 0;border-bottom:1px solid #f1f5f9;}
.notif-row:last-child,.pref-row:last-child{border-bottom:none;}
.notif-copy{flex:1;min-width:0;}
.notif-title{font-size:.88rem;font-weight:800;color:#1f2937;}
.notif-desc{font-size:.75rem;color:#7b8794;font-weight:600;margin-top:2px;line-height:1.45;}
.toggle{width:50px;height:28px;border:none;border-radius:999px;background:#e5e7eb;padding:4px;cursor:pointer;transition:background .2s ease;display:flex;align-items:center;}
.toggle--on{background:linear-gradient(135deg,#6366f1,#8b5cf6);}
.toggle-knob{width:20px;height:20px;border-radius:50%;background:white;box-shadow:0 2px 8px rgba(0,0,0,.14);transition:transform .22s ease;}
.toggle--on .toggle-knob{transform:translateX(22px);}

.data-actions{display:flex;flex-wrap:wrap;gap:.7rem;align-items:center;}
.data-btn{display:inline-flex;align-items:center;gap:.45rem;padding:.62rem 1rem;border-radius:12px;font-size:.84rem;font-weight:800;cursor:pointer;font-family:inherit;border:1px solid transparent;}
.data-btn--export{background:#eef2ff;color:#4338ca;border-color:#c7d2fe;}
.data-btn--danger{background:#fef2f2;color:#b91c1c;border-color:#fecaca;}
.data-btn--ghost{background:white;color:#6b7280;border-color:#e2e8f0;}
.data-btn--sm{padding:.4rem .74rem;font-size:.76rem;}
.delete-confirm{background:#fef2f2;border:1px solid #fecaca;color:#b91c1c;flex-wrap:wrap;}
.delete-confirm--toast{background:#fff7ed;border-color:#fed7aa;color:#c2410c;}

.spin-sm{width:14px;height:14px;border:2px solid rgba(99,102,241,.2);border-top-color:#6366f1;border-radius:50%;animation:spin .7s linear infinite;}
@keyframes spin{to{transform:rotate(360deg)}}

@media (max-width: 980px){
  .prof-grid{grid-template-columns:1fr;}
}
@media (max-width: 720px){
  .pill-nav{display:none;}
  .prof-main{padding:84px 1rem 2rem;}
  .hero-kpis,.hero-stats,.overview-grid{grid-template-columns:1fr;}
  .budget-input-row,.region-actions{flex-direction:column;align-items:stretch;}
  .name-inp{width:100%;}
}
`;
