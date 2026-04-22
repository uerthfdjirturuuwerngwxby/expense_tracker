import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./useAuth";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight } from "lucide-react";

function useCounter(target, duration = 2000, start = false) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!start) return;
    let t0 = null;
    const tick = (ts) => {
      if (!t0) t0 = ts;
      const p = Math.min((ts - t0) / duration, 1);
      setVal(Math.floor((1 - Math.pow(1 - p, 3)) * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [start, target, duration]);
  return val;
}

function getStrength(pwd) {
  let s = 0;
  if (pwd.length >= 6)          s++;
  if (pwd.length >= 10)         s++;
  if (/[A-Z]/.test(pwd))        s++;
  if (/[0-9]/.test(pwd))        s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  return Math.min(s, 4);
}
const S_LABEL = ["", "Weak", "Fair", "Good", "Strong"];
const S_COLOR = ["#e2e8f0", "#ef4444", "#f97316", "#eab308", "#22c55e"];

const CATEGORIES = [
  { icon: "🍔", label: "Food & Dining", pct: 32, color: "#f97316", light: "#fff7ed" },
  { icon: "🛍",  label: "Shopping",     pct: 24, color: "#ec4899", light: "#fdf2f8" },
  { icon: "🚗", label: "Transport",     pct: 18, color: "#6366f1", light: "#eef2ff" },
  { icon: "💡", label: "Bills",         pct: 15, color: "#0ea5e9", light: "#f0f9ff" },
  { icon: "🏥", label: "Healthcare",    pct: 11, color: "#10b981", light: "#f0fdf4" },
];

const AI_INSIGHTS = [
  "Cut dining by 10% → save $180 extra",
  "You're 80% through your shopping budget",
  "Electricity up 22% vs last month",
];

const ERROR_MESSAGES = {
  missing_code:   "Google sign-in was cancelled. Please try again.",
  oauth_failed:   "Google sign-in failed. Please try again.",
  email_conflict: "This email is already registered with a password. Please sign in with email & password.",
};

export default function Signup() {
  const { user, loading, signup, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [form, setForm]           = useState({ first_name: "", last_name: "", email: "", password: "" });
  const [showPw, setShowPw]       = useState(false);
  const [submitting, setSubmit]   = useState(false);
  const [googleBusy, setGoogle]   = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [counting, setCounting]   = useState(false);
  const [insightIdx, setIdx]      = useState(0);
  const [insightOn, setInsightOn] = useState(true);

  const users    = useCounter(12480, 2200, counting);
  const saved    = useCounter(98,    1800, counting);
  const strength = getStrength(form.password);

  // Handle error query param from OAuth redirect
  useEffect(() => {
    const err = searchParams.get("error");
    if (err && ERROR_MESSAGES[err]) {
      setError(ERROR_MESSAGES[err]);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) navigate("/expenses", { replace: true });
  }, [user, loading]);

  useEffect(() => {
    const t = setTimeout(() => setCounting(true), 300);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const iv = setInterval(() => {
      setInsightOn(false);
      setTimeout(() => { setIdx(i => (i + 1) % AI_INSIGHTS.length); setInsightOn(true); }, 350);
    }, 3200);
    return () => clearInterval(iv);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmit(true);
    setError("");
    try {
      await signup(form);
      setSuccess("Account created! Redirecting…");
      setTimeout(() => navigate("/expenses", { replace: true }), 1200);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmit(false);
    }
  };

  const handleGoogle = () => {
    setGoogle(true);
    setError("");
    loginWithGoogle(); // redirects away
  };

  if (loading) return null;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
        *, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
        .page { min-height:100vh; display:flex; font-family:'Plus Jakarta Sans',sans-serif; }

        .panel-left {
          flex:1; position:relative; overflow:hidden; background:#ffffff;
          display:flex; flex-direction:column; justify-content:center; align-items:center;
          padding:52px 44px; border-right:1px solid #f1f5f9;
        }
        .panel-left::before { content:''; position:absolute; inset:0; background-image:radial-gradient(circle,#e2e8f0 1px,transparent 1px); background-size:28px 28px; opacity:.55; pointer-events:none; }
        .panel-left::after  { content:''; position:absolute; width:480px; height:480px; border-radius:50%; background:radial-gradient(circle,rgba(99,102,241,.07) 0%,transparent 65%); bottom:-140px; right:-140px; pointer-events:none; animation:breathe 9s ease-in-out infinite; }
        @keyframes breathe { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.1);opacity:1} }

        .left-wrap { position:relative; z-index:2; width:100%; max-width:380px; }

        .badge { display:inline-flex; align-items:center; gap:7px; border:1.5px solid #dbeafe; background:#eff6ff; color:#2563eb; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:5px 13px; border-radius:999px; margin-bottom:24px; }
        .badge-dot { width:6px; height:6px; border-radius:50%; background:#3b82f6; animation:dot 2s ease-in-out infinite; }
        @keyframes dot { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(59,130,246,.4)} 50%{opacity:.4;box-shadow:0 0 0 5px rgba(59,130,246,0)} }

        .left-title { font-size:clamp(26px,3vw,38px); font-weight:800; color:#0f172a; line-height:1.18; margin-bottom:10px; animation:up .6s cubic-bezier(.22,1,.36,1) .1s both; }
        .left-title span { color:#6366f1; }
        .left-sub  { font-size:13.5px; color:#64748b; line-height:1.7; margin-bottom:28px; animation:up .6s cubic-bezier(.22,1,.36,1) .2s both; }
        @keyframes up { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }

        .proof-row { display:flex; align-items:center; gap:20px; background:#f8fafc; border:1.5px solid #f1f5f9; border-radius:14px; padding:14px 18px; margin-bottom:20px; animation:up .6s cubic-bezier(.22,1,.36,1) .3s both; }
        .proof-item { display:flex; flex-direction:column; gap:2px; }
        .proof-val   { font-size:22px; font-weight:800; color:#0f172a; letter-spacing:-.5px; line-height:1; }
        .proof-val.blue { color:#2563eb; }
        .proof-lbl   { font-size:11px; color:#94a3b8; font-weight:600; text-transform:uppercase; letter-spacing:.06em; }
        .proof-sep   { width:1px; height:36px; background:#e2e8f0; }

        .breakdown { background:#f8fafc; border:1.5px solid #f1f5f9; border-radius:16px; padding:16px; margin-bottom:16px; animation:up .6s cubic-bezier(.22,1,.36,1) .35s both; }
        .bd-hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
        .bd-title { font-size:11px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:.07em; }
        .bd-month { font-size:11px; font-weight:700; color:#6366f1; background:#eef2ff; padding:3px 9px; border-radius:6px; }

        .cat-list { display:flex; flex-direction:column; gap:9px; }
        .cat-item  { display:flex; flex-direction:column; gap:5px; }
        .cat-top   { display:flex; align-items:center; justify-content:space-between; }
        .cat-name  { display:flex; align-items:center; gap:7px; font-size:12px; font-weight:600; color:#1e293b; }
        .cat-em    { width:22px; height:22px; border-radius:6px; display:flex; align-items:center; justify-content:center; font-size:12px; }
        .cat-pct   { font-size:12px; font-weight:700; color:#64748b; }
        .prog-bg   { height:5px; background:#e2e8f0; border-radius:99px; overflow:hidden; }
        .prog-fill { height:100%; border-radius:99px; animation:fill 1.1s cubic-bezier(.22,1,.36,1) both; transform-origin:left; opacity:0; }
        @keyframes fill { from{transform:scaleX(0);opacity:0} to{transform:scaleX(1);opacity:1} }

        .ai-rotator { display:flex; align-items:center; gap:10px; background:white; border:1.5px solid #e0e7ff; border-radius:12px; padding:12px 14px; animation:up .6s cubic-bezier(.22,1,.36,1) .5s both; min-height:52px; }
        .ai-chip { width:28px; height:28px; border-radius:8px; background:linear-gradient(135deg,#6366f1,#8b5cf6); display:flex; align-items:center; justify-content:center; font-size:13px; flex-shrink:0; }
        .ai-txt { font-size:12.5px; color:#475569; font-weight:500; line-height:1.4; transition:opacity .3s,transform .3s; }
        .ai-txt.off { opacity:0; transform:translateY(6px); }
        .ai-txt.on  { opacity:1; transform:translateY(0); }
        .ai-txt b { color:#6366f1; font-weight:700; }

        .panel-right { width:480px; display:flex; flex-direction:column; justify-content:center; padding:52px; background:#f8fafc; overflow-y:auto; }
        .form-hd  { margin-bottom:30px; animation:up .5s cubic-bezier(.22,1,.36,1) .05s both; }
        .form-title { font-size:30px; font-weight:800; color:#0f172a; margin-bottom:6px; }
        .form-sub   { font-size:14px; color:#64748b; }

        .alert-box { padding:12px 16px; border-radius:10px; font-size:13.5px; margin-bottom:20px; display:flex; align-items:center; gap:8px; }
        .a-error   { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; }
        .a-success { background:#f0fdf4; color:#15803d; border:1px solid #bbf7d0; }

        .name-row { display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-bottom:20px; animation:up .5s cubic-bezier(.22,1,.36,1) .15s both; }
        .field { margin-bottom:20px; animation:up .5s cubic-bezier(.22,1,.36,1) both; }
        .field-lbl { display:block; font-size:12.5px; font-weight:700; color:#334155; margin-bottom:7px; }
        .inp-wrap { position:relative; }
        .inp-ico  { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#94a3b8; display:flex; pointer-events:none; }
        .auth-input { width:100%; height:48px; padding:0 44px; border:1.5px solid #e2e8f0; border-radius:12px; background:white; font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:500; color:#0f172a; transition:border-color .2s,box-shadow .2s; outline:none; box-shadow:0 1px 3px rgba(0,0,0,.04); }
        .auth-input:focus { border-color:#6366f1; box-shadow:0 0 0 3px rgba(99,102,241,.1); }
        .auth-input::placeholder { color:#cbd5e1; font-weight:400; }
        .toggle { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#94a3b8; display:flex; padding:4px; transition:color .2s; }
        .toggle:hover { color:#6366f1; }

        .str-bars { display:flex; gap:5px; margin-top:10px; margin-bottom:4px; }
        .str-bar  { flex:1; height:4px; border-radius:4px; transition:background .35s; }
        .str-txt  { font-size:12px; font-weight:600; min-height:16px; }

        .btn-main { width:100%; height:50px; border:none; border-radius:12px; background:linear-gradient(135deg,#4f46e5,#6366f1); color:white; font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:transform .2s,box-shadow .2s; margin-bottom:16px; box-shadow:0 4px 14px rgba(99,102,241,.35); animation:up .5s cubic-bezier(.22,1,.36,1) .4s both; }
        .btn-main:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 28px rgba(99,102,241,.4); }
        .btn-main:disabled { opacity:.6; cursor:not-allowed; }

        .spinner { width:18px; height:18px; border:2.5px solid rgba(255,255,255,.35); border-top-color:white; border-radius:50%; animation:spin .65s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }

        .divider { display:flex; align-items:center; gap:12px; margin:20px 0; color:#94a3b8; font-size:13px; font-weight:500; animation:up .5s cubic-bezier(.22,1,.36,1) .45s both; }
        .divider::before,.divider::after { content:''; flex:1; height:1px; background:#e2e8f0; }

        .btn-google { width:100%; height:50px; border:1.5px solid #e2e8f0; border-radius:12px; background:white; font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:600; color:#334155; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition:border-color .2s,box-shadow .2s,transform .2s; margin-bottom:20px; box-shadow:0 1px 3px rgba(0,0,0,.04); animation:up .5s cubic-bezier(.22,1,.36,1) .5s both; }
        .btn-google:hover:not(:disabled) { border-color:#a5b4fc; box-shadow:0 4px 14px rgba(99,102,241,.1); transform:translateY(-1px); }
        .btn-google:disabled { opacity:.6; cursor:not-allowed; }
        .g-ico { width:20px; height:20px; }

        .foot { text-align:center; font-size:13.5px; color:#64748b; animation:up .5s cubic-bezier(.22,1,.36,1) .55s both; }
        .foot a { color:#4f46e5; font-weight:700; text-decoration:none; }
        .foot a:hover { text-decoration:underline; }

        @media(max-width:900px) { .panel-left{display:none;} .panel-right{width:100%;padding:40px 24px;} }
        @media(max-width:480px) { .name-row{grid-template-columns:1fr;} }
      `}</style>

      <div className="page">
        <div className="panel-left">
          <div className="left-wrap">
            <div className="badge"><div className="badge-dot" />AI Expense Tracker</div>
            <h1 className="left-title">Understand where<br />your money <span>goes.</span></h1>
            <p className="left-sub">AI categorises every transaction, spots patterns, and gives you a clear picture of your finances.</p>

            <div className="proof-row">
              <div className="proof-item"><span className="proof-val blue">{users.toLocaleString()}+</span><span className="proof-lbl">Active users</span></div>
              <div className="proof-sep" />
              <div className="proof-item"><span className="proof-val">${saved}M+</span><span className="proof-lbl">Total saved</span></div>
              <div className="proof-sep" />
              <div className="proof-item"><span className="proof-val">AI</span><span className="proof-lbl">Powered</span></div>
            </div>

            <div className="breakdown">
              <div className="bd-hd"><span className="bd-title">Category Breakdown</span><span className="bd-month">Feb 2026</span></div>
              <div className="cat-list">
                {CATEGORIES.map((c, i) => (
                  <div className="cat-item" key={c.label}>
                    <div className="cat-top">
                      <div className="cat-name"><div className="cat-em" style={{ background: c.light }}>{c.icon}</div>{c.label}</div>
                      <span className="cat-pct">{c.pct}%</span>
                    </div>
                    <div className="prog-bg">
                      <div className="prog-fill" style={{ width: `${c.pct * 3.1}%`, background: `linear-gradient(90deg,${c.color}88,${c.color})`, animationDelay: `${.18 * i + .5}s` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="ai-rotator">
              <div className="ai-chip">✨</div>
              <div className={`ai-txt ${insightOn ? "on" : "off"}`}><b>AI:</b> {AI_INSIGHTS[insightIdx]}</div>
            </div>
          </div>
        </div>

        <div className="panel-right">
          <div className="form-hd">
            <h2 className="form-title">Create account</h2>
            <p className="form-sub">Start tracking your expenses today — it's free</p>
          </div>

          {error   && <div className="alert-box a-error">⚠ {error}</div>}
          {success && <div className="alert-box a-success">✓ {success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="name-row">
              <div>
                <label className="field-lbl">First name</label>
                <div className="inp-wrap">
                  <span className="inp-ico"><User size={15} /></span>
                  <input className="auth-input" name="first_name" type="text" placeholder="Jane"
                    value={form.first_name} onChange={handleChange} required disabled={submitting} />
                </div>
              </div>
              <div>
                <label className="field-lbl">Last name</label>
                <div className="inp-wrap">
                  <input className="auth-input" style={{ paddingLeft: 14 }} name="last_name" type="text" placeholder="Doe"
                    value={form.last_name} onChange={handleChange} required disabled={submitting} />
                </div>
              </div>
            </div>

            <div className="field" style={{ animationDelay: ".2s" }}>
              <label className="field-lbl">Email address</label>
              <div className="inp-wrap">
                <span className="inp-ico"><Mail size={15} /></span>
                <input className="auth-input" name="email" type="email" placeholder="you@example.com"
                  value={form.email} onChange={handleChange} required disabled={submitting} />
              </div>
            </div>

            <div className="field" style={{ marginBottom: 4, animationDelay: ".28s" }}>
              <label className="field-lbl">Password</label>
              <div className="inp-wrap">
                <span className="inp-ico"><Lock size={15} /></span>
                <input className="auth-input" name="password" type={showPw ? "text" : "password"} placeholder="Min. 6 characters"
                  value={form.password} onChange={handleChange} required disabled={submitting} />
                <button type="button" className="toggle" onClick={() => setShowPw(v => !v)} tabIndex={-1}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {form.password.length > 0 && (
              <>
                <div className="str-bars">
                  {[0, 1, 2, 3].map(i => <div key={i} className="str-bar" style={{ background: i < strength ? S_COLOR[strength] : "#e2e8f0" }} />)}
                </div>
                <p className="str-txt" style={{ color: S_COLOR[strength], marginBottom: 14 }}>{S_LABEL[strength]}</p>
              </>
            )}

            <div style={{ marginBottom: 20 }} />

            <button type="submit" className="btn-main" disabled={submitting || !!success}>
              {submitting ? <span className="spinner" /> : <>Create Account <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="divider">or</div>

          <button className="btn-google" onClick={handleGoogle} disabled={googleBusy}>
            {googleBusy
              ? <span className="spinner" style={{ borderColor: "rgba(0,0,0,.15)", borderTopColor: "#6366f1" }} />
              : <><img className="g-ico" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" />Continue with Google</>
            }
          </button>

          <p className="foot">Already have an account? <Link to="/login">Sign in</Link></p>
        </div>
      </div>
    </>
  );
}