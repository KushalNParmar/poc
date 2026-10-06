import { CONFIG, TARGETS } from './config.js';
import { EXPERIENCES } from './content.js';
import { AutoObjectTracker } from './auto-tracker.js';
import { AnnotationScene } from './scene.js';
import { ExperienceUI } from './experience-ui.js';
import { TrackingRecovery } from './tracking-recovery.js';

const $ = id => document.getElementById(id);
const networks = new Map();
const debugEnabled = new URLSearchParams(location.search).has('debug');
let scene, sheet, recovery, tracker, stream, preparing, cameraRequest;
let cameraRequestToken = -1, stopping = Promise.resolve();
let mode = 'loading', epoch = 0, frameId = 0, activeTarget = null;
let lastDetectAt = 0, lastSeenAt = 0, lastVideoTime = -1, hits = 0;
let confirmedTarget = null, lastConfirmedAt = 0;

function setStatus(text, state = '') {
  if ($('status').textContent !== text) $('status').textContent = text;
  $('status').dataset.state = state;
}

function setBadge(text) {
  if ($('objectBadge').textContent !== text) $('objectBadge').textContent = text;
}

function cameraMessage(error) {
  return {
    NotAllowedError: 'Allow camera access in your browser, then tap Try again.',
    NotFoundError: 'No camera was found. Connect a camera or open this experience on your phone.',
    NotReadableError: 'The camera is busy. Close other camera apps, then try again.',
  }[error.name] || error.message || 'The camera could not start. Please try again.';
}

function cameraNotice(text = '') {
  $('cameraNotice').textContent = text;
  $('cameraNotice').hidden = !text;
}

function showLoader(message) {
  $('loaderDetail').textContent = message;
  $('lottieLoader').hidden = false;
}

function hideLoader() { $('lottieLoader').hidden = true; }

async function prepare() {
  if (!preparing) {
    preparing = (async () => {
      if (!scene) scene = new AnnotationScene($('sceneCanvas'), $('annotations'), $('stage'));
      await scene.load();
      scene.onHotspot = index => { if (mode === 'ar') sheet.detail(index); };
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

function hasCamera() {
  return stream?.getVideoTracks().some(track => track.readyState === 'live');
}

// Intro and Start scanning share one permission request and one camera stream.
async function ensureCamera(token) {
  if (cameraRequest) {
    const pendingToken = cameraRequestToken;
    try { await cameraRequest; }
    catch (error) { if (pendingToken === token) throw error; }
  }
  if (token !== epoch) return null;
  if (hasCamera()) {
    await $('camera').play();
    return stream;
  }
  cameraRequestToken = token;
  const request = (async () => {
    await stopping;
    if (token !== epoch) return null;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      throw new Error('Open this page over HTTPS (or localhost) to use the camera.');
    }
    const newStream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
    });
    if (token !== epoch) { newStream.getTracks().forEach(track => track.stop()); return null; }
    stream = newStream;
    const cameraTrack = stream.getVideoTracks()[0];
    if (!cameraTrack || cameraTrack.readyState === 'ended') throw new Error('The camera stopped. Please try again.');
    cameraTrack.addEventListener('ended', () => {
      if (token !== epoch || stream !== newStream) return;
      const error = new Error('The camera stopped. Please try again.');
      void showError(error);
    }, { once: true });
    $('camera').srcObject = stream;
    await $('camera').play();
    return token === epoch ? stream : null;
  })();
  const pending = request.finally(() => { if (cameraRequest === pending) cameraRequest = null; });
  cameraRequest = pending;
  return pending;
}

async function previewCamera() {
  const token = ++epoch;
  mode = 'preview';
  resetUI();
  hideLoader();
  document.body.dataset.mode = 'loading';
  $('cameraLoader').hidden = false;
  setStatus('Starting your camera');
  cameraNotice();
  try {
    await prepare();
    if (token !== epoch) return;
    startRenderLoop();
    const cameraStream = await ensureCamera(token);
    if (token !== epoch || !cameraStream) return;
    mode = 'intro';
    document.body.dataset.mode = 'intro';
    $('cameraLoader').hidden = true;
    $('intro').hidden = false;
    setStatus('Welcome to The Leela');
  } catch (error) {
    if (token === epoch) await showError(error);
  }
}

function showScanning(target = null) {
  setStatus(target ? `Looking for ${target.name.toLowerCase()} again` : 'Scanning for a cup, keyboard or Sprite can');
  setBadge(target ? 'Reacquiring…' : 'Scanning…');
  $('scanGuide').hidden = Boolean(target);
  if (!target) sheet.setTarget(null);
}

function resetScanning() {
  if (mode !== 'ar') return;
  tracker?.reset();
  if (mode !== 'ar') return;
  activeTarget = null;
  confirmedTarget = null;
  recovery.hide();
  hits = 0; lastSeenAt = 0; lastVideoTime = -1;
  scene.resetTracking();
  sheet.reset();
  sheet.open();
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
        if (mode !== 'ar' || tracker !== currentTracker) return;
        const { state, target, phase } = result;
        if (phase !== 'tracking') {
          if (activeTarget || scene.poseFilter.initialized) scene.resetTracking();
          activeTarget = null;
          hits = 0;
          showScanning(confirmedTarget);
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
            tracker.retainTarget(activeTarget.id);
            confirmedTarget = activeTarget;
            lastConfirmedAt = now;
            recovery.hide();
            scene.root.visible = true;
            sheet.setTarget(activeTarget);
            setStatus(`${activeTarget.name} discovered`, 'tracking');
            setBadge(EXPERIENCES[activeTarget.id].badge);
            $('scanGuide').hidden = true;
          }
        } else hits = 0;
        if (debugEnabled) $('debug').textContent = `phase: ${phase}\nmodel: ${target?.id ?? 'switching'}\nlabel: ${state?.label || 'none'}\nscore: ${state?.score?.toFixed(3) ?? '—'}`;
      } catch (error) { void showError(error); }
    }
    if (mode === 'ar' && scene.poseFilter.initialized && now - lastSeenAt > CONFIG.lostAfterMs) {
      scene.resetTracking();
      hits = 0;
      showScanning(confirmedTarget);
    }
    if (mode === 'ar' && confirmedTarget && now - lastConfirmedAt >= CONFIG.recoveryPromptAfterMs) {
      // Intermittent single poses must not leave stale, tappable hotspots
      // beneath recovery guidance. Keep hits/filter so reacquisition can finish.
      scene.root.visible = false;
      recovery.show(confirmedTarget);
      showScanning(confirmedTarget);
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
  if (previous) stopping = stopping.then(() => previous.destroy()).catch(error => console.warn('Tracker cleanup:', error));
  await stopping;
}

function resetUI() {
  confirmedTarget = null;
  recovery?.hide();
  for (const id of ['intro', 'arTopbar', 'errorCard', 'sessionBar', 'reopenButton', 'scanGuide', 'debug', 'cameraLoader']) $(id).hidden = true;
  $('startButton').disabled = false;
  scene?.setMode('idle');
}

async function closeSession() {
  const token = ++epoch;
  mode = 'closed';
  resetUI();
  hideLoader();
  document.body.dataset.mode = 'loading';
  $('cameraLoader').hidden = false;
  activeTarget = null;
  sheet.reset();
  await releaseCamera();
  if (token === epoch) await previewCamera();
}

async function startScanning() {
  if (mode !== 'intro' && mode !== 'error') return;
  // Reuse the camera that is already playing behind the introduction.
  const token = epoch;
  activeTarget = null;
  confirmedTarget = null;
  recovery.hide();
  mode = 'starting';
  $('startButton').disabled = true;
  $('errorCard').hidden = true;
  $('intro').hidden = true;
  document.body.dataset.mode = 'starting';
  showLoader('Preparing your Leela experience');
  try {
    await prepare();
    if (token !== epoch) return;
    cameraNotice('Allow camera access in your browser to begin.');
    const cameraStream = await ensureCamera(token);
    if (token !== epoch || !cameraStream) return;
    cameraNotice();
    $('intro').hidden = true;
    document.body.dataset.mode = 'starting';
    showLoader('Preparing your Leela experience');
    const targets = Object.values(TARGETS);
    const loadedNetworks = await Promise.all(targets.map(async target => [target.id, await loadNetwork(target)]));
    if (token !== epoch) return;
    tracker = new AutoObjectTracker({
      video: $('camera'), canvas: $('trackingCanvas'), targets,
      networks: new Map(loadedNetworks), settings: CONFIG.autoDetection,
      onFatal: error => { if (token === epoch) void showError(error); },
    });
    await tracker.init();
    if (token !== epoch) return;
    mode = 'ar';
    document.body.dataset.mode = 'ar';
    scene.setMode('ar', $('camera'));
    sheet.reset();
    sheet.open();
    $('arTopbar').hidden = false;
    $('debug').hidden = !debugEnabled;
    lastSeenAt = 0; lastDetectAt = 0; lastVideoTime = -1; hits = 0;
    showScanning();
    hideLoader();
    startRenderLoop();
  } catch (error) { if (token === epoch) await showError(error); }
}

async function showError(error) {
  if (mode === 'error') return;
  const retryPreview = mode !== 'starting' && mode !== 'ar';
  ++epoch;
  mode = 'error';
  resetUI();
  hideLoader();
  document.body.dataset.mode = 'error';
  setStatus('Needs attention');
  $('errorMessage').textContent = cameraMessage(error);
  const hardFailure = /timeout|timed out|context|WebGL|ALREADY_INITIALIZED/i.test(error.message || '');
  $('retryButton').textContent = hardFailure ? 'Reload page' : 'Try again';
  $('retryButton').dataset.reload = String(hardFailure);
  $('retryButton').dataset.preview = String(retryPreview);
  $('backButton').hidden = hardFailure || !scene?.ready;
  $('errorCard').hidden = false;
  console.error(error);
  await releaseCamera();
}

async function boot() {
  try {
    sheet = new ExperienceUI(index => scene?.setActiveHotspot(index));
    recovery = new TrackingRecovery($('stage'));
    $('startButton').addEventListener('click', startScanning);
    $('backButton').addEventListener('click', closeSession);
    $('retryButton').addEventListener('click', () => {
      if ($('retryButton').dataset.reload === 'true') location.reload();
      else if ($('retryButton').dataset.preview === 'true') void previewCamera();
      else void startScanning();
    });
    $('labelsButton').addEventListener('click', () => {
      scene.labelsEnabled = !scene.labelsEnabled;
      $('labelsButton').setAttribute('aria-pressed', String(scene.labelsEnabled));
      $('labelsButton').classList.toggle('on', scene.labelsEnabled);
      $('labelsButton').textContent = scene.labelsEnabled ? 'Labels on' : 'Labels off';
      scene.drawLabels();
    });
    $('resetButton').addEventListener('click', resetScanning);
    new ResizeObserver(() => scene?.resize()).observe($('stage'));
    $('camera').addEventListener('resize', () => scene?.resize());
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && mode === 'ar') {
        tracker?.resume();
        if (mode !== 'ar') return;
        hits = 0; lastVideoTime = -1;
        lastSeenAt = lastConfirmedAt = performance.now();
        scene.resetTracking();
        showScanning(confirmedTarget);
      }
    });
    window.addEventListener('pagehide', () => {
      ++epoch; mode = 'closed'; cancelAnimationFrame(frameId); frameId = 0;
      confirmedTarget = null;
      recovery.hide();
      void releaseCamera();
    });
    window.addEventListener('pageshow', event => { if (event.persisted) { void closeSession(); startRenderLoop(); } });
    $('sceneCanvas').addEventListener('webglcontextlost', event => { event.preventDefault(); void showError(new Error('The graphics context was lost. Reload the page to restart.')); });
    await previewCamera();
  } catch (error) { await showError(error); }
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else void boot();
