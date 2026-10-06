export const CONFIG = Object.freeze({
  cameraMinDimensionFov: 35,
  maxPixelRatio: 1.5,
  detectIntervalMs: 1000 / 30,
  revealFrames: 3,
  lostAfterMs: 220,
  recoveryPromptAfterMs: 500,
  autoDetection: Object.freeze({
    candidateDurationMs: 1800,
    candidateMinFrames: 30,
    confirmationFrames: 4,
    trackingLossMs: 1500,
  }),
  smoothing: Object.freeze({
    positionMinCutoff: 0.8,
    positionBeta: 8,
    rotationMinCutoff: 0.8,
    rotationBeta: 1.8,
    derivativeCutoff: 1,
    maxGapSeconds: 0.3,
    renderTimeConstant: 0.035,
  }),

});

export const DEFAULT_TARGET_ID = 'cup';

function freezeTarget(value) {
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') freezeTarget(child);
  }
  return Object.freeze(value);
}

// Hotspot local X accounts for the upstream yaw+PI pose convention.
// Cup/can front surfaces use local -Z; keyboard depth follows the deck.
// Settings are paired with the corresponding upstream pretrained network.
// The engine receives mutable copies so switching targets cannot alter a profile.
export const TARGETS = freezeTarget({
  cup: {
    id: 'cup',
    name: 'Cup',
    label: 'CUP',
    // Cup proxy: radius 0.5, height 0.75, centered on the tracker. Four reference hotspots are not detected keypoints.
    annotationAnchors: [[0, 0.315, -0.5], [0.4, 0, -0.3], [-0.45, 0.075, -0.218], [0, -0.315, -0.5]],
    annotationBounds: [[-0.5, -0.375, -0.5], [0.5, 0.375, 0.5]],
    networkUrl: './assets/NN_COFFEE_2.json',
    followZRot: true,
    scanSettings: {
      nScaleLevels: 2,
      scale0Factor: 0.8,
      overlapFactors: [2, 2, 2],
      scanCenterFirst: true,
    },
    loadOptions: {
      notHereFactor: 0,
      paramsPerLabel: { CUP: { thresholdDetect: 0.92 } },
    },
    detectOptions: {
      isKeepTracking: true,
      isSkipConfirmation: false,
      thresholdDetectFactor: 1,
      cutShader: 'median',
      thresholdDetectFactorUnstitch: 0.2,
      trackingFactors: [0.5, 0.4, 1.5],
    },
  },
  keyboard: {
    id: 'keyboard',
    name: 'Keyboard',
    label: 'KEYBOARD',
    // Keyboard hotspots follow its deck; reference x/y maps to local x/z.
    annotationAnchors: [[0.35, 0.02, -0.088], [-0.25, 0.02, -0.066], [-0.4, 0.02, 0.11], [0.38, 0.02, 0.132]],
    annotationBounds: [[-0.5, -0.02, -0.22], [0.5, 0.06, 0.22]],
    networkUrl: './assets/NN_KEYBOARD_5.json',
    followZRot: false,
    scanSettings: {
      nScaleLevels: 2,
      scale0Factor: 0.8,
      overlapFactors: [2, 2, 3],
      scanCenterFirst: true,
      scaleXRange: [1 / 15, 1.2],
    },
    loadOptions: {
      notHereFactor: 0,
      paramsPerLabel: { KEYBOARD: { thresholdDetect: 0.9 } },
    },
    detectOptions: {
      isKeepTracking: true,
      isSkipConfirmation: false,
      thresholdDetectFactor: 1,
      thresholdDetectFactorUnstitch: 0.2,
      trackingFactors: [0.2, 0.2, 0.2],
    },
  },
  sprite: {
    id: 'sprite',
    name: 'Sprite can',
    label: 'SPRITECAN',
    // Can proxy: radius 0.31, height 1.085; positions mirror the supplied four reference hotspots.
    annotationAnchors: [[0, 0.4774, -0.31], [0.279, 0.05425, -0.135], [-0.279, -0.1085, -0.135], [0, -0.48825, -0.31]],
    annotationBounds: [[-0.31, -0.5425, -0.31], [0.31, 0.5425, 0.31]],
    networkUrl: './assets/NN_SPRITE_1.json',
    followZRot: true,
    scanSettings: {},
    loadOptions: {
      notHereFactor: 0,
      paramsPerLabel: { SPRITECAN: { thresholdDetect: 0.6 } },
    },
    detectOptions: {
      isKeepTracking: true,
      isSkipConfirmation: false,
      thresholdDetectFactor: 1,
      cutShader: 'median',
      nConfirmUnstitchMoves: 50,
      thresholdDetectFactorUnstitch: 0.15,
      trackingFactors: [0.3, 0.2, 1],
    },
  },
});
