export const CONFIG = Object.freeze({
  // Bounds and placement preserve the original three-pointer layout.
  // The tracker uses a unit-width detection window, not physical metres.
  annotationBounds: { min: [-0.45, 0, -0.22480954187733437], max: [0.4499988879606582, 0.4985365382564583, 0.22481088915576777] },
  annotationOffset: [0, 0.7, 0],
  annotationRotation: [0, 0, 0],
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
    // Label offsets and widths are in the same object-local 3D units as the annotation bounds.
    // Each spot follows the object; text cards turn to face the camera.
    { title: 'Overview', detail: 'The object at a glance', point: [0.5, 0.96, 0.5], offset: [-0.12, 0.18, 0.1], width: 0.38 },
    { title: 'Design details', detail: 'Shape, texture and finish', point: [0.98, 0.29, 0.5], offset: [0.26, 0, 0.1], width: 0.38 },
    { title: 'Everyday use', detail: 'Form meets function', point: [0.22, 0.5, 0.95], offset: [-0.31, 0.02, 0.12], width: 0.38 },
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
