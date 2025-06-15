window.onload = function () {
  const canvas = document.getElementById("pi-canvas");
  const ctx = canvas.getContext("2d");

  let fontSize = 14;
  let piDigits = "3141592653589793238462643383279502884197169399375105820974944";
  let drops = [];

  function resizeCanvas() {
    // Set internal canvas resolution
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Recalculate columns and reset drops
    let columns = Math.floor(canvas.width / fontSize);
    drops = Array.from({ length: columns }).fill(1);
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  function draw() {
    ctx.fillStyle = "rgba(18, 18, 18, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#90caf9";
    ctx.font = `${fontSize}px monospace`;

    for (let i = 0; i < drops.length; i++) {
      const digit = piDigits[Math.floor(Math.random() * piDigits.length)];
      ctx.fillText(digit, i * fontSize, drops[i] * fontSize);

      if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }

      drops[i]++;
    }
  }

  setInterval(draw, 65);
};
