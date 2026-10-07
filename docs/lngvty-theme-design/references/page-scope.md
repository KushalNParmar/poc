# Public website scope

Audit date: 7 October 2026. The [public sitemap](https://lngvty.in/sitemap.xml), navigation links, fetched source, and representative browser views define this inventory. There are **51 fetched URL variants**: 49 distinct paths plus blog pagination pages 2 and 3. This is public storefront coverage, not access to private account or merchant/admin screens.

## Page families

| Family | Routes | Distinct layout or behavior |
|---|---|---|
| Home | `/` | Responsive artwork, serum rail/grid, comparison slider, story, reels, reviews, chart, sticky shop bar |
| Collection | `/collections/frontpage`, `/collections/all` | Same observed custom three-product landing template |
| Serum detail | `/products/acne-blemish-control-serum-30ml`, `/products/dark-spots-pore-control-serum-30ml`, `/products/deep-hydration-glow-serum-30ml` | Shared custom template with unique media, claims, ingredients, reviews, sizes, and preorder state |
| Gift product | `/products/dust-bag-twill` | Fourth public product; template contains serum-oriented content |
| Story: problem | `/pages/tension` | Numbered chapters, routine loop, animated triangle diagram, editorial sections, next chapter |
| Story: cause | `/pages/truth` | Layered skin/system diagrams, source of concerns, renewal-cycle narrative |
| Story: solution | `/pages/relief` | Routine comparison, four principles, product/active mapping, cross-links |
| Story: evidence | `/pages/reason-to-believe` | Research narrative, five-step process, four-event timeline, limitations, product grid |
| Brand | `/pages/about` | Dark image hero, positioning, beliefs, founder profiles, final CTA |
| Science | `/pages/science` | Alternate long-form science page; system pillars, regenerative-process content and diagrams |
| FAQ | `/pages/faq` | Dark intro, categorized accordions, final product CTA |
| Quiz | `/pages/quiz` | Four questions, three possible results, back/retake, cart/product links |
| Contact | `/pages/contact` | Form with subject categories and optional order number |
| Media | `/pages/in-the-news` | Six press features with external article links |
| Blog index | `/blogs/skinmaxxing`, `?page=2`, `?page=3` | Three-column desktop grid, images, titles, dates, excerpts, pagination; 9/9/2 articles |
| Blog article | 20 paths below | Shared article template with hero, title/date/share, long-form body, tables, FAQ/product inserts, return link |
| Policies | `/policies/privacy-policy`, `/policies/shipping-policy`, `/policies/terms-of-service`, `/policies/refund-policy` | Long-form legal typography, thin rules, lists/tables |
| Acne campaign | `/pages/the-acne-serum-that-works` | Campaign hero, metrics, clinical media, buy panel, gift promotion, FAQ/science link |
| Routine campaign | `/pages/the-whole-routine` | Routine-replacement framing, results, purchase panel, gift, FAQ |
| Reasons campaign | `/pages/acne-5-reasons` | Heading actually says six reasons; swipe rail, product panel, landing-specific CSS/JS |
| Reward campaign | `/pages/reward-for-discipline` | Three-slide promotional hero, bundle purchase cards, timeline/proof/reviews/FAQ; header differs from standard pages |
| Reward terms | `/pages/reward-for-discipline-tnc` | Program-specific terms; campaign also links to a `view=reward-for-discilpine-tnc` variant, not separately captured |
| Account app | `/pages/kp-account` | GoKwik account app mount (`pdp.gokwik.co/kp-account/init.js`); authenticated states uninspected |
| Cart page | `/cart` | Public empty theme cart source; visible header cart trigger instead opens GoKwik overlay |

The customer-authentication redirect, checkout destinations, external press articles, social profiles, WhatsApp, and policy-linked third-party sites are boundaries or outbound destinations, not additional local marketing-page templates. Search scripts are present, but a customer-facing search entry was not observed in the inspected navigation; do not invent a search UI solely because Dawn includes its asset.

## Article paths

All paths are beneath `/blogs/skinmaxxing/`:

- `best-sunscreen-for-oily-skin-what-to-actually-look-for`
- `best-sunscreen-for-face-a-no-nonsense-buying-guide`
- `blackheads-removal-what-dermatology-actually-recommends`
- `why-your-pores-look-bigger-than-they-are-and-what-actually-closes-them`
- `vitamin-c-serum-for-face-what-it-actually-does`
- `best-serum-for-glowing-skin-separating-real-glow-from-filter-skin-marketing`
- `ceramide-moisturizer-why-your-barrier-needs-this-not-actives`
- `tan-removal-what-actually-works-vs-whats-folklore`
- `how-to-remove-dark-circles-what-works-and-whats-a-myth`
- `vitamin-c-serum-benefits-separating-evidence-from-hype`
- `serum-for-pigmentation-what-the-research-actually-shows-works`
- `melasma-treatment-why-its-different-from-regular-pigmentation`
- `whiteheads-removal-why-picking-makes-it-worse`
- `night-skincare-routine-what-order-actually-matters`
- `how-to-use-vitamin-c-serum-without-wasting-it`
- `how-to-choose-a-hydrating-serum-for-dehydrated-skin`
- `how-to-fade-dark-spots-left-after-acne`
- `routine-for-oily-but-dehydrated-acne-prone-skin`
- `salicylic-acid-causing-dryness-and-breakouts-what-to-do`
- `what-causes-uneven-skin-tone-and-facial-pigmentation`

## State inventory for implementation

| Surface | Required states | Audit evidence |
|---|---|---|
| Header/menu | Desktop, mobile closed/open, scrolled | Browser-verified |
| Product selection | Every size; selected image/price/compare-price; available, sold-out, preorder | Source plus acne 10ml interaction and hydrated preorder UI |
| Cart | Empty, populated, quantity/remove, gift thresholds, error, checkout entry | Empty live GoKwik overlay only; remaining states need sandbox inspection |
| Gallery | First/last/next/previous, size media swap, lightbox | Source plus size swap; remaining states require interaction QA |
| Comparison | 0%, 50%, 100%, drag/touch/keyboard | Source; initial UI observed |
| Rails | Initial, next, previous, swipe, disabled edge, progress | Source plus responsive visible layout |
| Product FAQ | Tab selection and open/closed questions | Source and visible tab controls |
| Quiz | Four steps, back, all three results, ties, retake | Source plus complete acne path |
| Reviews | Carousel, rating summary, sort, filter, pagination, media | Rendered widget and source; submission excluded |
| Forms/apps | Validation, local success/error, account/checkout handoff | Public source only for submissions/authenticated flows |

## Reference inconsistencies to retain as explicit decisions

- Hydration availability changes after the page initializes; distinguish initial source from final UI.
- Reward campaign says the offer was valid until **30 September 2026**, already past at audit time. A dated visual replica can preserve it, but should not activate a real reward program.
- `/pages/acne-5-reasons` displays six reasons despite the path name.
- The dust-bag template includes serum content. Exact snapshot parity and a product-correct redesign are different tasks; do not silently mix them.
- Similar claims and color accents vary by page. Preserve each page's observed treatment rather than rewriting them into a unified claim or palette.
