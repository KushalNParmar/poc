# Object AR labels POC

A static browser experience that uses WebAR.rocks.object to track a selected coffee cup, computer keyboard, or Sprite can and Three.js to display three tracked annotations. The UI uses the monochrome theme, GlamAR SVG branding, and CSS wave-grid loader from the existing `poc/index.html`. No skin-analysis SDK, login, or client-record integration is included.

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

- Each target has three product-specific labels, split into two lines for readability:

  | Target | Label 1 | Label 2 | Label 3 |
  | --- | --- | --- | --- |
  | Keyboard | Made with / recycled plastic | Smart battery / efficiency | Responsible / packaging |
  | Cup | Your daily brew / Coffee or tea, your way | Pause and sip / Make time for a break | Refill and repeat / Enjoy your next cup |
  | Sprite | Lemon-lime flavour / Crisp, refreshing taste | Serve chilled / Enjoy a refreshing break | Recycle the can / Empty it. Recycle locally. |

  Keyboard copy is supplied for this demo; detecting a keyboard does not verify its materials, battery, or packaging. Cup copy describes everyday use without asserting materials or insulation. Sprite flavour and chilled-serving copy refer to [Coca-Cola's Sprite information](https://www.yourcoca-cola.co.uk/p/sprite-24-x-330ml/12737124/); recycling depends on local collection. Three reference spots remain configured for each object's shape. There is no toaster model to load or render.
- Any cup is **not** guaranteed. Start with a conventional opaque coffee cup in good light, keep the entire cup visible, and move slowly. Unusual shapes, clear glass, shiny metal, occlusion, and poor lighting can reduce reliability. Verify your specific cup.
- For Keyboard, try a full-size computer keyboard with all edges visible. For Sprite, try a 330 ml / 12 oz Sprite can with the logo facing the camera. Other drink cans and every Sprite packaging variation are not supported by implication. Recognition must be checked with the actual objects.
- One target at a time. Content hides after tracking is lost and reappears after reacquisition. There are no persistent room anchors or real-object depth occlusion.
- The estimated camera field of view and annotation placement require calibration with actual objects. This POC has not been validated on physical iOS or Android devices yet. Keyboard retains the upstream detector's `followZRot: false`; the optional upstream device-orientation correction is not enabled, so no motion-sensor permission is requested. All targets share the same pose filter.

## Configuration

`src/config.js` contains target profiles, per-target `annotations` copy, shared card layout, annotation anchor positions, loss tolerance, and detection cadence. Switching targets redraws the card textures and screen-reader text, disposes replaced textures, and reuses the existing geometry. Each profile's `annotationAnchors` are object-local coordinates in tracker units, not metres or detected semantic keypoints. Cup and Sprite spots use the upstream centered cylinder dimensions; the keyboard spots lie near its deck plane and may need tuning for different keyboard proportions. Card orientation is controlled by the camera-facing update, so object rotation does not tilt or mirror the text. Rendering and the detector share a centered cover crop; the detector source is refreshed on intrinsic video-size changes.

`src/tracker.js` owns the singleton tracking core and its lifecycle. `src/scene.js` owns rendering, pose conversion, stabilization, and the shared annotation hierarchy. `src/annotations.js` creates textured 3D text cards, connector lines, and anchor dots. The dots follow the smoothed object pose. Text cards counter-rotate every rendered frame to stay parallel to the camera and upright, including when the object turns around. `src/label-layout.js` places cards near their projected anchors, smoothly places the side cards outward from their projected spots as the object turns, and chooses the vertical order from the initial tracked view. That order stays fixed until tracking resets, with 20 CSS pixels between cards and a separate 8-pixel preferred connector gap, and keeps them inside the viewport safe area above the session controls. Card width is constrained in CSS pixels for readability. Connector lines update to meet the resized card edges using the same geometry each frame. `src/app.js` owns camera permissions and UI state. Add `?debug=1` to see detection state and score.

`src/pose-filter.js` applies an adaptive [One Euro filter](https://gery.casiez.net/1euro/) to position and quaternion rotation, replacing the previous sliding-window stabilizer. A frame-time lerp/slerp eases the shared root between detections, keeping the labels, dots and lines together. Tune cutoffs, speed response and render easing in `CONFIG.smoothing`: lower minimum cutoffs suppress more stationary jitter but add lag; higher beta responds faster to motion. Position speed is normalized by depth, and rotation uses the shortest quaternion arc. Brief missed detections retain filtering history; tracking loss, rescan, session changes and tab resume reset it. This reduces pose noise but does not correct an incorrectly detected object or uncalibrated camera.

## Dependencies

All runtime assets are served locally. Three.js and addons are pinned to r136 to match the standalone upstream integration baseline. WebAR.rocks.object is based on the commit recorded in `vendor/sources.json`, with two small local corrections for switching targets: reset the yaw-decoding flag when loading each network, and restore the default scan settings before applying each target's overrides. Without these corrections, Keyboard settings leak into subsequent Cup/Sprite sessions. The manifest records the upstream hash, local modifications, and the shipped file's hash and size.

Upstream license notices remain included for the vendored dependencies. The active loader uses the original POC's CSS wave-grid animation, including its reduced-motion fallback. Older Lottie assets remain archived in the repository but are not requested at runtime.

## Mobile viewport and branding

`loader.css` retains the original white loader, 16 black cells, animation timings, and responsive sizes. A borderless GlamAR logo replaces the object-to-AR title in the center of the start screen. The top logo/status badges are removed; tracking status remains available to screen readers. During the camera experience, a full-width white “Powered by GlamAR” footer sits at the bottom, including the device safe area; session controls stay above it. Camera overlays use white cards with charcoal text. Pointers have a white outline so they remain visible over dark objects.

The page uses `viewport-fit=cover`, matching root/body backgrounds, a fixed full-viewport stage, and safe-area spacing on controls. Canvas projection follows the measured stage size when it changes. These address page-side gaps; native Safari or in-app browser toolbars remain controlled by iOS. Physical iOS testing is still required, especially when browser bars expand/collapse. See [WebKit's safe-area guidance](https://webkit.org/blog/7929/designing-websites-for-iphone-x/).

## Validation

Run the deterministic smoothing checks with `node tests/pose-filter-check.cjs` (no package installation). They cover stationary jitter, moving-pose lag at 15/30/60 detections per second, depth scaling, quaternion wrap/sign equivalence, invalid timestamps, brief misses, and reset/reacquisition. Where the previous vendor stabilizer is present, the test also compares displayed-pose jitter against it on identical synthetic inputs. These measurements are synthetic, not real-device accuracy benchmarks.

Browser checks cover annotation creation without GLB/Draco downloads, label toggling, mobile viewport layout, actual tracking-engine initialization against a synthetic camera stream, rescanning, stopping, and reinitialization. Annotation checks cover the three tracked spots, camera-facing text across yaw/pitch/roll and reversed views, leader attachment, geometry reuse, and loss/reacquisition with injected detection output. Placement checks cover all three target profiles, front and oblique views, portrait/landscape and small screens, separation between cards, and clearance from safe-area insets and controls. Synthetic checks establish runtime integration only; they do not establish physical-object recognition accuracy or mobile hardware performance.

Target-selection checks cover all three network initializations, per-target settings and state isolation, keyboard navigation, selected-only downloads, cache reuse, wrong-label rejection, camera permission retry, and recovery from a missing network.

Theme checks compare the logo paths and loader animation against the source POC, verify reduced motion and loader failure recovery, cycle all product copies without recreating geometry, and emulate mobile viewport/safe-area changes in Chromium. These do not reproduce native iOS browser chrome.

Before treating this as a demonstrated AR result, test all three actual objects on target phones, including camera/object movement, rotation, temporary occlusion, loss/reacquisition, and changes in lighting.
