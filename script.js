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
const roleTypewriter = document.querySelector("#role-typewriter");
const topologyCard = document.querySelector("#topology-card");
const pipelineCanvas = document.querySelector("#pipeline-canvas");
const pipelineCtx = pipelineCanvas?.getContext("2d");

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
let backgroundPoints = [];
let backgroundTokens = [];
let pipelinePackets = [];
let pipelinePulses = [];
let pipelineHover = -1;
let pipelinePointer = { x: 0, y: 0, active: false };
let pipelineImpacts = [0, 0, 0];
const bypassPhrases = [
  "[ ESC TO BYPASS ↗ ]",
  "[ SKIP LOG STREAM ↗ ]",
  "[ HALT COMPILATION ↗ ]",
  "[ INJECT RUNTIME ↗ ]"
];
const roleTitles = [
  "AI Engineer",
  "Python Backend Engineer",
  "Generative AI Applications Developer",
  "Full-Stack AI Developer"
];
const stackTokens = [
  { type: "code", label: "def train_llm():" },
  { type: "code", label: "openai.Embedding.create()" },
  { type: "code", label: "const [data, setData] = useState" },
  { type: "python", label: "Python" },
  { type: "react", label: "React" },
  { type: "neural", label: "AI" },
  { type: "code", label: "vector.search(query)" },
  { type: "code", label: "FastAPI → LLM → UI" },
  { type: "code", label: "rag_chain.invoke(context)" },
  { type: "code", label: "POST /api/generate" },
  { type: "code", label: "embedding_dims = 1536" },
  { type: "code", label: "async def agent_router():" },
  { type: "neural", label: "Vector DB" },
  { type: "python", label: "FastAPI" },
  { type: "react", label: "UI" }
];
const pipelineNodes = [
  { label: "Python Backend Gateway", short: "PY", skills: ["FastAPI", "Flask", "Celery", "PostgreSQL"], color: "#4df3ff", x: .18, y: .58 },
  { label: "Cognitive LLM Engine / Vector DB", short: "LLM", skills: ["LangChain", "RAG", "ChromaDB", "Embeddings"], color: "#ccff42", x: .50, y: .36 },
  { label: "React Client Matrix", short: "UI", skills: ["React", "Next.js", "Tailwind", "Redux"], color: "#9d6cff", x: .82, y: .58 }
];

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
  let phraseIndex = 0;
  if (skipLoader) {
    skipLoader.textContent = bypassPhrases[0];
  }
  const phraseTimer = setInterval(() => {
    if (!skipLoader || closed) return;
    phraseIndex = (phraseIndex + 1) % bypassPhrases.length;
    skipLoader.textContent = bypassPhrases[phraseIndex];
  }, 500);
  const closeLoader = (blast = true) => {
    if (closed) return;
    closed = true;
    clearInterval(phraseTimer);
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
  const bootTimer = setTimeout(() => closeLoader(true), 6000);
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

function startRoleTyping() {
  if (!roleTypewriter) return;
  let titleIndex = 0;
  let charIndex = 0;
  let deleting = false;

  const tick = () => {
    const current = roleTitles[titleIndex];
    roleTypewriter.textContent = current.slice(0, charIndex);

    if (!deleting && charIndex < current.length) {
      charIndex += 1;
      setTimeout(tick, 38);
      return;
    }

    if (!deleting) {
      deleting = true;
      setTimeout(tick, 720);
      return;
    }

    if (charIndex > 0) {
      charIndex -= 1;
      setTimeout(tick, 20);
      return;
    }

    deleting = false;
    titleIndex = (titleIndex + 1) % roleTitles.length;
    setTimeout(tick, 140);
  };

  tick();
}

function setupTopologyTilt() {
  if (!topologyCard) return;
  topologyCard.addEventListener("pointermove", (event) => {
    const rect = topologyCard.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) - .5;
    const y = ((event.clientY - rect.top) / rect.height) - .5;
    topologyCard.style.setProperty("--tilt-y", `${x * 10}deg`);
    topologyCard.style.setProperty("--tilt-x", `${-y * 8}deg`);
    topologyCard.style.setProperty("--glow-x", `${(x + .5) * 100}%`);
    topologyCard.style.setProperty("--glow-y", `${(y + .5) * 100}%`);
  });
  topologyCard.addEventListener("pointerleave", () => {
    topologyCard.style.setProperty("--tilt-y", "0deg");
    topologyCard.style.setProperty("--tilt-x", "0deg");
    topologyCard.style.setProperty("--glow-x", "50%");
    topologyCard.style.setProperty("--glow-y", "50%");
  });
}

function getPipelineGeometry() {
  if (!pipelineCanvas) return null;
  const rect = pipelineCanvas.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;
  const mx = pipelinePointer.active ? (pipelinePointer.x / w - .5) : 0;
  const my = pipelinePointer.active ? (pipelinePointer.y / h - .5) : 0;
  const tiltX = mx * 30;
  const tiltY = my * 20;
  const nodes = pipelineNodes.map((node, index) => ({
    ...node,
    px: node.x * w + tiltX * (index - 1),
    py: node.y * h + tiltY * (index === 1 ? -1.35 : .75) + Math.sin(time * .9 + index) * 8,
    r: index === 1 ? Math.min(w, h) * .108 : Math.min(w, h) * .088
  }));
  return { w, h, nodes, mx, my };
}

function bezierPoint(a, b, c, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * a.x + 2 * mt * t * b.x + t * t * c.x,
    y: mt * mt * a.y + 2 * mt * t * b.y + t * t * c.y
  };
}

function roundRect(context, x, y, w, h, r) {
  const radius = Math.min(r, w / 2, h / 2);
  context.beginPath();
  context.moveTo(x + radius, y);
  context.arcTo(x + w, y, x + w, y + h, radius);
  context.arcTo(x + w, y + h, x, y + h, radius);
  context.arcTo(x, y + h, x, y, radius);
  context.arcTo(x, y, x + w, y, radius);
  context.closePath();
}

function wrapCanvasText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  const lines = [];
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (context.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  lines.push(line);
  const startY = y - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((item, index) => context.fillText(item, x, startY + index * lineHeight));
}

function drawPythonIcon(context, x, y, r, impact = 0) {
  const breath = 1 + Math.sin(time * 1.5) * .04 + impact * .08;
  context.save();
  context.translate(x, y);
  context.scale(breath, breath);
  context.shadowColor = "#4df3ff";
  context.shadowBlur = 18 + impact * 36;
  context.fillStyle = "#3572a5";
  roundRect(context, -r * .78, -r * .58, r * 1.2, r * .78, r * .22);
  context.fill();
  context.fillStyle = "#ffe873";
  roundRect(context, -r * .42, -r * .08, r * 1.2, r * .78, r * .22);
  context.fill();
  context.fillStyle = "#f8fbff";
  context.beginPath();
  context.arc(-r * .36, -r * .34, r * .055, 0, Math.PI * 2);
  context.arc(r * .34, r * .34, r * .055, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = `rgba(255,255,255,${.35 + impact * .4})`;
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(-r * .05, -r * .56);
  context.bezierCurveTo(r * .42, -r * .58, r * .52, -r * .16, r * .22, -r * .05);
  context.moveTo(r * .05, r * .56);
  context.bezierCurveTo(-r * .42, r * .58, -r * .52, r * .16, -r * .22, r * .05);
  context.stroke();
  context.restore();
}

function drawNeuralCoreIcon(context, x, y, r, impact = 0) {
  context.save();
  context.translate(x, y);
  const glow = context.createRadialGradient(0, 0, 0, 0, 0, r * 1.9);
  glow.addColorStop(0, `rgba(204,255,66,${.38 + impact * .45})`);
  glow.addColorStop(.45, "rgba(77,243,255,.18)");
  glow.addColorStop(1, "rgba(204,255,66,0)");
  context.fillStyle = glow;
  context.beginPath();
  context.arc(0, 0, r * 1.9, 0, Math.PI * 2);
  context.fill();

  const dots = 8;
  context.strokeStyle = `rgba(204,255,66,${.34 + impact * .35})`;
  context.lineWidth = 1.1;
  for (let i = 0; i < dots; i++) {
    const angle = time * .75 + i * (Math.PI * 2 / dots);
    const px = Math.cos(angle) * r * .62;
    const py = Math.sin(angle * 1.3) * r * .42;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(px, py);
    context.stroke();
  }

  context.fillStyle = "#ccff42";
  context.shadowColor = "#ccff42";
  context.shadowBlur = 24 + impact * 38;
  context.beginPath();
  context.arc(0, 0, r * .28 + impact * 4, 0, Math.PI * 2);
  context.fill();

  for (let i = 0; i < dots; i++) {
    const angle = -time * 1.35 + i * (Math.PI * 2 / dots);
    const px = Math.cos(angle) * r * .72;
    const py = Math.sin(angle * 1.15) * r * .48;
    context.fillStyle = i % 2 ? "#4df3ff" : "#ccff42";
    context.beginPath();
    context.arc(px, py, r * (.065 + (Math.sin(time * 4 + i) + 1) * .015), 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

function drawReactIcon(context, x, y, r, impact = 0) {
  context.save();
  context.translate(x, y);
  context.strokeStyle = "#61dafb";
  context.lineWidth = 2.4;
  context.shadowColor = "#61dafb";
  context.shadowBlur = 20 + impact * 42;
  const spin = time * (1.2 + impact * 4);
  for (let i = 0; i < 3; i++) {
    context.save();
    context.rotate(spin + i * Math.PI / 3);
    context.beginPath();
    context.ellipse(0, 0, r * .9, r * .34, 0, 0, Math.PI * 2);
    context.stroke();
    context.restore();
  }
  context.fillStyle = "#61dafb";
  context.beginPath();
  context.arc(0, 0, r * .14 + impact * 2, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function drawPipeline() {
  if (!pipelineCanvas || !pipelineCtx) return;
  const geometry = getPipelineGeometry();
  if (!geometry) return;
  const { w, h, nodes, mx, my } = geometry;
  const light = document.body.classList.contains("light-theme");

  pipelineCtx.clearRect(0, 0, w, h);
  pipelineCtx.save();
  pipelineCtx.translate(w / 2, h / 2);
  pipelineCtx.transform(1, my * .038, mx * -.038, 1, 0, 0);
  pipelineCtx.translate(-w / 2, -h / 2);

  const panel = pipelineCtx.createRadialGradient(w * .5, h * .43, 8, w * .5, h * .46, Math.max(w, h) * .72);
  if (light) {
    panel.addColorStop(0, "rgba(255,255,255,.42)");
    panel.addColorStop(.65, "rgba(226,232,240,.18)");
    panel.addColorStop(1, "rgba(248,250,252,.02)");
  } else {
    panel.addColorStop(0, "rgba(0,191,255,.09)");
    panel.addColorStop(.62, "rgba(52,211,153,.045)");
    panel.addColorStop(1, "rgba(3,3,3,.01)");
  }
  pipelineCtx.fillStyle = panel;
  roundRect(pipelineCtx, 14, 18, w - 28, h - 36, 34);
  pipelineCtx.fill();

  pipelineCtx.globalAlpha = light ? .16 : .22;
  pipelineCtx.strokeStyle = light ? "rgba(71,85,105,.12)" : "rgba(0,191,255,.15)";
  pipelineCtx.lineWidth = .5;
  for (let x = 34; x < w; x += 34) {
    pipelineCtx.beginPath();
    pipelineCtx.moveTo(x, 34);
    pipelineCtx.lineTo(x + mx * 24, h - 36);
    pipelineCtx.stroke();
  }
  for (let y = 42; y < h; y += 42) {
    pipelineCtx.beginPath();
    pipelineCtx.moveTo(30, y);
    pipelineCtx.lineTo(w - 30, y + my * 18);
    pipelineCtx.stroke();
  }
  pipelineCtx.globalAlpha = 1;

  const paths = [
    { a: nodes[0], c: nodes[1], b: { x: w * .33, y: h * .18 } },
    { a: nodes[1], c: nodes[2], b: { x: w * .67, y: h * .18 } },
    { a: nodes[0], c: nodes[2], b: { x: w * .5, y: h * .82 } }
  ];

  paths.forEach((path, index) => {
    const gradient = pipelineCtx.createLinearGradient(path.a.px, path.a.py, path.c.px, path.c.py);
    gradient.addColorStop(0, `${path.a.color}aa`);
    gradient.addColorStop(.5, index === 2 ? "#ffffff55" : "#ccff4288");
    gradient.addColorStop(1, `${path.c.color}aa`);
    pipelineCtx.strokeStyle = gradient;
    pipelineCtx.lineWidth = index === 2 ? 1.25 : 2.2;
    pipelineCtx.setLineDash(index === 2 ? [7, 12] : [10, 14]);
    pipelineCtx.lineDashOffset = -time * 18 - index * 8;
    pipelineCtx.beginPath();
    pipelineCtx.moveTo(path.a.px, path.a.py);
    pipelineCtx.quadraticCurveTo(path.b.x, path.b.y, path.c.px, path.c.py);
    pipelineCtx.stroke();
  });
  pipelineCtx.setLineDash([]);

  for (const packet of pipelinePackets) {
    packet.previousProgress = packet.progress;
    packet.progress += packet.speed * (pipelineHover >= 0 ? 2.2 : 1.45);
    if (packet.progress > 1) {
      packet.progress = 0;
      pipelineImpacts[paths[packet.path].a === nodes[1] ? 1 : 0] = 1;
    }
    const path = paths[packet.path];
    if (packet.previousProgress < .48 && packet.progress >= .48) {
      pipelineImpacts[1] = 1;
    }
    if (packet.previousProgress < .96 && packet.progress >= .96) {
      pipelineImpacts[packet.path === 0 ? 1 : 2] = 1;
    }
    const point = bezierPoint({ x: path.a.px, y: path.a.py }, path.b, { x: path.c.px, y: path.c.py }, packet.progress);
    const tailPoint = bezierPoint({ x: path.a.px, y: path.a.py }, path.b, { x: path.c.px, y: path.c.py }, Math.max(0, packet.progress - .045));
    const color = packet.hue === 0 ? "#4df3ff" : packet.hue === 1 ? "#ccff42" : "#9d6cff";
    const comet = pipelineCtx.createLinearGradient(tailPoint.x, tailPoint.y, point.x, point.y);
    comet.addColorStop(0, `${color}00`);
    comet.addColorStop(.55, `${color}88`);
    comet.addColorStop(1, "#ffffff");
    pipelineCtx.strokeStyle = comet;
    pipelineCtx.lineWidth = packet.size * 1.65;
    pipelineCtx.lineCap = "round";
    pipelineCtx.shadowColor = color;
    pipelineCtx.shadowBlur = 18;
    pipelineCtx.beginPath();
    pipelineCtx.moveTo(tailPoint.x, tailPoint.y);
    pipelineCtx.lineTo(point.x, point.y);
    pipelineCtx.stroke();
    pipelineCtx.fillStyle = color;
    pipelineCtx.beginPath();
    pipelineCtx.arc(point.x, point.y, packet.size * .9, 0, Math.PI * 2);
    pipelineCtx.fill();
  }
  pipelineCtx.shadowBlur = 0;

  pipelinePulses = pipelinePulses.filter((pulse) => Date.now() - pulse.t < 900);
  for (const pulse of pipelinePulses) {
    const age = (Date.now() - pulse.t) / 900;
    const node = nodes[pulse.node];
    pipelineCtx.strokeStyle = `${node.color}${Math.floor((1 - age) * 180).toString(16).padStart(2, "0")}`;
    pipelineCtx.lineWidth = 2 + age * 7;
    pipelineCtx.beginPath();
    pipelineCtx.arc(node.px, node.py, node.r + age * 150, 0, Math.PI * 2);
    pipelineCtx.stroke();
  }

  nodes.forEach((node, index) => {
    const hovered = index === pipelineHover;
    pipelineImpacts[index] *= .9;
    const impact = Math.max(pipelineImpacts[index], hovered ? .32 : 0);
    const glow = pipelineCtx.createRadialGradient(node.px, node.py, 0, node.px, node.py, node.r * 2.6);
    glow.addColorStop(0, `${node.color}${impact > .4 ? "dd" : hovered ? "bb" : "66"}`);
    glow.addColorStop(.42, `${node.color}22`);
    glow.addColorStop(1, `${node.color}00`);
    pipelineCtx.fillStyle = glow;
    pipelineCtx.beginPath();
    pipelineCtx.arc(node.px, node.py, node.r * 2.6, 0, Math.PI * 2);
    pipelineCtx.fill();

    if (index === 0) drawPythonIcon(pipelineCtx, node.px, node.py, node.r, impact);
    if (index === 1) drawNeuralCoreIcon(pipelineCtx, node.px, node.py, node.r, impact);
    if (index === 2) drawReactIcon(pipelineCtx, node.px, node.py, node.r, impact);

    if (hovered) {
      const tooltipY = Math.min(h - 52, node.py + node.r * 1.22);
      const text = node.skills.join(" · ");
      pipelineCtx.font = "850 11px JetBrains Mono, monospace";
      const tw = Math.min(pipelineCtx.measureText(text).width + 26, w - 42);
      pipelineCtx.fillStyle = light ? "rgba(255,255,255,.92)" : "rgba(3,3,3,.84)";
      pipelineCtx.strokeStyle = `${node.color}88`;
      roundRect(pipelineCtx, Math.max(20, Math.min(w - tw - 20, node.px - tw / 2)), tooltipY, tw, 32, 16);
      pipelineCtx.fill();
      pipelineCtx.stroke();
      pipelineCtx.fillStyle = node.color;
      pipelineCtx.fillText(text, Math.max(20 + tw / 2, Math.min(w - 20 - tw / 2, node.px)), tooltipY + 17);
    }
  });
  pipelineCtx.restore();
}

function updatePipelinePointer(event, clicked = false) {
  if (!pipelineCanvas) return;
  const rect = pipelineCanvas.getBoundingClientRect();
  pipelinePointer.x = event.clientX - rect.left;
  pipelinePointer.y = event.clientY - rect.top;
  pipelinePointer.active = true;
  const geometry = getPipelineGeometry();
  if (!geometry) return;
  pipelineHover = -1;
  geometry.nodes.forEach((node, index) => {
    const distance = Math.hypot(pipelinePointer.x - node.px, pipelinePointer.y - node.py);
    if (distance < node.r * 1.45) pipelineHover = index;
  });
  if (clicked && pipelineHover >= 0) {
    pipelinePulses.push({ node: pipelineHover, t: Date.now() });
  }
}

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
  if (pipelineCanvas && pipelineCtx) {
    const rect = pipelineCanvas.getBoundingClientRect();
    pipelineCanvas.width = Math.max(1, rect.width * devicePixelRatio);
    pipelineCanvas.height = Math.max(1, rect.height * devicePixelRatio);
    pipelineCtx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    initPipelinePackets();
  }
  initInteractiveBackground();
}

function initPipelinePackets() {
  pipelinePackets = Array.from({ length: 42 }, (_, index) => {
    const progress = Math.random();
    return {
      path: index % 3,
      progress,
      previousProgress: progress,
      speed: .0024 + Math.random() * .0028,
      size: 2.4 + Math.random() * 2.8,
      hue: index % 3
    };
  });
}

function initInteractiveBackground() {
  const pointCount = Math.min(150, Math.max(120, Math.floor((innerWidth * innerHeight) / 14500)));
  backgroundPoints = Array.from({ length: pointCount }, () => ({
    x: Math.random() * innerWidth,
    y: Math.random() * innerHeight,
    vx: (Math.random() - .5) * .18,
    vy: (Math.random() - .5) * .18,
    radius: Math.random() * 1.45 + .65,
    phase: Math.random() * Math.PI * 2
  }));
  backgroundTokens = stackTokens.map((artifact, index) => {
    const columns = 5;
    const rows = Math.ceil(stackTokens.length / columns);
    const column = index % columns;
    const row = Math.floor(index / columns);
    return {
      ...artifact,
      x: ((column + .55) / columns) * innerWidth + (Math.random() - .5) * 110,
      y: ((row + .8) / (rows + .7)) * innerHeight + (Math.random() - .5) * 80,
      vx: (Math.random() - .5) * .08,
      vy: (Math.random() - .5) * .08,
      rotate: Math.random() * Math.PI * 2,
      size: artifact.type === "code" ? 1 : .72 + Math.random() * .22
    };
  });
}

function drawInteractiveBackground() {
  if (!canvas || !ctx) return;
  const light = document.body.classList.contains("light-theme");
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  if (light) {
    const lightBg = ctx.createLinearGradient(0, 0, innerWidth, innerHeight);
    lightBg.addColorStop(0, "#ffffff");
    lightBg.addColorStop(.58, "#f8fafc");
    lightBg.addColorStop(1, "#f1f5f9");
    ctx.fillStyle = lightBg;
  } else {
    ctx.fillStyle = "#030303";
  }
  ctx.fillRect(0, 0, innerWidth, innerHeight);

  const baseLine = light ? [13, 148, 136] : [0, 240, 255];
  const accentLine = light ? [20, 184, 166] : [0, 255, 170];
  const violetLine = light ? [14, 116, 144] : [157, 108, 255];
  const tokenColor = light ? "rgba(13, 148, 136, .16)" : "rgba(224, 255, 250, .2)";

  for (const point of backgroundPoints) {
    const dx = point.x - mouse.x;
    const dy = point.y - mouse.y;
    const distance = Math.hypot(dx, dy) || 1;
    const influence = Math.max(0, 1 - distance / 180);

    point.vx += Math.sin(time * .45 + point.phase) * .0035 - (dx / distance) * influence * .026;
    point.vy += Math.cos(time * .38 + point.phase) * .0035 - (dy / distance) * influence * .026;
    point.x += point.vx;
    point.y += point.vy;
    point.vx *= .968;
    point.vy *= .968;

    if (point.x < -24) point.x = innerWidth + 24;
    if (point.x > innerWidth + 24) point.x = -24;
    if (point.y < -24) point.y = innerHeight + 24;
    if (point.y > innerHeight + 24) point.y = -24;
  }

  for (let i = 0; i < backgroundPoints.length; i++) {
    const a = backgroundPoints[i];
    for (let j = i + 1; j < backgroundPoints.length; j++) {
      const b = backgroundPoints[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance > 165) continue;
      const midX = (a.x + b.x) / 2;
      const midY = (a.y + b.y) / 2;
      const mouseDistance = Math.hypot(midX - mouse.x, midY - mouse.y);
      const pulse = Math.max(0, 1 - mouseDistance / 200);
      const opacity = (1 - distance / 165) * (light ? .4 : .25) + pulse * (light ? .18 : .24);
      const color = i % 7 === 0 ? violetLine : i % 4 === 0 ? accentLine : baseLine;
      ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;
      ctx.shadowColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${pulse * (light ? .16 : .52)})`;
      ctx.shadowBlur = pulse * 12;
      ctx.lineWidth = .75 + pulse * .34;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  for (let i = 0; i < backgroundPoints.length; i++) {
    const point = backgroundPoints[i];
    const distance = Math.hypot(point.x - mouse.x, point.y - mouse.y);
    const pulse = Math.max(0, 1 - distance / 200);
    const color = i % 9 === 0 ? violetLine : i % 5 === 0 ? accentLine : baseLine;
    const opacity = (light ? .34 : .42) + pulse * (light ? .28 : .48);
    ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity})`;
    ctx.shadowColor = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${pulse * .55})`;
    ctx.shadowBlur = pulse * 12;
    ctx.beginPath();
    if (i % 7 === 0) {
      ctx.rect(point.x - point.radius, point.y - point.radius, point.radius * 2, point.radius * 2);
    } else {
      ctx.arc(point.x, point.y, point.radius, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.shadowBlur = 0;

  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = light ? .16 : .2;
  for (const artifact of backgroundTokens) {
    artifact.x += artifact.vx + Math.sin(time * .28 + artifact.rotate) * .05;
    artifact.y += artifact.vy + Math.cos(time * .24 + artifact.rotate) * .05;
    artifact.rotate += .0018;
    if (artifact.x < -180) artifact.x = innerWidth + 180;
    if (artifact.x > innerWidth + 180) artifact.x = -180;
    if (artifact.y < -80) artifact.y = innerHeight + 80;
    if (artifact.y > innerHeight + 80) artifact.y = -80;

    ctx.save();
    ctx.translate(artifact.x, artifact.y);
    ctx.rotate(Math.sin(artifact.rotate) * .14);
    ctx.fillStyle = tokenColor;
    ctx.strokeStyle = light ? "rgba(13, 148, 136, .55)" : "rgba(0, 240, 255, .8)";
    ctx.lineWidth = 1.4;
    if (artifact.type === "code") {
      ctx.font = "800 14px JetBrains Mono, monospace";
      ctx.fillText(artifact.label, 0, 0);
    } else if (artifact.type === "python") {
      drawPythonIcon(ctx, 0, 0, 20 * artifact.size, 0);
    } else if (artifact.type === "react") {
      drawReactIcon(ctx, 0, 0, 22 * artifact.size, 0);
    } else {
      drawNeuralCoreIcon(ctx, 0, 0, 20 * artifact.size, 0);
    }
    ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
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

  const burstAge = synapseBursting ? Math.min(1, (now - synapseBurstStartedAt) / 820) : 0;
  const speed = synapseBursting ? 24 + burstAge * 58 : 1;
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
  drawInteractiveBackground();
  drawPipeline();
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

pipelineCanvas?.addEventListener("pointermove", (event) => updatePipelinePointer(event));
pipelineCanvas?.addEventListener("pointerleave", () => {
  pipelinePointer.active = false;
  pipelineHover = -1;
});
pipelineCanvas?.addEventListener("click", (event) => updatePipelinePointer(event, true));

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
startRoleTyping();
setupTopologyTilt();
draw();
updateExperienceStack();
