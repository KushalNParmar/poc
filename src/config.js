export const CONFIG = Object.freeze({
  modelUrl: './assets/Toaster.glb',
  modelSource: 'https://cdn.pixelbin.io/v2/dummy-cloudname/original/Toaster.glb',
  networkUrl: './assets/NN_COFFEE_2.json',
  // The neural network uses a unit-width detection window, not physical metres.
  modelWidth: 0.9,
  modelOffset: [0, 0.7, 0],
  modelRotation: [0, 0, 0],
  cameraMinDimensionFov: 35,
  maxPixelRatio: 1.5,
  detectIntervalMs: 1000 / 30,
  revealFrames: 3,
  lostAfterMs: 220,
  annotations: [
    // Label offsets and widths are in the same 3D units as the normalized model.
    // Cards inherit the model's orientation; no camera-facing rotation is applied.
    { title: 'Toast slots', detail: 'Top opening', point: [0.5, 0.96, 0.5], offset: [-0.12, 0.18, 0.1], width: 0.38 },
    { title: 'Control dial', detail: 'Front controls', point: [0.98, 0.29, 0.5], offset: [0.26, 0, 0.1], width: 0.38 },
    { title: 'Toaster body', detail: 'Outer housing', point: [0.22, 0.5, 0.95], offset: [-0.31, 0.02, 0.12], width: 0.38 },
  ],
});
