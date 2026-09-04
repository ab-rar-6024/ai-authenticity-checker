import React, { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "../landing.css";

/* ── Canvas drawing helpers ─────────────────────────── */
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arc(x + w - r, y + r, r, -Math.PI / 2, 0);
  ctx.lineTo(x + w, y + h - r);
  ctx.arc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  ctx.lineTo(x + r, y + h);
  ctx.arc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  ctx.lineTo(x, y + r);
  ctx.arc(x + r, y + r, r, Math.PI, -Math.PI / 2);
  ctx.closePath();
}
function poly(ctx, pts) {
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.closePath();
}
function shadow(ctx, cx, cy, rw, rh) {
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rw);
  g.addColorStop(0, "rgba(80,30,160,0.22)");
  g.addColorStop(1, "rgba(80,30,160,0)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rw, rh, 0, 0, Math.PI * 2);
  ctx.fill();
}

/* ── Draw floor ─────────────────────────────────────── */
function drawFloor(ctx, W, H) {
  const top = H * 0.25;
  const g = ctx.createLinearGradient(W * 0.1, top, W, H);
  g.addColorStop(0, "#ead4ff");
  g.addColorStop(0.5, "#d9bcff");
  g.addColorStop(1, "#c8a4f0");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(W * 0.08, top);
  ctx.lineTo(W, top * 0.88);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.lineTo(0, top + H * 0.08);
  ctx.closePath();
  ctx.fill();

  // Grid
  ctx.strokeStyle = "rgba(100,60,200,0.07)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 14; i++) {
    const y = top + (i * (H - top)) / 13;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  for (let i = 0; i < 20; i++) {
    const x = (i * W) / 19;
    ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, H); ctx.stroke();
  }
}

/* ── Draw diagonal light rays ───────────────────────── */
function drawRays(ctx, W, H) {
  ctx.save();
  const angle = 108 * (Math.PI / 180);
  const slant = Math.tan(angle - Math.PI / 2);
  const stripeW = 52, total = 150;
  for (let i = -3; i < W / total + 3; i++) {
    const x0 = i * total;
    ctx.fillStyle = "rgba(160,110,240,0.09)";
    ctx.beginPath();
    ctx.moveTo(x0, 0);
    ctx.lineTo(x0 + stripeW, 0);
    ctx.lineTo(x0 + stripeW + H * slant, H);
    ctx.lineTo(x0 + H * slant, H);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

/* ── Draw belt ──────────────────────────────────────── */
function drawBelt(ctx, beltY, W, beltH, offset) {
  const g = ctx.createLinearGradient(0, beltY, 0, beltY + beltH);
  g.addColorStop(0, "#ede0ff");
  g.addColorStop(0.3, "#d6b8ff");
  g.addColorStop(0.7, "#c4a0f5");
  g.addColorStop(1, "#d6b8ff");
  ctx.fillStyle = g;
  rr(ctx, 0, beltY, W, beltH, 7);
  ctx.fill();

  // Stripes
  ctx.save();
  rr(ctx, 0, beltY, W, beltH, 7);
  ctx.clip();
  const sw = 28;
  for (let i = -2; i < W / sw + 2; i++) {
    const sx = i * sw * 2 + (offset % (sw * 2));
    ctx.fillStyle = "rgba(90,40,180,0.1)";
    ctx.fillRect(sx, beltY, sw, beltH);
  }
  ctx.restore();

  // Top shine
  const shine = ctx.createLinearGradient(0, beltY, 0, beltY + beltH * 0.5);
  shine.addColorStop(0, "rgba(255,255,255,0.45)");
  shine.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = shine;
  rr(ctx, 0, beltY, W, beltH * 0.5, 7);
  ctx.fill();

  // Edges
  ctx.fillStyle = "rgba(100,60,200,0.22)";
  ctx.fillRect(0, beltY, W, 4);
  ctx.fillRect(0, beltY + beltH - 4, W, 4);
}

/* ── Draw sphere robot ──────────────────────────────── */
function drawSphere(ctx, cx, cy, r) {
  const g = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.32, r * 0.06, cx, cy, r);
  g.addColorStop(0, "#f6f0ff");
  g.addColorStop(0.28, "#e8d8f8");
  g.addColorStop(0.65, "#ccb0e8");
  g.addColorStop(1, "#b090d0");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

  // Highlight
  const hl = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.32, 0, cx - r * 0.2, cy - r * 0.2, r * 0.48);
  hl.addColorStop(0, "rgba(255,255,255,0.78)");
  hl.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hl;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

  // Dark eye/lens
  const eg = ctx.createRadialGradient(cx, cy + r * 0.08, 0, cx, cy + r * 0.08, r * 0.42);
  eg.addColorStop(0, "rgba(35,8,80,0.88)");
  eg.addColorStop(0.55, "rgba(75,25,145,0.55)");
  eg.addColorStop(1, "rgba(75,25,145,0)");
  ctx.fillStyle = eg;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();

  shadow(ctx, cx, cy + r + 4, r * 0.85, r * 0.16);
}

/* ── Draw waveform bars ─────────────────────────────── */
function drawWave(ctx, cx, cy, w, h, t, active) {
  const hs = [0.32,0.68,1,0.55,0.92,0.42,1,0.72,0.38,0.88,0.62,1,0.48];
  const bw = (w / hs.length) * 0.58;
  const gap = w / hs.length;
  hs.forEach((bh, i) => {
    let ah = bh;
    if (active) ah = bh * (0.55 + 0.55 * Math.abs(Math.sin(t * 0.0032 + i * 0.52)));
    const barH = ah * h;
    const bx = cx - w / 2 + i * gap + gap * 0.21;
    const by = cy + h / 2 - barH;
    const bg = ctx.createLinearGradient(bx, by, bx, by + barH);
    bg.addColorStop(0, "#22d3ee");
    bg.addColorStop(1, "#0891b2");
    ctx.fillStyle = bg;
    rr(ctx, bx, by, bw, barH, 2);
    ctx.fill();
  });
}

/* ── Draw purple lens ───────────────────────────────── */
function drawLens(ctx, cx, cy, r) {
  const g = ctx.createRadialGradient(cx - r * 0.28, cy - r * 0.28, r * 0.08, cx, cy, r);
  g.addColorStop(0, "#c084fc"); g.addColorStop(0.45, "#9333ea"); g.addColorStop(1, "#4c1d95");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "rgba(200,150,255,0.45)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.stroke();
  const hl = ctx.createRadialGradient(cx - r * 0.26, cy - r * 0.3, 0, cx - r * 0.18, cy - r * 0.22, r * 0.48);
  hl.addColorStop(0, "rgba(255,255,255,0.48)");
  hl.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hl;
  ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
}

/* ── Draw main cube robot ───────────────────────────── */
function drawMainCube(ctx, cx, baseY, w, h, phase, t) {
  const d = w * 0.27;
  const dx = Math.cos(-Math.PI / 6) * d, dy = Math.sin(-Math.PI / 6) * d;
  const topY = baseY - h;

  // Shaking on smash
  let sx = 0;
  if (phase === "smash") sx = Math.sin(t * 0.08) * 5;
  cx += sx;

  // Top face
  const tg = ctx.createLinearGradient(cx, topY + dy, cx, topY);
  tg.addColorStop(0, "#e8d8ff"); tg.addColorStop(1, "#f0e4ff");
  ctx.fillStyle = tg;
  poly(ctx, [[cx-w/2,topY],[cx+w/2,topY],[cx+w/2+dx,topY+dy],[cx-w/2+dx,topY+dy]]);
  ctx.fill();
  ctx.strokeStyle = "rgba(150,100,240,0.18)"; ctx.lineWidth = 1;
  poly(ctx, [[cx-w/2,topY],[cx+w/2,topY],[cx+w/2+dx,topY+dy],[cx-w/2+dx,topY+dy]]);
  ctx.stroke();

  // Right face
  const rg = ctx.createLinearGradient(cx+w/2, baseY, cx+w/2+dx, baseY+dy);
  rg.addColorStop(0, "#d4bcf5"); rg.addColorStop(1, "#bea4e8");
  ctx.fillStyle = rg;
  poly(ctx, [[cx+w/2,topY],[cx+w/2+dx,topY+dy],[cx+w/2+dx,baseY+dy],[cx+w/2,baseY]]);
  ctx.fill();

  // Front face
  ctx.shadowColor = "rgba(100,50,200,0.22)";
  ctx.shadowBlur = 22; ctx.shadowOffsetY = 10;
  const fg = ctx.createLinearGradient(cx, topY, cx, baseY);
  fg.addColorStop(0, "#ffffff"); fg.addColorStop(1, "#f5eeff");
  ctx.fillStyle = fg;
  rr(ctx, cx-w/2, topY, w, h, 14); ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = "rgba(150,100,240,0.2)"; ctx.lineWidth = 1.5;
  rr(ctx, cx-w/2, topY, w, h, 14); ctx.stroke();

  // Waveform (top 45% of front face)
  drawWave(ctx, cx, topY + h * 0.28, w * 0.78, h * 0.38, t, phase !== "idle");

  // Purple lens (bottom 35% of front face)
  drawLens(ctx, cx, topY + h * 0.72, h * 0.175);

  // Arms
  const aw = 13, ah = 40;
  const armG = (x1, x2) => {
    const ag = ctx.createLinearGradient(x1, 0, x2, 0);
    ag.addColorStop(0, "#e2d0fc"); ag.addColorStop(1, "#c8b0f0");
    return ag;
  };
  ctx.fillStyle = armG(cx-w/2-aw, cx-w/2);
  rr(ctx, cx-w/2-aw-2, baseY-ah-8, aw, ah, 6); ctx.fill();

  // Right arm (animated on smash)
  const armAngle = phase === "smash" ? -Math.PI*0.58 : -Math.PI*0.08;
  ctx.save();
  ctx.translate(cx+w/2+5, baseY-ah/2-10);
  ctx.rotate(armAngle);
  ctx.fillStyle = armG(-aw/2, aw/2);
  rr(ctx, 0, -ah/2, aw, ah, 6); ctx.fill();
  if (phase === "smash") {
    ctx.fillStyle = "#fbbf24";
    ctx.shadowColor = "rgba(251,191,36,0.7)"; ctx.shadowBlur = 12;
    rr(ctx, -5, ah/2-4, 22, 16, 4); ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.restore();

  // Badge
  const txt = phase==="smash" ? "⚡ AI DETECTED" : phase==="pass" ? "✅ AUTHENTIC" : "🔍 SCANNING";
  const bc = phase==="smash" ? ["#fff1f2","#b91c1c"] : phase==="pass" ? ["#f0fdf4","#15803d"] : ["#f5f3ff","#5b21b6"];
  ctx.font = "bold 10px Inter, sans-serif";
  const bw2 = ctx.measureText(txt).width + 22;
  const badgeX = cx - bw2/2, badgeY = baseY + 14;
  ctx.fillStyle = bc[0];
  ctx.strokeStyle = bc[1] + "55"; ctx.lineWidth = 1;
  rr(ctx, badgeX, badgeY, bw2, 20, 10); ctx.fill(); ctx.stroke();
  ctx.fillStyle = bc[1]; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(txt, cx, badgeY + 10);

  shadow(ctx, cx, baseY + 10, w * 0.7, 14);
}

/* ── Draw image box on belt ─────────────────────────── */
function drawBox(ctx, bx, beltTopY, box, t) {
  const w = 54, h = 52, d = 10;
  const by = beltTopY - h + 2;
  const c = box.color;

  ctx.save();
  if (box.phase === "smashing") {
    const s = 1 - box.smashP * 0.85;
    ctx.globalAlpha = Math.max(0, 1 - box.smashP * 1.1);
    ctx.translate(bx + w/2, by + h/2);
    ctx.rotate(box.smashP * 0.45);
    ctx.scale(s, s);
    ctx.translate(-w/2, -h/2);
  }

  // 3D top
  ctx.fillStyle = `rgba(${c},0.65)`;
  poly(ctx, [[0,0],[w,0],[w+d,-d*0.6],[d,-d*0.6]]); ctx.fill();
  // 3D right
  ctx.fillStyle = `rgba(${c},0.45)`;
  poly(ctx, [[w,0],[w+d,-d*0.6],[w+d,h-d*0.6],[w,h]]); ctx.fill();
  // Front
  const fg = ctx.createLinearGradient(0, 0, 0, h);
  fg.addColorStop(0, "rgba(255,255,255,0.95)");
  fg.addColorStop(1, `rgba(${c},0.12)`);
  ctx.fillStyle = fg;
  ctx.strokeStyle = `rgba(${c},0.65)`; ctx.lineWidth = 1.5;
  rr(ctx, 0, 0, w, h, 8); ctx.fill(); ctx.stroke();
  // Icon
  ctx.font = "18px sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(box.isAI ? "🤖" : "📷", w/2, h*0.42);
  // Label
  ctx.font = `bold 8px Inter, sans-serif`;
  ctx.fillStyle = `rgb(${c})`;
  ctx.fillText(box.label, w/2, h * 0.76);

  ctx.restore();
}

/* ── Draw small purple cube robot ───────────────────── */
function drawSmallCube(ctx, cx, baseY, sz) {
  const w = sz, h = sz;
  const d = w * 0.28;
  const dx = Math.cos(-Math.PI/6)*d, dy = Math.sin(-Math.PI/6)*d;
  const topY = baseY - h;

  ctx.fillStyle = "#9333ea";
  poly(ctx,[[cx-w/2,topY],[cx+w/2,topY],[cx+w/2+dx,topY+dy],[cx-w/2+dx,topY+dy]]); ctx.fill();
  ctx.fillStyle = "#6d28d9";
  poly(ctx,[[cx+w/2,topY],[cx+w/2+dx,topY+dy],[cx+w/2+dx,baseY+dy],[cx+w/2,baseY]]); ctx.fill();

  ctx.shadowColor = "rgba(109,40,217,0.38)"; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
  const fg = ctx.createLinearGradient(cx-w/2, topY, cx, baseY);
  fg.addColorStop(0,"#c084fc"); fg.addColorStop(1,"#7c3aed");
  ctx.fillStyle = fg;
  rr(ctx, cx-w/2, topY, w, h, 10); ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = "rgba(196,181,253,0.5)"; ctx.lineWidth = 1.5;
  rr(ctx, cx-w/2, topY, w, h, 10); ctx.stroke();

  // Eye
  const er = w*0.23;
  ctx.fillStyle = "#fff";
  ctx.shadowColor = "rgba(255,255,255,0.55)"; ctx.shadowBlur = 8;
  ctx.beginPath(); ctx.arc(cx, topY+h*0.38, er, 0, Math.PI*2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#4c1d95";
  ctx.beginPath(); ctx.arc(cx, topY+h*0.38, er*0.48, 0, Math.PI*2); ctx.fill();

  // Small arms
  const aw=8, ah=20;
  ctx.fillStyle = "#9333ea";
  rr(ctx, cx-w/2-aw-2, baseY-ah-4, aw, ah, 4); ctx.fill();
  rr(ctx, cx+w/2+2, baseY-ah-4, aw, ah, 4); ctx.fill();

  shadow(ctx, cx, baseY+6, w*0.6, 10);
}

/* ── Draw particle ──────────────────────────────────── */
function drawParticle(ctx, p, cx, cy) {
  const rad = p.angle * Math.PI / 180;
  const px = cx + Math.cos(rad) * p.dist * p.prog;
  const py = cy + Math.sin(rad) * p.dist * p.prog;
  const r = p.size * (1 - p.prog * 0.7);
  const c = p.color;
  ctx.shadowColor = `rgba(${c},0.5)`; ctx.shadowBlur = 6;
  ctx.fillStyle = `rgba(${c},${1 - p.prog})`;
  ctx.beginPath(); ctx.arc(px, py, Math.max(0, r), 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

/* ── Main canvas scene component ───────────────────── */
function ConveyorScene() {
  const canvasRef = useRef(null);
  const stRef = useRef({
    boxes: [], phase: "idle", particles: [], beltOff: 0, t: 0,
    typeIdx: 0, nextSpawn: 0,
  });

  const IMAGE_TYPES = [
    { label:"AI",   isAI:true,  color:"147,51,234"  },
    { label:"REAL", isAI:false, color:"5,150,105"   },
    { label:"AI",   isAI:true,  color:"124,58,237"  },
    { label:"REAL", isAI:false, color:"2,132,199"   },
    { label:"AI",   isAI:true,  color:"162,28,175"  },
    { label:"REAL", isAI:false, color:"22,163,74"   },
  ];
  let uid = 0;

  useEffect(() => {
    const canvas = canvasRef.current;
    const BELT_DUR = 6500;
    const SPAWN_IV = 3800;
    let raf;
    let lastT = null;

    const spawnBox = () => {
      const s = stRef.current;
      const t = IMAGE_TYPES[s.typeIdx % IMAGE_TYPES.length];
      s.typeIdx++;
      s.boxes.push({ id: uid++, ...t, prog: -60, phase: "moving", smashP: 0, triggered: false });
    };
    spawnBox();

    const loop = (now) => {
      if (!lastT) lastT = now;
      const dt = (now - lastT) / 1000;
      lastT = now;
      const s = stRef.current;
      s.t = now;
      s.beltOff += dt * 55;

      // Spawn
      if (now - s.nextSpawn > SPAWN_IV) { spawnBox(); s.nextSpawn = now; }

      // Resize canvas
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }

      const BELT_Y = H * 0.63;
      const BELT_H = 58;
      const cubeX = W * 0.55, cubeBase = BELT_Y + 5;
      const cubeW = 118, cubeH = 118;

      // Update boxes
      s.boxes = s.boxes.filter(b => {
        if (b.phase === "done") return false;
        if (b.phase === "smashing") {
          b.smashP += dt * 1.5;
          return b.smashP < 1;
        }
        if (b.phase === "moving") {
          b.prog += dt / BELT_DUR * W;
          const bx = b.prog;
          // Trigger at robot position
          if (!b.triggered && bx >= cubeX - cubeW/2 - 30) {
            b.triggered = true;
            if (b.isAI) {
              b.phase = "smashing"; b.smashP = 0;
              s.phase = "smash";
              s.particles = Array.from({length:18}, (_,i)=>({
                id: Math.random(), angle:(i/18)*360,
                dist:35+Math.random()*55, color:b.color,
                size:4+Math.random()*6, prog:0
              }));
              setTimeout(()=>{ s.phase="idle"; }, 950);
            } else {
              b.phase = "passing";
              s.phase = "pass";
              setTimeout(()=>{ s.phase="idle"; }, 700);
            }
          }
        }
        if (b.phase === "passing") {
          b.prog += dt / BELT_DUR * W;
          if (b.prog >= W) b.phase = "done";
        }
        return true;
      });

      // Update particles
      s.particles = s.particles.filter(p => {
        p.prog += dt * 1.2; return p.prog < 1;
      });

      // ── DRAW ──────────────────────────────────────
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, W, H);

      drawFloor(ctx, W, H);
      drawRays(ctx, W, H);
      drawBelt(ctx, BELT_Y, W, BELT_H, s.beltOff);

      // Large sphere — back-left of cube
      const spR = Math.min(W * 0.115, 90);
      drawSphere(ctx, cubeX - cubeW * 0.92, BELT_Y - spR * 0.75, spR);

      // Small sphere — smaller, further left
      const sp2R = spR * 0.58;
      drawSphere(ctx, cubeX - cubeW * 2.1, BELT_Y - sp2R * 0.5, sp2R);

      // Draw boxes (only those not yet at robot)
      s.boxes.forEach(b => {
        if (b.phase === "smashing" || b.phase === "moving" || b.phase === "passing") {
          ctx.save();
          ctx.translate(b.prog, 0);
          drawBox(ctx, 0, BELT_Y, b, now);
          ctx.restore();
        }
      });

      // Main robot cube
      drawMainCube(ctx, cubeX, cubeBase, cubeW, cubeH, s.phase, now);

      // Small purple cube — front-right
      const scX = W * 0.88, scBase = H * 0.83;
      drawSmallCube(ctx, scX, scBase, 82);

      // Particles
      s.particles.forEach(p => drawParticle(ctx, p, cubeX, cubeBase - cubeH * 0.55));

      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return React.createElement("canvas", {
    ref: canvasRef,
    style: { width:"100%", height:"100%", display:"block" }
  });
}

/* ── Navbar ─────────────────────────────────────────── */
function Navbar() {
  return React.createElement("nav", { className:"lp-nav" },
    React.createElement("div", { className:"lp-nav-brand" },
      React.createElement("div", { className:"lp-nav-logo" },
        React.createElement("svg", { width:"13", height:"13", viewBox:"0 0 13 13", fill:"none" },
          React.createElement("rect",{width:"5.5",height:"5.5",rx:"1",fill:"#6d28d9"}),
          React.createElement("rect",{x:"7.5",width:"5.5",height:"5.5",rx:"1",fill:"#6d28d9",opacity:".5"}),
          React.createElement("rect",{y:"7.5",width:"5.5",height:"5.5",rx:"1",fill:"#6d28d9",opacity:".5"})
        )
      ),
      React.createElement("span",{className:"lp-nav-name"},"NEXA")
    ),
    React.createElement("div", { className:"lp-nav-links" },
      ["Services","About us","Careers","News","Contact us"].map(t =>
        React.createElement("a",{key:t,href:"#"},t)
      )
    ),
    React.createElement("div", { className:"lp-nav-cta" },
      React.createElement(Link,{to:"/login",className:"lp-btn-outline",id:"nav-learn"},"Learn more"),
      React.createElement(Link,{to:"/signup",className:"lp-btn-solid",id:"nav-join"},"Join us")
    )
  );
}

/* ── Landing page ───────────────────────────────────── */
export default function Landing() {
  return React.createElement("div", { className:"lp-root" },
    React.createElement(Navbar),
    React.createElement("section", { className:"lp-hero" },
      React.createElement("div", { className:"lp-text" },
        React.createElement("h1", { className:"lp-h1" },
          "Building", React.createElement("br"),
          "the Future of", React.createElement("br"),
          React.createElement("span",{className:"lp-h1-accent"},"AI Ownership")
        ),
        React.createElement("p",{className:"lp-sub"},
          "Elevate Your Sales and Support with",
          React.createElement("br"),
          "Intelligent, Real-Time Conversations"
        ),
        React.createElement("div",{className:"lp-btns"},
          React.createElement(Link,{to:"/signup",id:"hero-start",className:"lp-btn-solid lp-btn--lg"},"Get started"),
          React.createElement(Link,{to:"/login",id:"hero-join",className:"lp-btn-outline lp-btn--lg"},"Join us")
        )
      ),
      React.createElement("div",{className:"lp-scene-wrap"},
        React.createElement(ConveyorScene)
      )
    )
  );
}
