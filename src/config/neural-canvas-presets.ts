/**
 * Neural Canvas Animation Presets
 * Configuration for different animation modes and visual settings
 */

// ============================================================================
// Types
// ============================================================================

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface NeuralCanvasPreset {
  /** Number of nodes in the network */
  nodeCount: number;
  /** Maximum connection distance as fraction of canvas size */
  connectionMaxDist: number;
  /** Bias towards center placement (0-1, higher = more centered) */
  centerBias: number;

  // Line appearance
  /** Base alpha for connection lines */
  lineBaseAlpha: number;
  /** Alpha when line is activated */
  lineActiveAlpha: number;
  /** Width of connection lines */
  lineWidth: number;

  // Node appearance
  /** Base alpha for nodes */
  nodeBaseAlpha: number;
  /** Alpha when node is activated */
  nodeActiveAlpha: number;
  /** Base size of nodes */
  nodeBaseSize: number;
  /** Size of node glow effect */
  nodeGlowSize: number;

  // Signal behavior
  /** Base interval between signal spawns (ms) */
  signalSpawnInterval: number;
  /** Variance in spawn interval (ms) */
  signalSpawnVariance: number;
  /** Base speed of signals */
  signalSpeed: number;
  /** Variance in signal speed */
  signalSpeedVariance: number;
  /** Chance of signal cascading to next node (0-1) */
  signalCascadeChance: number;
  /** Intensity of signal effect */
  signalIntensity: number;
  /** Length of signal trail as fraction of path */
  signalTrailLength: number;
  /** Number of steps in trail rendering */
  signalTrailSteps: number;

  // Node animation
  /** Amount of random node movement */
  nodeJitterAmount: number;
  /** Speed of jitter interpolation */
  nodeJitterSpeed: number;
  /** Chance of starting a jitter per frame */
  nodeJitterChance: number;

  // Timing
  /** Time increment per frame */
  timeIncrement: number;

  // Colors
  /** Color for connection lines */
  lineColor: RGB;
  /** Color for nodes */
  nodeColor: RGB;
  /** Color for signals */
  signalColor: RGB;
}

// ============================================================================
// Color Palettes
// ============================================================================

const COLORS = {
  /** Primary blue palette for calm mode */
  calmBlue: {
    line: { r: 50, g: 80, b: 120 },
    node: { r: 70, g: 110, b: 150 },
    signal: { r: 80, g: 130, b: 180 },
  },
  /** Muted blue palette for ultra calm mode */
  mutedBlue: {
    line: { r: 45, g: 70, b: 105 },
    node: { r: 60, g: 95, b: 130 },
    signal: { r: 70, g: 115, b: 160 },
  },
} as const;

// ============================================================================
// Presets
// ============================================================================

/**
 * Standard calm animation preset
 * Moderate activity with gentle visual effects
 */
export const CALM_PRESET: NeuralCanvasPreset = {
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
  lineColor: COLORS.calmBlue.line,
  nodeColor: COLORS.calmBlue.node,
  signalColor: COLORS.calmBlue.signal,
};

/**
 * Ultra calm animation preset
 * Reduced activity for a more subtle effect
 */
export const ULTRA_CALM_PRESET: NeuralCanvasPreset = {
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
  lineColor: COLORS.mutedBlue.line,
  nodeColor: COLORS.mutedBlue.node,
  signalColor: COLORS.mutedBlue.signal,
};

/**
 * Reduced motion preset
 * Static display with no animations for accessibility
 */
export const REDUCED_MOTION_PRESET: NeuralCanvasPreset = {
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
  lineColor: COLORS.mutedBlue.line,
  nodeColor: COLORS.mutedBlue.node,
  signalColor: COLORS.mutedBlue.signal,
};

/**
 * All available presets by name
 */
export const PRESETS: Record<string, NeuralCanvasPreset> = {
  calm: CALM_PRESET,
  ultraCalm: ULTRA_CALM_PRESET,
  reducedMotion: REDUCED_MOTION_PRESET,
};

/**
 * Get the appropriate preset based on user preferences
 */
export function getPresetForUserPreferences(prefersReducedMotion: boolean): NeuralCanvasPreset {
  return prefersReducedMotion ? REDUCED_MOTION_PRESET : CALM_PRESET;
}

/**
 * Get preset by name, with fallback to calm preset
 */
export function getPresetByName(name: string): NeuralCanvasPreset {
  return PRESETS[name] || CALM_PRESET;
}
