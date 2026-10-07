# LNGVTY — POC 2

A local replica of the public **lngvty.in** storefront audited on 7 October 2026. Built with **Liquid, HTML, CSS, and vanilla JavaScript**, matching the storefront's customized Shopify Dawn 15.4.1 architecture. The reference's jQuery 3.7.1 and Slick 1.8.1 presentation dependencies are included locally. No React is used.

## Run

Use Node.js 20.18.1 or newer.

```sh
npm ci
npm start
```

Open **http://127.0.0.1:8765**. To use another port: `PORT=3000 npm start`.

Keep that terminal running. Stop the server with **Ctrl+C**. If the port is already occupied by a running POC, open its URL, stop the previous server, or choose another port with the command above.

`npm run build` renders the Liquid templates into `dist/`. `npm test` runs the cart, rendering, navigation, asset, and script checks. Restart the server after changing the route manifest; rebuild and refresh after changing a Liquid file. CSS and JavaScript changes require a browser refresh.

## Included

- All **51 audited public URL variants**: home; both collection views; all four products; the four story chapters; About, FAQ, Science, Contact, and press; all campaigns and reward terms; the blog with three pagination views and all 20 articles; four policies; cart; account.
- Local checkout and 404 views, plus Skin Analysis, bringing the rendered total to **54**.
- Original public section markup, CSS, copy, SVG diagrams, image crops, desktop/mobile hero artwork, motion, media, and variant controls.
- Product galleries, comparison sliders, image lightboxes, accordions, FAQ tabs, horizontal rails, customer videos, mobile navigation, and sticky purchase bars.
- The original four-question quiz, its three recommendations, back/retake behavior, and ties resolved in acne → dark spots → hydration order.
- Browser-local cart with every catalog variant, quantity changes, removal, exact paise arithmetic, persistence, free gift above the reference threshold, and simulated checkout.
- Mock OTP login, account/order history, contact submission, review sorting/filtering/pagination/photo previews, and local review submission.

## Demo controls

- Login: enter any valid-format 10-digit Indian mobile number, then **123456**. No OTP is sent.
- Discount: **LOCAL10** simulates a 10% discount. It is a demo code, not a merchant offer.
- Checkout: enter sample details. **Place demo order** creates only a local browser record; it never takes payment or creates a real order/shipment. Addresses and checkout contact details are not persisted.
- **My account → Reset demo data** clears this POC's cart, orders, session, and local reviews.
- Forms report local success. Review submissions stay in the browser. The floating contact control leads to the local contact page.

## Source structure

```text
theme/
  layout/theme.liquid      Shared document and local runtime
  templates/               One composition for each public URL view
  sections/                Shared shell and individual reference sections
  assets/                  Section CSS/JS, local app adapters, media, vendor assets
data/
  routes.json              Route/template map and titles
  catalog.json             Ten local variant fixtures and prices
  reviews.json             55 public reviews present in the audited product HTML
  asset-manifest.json      Original public URLs for direct reference assets
scripts/
  build.mjs                LiquidJS rendering
  serve.mjs                Local HTTP server, route aliases, media range requests
tests/storefront.test.mjs  Automated verification
docs/                     Audit skill and implementation/QA notes
```

The templates reconstruct the public rendered theme; the merchant's private Liquid source, settings, and app internals were unavailable. **LiquidJS is the local renderer**, while Node is only the development server/build runner. This project is a standalone POC, not an authenticated Shopify store or an importable Shopify theme package. It deliberately contains no production Shopify/GoKwik credentials, checkout integration, or live merchant writes.

The merchant's app widgets are recreated locally: their unaudited authenticated/checkout states cannot be claimed as exact copies. The homepage keeps its public 66-review aggregate; the local review corpus contains the 55 reviews included in the captured public product source. Static marketing pages preserve the reference's dated content, including the 15 October hydration preorder and expired 30 September reward campaign. The dust bag also retains the reference's unusual shared serum template.

Storefront presentation assets are local. The Skin Analysis page embeds the official GlamAR SDK; its script, frame and service requests are allowed only on that page. Other pages block remote scripts and frames. Public external press/social links remain outbound navigation links. Product statements are preserved reference copy.

## Previous POC

The previous WebAR implementation was removed from this folder after a verified archive was made. Its Git history remains intact. The accompanying implementation report identifies the recoverable archive and original Git revision.

## Skin Analysis — GlamAR Web SDK

The navigation link remains between The Story and About. The skin-analysis page uses the storefront's own photography, Avenir typography, cream/black sections, square controls and understated copy. Extra vendor branding has been removed from the merchant UI; the SDK's built-in attribution is untouched.

The homepage initializes the official SDK with face/light model preloading in an offscreen, inert container. Home-to-skin navigation keeps the same frame connected. The **Analyse my skin** button only reveals that existing container. It does not initialize, restart, or call any SDK method (including `skinAnalysis('start')`); preparation, camera permissions, capture and the report remain native SDK screens. No camera method runs during preload. Other storefront routes and new-tab clicks retain normal navigation.

**Recommendations require no login.** The result and recommendation events are independent and can arrive in either order. The SDK product tab and the merchant recommendations button open the same recommendations. Capturing a new scan clears the prior in-memory recommendations. No scan photos or scores are persisted.

The local demo matching rule considers concern scores below 75 (a storefront merchandising threshold, not a clinical cutoff), with the lowest matching score first. Acne/whiteheads/blackheads map to Acne, Blemish Control; pores/pigmentation/post-acne marks map to Dark Spots, Pore Control; hydration maps to Deep Hydration, Glow. It does not assign unrelated serums to eye concerns or wrinkles. Recommendations show relevant LNGVTY matches alongside SDK products, using the original collection header, card markup, promotional images and stylesheet. Each card shows 10ml, 30ml and 30+30ml size buttons. LNGVTY size selections independently update the catalogue variant, price, Add to cart and Buy now actions. Third-party size buttons are visual demo controls only: their SDK product identity and price remain unchanged. Selections persist when returning from the report and reset for a new scan. There is no routine view, login gate, role label, AM/PM tag or matching explanation on the cards. Exact local SKUs in SDK recommendations use the local catalogue. SDK-returned products preserve their actual names, images, prices and currency; alternatives remain available. A clear product type in its name takes precedence over a conflicting supplied category. No third-party products are invented when the SDK returns none.

SDK recommendation fields supported: `product_list` (including a `data` wrapper), `sku`, `brand`, `title`, `img`, `product_url`, `category`/`type`, `concern`/`target_concern`, `selling_price`/`mrp`/`price`, `currency`, `am_pm`. Product prices arrive in major currency units and are normalized to minor units. Only HTTPS external links/images are rendered. Unknown prices stay unavailable; currencies are never guessed or converted.

Both local and external INR-priced recommendations can enter the existing **mock cart**. External cart items use a `sdk:` namespace and persist only validated public product metadata alongside cart lines. They never place an order with another merchant. Non-INR or unpriced items link to the supplied product page instead of corrupting INR cart totals. Remote product images are permitted by the image policy; remote scripts, transactions and analytics remain blocked apart from the official SDK on the home/skin routes.

The server exposes only the configured app ID and SDK access key through `/api/skin-analysis/sdk-config`. The SDK access key is client-visible by design; the platform API token is unused. Set the local origins in the app's Allowed Domains and publish. Native SDK appearance and watermark are controlled by the app's SDK configuration. Closing or leaving a scan unregisters callbacks and removes the SDK frame.

References: https://www.glamar.io/docs/integrations/skin-analysis/sdk/web/api/ and https://www.glamar.io/docs/integrations/skin-analysis/events/

## Vercel deployment

The repository uses Vercel’s Build Output API. `vercel.json` runs `npm ci` and `npm run vercel-build`; the latter renders Liquid pages, copies storefront assets, and packages `/api/skin-analysis/sdk-config` as a Node.js function. `npm start` remains the local server command. No React or Shopify backend is introduced.

The Vercel project should link to `KushalNParmar/poc`, use production branch `main`, and use the repository root (blank Root Directory, not a folder named `poc2`). The local folder name is not part of the Git tree. The checked-in configuration sets Framework Preset to Other and overrides the build/output settings. If the existing project has an Ignored Build Step or automatic production deployments disabled, adjust those settings so new commits deploy. Confirm `lngvty.vercel.app` is attached to this project's current production deployment.

Add `GLAMAR_APP_ID` and `GLAMAR_ACCESS_KEY` to the project's Production environment variables (and Preview if previews need scanning), using the existing SDK values from your local `.env`. The platform API token is not used. Environment files are not committed or copied to the deployment output. Set the SDK's allowed website origin to the deployed domain if the vendor configuration requires it.

Run `npm run vercel-build` to inspect `.vercel/output` locally, then commit and push the source changes. Check Vercel's latest deployment for the pushed commit and a Ready status. This packaging does not itself publish or change a Vercel project. HTML and mutable scripts revalidate after deployment; page aliases, blog pagination, the campaign query, 404s, and camera policies match the local server.

### Files kept out of Git

The local `.env`, dependencies, `dist`, `.vercel`, reference screenshots, and generated catalogue/review JavaScript are ignored. `data/catalog.json` and `data/reviews.json` are the tracked sources; both local and Vercel builds regenerate their browser scripts. Reference screenshots remain on the original workstation for design checks but are not needed for the deployed storefront. Required product images and storefront videos stay tracked so a fresh checkout can build without missing media. Untracking files does not rewrite previous commits.
