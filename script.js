const canvas = document.querySelector("#neural-bg");
const ctx = canvas.getContext("2d");
const trailCanvas = document.querySelector("#cursor-trail");
const trailCtx = trailCanvas.getContext("2d");
const chaser = document.querySelector(".ai-chaser");
const reveals = [...document.querySelectorAll(".reveal")];
const glowCards = [...document.querySelectorAll(".work-card, .project, .project-card, .skill-matrix > div, .tech-strip span")];
const ticker = document.querySelector(".ticker div");
const themeToggle = document.querySelector(".theme-toggle");
const musicToggle = document.querySelector(".music-toggle");
const musicSymbol = document.querySelector(".music-symbol");
const loader = document.querySelector(".loader");
const skipLoader = document.querySelector(".skip-loader");

let width = 0;
let height = 0;
let particles = [];
let mouse = { x: innerWidth / 2, y: innerHeight / 2 };
let chaserPoint = { x: innerWidth / 2, y: innerHeight / 2 };
let time = 0;
let trailPoints = [];
let audioCtx = null;
let musicTimer = null;
let musicStep = 0;

const savedTheme = localStorage.getItem("shreya-theme");
if (savedTheme === "light") {
  document.body.classList.add("light-theme");
  if (themeToggle) {
    themeToggle.textContent = "☀";
    themeToggle.setAttribute("aria-label", "Switch to dark theme");
  }
}

(function runLoaderSequence() {
  if (!loader) return;
  let closed = false;
  const closeLoader = (blast = true) => {
    if (closed) return;
    closed = true;
    if (blast) loader.classList.add("is-blasting");
    document.body.classList.add("intro-ready");
    setTimeout(() => {
      loader.classList.add("is-leaving");
      setTimeout(() => loader.remove(), 620);
    }, blast ? 620 : 0);
  };
  const bootTimer = setTimeout(() => closeLoader(true), 2650);
  skipLoader?.addEventListener("click", () => {
    clearTimeout(bootTimer);
    closeLoader(false);
  });
  addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      clearTimeout(bootTimer);
      closeLoader(false);
    }
  });
})();

function playNote(frequency, when, duration = .16) {
  if (!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();
  osc.type = musicStep % 4 === 0 ? "triangle" : "sine";
  osc.frequency.setValueAtTime(frequency, when);
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(1450, when);
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(0.105, when + .018);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  osc.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(when);
  osc.stop(when + duration + .025);
}

function tickMusic() {
  if (!audioCtx) return;
  const scale = [523.25, 659.25, 783.99, 987.77, 880, 783.99, 659.25, 587.33];
  const bass = [130.81, 164.81, 196, 246.94];
  const now = audioCtx.currentTime;
  playNote(scale[musicStep % scale.length], now, .14);
  if (musicStep % 2 === 0) playNote(scale[(musicStep + 2) % scale.length] * 1.5, now + .055, .12);
  if (musicStep % 4 === 0) playNote(bass[(musicStep / 4) % bass.length], now, .2);
  musicStep += 1;
}

function stopMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  musicToggle?.classList.remove("is-active");
  if (musicToggle) {
    musicToggle.setAttribute("aria-label", "Play portfolio music");
    if (musicSymbol) musicSymbol.textContent = "♪";
  }
}

function startMusic() {
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  audioCtx.resume();
  tickMusic();
  musicTimer = setInterval(tickMusic, 185);
  musicToggle?.classList.add("is-active");
  if (musicToggle) {
    musicToggle.setAttribute("aria-label", "Pause portfolio music");
    if (musicSymbol) musicSymbol.textContent = "Ⅱ";
  }
}

function resize() {
  width = innerWidth * devicePixelRatio;
  height = innerHeight * devicePixelRatio;
  if (canvas && ctx) {
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  }
  trailCanvas.width = innerWidth * devicePixelRatio;
  trailCanvas.height = innerHeight * devicePixelRatio;
  trailCanvas.style.width = innerWidth + "px";
  trailCanvas.style.height = innerHeight + "px";
  trailCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  particles = [];
}

function draw() {
  time += .05;
  trailCtx.clearRect(0, 0, innerWidth, innerHeight);
  trailPoints = trailPoints.filter((point) => Date.now() - point.t < 760);
  for (let i = 1; i < trailPoints.length; i++) {
    const a = trailPoints[i - 1];
    const b = trailPoints[i];
    const age = (Date.now() - b.t) / 760;
    trailCtx.strokeStyle = `rgba(77,243,255,${Math.max(0, .68 - age * .68)})`;
    trailCtx.lineWidth = Math.max(1.5, 10 * (1 - age));
    trailCtx.lineCap = "round";
    trailCtx.beginPath();
    trailCtx.moveTo(a.x, a.y);
    trailCtx.lineTo(b.x, b.y);
    trailCtx.stroke();
  }
  if (chaser) {
    chaserPoint.x += (mouse.x - chaserPoint.x) * .18;
    chaserPoint.y += (mouse.y - chaserPoint.y) * .18;
    chaser.style.left = `${chaserPoint.x + 18}px`;
    chaser.style.top = `${chaserPoint.y + 18}px`;
    chaser.style.rotate = `${time * 95}deg`;
  }
  requestAnimationFrame(draw);
}

addEventListener("resize", resize);
addEventListener("pointermove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  trailPoints.push({ x: mouse.x, y: mouse.y, t: Date.now() });
  if (trailPoints.length > 62) trailPoints.shift();
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("visible");
  });
}, { threshold: .16 });
reveals.forEach((el) => observer.observe(el));

glowCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
    card.style.setProperty("--my", `${event.clientY - rect.top}px`);
  });
});

if (ticker) {
  ticker.innerHTML += ticker.innerHTML;
}

themeToggle?.addEventListener("click", () => {
  const light = document.body.classList.toggle("light-theme");
  localStorage.setItem("shreya-theme", light ? "light" : "dark");
  themeToggle.textContent = light ? "☀" : "☾";
  themeToggle.setAttribute("aria-label", light ? "Switch to dark theme" : "Switch to light theme");
});

musicToggle?.addEventListener("click", () => {
  if (musicTimer) stopMusic();
  else startMusic();
});

document.querySelectorAll(".tech-lane, .tech-group").forEach((lane) => {
  lane.addEventListener("click", () => {
    lane.classList.toggle("is-paused");
  });
  lane.addEventListener("mouseleave", () => {
    lane.classList.remove("is-paused");
  });
});

document.querySelectorAll(".project-actions button").forEach((button) => {
  const card = button.closest(".project-card");
  if (!card?.querySelector(".project-details")) {
    button.remove();
    return;
  }
  button.addEventListener("click", () => {
    if (!card) return;
    const expanded = card.classList.toggle("is-expanded");
    button.textContent = expanded ? "Show less ↑" : "Know more ↓";
  });
});

document.querySelectorAll(".experience-more").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".experience-card");
    if (!card) return;
    const expanded = card.classList.toggle("is-expanded");
    button.textContent = expanded ? "Showing details" : "Know more ↓";
  });
});

const experienceCards = [...document.querySelectorAll(".experience-card")];
experienceCards.forEach((card) => {
  const opener = card.querySelector(".experience-more");
  const closer = card.querySelector(".experience-close");
  const closeCard = () => {
    card.classList.remove("is-expanded");
    if (opener) opener.textContent = "Know more ↓";
  };
  closer?.addEventListener("click", closeCard);
  card.addEventListener("mouseleave", closeCard);
});

function updateExperienceStack() {
  experienceCards.forEach((card, index) => {
    const rect = card.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, (105 - rect.top) / 240));
    card.style.setProperty("--stack-scale", String(1 - progress * 0.035 * (experienceCards.length - index)));
    card.style.setProperty("--stack-brightness", String(1 - progress * 0.13));
  });
  requestAnimationFrame(updateExperienceStack);
}

resize();
draw();
updateExperienceStack();
