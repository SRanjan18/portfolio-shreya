const canvas = document.querySelector("#neural-bg");
const ctx = canvas.getContext("2d");
const trailCanvas = document.querySelector("#cursor-trail");
const trailCtx = trailCanvas.getContext("2d");
const reveals = [...document.querySelectorAll(".reveal")];
const glowCards = [...document.querySelectorAll(".work-card, .project, .skill-matrix > div")];
const ticker = document.querySelector(".ticker div");

let width = 0;
let height = 0;
let particles = [];
let mouse = { x: innerWidth / 2, y: innerHeight / 2 };
let time = 0;
let trailPoints = [];

function resize() {
  width = canvas.width = innerWidth * devicePixelRatio;
  height = canvas.height = innerHeight * devicePixelRatio;
  canvas.style.width = innerWidth + "px";
  canvas.style.height = innerHeight + "px";
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  trailCanvas.width = innerWidth * devicePixelRatio;
  trailCanvas.height = innerHeight * devicePixelRatio;
  trailCanvas.style.width = innerWidth + "px";
  trailCanvas.style.height = innerHeight + "px";
  trailCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  const count = Math.min(78, Math.floor(innerWidth / 18));
  particles = Array.from({ length: count }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    vx: (Math.random() - .5) * .62,
    vy: (Math.random() - .5) * .62,
    r: Math.random() * 1.9 + .8
  }));
}

function draw() {
  time += .018;
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (const p of particles) {
    p.x += p.vx + Math.sin(time + p.y * .01) * .08;
    p.y += p.vy + Math.cos(time + p.x * .01) * .08;
    if (p.x < 0 || p.x > innerWidth) p.vx *= -1;
    if (p.y < 0 || p.y > innerHeight) p.vy *= -1;
    const dx = mouse.x - p.x;
    const dy = mouse.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 160) {
      p.x -= dx * .0018;
      p.y -= dy * .0018;
    }
  }
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const a = particles[i], b = particles[j];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (d < 145) {
        ctx.strokeStyle = `rgba(77,243,255,${(1 - d / 145) * .34})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }
  for (const p of particles) {
    ctx.fillStyle = "rgba(255,255,255,.72)";
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }
  trailCtx.clearRect(0, 0, innerWidth, innerHeight);
  trailPoints = trailPoints.filter((point) => Date.now() - point.t < 620);
  for (let i = 1; i < trailPoints.length; i++) {
    const a = trailPoints[i - 1];
    const b = trailPoints[i];
    const age = (Date.now() - b.t) / 620;
    trailCtx.strokeStyle = `rgba(77,243,255,${Math.max(0, .5 - age * .5)})`;
    trailCtx.lineWidth = Math.max(1, 8 * (1 - age));
    trailCtx.lineCap = "round";
    trailCtx.beginPath();
    trailCtx.moveTo(a.x, a.y);
    trailCtx.lineTo(b.x, b.y);
    trailCtx.stroke();
  }
  requestAnimationFrame(draw);
}

addEventListener("resize", resize);
addEventListener("pointermove", (event) => {
  mouse.x = event.clientX;
  mouse.y = event.clientY;
  trailPoints.push({ x: mouse.x, y: mouse.y, t: Date.now() });
  if (trailPoints.length > 48) trailPoints.shift();
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
