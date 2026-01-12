// Algorithms page boot file
// For now, just prove the page-specific JS is loading.

console.log("Algorithms page loaded");

const basicMount = document.getElementById("bubble-basic-mount");
const optMount = document.getElementById("bubble-optimized-mount");

if (basicMount) basicMount.textContent = "Bubble Sort (Basic) mount ready";
if (optMount) optMount.textContent = "Bubble Sort (Optimized) mount ready";
