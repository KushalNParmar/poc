# LNGVTY → POC 2 replication plan

**Status: planning complete; website implementation has not started.** No files in `/Users/kushalparmar/poc2` were created, edited, moved, or removed during this audit.

## Verified technology and proposed choice

The source of [lngvty.in](https://lngvty.in/) exposes this theme metadata:

- Theme name: `Lngvty X GoKwik Theme: Blog page edits`
- Schema: **Dawn 15.4.1**
- Theme ID: `164128161907`; theme store ID: `887`
- Core rendering: Shopify theme structure with Liquid-generated HTML, CSS, and JavaScript.
- Client behavior: vanilla JavaScript/custom elements plus **jQuery 3.7.1 / Slick Carousel 1.8.1**.
- Integrations: **GoKwik** cart/account/purchase surfaces, **Judge.me** reviews, Shopify-hosted assets, Adobe font kit.

This is strong evidence of a customized traditional Shopify theme. No evidence identified a React/Hydrogen application as the main storefront. Third-party widgets may use React internally, so “there is no React anywhere” would be too broad.

Shopify has multiple frontend approaches. Its [theme architecture](https://shopify.dev/docs/storefronts/themes/architecture) uses Liquid with HTML/CSS/JavaScript; its [Hydrogen stack](https://shopify.dev/docs/storefronts/headless/hydrogen/fundamentals) uses React Router. React is therefore an option, not a requirement for Shopify stores.

**Recommended for the user's “same tech” requirement: a Shopify Liquid theme in POC 2**, using Dawn 15.4.1 as the compatibility baseline and recreating the custom sections. Do not select React/Next.js/Hydrogen by default.

| Execution mode | What matches | Additional requirement |
|---|---|---|
| Shopify theme — full stack parity | Liquid/JSON templates, theme CSS/JS, Shopify catalog/cart runtime, app integration | Development-store access, destination catalog, app configuration, Shopify CLI |
| Standalone local POC | Rendered HTML/CSS, vanilla JS behavior, media and responsive appearance | Local fixtures and simulated cart/account/checkout; does not reproduce Shopify's server runtime |

The execution-mode question was left open for the user during the audit. The plan is ready for either mode; it must be resolved before scaffolding. A local Liquid renderer alone is not a complete substitute for Shopify objects, filters, section rendering, checkout, and apps.

The original server-side Liquid files, template JSON, theme settings/metafields, and private app configuration are not exposed by the public website. An owner-provided theme export would reduce reconstruction work; without one, this is a measured recreation from the rendered source and observed UI. The [Shopify CLI](https://shopify.dev/docs/storefronts/themes/tools/cli) supports theme development, while Shopify's [Ajax Cart API](https://shopify.dev/docs/api/ajax/reference/cart) provides cart operations inside a Shopify storefront.

## Target and later reset

Discovered folder: `/Users/kushalparmar/poc2`.

Audit baseline: Git working tree clean; HEAD `5c0802b9423ceddafa331a92ec0f70004fbf431d`. Existing application is The Leela WebAR demo: root HTML/CSS, `src/`, `assets/`, `tests/`, and vendored Three.js/WebAR/Lottie code. These are unrelated to the requested storefront.

When the user starts implementation:

1. Recheck the exact path, Git status, branch, and untracked/ignored files. Later edits may have occurred since this audit.
2. Create a recoverable snapshot/archive outside POC 2, including any local work absent from Git.
3. Remove all old application content in POC 2, including obsolete models, scripts, tests, assets, vendor files, and old documentation. Preserve `.git` repository history. Rewrite project metadata for the new project.
4. Build the selected storefront structure in this folder. Do not modify the separate `/Users/kushalparmar/poc` repository or neighboring projects.

The initial removal request is recorded here as a later build step because the same request explicitly said **plan only**.

## Build sequence

### 1. Freeze the reference and establish assets

Use the 7 October inventory as the dated baseline, with a quick live recheck before implementation. Map all 49 public paths and the two blog pagination variants. Select each correct image, hover image, variant image, mobile art, poster, and video source from the media inventory. Obtain the actual assets and consistent font delivery before layout tuning. Keep original dimensions and crops.

If a theme export becomes available, map its sections to the audit rather than replacing custom sections with generic Dawn equivalents. Product content and variant IDs must belong to the destination store.

### 2. Create the shell and shared foundations

For Shopify: `layout/theme.liquid`, JSON templates, section groups, sections, snippets, assets, config, and locales. Node/Shopify CLI may serve as development tooling; they do not imply a React frontend.

For a standalone POC: server-rendered/static pages with shared HTML templates/partials, CSS tokens, native JavaScript modules, fixture data, and local commerce adapters. Preserve the observed URL paths, including deep links and pagination.

First establish typography, colors, spacing, header, mobile drawer, footer, wordmark animation, sticky action bars, and overlay stacking. Match the reference before continuing.

### 3. Build the shopping journey

Homepage → collection → three serum pages → variant selection → cart → purchase handoff. Add the dust-bag product route. Preserve each template's separate purchase styling and ordering. Implement the hydration preorder override and product-specific data. In local mode, simulate cart/gift/checkout state without connecting to the reference merchant.

### 4. Build editorial, quiz, and campaign templates

Four distinct story chapters, About, Science, FAQ, Contact, Media, all campaigns and reward terms. Implement the four-question scoring flow and all result states. Retain campaign-specific shells and media rather than reusing the homepage layout.

### 5. Complete publishing content and integration surfaces

Blog listing with 9/9/2 pagination, all 20 article routes, four policies, cart page, account entry, and outbound links. Configure Judge.me/GoKwik only against a destination development environment if full integration parity is selected. Otherwise use representative local states and explicitly document simulated behavior.

### 6. Verify fidelity and interactions

Compare each template with the reference at matching viewport dimensions, selected variant, cart state, scroll position, font availability, and settled animation state. Trigger lazy assets before screenshots. Prioritize 390px mobile and 1440px desktop; check 375/430/768/1024px for wrapping and breakpoint behavior.

Test real behavior: route/deep-link navigation, all variants/prices/images, cart totals and quantity/remove, sold-out/preorder, quiz branches and tie resolution, comparison drag/keyboard, accordions and FAQ tabs, gallery/lightbox, rails/swipe/progress, videos, sticky controls, contact validation, article pagination, and reduced motion. Check actual mobile hardware for safe areas, touch, and media playback.

## Acceptance criteria

- Every inventoried local route has its correct page family and content structure; no placeholder links or missing campaign/article templates.
- Fonts, line breaks, spacing, image crops, backgrounds, header/footer, and selected states match side-by-side reference captures at the agreed widths.
- Horizontal rails remain rails on mobile; purchase actions and typography adapt as observed.
- User actions update the correct local/destination product state; original merchant identifiers do not trigger production mutations.
- Any unresolved media, authenticated app states, or simulated services are listed explicitly. A matched homepage alone is not “entire website” completion.
- POC 2 contains the storefront only; the old WebAR application has been removed from the application tree, with a recoverable prior snapshot outside it.

## Remaining inputs for implementation

Execution mode is the only architectural decision still open. Full Shopify mode additionally needs a destination development store and app access. Exact source reuse needs an owner-provided theme export; it is useful but not required to begin a public-reference reconstruction. Populated cart, OTP/account, checkout, and app-specific edge states require a later sandbox inspection. None of those limitations prevents planning or building the independently specified pages.
