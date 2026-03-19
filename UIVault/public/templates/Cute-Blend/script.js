(() => {
  // ===================== Canvas =====================
  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const DPR = () => Math.min(2, window.devicePixelRatio || 1);

  function resize() {
    const dpr = DPR();
    canvas.width = Math.floor(innerWidth * dpr);
    canvas.height = Math.floor(innerHeight * dpr);
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  addEventListener("resize", resize, { passive: true });
  resize();

  // ===================== Utils =====================
  const TAU = Math.PI * 2;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (x, a, b) => Math.max(a, Math.min(b, x));
  const ease = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const polar = (cx, cy, r, a) => [cx + Math.cos(a) * r, cy + Math.sin(a) * r];

  function hsla(h, s, l, a = 1) {
    return `hsla(${(h % 360 + 360) % 360}, ${clamp(s, 0, 100)}%, ${clamp(l, 0, 100)}%, ${clamp(a, 0, 1)})`;
  }

  function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }

  function mulberry32(a) {
    return function () {
      let t = a += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const rngFrom = (seedStr) => mulberry32(xmur3(seedStr)());

  // ===================== Palette =====================
  function makePalette(rng) {
    const base = rng() * 360;
    const accents = [base, base+40+rng()*20, base+120+rng()*15, base+180+rng()*20, base+240+rng()*15, base+300+rng()*20]
      .map(h => (h % 360 + 360) % 360);
    const pickHue = (i) => { const n = accents.length; const idx = ((Math.floor(i) % n) + n) % n; return accents[idx]; };
    const neon   = (i, a = 1) => hsla(pickHue(i), 95, 62, a);
    const neon2  = (i, a = 1) => hsla(pickHue(i) + 18, 98, 58, a);
    const pastel = (i, a = 1) => hsla(pickHue(i), 92, 76, a);
    const deep   = (i, a = 1) => hsla(pickHue(i), 88, 46, a);
    return { base, accents, pickHue, neon, neon2, pastel, deep,
      ink: "rgba(255,255,255,0.85)", inkSoft: "rgba(255,255,255,0.55)", inkFaint: "rgba(255,255,255,0.25)",
      bgA: hsla(base+220, 75, 10, 1), bgB: hsla(base+260, 82, 14, 1), bgC: hsla(base+310, 68, 9, 1) };
  }

  // ===================== Shapes =====================
  function starPath(cx, cy, rOuter, rInner, points, rot = 0) {
    const step = Math.PI / points;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = (i % 2 === 0) ? rOuter : rInner;
      const a = rot + i * step;
      const [x, y] = polar(cx, cy, r, a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }

  function petalPath(cx, cy, rIn, rOut, widthAng, rot) {
    const a0 = rot - widthAng * 0.5, a1 = rot + widthAng * 0.5;
    const [x0, y0] = polar(cx, cy, rIn, a0);
    const [x1, y1] = polar(cx, cy, rOut, rot);
    const [x2, y2] = polar(cx, cy, rIn, a1);
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.bezierCurveTo(cx+Math.cos(rot)*rOut*0.55, cy+Math.sin(rot)*rOut*0.55, cx+Math.cos(rot)*rOut*1.05, cy+Math.sin(rot)*rOut*1.05, x1, y1);
    ctx.bezierCurveTo(cx+Math.cos(rot)*rOut*1.05, cy+Math.sin(rot)*rOut*1.05, cx+Math.cos(rot)*rOut*0.55, cy+Math.sin(rot)*rOut*0.55, x2, y2);
    ctx.closePath();
  }

  function diamondPath(cx, cy, rMid, h, w, rot) {
    const [mx, my] = polar(cx, cy, rMid, rot);
    const ux = Math.cos(rot), uy = Math.sin(rot), px = -uy, py = ux;
    ctx.beginPath();
    ctx.moveTo(mx+ux*h, my+uy*h); ctx.lineTo(mx+px*w, my+py*w);
    ctx.lineTo(mx-ux*h, my-uy*h); ctx.lineTo(mx-px*w, my-py*w);
    ctx.closePath();
  }

  function ribbonArc(cx, cy, r, rot, span, thick) {
    ctx.beginPath(); ctx.arc(cx, cy, r, rot-span/2, rot+span/2); ctx.stroke();
    ctx.save(); ctx.globalAlpha *= 0.35; ctx.lineWidth = Math.max(1, thick*0.35);
    ctx.beginPath(); ctx.arc(cx, cy, r-thick*0.25, rot-span/2, rot+span/2); ctx.stroke();
    ctx.restore();
  }

  function zigzagBand(cx, cy, r, slices, phase, amp) {
    const step = TAU / slices;
    ctx.beginPath();
    for (let i = 0; i <= slices; i++) {
      const a = phase + i * step, rr = r + (i % 2 === 0 ? amp : -amp);
      const [x, y] = polar(cx, cy, rr, a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
  }

  function chevronTile(cx, cy, r, rot, scale) {
    const [mx, my] = polar(cx, cy, r, rot);
    const ux = Math.cos(rot), uy = Math.sin(rot), px = -uy, py = ux, s = scale;
    ctx.beginPath();
    ctx.moveTo(mx-px*s*0.9, my-py*s*0.9);
    ctx.lineTo(mx+ux*s*1.1, my+uy*s*1.1);
    ctx.lineTo(mx+px*s*0.9, my+py*s*0.9);
    ctx.stroke();
  }

  function heartPath(x, y, size, rot = 0) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    const s = size;
    ctx.beginPath();
    ctx.moveTo(0, s*0.28);
    ctx.bezierCurveTo(s*0.55, -s*0.35, s*1.2, s*0.25, 0, s*1.08);
    ctx.bezierCurveTo(-s*1.2, s*0.25, -s*0.55, -s*0.35, 0, s*0.28);
    ctx.closePath(); ctx.restore();
  }

  // ===================== State =====================
  function makeState(seedStr) {
    const rng = rngFrom(seedStr);
    const pal = makePalette(rng);
    const slices = [9,10,12,14,16,18,20,24,28][Math.floor(rng()*9)];
    const rings = 7 + Math.floor(rng()*5);
    const motifs = ["petals","beads","diamonds","stars","ribbons","zigzag","chevrons","hearts","spokes","halo"];
    for (let i = motifs.length-1; i > 0; i--) { const j = Math.floor(rng()*(i+1)); [motifs[i],motifs[j]]=[motifs[j],motifs[i]]; }
    const ringDefs = [];
    let base = 0.10+rng()*0.05, band = 0.055+rng()*0.03;
    for (let i = 0; i < rings; i++) {
      const thickness = band*(0.95+rng()*1.15), gap = band*(0.35+rng()*0.95);
      ringDefs.push({ motif: motifs[i%motifs.length], r0: base, r1: base+thickness,
        sliceMul: [1,1,2,2,3][Math.floor(rng()*5)], phase: rng()*TAU, twist: (rng()-0.5)*0.55,
        detail: 0.55+rng()*1.0, weight: 1.2+rng()*2.8, hueIdx: i+rng()*3, fillBand: rng()<0.45 });
      base = base+thickness+gap;
    }
    const center = { starPoints: 6+Math.floor(rng()*7), ro: 0.085+rng()*0.035, ri: 0.035+rng()*0.03, rings: 2+Math.floor(rng()*3), phase: rng()*TAU };
    const frame  = { rings: 2+Math.floor(rng()*3), tick: 0.012+rng()*0.014, phase: rng()*TAU };
    const mode = ["prism","sunburst","kaleido","candy","neonlace"][Math.floor(rng()*5)];
    return { seedStr, slices, rings, ringDefs, center, frame, pal, mode };
  }

  function interpState(a, b, t) {
    const s = {};
    s.slices = Math.round(lerp(a.slices, b.slices, t));
    s.rings  = Math.round(lerp(a.rings,  b.rings,  t));
    s.mode   = t < 0.5 ? a.mode : b.mode;
    s.pal    = t < 0.5 ? a.pal  : b.pal;
    s.center = { starPoints: Math.round(lerp(a.center.starPoints,b.center.starPoints,t)), ro: lerp(a.center.ro,b.center.ro,t), ri: lerp(a.center.ri,b.center.ri,t), rings: Math.round(lerp(a.center.rings,b.center.rings,t)), phase: lerp(a.center.phase,b.center.phase,t) };
    s.frame  = { rings: Math.round(lerp(a.frame.rings,b.frame.rings,t)), tick: lerp(a.frame.tick,b.frame.tick,t), phase: lerp(a.frame.phase,b.frame.phase,t) };
    const n = Math.min(a.ringDefs.length, b.ringDefs.length);
    s.ringDefs = [];
    for (let i = 0; i < n; i++) {
      const ra = a.ringDefs[i], rb = b.ringDefs[i];
      s.ringDefs.push({ motif: t<0.5?ra.motif:rb.motif, r0: lerp(ra.r0,rb.r0,t), r1: lerp(ra.r1,rb.r1,t),
        sliceMul: Math.round(lerp(ra.sliceMul,rb.sliceMul,t)), phase: lerp(ra.phase,rb.phase,t),
        twist: lerp(ra.twist,rb.twist,t), detail: lerp(ra.detail,rb.detail,t),
        weight: lerp(ra.weight,rb.weight,t), hueIdx: lerp(ra.hueIdx,rb.hueIdx,t), fillBand: t<0.5?ra.fillBand:rb.fillBand });
    }
    return s;
  }

  // ===================== Confetti =====================
  const confetti = [];
  function burst(pal, now) {
    const cx = innerWidth/2, cy = innerHeight/2;
    for (let i = 0; i < 70; i++) {
      const a = (i/70)*TAU+(Math.random()-0.5)*0.35, sp = 0.6+Math.random()*2.6;
      confetti.push({ x:cx, y:cy, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, born:now, life:900+Math.random()*900,
        size:2+Math.random()*5, rot:Math.random()*TAU,
        kind: Math.random()<0.45?"heart":(Math.random()<0.5?"dot":"rect"),
        col: Math.random()<0.5?pal.neon(i,0.95):pal.pastel(i,0.95) });
    }
  }

  function drawConfetti(now) {
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    for (let i = confetti.length-1; i >= 0; i--) {
      const p = confetti[i], age = now-p.born, tt = age/p.life;
      if (tt >= 1) { confetti.splice(i,1); continue; }
      p.vx*=0.985; p.vy*=0.985; p.x+=p.vx; p.y+=p.vy; p.rot+=0.06;
      ctx.globalAlpha = (1-tt)*0.8;
      if (p.kind==="heart") {
        ctx.fillStyle=p.col; heartPath(p.x,p.y,p.size*0.9,p.rot); ctx.fill();
        ctx.save(); ctx.globalAlpha*=0.45; ctx.strokeStyle="rgba(255,255,255,0.85)"; ctx.lineWidth=1; ctx.stroke(); ctx.restore();
      } else if (p.kind==="rect") {
        ctx.save(); ctx.translate(p.x,p.y); ctx.rotate(p.rot); ctx.fillStyle=p.col;
        ctx.fillRect(-p.size*0.8,-p.size*0.35,p.size*1.6,p.size*0.7); ctx.restore();
      } else {
        const r = p.size*(0.8+0.3*Math.sin(now*0.01+i));
        const g = ctx.createRadialGradient(p.x-r*0.3,p.y-r*0.3,0,p.x,p.y,r*1.8);
        g.addColorStop(0,"rgba(255,255,255,0.95)"); g.addColorStop(0.35,p.col); g.addColorStop(1,"rgba(255,255,255,0)");
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(p.x,p.y,r,0,TAU); ctx.fill();
      }
    }
    ctx.restore();
  }

  // ===================== Background =====================
  function drawBackground(W, H, cx, cy, R, pal, time, mode) {
    ctx.clearRect(0,0,W,H);
    const g = ctx.createRadialGradient(cx,cy,0,cx,cy,Math.min(W,H)*0.80);
    g.addColorStop(0,pal.bgB); g.addColorStop(0.55,pal.bgA); g.addColorStop(1,pal.bgC);
    ctx.fillStyle=g; ctx.fillRect(0,0,W,H);
    ctx.save(); ctx.globalCompositeOperation="lighter"; ctx.globalAlpha=mode==="neonlace"?0.22:0.18;
    const blobs = mode==="sunburst"?3:5;
    for (let i = 0; i < blobs; i++) {
      const t=time*0.00014+i*2.1, x=cx+Math.cos(t*1.15)*W*(0.18+0.03*i)+Math.cos(t*0.7)*W*0.07, y=cy+Math.sin(t*0.95)*H*(0.16+0.03*i)+Math.sin(t*0.6)*H*0.06;
      const rr=Math.min(W,H)*(0.22+0.06*Math.sin(t+i));
      const gg=ctx.createRadialGradient(x,y,0,x,y,rr);
      gg.addColorStop(0,pal.pastel(i,0.95)); gg.addColorStop(0.55,pal.neon(i+1,0.26)); gg.addColorStop(1,"rgba(0,0,0,0)");
      ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(x,y,rr,0,TAU); ctx.fill();
    }
    ctx.restore();
    ctx.save();
    const v=ctx.createRadialGradient(cx,cy,R*0.2,cx,cy,Math.min(W,H)*0.85);
    v.addColorStop(0,"rgba(0,0,0,0)"); v.addColorStop(1,"rgba(0,0,0,0.58)");
    ctx.fillStyle=v; ctx.fillRect(0,0,W,H); ctx.restore();
  }

  // ===================== Mandala =====================
  function drawMandala(state, time, spin) {
    const W=innerWidth, H=innerHeight, cx=W/2, cy=H/2, R=Math.min(W,H)*0.45, pal=state.pal;
    drawBackground(W,H,cx,cy,R,pal,time,state.mode);
    ctx.lineCap="round"; ctx.lineJoin="round";
    ctx.save(); ctx.globalCompositeOperation="lighter"; ctx.globalAlpha=0.22;
    ctx.strokeStyle=pal.neon(0,0.9); ctx.lineWidth=18;
    ctx.beginPath(); ctx.arc(cx,cy,R*0.98,0,TAU); ctx.stroke(); ctx.restore();

    ctx.save(); ctx.translate(cx,cy);
    const cRot=time*0.00022+spin*0.7+(state.mode==="kaleido"?Math.sin(time*0.001)*0.5:0);
    ctx.rotate(cRot);
    const cg=ctx.createRadialGradient(0,0,0,0,0,R*0.20);
    cg.addColorStop(0,pal.pastel(0,0.95)); cg.addColorStop(0.45,pal.neon(2,0.72)); cg.addColorStop(0.75,pal.neon2(4,0.55)); cg.addColorStop(1,"rgba(255,255,255,0)");
    ctx.globalCompositeOperation="lighter"; ctx.fillStyle=cg; ctx.beginPath(); ctx.arc(0,0,R*0.20,0,TAU); ctx.fill();
    ctx.globalCompositeOperation="source-over";
    for (let r=0; r<state.center.rings; r++) {
      ctx.save(); ctx.globalAlpha=0.85-r*0.18;
      ctx.strokeStyle=r%2===0?pal.neon(r,0.9):pal.pastel(r+1,0.8); ctx.lineWidth=2.4-r*0.4;
      ctx.beginPath(); ctx.arc(0,0,R*(state.center.ro*0.55+r*0.018),0,TAU); ctx.stroke(); ctx.restore();
    }
    ctx.strokeStyle=pal.ink; ctx.lineWidth=2.4;
    starPath(0,0,R*state.center.ro,R*state.center.ri,state.center.starPoints,state.center.phase); ctx.stroke();
    const beadN=Math.max(10,state.slices);
    for (let i=0; i<beadN; i++) {
      const a=state.center.phase+i*(TAU/beadN), rr=R*(state.center.ro*0.62);
      const x=Math.cos(a)*rr, y=Math.sin(a)*rr, br=R*0.010*(0.85+0.2*Math.sin(i+time*0.002));
      const bg=ctx.createRadialGradient(x-br*0.35,y-br*0.35,0,x,y,br*1.7);
      bg.addColorStop(0,"rgba(255,255,255,0.95)"); bg.addColorStop(0.35,pal.pastel(i,0.92)); bg.addColorStop(0.70,pal.neon(i,0.92)); bg.addColorStop(1,pal.deep(i+1,0.45));
      ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(x,y,br,0,TAU); ctx.fill();
    }
    ctx.fillStyle="rgba(255,255,255,0.9)"; ctx.beginPath(); ctx.arc(0,0,R*0.009,0,TAU); ctx.fill();
    ctx.restore();

    const baseSlices=Math.max(8,state.slices);
    for (let k=0; k<state.ringDefs.length; k++) {
      const ring=state.ringDefs[k], r0=ring.r0*R, r1=ring.r1*R, mid=(r0+r1)/2, thick=r1-r0;
      const slices=baseSlices*Math.max(1,ring.sliceMul), step=TAU/slices;
      if (ring.fillBand) {
        const bandG=ctx.createConicGradient(ring.phase+spin*0.2,cx,cy);
        for (let s=0; s<10; s++) bandG.addColorStop(s/10,pal.neon(s+k,0.22));
        ctx.save(); ctx.globalCompositeOperation="lighter"; ctx.fillStyle=bandG;
        ctx.beginPath(); ctx.arc(cx,cy,r1,0,TAU); ctx.arc(cx,cy,r0,0,TAU,true); ctx.closePath(); ctx.fill(); ctx.restore();
      }
      ctx.save(); ctx.globalAlpha=0.45; ctx.strokeStyle=pal.inkFaint; ctx.lineWidth=1.3;
      ctx.beginPath(); ctx.arc(cx,cy,r0,0,TAU); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx,cy,r1,0,TAU); ctx.stroke(); ctx.restore();

      for (let i=0; i<slices; i++) {
        const wob=0.18*Math.sin(time*0.0004+i*0.13+k*0.85);
        const a=ring.phase+i*step+ring.twist*Math.sin(time*0.00026+k*0.7)+wob*0.04+spin*0.22;
        const huePick=ring.hueIdx+i*0.35, stroke1=pal.neon(huePick,0.92), stroke2=pal.neon2(huePick+1,0.70);
        const blend=(ring.motif==="halo"||ring.motif==="ribbons"||ring.motif==="zigzag")?"lighter":"source-over";
        ctx.save(); ctx.globalCompositeOperation=blend; ctx.strokeStyle=stroke1; ctx.lineWidth=ring.weight;
        switch (ring.motif) {
          case "petals": {
            petalPath(cx,cy,r0+thick*0.18,r1-thick*0.14,step*(0.75+0.22*ring.detail),a);
            const [fx,fy]=polar(cx,cy,(r0+thick*0.18+r1-thick*0.14)/2,a);
            const pg=ctx.createRadialGradient(fx,fy,0,fx,fy,thick*1.35);
            pg.addColorStop(0,pal.pastel(huePick,0.62)); pg.addColorStop(0.55,stroke2); pg.addColorStop(1,"rgba(255,255,255,0)");
            ctx.fillStyle=pg; ctx.fill(); ctx.stroke();
            ctx.save(); ctx.globalAlpha=0.35; ctx.strokeStyle="rgba(255,255,255,0.8)"; ctx.lineWidth=Math.max(1,ring.weight*0.3);
            const [x0,y0]=polar(cx,cy,r0+thick*0.18,a), [x1,y1]=polar(cx,cy,r1-thick*0.14,a);
            ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke(); ctx.restore(); break;
          }
          case "beads": {
            const br=thick*(0.10+0.06*ring.detail), [x,y]=polar(cx,cy,mid,a);
            const bg=ctx.createRadialGradient(x-br*0.35,y-br*0.35,0,x,y,br*1.75);
            bg.addColorStop(0,"rgba(255,255,255,0.95)"); bg.addColorStop(0.32,pal.pastel(huePick,0.95)); bg.addColorStop(0.70,stroke1); bg.addColorStop(1,pal.deep(huePick+2,0.55));
            ctx.fillStyle=bg; ctx.beginPath(); ctx.arc(x,y,br,0,TAU); ctx.fill();
            ctx.save(); ctx.globalAlpha=0.42; ctx.strokeStyle="rgba(255,255,255,0.85)"; ctx.lineWidth=1;
            ctx.beginPath(); ctx.arc(x,y,br*1.05,0,TAU); ctx.stroke(); ctx.restore(); break;
          }
          case "diamonds": {
            diamondPath(cx,cy,mid,thick*(0.48+0.20*ring.detail),thick*(0.28+0.20*ring.detail),a);
            const [dx,dy]=polar(cx,cy,mid,a);
            const dg=ctx.createRadialGradient(dx,dy,0,dx,dy,thick*1.4);
            dg.addColorStop(0,pal.pastel(huePick,0.58)); dg.addColorStop(0.55,stroke2); dg.addColorStop(1,"rgba(255,255,255,0)");
            ctx.fillStyle=dg; ctx.fill(); ctx.strokeStyle=stroke1; ctx.stroke(); break;
          }
          case "stars": {
            const ro=thick*(0.62+0.26*ring.detail), ri=ro*(0.42+0.20*Math.sin(k+i)), pts=5+((k+i)%6);
            const [sx,sy]=polar(cx,cy,mid,a);
            ctx.save(); ctx.translate(sx,sy); ctx.rotate(a);
            starPath(0,0,ro,ri,pts,0);
            const sg=ctx.createRadialGradient(0,0,0,0,0,ro*1.5);
            sg.addColorStop(0,pal.pastel(huePick,0.70)); sg.addColorStop(0.5,stroke1); sg.addColorStop(1,"rgba(255,255,255,0)");
            ctx.fillStyle=sg; ctx.fill(); ctx.globalAlpha=0.9; ctx.strokeStyle="rgba(255,255,255,0.78)"; ctx.lineWidth=Math.max(1.2,ring.weight*0.55); ctx.stroke(); ctx.restore(); break;
          }
          case "ribbons": {
            ctx.globalAlpha=0.85; ctx.strokeStyle=stroke1; ctx.lineWidth=thick*(0.35+0.25*ring.detail);
            ribbonArc(cx,cy,mid,a,step*(0.72+0.25*ring.detail),ctx.lineWidth);
            ctx.globalAlpha=0.55; ctx.strokeStyle=stroke2; ctx.lineWidth*=0.60;
            ribbonArc(cx,cy,mid-thick*0.10,a+step*0.10,step*(0.55+0.2*ring.detail),ctx.lineWidth); break;
          }
          case "zigzag": {
            if (i===0) {
              ctx.globalAlpha=0.85; ctx.strokeStyle=stroke1; ctx.lineWidth=thick*(0.22+0.10*ring.detail);
              zigzagBand(cx,cy,mid,slices,ring.phase+time*0.00016+spin*0.2,thick*(0.14+0.08*ring.detail));
              ctx.globalAlpha=0.45; ctx.strokeStyle=stroke2; ctx.lineWidth*=0.55;
              zigzagBand(cx,cy,mid-thick*0.10,slices,ring.phase+time*0.00018+spin*0.22,thick*(0.10+0.06*ring.detail));
            } break;
          }
          case "chevrons": {
            ctx.globalAlpha=0.9; ctx.strokeStyle=stroke1; ctx.lineWidth=Math.max(1.2,ring.weight*0.65);
            chevronTile(cx,cy,mid,a,thick*(0.22+0.14*ring.detail));
            ctx.save(); ctx.globalCompositeOperation="lighter"; ctx.globalAlpha=0.55;
            const [ddx,ddy]=polar(cx,cy,mid,a+step*0.5), rr2=thick*(0.22+0.14*ring.detail)*0.18;
            const gg=ctx.createRadialGradient(ddx-rr2*0.3,ddy-rr2*0.3,0,ddx,ddy,rr2*2.2);
            gg.addColorStop(0,"rgba(255,255,255,0.95)"); gg.addColorStop(0.4,pal.pastel(huePick+1,0.95)); gg.addColorStop(1,"rgba(255,255,255,0)");
            ctx.fillStyle=gg; ctx.beginPath(); ctx.arc(ddx,ddy,rr2,0,TAU); ctx.fill(); ctx.restore(); break;
          }
          case "hearts": {
            const [hx,hy]=polar(cx,cy,mid,a), sz=thick*(0.14+0.12*ring.detail);
            ctx.fillStyle=pal.pastel(huePick,0.70); heartPath(hx,hy,sz,a+Math.PI/2); ctx.fill();
            ctx.save(); ctx.globalAlpha=0.55; ctx.strokeStyle="rgba(255,255,255,0.85)"; ctx.lineWidth=1; ctx.stroke(); ctx.restore(); break;
          }
          case "spokes": {
            ctx.save(); ctx.globalAlpha=0.9; ctx.strokeStyle=stroke1; ctx.lineWidth=Math.max(1.2,ring.weight*0.75);
            const [x0,y0]=polar(cx,cy,r0+thick*0.05,a), [x1,y1]=polar(cx,cy,r1-thick*0.05,a);
            ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
            ctx.globalCompositeOperation="lighter"; ctx.fillStyle=pal.pastel(huePick+1,0.85);
            ctx.beginPath(); ctx.arc(x0,y0,thick*0.06,0,TAU); ctx.fill();
            ctx.beginPath(); ctx.arc(x1,y1,thick*0.07,0,TAU); ctx.fill(); ctx.restore(); break;
          }
          case "halo": {
            ctx.save(); ctx.globalCompositeOperation="lighter"; ctx.globalAlpha=0.70;
            ctx.strokeStyle=stroke2; ctx.lineWidth=thick*(0.18+0.12*ring.detail);
            ribbonArc(cx,cy,mid,a,step*(0.55+0.25*ring.detail),ctx.lineWidth);
            ctx.globalAlpha=0.35; ctx.strokeStyle=pal.pastel(huePick+2,0.75); ctx.lineWidth*=0.55;
            ribbonArc(cx,cy,mid-thick*0.12,a+step*0.08,step*(0.38+0.18*ring.detail),ctx.lineWidth); ctx.restore(); break;
          }
        }
        ctx.restore();
      }
    }

    const frameR=R*0.99, frameSlices=Math.max(36,baseSlices*2), st=TAU/frameSlices;
    for (let fr=0; fr<state.frame.rings; fr++) {
      const rr=frameR-fr*(R*0.038);
      ctx.save(); ctx.globalCompositeOperation="lighter"; ctx.globalAlpha=0.22-fr*0.04;
      ctx.strokeStyle=pal.neon(fr+2,0.9); ctx.lineWidth=12;
      ctx.beginPath(); ctx.arc(cx,cy,rr,0,TAU); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.globalAlpha=0.45-fr*0.10; ctx.strokeStyle=pal.inkSoft; ctx.lineWidth=1.3;
      ctx.beginPath(); ctx.arc(cx,cy,rr,0,TAU); ctx.stroke();
      ctx.globalAlpha=0.30-fr*0.06;
      for (let i=0; i<frameSlices; i++) {
        const a=state.frame.phase+i*st+spin*0.2;
        const len=R*state.frame.tick*(0.9+0.35*Math.sin(i*0.7+fr+time*0.001));
        const [x0,y0]=polar(cx,cy,rr-len,a), [x1,y1]=polar(cx,cy,rr+len*0.32,a);
        ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(x1,y1); ctx.stroke();
      }
      ctx.restore();
    }
    drawConfetti(time);
  }

  // ===================== Morph engine =====================
  let clickCount=0;
  let aState=makeState("seed:0"), bState=makeState("seed:1");
  let morphStart=performance.now(), morphDur=1100;
  let dragging=false, lastX=0, spin=0, spinVel=0;

  function currentState() {
    const now=performance.now(), t=ease(clamp((now-morphStart)/morphDur,0,1));
    return interpState(aState,bState,t);
  }

  function newTarget(spark=true) {
    clickCount++;
    aState=currentState();
    bState=makeState("seed:"+clickCount+":"+Math.floor(Math.random()*1e9));
    morphStart=performance.now(); morphDur=850+Math.random()*900;
    if (spark) burst(bState.pal,performance.now());
  }

  addEventListener("pointerdown",(e)=>{ dragging=true; lastX=e.clientX; newTarget(true); },{passive:true});
  addEventListener("pointermove",(e)=>{ if(!dragging)return; spinVel+=(e.clientX-lastX)*0.0010; lastX=e.clientX; },{passive:true});
  addEventListener("pointerup",()=>{ dragging=false; },{passive:true});
  addEventListener("pointercancel",()=>{ dragging=false; },{passive:true});

  document.getElementById("morphBtn").addEventListener("click",(e)=>{ e.stopPropagation(); newTarget(true); });
  document.getElementById("remixBtn").addEventListener("click",(e)=>{
    e.stopPropagation(); clickCount+=10;
    aState=makeState("seed:remix:"+clickCount+":"+Math.floor(Math.random()*1e9));
    bState=makeState("seed:remix:"+(clickCount+1)+":"+Math.floor(Math.random()*1e9));
    morphStart=performance.now(); morphDur=700+Math.random()*700;
    burst(bState.pal,performance.now());
  });

  addEventListener("keydown",(e)=>{
    if (e.code==="Space") burst(currentState().pal,performance.now());
    if (e.key==="s"||e.key==="S") { const a=document.createElement("a"); a.download="neon-candy-mandala.png"; a.href=canvas.toDataURL("image/png"); a.click(); }
  });

  function loop(t) {
    const mt=ease(clamp((t-morphStart)/morphDur,0,1));
    const s=interpState(aState,bState,mt);
    spinVel*=0.92; spin+=spinVel;
    drawMandala(s,t,spin);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
