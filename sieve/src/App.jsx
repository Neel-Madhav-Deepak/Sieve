import { useState, useEffect, useRef, useCallback } from "react";

const ANTHROPIC_MODEL = "claude-sonnet-4-20250514";

// ── VOICE ─────────────────────────────────────────────────────────────────────
function speak(text, rate = 0.92, pitch = 0.95) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.rate = rate; u.pitch = pitch; u.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const pref = voices.find(v => v.name.includes("Google UK English Female") || v.name.includes("Samantha") || v.name.includes("Karen") || v.lang === "en-GB");
  if (pref) u.voice = pref;
  window.speechSynthesis.speak(u);
}

// ── CSS ───────────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    /* ── Deep Plum Palette ── */
    --void:    #0e0910;
    --deep:    #140d18;
    --surface: #1c1222;
    --elevated:#251830;
    --rim:     #352440;
    --muted:   #4e3860;
    --subtle:  #8b6fa0;
    --body:    #c4aed4;
    --bright:  #ecdff5;
    --white:   #f8f2ff;

    /* ── Gold ── */
    --gold:    #d4a847;
    --gold-lt: #f0c96a;
    --gold-dk: #9a7520;
    --glow-gold: 0 0 40px rgba(212,168,71,.2);
    --shadow-gold: 0 0 32px rgba(212,168,71,.18);

    /* ── Lavender accent (replaces teal) ── */
    --accent:    #b388e8;
    --accent-dk: #7c52c4;
    --accent-gl: rgba(179,136,232,.1);
    --glow-accent: 0 0 24px rgba(179,136,232,.3);

    /* ── Status ── */
    --ok:      #52c98a;
    --warn:    #e8a93a;
    --danger:  #e85c6a;

    --ff-disp: 'Cormorant Garamond', serif;
    --ff-body: 'DM Sans', sans-serif;
    --ff-mono: 'DM Mono', monospace;
    --r:       10px;
    --r-sm:    6px;
    --shadow:  0 8px 32px rgba(0,0,0,.5);
  }

  html { scroll-behavior: smooth; }
  body {
    background: var(--void); color: var(--bright);
    font-family: var(--ff-body); overflow-x: hidden;
    background-image:
      radial-gradient(ellipse at 20% 10%, rgba(100,40,140,.18) 0%, transparent 55%),
      radial-gradient(ellipse at 80% 90%, rgba(60,20,90,.15) 0%, transparent 55%);
    background-attachment: fixed;
  }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: var(--deep); }
  ::-webkit-scrollbar-thumb { background: var(--muted); border-radius: 3px; }

  /* ── INTRO SPLASH ── */
  .splash {
    position: fixed; inset: 0; z-index: 9999;
    background: var(--void);
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    transition: opacity .9s ease, visibility .9s ease;
  }
  .splash.hidden { opacity: 0; visibility: hidden; pointer-events: none; }
  .splash canvas { position: absolute; inset: 0; }
  .splash-logo {
    position: relative; z-index: 2;
    font-family: var(--ff-disp); font-size: 80px; font-weight: 300;
    letter-spacing: 20px; color: var(--gold);
    text-shadow: 0 0 80px rgba(212,168,71,.6), 0 0 160px rgba(212,168,71,.2);
    animation: logoReveal 1.1s 1.2s both;
  }
  .splash-sub {
    position: relative; z-index: 2; margin-top: 14px;
    font-family: var(--ff-mono); font-size: 11px; letter-spacing: 6px;
    text-transform: uppercase; color: var(--subtle);
    animation: logoReveal 1s 1.7s both;
  }
  .splash-line {
    position: relative; z-index: 2; margin-top: 52px;
    width: 220px; height: 1px; background: var(--muted); overflow: hidden;
    animation: logoReveal .5s 2.1s both;
  }
  .splash-line::after {
    content: ''; position: absolute; top: 0; left: -100%; width: 100%; height: 100%;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
    animation: shimmer 1.3s 2.2s forwards;
  }
  @keyframes shimmer { to { left: 100%; } }
  @keyframes logoReveal { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }

  /* ── HEADER ── */
  .header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px; height: 68px;
    background: rgba(20,13,24,.88);
    backdrop-filter: blur(24px);
    border-bottom: 1px solid var(--rim);
    position: sticky; top: 0; z-index: 100;
  }
  .logo {
    font-family: var(--ff-disp); font-size: 26px; font-weight: 400;
    letter-spacing: 6px; color: var(--gold);
    display: flex; align-items: center; gap: 12px;
    text-shadow: var(--shadow-gold);
  }
  .logo-mark {
    width: 8px; height: 8px; border-radius: 50%;
    background: var(--accent); box-shadow: var(--glow-accent);
  }
  .nav { display: flex; gap: 2px; }
  .nav-btn {
    padding: 7px 18px; font-size: 11px; font-weight: 500;
    letter-spacing: 1.5px; text-transform: uppercase;
    border: 1px solid transparent; background: none;
    cursor: pointer; font-family: var(--ff-body);
    border-radius: var(--r-sm); transition: all .2s;
    color: var(--subtle);
  }
  .nav-btn:hover { color: var(--bright); border-color: var(--rim); }
  .nav-btn.active { color: var(--gold); border-color: var(--gold-dk); background: rgba(212,168,71,.08); }

  /* ── HERO ── */
  .hero {
    display: grid; grid-template-columns: 1fr 1fr;
    min-height: calc(100vh - 68px);
  }
  .hero-left {
    padding: 100px 72px;
    display: flex; flex-direction: column; justify-content: center;
    border-right: 1px solid var(--rim);
    background: linear-gradient(160deg, rgba(30,16,40,.9) 0%, rgba(14,9,16,.95) 100%);
    position: relative; overflow: hidden;
  }
  .hero-left::before {
    content: ''; position: absolute; bottom: -100px; left: -80px;
    width: 360px; height: 360px; border-radius: 50%;
    background: radial-gradient(circle, rgba(179,136,232,.07) 0%, transparent 70%);
    pointer-events: none;
  }
  .hero-eyebrow {
    font-family: var(--ff-mono); font-size: 11px; letter-spacing: 4px;
    text-transform: uppercase; color: var(--accent); margin-bottom: 28px;
    display: flex; align-items: center; gap: 12px;
  }
  .hero-eyebrow::before { content: ''; width: 28px; height: 1px; background: var(--accent); }
  .hero-h1 {
    font-family: var(--ff-disp); font-size: clamp(60px, 6vw, 100px);
    font-weight: 300; line-height: 1; letter-spacing: 2px;
    color: var(--white); margin-bottom: 12px;
  }
  .hero-h1 em { font-style: italic; color: var(--gold); text-shadow: var(--shadow-gold); }
  .hero-desc {
    font-size: 16px; line-height: 1.8; color: var(--body);
    max-width: 440px; margin-top: 28px; margin-bottom: 52px; font-weight: 300;
  }
  .hero-cta { display: flex; gap: 14px; }

  /* ── BUTTONS ── */
  .btn {
    padding: 13px 28px; font-size: 12px; font-weight: 500;
    letter-spacing: 1.5px; text-transform: uppercase;
    border: 1px solid transparent; cursor: pointer;
    font-family: var(--ff-body); border-radius: var(--r-sm);
    transition: all .22s; display: inline-flex; align-items: center; gap: 8px;
  }
  .btn-gold {
    background: linear-gradient(135deg, var(--gold-dk) 0%, var(--gold) 50%, var(--gold-lt) 100%);
    color: #1a0e00; border-color: var(--gold);
    box-shadow: 0 4px 20px rgba(212,168,71,.3), inset 0 1px 0 rgba(255,255,255,.15);
  }
  .btn-gold:hover { box-shadow: 0 6px 28px rgba(212,168,71,.45); transform: translateY(-1px); }
  .btn-outline {
    background: rgba(255,255,255,.04); color: var(--bright);
    border-color: var(--rim);
  }
  .btn-outline:hover { border-color: var(--subtle); background: var(--elevated); }
  .btn-teal {
    background: linear-gradient(135deg, var(--accent-dk), var(--accent));
    color: var(--void); border-color: var(--accent);
    box-shadow: var(--glow-accent);
  }
  .btn-teal:hover { box-shadow: 0 0 36px rgba(179,136,232,.45); transform: translateY(-1px); }
  .btn-ghost { background: transparent; color: var(--subtle); border-color: transparent; }
  .btn-ghost:hover { color: var(--bright); border-color: var(--rim); }
  .btn-sm { padding: 7px 16px; font-size: 10px; }
  .btn-danger { background: rgba(232,92,106,.12); color: var(--danger); border-color: rgba(232,92,106,.28); }
  .btn:disabled { opacity: .35; cursor: not-allowed; transform: none !important; }

  /* ── HERO RIGHT ── */
  .hero-right {
    background: linear-gradient(160deg, var(--surface) 0%, var(--deep) 100%);
    padding: 80px 60px;
    display: flex; flex-direction: column; justify-content: center;
    position: relative; overflow: hidden;
  }
  .hero-right::before {
    content: ''; position: absolute; top: -100px; right: -100px;
    width: 420px; height: 420px; border-radius: 50%;
    background: radial-gradient(circle, rgba(212,168,71,.07) 0%, transparent 65%);
  }
  .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px; margin-bottom: 32px; }
  .stat-card {
    background: rgba(255,255,255,.03); padding: 28px 24px;
    border: 1px solid var(--rim); transition: border-color .2s, background .2s;
  }
  .stat-card:hover { border-color: var(--muted); background: rgba(255,255,255,.05); }
  .stat-num {
    font-family: var(--ff-disp); font-size: 52px; font-weight: 400;
    line-height: 1; margin-bottom: 6px; color: var(--white);
  }
  .stat-num.gold { color: var(--gold); text-shadow: var(--shadow-gold); }
  .stat-num.teal { color: var(--accent); text-shadow: var(--glow-accent); }
  .stat-label { font-size: 11px; color: var(--subtle); letter-spacing: 2px; text-transform: uppercase; }
  .flow-label {
    font-family: var(--ff-mono); font-size: 10px; letter-spacing: 4px;
    color: var(--muted); text-transform: uppercase; margin-bottom: 20px;
  }
  .flow-steps { display: flex; flex-direction: column; }
  .flow-step {
    display: flex; align-items: flex-start; gap: 20px;
    padding: 18px 0; border-bottom: 1px solid var(--rim);
  }
  .flow-step:last-child { border-bottom: none; }
  .flow-num {
    font-family: var(--ff-disp); font-size: 32px; font-weight: 300;
    color: var(--muted); line-height: 1; min-width: 40px;
  }
  .flow-info h4 { font-size: 13px; color: var(--bright); font-weight: 500; margin-bottom: 3px; }
  .flow-info p { font-size: 12px; color: var(--subtle); line-height: 1.5; }

  /* ── SECTION ── */
  .section { max-width: 1080px; margin: 0 auto; padding: 72px 40px; }
  .section-hd {
    display: flex; align-items: flex-end; justify-content: space-between;
    margin-bottom: 40px; padding-bottom: 20px;
    border-bottom: 1px solid var(--rim);
  }
  .section-eyebrow {
    font-family: var(--ff-mono); font-size: 10px; letter-spacing: 3px;
    text-transform: uppercase; color: var(--accent); margin-bottom: 8px;
  }
  .section-title {
    font-family: var(--ff-disp); font-size: 48px; font-weight: 300;
    line-height: .95; color: var(--white); letter-spacing: 1px;
  }

  /* ── CARD ── */
  .card {
    background: var(--surface); border: 1px solid var(--rim);
    border-radius: var(--r); overflow: hidden; box-shadow: var(--shadow);
  }
  .card-hd {
    padding: 18px 24px; border-bottom: 1px solid var(--rim);
    display: flex; align-items: center; justify-content: space-between;
    background: var(--elevated);
  }
  .card-title {
    font-family: var(--ff-mono); font-size: 11px; letter-spacing: 2.5px;
    text-transform: uppercase; color: var(--gold); font-weight: 500;
  }
  .card-body { padding: 28px; }

  /* ── FORM ── */
  .field-label {
    font-size: 10px; font-weight: 600; letter-spacing: 2px;
    text-transform: uppercase; color: var(--subtle); margin-bottom: 8px; display: block;
  }
  .field-input {
    width: 100%; padding: 11px 14px; font-size: 14px;
    border: 1px solid var(--rim); border-radius: var(--r-sm);
    font-family: var(--ff-body); color: var(--bright);
    background: var(--elevated); transition: border-color .2s, box-shadow .2s;
  }
  .field-input:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(179,136,232,.12); }
  .field-textarea {
    width: 100%; min-height: 200px; padding: 14px; font-size: 14px;
    border: 1px solid var(--rim); border-radius: var(--r-sm); resize: vertical;
    font-family: var(--ff-body); color: var(--bright);
    background: var(--elevated); line-height: 1.65; transition: border-color .2s, box-shadow .2s;
  }
  .field-textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(179,136,232,.12); }
  .field-select {
    width: 100%; padding: 11px 14px; font-size: 14px;
    border: 1px solid var(--rim); border-radius: var(--r-sm);
    font-family: var(--ff-body); color: var(--bright);
    background: var(--elevated); cursor: pointer; appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='7'%3E%3Cpath d='M0 0l5 7 5-7z' fill='%238b6fa0'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 14px center;
    transition: border-color .2s;
  }
  .field-select:focus { outline: none; border-color: var(--accent); }
  .config-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; margin: 20px 0; }

  /* ── LOADING ── */
  .loader-wrap { text-align: center; padding: 72px 20px; }
  .loader-track { width: 280px; height: 2px; background: var(--rim); border-radius: 2px; overflow: hidden; margin: 0 auto 20px; }
  .loader-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--gold)); animation: lBar 1.8s ease-in-out infinite; }
  @keyframes lBar { 0%{width:0%;margin-left:0} 50%{width:65%;margin-left:17%} 100%{width:0%;margin-left:100%} }
  .loader-msg { font-family: var(--ff-mono); font-size: 11px; letter-spacing: 3px; color: var(--subtle); text-transform: uppercase; }

  /* ── META STRIP ── */
  .meta-strip { display: flex; border: 1px solid var(--rim); border-radius: var(--r); overflow: hidden; margin-bottom: 28px; }
  .meta-cell { flex: 1; padding: 16px 20px; border-right: 1px solid var(--rim); background: var(--surface); }
  .meta-cell:last-child { border-right: none; }
  .meta-k { font-size: 9px; font-weight: 600; letter-spacing: 2px; text-transform: uppercase; color: var(--subtle); margin-bottom: 5px; }
  .meta-v { font-size: 14px; font-weight: 500; color: var(--bright); }

  /* ── QUESTION CARD ── */
  .q-list { display: flex; flex-direction: column; gap: 16px; }
  .q-card {
    border: 1px solid var(--rim); border-radius: var(--r);
    background: var(--surface); overflow: hidden;
    transition: border-color .2s, box-shadow .2s;
  }
  .q-card:hover { border-color: var(--muted); box-shadow: 0 4px 20px rgba(0,0,0,.35); }
  .q-hd {
    display: flex; align-items: center; gap: 12px;
    padding: 14px 18px; border-bottom: 1px solid var(--rim);
    background: var(--elevated);
  }
  .q-num { font-family: var(--ff-disp); font-size: 22px; color: var(--muted); font-weight: 300; min-width: 32px; }
  .q-badge {
    font-family: var(--ff-mono); font-size: 9px; letter-spacing: 1.5px;
    text-transform: uppercase; padding: 3px 10px; border-radius: 20px; font-weight: 500;
  }
  .b-mcq { background: rgba(179,136,232,.12); color: var(--accent); }
  .b-short { background: rgba(232,169,58,.1); color: var(--warn); }
  .b-scenario { background: rgba(212,168,71,.1); color: var(--gold); }
  .b-task { background: rgba(82,201,138,.1); color: var(--ok); }
  .q-pts { margin-left: auto; font-family: var(--ff-mono); font-size: 10px; color: var(--subtle); }
  .q-body { padding: 18px 18px 20px; }
  .q-text { font-size: 15px; line-height: 1.65; color: var(--bright); margin-bottom: 14px; font-weight: 300; }
  .q-opts { display: flex; flex-direction: column; gap: 8px; }
  .q-opt {
    padding: 10px 14px; border: 1px solid var(--rim);
    border-radius: var(--r-sm); font-size: 13px; cursor: pointer;
    transition: all .15s; background: var(--elevated); color: var(--body);
  }
  .q-opt:hover { border-color: var(--muted); color: var(--bright); }
  .q-opt.sel { border-color: var(--accent); background: var(--accent-gl); color: var(--white); }
  .q-opt.correct { border-color: var(--ok); background: rgba(82,201,138,.1); color: var(--ok); }
  .q-textarea {
    width: 100%; min-height: 90px; padding: 12px; resize: vertical;
    border: 1px solid var(--rim); border-radius: var(--r-sm);
    font-family: var(--ff-body); font-size: 14px; color: var(--bright);
    background: var(--elevated); line-height: 1.6;
  }
  .q-textarea:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(179,136,232,.12); }
  .ideal-hint {
    margin-top: 10px; padding: 10px 14px;
    background: rgba(212,168,71,.06); border: 1px solid rgba(212,168,71,.14);
    border-radius: var(--r-sm); font-size: 12px; color: var(--body); line-height: 1.5;
  }
  .ideal-hint strong { font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: var(--gold); }

  /* ── TIMER BAR ── */
  .timer-bar {
    position: sticky; top: 68px; z-index: 50;
    background: rgba(20,13,24,.95); backdrop-filter: blur(24px);
    padding: 10px 48px; display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid var(--rim);
  }
  .timer-lbl { font-family: var(--ff-mono); font-size: 10px; letter-spacing: 2px; color: var(--subtle); text-transform: uppercase; }
  .timer-val { font-family: var(--ff-disp); font-size: 32px; color: var(--gold); line-height: 1; text-shadow: var(--shadow-gold); }
  .timer-val.urgent { color: var(--danger); text-shadow: none; animation: pulse 1s infinite; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.55} }
  .timer-track { flex: 1; height: 3px; background: var(--rim); margin: 0 32px; border-radius: 2px; overflow: hidden; }
  .timer-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--gold)); border-radius: 2px; transition: width .5s; }

  /* ── CANDIDATE HERO ── */
  .cand-hero {
    background: linear-gradient(160deg, var(--elevated) 0%, var(--void) 100%);
    padding: 64px 48px 48px;
    border-bottom: 1px solid var(--rim);
    position: relative; overflow: hidden;
  }
  .cand-hero::before {
    content: ''; position: absolute; top: -100px; right: -80px;
    width: 400px; height: 400px; border-radius: 50%;
    background: radial-gradient(circle, rgba(212,168,71,.09), transparent 68%);
    pointer-events: none;
  }
  .cand-hero::after {
    content: ''; position: absolute; bottom: -60px; left: -60px;
    width: 280px; height: 280px; border-radius: 50%;
    background: radial-gradient(circle, rgba(179,136,232,.07), transparent 65%);
    pointer-events: none;
  }
  .cand-eyebrow { font-family: var(--ff-mono); font-size: 10px; letter-spacing: 4px; color: var(--accent); text-transform: uppercase; margin-bottom: 12px; }
  .cand-role { font-family: var(--ff-disp); font-size: clamp(40px,5vw,72px); font-weight: 300; color: var(--white); letter-spacing: 1px; line-height: .95; margin-bottom: 10px; }
  .cand-co { font-size: 14px; color: var(--subtle); margin-bottom: 28px; font-weight: 300; }
  .cand-meta { display: flex; gap: 36px; flex-wrap: wrap; }
  .cand-stat { font-family: var(--ff-mono); font-size: 12px; color: var(--subtle); }
  .cand-stat strong { color: var(--gold); text-shadow: var(--shadow-gold); }

  /* ── SCORE CARD ── */
  .score-hero {
    background: linear-gradient(160deg, var(--elevated) 0%, var(--void) 100%);
    border: 1px solid var(--rim); border-radius: var(--r);
    padding: 40px; display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 20px; overflow: hidden; position: relative;
  }
  .score-hero::before {
    content: ''; position: absolute; top: -80px; left: -80px;
    width: 300px; height: 300px; border-radius: 50%;
    background: radial-gradient(circle, rgba(212,168,71,.08), transparent 65%);
  }
  .score-hero::after {
    content: ''; position: absolute; bottom: -60px; right: -60px;
    width: 240px; height: 240px; border-radius: 50%;
    background: radial-gradient(circle, rgba(179,136,232,.07), transparent 65%);
  }
  .score-big { font-family: var(--ff-disp); font-size: 108px; line-height: 1; color: var(--white); font-weight: 300; position: relative; z-index: 1; }
  .score-big sub { font-size: 48px; color: var(--muted); }
  .score-dims { display: grid; grid-template-columns: repeat(4,1fr); border: 1px solid var(--rim); border-radius: var(--r); overflow: hidden; }
  .score-dim { padding: 20px; border-right: 1px solid var(--rim); background: var(--surface); }
  .score-dim:last-child { border-right: none; }
  .dim-lbl { font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--subtle); margin-bottom: 10px; font-family: var(--ff-mono); }
  .dim-bar { height: 4px; background: var(--rim); border-radius: 2px; margin-bottom: 10px; overflow: hidden; }
  .dim-fill { height: 100%; background: linear-gradient(90deg, var(--accent), var(--gold)); border-radius: 2px; transition: width 1.2s cubic-bezier(.4,0,.2,1); }
  .dim-score { font-family: var(--ff-disp); font-size: 28px; color: var(--bright); font-weight: 300; }

  /* ── REC PILL ── */
  .rec-pill {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 18px; border-radius: 24px; font-size: 12px;
    font-weight: 600; letter-spacing: 1.5px; text-transform: uppercase;
  }
  .rec-advance { background: rgba(82,201,138,.14); color: var(--ok); border: 1px solid rgba(82,201,138,.28); }
  .rec-hold { background: rgba(232,169,58,.1); color: var(--warn); border: 1px solid rgba(232,169,58,.24); }
  .rec-reject { background: rgba(232,92,106,.1); color: var(--danger); border: 1px solid rgba(232,92,106,.24); }

  /* ── LEADERBOARD ── */
  .lb-table { width: 100%; border-collapse: collapse; }
  .lb-table th {
    text-align: left; padding: 12px 16px;
    font-size: 9px; letter-spacing: 2.5px; text-transform: uppercase;
    color: var(--subtle); font-weight: 500;
    border-bottom: 1px solid var(--rim); font-family: var(--ff-mono);
  }
  .lb-table td { padding: 16px; border-bottom: 1px solid var(--rim); vertical-align: top; }
  .lb-table tr:hover td { background: rgba(179,136,232,.03); }
  .lb-rank { font-family: var(--ff-disp); font-size: 32px; color: var(--muted); font-weight: 300; }
  .lb-rank.r1 { color: var(--gold); text-shadow: var(--shadow-gold); }
  .lb-rank.r2 { color: #c4b8d4; }
  .lb-rank.r3 { color: #c47a45; }
  .lb-name { font-weight: 500; font-size: 15px; color: var(--white); margin-bottom: 2px; }
  .lb-role { font-size: 12px; color: var(--subtle); }
  .score-chip {
    display: inline-block; padding: 4px 12px; border-radius: 20px;
    font-family: var(--ff-mono); font-size: 12px; font-weight: 500;
  }
  .chip-ok { background: rgba(82,201,138,.12); color: var(--ok); }
  .chip-warn { background: rgba(232,169,58,.1); color: var(--warn); }
  .chip-bad { background: rgba(232,92,106,.1); color: var(--danger); }
  .tag-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
  .tag {
    padding: 3px 10px; background: rgba(179,136,232,.06);
    border: 1px solid rgba(179,136,232,.15); border-radius: 20px;
    font-size: 11px; color: var(--body);
  }
  .overridden-chip {
    display: inline-flex; align-items: center; padding: 2px 8px;
    background: rgba(212,168,71,.1); border: 1px solid rgba(212,168,71,.25);
    border-radius: 10px; font-size: 10px; color: var(--gold);
    font-weight: 500; margin-left: 8px; vertical-align: middle;
  }

  /* ── OVERRIDE PANEL ── */
  .ov-panel {
    background: rgba(179,136,232,.05);
    border: 1px solid rgba(179,136,232,.18);
    border-radius: var(--r-sm); padding: 14px; margin-top: 10px;
  }
  .ov-title { font-family: var(--ff-mono); font-size: 10px; letter-spacing: 2px; text-transform: uppercase; color: var(--accent); margin-bottom: 10px; }
  .ov-btns { display: flex; gap: 6px; margin-bottom: 10px; }
  .ov-btn { padding: 5px 14px; font-size: 10px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; border-radius: var(--r-sm); cursor: pointer; font-family: var(--ff-body); transition: all .15s; }
  .ob-a { border: 1px solid rgba(82,201,138,.3); background: transparent; color: var(--ok); }
  .ob-a.sel { background: rgba(82,201,138,.18); }
  .ob-h { border: 1px solid rgba(232,169,58,.3); background: transparent; color: var(--warn); }
  .ob-h.sel { background: rgba(232,169,58,.15); }
  .ob-r { border: 1px solid rgba(232,92,106,.28); background: transparent; color: var(--danger); }
  .ob-r.sel { background: rgba(232,92,106,.12); }
  .ov-note {
    width: 100%; padding: 8px 12px; font-size: 12px; resize: none;
    border: 1px solid var(--rim); border-radius: var(--r-sm);
    font-family: var(--ff-body); color: var(--bright); background: var(--elevated);
  }
  .ov-note:focus { outline: none; border-color: var(--accent); }

  /* ── TABS ── */
  .tab-row { display: flex; border-bottom: 1px solid var(--rim); margin-bottom: 28px; }
  .tab-btn {
    padding: 12px 24px; font-size: 11px; font-weight: 500; letter-spacing: 1.5px;
    text-transform: uppercase; cursor: pointer; border: none; background: none;
    font-family: var(--ff-body); color: var(--subtle); transition: all .2s;
    border-bottom: 2px solid transparent; margin-bottom: -1px;
  }
  .tab-btn:hover { color: var(--bright); }
  .tab-btn.active { color: var(--gold); border-bottom-color: var(--gold); }

  /* ── IMPORT ── */
  .drop-zone {
    border: 1px dashed var(--muted); border-radius: var(--r);
    padding: 52px 32px; text-align: center; cursor: pointer;
    transition: all .2s; background: var(--surface);
  }
  .drop-zone:hover, .drop-zone.drag { border-color: var(--accent); background: var(--accent-gl); }
  .drop-icon { font-size: 40px; margin-bottom: 14px; }
  .drop-title { font-family: var(--ff-disp); font-size: 28px; font-weight: 300; color: var(--white); margin-bottom: 8px; }
  .drop-sub { font-size: 13px; color: var(--subtle); }
  .fmt-tags { display: flex; gap: 8px; justify-content: center; margin-top: 16px; }
  .fmt-tag { padding: 4px 12px; border: 1px solid var(--rim); border-radius: 20px; font-family: var(--ff-mono); font-size: 10px; color: var(--subtle); }
  .import-row {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px; border: 1px solid var(--rim); border-radius: var(--r-sm);
    background: var(--surface); margin-bottom: 8px;
  }

  /* ── SUMMARY STRIP ── */
  .summary-strip {
    display: flex; border: 1px solid var(--rim); border-radius: var(--r);
    overflow: hidden; margin-bottom: 28px;
  }
  .summary-cell { flex: 1; padding: 20px 24px; border-right: 1px solid var(--rim); background: var(--surface); }
  .summary-cell:last-child { border-right: none; }
  .summary-lbl { font-family: var(--ff-mono); font-size: 9px; letter-spacing: 2px; text-transform: uppercase; color: var(--subtle); margin-bottom: 6px; }
  .summary-val { font-family: var(--ff-disp); font-size: 40px; font-weight: 300; line-height: 1; }

  /* ── TOAST ── */
  .toast {
    position: fixed; bottom: 32px; right: 32px; z-index: 9998;
    background: var(--elevated); color: var(--bright);
    padding: 14px 22px; border-radius: var(--r);
    font-size: 14px; font-weight: 400;
    border: 1px solid var(--rim);
    border-left: 3px solid var(--gold);
    box-shadow: var(--shadow), var(--glow-gold);
    animation: toastIn .3s ease; max-width: 360px;
  }
  @keyframes toastIn { from { transform: translateY(16px); opacity: 0; } to { transform: none; opacity: 1; } }

  /* ── VOICE BTN ── */
  .voice-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 8px 16px; border-radius: 20px;
    border: 1px solid rgba(212,168,71,.3);
    background: rgba(212,168,71,.07); color: var(--gold);
    font-size: 11px; font-weight: 500; letter-spacing: 1px;
    text-transform: uppercase; cursor: pointer; font-family: var(--ff-body);
    transition: all .2s;
  }
  .voice-btn:hover { background: rgba(212,168,71,.14); border-color: var(--gold); box-shadow: var(--glow-gold); }
  .voice-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--gold); box-shadow: var(--shadow-gold); }
  .voice-dot.speaking { animation: voicePulse .7s infinite; }
  @keyframes voicePulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.8);opacity:.4} }

  /* ── UTILS ── */
  .flex { display: flex; } .items-center { align-items: center; } .justify-between { justify-content: space-between; }
  .gap-2 { gap: 8px; } .gap-3 { gap: 12px; } .gap-4 { gap: 16px; }
  .mt-4 { margin-top: 16px; } .mt-6 { margin-top: 24px; } .mt-8 { margin-top: 32px; }
  .mb-4 { margin-bottom: 16px; } .mb-6 { margin-bottom: 24px; }
  .w-full { width: 100%; } .text-subtle { color: var(--subtle); } .text-sm { font-size: 13px; }
  .font-mono { font-family: var(--ff-mono); }
  @keyframes fadeUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: none; } }
  .fade-up { animation: fadeUp .45s ease both; }
  .fade-up-1 { animation: fadeUp .45s .1s ease both; }
  .fade-up-2 { animation: fadeUp .45s .2s ease both; }
  .fade-up-3 { animation: fadeUp .45s .3s ease both; }

  @media (max-width: 768px) {
    .hero { grid-template-columns: 1fr; } .hero-right { display: none; }
    .config-grid { grid-template-columns: 1fr; } .score-dims { grid-template-columns: 1fr 1fr; }
    .header { padding: 0 20px; } .section { padding: 40px 20px; }
    .timer-bar { padding: 10px 20px; } .hero-left { padding: 60px 32px; }
  }
`;

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmt = s => `${String(Math.floor(s/60)).padStart(2,"0")}:${String(s%60).padStart(2,"0")}`;
const chipClass = n => n>=75?"chip-ok":n>=50?"chip-warn":"chip-bad";
const recPillClass = r => r==="ADVANCE"?"rec-advance":r==="HOLD"?"rec-hold":"rec-reject";
const recLabel = r => r==="ADVANCE"?"✓ Advance":r==="HOLD"?"◐ Hold":"✕ Reject";
const badgeClass = t => ({MCQ:"b-mcq","Short Answer":"b-short",Scenario:"b-scenario",Task:"b-task"}[t]||"b-short");

const SEED_LB = [
  {id:"s1",name:"Arjun Mehta",score:91,rec:"ADVANCE",strengths:["Domain expertise","Analytical thinking","Communication"],role:"Senior Product Manager",reason:"Demonstrated strong D2C metrics knowledge and strategic clarity."},
  {id:"s2",name:"Priya Sharma",score:84,rec:"ADVANCE",strengths:["Strategic vision","Data fluency"],role:"Senior Product Manager",reason:"Excellent product thinking with clear articulation of trade-offs."},
  {id:"s3",name:"Rahul Gupta",score:67,rec:"HOLD",strengths:["Technical depth","Problem solving"],role:"Senior Product Manager",reason:"Strong technical skills but limited cross-functional exposure."},
  {id:"s4",name:"Ananya Iyer",score:52,rec:"HOLD",strengths:["Communication"],role:"Senior Product Manager",reason:"Good communicator but answers lacked depth on key PM frameworks."},
  {id:"s5",name:"Vikram Nair",score:38,rec:"REJECT",strengths:["Enthusiasm"],role:"Senior Product Manager",reason:"Does not meet the minimum threshold for this senior-level role."},
];

const SAMPLE_JD = `Senior Product Manager — Mosaic Wellness (Man Matters)

We are looking for a Senior PM to lead our men's health supplement vertical. You will own the full product lifecycle from ideation to launch, working closely with our NPD, marketing, and supply chain teams.

Requirements:
- 4+ years of product management experience
- Strong understanding of D2C e-commerce metrics (CAC, LTV, ROAS, NPS)
- Experience with A/B testing and data-driven decision making
- Ability to write clear PRDs and communicate with engineering
- Understanding of the Indian health & wellness consumer landscape

Responsibilities:
- Define product roadmap for the men's health category
- Lead cross-functional sprints and manage stakeholder expectations
- Analyse customer feedback and NPS data to prioritise features`;

const SAMPLE_CSV = `Name,Role,Score,Recommendation,Strengths
Aditya Kapoor,Product Manager,88,ADVANCE,"Data-driven decision making,Stakeholder management"
Sneha Reddy,Product Manager,76,ADVANCE,"User research,Roadmap planning"
Manish Tiwari,Product Manager,61,HOLD,"Technical knowledge"
Divya Krishnan,Product Manager,49,HOLD,"Communication skills"
Rohit Bansal,Product Manager,31,REJECT,"Basic PM concepts"`;

// ── API ────────────────────────────────────────────────────────────────────────
async function callClaude(prompt, sys="", maxTokens=4000) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      model: ANTHROPIC_MODEL, max_tokens: maxTokens,
      system: sys||"You are an expert HR assessment designer. Respond ONLY with valid JSON. No markdown, no code fences, no explanations. Output raw JSON only.",
      messages: [{role:"user",content:prompt}]
    })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error.message);
  const raw = (d.content||[]).map(b=>b.text||"").join("").trim();
  // Strip any accidental markdown fences
  return raw.replace(/^```(?:json)?\n?/,"").replace(/\n?```$/,"").trim();
}

// Single API call — parse JD + generate questions simultaneously (2x faster)
const parseAndGenerate = async (jd, cfg) => {
  const nMCQ = Math.max(1, Math.round(cfg.numQuestions * 0.4));
  const nShort = Math.max(1, Math.round(cfg.numQuestions * 0.3));
  const nScenario = Math.max(1, Math.round(cfg.numQuestions * 0.2));
  const nTask = Math.max(1, cfg.numQuestions - nMCQ - nShort - nScenario);
  const text = await callClaude(
    `Parse this JD and create the assessment in one response.

JD:
${jd}

Return a single JSON object with two keys:
1. "meta": { role, seniority, domain, skills (5 strings array), responsibilities (3 strings array), company }
2. "questions": array of exactly ${cfg.numQuestions} objects, each with: id ("q1" etc), type ("MCQ"|"Short Answer"|"Scenario"|"Task"), question, options (4 strings for MCQ else null), correct (0-3 for MCQ else null), points (5-20), ideal_answer (brief string)

Mix: ${nMCQ} MCQ, ${nShort} Short Answer, ${nScenario} Scenario, ${nTask} Task. Difficulty: ${cfg.difficulty}.
Questions must be highly specific to this role — real metrics, frameworks, domain challenges. Return only the JSON object.`,
    "", 4000
  );
  return JSON.parse(text);
};

const scoreSubmission = async (questions, answers, meta) => {
  const qa = questions.map((q,i) => `Q(${q.type}): ${q.question.slice(0,120)} | Ideal: ${(q.ideal_answer||"").slice(0,80)} | Answer: ${(answers[i]||"(blank)").slice(0,200)}`).join("\n");
  // Call proxy but with a flag to stream response directly — avoids timeout
  const r = await fetch("/api/score", {
    method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ role: meta.role, qa })
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d;
};

// ── PARTICLE INTRO ────────────────────────────────────────────────────────────
function SplashScreen({onDone}) {
  const canvasRef = useRef();
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const W = canvas.width, H = canvas.height;
    const MESH_Y = H * 0.52;
    const particles = Array.from({length: 260}, () => ({
      x: Math.random() * W,
      y: -Math.random() * H * 0.6,
      r: Math.random() * 2.8 + 0.6,
      speed: Math.random() * 1.8 + 0.8,
      color: Math.random() > 0.5 ? "#d4a847" : Math.random() > 0.5 ? "#b388e8" : "#8b5cf6",
      passed: false,
      opacity: Math.random() * 0.6 + 0.4,
      delay: Math.random() * 60,
    }));
    let frame = 0, raf;
    function draw() {
      ctx.clearRect(0,0,W,H);
      // Draw mesh lines
      ctx.strokeStyle = "rgba(212,168,71,0.14)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 18; i++) {
        const x = (W / 17) * i;
        ctx.beginPath(); ctx.moveTo(x, MESH_Y - 12); ctx.lineTo(x, MESH_Y + 12); ctx.stroke();
      }
      ctx.strokeStyle = "rgba(179,136,232,0.1)";
      ctx.beginPath(); ctx.moveTo(0, MESH_Y); ctx.lineTo(W, MESH_Y); ctx.stroke();
      // Particles
      particles.forEach(p => {
        if (frame < p.delay) return;
        p.y += p.speed;
        if (!p.passed && p.y >= MESH_Y) {
          if (p.r > 1.8) { p.speed = 0; p.y = MESH_Y; }
          else { p.passed = true; p.color = "#d4a847"; p.speed *= 0.8; }
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color + Math.floor(p.opacity * 255).toString(16).padStart(2,"0");
        ctx.fill();
      });
      frame++;
      raf = requestAnimationFrame(draw);
    }
    draw();
    const t = setTimeout(onDone, 3400);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, []);
  return (
    <div className="splash">
      <canvas ref={canvasRef}/>
      <div className="splash-logo">SIEVE</div>
      <div className="splash-sub">AI Hiring Intelligence</div>
      <div className="splash-line"/>
    </div>
  );
}

// ── SHARED ────────────────────────────────────────────────────────────────────
function Loader({msg="Processing…"}) {
  return (
    <div className="loader-wrap fade-up">
      <div className="loader-track"><div className="loader-fill"/></div>
      <div className="loader-msg">{msg}</div>
    </div>
  );
}
function Toast({msg, onDone}) {
  useEffect(()=>{const t=setTimeout(onDone,3500);return()=>clearTimeout(t)},[]);
  return <div className="toast">{msg}</div>;
}
function VoiceBtn({onClick, speaking, label="Play Brief"}) {
  return (
    <button className="voice-btn" onClick={onClick}>
      <div className={`voice-dot${speaking?" speaking":""}`}/>
      {label}
    </button>
  );
}

// ── HOME ──────────────────────────────────────────────────────────────────────
function HomeView({onNav}) {
  return (
    <div className="hero">
      <div className="hero-left fade-up">
        <div className="hero-eyebrow">AI Hiring Intelligence</div>
        <h1 className="hero-h1">
          Signal<br/>
          from<br/>
          <em>Noise</em>
        </h1>
        <p className="hero-desc">Paste a job description. Get a role-specific AI assessment in 60 seconds. Every candidate scored, ranked, and recommended — without a single hour spent on screening.</p>
        <div className="hero-cta">
          <button className="btn btn-gold" onClick={()=>onNav("recruiter")}>Recruiter Console →</button>
          <button className="btn btn-outline" onClick={()=>onNav("candidate")}>Take an Assessment</button>
        </div>
      </div>
      <div className="hero-right fade-up-1">
        <div className="stat-grid" style={{marginBottom:28}}>
          <div className="stat-card"><div className="stat-num teal">60s</div><div className="stat-label">Assessment generated</div></div>
          <div className="stat-card"><div className="stat-num gold">500+</div><div className="stat-label">Candidates, zero hours</div></div>
          <div className="stat-card"><div className="stat-num">100%</div><div className="stat-label">Role-specific questions</div></div>
          <div className="stat-card"><div className="stat-num teal">AI</div><div className="stat-label">Scores & recommends</div></div>
        </div>
        <div className="flow-label">// How it works</div>
        <div className="flow-steps">
          {[["Paste JD","AI extracts role, skills & seniority instantly."],
            ["Generate Test","MCQs, scenarios & tasks tailored to the role."],
            ["Candidates Take It","Timed, clean interface on any device."],
            ["AI Ranks, Recruiter Decides","Leaderboard + voice brief + override controls."],
          ].map(([h,p],i)=>(
            <div className="flow-step" key={i}>
              <div className="flow-num">0{i+1}</div>
              <div className="flow-info"><h4>{h}</h4><p>{p}</p></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── RECRUITER ─────────────────────────────────────────────────────────────────
function RecruiterView({onNav, setLeaderboard, setActiveAssessment}) {
  const [tab, setTab] = useState("generate");
  const [jd, setJd] = useState("");
  const [cfg, setCfg] = useState({numQuestions:8,difficulty:"Intermediate",duration:30});
  const [phase, setPhase] = useState("input");
  const [jdMeta, setJdMeta] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [toast, setToast] = useState("");
  const [imported, setImported] = useState([]);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  async function handleGenerate() {
    if (!jd.trim()) { setToast("Please paste a job description first."); return; }
    setPhase("generating");
    try {
      const result = await parseAndGenerate(jd, cfg);
      const meta = result.meta;
      const qs = result.questions;
      if (!meta || !Array.isArray(qs) || qs.length === 0) throw new Error("Invalid response — please retry.");
      setJdMeta(meta);
      setQuestions(qs);
      setActiveAssessment({meta, questions:qs, config:cfg});
      setPhase("done");
    } catch(e) { setPhase("input"); setToast(`Error: ${e.message || "Something went wrong — please retry."}`); }
  }

  function parseCSV(text) {
    return text.trim().split("\n").slice(1).map(l => {
      const cols=[]; let cur="", inQ=false;
      for(const ch of l){if(ch==='"'){inQ=!inQ}else if(ch===","&&!inQ){cols.push(cur.trim());cur=""}else{cur+=ch}}
      cols.push(cur.trim());
      return {id:`imp_${Math.random()}`,name:cols[0]||"",role:cols[1]||"",score:parseInt(cols[2])||0,rec:cols[3]||"HOLD",strengths:(cols[4]||"").split(",").map(s=>s.trim()).filter(Boolean),reason:"Imported from sample data."};
    }).filter(r=>r.name);
  }

  function handleFile(file) {
    if (!file) return;
    const r = new FileReader();
    r.onload = e => {
      try {
        const rows = parseCSV(e.target.result);
        setImported(rows);
        setLeaderboard(p=>[...p,...rows].sort((a,b)=>b.score-a.score));
        setToast(`✓ ${rows.length} candidates imported successfully`);
      } catch { setToast("Could not parse file — check CSV format."); }
    };
    r.readAsText(file);
  }

  function loadSample() {
    const rows = parseCSV(SAMPLE_CSV);
    setImported(rows);
    setLeaderboard(p=>[...p,...rows].sort((a,b)=>b.score-a.score));
    setToast(`✓ Sample data loaded — ${rows.length} candidates`);
  }

  return (
    <div>
      {toast && <Toast msg={toast} onDone={()=>setToast("")}/>}
      <div className="section">
        <div className="section-hd fade-up">
          <div>
            <div className="section-eyebrow">Recruiter Console</div>
            <h2 className="section-title">Build your<br/>Assessment</h2>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={()=>onNav("leaderboard")}>View Leaderboard →</button>
        </div>

        <div className="tab-row">
          <button className={`tab-btn${tab==="generate"?" active":""}`} onClick={()=>setTab("generate")}>Generate Assessment</button>
          <button className={`tab-btn${tab==="import"?" active":""}`} onClick={()=>setTab("import")}>Import Sample Data</button>
        </div>

        {tab==="generate" && <>
          {phase==="input" && <div className="fade-up">
            <div className="card">
              <div className="card-hd">
                <span className="card-title">Step 01 — Job Description</span>
                <button className="btn btn-ghost btn-sm" onClick={()=>setJd(SAMPLE_JD)}>Load Sample JD</button>
              </div>
              <div className="card-body">
                <label className="field-label">Paste your job description</label>
                <textarea className="field-textarea" value={jd} onChange={e=>setJd(e.target.value)} placeholder="e.g. Senior Product Manager at Mosaic Wellness…" style={{minHeight:240}}/>
              </div>
            </div>
            <div className="card mt-6">
              <div className="card-hd"><span className="card-title">Step 02 — Configure Test</span></div>
              <div className="card-body">
                <div className="config-grid">
                  <div><label className="field-label">Questions</label>
                    <select className="field-select" value={cfg.numQuestions} onChange={e=>setCfg({...cfg,numQuestions:+e.target.value})}>
                      {[5,8,10,12,15].map(n=><option key={n} value={n}>{n} Questions</option>)}
                    </select></div>
                  <div><label className="field-label">Difficulty</label>
                    <select className="field-select" value={cfg.difficulty} onChange={e=>setCfg({...cfg,difficulty:e.target.value})}>
                      {["Entry Level","Intermediate","Senior","Expert"].map(d=><option key={d}>{d}</option>)}
                    </select></div>
                  <div><label className="field-label">Duration</label>
                    <select className="field-select" value={cfg.duration} onChange={e=>setCfg({...cfg,duration:+e.target.value})}>
                      {[15,20,30,45,60].map(d=><option key={d} value={d}>{d} minutes</option>)}
                    </select></div>
                </div>
                <button className="btn btn-teal w-full mt-4" style={{padding:"16px",fontSize:"13px",justifyContent:"center"}} onClick={handleGenerate}>⚡ Generate AI Assessment</button>
              </div>
            </div>
          </div>}

          {phase==="generating" && <Loader msg="Generating your assessment…"/>}

          {phase==="done" && jdMeta && questions.length > 0 && <div className="fade-up">
            <div className="meta-strip">
              {[["Role",jdMeta.role],["Seniority",jdMeta.seniority],["Domain",jdMeta.domain],["Questions",questions.length],["Duration",`${cfg.duration} min`]].map(([k,v],i)=>(
                <div className="meta-cell" key={i}><div className="meta-k">{k}</div><div className="meta-v">{v}</div></div>
              ))}
            </div>
            <div className="flex items-center justify-between mb-6">
              <h3 style={{fontFamily:"var(--ff-disp)",fontSize:28,fontWeight:300,color:"var(--white)"}}>Assessment Preview</h3>
              <button className="btn btn-gold btn-sm" onClick={()=>onNav("candidate")}>Preview as Candidate →</button>
            </div>
            <div className="q-list">
              {questions.map((q,i)=>(
                <div key={q.id||i} className="q-card fade-up" style={{animationDelay:`${i*.04}s`}}>
                  <div className="q-hd">
                    <div className="q-num">{i+1}</div>
                    <span className={`q-badge ${badgeClass(q.type)}`}>{q.type}</span>
                    <span className="q-pts">{q.points} pts</span>
                  </div>
                  <div className="q-body">
                    <div className="q-text">{q.question}</div>
                    {q.type==="MCQ" && q.options && <div className="q-opts">
                      {q.options.map((opt,j)=>(
                        <div key={j} className={`q-opt${j===q.correct?" correct":""}`}>
                          {String.fromCharCode(65+j)}. {opt}
                          {j===q.correct && <span style={{marginLeft:8,fontSize:10,opacity:.7}}>✓</span>}
                        </div>
                      ))}
                    </div>}
                    {q.type!=="MCQ" && <div className="ideal-hint"><strong>Ideal answer: </strong>{q.ideal_answer}</div>}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-8">
              <button className="btn btn-ghost" onClick={()=>{setPhase("input");setJdMeta(null);setQuestions([]);}}>← Start Over</button>
              <button className="btn btn-gold" onClick={()=>onNav("leaderboard")}>View Leaderboard →</button>
            </div>
          </div>}
        </>}

        {tab==="import" && <div className="fade-up">
          <div className="card">
            <div className="card-hd">
              <span className="card-title">Import Candidate Data</span>
              <button className="btn btn-ghost btn-sm" onClick={loadSample}>Load Sample Data</button>
            </div>
            <div className="card-body">
              <p style={{fontSize:13,color:"var(--body)",marginBottom:24,lineHeight:1.7,fontWeight:300}}>Upload the sample CSV provided by Mosaic, or drag and drop below. Names, scores, roles and recommendations are parsed automatically.</p>
              <div className={`drop-zone${dragging?" drag":""}`} onClick={()=>fileRef.current.click()}
                onDragOver={e=>{e.preventDefault();setDragging(true);}}
                onDragLeave={()=>setDragging(false)}
                onDrop={e=>{e.preventDefault();setDragging(false);handleFile(e.dataTransfer.files[0]);}}>
                <div className="drop-icon">📂</div>
                <div className="drop-title">Drop your CSV here</div>
                <div className="drop-sub">or click to browse</div>
                <div className="fmt-tags"><span className="fmt-tag">.CSV</span><span className="fmt-tag">.TXT</span></div>
              </div>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
              {imported.length > 0 && <div className="mt-6">
                <div style={{fontFamily:"var(--ff-mono)",fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"var(--subtle)",marginBottom:12}}>{imported.length} candidates imported</div>
                {imported.map((r,i)=>(
                  <div key={i} className="import-row">
                    <div style={{fontWeight:500,fontSize:14,color:"var(--white)",flex:1}}>{r.name}</div>
                    <div style={{fontSize:12,color:"var(--subtle)",flex:1}}>{r.role}</div>
                    <span className={`score-chip ${chipClass(r.score)}`}>{r.score}/100</span>
                    <span className={`rec-pill ${recPillClass(r.rec)}`} style={{fontSize:10,padding:"4px 12px"}}>{recLabel(r.rec)}</span>
                  </div>
                ))}
                <button className="btn btn-gold mt-6" onClick={()=>onNav("leaderboard")}>View Leaderboard →</button>
              </div>}
              <div style={{marginTop:28,padding:"16px 20px",background:"var(--elevated)",border:"1px solid var(--rim)",borderRadius:"var(--r-sm)"}}>
                <div style={{fontFamily:"var(--ff-mono)",fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"var(--subtle)",marginBottom:8}}>Expected CSV Format</div>
                <code style={{fontFamily:"var(--ff-mono)",fontSize:12,color:"var(--body)",display:"block",lineHeight:2}}>
                  Name, Role, Score, Recommendation, Strengths<br/>
                  "Jane Doe", "PM", 85, "ADVANCE", "Data fluency, Communication"
                </code>
              </div>
            </div>
          </div>
        </div>}
      </div>
    </div>
  );
}

// ── CANDIDATE ─────────────────────────────────────────────────────────────────
function CandidateView({onNav, activeAssessment, setLeaderboard}) {
  const [phase, setPhase] = useState("register");
  const [name, setName] = useState("");
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [scoreData, setScoreData] = useState(null);
  const [toast, setToast] = useState("");
  const [speaking, setSpeaking] = useState(false);
  const timerRef = useRef();

  const assessment = activeAssessment || {meta:{role:"Senior Product Manager",seniority:"Senior",domain:"D2C / Health & Wellness",company:"Mosaic Wellness"},config:{duration:30,numQuestions:8},questions:[]};
  const totalPts = assessment.questions.reduce((s,q)=>s+(q.points||10),0);
  const answered = Object.keys(answers).length;
  const pct = assessment.config.duration > 0 ? (timeLeft/(assessment.config.duration*60))*100 : 100;

  function startTest() {
    if (!name.trim()) { setToast("Please enter your name to begin."); return; }
    setTimeLeft(assessment.config.duration * 60);
    setPhase("test");
  }

  useEffect(()=>{
    if (phase !== "test") return;
    timerRef.current = setInterval(()=>setTimeLeft(t=>{
      if (t<=1) { clearInterval(timerRef.current); handleSubmit(); return 0; }
      return t-1;
    }), 1000);
    return ()=>clearInterval(timerRef.current);
  }, [phase]);

  async function handleSubmit() {
    clearInterval(timerRef.current);
    if (!assessment.questions.length) { setToast("No questions loaded."); return; }
    setPhase("scoring");
    try {
      const result = await scoreSubmission(assessment.questions, Object.values(answers), assessment.meta);
      setScoreData(result);
      setLeaderboard(prev=>[...prev,{
        id:Date.now(), name, score:result.total_score,
        rec:result.recommendation, strengths:result.strengths,
        role:assessment.meta.role, reason:result.recommendation_reason, breakdown:result.breakdown
      }].sort((a,b)=>b.score-a.score));
      setPhase("done");
      // Auto voice readout after a short delay
      setTimeout(()=>playScoreVoice(name, result), 800);
    } catch { setToast("Scoring failed — please retry."); setPhase("test"); }
  }

  function playScoreVoice(candidateName, result) {
    setSpeaking(true);
    const rec = result.recommendation === "ADVANCE" ? "recommended to advance to the next round" : result.recommendation === "HOLD" ? "placed on hold for further review" : "not recommended to proceed at this stage";
    const text = `Assessment complete. ${candidateName}, you scored ${result.total_score} out of 100. You are ${rec}. ${result.recommendation_reason}`;
    speak(text);
    setTimeout(()=>setSpeaking(false), text.length * 60);
  }

  const setAnswer = (i,v) => setAnswers(a=>({...a,[i]:v}));

  if (phase==="register") return (
    <div>
      {toast && <Toast msg={toast} onDone={()=>setToast("")}/>}
      <div className="cand-hero fade-up">
        <div className="cand-eyebrow">Sieve · Candidate Assessment Portal</div>
        <div className="cand-role">{assessment.meta.role}</div>
        <div className="cand-co">{assessment.meta.company} · {assessment.meta.domain}</div>
        <div className="cand-meta">
          <div className="cand-stat"><strong>{assessment.questions.length||"—"}</strong> Questions</div>
          <div className="cand-stat"><strong>{assessment.config.duration}</strong> Minutes</div>
          <div className="cand-stat"><strong>{totalPts||"—"}</strong> Total Points</div>
          <div className="cand-stat"><strong>{assessment.meta.seniority}</strong> Level</div>
        </div>
      </div>
      <div className="section">
        <div className="card fade-up-1" style={{maxWidth:520}}>
          <div className="card-hd"><span className="card-title">Register to Begin</span></div>
          <div className="card-body">
            <div className="mb-4">
              <label className="field-label">Your Full Name</label>
              <input className="field-input" placeholder="e.g. Neel Madhav Deepak" value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&startTest()}/>
            </div>
            {!assessment.questions.length && <div style={{padding:"12px 16px",background:"rgba(245,158,11,.08)",border:"1px solid rgba(245,158,11,.2)",borderRadius:"var(--r-sm)",fontSize:13,color:"var(--warn)",marginBottom:16}}>
              ⚠ No assessment loaded — go to Recruiter Console first.
            </div>}
            <div style={{padding:"12px 16px",background:"var(--elevated)",border:"1px solid var(--rim)",borderRadius:"var(--r-sm)",fontSize:12,color:"var(--subtle)",marginBottom:20,lineHeight:1.6}}>
              Once started, the timer runs continuously and cannot be paused.
            </div>
            <button className="btn btn-gold w-full" style={{padding:"15px",fontSize:"13px",justifyContent:"center"}} onClick={startTest}>Begin Assessment →</button>
          </div>
        </div>
      </div>
    </div>
  );

  if (phase==="test") return (
    <div>
      {toast && <Toast msg={toast} onDone={()=>setToast("")}/>}
      <div className="timer-bar">
        <div><div className="timer-lbl">Time Remaining</div><div className={`timer-val${timeLeft<120?" urgent":""}`}>{fmt(timeLeft)}</div></div>
        <div className="timer-track"><div className="timer-fill" style={{width:`${pct}%`}}/></div>
        <div style={{textAlign:"right"}}>
          <div className="timer-lbl">Answered</div>
          <div style={{fontFamily:"var(--ff-disp)",fontSize:32,color:"var(--gold)",lineHeight:1}}>{answered}<span style={{fontSize:18,color:"var(--muted)"}}>/{assessment.questions.length}</span></div>
        </div>
      </div>
      <div className="section">
        <div className="q-list">
          {assessment.questions.map((q,i)=>(
            <div key={q.id||i} className="q-card fade-up" style={{animationDelay:`${i*.04}s`}}>
              <div className="q-hd">
                <div className="q-num">{i+1}</div>
                <span className={`q-badge ${badgeClass(q.type)}`}>{q.type}</span>
                <span className="q-pts">{q.points} pts</span>
              </div>
              <div className="q-body">
                <div className="q-text">{q.question}</div>
                {q.type==="MCQ" && q.options ? (
                  <div className="q-opts">{q.options.map((opt,j)=>(
                    <div key={j} className={`q-opt${answers[i]===j?" sel":""}`} onClick={()=>setAnswer(i,j)}>
                      {String.fromCharCode(65+j)}. {opt}
                    </div>
                  ))}</div>
                ) : (
                  <textarea className="q-textarea" placeholder="Type your answer here…" value={answers[i]||""} onChange={e=>setAnswer(i,e.target.value)}/>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center mt-8">
          <div className="text-sm text-subtle font-mono">{answered} of {assessment.questions.length} answered</div>
          <button className="btn btn-gold" style={{padding:"13px 32px"}} onClick={handleSubmit}>Submit Assessment →</button>
        </div>
      </div>
    </div>
  );

  if (phase==="scoring") return <div className="section"><Loader msg="Evaluating your responses…"/></div>;

  if (phase==="done" && scoreData) return (
    <div className="section fade-up">
      <div className="section-hd">
        <div>
          <div className="section-eyebrow">Assessment Complete · {name}</div>
          <h2 className="section-title">Your Results</h2>
        </div>
        <VoiceBtn speaking={speaking} label="Replay Score" onClick={()=>playScoreVoice(name,scoreData)}/>
      </div>
      <div className="score-hero mb-4">
        <div>
          <div style={{fontFamily:"var(--ff-mono)",fontSize:10,letterSpacing:3,color:"var(--subtle)",marginBottom:12,textTransform:"uppercase"}}>Total Score</div>
          <div className="score-big">{scoreData.total_score}<sub>/100</sub></div>
        </div>
        <div style={{textAlign:"right"}}>
          <span className={`rec-pill ${recPillClass(scoreData.recommendation)}`} style={{fontSize:14,padding:"10px 22px"}}>{recLabel(scoreData.recommendation)}</span>
          <div style={{marginTop:14,fontSize:13,color:"var(--body)",maxWidth:280,textAlign:"right",lineHeight:1.65,fontWeight:300}}>{scoreData.recommendation_reason}</div>
        </div>
      </div>
      <div className="score-dims mb-6">
        {(scoreData.breakdown||[]).map((d,i)=>(
          <div key={i} className="score-dim">
            <div className="dim-lbl">{d.dimension||d.label}</div>
            <div className="dim-bar"><div className="dim-fill" style={{width:`${d.score}%`}}/></div>
            <div className="dim-score">{d.score}</div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="card-hd"><span className="card-title">Your Strengths</span></div>
        <div className="card-body"><div className="tag-wrap">{(scoreData.strengths||[]).map((s,i)=><span key={i} className="tag">{s}</span>)}</div></div>
      </div>
      <div className="flex gap-3 mt-6">
        <button className="btn btn-gold" onClick={()=>onNav("leaderboard")}>View Leaderboard →</button>
        <button className="btn btn-ghost" onClick={()=>{setPhase("register");setAnswers({});setScoreData(null);}}>Retake</button>
      </div>
    </div>
  );
  return null;
}

// ── OVERRIDE ──────────────────────────────────────────────────────────────────
function OverridePanel({entry, onSave}) {
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState(entry.override||entry.rec);
  const [note, setNote] = useState(entry.overrideNote||"");
  const save = () => { onSave(entry.id, choice, note); setOpen(false); };
  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{fontSize:10,padding:"4px 10px",marginTop:6}} onClick={()=>setOpen(o=>!o)}>
        {entry.overridden ? "✏ Edit Override" : "Override"}
      </button>
      {open && <div className="ov-panel">
        <div className="ov-title">Recruiter Override</div>
        <div className="ov-btns">
          {[["ADVANCE","ob-a"],["HOLD","ob-h"],["REJECT","ob-r"]].map(([r,cls])=>(
            <button key={r} className={`ov-btn ${cls}${choice===r?" sel":""}`} onClick={()=>setChoice(r)}>{r}</button>
          ))}
        </div>
        <textarea className="ov-note" rows={2} placeholder="Add a note — e.g. 'Strong culture fit from panel interview'" value={note} onChange={e=>setNote(e.target.value)}/>
        <div className="flex gap-2 mt-4">
          <button className="btn btn-teal btn-sm" onClick={save}>Save</button>
          <button className="btn btn-ghost btn-sm" onClick={()=>setOpen(false)}>Cancel</button>
        </div>
      </div>}
    </div>
  );
}

// ── LEADERBOARD ───────────────────────────────────────────────────────────────
function LeaderboardView({onNav, leaderboard, setLeaderboard, activeAssessment}) {
  const role = activeAssessment?.meta?.role || "Senior Product Manager";
  const [seedOv, setSeedOv] = useState({});
  const [speaking, setSpeaking] = useState(false);

  function handleOverride(id, rec, note) {
    const isSeed = String(id).startsWith("s");
    if (isSeed) setSeedOv(p=>({...p,[id]:{override:rec,overrideNote:note,overridden:true}}));
    else setLeaderboard(p=>p.map(c=>c.id===id?{...c,override:rec,overrideNote:note,overridden:true}:c));
  }

  const merged = [...SEED_LB.map(c=>({...c,...(seedOv[c.id]||{})})), ...leaderboard].sort((a,b)=>b.score-a.score);
  const adv = merged.filter(c=>(c.override||c.rec)==="ADVANCE").length;
  const hld = merged.filter(c=>(c.override||c.rec)==="HOLD").length;
  const rej = merged.filter(c=>(c.override||c.rec)==="REJECT").length;
  const avg = Math.round(merged.reduce((s,c)=>s+c.score,0)/merged.length);

  function playBrief() {
    setSpeaking(true);
    const top = merged.filter(c=>(c.override||c.rec)==="ADVANCE").slice(0,2).map(c=>c.name).join(" and ");
    const text = `Recruiter pipeline summary for ${role}. You have ${merged.length} candidates assessed. ${adv} are recommended to advance, including ${top||"none yet"}. ${hld} are on hold pending further review, and ${rej} have been rejected. The average score across all candidates is ${avg} out of 100. ${adv > 0 ? "Strong pipeline — recommend scheduling interviews with top candidates this week." : "Consider expanding the candidate pool."}`;
    speak(text, 0.9);
    setTimeout(()=>setSpeaking(false), text.length * 65);
  }

  return (
    <div className="section fade-up">
      <div className="section-hd">
        <div>
          <div className="section-eyebrow">Live Rankings · {role}</div>
          <h2 className="section-title">Candidate<br/>Leaderboard</h2>
        </div>
        <div className="flex gap-3 items-center">
          <VoiceBtn onClick={playBrief} speaking={speaking} label="Play Brief"/>
          <button className="btn btn-ghost btn-sm" onClick={()=>onNav("recruiter")}>← Console</button>
          <button className="btn btn-gold btn-sm" onClick={()=>onNav("candidate")}>Take Test</button>
        </div>
      </div>

      <div className="summary-strip">
        {[["To Advance", adv, "var(--ok)"],["On Hold", hld, "var(--warn)"],["Rejected", rej, "var(--danger)"],["Avg Score", `${avg}`, "var(--gold)"]].map(([l,v,c],i)=>(
          <div key={i} className="summary-cell">
            <div className="summary-lbl">{l}</div>
            <div className="summary-val" style={{color:c}}>{v}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <table className="lb-table">
          <thead>
            <tr><th style={{width:48}}>#</th><th>Candidate</th><th>Score</th><th>AI Recommendation</th><th>Recruiter Override</th><th>Strengths</th></tr>
          </thead>
          <tbody>
            {merged.map((c,i)=>{
              const displayRec = c.override||c.rec;
              return (
                <tr key={c.id} className="fade-up" style={{animationDelay:`${i*.04}s`}}>
                  <td><div className={`lb-rank${i===0?" r1":i===1?" r2":i===2?" r3":""}`}>{i+1}</div></td>
                  <td><div className="lb-name">{c.name}</div><div className="lb-role">{c.role||role}</div></td>
                  <td><span className={`score-chip ${chipClass(c.score)}`}>{c.score}/100</span></td>
                  <td>
                    <span className={`rec-pill ${recPillClass(c.rec)}`}>{recLabel(c.rec)}</span>
                    {c.reason && <div style={{fontSize:11,color:"var(--subtle)",marginTop:6,lineHeight:1.5,maxWidth:200,fontWeight:300}}>{c.reason}</div>}
                  </td>
                  <td>
                    {c.overridden ? (
                      <div>
                        <span className={`rec-pill ${recPillClass(displayRec)}`}>{recLabel(displayRec)}</span>
                        <span className="overridden-chip">overridden</span>
                        {c.overrideNote && <div style={{fontSize:11,color:"var(--subtle)",marginTop:6,lineHeight:1.4,maxWidth:200,fontStyle:"italic"}}>"{c.overrideNote}"</div>}
                      </div>
                    ) : <span style={{fontSize:12,color:"var(--muted)"}}>—</span>}
                    <OverridePanel entry={c} onSave={handleOverride}/>
                  </td>
                  <td><div className="tag-wrap">{(c.strengths||[]).map((s,j)=><span key={j} className="tag">{s}</span>)}</div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div style={{marginTop:14,padding:"12px 16px",background:"var(--elevated)",border:"1px solid var(--rim)",borderRadius:"var(--r-sm)",fontSize:12,color:"var(--subtle)"}}>
        💡 Click "Override" on any row to update the AI recommendation based on panel interviews or additional context. Use "Play Brief" for an audio summary.
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [view, setView] = useState("home");
  const [leaderboard, setLeaderboard] = useState([]);
  const [activeAssessment, setActiveAssessment] = useState(null);

  // Preload voices
  useEffect(()=>{ window.speechSynthesis?.getVoices(); }, []);

  return (
    <>
      <style>{css}</style>
      {showSplash && <SplashScreen onDone={()=>setShowSplash(false)}/>}
      <div style={{opacity: showSplash ? 0 : 1, transition: "opacity .6s ease"}}>
        <header className="header">
          <div className="logo"><div className="logo-mark"/>SIEVE</div>
          <nav className="nav">
            {[["home","Home"],["recruiter","Recruiter"],["candidate","Candidate"],["leaderboard","Leaderboard"]].map(([v,l])=>(
              <button key={v} className={`nav-btn${view===v?" active":""}`} onClick={()=>setView(v)}>{l}</button>
            ))}
          </nav>
        </header>
        {view==="home" && <HomeView onNav={setView}/>}
        {view==="recruiter" && <RecruiterView onNav={setView} setLeaderboard={setLeaderboard} setActiveAssessment={setActiveAssessment}/>}
        {view==="candidate" && <CandidateView onNav={setView} activeAssessment={activeAssessment} setLeaderboard={setLeaderboard}/>}
        {view==="leaderboard" && <LeaderboardView onNav={setView} leaderboard={leaderboard} setLeaderboard={setLeaderboard} activeAssessment={activeAssessment}/>}
      </div>
    </>
  );
}
