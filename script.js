const canvas = document.querySelector("#neural-bg");
const ctx = canvas.getContext("2d");
const trailCanvas = document.querySelector("#cursor-trail");
const trailCtx = trailCanvas.getContext("2d");
const chaser = document.querySelector(".ai-chaser");
const reveals = [...document.querySelectorAll(".reveal")];
const glowCards = [...document.querySelectorAll(".work-card, .project, .project-card, .skill-matrix > div, .tech-strip span")];
const ticker = document.querySelector(".ticker div");

let width = 0;
let height = 0;
let particles = [];
let mouse = { x: innerWidth / 2, y: innerHeight / 2 };
let chaserPoint = { x: innerWidth / 2, y: innerHeight / 2 };
let time = 0;
let trailPoints = [];

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

document.querySelectorAll(".tech-lane, .tech-group").forEach((lane) => {
  lane.addEventListener("click", () => {
    lane.classList.toggle("is-paused");
  });
  lane.addEventListener("mouseleave", () => {
    lane.classList.remove("is-paused");
  });
});

document.querySelectorAll(".project-actions button").forEach((button) => {
  button.addEventListener("click", () => {
    const card = button.closest(".project-card");
    if (!card) return;
    const expanded = card.classList.toggle("is-expanded");
    button.textContent = expanded ? "Show less ↑" : "Know more ↓";
  });
});

const experienceCards = [...document.querySelectorAll(".experience-card")];
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
