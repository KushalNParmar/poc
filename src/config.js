export const CONFIG = Object.freeze({
  cameraMinDimensionFov: 35,
  maxPixelRatio: 1.5,
  detectIntervalMs: 1000 / 30,
  revealFrames: 3,
  lostAfterMs: 220,
  smoothing: Object.freeze({
    positionMinCutoff: 0.8,
    positionBeta: 8,
    rotationMinCutoff: 0.8,
    rotationBeta: 1.8,
    derivativeCutoff: 1,
    maxGapSeconds: 0.3,
    renderTimeConstant: 0.035,
  }),
  annotations: [
    // Stable card slots separate the text without moving the tracked anchor dots.
    { slot: 'upper-left', width: 0.38 },
    { slot: 'right', width: 0.38 },
    { slot: 'lower-left', width: 0.38 },
  ],
});

export const DEFAULT_TARGET_ID = 'cup';

function freezeTarget(value) {
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') freezeTarget(child);
  }
  return Object.freeze(value);
}

// Settings are paired with the corresponding upstream pretrained network.
// The engine receives mutable copies so switching targets cannot alter a profile.
export const TARGETS = freezeTarget({
  cup: {
    id: 'cup',
    name: 'Cup',
    label: 'CUP',
    annotations: [
      { title: 'Your daily brew', detail: 'Coffee or tea, your way' },
      { title: 'Pause and sip', detail: 'Make time for a break' },
      { title: 'Refill and repeat', detail: 'Enjoy your next cup' },
    ],
    // Tracker-relative coordinates, matching the upstream centered cup proxy
    // (radius 0.5, height 0.75). These are reference spots, not detected keypoints.
    annotationAnchors: [[0, 0.375, 0.5], [0.4, 0, 0.3], [-0.36, -0.22, 0.347]],
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
    // Demo copy supplied by the client; detection does not verify specifications.
    annotations: [
      { title: 'Made with', detail: 'recycled plastic' },
      { title: 'Smart battery', detail: 'efficiency' },
      { title: 'Responsible', detail: 'packaging' },
    ],
    // The keyboard surface is at y=0; keep all three dots near its deck.
    annotationAnchors: [[0, 0.02, -0.1], [0.32, 0.02, 0.08], [-0.32, 0.02, 0.08]],
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
    annotations: [
      { title: 'Lemon-lime flavour', detail: 'Crisp, refreshing taste' },
      { title: 'Serve chilled', detail: 'Enjoy a refreshing break' },
      { title: 'Recycle the can', detail: 'Empty it. Recycle locally.' },
    ],
    // Upstream can proxy: radius 0.31, height 1.085, centered at the origin.
    annotationAnchors: [[0, 0.5425, 0], [0.248, 0.08, 0.186], [-0.248, -0.3, 0.186]],
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
