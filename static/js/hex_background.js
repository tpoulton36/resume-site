// static/js/hex_background.js
(() => {
  const canvas = document.getElementById("hexCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  // Match your accent from style.css
  const ACCENT = { r: 144, g: 202, b: 249 }; // #90caf9

  let w = 0;
  let h = 0;
  let dpr = 1;

  function resize() {
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    w = Math.floor(window.innerWidth);
    h = Math.floor(window.innerHeight);

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function hexPoints(cx, cy, r) {
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + Math.PI / 6; // flat top look
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
  }

  function drawHex(cx, cy, r, strokeAlpha, glowAlpha) {
    const pts = hexPoints(cx, cy, r);

    // subtle glow pass
    if (glowAlpha > 0) {
      ctx.save();
      ctx.shadowColor = `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, ${glowAlpha})`;
      ctx.shadowBlur = 18;
      ctx.strokeStyle = `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, ${glowAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    }

    // base stroke
    ctx.strokeStyle = `rgba(255, 255, 255, ${strokeAlpha})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.stroke();
  }

  function draw(t) {
    const time = t * 0.001;

    ctx.clearRect(0, 0, w, h);

    // Big hexes
    const r = 42; // size of hex radius in px
    const xStep = r * 1.75;
    const yStep = r * 1.52;

    // Subtle base lines
    const baseStroke = 0.10;

    // Rolling glow wave params
    const waveSpeed = 0.6;
    const waveWidth = 220;

    // Slight vignette background to make lines visible
    ctx.fillStyle = "rgba(18, 18, 18, 0.55)";
    ctx.fillRect(0, 0, w, h);

    // Hex grid
    for (let row = -2; row * yStep < h + yStep * 2; row++) {
      const y = row * yStep;
      const xOffset = (row % 2) * (xStep / 2);

      for (let col = -2; col * xStep < w + xStep * 2; col++) {
        const x = col * xStep + xOffset;

        // Wave intensity based on distance to a moving diagonal band
        const bandPos = (time * waveSpeed * 400) % (w + h);
        const diag = x + y;
        const dist = Math.abs(diag - bandPos);

        const glow = dist < waveWidth
          ? (1 - dist / waveWidth) * 0.35
          : 0;

        drawHex(x, y, r, baseStroke, glow);
      }
    }

    requestAnimationFrame(draw);
  }

  window.addEventListener("resize", resize);
  resize();
  requestAnimationFrame(draw);
})();
