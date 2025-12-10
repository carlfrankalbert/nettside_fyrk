/**
 * Neural Canvas Animation
 * A calm, professional neural network visualization with configurable presets
 */

interface RGB {
  r: number;
  g: number;
  b: number;
}

interface Preset {
  nodeCount: number;
  connectionMaxDist: number;
  centerBias: number;
  lineBaseAlpha: number;
  lineActiveAlpha: number;
  lineWidth: number;
  nodeBaseAlpha: number;
  nodeActiveAlpha: number;
  nodeBaseSize: number;
  nodeGlowSize: number;
  signalSpawnInterval: number;
  signalSpawnVariance: number;
  signalSpeed: number;
  signalSpeedVariance: number;
  signalCascadeChance: number;
  signalIntensity: number;
  signalTrailLength: number;
  signalTrailSteps: number;
  nodeJitterAmount: number;
  nodeJitterSpeed: number;
  nodeJitterChance: number;
  timeIncrement: number;
  lineColor: RGB;
  nodeColor: RGB;
  signalColor: RGB;
}

interface Node {
  x: number;
  y: number;
  centerFactor: number;
  connections: number[];
  activation: number;
  vx: number;
  vy: number;
  targetVx: number;
  targetVy: number;
  size: number;
}

interface Signal {
  fromIdx: number;
  toIdx: number;
  progress: number;
  speed: number;
  r: number;
  g: number;
  b: number;
  intensity: number;
  width: number;
}

const PRESETS: Record<string, Preset> = {
  calm: {
    nodeCount: 80,
    connectionMaxDist: 0.14,
    centerBias: 0.7,
    lineBaseAlpha: 0.025,
    lineActiveAlpha: 0.08,
    lineWidth: 0.5,
    nodeBaseAlpha: 0.18,
    nodeActiveAlpha: 0.5,
    nodeBaseSize: 1.3,
    nodeGlowSize: 2.0,
    signalSpawnInterval: 2800,
    signalSpawnVariance: 1500,
    signalSpeed: 0.003,
    signalSpeedVariance: 0.002,
    signalCascadeChance: 0.35,
    signalIntensity: 0.45,
    signalTrailLength: 0.28,
    signalTrailSteps: 14,
    nodeJitterAmount: 1.0,
    nodeJitterSpeed: 0.03,
    nodeJitterChance: 0.003,
    timeIncrement: 0.008,
    lineColor: { r: 50, g: 80, b: 120 },
    nodeColor: { r: 70, g: 110, b: 150 },
    signalColor: { r: 80, g: 130, b: 180 },
  },

  ultraCalm: {
    nodeCount: 55,
    connectionMaxDist: 0.12,
    centerBias: 0.75,
    lineBaseAlpha: 0.018,
    lineActiveAlpha: 0.05,
    lineWidth: 0.4,
    nodeBaseAlpha: 0.12,
    nodeActiveAlpha: 0.35,
    nodeBaseSize: 1.1,
    nodeGlowSize: 1.5,
    signalSpawnInterval: 4500,
    signalSpawnVariance: 2000,
    signalSpeed: 0.002,
    signalSpeedVariance: 0.001,
    signalCascadeChance: 0.2,
    signalIntensity: 0.35,
    signalTrailLength: 0.22,
    signalTrailSteps: 10,
    nodeJitterAmount: 0.5,
    nodeJitterSpeed: 0.02,
    nodeJitterChance: 0.002,
    timeIncrement: 0.005,
    lineColor: { r: 45, g: 70, b: 105 },
    nodeColor: { r: 60, g: 95, b: 130 },
    signalColor: { r: 70, g: 115, b: 160 },
  },

  reducedMotion: {
    nodeCount: 50,
    connectionMaxDist: 0.12,
    centerBias: 0.7,
    lineBaseAlpha: 0.02,
    lineActiveAlpha: 0.02,
    lineWidth: 0.4,
    nodeBaseAlpha: 0.15,
    nodeActiveAlpha: 0.15,
    nodeBaseSize: 1.2,
    nodeGlowSize: 0,
    signalSpawnInterval: 999999,
    signalSpawnVariance: 0,
    signalSpeed: 0,
    signalSpeedVariance: 0,
    signalCascadeChance: 0,
    signalIntensity: 0,
    signalTrailLength: 0,
    signalTrailSteps: 0,
    nodeJitterAmount: 0,
    nodeJitterSpeed: 0,
    nodeJitterChance: 0,
    timeIncrement: 0.002,
    lineColor: { r: 45, g: 70, b: 105 },
    nodeColor: { r: 60, g: 95, b: 130 },
    signalColor: { r: 70, g: 115, b: 160 },
  },
};

export function initNeuralCanvas(canvasId: string): void {
  const canvas = document.getElementById(canvasId) as HTMLCanvasElement | null;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let centerX = 0;
  let centerY = 0;
  let nodes: Node[] = [];
  let signals: Signal[] = [];
  let time = 0;
  let lastSignalSpawn = 0;
  let nextSignalDelay = 0;

  let prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let currentMode = prefersReducedMotion ? 'reducedMotion' : 'calm';
  let config = PRESETS[currentMode];

  function scheduleNextSignal(): void {
    nextSignalDelay = config.signalSpawnInterval + (Math.random() - 0.5) * 2 * config.signalSpawnVariance;
    lastSignalSpawn = performance.now();
  }

  function initNetwork(): void {
    nodes = [];
    signals = [];

    const padding = 50;
    const maxRadius = Math.min(width, height) * 0.48;

    for (let i = 0; i < config.nodeCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radiusFactor = Math.pow(Math.random(), config.centerBias);
      const radius = radiusFactor * maxRadius;

      const scatterX = (Math.random() - 0.5) * width * 0.15;
      const scatterY = (Math.random() - 0.5) * height * 0.15;

      let x = centerX + Math.cos(angle) * radius + scatterX;
      let y = centerY + Math.sin(angle) * radius + scatterY;

      x = Math.max(padding, Math.min(width - padding, x));
      y = Math.max(padding, Math.min(height - padding, y));

      const distFromCenter = Math.hypot(x - centerX, y - centerY);
      const maxDist = Math.hypot(width / 2, height / 2);
      const centerFactor = 1 - (distFromCenter / maxDist) * 0.6;

      nodes.push({
        x,
        y,
        centerFactor,
        connections: [],
        activation: 0,
        vx: 0,
        vy: 0,
        targetVx: 0,
        targetVy: 0,
        size: config.nodeBaseSize + Math.random() * 0.8,
      });
    }

    const maxConnDist = Math.min(width, height) * config.connectionMaxDist;

    for (let n = 0; n < nodes.length; n++) {
      const node = nodes[n];
      const nearby: Array<{ idx: number; dist: number }> = [];

      for (let m = 0; m < nodes.length; m++) {
        if (m === n) continue;
        const dist = Math.hypot(nodes[m].x - node.x, nodes[m].y - node.y);
        if (dist < maxConnDist) {
          nearby.push({ idx: m, dist });
        }
      }

      nearby.sort((a, b) => a.dist - b.dist);

      const maxConns = 2 + Math.floor(Math.random() * 3);
      for (let c = 0; c < Math.min(maxConns, nearby.length); c++) {
        const targetIdx = nearby[c].idx;
        if (!node.connections.includes(targetIdx)) {
          node.connections.push(targetIdx);
        }
      }
    }

    scheduleNextSignal();
  }

  function resize(): void {
    width = canvas!.width = window.innerWidth;
    height = canvas!.height = window.innerHeight;
    centerX = width / 2;
    centerY = height / 2;
    initNetwork();
  }

  function spawnSignal(): void {
    if (nodes.length === 0 || config.signalSpawnInterval > 99999) return;

    const candidates: number[] = [];
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i].connections.length > 0) {
        const weight = Math.ceil(nodes[i].centerFactor * 3);
        for (let w = 0; w < weight; w++) {
          candidates.push(i);
        }
      }
    }

    if (candidates.length === 0) return;

    const sourceIdx = candidates[Math.floor(Math.random() * candidates.length)];
    const sourceNode = nodes[sourceIdx];
    const targetIdx = sourceNode.connections[Math.floor(Math.random() * sourceNode.connections.length)];

    const col = config.signalColor;

    signals.push({
      fromIdx: sourceIdx,
      toIdx: targetIdx,
      progress: 0,
      speed: config.signalSpeed + Math.random() * config.signalSpeedVariance,
      r: col.r + Math.floor(Math.random() * 30),
      g: col.g + Math.floor(Math.random() * 30),
      b: col.b + Math.floor(Math.random() * 25),
      intensity: config.signalIntensity * (0.8 + Math.random() * 0.4),
      width: 1.2 + Math.random() * 0.8,
    });

    sourceNode.activation = Math.min(1, sourceNode.activation + 0.5);
    scheduleNextSignal();
  }

  function updateSignals(): void {
    const now = performance.now();
    if (now - lastSignalSpawn > nextSignalDelay) {
      spawnSignal();
    }

    const newSignals: Signal[] = [];

    for (const signal of signals) {
      signal.progress += signal.speed;

      if (signal.progress >= 1) {
        const targetNode = nodes[signal.toIdx];
        if (targetNode) {
          targetNode.activation = Math.min(1, targetNode.activation + signal.intensity * 0.6);

          if (targetNode.connections.length > 0 && Math.random() < config.signalCascadeChance) {
            const validTargets = targetNode.connections.filter((c) => c !== signal.fromIdx);

            if (validTargets.length > 0) {
              const nextTarget = validTargets[Math.floor(Math.random() * validTargets.length)];

              newSignals.push({
                fromIdx: signal.toIdx,
                toIdx: nextTarget,
                progress: 0,
                speed: config.signalSpeed + Math.random() * config.signalSpeedVariance,
                r: Math.min(200, signal.r + Math.floor((Math.random() - 0.3) * 15)),
                g: Math.min(210, signal.g + Math.floor((Math.random() - 0.3) * 15)),
                b: Math.min(220, signal.b + Math.floor((Math.random() - 0.2) * 10)),
                intensity: signal.intensity * (0.6 + Math.random() * 0.25),
                width: signal.width * 0.85,
              });
            }
          }
        }
      } else {
        newSignals.push(signal);
      }
    }

    signals = newSignals;
  }

  function updateNodes(): void {
    for (const node of nodes) {
      node.activation *= 0.992;

      if (Math.random() < config.nodeJitterChance) {
        node.targetVx = (Math.random() - 0.5) * config.nodeJitterAmount;
        node.targetVy = (Math.random() - 0.5) * config.nodeJitterAmount;
      }

      node.vx += (node.targetVx - node.vx) * config.nodeJitterSpeed;
      node.vy += (node.targetVy - node.vy) * config.nodeJitterSpeed;

      node.targetVx *= 0.99;
      node.targetVy *= 0.99;
    }
  }

  function bezierPoint(
    t: number,
    p0x: number,
    p0y: number,
    p1x: number,
    p1y: number,
    p2x: number,
    p2y: number
  ): { x: number; y: number } {
    const mt = 1 - t;
    return {
      x: mt * mt * p0x + 2 * mt * t * p1x + t * t * p2x,
      y: mt * mt * p0y + 2 * mt * t * p1y + t * t * p2y,
    };
  }

  function draw(): void {
    ctx!.clearRect(0, 0, width, height);
    time += config.timeIncrement;

    const lineCol = config.lineColor;
    const nodeCol = config.nodeColor;

    // Draw connections
    for (const node of nodes) {
      const nx = node.x + node.vx;
      const ny = node.y + node.vy;

      for (const connIdx of node.connections) {
        const target = nodes[connIdx];
        if (!target) continue;

        const tx = target.x + target.vx;
        const ty = target.y + target.vy;

        const combinedActivation = (node.activation + target.activation) * 0.5;
        const centerAvg = (node.centerFactor + target.centerFactor) * 0.5;
        const alpha = (config.lineBaseAlpha + combinedActivation * config.lineActiveAlpha) * centerAvg;

        const dx = tx - nx;
        const dy = ty - ny;
        const midX = nx + dx * 0.5 + Math.sin(time * 0.4 + node.x * 0.003) * dy * 0.02;
        const midY = ny + dy * 0.5 + Math.cos(time * 0.4 + node.y * 0.003) * dx * 0.02;

        ctx!.beginPath();
        ctx!.moveTo(nx, ny);
        ctx!.quadraticCurveTo(midX, midY, tx, ty);
        ctx!.strokeStyle = `rgba(${lineCol.r},${lineCol.g},${lineCol.b},${alpha.toFixed(4)})`;
        ctx!.lineWidth = config.lineWidth;
        ctx!.stroke();
      }
    }

    // Draw signals
    for (const signal of signals) {
      const from = nodes[signal.fromIdx];
      const to = nodes[signal.toIdx];
      if (!from || !to) continue;

      const fx = from.x + from.vx;
      const fy = from.y + from.vy;
      const tox = to.x + to.vx;
      const toy = to.y + to.vy;

      const dx = tox - fx;
      const dy = toy - fy;
      const midX = fx + dx * 0.5 + Math.sin(time * 0.4 + from.x * 0.003) * dy * 0.02;
      const midY = fy + dy * 0.5 + Math.cos(time * 0.4 + from.y * 0.003) * dx * 0.02;

      const steps = config.signalTrailSteps;
      const trailLen = config.signalTrailLength;

      for (let t = 0; t < steps; t++) {
        const trailT = Math.max(0, signal.progress - (t / steps) * trailLen);
        const pos = bezierPoint(trailT, fx, fy, midX, midY, tox, toy);
        const falloff = 1 - t / steps;
        const trailAlpha = falloff * falloff * signal.intensity * 0.55;
        const trailSize = signal.width * (0.25 + falloff * 0.55);

        ctx!.beginPath();
        ctx!.arc(pos.x, pos.y, trailSize, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${signal.r},${signal.g},${signal.b},${trailAlpha.toFixed(4)})`;
        ctx!.fill();
      }

      const headPos = bezierPoint(signal.progress, fx, fy, midX, midY, tox, toy);
      const headSize = signal.width * 1.8;

      const grad = ctx!.createRadialGradient(headPos.x, headPos.y, 0, headPos.x, headPos.y, headSize);
      grad.addColorStop(0, `rgba(${signal.r},${signal.g},${signal.b},${(signal.intensity * 0.7).toFixed(4)})`);
      grad.addColorStop(0.5, `rgba(${signal.r},${signal.g},${signal.b},${(signal.intensity * 0.2).toFixed(4)})`);
      grad.addColorStop(1, `rgba(${signal.r},${signal.g},${signal.b},0)`);

      ctx!.beginPath();
      ctx!.arc(headPos.x, headPos.y, headSize, 0, Math.PI * 2);
      ctx!.fillStyle = grad;
      ctx!.fill();
    }

    // Draw nodes
    for (const node of nodes) {
      const x = node.x + node.vx;
      const y = node.y + node.vy;

      const activation = node.activation;
      const cf = node.centerFactor;

      if (activation > 0.1 && config.nodeGlowSize > 0) {
        const glowSize = node.size * (config.nodeGlowSize + activation * 2.5);
        const glowAlpha = activation * 0.25 * cf;

        const glowGrad = ctx!.createRadialGradient(x, y, 0, x, y, glowSize);
        glowGrad.addColorStop(0, `rgba(${nodeCol.r},${nodeCol.g},${nodeCol.b},${glowAlpha.toFixed(4)})`);
        glowGrad.addColorStop(0.5, `rgba(${nodeCol.r},${nodeCol.g},${nodeCol.b},${(glowAlpha * 0.3).toFixed(4)})`);
        glowGrad.addColorStop(1, `rgba(${nodeCol.r},${nodeCol.g},${nodeCol.b},0)`);

        ctx!.beginPath();
        ctx!.arc(x, y, glowSize, 0, Math.PI * 2);
        ctx!.fillStyle = glowGrad;
        ctx!.fill();
      }

      const coreAlpha = (config.nodeBaseAlpha + activation * config.nodeActiveAlpha) * cf;
      const coreSize = node.size * (1 + activation * 0.2);

      ctx!.beginPath();
      ctx!.arc(x, y, coreSize, 0, Math.PI * 2);
      ctx!.fillStyle = `rgba(${nodeCol.r + 25},${nodeCol.g + 25},${nodeCol.b + 15},${coreAlpha.toFixed(4)})`;
      ctx!.fill();
    }

    updateSignals();
    updateNodes();

    requestAnimationFrame(draw);
  }

  // Listen for reduced motion preference changes
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', (e) => {
    prefersReducedMotion = e.matches;
    currentMode = prefersReducedMotion ? 'reducedMotion' : 'calm';
    config = PRESETS[currentMode];
    resize();
  });

  window.addEventListener('resize', resize);
  resize();
  draw();
}
