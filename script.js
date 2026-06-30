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
const loaderCanvas = document.querySelector("#synapse-loader-canvas");
const loaderCtx = loaderCanvas?.getContext("2d");

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
let loaderTrailPoints = [];
let synapseBursting = false;
let synapseBurstStartedAt = 0;
let matrixPoints = [];
let loaderMouse = { x: innerWidth / 2, y: innerHeight / 2, active: false };

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
    if (blast) {
      synapseBursting = true;
      synapseBurstStartedAt = Date.now();
      loader.classList.add("is-blasting");
    }
    document.body.classList.add("intro-ready");
    setTimeout(() => {
      loader.classList.add("is-leaving");
      setTimeout(() => loader.remove(), 620);
    }, blast ? 620 : 0);
  };
  const bootTimer = setTimeout(() => closeLoader(true), 2500);
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
  if (loaderCanvas && loaderCtx) {
    loaderCanvas.width = width;
    loaderCanvas.height = height;
    loaderCanvas.style.width = innerWidth + "px";
    loaderCanvas.style.height = innerHeight + "px";
    loaderCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    initMatrixPoints();
  }
  particles = [];
}

function initMatrixPoints() {
  const count = Math.min(1400, Math.max(520, Math.floor((innerWidth * innerHeight) / 1150)));
  matrixPoints = Array.from({ length: count }, (_, index) => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    z: Math.random() * 1.8 + .18,
    baseX: Math.random() * innerWidth,
    baseY: Math.random() * innerHeight,
    vx: (Math.random() - .5) * .22,
    vy: (Math.random() - .5) * .22,
    tone: index % 11 === 0 ? "lime" : index % 5 === 0 ? "violet" : "cyan",
    glyph: index % 19 === 0 ? ["∑", "λ", "∇", "01", "AI", "x,y"][Math.floor(Math.random() * 6)] : ""
  }));
}

function drawSynapseLoader() {
  if (!loader || !loaderCtx || !document.body.contains(loader)) return;
  const cx = innerWidth / 2;
  const cy = innerHeight / 2;
  const now = Date.now();
  loaderCtx.clearRect(0, 0, innerWidth, innerHeight);
  loaderCtx.save();
  loaderCtx.globalCompositeOperation = "lighter";
  loaderCtx.fillStyle = "rgba(3,3,3,.24)";
  loaderCtx.fillRect(0, 0, innerWidth, innerHeight);

  const burstAge = synapseBursting ? Math.min(1, (now - synapseBurstStartedAt) / 740) : 0;
  const speed = synapseBursting ? 16 + burstAge * 38 : 1;
  loaderCtx.lineCap = "round";

  for (let i = 0; i < matrixPoints.length; i++) {
    const p = matrixPoints[i];
    const dx = p.x - loaderMouse.x;
    const dy = p.y - loaderMouse.y;
    const distance = Math.hypot(dx, dy) || 1;
    const influence = Math.max(0, 1 - distance / 260);
    const swirl = influence * (loaderMouse.active ? 4.8 : 1.2);
    const angle = Math.atan2(dy, dx) + Math.PI / 2;

    p.vx += Math.cos(angle) * swirl * .018 + (dx / distance) * influence * .055;
    p.vy += Math.sin(angle) * swirl * .018 + (dy / distance) * influence * .055;
    p.x += (p.vx + Math.sin(time * .8 + p.z * 4) * .08) * speed;
    p.y += (p.vy + Math.cos(time * .7 + p.z * 3) * .08) * speed;
    p.vx *= .93;
    p.vy *= .93;

    if (synapseBursting) {
      const bx = p.x - cx;
      const by = p.y - cy;
      p.x += bx * .035 * speed;
      p.y += by * .035 * speed;
    }

    if (p.x < -80 || p.x > innerWidth + 80 || p.y < -80 || p.y > innerHeight + 80) {
      p.x = Math.random() * innerWidth;
      p.y = Math.random() * innerHeight;
      p.vx = (Math.random() - .5) * .24;
      p.vy = (Math.random() - .5) * .24;
    }

    const alpha = Math.min(.9, .16 + p.z * .18 + influence * .55);
    const color = p.tone === "lime" ? `rgba(200,255,66,${alpha})` : p.tone === "violet" ? `rgba(141,113,255,${alpha})` : `rgba(77,243,255,${alpha})`;
    loaderCtx.fillStyle = color;
    loaderCtx.beginPath();
    loaderCtx.arc(p.x, p.y, Math.max(.7, p.z * 1.15 + influence * 1.8), 0, Math.PI * 2);
    loaderCtx.fill();

    if (p.glyph && i % 3 === 0) {
      loaderCtx.font = `${8 + p.z * 4}px JetBrains Mono`;
      loaderCtx.fillStyle = `rgba(220,250,255,${.16 + influence * .28})`;
      loaderCtx.fillText(p.glyph, p.x + 8, p.y - 8);
    }
  }

  for (let i = 0; i < matrixPoints.length; i += 12) {
    const a = matrixPoints[i];
    for (let j = i + 24; j < Math.min(matrixPoints.length, i + 96); j += 24) {
      const b = matrixPoints[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d > 132) continue;
      loaderCtx.strokeStyle = `rgba(77,243,255,${(1 - d / 132) * .15})`;
      loaderCtx.lineWidth = .8;
      loaderCtx.beginPath();
      loaderCtx.moveTo(a.x, a.y);
      loaderCtx.lineTo(b.x, b.y);
      loaderCtx.stroke();
    }
  }

  loaderTrailPoints = loaderTrailPoints.filter((point) => now - point.t < 620);
  for (let i = 1; i < loaderTrailPoints.length; i++) {
    const a = loaderTrailPoints[i - 1];
    const b = loaderTrailPoints[i];
    const age = (now - b.t) / 620;
    loaderCtx.strokeStyle = `rgba(200,255,66,${Math.max(0, .75 - age * .75)})`;
    loaderCtx.lineWidth = Math.max(1, 8 * (1 - age));
    loaderCtx.beginPath();
    loaderCtx.moveTo(a.x, a.y);
    loaderCtx.lineTo(b.x, b.y);
    loaderCtx.stroke();
  }
  if (synapseBursting) {
    loaderCtx.strokeStyle = `rgba(200,255,66,${1 - burstAge})`;
    loaderCtx.lineWidth = 2 + burstAge * 10;
    loaderCtx.beginPath();
    loaderCtx.arc(cx, cy, 20 + burstAge * Math.max(innerWidth, innerHeight) * 1.15, 0, Math.PI * 2);
    loaderCtx.stroke();
  }
  loaderCtx.restore();
}

function draw() {
  time += .05;
  drawSynapseLoader();
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
  if (loader && document.body.contains(loader)) {
    loaderMouse.x = mouse.x;
    loaderMouse.y = mouse.y;
    loaderMouse.active = true;
    loaderTrailPoints.push({ x: mouse.x, y: mouse.y, t: Date.now() });
    if (loaderTrailPoints.length > 42) loaderTrailPoints.shift();
  }
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
