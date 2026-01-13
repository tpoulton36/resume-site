/* static/js/algorithms.js
   Shared dataset + Bubble Sort vs Optimized Bubble Sort
   Synchronized run, restart, randomize, size, speed
*/

(() => {
  // ---------- DOM ----------
  const btnRun = document.getElementById("btnRun");
  const btnStop = document.getElementById("btnStop");
  const btnRestart = document.getElementById("btnRestart");
  const btnRandomize = document.getElementById("btnRandomize");
  const inputSize = document.getElementById("inputSize");
  const inputSpeed = document.getElementById("inputSpeed");

  const canvasLeft = document.getElementById("canvasLeft");
  const canvasRight = document.getElementById("canvasRight");

  const statLeftComparisons = document.getElementById("statLeftComparisons");
  const statLeftSwaps = document.getElementById("statLeftSwaps");
  const statLeftTime = document.getElementById("statLeftTime");

  const statRightComparisons = document.getElementById("statRightComparisons");
  const statRightSwaps = document.getElementById("statRightSwaps");
  const statRightTime = document.getElementById("statRightTime");

  const statFasterPct = document.getElementById("statFasterPct");
  const statWinner = document.getElementById("statWinner");
  const statStatus = document.getElementById("statStatus");

  const statLeftPasses = document.getElementById("statLeftPasses");
  const statRightPasses = document.getElementById("statRightPasses");

  const statDatasetN = document.getElementById("statDatasetN");



  if (!btnRun || !canvasLeft || !canvasRight) {
    console.error("Missing DOM Algorithms page elements not found. Check template IDs:");
    return;
  }

  // ---------- State ----------
  let baseData = [];
  let leftData = [];
  let rightData = [];

  let isRunning = false;
  let isPaused = false;

  //Used to cancel a run safely when Restart or Randomize is clicked
  let runToken = 0;

  const leftMetrics = {comparisons: 0, swaps: 0, passes: 0, timeMs: 0};
  const rightMetrics = {comparisons: 0, swaps: 0, passes: 0, timeMs: 0};

  // Track current highlighted indices for rendering
  let leftHighlight = { a: -1, b: -1, swapped: false };
  let rightHighlight = { a: -1, b: -1, swapped: false };

  // ---------- Utils ----------
  function clamp(n, lo, hi) {
    return Math.max(lo, Math.min(hi, n));
  }

  function delayMsFromSpeed(speedVal) {
    // speedVal: 1..100
    // higher speed = less delay
    const s = clamp(Number(speedVal) || 50, 1, 100);
    return Math.round((101 - s) * 3); // 3ms..300ms
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async function waitWhilePaused(tokenAtStart) {
  while (isPaused) {
    if (runToken !== tokenAtStart) return false;
    await sleep(30);
  }
  return true;
}

function setControlsEnabled(mode) {
  // mode: "idle" | "running" | "paused"
  if (mode === "idle") {
    btnRun.disabled = false;
    btnRun.textContent = "Run";
    btnStop.disabled = true; // Pause disabled when idle
    btnStop.textContent = "Pause";
    btnRestart.disabled = false;
    btnRandomize.disabled = false;
    inputSize.disabled = false;
    return;
  }

  if (mode === "running") {
    btnRun.disabled = true;
    btnRun.textContent = "Run";
    btnStop.disabled = false; // Pause enabled
    btnStop.textContent = "Pause";
    btnRestart.disabled = true;
    btnRandomize.disabled = true;
    inputSize.disabled = true;
    return;
  }

  // paused
  btnRun.disabled = false;
  btnRun.textContent = "Resume";
  btnStop.disabled = true; // keep pause disabled while paused
  btnStop.textContent = "Paused";
  btnRestart.disabled = false; // allow reset while paused
  btnRandomize.disabled = false; // allow randomize while paused
  inputSize.disabled = false;
}


  function formatRuntime(ms) {
  const n = Math.max(0, Number(ms) || 0);

  if (n < 1000) {
    return `${n} ms`;
  }

  const seconds = n / 1000;
  return `${seconds.toFixed(2)} s`;
}


  // ---------- Dataset ----------
  function generateDataset(size) {
    const n = clamp(Number(size) || 60, 10, 150);
    // Values in [0.05..1.0] for prettier bars
    const arr = [];
    for (let i = 0; i < n; i++) {
      arr.push(0.05 + Math.random() * 0.95);
    }
    return arr;
  }

  function resetMetrics() {
    leftMetrics.comparisons = 0;
    leftMetrics.swaps = 0;
    leftMetrics.passes = 0;
    leftMetrics.timeMs = 0;

    rightMetrics.comparisons = 0;
    rightMetrics.swaps = 0;
    rightMetrics.passes = 0;
    rightMetrics.timeMs = 0;

    leftHighlight = { a: -1, b: -1, swapped: false };
    rightHighlight = { a: -1, b: -1, swapped: false };

    statFasterPct.textContent = "0";
    statWinner.textContent = "None";
    //statStatus.textContent = "Idle";

    syncMetricsToDOM();
  }

  function syncMetricsToDOM() {
    statLeftComparisons.textContent = String(leftMetrics.comparisons);
    statLeftSwaps.textContent = String(leftMetrics.swaps);
    statLeftPasses.textContent = String(leftMetrics.passes);
    statLeftTime.textContent = formatRuntime(leftMetrics.timeMs);

    statRightComparisons.textContent = String(rightMetrics.comparisons);
    statRightSwaps.textContent = String(rightMetrics.swaps);
    statRightPasses.textContent = String(rightMetrics.passes);
    statRightTime.textContent = formatRuntime(rightMetrics.timeMs);
    }


  // ---------- Rendering ----------
  function clearCanvas(ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
  }

  function drawBars(canvas, data, highlight) {
    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;

    clearCanvas(ctx, w, h);

    const n = data.length;
    if (n === 0) return;

    const pad = 12;
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;

    const barW = innerW / n;

    // baseline
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.10)";
    ctx.beginPath();
    ctx.moveTo(pad, h - pad);
    ctx.lineTo(w - pad, h - pad);
    ctx.stroke();

    for (let i = 0; i < n; i++) {
      const v = data[i];
      const barH = v * innerH;

      const x = pad + i * barW;
      const y = h - pad - barH;

      const isA = i === highlight.a;
      const isB = i === highlight.b;

      // default bar
      let fill = "rgba(255,255,255,0.55)";

      // compare highlight
      if (isA || isB) fill = "rgba(255,255,255,0.90)";

      // swap highlight
      if ((isA || isB) && highlight.swapped) fill = "rgba(255,255,255,1)";

      ctx.fillStyle = fill;

      // slightly shrink bars to show separation
      const bw = Math.max(1, barW * 0.92);
      ctx.fillRect(x, y, bw, barH);
    }
  }

  function renderAll() {
    drawBars(canvasLeft, leftData, leftHighlight);
    drawBars(canvasRight, rightData, rightHighlight);
    syncMetricsToDOM();
  }

  // ---------- Sorting Runners ----------
  async function runBubbleSort(data, metrics, setHighlight, tokenAtStart, isOptimized) {
    const n = data.length;
    const start = performance.now();

    const delay = delayMsFromSpeed(inputSpeed.value);

    for (let i = 0; i < n - 1; i++) {
      metrics.passes += 1;

      if (isPaused) {
        const ok = await waitWhilePaused(tokenAtStart);
        if (!ok) return { cancelled: true };
      }


      // cancel check
      if (runToken !== tokenAtStart) return { cancelled: true };

      let swappedThisPass = false;

      for (let j = 0; j < n - 1 - i; j++) {

        if (isPaused) {
        const ok = await waitWhilePaused(tokenAtStart);
        if (!ok) return { cancelled: true };
        }

        if (runToken !== tokenAtStart) return { cancelled: true };

        metrics.comparisons += 1;
        setHighlight(j, j + 1, false);
        renderAll();

        if (data[j] > data[j + 1]) {
          const tmp = data[j];
          data[j] = data[j + 1];
          data[j + 1] = tmp;

          metrics.swaps += 1;
          swappedThisPass = true;

          setHighlight(j, j + 1, true);
          renderAll();
        }

        if (delay > 0) await sleep(delay);
      }

      if (isOptimized && !swappedThisPass) {
        break;
      }
    }

    const end = performance.now();
    metrics.timeMs = Math.max(0, Math.round(end - start));

    setHighlight(-1, -1, false);
    renderAll();

    return { cancelled: false };
  }

  function leftSetHighlight(a, b, swapped) {
    leftHighlight = { a, b, swapped };
  }

  function rightSetHighlight(a, b, swapped) {
    rightHighlight = { a, b, swapped };
  }

  function computeWinner() {
    const leftT = leftMetrics.timeMs;
    const rightT = rightMetrics.timeMs;

    if (leftT === 0 && rightT === 0) {
      statFasterPct.textContent = "0";
      statWinner.textContent = "None";
      return;
    }

    let winner = "None";
    let fasterPct = 0;

    if (leftT === rightT) {
      winner = "Tie";
      fasterPct = 0;
    } else {
      const fasterIsLeft = leftT < rightT;
      const faster = fasterIsLeft ? leftT : rightT;
      const slower = fasterIsLeft ? rightT : leftT;

      winner = fasterIsLeft ? "Left" : "Right";
      fasterPct = Math.round(((slower - faster) / slower) * 100);
    }

    statFasterPct.textContent = String(fasterPct);
    statWinner.textContent = winner;
  }

  // ---------- Actions ----------
  function randomizeData() {
    runToken += 1; // cancel any active run
    isRunning = false;
    isPaused = false;
    setControlsEnabled("idle");

    baseData = generateDataset(inputSize.value);
    statDatasetN.textContent = String(baseData.length);
    leftData = baseData.slice();
    rightData = baseData.slice();
    resetMetrics();
    renderAll();
  }

  async function runBoth() {
  // prevent double starts
  runToken += 1;
  const tokenAtStart = runToken;

  isRunning = true;
  isPaused = false;
  statStatus.textContent = "Running";
  setControlsEnabled("running");

  resetMetrics();

  // ensure both start with same base data state
  leftData = baseData.slice();
  rightData = baseData.slice();
  renderAll();

  // run both concurrently
  const pLeft = runBubbleSort(
    leftData,
    leftMetrics,
    leftSetHighlight,
    tokenAtStart,
    false
  );

  const pRight = runBubbleSort(
    rightData,
    rightMetrics,
    rightSetHighlight,
    tokenAtStart,
    true
  );

  const [rLeft, rRight] = await Promise.all([pLeft, pRight]);

  // cancelled or stopped
  if (runToken !== tokenAtStart || rLeft.cancelled || rRight.cancelled) {
    isRunning = false;
    isPaused = false;
    statStatus.textContent = "Idle";
    setControlsEnabled("idle");
    return;
  }

  computeWinner();
  statStatus.textContent = "Done";

  isRunning = false;
  setControlsEnabled("idle");
}

  // ---------- Event Wiring ----------
  btnRandomize.addEventListener("click", () => randomizeData());

btnRestart.addEventListener("click", () => {
  // Cancel any active run and reset to the same dataset
  runToken += 1;
  isRunning = false;
  isPaused = false;

  leftData = baseData.slice();
  rightData = baseData.slice();

  resetMetrics();
  statStatus.textContent = "Idle";
  setControlsEnabled("idle");
  renderAll();
});

btnRun.addEventListener("click", () => {
  if (isRunning && isPaused) {
    isPaused = false;
    statStatus.textContent = "Running";
    setControlsEnabled("running");
    return;
  }

  runBoth();
});

inputSize.addEventListener("input", () => {
  randomizeData();
});

  // Speed affects delay; no need to regenerate
  inputSpeed.addEventListener("input", () => {
    // nothing required here yet
  });

btnStop.addEventListener("click", () => {
  if (!isRunning) return;
  isPaused = true;
  statStatus.textContent = "Paused";
  setControlsEnabled("paused");
});



  // ---------- Init ----------

  // Force default slider positions on load and refresh
  btnStop.disabled = true;
  inputSize.value = "25";   // 25% of range
  inputSpeed.value = "100"; // max speed
  setControlsEnabled("idle");

  randomizeData();
})();













