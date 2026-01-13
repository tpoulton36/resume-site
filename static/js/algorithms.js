/* static/js/algorithms.js
   Shared dataset + Bubble Sort vs Optimized Bubble Sort
   Synchronized run, restart, randomize, size, speed
*/

(() => {
  // ---------- DOM ----------
  const btnRun = document.getElementById("btnRun");
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


  if (!btnRun || !canvasLeft || !canvasRight) {
    console.error("Missing DOM Algorithms page elements not found. Check template IDs:");
    return;
  }

  // ---------- State ----------
  let dataset = [];
  let leftData = [];
  let rightData = [];

  //Used to cancel a run safely when Restart or Randomize is clicked
  let runToken = 0;

  const leftMetrics = {comparisons: 0, swaps: 0, passes: 0, timeMS: 0};
  const rightMetrics = {comparisons: 0, swaps: 0, passes: 0, timeMS: 0};

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

  function setControlsEnabled(enabled) {
    btnRun.disabled = !enabled;
    btnRestart.disabled = !enabled;
    btnRandomize.disabled = !enabled;
    inputSize.disabled = !enabled;
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
    statStatus.textContent = "Idle";

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
      // cancel check
      if (runToken !== tokenAtStart) return { cancelled: true };

      let swappedThisPass = false;

      for (let j = 0; j < n - 1 - i; j++) {
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
    baseData = generateDataset(inputSize.value);
    leftData = baseData.slice();
    rightData = baseData.slice();
    resetMetrics();
    renderAll();
  }

  async function runBoth() {
    // prevent double starts
    runToken += 1;
    const tokenAtStart = runToken;

    resetMetrics();
    statStatus.textContent = "Running";
    setControlsEnabled(false);

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

    // if cancelled, do not stamp results
    if (runToken !== tokenAtStart || rLeft.cancelled || rRight.cancelled) {
      statStatus.textContent = "Idle";
      setControlsEnabled(true);
      return;
    }

    computeWinner();
    statStatus.textContent = "Done";
    setControlsEnabled(true);
  }

  // ---------- Event Wiring ----------
  btnRandomize.addEventListener("click", () => randomizeData());

  btnRestart.addEventListener("click", () => {
    randomizeData();
  });

  btnRun.addEventListener("click", () => {
    runBoth();
  });

  inputSize.addEventListener("input", () => {
    // live resize regenerates dataset
    randomizeData();
  });

  // Speed affects delay; no need to regenerate
  inputSpeed.addEventListener("input", () => {
    // nothing required here yet
  });

  // ---------- Init ----------

  // Force default slider positions on load and refresh
inputSize.value = "25";   // 25% of range
inputSpeed.value = "100"; // max speed

  randomizeData();
})();













