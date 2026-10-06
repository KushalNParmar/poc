import { CONFIG, TARGETS } from './config.js';
import { AutoObjectTracker } from './auto-tracker.js';
import { AnnotationScene } from './scene.js';

const $ = id => document.getElementById(id);
let scene, tracker, stream;
let activeTarget = null;
const networks = new Map();
const introMessage = 'Point your camera at a cup, keyboard or Sprite can. We’ll recognise it and bring its details into view.';
const targetCopy = {
  cup: {
    scanning: 'Use an opaque coffee cup. Keep it fully visible.',
  },
  keyboard: {
    scanning: 'Keep the entire keyboard in view, including its edges.',
  },
  sprite: {
    scanning: 'Show the Sprite logo and keep the whole can visible.',
  },
};
let mode = 'loading', frameId = 0, epoch = 0, lastDetectAt = 0, lastSeenAt = 0, hits = 0;
let preparing, stopping = Promise.resolve(), lastVideoTime = -1;
const debugEnabled = new URLSearchParams(location.search).has('debug');

function withTimeout(promise, milliseconds, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), milliseconds); }),
  ]).finally(() => clearTimeout(timer));
}

function setStatus(text, state = '') {
  if ($('status').textContent !== text) $('status').textContent = text;
  $('status').dataset.state = state;
}

function showLoader(message) {
  $('loaderDetail').textContent = message;
  $('lottieLoader').hidden = false;
}

function hideLoader() {
  $('lottieLoader').hidden = true;
}

async function prepare() {
  if (!preparing) {
    preparing = (async () => {
      if (!scene) scene = new AnnotationScene($('sceneCanvas'), $('annotations'), $('stage'));
      await withTimeout(scene.ready ? Promise.resolve() : scene.load(),
        45000, 'Loading timed out. Check your connection and reload the page.');
    })().catch(error => { preparing = null; throw error; });
  }
  return preparing;
}

function loadNetwork(target) {
  if (!networks.has(target.id)) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 45000);
    const request = fetch(target.networkUrl, { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .catch(error => {
        networks.delete(target.id);
        console.warn(`${target.name} model download:`, error);
        throw new Error(`The ${target.name.toLowerCase()} tracking model could not be loaded. Check your connection and try again.`);
      })
      .finally(() => clearTimeout(timer));
    networks.set(target.id, request);
  }
  return networks.get(target.id);
}

function showScanning(target = null) {
  setStatus(target ? `Looking for ${target.name.toLowerCase()} again` : 'Looking for a cup, keyboard or Sprite can');
  $('scanGuide').hidden = false;
  $('sessionTitle').textContent = target ? `Find your ${target.name.toLowerCase()} again` : 'Looking for an object';
  $('sessionHint').textContent = target ? targetCopy[target.id].scanning : 'Point at a cup, keyboard or Sprite can. Keep it fully visible.';
}

function resetScanning() {
  if (mode !== 'ar') return;
  tracker?.reset();
  if (mode !== 'ar') return;
  activeTarget = null;
  hits = 0; lastSeenAt = 0; lastVideoTime = -1;
  scene.resetTracking();
  showScanning();
}

function startRenderLoop() {
  if (frameId) return;
  const loop = now => {
    frameId = requestAnimationFrame(loop);
    if (document.hidden || !scene) return;
    if (mode === 'ar' && tracker && now - lastDetectAt >= CONFIG.detectIntervalMs && $('camera').currentTime !== lastVideoTime) {
      lastDetectAt = now;
      lastVideoTime = $('camera').currentTime;
      try {
        const currentTracker = tracker;
        const result = currentTracker.step(now);
        // A fatal core callback can synchronously enter the error screen.
        if (mode !== 'ar' || tracker !== currentTracker) return;
        const { state, target, phase } = result;
        if (phase !== 'tracking') {
          if (activeTarget || scene.poseFilter.initialized) scene.resetTracking();
          activeTarget = null;
          hits = 0;
          showScanning();
        } else if (target && activeTarget?.id !== target.id) {
          activeTarget = target;
          hits = 0;
          scene.resetTracking();
          scene.setTarget(target);
        }
        if (phase === 'tracking' && state && activeTarget && state.label === activeTarget.label && scene.updatePose(state, false, now)) {
          lastSeenAt = now;
          hits++;
          if (hits >= CONFIG.revealFrames) {
            scene.root.visible = true;
            setStatus(`${activeTarget.name} tracked`, 'tracking');
            $('sessionTitle').textContent = `Your ${activeTarget.name.toLowerCase()}, augmented`;
            $('sessionHint').textContent = 'Move slowly. Keep the whole object in view.';
            $('scanGuide').hidden = true;
          }
        } else {
          hits = 0;
        }
        if (debugEnabled) $('debug').textContent = `phase: ${phase}\nmodel: ${target?.id ?? 'switching'}\nlabel: ${state?.label || 'none'}\nscore: ${state?.score?.toFixed(3) ?? '—'}\nrender calls: ${scene.renderer.info.render.calls}`;
      } catch (error) {
        void showError(error);
      }
    }
    if (mode === 'ar' && scene.poseFilter.initialized && now - lastSeenAt > CONFIG.lostAfterMs) {
      scene.resetTracking();
      showScanning(activeTarget);
    }
    scene.render(now);
  };
  frameId = requestAnimationFrame(loop);
}

async function releaseCamera() {
  if (stream) stream.getTracks().forEach(track => track.stop());
  stream = null;
  $('camera').srcObject = null;
  const previous = tracker;
  tracker = null;
  if (previous) {
    stopping = stopping.then(() => previous.destroy()).catch(error => console.warn('Tracker cleanup:', error));
  }
  await stopping;
}

function resetUI() {
  $('intro').hidden = true;
  $('errorCard').hidden = true;
  $('sessionBar').hidden = true;
  $('scanGuide').hidden = true;
  $('debug').hidden = true;
  $('startButton').disabled = false;
  scene?.setMode('idle');
}

async function closeSession() {
  ++epoch;
  mode = 'ready';
  document.body.dataset.mode = 'ready';
  resetUI();
  hideLoader();
  setStatus('Ready to explore');
  $('intro').hidden = false;
  $('introMessage').textContent = introMessage;
  activeTarget = null;
  await releaseCamera();
}

async function startCamera() {
  if (mode !== 'ready' && mode !== 'error') return;
  const token = ++epoch;
  activeTarget = null;
  mode = 'requesting';
  resetUI();
  $('intro').hidden = false;
  $('introMessage').textContent = 'Allow camera access in your browser to begin.';
  $('startButton').disabled = true;
  setStatus('Waiting for camera');
  await releaseCamera();
  try {
    await prepare();
    if (token !== epoch) return;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Open this page over HTTPS (or localhost) to use the camera.');
    }
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    if (token !== epoch) { newStream.getTracks().forEach(track => track.stop()); return; }
    stream = newStream;
    const cameraTrack = stream.getVideoTracks()[0];
    if (!cameraTrack || cameraTrack.readyState === 'ended') {
      throw new Error('The camera stopped. Try starting it again.');
    }
    // Catch camera interruptions during model downloads and core startup too.
    cameraTrack.addEventListener('ended', () => {
      if (token === epoch) void showError(new Error('The camera stopped. Try starting it again.'));
    }, { once: true });
    const video = $('camera');
    video.srcObject = stream;
    await video.play();
    if (token !== epoch) return;
    $('intro').hidden = true;
    showLoader('Loading automatic object detection');
    const targets = Object.values(TARGETS);
    const loadedNetworks = await Promise.all(targets.map(async target => [target.id, await loadNetwork(target)]));
    if (token !== epoch) return;
    showLoader('Starting automatic object detection');
    tracker = new AutoObjectTracker({
      video, canvas: $('trackingCanvas'), targets, networks: new Map(loadedNetworks),
      settings: CONFIG.autoDetection,
      onFatal: error => { if (token === epoch) void showError(error); },
    });
    await tracker.init();
    if (token !== epoch) return;
    mode = 'ar';
    document.body.dataset.mode = 'ar';
    scene.setMode('ar', video);
    lastSeenAt = 0; lastDetectAt = 0; lastVideoTime = -1; hits = 0;
    $('sessionBar').hidden = false;
    $('resetButton').hidden = false;
    $('scanGuide').hidden = false;
    $('debug').hidden = !debugEnabled;
    showScanning();
    hideLoader();
    startRenderLoop();
  } catch (error) { if (token === epoch) await showError(error); }
}

async function showError(error) {
  if (mode === 'error') return;
  ++epoch;
  mode = 'error';
  resetUI();
  hideLoader();
  document.body.dataset.mode = 'error';
  setStatus('Needs attention');
  const messages = {
    NotAllowedError: 'Camera access was denied. Allow camera access in your browser’s site settings, then try again.',
    NotFoundError: 'No camera was found. Connect a camera or open this page on your phone.',
    NotReadableError: 'The camera is busy or unavailable. Close other camera apps, then try again.',
  };
  $('errorMessage').textContent = messages[error.name] || error.message || 'The experience could not load. Please reload and try again.';
  const hardFailure = /timeout|timed out|context|WebGL|ALREADY_INITIALIZED/i.test(error.message || '');
  $('retryButton').textContent = hardFailure ? 'Reload page' : 'Try again';
  $('retryButton').dataset.reload = String(hardFailure);
  $('backButton').hidden = hardFailure || !scene?.ready;
  $('errorCard').hidden = false;
  console.error(error);
  await releaseCamera();
}

async function boot() {
  try {
    $('startButton').addEventListener('click', startCamera);
    $('stopButton').addEventListener('click', closeSession);
    $('backButton').addEventListener('click', closeSession);
    $('retryButton').addEventListener('click', () => $('retryButton').dataset.reload === 'true' ? location.reload() : (scene?.ready ? startCamera() : location.reload()));
    $('labelsButton').addEventListener('click', () => {
      scene.labelsEnabled = !scene.labelsEnabled;
      $('labelsButton').setAttribute('aria-pressed', String(scene.labelsEnabled));
      $('labelsButton').textContent = scene.labelsEnabled ? 'Labels on' : 'Labels off';
      scene.drawLabels();
    });
    $('resetButton').addEventListener('click', resetScanning);
    new ResizeObserver(() => scene?.resize()).observe($('stage'));
    $('camera').addEventListener('resize', () => scene?.resize());
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && mode === 'ar') {
        resetScanning();
      }
    });
    window.addEventListener('pagehide', () => {
      ++epoch; mode = 'closed'; cancelAnimationFrame(frameId); frameId = 0;
      void releaseCamera();
    });
    window.addEventListener('pageshow', event => { if (event.persisted) { void closeSession(); startRenderLoop(); } });
    $('sceneCanvas').addEventListener('webglcontextlost', event => { event.preventDefault(); void showError(new Error('The graphics context was lost. Reload the page to restart.')); });
    await prepare();
    mode = 'ready';
    document.body.dataset.mode = 'ready';
    $('introMessage').textContent = introMessage;
    hideLoader();
    $('intro').hidden = false;
    setStatus('Ready to explore');
    startRenderLoop();
  } catch (error) { await showError(error); }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else void boot();
