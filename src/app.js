import { CONFIG, TARGETS, DEFAULT_TARGET_ID } from './config.js';
import { ObjectTracker } from './tracker.js';
import { AnnotationScene } from './scene.js';

const $ = id => document.getElementById(id);
let scene, tracker, stream, animation;
let selectedTarget = TARGETS[DEFAULT_TARGET_ID], activeTarget = selectedTarget;
const networks = new Map();
const targetCopy = {
  cup: {
    subject: 'a coffee cup',
    guidance: 'Try an opaque coffee cup in good light. Keep the whole cup visible. Recognition varies by cup.',
    scanning: 'Use an opaque coffee cup. Keep it fully visible.',
  },
  keyboard: {
    subject: 'a computer keyboard',
    guidance: 'Try a full-size computer keyboard in good light. Keep all edges visible. Recognition varies by keyboard.',
    scanning: 'Keep the entire keyboard in view, including its edges.',
  },
  sprite: {
    subject: 'a Sprite can',
    guidance: 'Try a Sprite 330 ml / 12 oz can with the logo facing the camera. Packaging and reflections can affect recognition.',
    scanning: 'Show the Sprite logo and keep the whole can visible.',
  },
};
let mode = 'loading', frameId = 0, epoch = 0, lastDetectAt = 0, lastSeenAt = 0, hits = 0;
let preparing, stopping = Promise.resolve(), hasTracked = false, lastVideoTime = -1;
const debugEnabled = new URLSearchParams(location.search).has('debug');

function withTimeout(promise, milliseconds, message) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(message)), milliseconds); }),
  ]).finally(() => clearTimeout(timer));
}

function setStatus(text, state = '') {
  $('status').textContent = text;
  $('status').dataset.state = state;
}

function showLoader(message) {
  $('loaderDetail').textContent = message;
  $('lottieLoader').hidden = false;
  animation?.play();
}

function hideLoader() {
  $('lottieLoader').hidden = true;
  animation?.pause();
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
        throw new Error(`The ${target.name.toLowerCase()} tracking model could not be loaded. Check your connection and try again, or choose another object.`);
      })
      .finally(() => clearTimeout(timer));
    networks.set(target.id, request);
  }
  return networks.get(target.id);
}

function updateTargetUI() {
  $('targetName').textContent = selectedTarget.name;
  $('introMessage').textContent = `Point your camera at ${targetCopy[selectedTarget.id].subject}. Explore labels attached to it.`;
  $('targetHint').textContent = targetCopy[selectedTarget.id].guidance;
  document.querySelectorAll('input[name="trackingTarget"]').forEach(input => {
    input.checked = input.value === selectedTarget.id;
  });
}

function showScanning() {
  const name = activeTarget.name.toLowerCase();
  setStatus(`Scanning for ${name}`);
  $('scanGuide').hidden = false;
  $('sessionTitle').textContent = `Find your ${name}${hasTracked ? ' again' : ''}`;
  $('sessionHint').textContent = targetCopy[activeTarget.id].scanning;
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
        const state = tracker.step();
        if (state.label === activeTarget.label && scene.updatePose(state, false, now)) {
          lastSeenAt = now;
          hits++;
          if (hits >= CONFIG.revealFrames) {
            scene.root.visible = true;
            hasTracked = true;
            setStatus(`${activeTarget.name} tracked`, 'tracking');
            $('sessionTitle').textContent = `Your ${activeTarget.name.toLowerCase()}, augmented`;
            $('sessionHint').textContent = 'Move slowly. Keep the whole object in view.';
            $('scanGuide').hidden = true;
          }
        } else {
          hits = 0;
        }
        if (debugEnabled) $('debug').textContent = `label: ${state.label || 'none'}\nscore: ${state.score?.toFixed(3) ?? '—'}\nrender calls: ${scene.renderer.info.render.calls}`;
      } catch (error) {
        void showError(error);
      }
    }
    if (mode === 'ar' && scene.poseFilter.initialized && now - lastSeenAt > CONFIG.lostAfterMs) {
      scene.resetTracking();
      showScanning();
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
  $('targetSelector').disabled = false;
  updateTargetUI();
  await releaseCamera();
}

async function startCamera() {
  if (mode !== 'ready' && mode !== 'error') return;
  const token = ++epoch;
  const target = selectedTarget;
  activeTarget = target;
  mode = 'requesting';
  resetUI();
  $('intro').hidden = false;
  $('introMessage').textContent = 'Allow camera access in your browser to begin.';
  $('startButton').disabled = true;
  $('targetSelector').disabled = true;
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
    const video = $('camera');
    video.srcObject = stream;
    await video.play();
    if (token !== epoch) return;
    $('intro').hidden = true;
    showLoader(`Loading ${target.name.toLowerCase()} tracking`);
    const network = await loadNetwork(target);
    if (token !== epoch) return;
    showLoader(`Starting ${target.name.toLowerCase()} tracking`);
    tracker = new ObjectTracker({ video, canvas: $('trackingCanvas'), target, onFatal: error => { if (token === epoch) void showError(error); } });
    await tracker.init(network);
    if (token !== epoch) return;
    mode = 'ar';
    document.body.dataset.mode = 'ar';
    scene.setMode('ar', video, target);
    lastSeenAt = 0; lastDetectAt = 0; lastVideoTime = -1; hits = 0; hasTracked = false;
    $('sessionBar').hidden = false;
    $('resetButton').hidden = false;
    $('scanGuide').hidden = false;
    $('debug').hidden = !debugEnabled;
    showScanning();
    hideLoader();
    startRenderLoop();
    stream.getVideoTracks()[0].addEventListener('ended', () => {
      if (token === epoch) void showError(new Error('The camera stopped. Try starting it again.'));
    });
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
  $('chooseTargetButton').hidden = hardFailure || !scene?.ready;
  $('errorCard').hidden = false;
  console.error(error);
  await releaseCamera();
}

async function boot() {
  try {
    animation = window.lottie?.loadAnimation({ container: $('lottie'), renderer: 'svg', loop: true, autoplay: true, path: './assets/loader_light.json' });
    $('startButton').addEventListener('click', startCamera);
    $('stopButton').addEventListener('click', closeSession);
    $('chooseTargetButton').addEventListener('click', closeSession);
    $('targetSelector').addEventListener('change', event => {
      if (mode !== 'ready' || !TARGETS[event.target.value]) return;
      selectedTarget = TARGETS[event.target.value];
      updateTargetUI();
    });
    $('retryButton').addEventListener('click', () => $('retryButton').dataset.reload === 'true' ? location.reload() : (scene?.ready ? startCamera() : location.reload()));
    $('labelsButton').addEventListener('click', () => {
      scene.labelsEnabled = !scene.labelsEnabled;
      $('labelsButton').setAttribute('aria-pressed', String(scene.labelsEnabled));
      $('labelsButton').textContent = scene.labelsEnabled ? 'Labels on' : 'Labels off';
      scene.drawLabels();
    });
    $('resetButton').addEventListener('click', () => {
      tracker?.reset(); hits = 0; lastSeenAt = 0; scene.resetTracking();
      showScanning();
    });
    new ResizeObserver(() => scene?.resize()).observe($('stage'));
    $('camera').addEventListener('resize', () => scene?.resize());
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && mode === 'ar') {
        tracker?.reset(); hits = 0; lastSeenAt = 0; lastVideoTime = -1;
        scene.resetTracking();
        showScanning();
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
    updateTargetUI();
    hideLoader();
    $('intro').hidden = false;
    setStatus('Ready to explore');
    startRenderLoop();
  } catch (error) { await showError(error); }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else void boot();
