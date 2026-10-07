# LNGVTY POC 2

Keep this storefront in Liquid, HTML, CSS, and vanilla JavaScript. Do not introduce React or a component framework during fidelity changes.

Read `docs/lngvty-theme-design/SKILL.md` and its design/page references before changing layout. Original section markup, responsive breakpoints, source assets, and image crops are intentional. The homepage hero's lettering is baked into the artwork.

Keep all commerce, authentication, forms, reviews, and checkout local to this POC. Do not restore live GoKwik, Shopify mutation endpoints, analytics, pixels, or customer account scripts. Original-store variant IDs are fixture identifiers only.

Edit Liquid under `theme/`; never edit generated `dist/` files. `npm run build` regenerates output and fixture scripts. Run `npm test` for changes to routing, assets, or commerce. Use browser checks for changes to layout and interactions at 390 px and 1440 px.

The app widget replacements are isolated in `local-runtime.js`, `local-ui.js`, and `local-ui.css`. Keep their overrides scoped to local surfaces. Theme globals contain intentional `!important` typography rules.
