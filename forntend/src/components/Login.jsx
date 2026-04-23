import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "./useAuth";
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";

function useCounter(target, duration = 1800, start = false) {
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

const TRANSACTIONS = [
  { emoji: "Coffee", name: "Starbucks", amt: "-$5.40", color: "#ef4444", delay: 0 },
  { emoji: "Cart", name: "Groceries", amt: "-$62.30", color: "#f97316", delay: 500 },
  { emoji: "Cash", name: "Salary", amt: "+$4,200", color: "#10b981", delay: 1000 },
  { emoji: "Play", name: "Netflix", amt: "-$15.99", color: "#ef4444", delay: 1500 },
  { emoji: "Bill", name: "Electricity", amt: "-$88.00", color: "#f97316", delay: 2000 },
];

const ERROR_MESSAGES = {
  missing_code: "Google sign-in was cancelled. Please try again.",
  oauth_failed: "Google sign-in failed. Please try again.",
  session_not_created: "Google sign-in completed, but the app session was not created. Please try again.",
  email_conflict: "This email is already registered with a password. Please sign in with email and password.",
};

const INITIAL_RECOVERY = {
  open: false,
  step: "request",
  email: "",
  otp: "",
  newPassword: "",
  confirmPassword: "",
  info: "",
  error: "",
  loading: false,
  verified: false,
  resendIn: 0,
};

function formatSeconds(value) {
  return value > 0 ? `${value}s` : "now";
}

export default function Login() {
  const {
    user,
    loading,
    login,
    loginWithGoogle,
    requestPasswordResetOtp,
    resendPasswordResetOtp,
    verifyPasswordResetOtp,
    resetPasswordWithOtp,
  } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const emailRef = useRef(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState("");
  const [counting, setCounting] = useState(false);
  const [recovery, setRecovery] = useState(INITIAL_RECOVERY);

  const saved = useCounter(842, 2000, counting);
  const spent = useCounter(3248, 2200, counting);

  useEffect(() => {
    const err = searchParams.get("error");
    if (err && ERROR_MESSAGES[err]) setError(ERROR_MESSAGES[err]);
  }, [searchParams]);

  useEffect(() => {
    if (!loading && user) navigate("/expenses", { replace: true });
  }, [user, loading, navigate]);

  useEffect(() => {
    emailRef.current?.focus();
    const t = setTimeout(() => setCounting(true), 400);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (recovery.resendIn <= 0) return undefined;
    const timer = setTimeout(() => {
      setRecovery((prev) => ({ ...prev, resendIn: Math.max(0, prev.resendIn - 1) }));
    }, 1000);
    return () => clearTimeout(timer);
  }, [recovery.resendIn]);

  const updateRecovery = (patch) => setRecovery((prev) => ({ ...prev, ...patch }));

  const openRecovery = () => {
    setRecovery({
      ...INITIAL_RECOVERY,
      open: true,
      email,
    });
  };

  const closeRecovery = () => {
    setRecovery(INITIAL_RECOVERY);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login({ email, password });
      navigate("/expenses", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = () => {
    setGoogleBusy(true);
    setError("");
    loginWithGoogle();
  };

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    updateRecovery({ loading: true, error: "", info: "" });
    try {
      const data = await requestPasswordResetOtp({ email: recovery.email });
      updateRecovery({
        loading: false,
        step: "verify",
        info: `OTP sent to ${data.maskedEmail}.`,
        resendIn: 60,
      });
    } catch (err) {
      updateRecovery({ loading: false, error: err.message });
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    updateRecovery({ loading: true, error: "", info: "" });
    try {
      const data = await verifyPasswordResetOtp({ email: recovery.email, otp: recovery.otp });
      updateRecovery({
        loading: false,
        step: "reset",
        verified: true,
        info: data.message,
      });
    } catch (err) {
      updateRecovery({ loading: false, error: err.message });
    }
  };

  const handleResendOtp = async () => {
    updateRecovery({ loading: true, error: "", info: "" });
    try {
      const data = await resendPasswordResetOtp({ email: recovery.email });
      updateRecovery({
        loading: false,
        otp: "",
        info: `A new OTP was sent to ${data.maskedEmail}.`,
        resendIn: 60,
      });
    } catch (err) {
      updateRecovery({ loading: false, error: err.message });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (recovery.newPassword !== recovery.confirmPassword) {
      updateRecovery({ error: "Passwords do not match." });
      return;
    }
    updateRecovery({ loading: true, error: "", info: "" });
    try {
      const data = await resetPasswordWithOtp({ email: recovery.email, password: recovery.newPassword });
      setPassword("");
      setEmail(recovery.email);
      updateRecovery({
        ...INITIAL_RECOVERY,
        open: true,
        step: "success",
        email: recovery.email,
        info: data.message,
      });
    } catch (err) {
      updateRecovery({ loading: false, error: err.message });
    }
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
          padding:56px 48px; border-right:1px solid #f1f5f9;
        }
        .panel-left::before { content:''; position:absolute; inset:0; background-image:radial-gradient(circle,#e2e8f0 1px,transparent 1px); background-size:28px 28px; opacity:.55; pointer-events:none; }
        .panel-left::after { content:''; position:absolute; width:500px; height:500px; border-radius:50%; background:radial-gradient(circle,rgba(59,130,246,.08) 0%,transparent 65%); top:-160px; left:-160px; pointer-events:none; animation:breathe 8s ease-in-out infinite; }
        @keyframes breathe { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.12);opacity:1} }
        .left-wrap { position:relative; z-index:2; width:100%; max-width:380px; }
        .badge { display:inline-flex; align-items:center; gap:7px; border:1.5px solid #dbeafe; background:#eff6ff; color:#2563eb; font-size:11px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; padding:5px 13px; border-radius:999px; margin-bottom:28px; }
        .badge-dot { width:6px; height:6px; border-radius:50%; background:#3b82f6; animation:dot 2s ease-in-out infinite; }
        @keyframes dot { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(59,130,246,.4)} 50%{opacity:.4;box-shadow:0 0 0 5px rgba(59,130,246,0)} }
        .left-title { font-size:clamp(28px,3vw,40px); font-weight:800; color:#0f172a; line-height:1.18; margin-bottom:10px; animation:up .6s cubic-bezier(.22,1,.36,1) .1s both; }
        .left-title span { color:#3b82f6; }
        .left-sub { font-size:13.5px; color:#64748b; line-height:1.7; margin-bottom:36px; animation:up .6s cubic-bezier(.22,1,.36,1) .2s both; }
        @keyframes up { from{opacity:0;transform:translateY(22px)} to{opacity:1;transform:translateY(0)} }
        .stats-row { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:20px; animation:up .6s cubic-bezier(.22,1,.36,1) .3s both; }
        .stat-box { background:#f8fafc; border:1.5px solid #f1f5f9; border-radius:14px; padding:16px; transition:border-color .2s,box-shadow .2s; }
        .stat-box:hover { border-color:#bfdbfe; box-shadow:0 4px 16px rgba(59,130,246,.08); }
        .stat-lbl { font-size:11px; font-weight:600; color:#94a3b8; text-transform:uppercase; letter-spacing:.07em; margin-bottom:6px; }
        .stat-val { font-size:26px; font-weight:800; color:#0f172a; letter-spacing:-1px; line-height:1; }
        .stat-val.green { color:#10b981; }
        .stat-chg { font-size:11px; font-weight:600; color:#10b981; margin-top:4px; }
        .stat-chg.red { color:#ef4444; }
        .feed-card { border:1.5px solid #f1f5f9; border-radius:16px; overflow:hidden; background:#f8fafc; animation:up .6s cubic-bezier(.22,1,.36,1) .4s both; }
        .feed-hd { padding:12px 16px; display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #f1f5f9; background:white; }
        .feed-title { font-size:12px; font-weight:700; color:#475569; text-transform:uppercase; letter-spacing:.06em; }
        .feed-live { display:flex; align-items:center; gap:5px; font-size:11px; font-weight:600; color:#10b981; }
        .live-dot { width:6px; height:6px; border-radius:50%; background:#10b981; animation:pulse 1.5s ease-in-out infinite; }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.7)} }
        .tx-row { display:flex; align-items:center; justify-content:space-between; padding:10px 16px; border-bottom:1px solid #f1f5f9; background:white; opacity:0; animation:slide-r .5s cubic-bezier(.22,1,.36,1) forwards; }
        .tx-row:last-child { border-bottom:none; }
        @keyframes slide-r { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
        .tx-l { display:flex; align-items:center; gap:10px; }
        .tx-ic { min-width:48px; height:34px; padding:0 8px; border-radius:10px; background:#f1f5f9; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; color:#475569; flex-shrink:0; }
        .tx-nm { font-size:13px; font-weight:600; color:#1e293b; }
        .tx-tm { font-size:11px; color:#94a3b8; margin-top:1px; }
        .tx-am { font-size:13px; font-weight:700; }
        .panel-right { width:460px; display:flex; flex-direction:column; justify-content:center; padding:56px 52px; background:#f8fafc; overflow-y:auto; }
        .form-hd { margin-bottom:32px; animation:up .5s cubic-bezier(.22,1,.36,1) .05s both; }
        .form-title { font-size:30px; font-weight:800; color:#0f172a; margin-bottom:6px; }
        .form-sub { font-size:14px; color:#64748b; }
        .alert-box { padding:12px 16px; border-radius:10px; font-size:13.5px; margin-bottom:20px; display:flex; align-items:center; gap:8px; }
        .a-error { background:#fef2f2; color:#b91c1c; border:1px solid #fecaca; }
        .field { margin-bottom:20px; animation:up .5s cubic-bezier(.22,1,.36,1) both; }
        .field-lbl { display:block; font-size:12.5px; font-weight:700; color:#334155; margin-bottom:7px; }
        .inp-wrap { position:relative; }
        .inp-ico { position:absolute; left:14px; top:50%; transform:translateY(-50%); color:#94a3b8; display:flex; pointer-events:none; }
        .auth-input { width:100%; height:48px; padding:0 44px; border:1.5px solid #e2e8f0; border-radius:12px; background:white; font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:500; color:#0f172a; transition:border-color .2s,box-shadow .2s; outline:none; box-shadow:0 1px 3px rgba(0,0,0,.04); }
        .auth-input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.1); }
        .auth-input::placeholder { color:#cbd5e1; font-weight:400; }
        .toggle { position:absolute; right:14px; top:50%; transform:translateY(-50%); background:none; border:none; cursor:pointer; color:#94a3b8; display:flex; padding:4px; transition:color .2s; }
        .toggle:hover { color:#3b82f6; }
        .forgot-row { display:flex; justify-content:flex-end; margin:-8px 0 20px; }
        .link-btn { background:none; border:none; color:#2563eb; font-size:13px; font-weight:700; cursor:pointer; }
        .link-btn:hover { text-decoration:underline; }
        .btn-main { width:100%; height:50px; border:none; border-radius:12px; background:linear-gradient(135deg,#1d4ed8,#3b82f6); color:white; font-family:'Plus Jakarta Sans',sans-serif; font-size:15px; font-weight:700; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px; transition:transform .2s,box-shadow .2s; margin-bottom:16px; box-shadow:0 4px 14px rgba(59,130,246,.35); animation:up .5s cubic-bezier(.22,1,.36,1) .35s both; }
        .btn-main:hover:not(:disabled) { transform:translateY(-2px); box-shadow:0 10px 28px rgba(59,130,246,.4); }
        .btn-main:disabled, .btn-secondary:disabled { opacity:.6; cursor:not-allowed; }
        .btn-secondary { width:100%; height:46px; border:1.5px solid #cbd5e1; border-radius:12px; background:white; color:#334155; font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:700; cursor:pointer; }
        .spinner { width:18px; height:18px; border:2.5px solid rgba(255,255,255,.35); border-top-color:white; border-radius:50%; animation:spin .65s linear infinite; }
        @keyframes spin { to{transform:rotate(360deg)} }
        .divider { display:flex; align-items:center; gap:12px; margin:20px 0; color:#94a3b8; font-size:13px; font-weight:500; animation:up .5s cubic-bezier(.22,1,.36,1) .4s both; }
        .divider::before,.divider::after { content:''; flex:1; height:1px; background:#e2e8f0; }
        .btn-google { width:100%; height:50px; border:1.5px solid #e2e8f0; border-radius:12px; background:white; font-family:'Plus Jakarta Sans',sans-serif; font-size:14px; font-weight:600; color:#334155; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:10px; transition:border-color .2s,box-shadow .2s,transform .2s; margin-bottom:20px; box-shadow:0 1px 3px rgba(0,0,0,.04); animation:up .5s cubic-bezier(.22,1,.36,1) .45s both; }
        .btn-google:hover:not(:disabled) { border-color:#93c5fd; box-shadow:0 4px 14px rgba(59,130,246,.1); transform:translateY(-1px); }
        .btn-google:disabled { opacity:.6; cursor:not-allowed; }
        .g-ico { width:20px; height:20px; }
        .foot { text-align:center; font-size:13.5px; color:#64748b; animation:up .5s cubic-bezier(.22,1,.36,1) .5s both; }
        .foot a { color:#2563eb; font-weight:700; text-decoration:none; }
        .foot a:hover { text-decoration:underline; }
        .modal-backdrop { position:fixed; inset:0; background:rgba(15,23,42,.55); backdrop-filter:blur(10px); display:flex; align-items:center; justify-content:center; padding:20px; z-index:40; }
        .modal-card { width:min(100%,460px); background:#ffffff; border-radius:24px; box-shadow:0 32px 70px rgba(15,23,42,.35); padding:28px; }
        .modal-chip { display:inline-flex; align-items:center; gap:8px; padding:7px 12px; border-radius:999px; background:#eff6ff; color:#1d4ed8; font-size:12px; font-weight:700; margin-bottom:14px; }
        .modal-title { font-size:26px; font-weight:800; color:#0f172a; margin-bottom:8px; }
        .modal-sub { font-size:14px; color:#64748b; line-height:1.7; margin-bottom:20px; }
        .modal-info { margin-bottom:16px; padding:12px 14px; border-radius:12px; background:#eff6ff; color:#1d4ed8; font-size:13px; border:1px solid #bfdbfe; }
        .otp-grid { display:grid; grid-template-columns:1fr auto; gap:12px; align-items:end; }
        .modal-actions { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:18px; }
        .mini-note { margin-top:10px; font-size:12.5px; color:#64748b; text-align:center; }
        .success-pane { text-align:center; padding:6px 0 4px; }
        .success-icon { width:58px; height:58px; border-radius:18px; margin:0 auto 14px; display:flex; align-items:center; justify-content:center; background:linear-gradient(135deg,#dcfce7,#bbf7d0); color:#15803d; }
        @media(max-width:900px) { .panel-left{display:none;} .panel-right{width:100%;padding:40px 24px;} }
        @media(max-width:520px) { .modal-actions, .otp-grid { grid-template-columns:1fr; } .modal-card { padding:22px; } }
      `}</style>

      <div className="page">
        <div className="panel-left">
          <div className="left-wrap">
            <div className="badge"><div className="badge-dot" />AI Expense Tracker</div>
            <h1 className="left-title">Track every<br />rupee with <span>AI.</span></h1>
            <p className="left-sub">Smart categorisation, real-time insights, and budget alerts - all powered by AI.</p>
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-lbl">Saved</div>
                <div className="stat-val green">${saved}</div>
                <div className="stat-chg">Up 18% this month</div>
              </div>
              <div className="stat-box">
                <div className="stat-lbl">Total Spent</div>
                <div className="stat-val">${spent.toLocaleString()}</div>
                <div className="stat-chg red">Down 12% vs last</div>
              </div>
            </div>
            <div className="feed-card">
              <div className="feed-hd">
                <span className="feed-title">Recent Transactions</span>
                <span className="feed-live"><span className="live-dot" />Live</span>
              </div>
              {TRANSACTIONS.map((tx) => (
                <div className="tx-row" key={tx.name} style={{ animationDelay: `${tx.delay + 500}ms` }}>
                  <div className="tx-l">
                    <div className="tx-ic">{tx.emoji}</div>
                    <div>
                      <div className="tx-nm">{tx.name}</div>
                      <div className="tx-tm">Just now</div>
                    </div>
                  </div>
                  <div className="tx-am" style={{ color: tx.color }}>{tx.amt}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="panel-right">
          <div className="form-hd">
            <h2 className="form-title">Welcome back</h2>
            <p className="form-sub">Sign in to your expense dashboard</p>
          </div>

          {error && <div className="alert-box a-error">Warning: {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="field" style={{ animationDelay: ".15s" }}>
              <label className="field-lbl">Email address</label>
              <div className="inp-wrap">
                <span className="inp-ico"><Mail size={15} /></span>
                <input
                  ref={emailRef}
                  className="auth-input"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="field" style={{ animationDelay: ".25s" }}>
              <label className="field-lbl">Password</label>
              <div className="inp-wrap">
                <span className="inp-ico"><Lock size={15} /></span>
                <input
                  className="auth-input"
                  type={showPw ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={submitting}
                />
                <button type="button" className="toggle" onClick={() => setShowPw((v) => !v)} tabIndex={-1}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="forgot-row">
              <button type="button" className="link-btn" onClick={openRecovery}>
                Forgot password?
              </button>
            </div>
            <button type="submit" className="btn-main" disabled={submitting}>
              {submitting ? <span className="spinner" /> : <>Sign In <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="divider">or</div>

          <button className="btn-google" onClick={handleGoogle} disabled={googleBusy}>
            {googleBusy
              ? <span className="spinner" style={{ borderColor: "rgba(0,0,0,.15)", borderTopColor: "#3b82f6" }} />
              : <><img className="g-ico" src="https://www.svgrepo.com/show/475656/google-color.svg" alt="G" />Continue with Google</>
            }
          </button>

          <p className="foot">Don't have an account? <Link to="/signup">Create one free</Link></p>
        </div>
      </div>

      {recovery.open && (
        <div className="modal-backdrop">
          <div className="modal-card">
            {recovery.step !== "success" ? (
              <>
                <div className="modal-chip"><ShieldCheck size={14} />Secure recovery</div>
                <h3 className="modal-title">Forgot password</h3>
                <p className="modal-sub">
                  {recovery.step === "request" && "Enter your account email to receive a one-time password."}
                  {recovery.step === "verify" && "Check your email, enter the OTP, and continue to the password reset step."}
                  {recovery.step === "reset" && "Create a new password after the OTP has been verified successfully."}
                </p>
                {recovery.error && <div className="alert-box a-error">Warning: {recovery.error}</div>}
                {recovery.info && <div className="modal-info">{recovery.info}</div>}

                {recovery.step === "request" && (
                  <form onSubmit={handleRequestOtp}>
                    <div className="field">
                      <label className="field-lbl">Email address</label>
                      <div className="inp-wrap">
                        <span className="inp-ico"><Mail size={15} /></span>
                        <input
                          className="auth-input"
                          type="email"
                          placeholder="you@example.com"
                          value={recovery.email}
                          onChange={(e) => updateRecovery({ email: e.target.value })}
                          required
                          disabled={recovery.loading}
                        />
                      </div>
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="btn-secondary" onClick={closeRecovery}>Cancel</button>
                      <button type="submit" className="btn-main" disabled={recovery.loading}>
                        {recovery.loading ? <span className="spinner" /> : "Send OTP"}
                      </button>
                    </div>
                  </form>
                )}

                {recovery.step === "verify" && (
                  <form onSubmit={handleVerifyOtp}>
                    <div className="otp-grid">
                      <div className="field" style={{ marginBottom: 0 }}>
                        <label className="field-lbl">6-digit OTP</label>
                        <div className="inp-wrap">
                          <span className="inp-ico"><ShieldCheck size={15} /></span>
                          <input
                            className="auth-input"
                            type="text"
                            placeholder="123456"
                            value={recovery.otp}
                            onChange={(e) => updateRecovery({ otp: e.target.value.replace(/\D/g, "").slice(0, 6) })}
                            required
                            disabled={recovery.loading}
                          />
                        </div>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleResendOtp}
                        disabled={recovery.loading || recovery.resendIn > 0}
                      >
                        {recovery.resendIn > 0 ? `Resend in ${formatSeconds(recovery.resendIn)}` : "Resend OTP"}
                      </button>
                    </div>
                    <p className="mini-note">Need a new code? You can resend once the timer reaches zero.</p>
                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => updateRecovery({ step: "request", otp: "", error: "", info: "" })}
                      >
                        Change email
                      </button>
                      <button type="submit" className="btn-main" disabled={recovery.loading || recovery.otp.length !== 6}>
                        {recovery.loading ? <span className="spinner" /> : "Verify OTP"}
                      </button>
                    </div>
                  </form>
                )}

                {recovery.step === "reset" && (
                  <form onSubmit={handleResetPassword}>
                    <div className="field">
                      <label className="field-lbl">New password</label>
                      <div className="inp-wrap">
                        <span className="inp-ico"><Lock size={15} /></span>
                        <input
                          className="auth-input"
                          type="password"
                          placeholder="Minimum 6 characters"
                          value={recovery.newPassword}
                          onChange={(e) => updateRecovery({ newPassword: e.target.value })}
                          required
                          disabled={recovery.loading}
                        />
                      </div>
                    </div>
                    <div className="field">
                      <label className="field-lbl">Confirm password</label>
                      <div className="inp-wrap">
                        <span className="inp-ico"><Lock size={15} /></span>
                        <input
                          className="auth-input"
                          type="password"
                          placeholder="Re-enter your new password"
                          value={recovery.confirmPassword}
                          onChange={(e) => updateRecovery({ confirmPassword: e.target.value })}
                          required
                          disabled={recovery.loading}
                        />
                      </div>
                    </div>
                    <div className="modal-actions">
                      <button type="button" className="btn-secondary" onClick={closeRecovery}>Close</button>
                      <button type="submit" className="btn-main" disabled={recovery.loading}>
                        {recovery.loading ? <span className="spinner" /> : "Reset password"}
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <div className="success-pane">
                <div className="success-icon"><ShieldCheck size={28} /></div>
                <h3 className="modal-title">Password updated</h3>
                <p className="modal-sub">{recovery.info || "Your password has been reset successfully."}</p>
                <button type="button" className="btn-main" onClick={closeRecovery}>Back to login</button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
