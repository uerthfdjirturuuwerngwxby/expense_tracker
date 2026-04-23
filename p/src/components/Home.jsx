import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// ─────────────────────────────────────────────────────────────────────────────
//  THREE.JS
// ─────────────────────────────────────────────────────────────────────────────
async function buildScene(canvas) {
  let THREE;
  try { THREE = await import('three'); }
  catch (e) { console.warn('Three.js unavailable', e); return null; }

  const W = window.innerWidth, H = window.innerHeight;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(W, H);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf0eeff);
  scene.fog = new THREE.Fog(0xf0eeff, 45, 105);

  const camera = new THREE.PerspectiveCamera(50, W / H, 0.1, 200);
  camera.position.set(0, 5, 82);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 1.2));
  const sun = new THREE.DirectionalLight(0xffffff, 0.8);
  sun.position.set(10, 20, 15); scene.add(sun);

  const C = { indigo:0x6366f1, amber:0xf59e0b, emerald:0x10b981, rose:0xf43f5e, gold:0xfbbf24 };
  const pI = new THREE.PointLight(C.indigo, 2.6, 32); pI.position.set(-8, 6, 10); scene.add(pI);
  const pA = new THREE.PointLight(C.amber,  2.1, 26); pA.position.set(10,-3,  6); scene.add(pA);
  const pE = new THREE.PointLight(C.emerald,1.9, 26); pE.position.set( 0,10, -6); scene.add(pE);

  const M = (col, o={}) => new THREE.MeshStandardMaterial({ color:col, roughness:0.2, metalness:0.12, transparent:true, opacity:0.88, ...o });

  const barDefs = [
    {h:3.5,c:C.indigo,x:-9.6},{h:2.0,c:C.amber,x:-7.8},{h:4.8,c:C.indigo,x:-6.0},
    {h:3.1,c:C.amber,x:-4.2},{h:5.6,c:C.emerald,x:-2.4},{h:3.8,c:C.amber,x:-0.6},
    {h:6.4,c:C.indigo,x:1.2},{h:2.5,c:C.amber,x:3.0},{h:7.2,c:C.emerald,x:4.8},
    {h:4.3,c:C.amber,x:6.6},{h:8.0,c:C.indigo,x:8.4},
  ];
  const bars = [];
  barDefs.forEach(({h,c,x}) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(1.1,h,1.1), M(c));
    p.position.set(x,h/2-9,-6); p.userData={baseY:p.position.y,ph:Math.random()*Math.PI*2};
    scene.add(p);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.55,0.55,0.2,16), M(c,{opacity:1}));
    cap.position.set(x,h-9+0.1,-6); cap.userData={baseY:cap.position.y,ph:p.userData.ph};
    scene.add(cap);
    bars.push(p,cap);
  });

  const donutGroup = new THREE.Group();
  donutGroup.position.set(14,4,-1); scene.add(donutGroup);
  [{s:0,e:1.6,c:C.indigo},{s:1.6,e:3.2,c:C.amber},{s:3.2,e:4.9,c:C.emerald},{s:4.9,e:6.28,c:C.rose}]
    .forEach(({s,e,c})=>{
      const sh=new THREE.Shape();
      sh.absarc(0,0,2.9,s,e,false); sh.absarc(0,0,1.6,e,s,true);
      const mesh=new THREE.Mesh(new THREE.ExtrudeGeometry(sh,{depth:0.55,bevelEnabled:false}),M(c,{opacity:0.9}));
      mesh.position.z=-0.28; donutGroup.add(mesh);
    });

  const mkCoin=(sym)=>{
    const cv=document.createElement('canvas'); cv.width=cv.height=128;
    const ctx=cv.getContext('2d');
    const g=ctx.createRadialGradient(64,50,8,64,64,60);
    g.addColorStop(0,'#fde68a'); g.addColorStop(1,'#f59e0b');
    ctx.fillStyle=g; ctx.beginPath(); ctx.arc(64,64,60,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#b45309'; ctx.lineWidth=4; ctx.stroke();
    ctx.fillStyle='#78350f'; ctx.font='bold 62px Georgia';
    ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(sym,64,68);
    return new THREE.CanvasTexture(cv);
  };
  const texD=mkCoin('$'),texR=mkCoin('₹');
  const coins=[];
  for(let i=0;i<14;i++){
    const coin=new THREE.Mesh(new THREE.CylinderGeometry(0.6,0.6,0.14,28),[
      new THREE.MeshStandardMaterial({color:C.gold,roughness:0.1,metalness:0.9}),
      new THREE.MeshStandardMaterial({map:i%3===0?texR:texD}),
      new THREE.MeshStandardMaterial({map:i%3===0?texR:texD}),
    ]);
    const r=10+Math.random()*8,a=(i/14)*Math.PI*2+Math.random()*0.4;
    coin.position.set(Math.cos(a)*r,(Math.random()-0.5)*8,Math.sin(a)*r-7);
    coin.rotation.x=Math.random()*Math.PI;
    coin.userData={baseY:coin.position.y,ph:Math.random()*Math.PI*2,floatSpeed:0.4+Math.random()*0.5,rotSpeed:(Math.random()-0.5)*0.025};
    scene.add(coin); coins.push(coin);
  }

  const tYs=[-4.5,-3,-3.8,-1.5,-0.2,1.4,0.6,2.8,4.2,6,7.5];
  const tPts=tYs.map((y,i)=>new THREE.Vector3(i*1.6-8,y,0));
  const tLine=new THREE.Line(new THREE.BufferGeometry().setFromPoints(tPts),new THREE.LineBasicMaterial({color:C.emerald}));
  tLine.position.set(-10,3.5,2); scene.add(tLine);

  const dotMat=new THREE.MeshStandardMaterial({color:C.emerald,emissive:C.emerald,emissiveIntensity:0.4});
  const tDots=tPts.map(p=>{
    const d=new THREE.Mesh(new THREE.SphereGeometry(0.16,10,10),dotMat);
    d.position.set(tLine.position.x+p.x,tLine.position.y+p.y,tLine.position.z);
    d.userData={ph:Math.random()*Math.PI*2}; scene.add(d); return d;
  });

  const mkCard=(c1,c2,lbl)=>{
    const cv=document.createElement('canvas'); cv.width=320; cv.height=200;
    const ctx=cv.getContext('2d');
    const g=ctx.createLinearGradient(0,0,320,200); g.addColorStop(0,c1); g.addColorStop(1,c2);
    ctx.fillStyle=g; if(ctx.roundRect){ctx.roundRect(0,0,320,200,18);ctx.fill();}else{ctx.fillRect(0,0,320,200);}
    ctx.fillStyle='rgba(255,255,255,0.15)'; ctx.beginPath(); ctx.ellipse(260,40,80,80,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.9)';
    ctx.font='bold 26px sans-serif'; ctx.fillText('VISA',240,168);
    ctx.font='16px monospace'; ctx.fillText('•••• •••• •••• 4291',18,138);
    ctx.font='bold 20px sans-serif'; ctx.fillText(lbl,18,48);
    return new THREE.CanvasTexture(cv);
  };
  const cardMeshes=[
    {c1:'#6366f1',c2:'#8b5cf6',lbl:'Income',pos:[-15,2,4],rot:[0.1,0.3,0.08]},
    {c1:'#f59e0b',c2:'#f97316',lbl:'Expense',pos:[16,0,2],rot:[-0.05,-0.2,0.06]},
    {c1:'#10b981',c2:'#059669',lbl:'Savings',pos:[-12,-3,-2],rot:[0.15,0.4,-0.1]},
  ].map(({c1,c2,lbl,pos,rot})=>{
    const card=new THREE.Mesh(new THREE.BoxGeometry(3.8,2.4,0.07),[
      new THREE.MeshStandardMaterial({color:0xffffff}),new THREE.MeshStandardMaterial({color:0xffffff}),
      new THREE.MeshStandardMaterial({color:0xffffff}),new THREE.MeshStandardMaterial({color:0xffffff}),
      new THREE.MeshStandardMaterial({map:mkCard(c1,c2,lbl)}),
      new THREE.MeshStandardMaterial({color:0xd1d5db}),
    ]);
    card.position.set(...pos); card.rotation.set(...rot);
    card.userData={basePos:card.position.clone(),baseRot:{z:rot[2]},ph:Math.random()*Math.PI*2};
    scene.add(card); return card;
  });

  const pN=500,pPos=new Float32Array(pN*3),pCol=new Float32Array(pN*3);
  const pal=[new THREE.Color(0x6366f1),new THREE.Color(0xf59e0b),new THREE.Color(0x10b981),new THREE.Color(0xf43f5e)];
  for(let i=0;i<pN;i++){
    pPos[i*3]=(Math.random()-0.5)*70;pPos[i*3+1]=(Math.random()-0.5)*35;pPos[i*3+2]=(Math.random()-0.5)*50-10;
    const c=pal[i%4];pCol[i*3]=c.r;pCol[i*3+1]=c.g;pCol[i*3+2]=c.b;
  }
  const pGeo=new THREE.BufferGeometry();
  pGeo.setAttribute('position',new THREE.BufferAttribute(pPos,3));
  pGeo.setAttribute('color',new THREE.BufferAttribute(pCol,3));
  const particles=new THREE.Points(pGeo,new THREE.PointsMaterial({size:0.10,vertexColors:true,transparent:true,opacity:0.28}));
  scene.add(particles);

  const grid=new THREE.GridHelper(80,48,0xc7d2fe,0xe0e7ff);
  grid.position.y=-9.5; grid.material.transparent=true; grid.material.opacity=0.5;
  scene.add(grid);

  return { renderer, scene, camera, lights:{pI,pA,pE}, obj:{bars,donutGroup,coins,tLine,tDots,cardMeshes,particles} };
}

function makeAnimator({renderer,scene,camera,lights,obj}){
  let raf=null, targetZ=82;
  function tick(ms){
    const t=ms*0.001;
    const {bars,donutGroup,coins,tDots,cardMeshes,particles}=obj;
    const {pI,pA}=lights;
    bars.forEach(b=>{ if(b.userData.baseY!==undefined) b.position.y=b.userData.baseY+Math.sin(t*0.7+(b.userData.ph||0))*0.18; });
    donutGroup.rotation.z=t*0.09; donutGroup.rotation.x=Math.sin(t*0.12)*0.2;
    coins.forEach(c=>{ c.rotation.y+=c.userData.rotSpeed; c.position.y=c.userData.baseY+Math.sin(t*c.userData.floatSpeed+c.userData.ph)*0.6; });
    tDots.forEach(d=>d.scale.setScalar(1+Math.sin(t*1.8+d.userData.ph)*0.35));
    cardMeshes.forEach(card=>{ card.position.y=card.userData.basePos.y+Math.sin(t*0.55+card.userData.ph)*0.4; card.rotation.z=card.userData.baseRot.z+Math.sin(t*0.4+card.userData.ph)*0.03; });
    particles.rotation.y=t*0.01;
    pI.intensity=2.2+Math.sin(t*1.3)*0.4; pA.intensity=1.8+Math.cos(t*1.6)*0.35;
    camera.position.x=Math.sin(t*0.08)*1.8;
    camera.position.y=5+Math.cos(t*0.06)*0.7;
    camera.position.z+=(targetZ-camera.position.z)*0.032;
    camera.lookAt(0,0,0);
    renderer.render(scene,camera);
    raf=requestAnimationFrame(tick);
  }
  return {
    start(){ raf=requestAnimationFrame(tick); },
    stop(){ if(raf){cancelAnimationFrame(raf);raf=null;} },
    setZ(z){ targetZ=z; },
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  FEATURES DATA
// ─────────────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><polyline points="7 11 10 8 13 11 17 7"/></svg>,
    color:'#6366f1', bg:'#eef2ff',
    title:'Real-time 3D Charts',
    desc:'Bars, donuts, and trend lines update the moment you log a transaction.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>,
    color:'#f59e0b', bg:'#fffbeb',
    title:'Overspend Alerts',
    desc:'Get notified before you blow your budget — not after. Smart thresholds.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
    color:'#10b981', bg:'#ecfdf5',
    title:'Multi-account View',
    desc:'All your cards and UPI accounts in one beautiful 3D space.',
  },
  {
    icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    color:'#f43f5e', bg:'#fff1f2',
    title:'Savings Forecast',
    desc:'AI predicts your savings trajectory based on your spending patterns.',
  },
];

const NAV_LINKS = [
  {label:'Home',to:'/'},{label:'Expenses',to:'/expenses'},
  {label:'Analytics',to:'/analytics'},{label:'Profile',to:'/profile'},
];

// ─── Wallet + Chart icon (expense management themed) ───
const WalletIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    {/* Wallet body */}
    <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
    {/* Wallet flap / top fold */}
    <path d="M16 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/>
    {/* Coin circle (balance indicator) */}
    <circle cx="17.5" cy="14" r="1.5" fill="white" stroke="none"/>
  </svg>
);

// ─────────────────────────────────────────────────────────────────────────────
//  COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function Home({ user, onLogout }) {
  const canvasRef  = useRef(null);
  const animRef    = useRef(null);
  const builtRef   = useRef(null);
  const navigate   = useNavigate();
  const pillRef    = useRef(null);
  const linkRefs   = useRef([]);
  const lastScroll = useRef(0);
  const featRef    = useRef(null);

  const [scrollY,     setScrollY]     = useState(0);
  const [navSolid,    setNavSolid]    = useState(false);
  const [navHide,     setNavHide]     = useState(false);
  const [activeIdx,   setActiveIdx]   = useState(0);
  const [hoverIdx,    setHoverIdx]    = useState(null);
  const [pill,        setPill]        = useState({left:0,width:0,opacity:0});
  const [featVisible, setFeatVisible] = useState(false);

  useEffect(()=>{
    const canvas=canvasRef.current; if(!canvas) return;
    let anim=null;
    buildScene(canvas).then(built=>{
      if(!built) return;
      builtRef.current=built; anim=makeAnimator(built); animRef.current=anim; anim.start();
    });
    const onResize=()=>{
      const b=builtRef.current; if(!b) return;
      b.camera.aspect=window.innerWidth/window.innerHeight;
      b.camera.updateProjectionMatrix();
      b.renderer.setSize(window.innerWidth,window.innerHeight);
    };
    window.addEventListener('resize',onResize);
    return ()=>{ window.removeEventListener('resize',onResize); if(anim)anim.stop(); };
  },[]);

  useEffect(()=>{
    const handle=()=>{
      const sy=window.scrollY;
      const max=Math.max(document.body.scrollHeight-window.innerHeight,1);
      const pct=Math.min(sy/max,1);
      setScrollY(sy);
      setNavSolid(sy>30);
      setNavHide(sy>lastScroll.current+8&&sy>200);
      lastScroll.current=sy;
      if(animRef.current) animRef.current.setZ(Math.max(82-pct*62,20));
    };
    window.addEventListener('scroll',handle,{passive:true});
    return ()=>window.removeEventListener('scroll',handle);
  },[]);

  useEffect(()=>{
    const obs=new IntersectionObserver(([e])=>{ if(e.isIntersecting) setFeatVisible(true); },{threshold:0.1});
    if(featRef.current) obs.observe(featRef.current);
    return ()=>obs.disconnect();
  },[]);

  const updatePill=(idx)=>{
    const el=linkRefs.current[idx],con=pillRef.current;
    if(!el||!con) return;
    const cR=con.getBoundingClientRect(),eR=el.getBoundingClientRect();
    setPill({left:eR.left-cR.left,width:eR.width,opacity:1});
  };
  useEffect(()=>{ updatePill(hoverIdx!==null?hoverIdx:activeIdx); },[hoverIdx,activeIdx]);
  useEffect(()=>{ const t=setTimeout(()=>updatePill(0),120); return ()=>clearTimeout(t); },[]);

  const heroOpacity = Math.max(0,1-scrollY/320);
  const heroY       = Math.min(scrollY*0.15,80);
  const shieldOp    = Math.max(0,1-scrollY/180);

  return (
    <>
      <style>{CSS}</style>

      <canvas ref={canvasRef} style={{position:'fixed',top:0,left:0,width:'100vw',height:'100vh',zIndex:0,pointerEvents:'none'}}/>

      <div style={{
        position:'fixed',inset:0,zIndex:1,pointerEvents:'none',
        opacity:shieldOp,
        background:'radial-gradient(ellipse 110% 100% at 50% 40%, rgba(240,238,255,1) 0%, rgba(240,238,255,0.97) 30%, rgba(240,238,255,0.7) 58%, transparent 100%)',
        transition:'opacity 0.08s linear',
      }}/>

      <div style={{position:'relative',zIndex:10}}>

        {/* ═══════════ NAV ═══════════ */}
        <nav className={`nav${navSolid?' nav--solid':''}${navHide?' nav--hide':''}`}>
          <div className="nav-in">

            {/* Logo */}
            <Link to="/" className="logo" onClick={()=>setActiveIdx(0)}>
              <div className="logo-icon">
                <WalletIcon />
              </div>
              <span>ExpenseAI</span>
            </Link>

            {/* Pill nav — centered */}
            <div className="pill-nav" ref={pillRef}>
              <span className="pill-bg" style={{left:pill.left,width:pill.width,opacity:pill.opacity}}/>
              {NAV_LINKS.map((link,i)=>(
                <Link key={link.label} to={link.to} ref={el=>linkRefs.current[i]=el}
                  className={`pill-link${activeIdx===i?' pill-link--on':''}`}
                  onClick={()=>setActiveIdx(i)}
                  onMouseEnter={()=>setHoverIdx(i)} onMouseLeave={()=>setHoverIdx(null)}>
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Auth — far right, bigger */}
            <div className="nav-r">
              {user ? (
                <div className="user-row">
                  <div className="avatar">
                    <span className="avatar-letter">{(user.first_name||'U')[0].toUpperCase()}</span>
                  </div>
                  <div className="user-info">
                    <span className="uname">{user.first_name}</span>
                    <span className="urole">Member</span>
                  </div>
                  <button className="logout-btn" onClick={async()=>{if(onLogout)await onLogout();}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                      <polyline points="16 17 21 12 16 7"/>
                      <line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Logout
                  </button>
                </div>
              ) : (
                <div className="auth-row">
                  <Link to="/login" className="login-link">Login</Link>
                  <Link to="/signup" className="signup-link">
                    Get Started
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* ═══════════ HERO ═══════════ */}
        <section className="hero">
          <div className="hero-c" style={{opacity:heroOpacity,transform:`translateY(${heroY}px)`}}>
            <h1 className="h1">
              <span className="h1-a">Take control of</span>
              <span className="h1-b">
                <em className="accent">Every</em>
                <span className="plain"> rupee</span>
              </span>
            </h1>

            <p className="sub">
              Manage your income, expenses, and savings easily in one place<br/>
        
            </p>

            <div className="ctas">
              <button className="btn-main" onClick={()=>{setActiveIdx(1);navigate('/expenses');}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
                </svg>
                Start Tracking
              </button>
              <button className="btn-ghost" onClick={()=>{setActiveIdx(2);navigate('/analytics');}}>
                View Analytics →
              </button>
            </div>

            {/* Scroll cue */}
            <div className="scroll-nudge">
              <div className="mouse"><div className="wheel"/></div>
              <span>Scroll to explore</span>
            </div>
          </div>
        </section>

        {/* ═══════════ WHY EXPENSEAI ═══════════ */}
        <section className="why-section" ref={featRef}>
          <div className="why-bg"/>
          <div className="why-inner">
            <div className={`why-header${featVisible?' why-header--in':''}`}>
              <span className="why-eyebrow">WHY EXPENSEAI</span>
              <h2 className="why-h2">
                Built for clarity,<br/>
                <span className="why-h2-color">not complexity</span>
              </h2>
            </div>
            <div className="feat-grid">
              {FEATURES.map((f,i)=>(
                <div key={f.title}
                  className={`feat-card${featVisible?' feat-card--in':''}`}
                  style={{transitionDelay:`${featVisible?i*0.1:0}s`}}>
                  <div className="feat-icon-wrap" style={{background:f.bg,color:f.color}}>
                    {f.icon}
                  </div>
                  <div className="feat-body">
                    <h3 className="feat-title" style={{color:f.color}}>{f.title}</h3>
                    <p className="feat-desc">{f.desc}</p>
                  </div>
                  <span className="feat-arrow" style={{color:f.color}}>→</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ FOOTER CTA ═══════════ */}
        <section className="end-cta">
          <div className="cta-box">
            <p className="cta-tag">Free forever</p>
            <h2 className="cta-h">Take control of <span className="grad">every rupee</span></h2>
            <p className="cta-sub">Set up in 1 minute. Instantly beautiful.</p>
            <button className="btn-main btn-main--lg" onClick={()=>navigate('/signup')}>
              Create Free Account →
            </button>
          </div>
        </section>

        <footer className="foot">
          <div className="foot-brand">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/>
              <path d="M16 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v2"/>
              <circle cx="17.5" cy="14" r="1.5" fill="#6366f1" stroke="none"/>
            </svg>
            ExpenseAI
          </div>
          <p>© {new Date().getFullYear()} ExpenseAI · Experience your finances in a new dimension</p>
        </footer>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600&display=swap');

*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
body{font-family:'Instrument Sans',system-ui,sans-serif;background:#f0eeff;color:#1e1b4b;overflow-x:hidden;}

/* ─── NAV ─── */
.nav{
  position:fixed;top:0;left:0;right:0;z-index:200;
  padding:1rem 3rem;
  transition:transform 0.4s cubic-bezier(0.4,0,0.2,1),background 0.3s,box-shadow 0.3s,padding 0.3s;
}
.nav--solid{
  background:rgba(255,255,255,0.94);
  backdrop-filter:blur(24px) saturate(180%);
  box-shadow:0 1px 0 rgba(99,102,241,0.08),0 4px 24px rgba(99,102,241,0.06);
  padding:0.65rem 3rem;
}
.nav--hide{transform:translateY(-110%);}

/* Nav inner: logo | center pill | right auth — all on one true full-width row */
.nav-in{
  width:100%;
  display:grid;
  grid-template-columns:1fr auto 1fr;
  align-items:center;
  gap:1.5rem;
}

/* Logo */
.logo{
  display:flex;align-items:center;gap:0.6rem;
  font-family:'Bricolage Grotesque',sans-serif;
  font-weight:800;font-size:1.22rem;color:#1e1b4b;text-decoration:none;
  justify-self:start;
}
.logo-icon{
  width:42px;height:42px;border-radius:12px;
  background:linear-gradient(135deg,#6366f1 0%,#8b5cf6 60%,#a855f7 100%);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 4px 18px rgba(99,102,241,0.40);flex-shrink:0;
  transition:transform 0.28s cubic-bezier(0.34,1.56,0.64,1),box-shadow 0.25s;
}
.logo:hover .logo-icon{transform:scale(1.12) rotate(-8deg);box-shadow:0 8px 26px rgba(99,102,241,0.52);}

/* Pill nav — centered column */
.pill-nav{
  position:relative;display:flex;align-items:center;
  background:rgba(255,255,255,0.82);border:1px solid rgba(99,102,241,0.14);
  border-radius:9999px;padding:0.32rem;
  backdrop-filter:blur(14px);
  box-shadow:0 2px 14px rgba(99,102,241,0.08),inset 0 1px 0 rgba(255,255,255,0.85);
  justify-self:center;
}
.pill-bg{
  position:absolute;top:0.32rem;bottom:0.32rem;background:white;border-radius:9999px;
  box-shadow:0 2px 10px rgba(99,102,241,0.18),0 1px 3px rgba(0,0,0,0.06);
  transition:left 0.28s cubic-bezier(0.34,1.56,0.64,1),width 0.28s cubic-bezier(0.34,1.56,0.64,1),opacity 0.15s;
  pointer-events:none;z-index:0;
}
.pill-link{
  position:relative;z-index:1;padding:0.44rem 1.15rem;border-radius:9999px;
  font-size:0.88rem;font-weight:500;color:#64748b;text-decoration:none;
  transition:color 0.18s;white-space:nowrap;user-select:none;
}
.pill-link:hover{color:#6366f1;}
.pill-link--on{color:#6366f1;font-weight:700;}

/* Nav right — user/auth */
.nav-r{
  display:flex;align-items:center;justify-content:flex-end;
  justify-self:end;
}

/* User logged-in row */
.user-row{
  display:flex;align-items:center;gap:0.75rem;
  background:rgba(255,255,255,0.85);
  border:1.5px solid rgba(99,102,241,0.12);
  border-radius:9999px;
  padding:0.36rem 0.9rem 0.36rem 0.42rem;
  backdrop-filter:blur(12px);
  box-shadow:0 2px 12px rgba(99,102,241,0.07);
}

/* Big avatar */
.avatar{
  width:42px;height:42px;border-radius:50%;
  background:linear-gradient(135deg,#6366f1,#8b5cf6);
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 3px 12px rgba(99,102,241,0.38);
  flex-shrink:0;
}
.avatar-letter{
  font-size:1rem;font-weight:800;color:white;
  font-family:'Bricolage Grotesque',sans-serif;
  line-height:1;
}

.user-info{display:flex;flex-direction:column;gap:0.05rem;}
.uname{font-size:0.9rem;font-weight:700;color:#1e1b4b;line-height:1.1;}
.urole{font-size:0.7rem;font-weight:500;color:#94a3b8;letter-spacing:0.02em;}

.logout-btn{
  display:inline-flex;align-items:center;gap:0.36rem;
  background:#fee2e2;border:none;color:#b91c1c;
  padding:0.38rem 0.9rem;border-radius:9999px;
  font-size:0.8rem;font-weight:700;cursor:pointer;
  transition:background 0.18s,transform 0.18s;font-family:inherit;
}
.logout-btn:hover{background:#fecaca;transform:scale(1.03);}

/* Auth (logged out) */
.auth-row{display:flex;align-items:center;gap:0.9rem;}
.login-link{color:#64748b;text-decoration:none;font-size:0.88rem;font-weight:600;transition:color 0.18s;}
.login-link:hover{color:#6366f1;}
.signup-link{
  display:inline-flex;align-items:center;gap:0.4rem;
  background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;
  padding:0.48rem 1.2rem;border-radius:9999px;font-size:0.88rem;font-weight:700;
  text-decoration:none;box-shadow:0 4px 14px rgba(99,102,241,0.34);transition:all 0.22s;
}
.signup-link:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(99,102,241,0.46);}

/* ─── HERO — pushed down with large padding-top ─── */
.hero{
  height:100vh;
  display:flex;
  align-items:center;
  justify-content:center;
  padding:0 2rem;
  padding-top:14vh;   /* <— pushes heading noticeably lower */
  text-align:center;
}
.hero-c{max-width:960px;width:100%;}

.h1{
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:clamp(3.8rem,9.5vw,8.8rem);
  font-weight:800;line-height:0.92;letter-spacing:-0.04em;
  color:#1e1b4b;margin-bottom:1.6rem;
}
.h1-a{display:block;animation:fadeUp 0.75s 0.06s cubic-bezier(0.2,0.9,0.1,1) both;}
.h1-b{display:block;animation:fadeUp 0.75s 0.18s cubic-bezier(0.2,0.9,0.1,1) both;}
.plain{color:#1e1b4b;}

@keyframes fadeUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:translateY(0)}}

.accent{
  font-style:normal;
  background:linear-gradient(130deg,#6366f1 0%,#a855f7 48%,#f59e0b 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
  position:relative;
}
.accent::after{
  content:'';position:absolute;left:0;right:0;bottom:-3px;height:4px;
  background:linear-gradient(90deg,#6366f1,#f59e0b);border-radius:2px;opacity:0.35;
}

.sub{
  font-size:clamp(0.98rem,2vw,1.15rem);color:#4e5a7a;line-height:1.82;
  margin-bottom:2.4rem;
  animation:fadeUp 0.75s 0.3s cubic-bezier(0.2,0.9,0.1,1) both;
}

.ctas{
  display:flex;gap:0.9rem;justify-content:center;flex-wrap:wrap;
  margin-bottom:3.5rem;
  animation:fadeUp 0.75s 0.44s cubic-bezier(0.2,0.9,0.1,1) both;
}

.btn-main{
  display:inline-flex;align-items:center;gap:0.5rem;
  background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border:none;
  padding:0.86rem 1.9rem;border-radius:9999px;font-size:0.98rem;font-weight:700;
  cursor:pointer;box-shadow:0 8px 26px rgba(99,102,241,0.34);
  transition:all 0.24s;font-family:inherit;
}
.btn-main:hover{transform:translateY(-3px);box-shadow:0 14px 38px rgba(99,102,241,0.44);}
.btn-main--lg{padding:0.96rem 2.4rem;font-size:1.02rem;}

.btn-ghost{
  display:inline-flex;align-items:center;
  background:rgba(255,255,255,0.92);border:1.5px solid rgba(99,102,241,0.2);
  color:#4338ca;padding:0.86rem 1.7rem;border-radius:9999px;
  font-size:0.98rem;font-weight:600;cursor:pointer;
  transition:all 0.24s;font-family:inherit;backdrop-filter:blur(8px);
}
.btn-ghost:hover{background:white;border-color:rgba(99,102,241,0.45);transform:translateY(-2px);
  box-shadow:0 6px 16px rgba(99,102,241,0.12);}

/* Scroll nudge */
.scroll-nudge{
  display:flex;flex-direction:column;align-items:center;gap:0.55rem;
  font-size:0.76rem;color:#94a3b8;font-weight:600;letter-spacing:0.04em;
  animation:fadeUp 0.75s 0.58s cubic-bezier(0.2,0.9,0.1,1) both;
}
.mouse{width:24px;height:40px;border:2px solid rgba(99,102,241,0.28);border-radius:12px;
  display:flex;justify-content:center;padding-top:7px;}
.wheel{width:4px;height:8px;background:#6366f1;border-radius:2px;animation:wd 2s ease-in-out infinite;}
@keyframes wd{0%{opacity:1;transform:translateY(0)}78%{opacity:0;transform:translateY(13px)}100%{opacity:0}}

/* ─── WHY SECTION ─── */
.why-section{position:relative;padding:5.5rem 2rem 5rem;z-index:10;}
.why-bg{
  position:absolute;inset:0;
  background:rgba(238,237,255,0.88);
  backdrop-filter:blur(32px) saturate(170%);
  -webkit-backdrop-filter:blur(32px) saturate(170%);
  border-top:1.5px solid rgba(255,255,255,0.72);
  border-bottom:1px solid rgba(255,255,255,0.5);
}
.why-inner{position:relative;max-width:1180px;margin:0 auto;}
.why-header{
  text-align:center;margin-bottom:3.2rem;
  opacity:0;transform:translateY(24px);
  transition:opacity 0.65s cubic-bezier(0.2,0.9,0.1,1),transform 0.65s cubic-bezier(0.2,0.9,0.1,1);
}
.why-header--in{opacity:1;transform:translateY(0);}
.why-eyebrow{
  display:inline-block;
  font-size:0.68rem;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;
  color:#6366f1;background:rgba(99,102,241,0.08);
  border:1px solid rgba(99,102,241,0.16);
  padding:0.26rem 0.95rem;border-radius:9999px;margin-bottom:1rem;
}
.why-h2{
  font-family:'Bricolage Grotesque',sans-serif;
  font-size:clamp(2.1rem,4.2vw,3.4rem);
  font-weight:800;line-height:1.12;letter-spacing:-0.03em;color:#1e1b4b;
}
.why-h2-color{
  background:linear-gradient(130deg,#6366f1 0%,#a855f7 52%,#f59e0b 100%);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;
}

.feat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.2rem;}
.feat-card{
  background:rgba(255,255,255,0.92);
  border:1.5px solid rgba(255,255,255,1);
  border-radius:1.35rem;
  padding:1.65rem 1.4rem 1.4rem;
  display:flex;flex-direction:column;gap:1rem;
  box-shadow:0 2px 18px rgba(99,102,241,0.07),0 1px 3px rgba(0,0,0,0.04);
  backdrop-filter:blur(10px);
  opacity:0;transform:translateY(32px);
  transition:
    opacity 0.5s cubic-bezier(0.2,0.9,0.1,1),
    transform 0.5s cubic-bezier(0.2,0.9,0.1,1),
    box-shadow 0.22s;
}
.feat-card--in{opacity:1;transform:translateY(0);}
.feat-card:hover{box-shadow:0 10px 32px rgba(99,102,241,0.13);transform:translateY(-5px) !important;}
.feat-icon-wrap{
  width:48px;height:48px;border-radius:12px;
  display:flex;align-items:center;justify-content:center;flex-shrink:0;
  transition:transform 0.24s cubic-bezier(0.34,1.56,0.64,1);
}
.feat-card:hover .feat-icon-wrap{transform:scale(1.1) rotate(-5deg);}
.feat-body{flex:1;display:flex;flex-direction:column;gap:0.45rem;}
.feat-title{font-family:'Bricolage Grotesque',sans-serif;font-size:0.98rem;font-weight:800;line-height:1.25;}
.feat-desc{font-size:0.84rem;color:#64748b;line-height:1.68;}
.feat-arrow{font-size:1rem;font-weight:700;align-self:flex-start;transition:transform 0.18s;}
.feat-card:hover .feat-arrow{transform:translateX(4px);}

/* ─── END CTA ─── */
.end-cta{padding:5rem 2rem;text-align:center;}
.cta-box{
  max-width:540px;margin:0 auto;
  background:rgba(255,255,255,0.93);
  border:1.5px solid rgba(99,102,241,0.1);
  border-radius:2.2rem;padding:3.2rem 2.8rem;
  box-shadow:0 18px 56px rgba(99,102,241,0.1);
  backdrop-filter:blur(16px);
  display:flex;flex-direction:column;align-items:center;gap:0;
}
.cta-tag{display:inline-block;background:rgba(99,102,241,0.07);border:1px solid rgba(99,102,241,0.16);
  color:#6366f1;padding:0.26rem 0.9rem;border-radius:9999px;font-size:0.72rem;font-weight:700;
  letter-spacing:0.08em;text-transform:uppercase;margin-bottom:1rem;}
.cta-h{font-family:'Bricolage Grotesque',sans-serif;font-size:clamp(1.9rem,4vw,2.6rem);
  font-weight:800;color:#1e1b4b;line-height:1.15;letter-spacing:-0.02em;margin-bottom:0.6rem;}
.cta-sub{color:#94a3b8;margin-bottom:1.9rem;font-size:0.92rem;}
.grad{background:linear-gradient(130deg,#6366f1,#a855f7,#f59e0b);
  -webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}

/* ─── FOOTER ─── */
.foot{text-align:center;padding:2rem 1rem;border-top:1px solid rgba(99,102,241,0.07);
  color:#94a3b8;font-size:0.83rem;display:flex;flex-direction:column;align-items:center;gap:0.45rem;}
.foot-brand{display:flex;align-items:center;gap:0.38rem;font-weight:700;color:#64748b;font-size:0.92rem;}

/* Scrollbar */
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-track{background:#f1f5f9;}
::-webkit-scrollbar-thumb{background:rgba(99,102,241,0.25);border-radius:20px;}
::-webkit-scrollbar-thumb:hover{background:rgba(99,102,241,0.48);}

/* Responsive */
@media(max-width:1024px){.feat-grid{grid-template-columns:repeat(2,1fr);}}
@media(max-width:720px){
  .nav{padding:0.8rem 1.2rem;}
  .nav--solid{padding:0.6rem 1.2rem;}
  .nav-in{grid-template-columns:1fr auto;}
  .pill-nav{display:none;}
  .h1{font-size:clamp(3rem,13vw,5rem);}
  .ctas{flex-direction:column;align-items:center;}
  .feat-grid{grid-template-columns:1fr;}
  .cta-box{padding:2.2rem 1.6rem;}
}
`;