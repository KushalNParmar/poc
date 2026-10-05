# Object AR labels POC

A static browser experience that uses WebAR.rocks.object to track a selected coffee cup, computer keyboard, or Sprite can and Three.js to display three tracked annotations. The original page shell and Lottie loader have been retained. GlamAR code and credentials are removed.

## Run

From this project directory:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://localhost:8765`. For phone testing, serve this directory on **HTTPS**. A phone opening a computer's plain HTTP LAN address does not get the localhost camera exemption. No build or package installation is needed. Enable gzip/Brotli for the network JSON and JavaScript in your static host.

Choose **Cup**, **Keyboard**, or **Sprite can** below **Start camera**, then start live tracking; Cup is selected by default and the rear camera is preferred. Only the selected tracking network downloads when starting the camera, and it is cached in memory for reuse. The labels appear only when the selected target is tracked. Labels can be toggled. Rescan resets detection, and Close stops the camera and returns to object selection. A failed model download can be retried or another object selected.

## Targets and labels

- Tracking targets use the official pretrained networks and their corresponding detector settings:

  | Selection | Label | Network |
  | --- | --- | --- |
  | Cup (default) | `CUP` | `NN_COFFEE_2.json` |
  | Keyboard | `KEYBOARD` | `NN_KEYBOARD_5.json` |
  | Sprite can | `SPRITECAN` | `NN_SPRITE_1.json` |

- Each target uses the same three labels: **Overview — The object at a glance**, **Design details — Shape, texture and finish**, and **Everyday use — Form meets function**. The three anchor spots and card-center offsets are retained. The scene builds annotations directly from fixed reference bounds; there is no toaster model to load or render.
- Any cup is **not** guaranteed. Start with a conventional opaque coffee cup in good light, keep the entire cup visible, and move slowly. Unusual shapes, clear glass, shiny metal, occlusion, and poor lighting can reduce reliability. Verify your specific cup.
- For Keyboard, try a full-size computer keyboard with all edges visible. For Sprite, try a 330 ml / 12 oz Sprite can with the logo facing the camera. Other drink cans and every Sprite packaging variation are not supported by implication. Recognition must be checked with the actual objects.
- One target at a time. Content hides after tracking is lost and reappears after reacquisition. There are no persistent room anchors or real-object depth occlusion.
- The estimated camera field of view and annotation placement require calibration with actual objects. This POC has not been validated on physical iOS or Android devices yet. Keyboard retains the upstream detector's `followZRot: false`; the optional upstream device-orientation correction is not enabled, so no motion-sensor permission is requested. All targets share the same pose filter.

## Configuration

`src/config.js` contains the target profiles, network URLs, annotation bounds and placement in tracker-relative units, annotation anchor positions, loss tolerance, and detection cadence. Annotation points are fractions of the reference annotation bounds. Label offsets and widths use object-local 3D units. Card orientation is controlled by the camera-facing update, so object rotation does not tilt or mirror the text. Rendering and the detector share a centered cover crop; the detector source is refreshed on intrinsic video-size changes.

`src/tracker.js` owns the singleton tracking core and its lifecycle. `src/scene.js` owns rendering, pose conversion, stabilization, and the shared annotation hierarchy. `src/annotations.js` creates textured 3D text cards, connector lines, and anchor dots. The three anchor dots and card centers follow the smoothed object pose and scale with distance. Text cards counter-rotate every rendered frame to stay parallel to the camera and upright, including when the object turns around. Connector lines update their orientation and length to meet the camera-facing card edges, using the same geometry each frame. `src/app.js` owns camera permissions and UI state. Add `?debug=1` to see detection state and score.

`src/pose-filter.js` applies an adaptive [One Euro filter](https://gery.casiez.net/1euro/) to position and quaternion rotation, replacing the previous sliding-window stabilizer. A frame-time lerp/slerp eases the shared root between detections, keeping the labels, dots and lines together. Tune cutoffs, speed response and render easing in `CONFIG.smoothing`: lower minimum cutoffs suppress more stationary jitter but add lag; higher beta responds faster to motion. Position speed is normalized by depth, and rotation uses the shortest quaternion arc. Brief missed detections retain filtering history; tracking loss, rescan, session changes and tab resume reset it. This reduces pose noise but does not correct an incorrectly detected object or uncalibrated camera.

## Dependencies

All runtime assets are served locally. Three.js and addons are pinned to r136 to match the standalone upstream integration baseline. WebAR.rocks.object is based on the commit recorded in `vendor/sources.json`, with two small local corrections for switching targets: reset the yaw-decoding flag when loading each network, and restore the default scan settings before applying each target's overrides. Without these corrections, Keyboard settings leak into subsequent Cup/Sprite sessions. The manifest records the upstream hash, local modifications, and the shipped file's hash and size.

Upstream license notices are included for WebAR.rocks.object, Three.js, Draco, and Lottie. The loader animation was supplied by the project owner; its original source URL is recorded. No license for that asset is inferred.

## Validation

Run the deterministic smoothing checks with `node tests/pose-filter-check.cjs` (no package installation). They cover stationary jitter, moving-pose lag at 15/30/60 detections per second, depth scaling, quaternion wrap/sign equivalence, invalid timestamps, brief misses, and reset/reacquisition. Where the previous vendor stabilizer is present, the test also compares displayed-pose jitter against it on identical synthetic inputs. These measurements are synthetic, not real-device accuracy benchmarks.

Browser checks cover annotation creation without GLB/Draco downloads, label toggling, mobile viewport layout, actual tracking-engine initialization against a synthetic camera stream, rescanning, stopping, and reinitialization. Annotation checks cover the three tracked spots, camera-facing text across yaw/pitch/roll and reversed views, leader attachment, geometry reuse, and loss/reacquisition with injected detection output. Synthetic checks establish runtime integration only; they do not establish physical-object recognition accuracy or mobile hardware performance.

Target-selection checks cover all three network initializations, per-target settings and state isolation, keyboard navigation, selected-only downloads, cache reuse, wrong-label rejection, camera permission retry, and recovery from a missing network.

Before treating this as a demonstrated AR result, test all three actual objects on target phones, including camera/object movement, rotation, temporary occlusion, loss/reacquisition, and changes in lighting.
