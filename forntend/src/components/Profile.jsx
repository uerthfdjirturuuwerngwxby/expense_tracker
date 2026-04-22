import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const NAV_LINKS = [
  { label: 'Home',      to: '/'          },
  { label: 'Expenses',  to: '/expenses'  },
  { label: 'Analytics', to: '/analytics' },
  { label: 'Profile',   to: '/profile'   },
];
const NAV_ICONS = { Home: "globe", Expenses: "wallet", Analytics: "bar-chart-2", Profile: "user" };

const API = 'http://localhost:4000';

// ─── Inline SVG icons ────────────────────────────────────────────────────
const Icon = ({ name, size = 16, color = 'currentColor', strokeWidth = 2 }) => {
  const paths = {
    user:            <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    mail:            <><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></>,
    'map-pin':       <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></>,
    calendar:        <><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></>,
    edit2:           <><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></>,
    check:           <><path d="M20 6 9 17l-5-5"/></>,
    x:               <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    bell:            <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
    shield:          <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/></>,
    download:        <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></>,
    'trash-2':       <><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></>,
    wallet:          <><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></>,
    'bar-chart':     <><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></>,
    'bar-chart-2':   <><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></>,
    globe:           <><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 1 0 20 14.5 14.5 0 0 1 0-20"/><path d="M2 12h20"/></>,
    zap:             <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    star:            <><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></>,
    'trending-up':   <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
    award:           <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></>,
    target:          <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    info:            <><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></>,
    'refresh-cw':    <><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></>,
    'alert-circle':  <><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></>,
    'chevron-right': <><path d="m9 18 6-6-6-6"/></>,
    // Distinct stat icons
    'receipt':       <><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8H8"/><path d="M16 12H8"/><path d="M12 16H8"/></>,
    'arrow-up-circle': <><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></>,
    'pie-chart':     <><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
      {paths[name]}
    </svg>
  );
};

function PillNav({ activeIdx, setActiveIdx }) {
  const pillRef  = useRef(null);
  const linkRefs = useRef([]);
  const [hoverIdx, setHoverIdx] = useState(null);
  const [pill, setPill] = useState({ left:0, width:0, opacity:0 });
  const updatePill = (idx) => {
    const el=linkRefs.current[idx], con=pillRef.current;
    if (!el||!con) return;
    const cR=con.getBoundingClientRect(), eR=el.getBoundingClientRect();
    setPill({ left:eR.left-cR.left, width:eR.width, opacity:1 });
  };
  useEffect(()=>{ updatePill(hoverIdx!==null?hoverIdx:activeIdx); },[hoverIdx,activeIdx]);
  useEffect(()=>{ const t=setTimeout(()=>updatePill(activeIdx),120); return ()=>clearTimeout(t); },[]);
  return (
    <div className="pill-nav" ref={pillRef}>
      <span className="pill-bg" style={{left:pill.left,width:pill.width,opacity:pill.opacity}}/>
      {NAV_LINKS.map((link,i)=>(
        <Link key={link.label} to={link.to} ref={el=>linkRefs.current[i]=el}
          className={`pill-link${activeIdx===i?' pill-link--on':''}`}
          onClick={()=>setActiveIdx(i)} onMouseEnter={()=>setHoverIdx(i)} onMouseLeave={()=>setHoverIdx(null)}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><Icon name={NAV_ICONS[link.label] || "circle"} size={13} />{link.label}</span>
        </Link>
      ))}
    </div>
  );
}

function Avatar({ user, size=34 }) {
  const [imgErr, setImgErr] = useState(false);
  const src = user?.avatar_url;
  const initials = ((user?.first_name?.[0]||'')+(user?.last_name?.[0]||'')).toUpperCase()||'U';
  if (src&&!imgErr) return <img src={src} alt={initials} onError={()=>setImgErr(true)} style={{width:size,height:size,borderRadius:'50%',objectFit:'cover',border:'2px solid rgba(99,102,241,0.18)',flexShrink:0}}/>;
  return <div style={{width:size,height:size,borderRadius:'50%',background:'linear-gradient(135deg,#6366f1,#8b5cf6)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.38,fontWeight:800,color:'white',flexShrink:0,border:'2px solid rgba(99,102,241,0.18)'}}>{initials}</div>;
}

function Toggle({ checked, onChange }) {
  return (
    <button onClick={()=>onChange(!checked)} style={{
      width:48, height:26, borderRadius:99, border:'none', cursor:'pointer', padding:3,
      background: checked ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : '#e2e8f0',
      transition:'all 0.28s cubic-bezier(0.34,1.56,0.64,1)', position:'relative', flexShrink:0,
      boxShadow: checked ? '0 0 0 4px rgba(99,102,241,0.15)' : 'none',
    }}>
      <div style={{
        width:20, height:20, borderRadius:'50%', background:'white',
        boxShadow:'0 1px 6px rgba(0,0,0,0.18)',
        transform: checked ? 'translateX(22px)' : 'translateX(0)',
        transition:'transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
      }}/>
    </button>
  );
}

function SectionCard({ title, icon, children, delay=0, accent='#6366f1' }) {
  return (
    <div className="prof-section" style={{animationDelay:`${delay}ms`}}>
      <div className="prof-section-hd">
        <div className="prof-section-icon" style={{background:`${accent}18`,color:accent}}>
          <Icon name={icon} size={15}/>
        </div>
        <h2 className="prof-section-title">{title}</h2>
      </div>
      {children}
    </div>
  );
}

const fmt = (n) => 'INR ' + (Number(n)||0).toLocaleString('en-IN',{maximumFractionDigits:0});
const san = (n) => { const v=Number(n)||0; return (v>0&&v<1)?Math.round(v*1000*100)/100:v; };

const parseDateParts = (dateStr) => {
  const p=(dateStr||'').split('-'); if(p.length!==3) return null;
  return {y:parseInt(p[0]),m:parseInt(p[1])-1,d:parseInt(p[2])};
};

export default function Profile({ user, onLogout, onUserUpdate }) {
  const navigate = useNavigate();
  const [activeIdx,  setActiveIdx]  = useState(3);
  const [navSolid,   setNavSolid]   = useState(false);
  const [navHide,    setNavHide]    = useState(false);
  const lastScroll = useRef(0);

  // ── Expense data for stats ──
  const [expenses,      setExpenses]      = useState([]);
  const [expLoading,    setExpLoading]    = useState(true);

  // ── Personal info edit ──
  const [editing,   setEditing]   = useState(false);
  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName,  setLastName]  = useState(user?.last_name  || '');
  const [saving,    setSaving]    = useState(false);
  const [saveMsg,   setSaveMsg]   = useState('');

  // ── Location ──
  const [location,   setLocation]   = useState(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locErr,     setLocErr]     = useState('');

  // ── Budget ──
  const [monthlyBudget, setMonthlyBudget] = useState('');
  const [budgetSaved,   setBudgetSaved]   = useState(false);

  // ── Notifications ──
  const [notifs, setNotifs] = useState({
    emailDigest:true, budgetAlerts:true, weeklyReport:false, overspendWarning:true,
  });
  const [notifSaved, setNotifSaved] = useState(false);

  // ── Delete confirm ──
  const [deletePhase, setDeletePhase] = useState(0);
  const [deleteMsg, setDeleteMsg] = useState('');
  const [exporting, setExporting] = useState(false);

  const memberSince = (() => {
    const d = new Date(user?.created_at || Date.now());
    return d.toLocaleDateString('en-US', { month:'long', year:'numeric' });
  })();

  // ── Scroll nav ──
  useEffect(()=>{
    const h=()=>{ const sy=window.scrollY; setNavSolid(sy>10); setNavHide(sy>lastScroll.current+10&&sy>200); lastScroll.current=sy; };
    window.addEventListener('scroll',h,{passive:true}); return ()=>window.removeEventListener('scroll',h);
  },[]);

  // ── Load saved budget ──
  useEffect(()=>{
    const saved = localStorage.getItem('expenseai:budget');
    if(saved){ try{ const p=JSON.parse(saved); if(p.monthlyBudget) setMonthlyBudget(String(p.monthlyBudget)); }catch{} }
  },[]);

  // ── FIX: Load real expenses for stats ──
  useEffect(()=>{
    (async()=>{
      try{
        const res=await fetch(`${API}/api/expenses`,{credentials:'include'});
        if(!res.ok){setExpLoading(false);return;}
        const data=await res.json();
        setExpenses((data.expenses||[]).map(e=>({...e,amount:san(e.amount)})));
      }catch(e){console.warn('Failed to load expenses for profile:',e);}
      finally{setExpLoading(false);}
    })();
  },[]);

  // ── Computed stats from real data ──
  const now=new Date(), cy=now.getFullYear(), cm=now.getMonth();
  const totalExpenses = expenses.filter(e=>e.type==='expense').reduce((s,e)=>s+san(e.amount),0);
  const totalIncome   = expenses.filter(e=>e.type==='income').reduce((s,e)=>s+san(e.amount),0);
  const monthlyExp    = expenses.filter(e=>{
    if(e.type!=='expense') return false;
    const dp=parseDateParts(e.date); return dp&&dp.y===cy&&dp.m===cm;
  }).reduce((s,e)=>s+san(e.amount),0);
  const budget        = Number(monthlyBudget)||0;
  const budgetUsedPct = budget>0 ? Math.min((monthlyExp/budget)*100,100) : 0;

  // ── Detect location ──
  async function detectLocation() {
    if(!navigator.geolocation){setLocErr('Geolocation not supported.');return;}
    setLocLoading(true); setLocErr('');
    navigator.geolocation.getCurrentPosition(async(pos)=>{
      const {latitude,longitude}=pos.coords;
      try{
        const res=await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
        const data=await res.json();
        const addr=data.address||{};
        setLocation({city:addr.city||addr.town||addr.village||addr.suburb||'',state:addr.state||'',country:addr.country||'',display:[addr.city||addr.town||addr.village,addr.state,addr.country].filter(Boolean).join(', ')});
      }catch{setLocErr('Could not fetch location details.');}
      setLocLoading(false);
    },(err)=>{setLocErr('Location access denied.');setLocLoading(false);});
  }

  // ── Save profile ──
  async function saveProfile() {
    setSaving(true); setSaveMsg('');
    try{
      const res=await fetch(`${API}/api/profile`,{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({first_name:firstName,last_name:lastName})});
      const data=await res.json();
      if(res.ok){setSaveMsg('Saved!');setEditing(false);if(onUserUpdate&&data.user)onUserUpdate(data.user);}
      else setSaveMsg(data.message||'Failed to save.');
    }catch{setSaveMsg('Network error.');}
    setSaving(false); setTimeout(()=>setSaveMsg(''),3000);
  }

  function saveBudget() {
    const val=Number(monthlyBudget)||0;
    localStorage.setItem('expenseai:budget',JSON.stringify({monthlyBudget:val}));
    window.dispatchEvent(new Event('budgetUpdated'));
    setBudgetSaved(true); setTimeout(()=>setBudgetSaved(false),2000);
  }

  function saveNotifications() {
    localStorage.setItem('expenseai:notifs',JSON.stringify(notifs));
    setNotifSaved(true); setTimeout(()=>setNotifSaved(false),2000);
  }

  async function exportData() {
    setExporting(true);
    try{
      const res=await fetch(`${API}/api/expenses/export.csv`,{credentials:'include'});
      if(!res.ok){
        const data=await res.json().catch(()=>({}));
        throw new Error(data.message||'Export failed.');
      }
      const blob=await res.blob();
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url;
      a.download='expenseai-expenses.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setSaveMsg('CSV exported successfully.');
    }catch(err){
      setSaveMsg(err.message||'Export failed.');
    } finally {
      setExporting(false);
      setTimeout(()=>setSaveMsg(''),3000);
    }
  }

  async function deleteAccount() {
    setDeletePhase(2);
    setDeleteMsg('');
    try{
      const res=await fetch(`${API}/api/account`,{method:'DELETE',credentials:'include'});
      const data=await res.json().catch(()=>({}));
      if(!res.ok) throw new Error(data.message||'Failed to delete account.');
      localStorage.removeItem('expenseai:budget');
      localStorage.removeItem('expenseai:notifs');
      localStorage.removeItem('expenseai:test:monthlyRows:v1');
      localStorage.removeItem('expenseai:test:dailyExpenses:v1');
      setDeleteMsg('Account deleted successfully.');
      setTimeout(()=>navigate('/',{replace:true}),700);
    }catch(err){
      setDeleteMsg(err.message||'Failed to delete account.');
      setDeletePhase(1);
    }
  }

  const initials=((firstName?.[0]||'')+(lastName?.[0]||'')).toUpperCase()||'U';

  return (
    <>
      <style>{CSS}</style>

      <nav className={`nav${navSolid?' nav--solid':''}${navHide?' nav--hide':''}`}>
        <div className="nav-in">
          <Link to="/" className="logo" onClick={()=>setActiveIdx(0)}>
            <div className="logo-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
              </svg>
            </div>
            <span>ExpenseAI</span>
          </Link>
          <PillNav activeIdx={activeIdx} setActiveIdx={setActiveIdx}/>
          <div className="nav-r">
            {user ? (
              <div className="user-row">
                <Avatar user={{...user,first_name:firstName,last_name:lastName}} size={34}/>
                <span className="uname">{firstName||user?.full_name?.split(' ')[0]||'User'}</span>
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

      <main className="prof-main">
        <div className="prof-page-hd">
          <div>
            <h1 className="page-title">My Profile</h1>
            <p className="page-sub">Manage your account, preferences & budget</p>
          </div>
        </div>

        <div className="prof-grid">
          {/* ══ LEFT COLUMN ══ */}
          <div className="prof-left">

            {/* ── HERO CARD ── */}
            <div className="hero-card">
              <div className="hero-bg-pattern"/>
              <div className="hero-body">
                <div className="avatar-wrap">
                  <div className="avatar-ring">
                    <div className="big-avatar">
                      {user?.avatar_url
                        ? <img src={user.avatar_url} alt={initials} style={{width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%'}}/>
                        : <span>{initials}</span>
                      }
                    </div>
                  </div>
                  <div className="avatar-badge"><Icon name="star" size={10} color="white"/></div>
                </div>

                <div className="hero-info">
                  {editing ? (
                    <div className="name-edit-row">
                      <input className="name-inp" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name" autoFocus/>
                      <input className="name-inp" value={lastName}  onChange={e=>setLastName(e.target.value)}  placeholder="Last name"/>
                      <div className="name-edit-actions">
                        <button className="icon-btn icon-btn--success" onClick={saveProfile} disabled={saving}>
                          {saving?<div className="spin-sm"/>:<Icon name="check" size={14}/>}
                        </button>
                        <button className="icon-btn icon-btn--danger" onClick={()=>{setEditing(false);setFirstName(user?.first_name||'');setLastName(user?.last_name||'');}}>
                          <Icon name="x" size={14}/>
                        </button>
                      </div>
                      {saveMsg&&<span className="save-msg">{saveMsg}</span>}
                    </div>
                  ) : (
                    <div className="hero-name-row">
                      <h2 className="hero-name">{[firstName,lastName].filter(Boolean).join(' ')||user?.full_name||'Your Name'}</h2>
                      <button className="icon-btn" onClick={()=>setEditing(true)} title="Edit name">
                        <Icon name="edit2" size={14}/>
                      </button>
                    </div>
                  )}
                  <div className="hero-email">
                    <Icon name="mail" size={13} color="#94a3b8"/>
                    <span>{user?.email||'email@example.com'}</span>
                  </div>
                  <div className="hero-tags">
                    <span className="hero-tag hero-tag--plan"><Icon name="zap" size={11}/>Free Plan</span>
                    <span className="hero-tag"><Icon name="calendar" size={11}/>Since {memberSince}</span>
                  </div>
                </div>
              </div>

              {/* ── STATS (fixed: uses real data) ── */}
              <div className="hero-stats">
                {/* Card 1: This Month's expenses */}
                <div className="stat-badge" style={{background:'#fff7ed',borderColor:'#fed7aa'}}>
                  <div style={{width:32,height:32,borderRadius:9,background:'#ffedd515',display:'flex',alignItems:'center',justifyContent:'center',color:'#ea580c',flexShrink:0,backgroundColor:'#ffedd5'}}>
                    <Icon name="receipt" size={15} color="#ea580c"/>
                  </div>
                  <div>
                    <p style={{fontSize:'0.68rem',fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:2}}>This Month</p>
                    <p style={{fontSize:'0.92rem',fontWeight:800,color:'#1e293b'}}>
                      {expLoading ? <span className="stat-loading">…</span> : fmt(monthlyExp)}
                    </p>
                  </div>
                </div>

                {/* Card 2: Total income tracked */}
                <div className="stat-badge" style={{background:'#f0fdf4',borderColor:'#bbf7d0'}}>
                  <div style={{width:32,height:32,borderRadius:9,background:'#dcfce7',display:'flex',alignItems:'center',justifyContent:'center',color:'#15803d',flexShrink:0}}>
                    <Icon name="arrow-up-circle" size={15} color="#15803d"/>
                  </div>
                  <div>
                    <p style={{fontSize:'0.68rem',fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:2}}>Total Income</p>
                    <p style={{fontSize:'0.92rem',fontWeight:800,color:'#1e293b'}}>
                      {expLoading ? <span className="stat-loading">…</span> : fmt(totalIncome)}
                    </p>
                  </div>
                </div>

                {/* Card 3: Budget used (real %) */}
                <div className="stat-badge" style={{background:'#fff7ed',borderColor:'#fed7aa'}}>
                  <div style={{width:32,height:32,borderRadius:9,background:'#ffedd5',display:'flex',alignItems:'center',justifyContent:'center',color:'#ea580c',flexShrink:0}}>
                    <Icon name="pie-chart" size={15} color="#ea580c"/>
                  </div>
                  <div>
                    <p style={{fontSize:'0.68rem',fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:2}}>Budget Used</p>
                    <p style={{fontSize:'0.92rem',fontWeight:800,color:'#1e293b'}}>
                      {expLoading ? <span className="stat-loading">…</span> : (budget>0 ? `${budgetUsedPct.toFixed(0)}%` : 'No budget')}
                    </p>
                  </div>
                </div>

                {/* Card 4: Member status */}
                <div className="stat-badge" style={{background:'#fdf4ff',borderColor:'#e9d5ff'}}>
                  <div style={{width:32,height:32,borderRadius:9,background:'#f3e8ff',display:'flex',alignItems:'center',justifyContent:'center',color:'#a21caf',flexShrink:0}}>
                    <Icon name="award" size={15} color="#a21caf"/>
                  </div>
                  <div>
                    <p style={{fontSize:'0.68rem',fontWeight:600,color:'#94a3b8',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:2}}>Status</p>
                    <p style={{fontSize:'0.92rem',fontWeight:800,color:'#1e293b'}}>Active</p>
                  </div>
                </div>
              </div>

              {/* ── Spending summary bar (new, clear) ── */}
              {!expLoading && expenses.length > 0 && (
                <div className="hero-spending-bar">
                  <div className="hsb-row">
                    <span className="hsb-lbl">💸 Total Spent</span>
                    <span className="hsb-val" style={{color:'#dc2626'}}>{fmt(totalExpenses)}</span>
                  </div>
                  <div className="hsb-row">
                    <span className="hsb-lbl">📅 This Month</span>
                    <span className="hsb-val" style={{color:'#ea580c'}}>{fmt(monthlyExp)}</span>
                  </div>
                  {budget>0 && (
                    <>
                      <div className="hsb-track">
                        <div className="hsb-fill" style={{width:`${budgetUsedPct}%`,background:budgetUsedPct>85?'#ef4444':budgetUsedPct>60?'#f59e0b':'#6366f1'}}/>
                      </div>
                      <p className="hsb-caption">{budgetUsedPct.toFixed(0)}% of INR {Number(monthlyBudget).toLocaleString('en-IN')} budget used</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* ── LOCATION CARD ── */}
            <SectionCard title="Location & Region" icon="map-pin" delay={100} accent="#059669">
              <p className="prof-hint">Auto-detect your city to personalise spending insights & currency defaults.</p>
              {location ? (
                <div className="loc-result">
                  <div className="loc-result-icon"><Icon name="map-pin" size={18} color="#059669"/></div>
                  <div style={{flex:1}}>
                    <p className="loc-city">{location.city||location.state}</p>
                    <p className="loc-detail">{location.display}</p>
                  </div>
                  <button className="text-btn" onClick={()=>setLocation(null)}><Icon name="x" size={13}/></button>
                </div>
              ) : (
                <button className="detect-btn" onClick={detectLocation} disabled={locLoading}>
                  {locLoading
                    ? <><div className="spin-sm"/><span>Detecting…</span></>
                    : <><Icon name="map-pin" size={15}/><span>Detect My Location</span><Icon name="chevron-right" size={13}/></>
                  }
                </button>
              )}
              {locErr&&(
                <div className="loc-err">
                  <Icon name="alert-circle" size={13} color="#dc2626"/>
                  <span>{locErr}</span>
                </div>
              )}
            </SectionCard>
          </div>

          {/* ══ RIGHT COLUMN ══ */}
          <div className="prof-right">

            {/* ── EXPENSE SUMMARY CHART ── */}
            <SectionCard title="Spending Overview" icon="bar-chart" delay={120} accent="#6366f1">
              <p className="prof-hint">A clear view of your spending across all time and this month.</p>
              {expLoading ? (
                <div className="overview-loading">
                  <div className="spin-sm" style={{borderTopColor:'#6366f1',width:20,height:20,borderWidth:3}}/>
                  <span>Loading your data…</span>
                </div>
              ) : expenses.length===0 ? (
                <div className="overview-empty">
                  <span style={{fontSize:'2rem'}}>📊</span>
                  <p>No expenses yet! <Link to="/expenses" style={{color:'#6366f1',fontWeight:700}}>Add your first expense →</Link></p>
                </div>
              ) : (
                <div className="overview-grid">
                  <div className="ov-card" style={{background:'#fef2f2',borderColor:'#fecaca'}}>
                    <Icon name="trash-2" size={18} color="#dc2626"/>
                    <div>
                      <p className="ov-lbl">All-Time Expenses</p>
                      <p className="ov-val" style={{color:'#dc2626'}}>{fmt(totalExpenses)}</p>
                      <p className="ov-sub">{expenses.filter(e=>e.type==='expense').length} transactions</p>
                    </div>
                  </div>
                  <div className="ov-card" style={{background:'#f0fdf4',borderColor:'#bbf7d0'}}>
                    <Icon name="trending-up" size={18} color="#15803d"/>
                    <div>
                      <p className="ov-lbl">All-Time Income</p>
                      <p className="ov-val" style={{color:'#15803d'}}>{fmt(totalIncome)}</p>
                      <p className="ov-sub">{expenses.filter(e=>e.type==='income').length} transactions</p>
                    </div>
                  </div>
                  <div className="ov-card" style={{background:'#fff7ed',borderColor:'#fed7aa'}}>
                    <Icon name="receipt" size={18} color="#ea580c"/>
                    <div>
                      <p className="ov-lbl">This Month's Spending</p>
                      <p className="ov-val" style={{color:'#ea580c'}}>{fmt(monthlyExp)}</p>
                      <p className="ov-sub">vs {fmt(totalExpenses)} overall</p>
                    </div>
                  </div>
                  <div className="ov-card" style={{background:'#eef2ff',borderColor:'#c7d2fe'}}>
                    <Icon name="wallet" size={18} color="#4338ca"/>
                    <div>
                      <p className="ov-lbl">Net Balance</p>
                      <p className="ov-val" style={{color:totalIncome-totalExpenses<0?'#dc2626':'#15803d'}}>{fmt(totalIncome-totalExpenses)}</p>
                      <p className="ov-sub">Income minus expenses</p>
                    </div>
                  </div>
                </div>
              )}
            </SectionCard>

            {/* ── MONTHLY BUDGET ── */}
            <SectionCard title="Monthly Budget" icon="wallet" delay={150} accent="#6366f1">
              <p className="prof-hint">Set your monthly spending limit. We'll show alerts as you approach it on the dashboard.</p>
              <div className="budget-input-row">
                <div className="budget-inp-wrap">
                  <span className="budget-prefix">INR</span>
                  <input className="budget-inp" type="number" min="0" step="100" placeholder="e.g. 10000" value={monthlyBudget} onChange={e=>setMonthlyBudget(e.target.value)}/>
                </div>
                <button className={`save-btn${budgetSaved?' save-btn--done':''}`} onClick={saveBudget}>
                  {budgetSaved?<><Icon name="check" size={14}/><span>Saved!</span></>:<><Icon name="wallet" size={14}/><span>Save Budget</span></>}
                </button>
              </div>
              {monthlyBudget&&Number(monthlyBudget)>0&&(
                <div className="budget-hint-box">
                  <Icon name="info" size={13} color="#6366f1"/>
                  <span>Daily limit: <strong>INR {(Number(monthlyBudget)/30).toFixed(0)}</strong> - Weekly: <strong>INR {(Number(monthlyBudget)/4).toFixed(0)}</strong></span>
                </div>
              )}
              {/* Live budget progress */}
              {monthlyBudget&&Number(monthlyBudget)>0&&!expLoading&&(
                <div style={{marginTop:'0.8rem'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                    <span style={{fontSize:'0.76rem',fontWeight:600,color:'#64748b'}}>This month vs limit</span>
                    <span style={{fontSize:'0.76rem',fontWeight:700,color:budgetUsedPct>85?'#dc2626':'#6366f1'}}>{budgetUsedPct.toFixed(0)}%</span>
                  </div>
                  <div style={{height:8,background:'#f1f5f9',borderRadius:99,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${budgetUsedPct}%`,background:budgetUsedPct>85?'#ef4444':budgetUsedPct>60?'#f59e0b':'linear-gradient(90deg,#6366f1,#8b5cf6)',borderRadius:99,transition:'width 0.8s'}}/>
                  </div>
                  <p style={{fontSize:'0.72rem',color:budgetUsedPct>=100?'#dc2626':'#94a3b8',marginTop:5,fontWeight:600}}>
                    {budgetUsedPct>=100 ? `Over budget by ${fmt(monthlyExp-Number(monthlyBudget))}` : `${fmt(Number(monthlyBudget)-monthlyExp)} remaining this month`}
                  </p>
                </div>
              )}
            </SectionCard>

            {/* ── NOTIFICATIONS ── */}
            <SectionCard title="Notifications" icon="bell" delay={200} accent="#f59e0b">
              <div className="notif-list">
                {[
                  { key:'emailDigest',      icon:'mail',         title:'Weekly Email Digest',   desc:'Spending summary every Sunday morning' },
                  { key:'budgetAlerts',     icon:'alert-circle', title:'Budget Limit Alerts',   desc:'Notify when you hit 80% of monthly budget' },
                  { key:'weeklyReport',     icon:'bar-chart',    title:'Weekly Expense Report', desc:'Detailed breakdown of your weekly spending' },
                  { key:'overspendWarning', icon:'zap',          title:'Overspend Warning',     desc:'Instant alert when any category goes over' },
                ].map(({key,icon,title,desc})=>(
                  <div key={key} className="notif-row">
                    <div className="notif-icon-wrap">
                      <Icon name={icon} size={15} color={notifs[key]?'#6366f1':'#94a3b8'}/>
                    </div>
                    <div className="notif-text">
                      <p className="notif-title">{title}</p>
                      <p className="notif-desc">{desc}</p>
                    </div>
                    <Toggle checked={notifs[key]} onChange={v=>setNotifs(p=>({...p,[key]:v}))}/>
                  </div>
                ))}
              </div>
              <button className={`save-btn${notifSaved?' save-btn--done':''}`} style={{marginTop:'1rem'}} onClick={saveNotifications}>
                {notifSaved?<><Icon name="check" size={14}/><span>Saved!</span></>:<><Icon name="bell" size={14}/><span>Save Preferences</span></>}
              </button>
            </SectionCard>

            {/* ── SPENDING PREFERENCES ── */}
            <SectionCard title="Spending Intelligence" icon="trending-up" delay={250} accent="#0ea5e9">
              <p className="prof-hint">Personalise how ExpenseAI analyses and presents your financial data.</p>
              <div className="insight-grid">
                {[
                  { icon:'globe',    label:'Currency',            value:'INR',          action:'Change' },
                  { icon:'calendar', label:'Fiscal Month Starts', value:'1st of month', action:'Change' },
                  { icon:'shield',   label:'Data Privacy',        value:'Private',      action:'Manage' },
                  { icon:'zap',      label:'AI Analysis',         value:'Enabled',      action:'Configure' },
                ].map(({icon,label,value,action})=>(
                  <div key={label} className="insight-row">
                    <div className="insight-left">
                      <div className="insight-icon"><Icon name={icon} size={14} color="#0ea5e9"/></div>
                      <div>
                        <p className="insight-label">{label}</p>
                        <p className="insight-value">{value}</p>
                      </div>
                    </div>
                    <button className="text-btn text-btn--blue">{action}</button>
                  </div>
                ))}
              </div>
            </SectionCard>

            {/* ── DATA & PRIVACY ── */}
            <SectionCard title="Data & Privacy" icon="shield" delay={300} accent="#dc2626">
              <p className="prof-hint">Your data belongs to you. Export or permanently delete your account anytime.</p>
              <div className="data-actions">
                <button className="data-btn data-btn--export" onClick={exportData} disabled={exporting}>
                  <Icon name="download" size={15}/><span>{exporting ? 'Exporting...' : 'Export as CSV'}</span>
                </button>
                {deletePhase===0&&(
                  <button className="data-btn data-btn--danger" onClick={()=>setDeletePhase(1)}>
                    <Icon name="trash-2" size={15}/><span>Delete Account</span>
                  </button>
                )}
                {deletePhase===1&&(
                  <div className="delete-confirm" style={{animation:'fadeUp 0.2s both'}}>
                    <Icon name="alert-circle" size={15} color="#dc2626"/>
                    <span>This is permanent. Are you sure?</span>
                    <button className="data-btn data-btn--danger data-btn--sm" onClick={deleteAccount}>Yes, Delete</button>
                    <button className="data-btn data-btn--ghost data-btn--sm" onClick={()=>setDeletePhase(0)}>Cancel</button>
                  </div>
                )}
                {deletePhase===2&&(
                  <div className="delete-confirm">
                    <div className="spin-sm" style={{borderTopColor:'#dc2626'}}/>
                    <span style={{color:'#dc2626',fontWeight:600}}>Deleting account...</span>
                  </div>
                )}
                {deleteMsg && <div className="delete-confirm" style={{background:'#fff7ed',borderColor:'#fed7aa',color:'#c2410c'}}>{deleteMsg}</div>}
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
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#f0f2f7;color:#1e293b;overflow-x:hidden;}

.nav{position:fixed;top:0;left:0;right:0;z-index:200;padding:1rem 2.5rem;transition:transform 0.4s cubic-bezier(0.4,0,0.2,1),background 0.3s,box-shadow 0.3s,padding 0.3s;}
.nav--solid{background:rgba(255,255,255,0.95);backdrop-filter:blur(24px) saturate(180%);box-shadow:0 1px 0 rgba(99,102,241,0.08),0 4px 24px rgba(99,102,241,0.06);padding:0.55rem 2.5rem;}
.nav--hide{transform:translateY(-110%);}
.nav-in{max-width:1280px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:1.5rem;}
.logo{display:flex;align-items:center;gap:0.55rem;font-family:'Plus Jakarta Sans',sans-serif;font-weight:800;font-size:1.18rem;color:#1e1b4b;text-decoration:none;flex-shrink:0;}
.logo-icon{width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(99,102,241,0.35);flex-shrink:0;transition:transform 0.25s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.25s;}
.logo:hover .logo-icon{transform:scale(1.1) rotate(-8deg);}
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

.prof-main{max-width:1280px;margin:0 auto;padding:90px 2rem 3rem;}
.prof-page-hd{margin-bottom:1.8rem;}
.page-title{font-size:2rem;font-weight:800;color:#1e293b;letter-spacing:-0.03em;}
.page-sub{font-size:0.87rem;color:#94a3b8;margin-top:3px;font-weight:500;}
.prof-grid{display:grid;grid-template-columns:360px 1fr;gap:1.2rem;align-items:start;}
.prof-left{display:flex;flex-direction:column;gap:1.2rem;}
.prof-right{display:flex;flex-direction:column;gap:1.2rem;}

.hero-card{background:white;border:1.5px solid #e8edf5;border-radius:22px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.06);animation:fadeUp 0.5s cubic-bezier(0.2,0.9,0.1,1) both;}
.hero-bg-pattern{height:80px;background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a78bfa 100%);position:relative;overflow:hidden;}
.hero-bg-pattern::after{content:'';position:absolute;bottom:-1px;left:0;right:0;height:20px;background:white;border-radius:20px 20px 0 0;}
.hero-body{padding:0 1.5rem 1.2rem;display:flex;gap:1.1rem;align-items:flex-start;}
.avatar-wrap{position:relative;flex-shrink:0;margin-top:-36px;}
.avatar-ring{width:72px;height:72px;border-radius:50%;padding:3px;background:linear-gradient(135deg,#6366f1,#8b5cf6);box-shadow:0 4px 20px rgba(99,102,241,0.4);}
.big-avatar{width:66px;height:66px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;font-size:1.55rem;font-weight:900;color:white;border:3px solid white;overflow:hidden;}
.avatar-badge{position:absolute;bottom:0;right:0;width:20px;height:20px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#f97316);border:2px solid white;display:flex;align-items:center;justify-content:center;}
.hero-info{flex:1;min-width:0;padding-top:0.9rem;}
.hero-name-row{display:flex;align-items:center;gap:0.5rem;margin-bottom:0.3rem;}
.hero-name{font-size:1.22rem;font-weight:800;color:#1e1b4b;letter-spacing:-0.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.hero-email{display:flex;align-items:center;gap:0.4rem;font-size:0.78rem;color:#94a3b8;font-weight:500;margin-bottom:0.65rem;}
.hero-tags{display:flex;flex-wrap:wrap;gap:0.4rem;}
.hero-tag{display:inline-flex;align-items:center;gap:0.3rem;font-size:0.71rem;font-weight:700;color:#475569;background:#f1f5f9;padding:0.22rem 0.6rem;border-radius:99px;border:1px solid #e2e8f0;}
.hero-tag--plan{background:linear-gradient(135deg,#eef2ff,#f5f3ff);color:#6366f1;border-color:#c7d2fe;}

.name-edit-row{display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center;}
.name-inp{height:34px;padding:0 10px;border:1.5px solid #c7d2fe;border-radius:9px;font-size:0.86rem;font-weight:600;color:#1e293b;background:white;outline:none;font-family:inherit;width:120px;transition:border-color 0.18s;}
.name-inp:focus{border-color:#6366f1;}
.name-edit-actions{display:flex;gap:0.3rem;}
.save-msg{font-size:0.72rem;font-weight:600;color:#22c55e;}

.hero-stats{display:grid;grid-template-columns:repeat(2,1fr);gap:0.6rem;padding:0.9rem 1.2rem;background:#fafbff;border-top:1px solid #f1f5f9;}
.stat-badge{display:flex;align-items:center;gap:0.7rem;padding:0.65rem 0.8rem;border-radius:12px;border:1px solid transparent;transition:transform 0.18s,box-shadow 0.18s;}
.stat-badge:hover{transform:translateY(-2px);box-shadow:0 4px 14px rgba(0,0,0,0.06);}
.stat-loading{display:inline-block;width:40px;height:12px;background:linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%);background-size:200% 100%;animation:shimmer 1.4s infinite;border-radius:4px;}
@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}

.hero-spending-bar{padding:0.8rem 1.2rem;background:#f8fafc;border-top:1px solid #f1f5f9;}
.hsb-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;}
.hsb-lbl{font-size:0.74rem;font-weight:600;color:#64748b;}
.hsb-val{font-size:0.84rem;font-weight:800;}
.hsb-track{height:8px;background:#e2e8f0;border-radius:99px;overflow:hidden;margin-bottom:4px;}
.hsb-fill{height:100%;border-radius:99px;transition:width 0.8s;}
.hsb-caption{font-size:0.7rem;color:#94a3b8;font-weight:500;}

.prof-section{background:white;border:1.5px solid #e8edf5;border-radius:20px;padding:1.4rem;box-shadow:0 2px 8px rgba(0,0,0,0.04);animation:fadeUp 0.5s cubic-bezier(0.2,0.9,0.1,1) both;transition:box-shadow 0.22s;}
.prof-section:hover{box-shadow:0 8px 24px rgba(0,0,0,0.07);}
.prof-section-hd{display:flex;align-items:center;gap:0.7rem;margin-bottom:0.9rem;}
.prof-section-icon{width:30px;height:30px;border-radius:9px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.prof-section-title{font-size:0.92rem;font-weight:800;color:#1e293b;letter-spacing:-0.01em;}
.prof-hint{font-size:0.78rem;color:#94a3b8;line-height:1.5;margin-bottom:1rem;font-weight:500;}

/* Overview grid */
.overview-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:0.7rem;}
.ov-card{display:flex;align-items:flex-start;gap:0.75rem;padding:0.9rem;border-radius:12px;border:1.5px solid;}
.ov-lbl{font-size:0.69rem;font-weight:600;color:#94a3b8;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px;}
.ov-val{font-size:1.1rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:2px;}
.ov-sub{font-size:0.7rem;color:#94a3b8;font-weight:500;}
.overview-loading{display:flex;align-items:center;gap:0.6rem;padding:1.2rem;color:#94a3b8;font-size:0.84rem;font-weight:500;}
.overview-empty{display:flex;flex-direction:column;align-items:center;gap:0.6rem;padding:1.5rem;color:#94a3b8;font-size:0.84rem;text-align:center;}

.icon-btn{width:30px;height:30px;border-radius:8px;border:1.5px solid #e2e8f0;background:white;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#94a3b8;transition:all 0.18s;flex-shrink:0;}
.icon-btn:hover{background:#eef2ff;color:#6366f1;border-color:#c7d2fe;}
.icon-btn--success{background:#dcfce7;color:#15803d;border-color:#bbf7d0;}
.icon-btn--danger{background:#fef2f2;color:#dc2626;border-color:#fecaca;}

.detect-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:0.55rem;padding:0.75rem 1.2rem;background:linear-gradient(135deg,#ecfdf5,#f0fdf4);border:1.5px solid #a7f3d0;border-radius:12px;color:#059669;font-size:0.86rem;font-weight:700;cursor:pointer;transition:all 0.22s;font-family:inherit;}
.detect-btn:hover:not(:disabled){background:linear-gradient(135deg,#d1fae5,#ecfdf5);transform:translateY(-2px);box-shadow:0 6px 18px rgba(5,150,105,0.15);}
.detect-btn:disabled{opacity:0.7;cursor:not-allowed;}
.loc-result{display:flex;align-items:center;gap:0.8rem;padding:0.8rem 1rem;background:#f0fdf4;border:1.5px solid #a7f3d0;border-radius:12px;}
.loc-result-icon{width:36px;height:36px;border-radius:10px;background:#dcfce7;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.loc-city{font-size:0.9rem;font-weight:800;color:#15803d;}
.loc-detail{font-size:0.74rem;color:#059669;font-weight:500;margin-top:2px;}
.loc-err{display:flex;align-items:center;gap:0.5rem;margin-top:0.7rem;padding:0.55rem 0.8rem;background:#fef2f2;border:1px solid #fecaca;border-radius:9px;font-size:0.76rem;color:#dc2626;font-weight:600;}
.text-btn{background:none;border:none;cursor:pointer;color:#94a3b8;display:flex;align-items:center;gap:0.2rem;font-size:0.76rem;font-weight:600;padding:0.25rem;transition:color 0.16s;font-family:inherit;}
.text-btn:hover{color:#6366f1;}
.text-btn--blue{color:#0ea5e9;}
.text-btn--blue:hover{color:#0284c7;}

.budget-input-row{display:flex;gap:0.7rem;align-items:center;}
.budget-inp-wrap{flex:1;position:relative;display:flex;align-items:center;}
.budget-prefix{position:absolute;left:12px;font-size:1rem;font-weight:700;color:#94a3b8;pointer-events:none;}
.budget-inp{width:100%;height:46px;padding:0 14px 0 30px;border:1.5px solid #e2e8f0;border-radius:12px;font-size:1rem;font-weight:700;color:#1e293b;background:#fafbff;outline:none;font-family:inherit;transition:border-color 0.18s;}
.budget-inp:focus{border-color:#a5b4fc;box-shadow:0 0 0 3px rgba(99,102,241,0.08);background:white;}
.budget-inp::placeholder{color:#cbd5e1;font-weight:500;}
.budget-hint-box{display:flex;align-items:center;gap:0.5rem;margin-top:0.8rem;padding:0.55rem 0.8rem;background:#eef2ff;border:1px solid #c7d2fe;border-radius:9px;font-size:0.76rem;color:#4338ca;font-weight:500;}
.budget-hint-box strong{font-weight:800;}

.save-btn{display:inline-flex;align-items:center;gap:0.45rem;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;padding:0.62rem 1.2rem;border-radius:12px;font-size:0.86rem;font-weight:700;cursor:pointer;box-shadow:0 4px 14px rgba(99,102,241,0.28);transition:all 0.22s;font-family:inherit;flex-shrink:0;}
.save-btn:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(99,102,241,0.38);}
.save-btn--done{background:linear-gradient(135deg,#22c55e,#16a34a);box-shadow:0 4px 14px rgba(34,197,94,0.28);}

.notif-list{display:flex;flex-direction:column;gap:0;}
.notif-row{display:flex;align-items:center;gap:0.9rem;padding:0.85rem 0;border-bottom:1px solid #f8fafc;}
.notif-row:last-child{border-bottom:none;}
.notif-icon-wrap{width:34px;height:34px;border-radius:10px;background:#f8fafc;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background 0.18s;}
.notif-row:hover .notif-icon-wrap{background:#eef2ff;}
.notif-text{flex:1;min-width:0;}
.notif-title{font-size:0.87rem;font-weight:700;color:#1e293b;}
.notif-desc{font-size:0.73rem;color:#94a3b8;font-weight:500;margin-top:1px;}

.insight-grid{display:flex;flex-direction:column;gap:0;}
.insight-row{display:flex;align-items:center;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid #f8fafc;}
.insight-row:last-child{border-bottom:none;}
.insight-left{display:flex;align-items:center;gap:0.7rem;}
.insight-icon{width:30px;height:30px;border-radius:8px;background:#e0f2fe;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.insight-label{font-size:0.76rem;color:#94a3b8;font-weight:600;}
.insight-value{font-size:0.86rem;font-weight:700;color:#1e293b;}

.data-actions{display:flex;flex-wrap:wrap;gap:0.7rem;align-items:center;}
.data-btn{display:inline-flex;align-items:center;gap:0.45rem;padding:0.6rem 1.1rem;border-radius:11px;font-size:0.84rem;font-weight:700;cursor:pointer;transition:all 0.2s;font-family:inherit;border:1.5px solid;}
.data-btn--export{background:#f0fdf4;color:#15803d;border-color:#bbf7d0;}
.data-btn--export:hover{background:#dcfce7;transform:translateY(-2px);}
.data-btn--danger{background:#fef2f2;color:#dc2626;border-color:#fecaca;}
.data-btn--danger:hover{background:#fee2e2;transform:translateY(-2px);}
.data-btn--ghost{background:#f8fafc;color:#64748b;border-color:#e2e8f0;}
.data-btn--ghost:hover{background:#f1f5f9;}
.data-btn--sm{padding:0.38rem 0.75rem;font-size:0.78rem;}
.delete-confirm{display:flex;align-items:center;flex-wrap:wrap;gap:0.6rem;padding:0.8rem;background:#fef2f2;border:1.5px solid #fecaca;border-radius:12px;width:100%;font-size:0.8rem;font-weight:600;color:#dc2626;}

.spin-sm{width:14px;height:14px;border:2px solid rgba(99,102,241,0.2);border-top-color:#6366f1;border-radius:50%;animation:spin 0.7s linear infinite;flex-shrink:0;}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:900px){.prof-grid{grid-template-columns:1fr;}.overview-grid{grid-template-columns:1fr;}}
@media(max-width:640px){.pill-nav{display:none;}.prof-main{padding:80px 1rem 2rem;}.hero-body{flex-direction:column;align-items:flex-start;}.budget-input-row{flex-direction:column;}.name-inp{width:100%;}}
`;


