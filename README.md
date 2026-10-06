# The Leela AR discovery POC

A browser camera experience that automatically recognises a supported cup, keyboard or Sprite can and reveals The Leela stories around it. WebAR.rocks.object estimates the object pose; Three.js and the existing One Euro filter smooth the anchors; interactive HTML hotspots stay readable and face the camera.

## Run

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://localhost:8765`. Use **HTTPS** when testing on phones and tablets. A plain HTTP LAN address does not qualify for the localhost camera exemption. No build or package installation is required. Enable gzip/Brotli for the model JSON and JavaScript on the static host.

## Experience

The page requests the rear camera on entry and displays a full-screen native animation inspired by `leela_ar_intro_1080x1920.gif`. Only after the camera begins playback does it reveal the blurred live preview and introduction sheet, which contains the original static Leela monogram above its title:

- **Enter the world of True Indian Luxury**
- Point your camera at an object and uncover the story behind it.
- **Start scanning**

The browser still controls camera permission. If permission is denied or the camera fails, an error panel offers **Try again**; retry returns to the animated loader while the camera starts, then shows the introduction. Starting scanning reuses the preview stream instead of opening a second camera. The GIF is a visual reference only and is not shipped or requested. The loader uses the small Leela logo PNG, CSS reveal/glow and lettering animations, gold scan corners, a subtle SVG geometric pattern, and softly twinkling points. Its blue background fills every screen edge to edge, with no aspect-ratio cropping or side gaps. Reduced-motion preferences show a static, readable identity. The introduction sheet uses the original small static monogram from the HTML reference, without lettering, framing or logo animation. Model preparation after Start scanning retains the compact Leela loader.

After Start scanning, the app loads the three models once, searches automatically and shows the matching experience. No manual object selector is provided. Four gold pins and glass labels per target reproduce the supplied hotspot copy:

| Target | Hotspots | Overview links |
| --- | --- | --- |
| Cup | Culinary Artistry; Mindful Sips; Signature Dining; Gift the Taste | Explore dining; Aujasya menus |
| Keyboard | Royal Meetings; Always Connected; Grand Venues; Arq Privileges | Plan a meeting; MICE brochure |
| Sprite can | Plastic-free; Mixology; The Library Bar; Net Zero by 2050 | Our sustainability; Explore bars |

Tap a pin or label to open its detail, call to action and highlight navigation. **All highlights** returns to the overview. **Labels off** hides the text cards and connector lines while retaining tappable pins. **Close** collapses the details sheet; **Show details** restores it. **Rescan** clears the current match and searches again. After a successful scan, sustained tracking loss shows a Leela-themed camera overlay naming that object and asking the user to align it. It never appears during the first search. The header and bottom sheet remain usable, and the open object detail is preserved. Three consecutive valid pose frames restore the annotations and remove the overlay; isolated detection blips do not dismiss it.

The reference’s `can` content maps to our existing **Sprite can** tracking network. Its mock COCO detector notes are not implemented; this POC still supports the same three pretrained object models.

## Branding, responsive layout and content

The theme, monogram, hotspot copy and sheet copy come from `leela_ar_get_started.html` and `leela_ar_ui_reference.html`; the logo motion references `leela_ar_intro_1080x1920.gif`. Active screens and loading states use The Leela branding throughout. Palette: sodalite `#070d1f`, gold `#f8e6a8` / `#e2c27a` / `#c9a45a`, ivory `#efe8da`. Typography retains the supplied serif/sans font stacks with system fallbacks; no remote font dependency is required.

The app fills the available camera viewport, reserves device safe areas and limits intro/AR sheets to 600 px on tablets and desktop. Short landscape layouts use a compact introduction. Sheet content scrolls independently when necessary, keeping its controls reachable. Hotspot text wraps rather than truncating; cards avoid the header, sheet and reopened-details button. If the available area is too small for every readable card, pins remain available and their details can still be opened. Safari’s native browser bars remain controlled by iOS.

All overview and hotspot calls to action use HTTPS links to the official Leela site and open a new tab with `noopener noreferrer`. The following destinations were checked on 6 October 2026:

- [Culinary Artistry](https://www.theleela.com/culinary-artistry-at-the-leela): dining, signature restaurants and the multi-property bar listings used by Explore bars.
- [Aujasya](https://www.theleela.com/aujasya-by-the-leela): wellbeing and Sampoorna nourishment information.
- [Meetings](https://www.theleela.com/meetings): meeting spaces and its linked MICE brochure. The brochure action preserves the official PDF URL and version from the reference.
- [Sustainability](https://www.theleela.com/sustainability) and [Environmental stewardship](https://www.theleela.com/environmental-stewardship).
- [Signatures](https://www.theleela.com/signatures-by-the-leela), [Royal Meetings](https://www.theleela.com/special-offers/royal-meetings), [Arq](https://www.theleela.com/arq-by-the-leela), and [The Library Bar](https://www.theleela.com/the-leela-palace-bengaluru/restaurants/the-library-bar).

`src/content.js` contains the reference copy and links independently of tracking configuration. Time-sensitive offers and their linked pages may change.

## Automatic tracking

| Target | Detector label | Network |
| --- | --- | --- |
| Cup | `CUP` | `NN_COFFEE_2.json` |
| Keyboard | `KEYBOARD` | `NN_KEYBOARD_5.json` |
| Sprite can | `SPRITECAN` | `NN_SPRITE_1.json` |

The three networks are separate. Each candidate receives at least 1.8 seconds and 30 fresh detection frames; four consecutive valid, confident detections confirm the target. The scene retains its three-frame reveal check. Scores are judged using each model’s native thresholds, not compared across different models. Only the locked model runs during tracking. Brief misses preserve its lock; annotations hide after 220 ms. Once the UI has successfully revealed an object, the controller retains that model throughout loss instead of switching to an unrelated object. Recovery guidance appears after 500 ms without stable tracking. Before a successful reveal, the original 1.5-second loss budget can still advance the automatic search. **Rescan** explicitly releases the retained object and restarts automatic discovery. Returning from a background tab refreshes pose confirmation while retaining the discovered object and its details.

`src/auto-tracker.js` serializes destruction and initialization of the single tracking core. The camera stays open across model changes and model JSON is cached. GPU setup can briefly interrupt rendering; a complete search can take several seconds. Only one target is tracked at a time, and scan order affects the result if several supported objects are visible.

The pretrained models do not guarantee recognition of every cup, keyboard or Sprite package. Use a conventional opaque cup, a fully visible keyboard, or a Sprite 330 ml / 12 oz can with the logo visible. Other drinks, arbitrary cans, reflective or transparent materials and partial views may not work. No retraining, paid service, room anchors or real-world depth occlusion is added.

## Code

- `src/app.js`: camera preview, permission/retry flow, automatic tracking and lifecycle.
- `src/experience-ui.js`: overview/detail panels, external links and sheet controls.
- `src/content.js`: the twelve supplied Leela hotspots, six overview actions and detail actions.
- `src/tracking-recovery.js`: object-specific camera guidance and placement between the active header and bottom sheet.
- `src/config.js`: unchanged detector profiles/search budgets, smoothing settings and four object-local anchor coordinates per target.
- `src/scene.js`: Three.js pose conversion, smoothing and projection into the camera viewport.
- `src/hotspots.js`: interactive pins, labels, gold leaders/bounds and responsive placement. Pins inherit the filtered object pose; text remains upright in screen space.
- `src/tracker.js`: singleton vendor core, cancellation and cleanup.
- `src/pose-filter.js`: adaptive One Euro position/quaternion filter and render interpolation.

Add `?debug=1` to see scanning phase, current model, label and score. Anchor positions and proxy bounds are reference locations in tracker units, not detected semantic keypoints or metres. Real-object alignment may need calibration. Older texture-card and branding assets remain unreferenced; they are not loaded by the active UI.

Three.js remains pinned to r136. The vendored WebAR.rocks.object version and its two existing profile-isolation corrections are recorded in `vendor/sources.json`. Third-party license notices remain included.

## Validation

Run `node tests/auto-tracker-check.cjs` for confirmation, scan budgets, retained-target loss/recovery, resume/Rescan behavior, profile changes and cleanup. `node tests/pose-filter-check.cjs` checks the existing pose smoother. Neither is a physical recognition benchmark.

Browser checks use a synthetic camera and injected recognition output to verify loader visibility through permission and playback startup, camera-ready introduction, automatic preview/stream reuse, the three target experiences, all twelve tappable hotspots, detail/back/label controls, sheet collapse/reopen, official-link destinations, delayed object-specific recovery guidance and unobscured controls, camera cleanup/restart and permission/error recovery. Responsive checks include mobile portrait, tablet, desktop and short landscape; safe-area and reduced-motion behavior are also checked. Real-object accuracy, camera calibration and native iOS browser chrome still require device testing.
