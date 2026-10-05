# Object → Toaster POC

A static browser experience that uses WebAR.rocks.object to track a selected coffee cup, computer keyboard, or Sprite can and Three.js to display the supplied toaster with attached annotations. The original page shell and Lottie loader have been retained. GlamAR code and credentials are removed.

## Run

From this project directory:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://localhost:8765`. For phone testing, serve this directory on **HTTPS**. A phone opening a computer's plain HTTP LAN address does not get the localhost camera exemption. No build or package installation is needed. Enable gzip/Brotli for the network JSON and JavaScript in your static host.

Choose **Cup**, **Keyboard**, or **Sprite can** below **Start camera**, then start live tracking; Cup is selected by default and the rear camera is preferred. Only the selected tracking network downloads when starting the camera, and it is cached in memory for reuse. The toaster appears only when the selected target is tracked. Labels can be toggled. Rescan resets detection, and Close stops the camera and returns to object selection. A failed model download can be retried or another object selected.

## Target and model

- Tracking targets use the official pretrained networks and their corresponding detector settings:

  | Selection | Label | Network |
  | --- | --- | --- |
  | Cup (default) | `CUP` | `NN_COFFEE_2.json` |
  | Keyboard | `KEYBOARD` | `NN_KEYBOARD_5.json` |
  | Sprite can | `SPRITECAN` | `NN_SPRITE_1.json` |

- Display model: supplied [Toaster.glb](https://cdn.pixelbin.io/v2/dummy-cloudname/original/Toaster.glb), stored locally unchanged (Draco compressed).
- Any cup is **not** guaranteed. Start with a conventional opaque coffee cup in good light, keep the entire cup visible, and move slowly. Unusual shapes, clear glass, shiny metal, occlusion, and poor lighting can reduce reliability. Verify your specific cup.
- For Keyboard, try a full-size computer keyboard with all edges visible. For Sprite, try a 330 ml / 12 oz Sprite can with the logo facing the camera. Other drink cans and every Sprite packaging variation are not supported by implication. Recognition must be checked with the actual objects.
- One target at a time. Content hides after tracking is lost and reappears after reacquisition. There are no persistent room anchors or real-object depth occlusion.
- The estimated camera field of view and model placement require calibration with actual objects. This POC has not been validated on physical iOS or Android devices yet. Keyboard retains the upstream detector's `followZRot: false`; the optional upstream device-orientation correction is not enabled, so no motion-sensor permission is requested. All targets share the existing scene stabilizer.

## Configuration

`src/config.js` contains the target profiles, model/network URLs, model placement and size in tracker-relative units, annotation anchor positions, loss tolerance, and detection cadence. Annotation points are fractions of the normalized model bounding box. Label offsets and widths use model-local 3D units; an optional `rotation: [x, y, z]` sets the card's local orientation in radians. Rendering and the detector share a centered cover crop; the detector source is refreshed on intrinsic video-size changes.

`src/tracker.js` owns the singleton tracking core and its lifecycle. `src/scene.js` owns rendering, pose conversion, stabilization, and the shared model/annotation hierarchy. `src/annotations.js` creates textured 3D text cards, connector lines, and anchor dots. The whole annotation rotates with the toaster in yaw, pitch, and roll, and scales with distance. Cards have independently readable front and back faces. At edge-on angles they naturally become thin; the toaster can occlude them. `src/app.js` owns camera permissions and UI state. Add `?debug=1` to see detection state and score.

## Dependencies

All runtime assets are served locally. Three.js and addons are pinned to r136 to match the standalone upstream integration baseline. WebAR.rocks.object is based on the commit recorded in `vendor/sources.json`, with two small local corrections for switching targets: reset the yaw-decoding flag when loading each network, and restore the default scan settings before applying each target's overrides. Without these corrections, Keyboard settings leak into subsequent Cup/Sprite sessions. The manifest records the upstream hash, local modifications, and the shipped file's hash and size.

Upstream license notices are included for WebAR.rocks.object, Three.js, Draco, and Lottie. The toaster and loader animation were supplied by the project owner; their original source URLs are recorded. No license for those assets is inferred.

## Validation

Browser checks cover actual GLB/Draco decoding, label toggling, mobile viewport layout, actual tracking-engine initialization against a synthetic camera stream, rescanning, stopping, and reinitialization. Annotation checks cover shared 3D transforms, yaw/pitch foreshortening, roll, front/back text, and loss/reacquisition with injected detection output. Synthetic checks establish runtime integration only; they do not establish physical-object recognition accuracy or mobile hardware performance.

Target-selection checks cover all three network initializations, per-target settings and state isolation, keyboard navigation, selected-only downloads, cache reuse, wrong-label rejection, camera permission retry, and recovery from a missing network.

Before treating this as a demonstrated AR result, test all three actual objects on target phones, including camera/object movement, rotation, temporary occlusion, loss/reacquisition, and changes in lighting.
