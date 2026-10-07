# LNGVTY design reference

Observed on 7 October 2026 at [lngvty.in](https://lngvty.in/), using public HTML/CSS/JS and rendered desktop/mobile browser views. Values below describe the observed website, not an invented replacement design system. The screenshots show viewport layouts; full-page captures may contain unrevealed or lazy content. Public source remains useful for those sections.

## Visual language

Clinical skincare presented through restrained editorial layouts: ample blank space, warm cream grounds, near-black story panels, macro skin photography, amber glass bottles, thin rules, oversized light headings, and small widely spaced labels. Theme cards and buttons are rectangular and mostly flat. Keep deliberate dark/light section transitions and line wrapping; avoid a generic rounded-card ecommerce redesign.

## Color tokens

| Role | Observed value | Application |
|---|---|---|
| Main ink | `#181818` | Text, dark surfaces, quiz result |
| Deep black | `#0B0B0B`, `#111111`, `#12100D` | Footer, sticky bar, product UI; section-specific |
| Cream | `#FFFEF3` | Product backgrounds, clinical sections, text on dark |
| White | `#FFFFFF` | Header, homepage product section, contact/blog |
| Copper | `#B87330` | Labels and selected purchase CTAs |
| Acne accent | `#7DC04C` | Product markers, result statistics, active accents |
| Hydration accent | `#00A86B` | Product identity; some section accents differ |
| Dark-spot accent | `#E67E22` | Product identity; some rendered CTAs use copper |
| Muted ink | `rgba(24,24,24,.66/.72/.45)` | Body hierarchy and metadata |
| Muted white | `rgba(255,255,255,.52/.32)` | Secondary dark-section text |
| Dividers | Typically ink at 6–14% alpha | Form fields, lists, section separation |

Do not force every black, green, or cream to one value. Custom sections carry their own variables. The quiz question surface uses a near-white `#FFFEFF`. GoKwik's visible cart uses a cool light-gray ground and copper rounded actions, unlike the theme.

## Typography

Main computed stack: `"Avenir Next", Avenir, "Century Gothic", "Trebuchet MS", sans-serif`. A `Courier New` mono token exists for selective data labels. Adobe kit `yoj5qwp` loads `avenir-lt-pro`, but the principal computed CSS stack does not name that family. Pixel matching across operating systems requires verifying the font actually rendered and arranging the correct webfont delivery if needed; a font-family declaration alone does not guarantee identical glyph metrics.

| Element | Observed rules |
|---|---|
| Global H1 | `clamp(52px,8vw,112px)`, weight 400, line-height .9, tracking -3.5px |
| Global H2 | `clamp(40px,5vw,68px)`, weight 400, line-height .95 |
| Mobile H2 | 34px at max-width 767px from global override |
| H3 | `clamp(32px,3.8vw,48px)`, weight 500, line-height 1.05, tracking -1.5px |
| H4 | `clamp(22px,2.4vw,30px)`, weight 300, line-height 1.12 |
| Paragraph/list | `clamp(15px,1.4vw,17px)`, weight 400, line-height 1.7 |
| Eyebrow | 11–13px, uppercase, tracking .2em, often copper |
| Theme buttons | Avenir stack, weight 500, tracking .06em, zero radius |
| Footer headings | 11px, regular weight |

Section rules override globals. At 1440px, homepage major headings computed to 68px; the product title is intentionally much smaller and bold. Product H1 uses weight 700, line-height 1.02, tracking -.045em; its mobile rule is `clamp(30px,9vw,44px)`. Do not apply the 112px editorial H1 to the product title. Inline emphasis sometimes uses gray italic words, especially About and FAQ.

## Shared shell

- Black announcement strip, about 39px in the observed desktop/mobile views, with centered small tracked text.
- White header, about 64px, retained while scrolling. Desktop: narrow wordmark left; three central navigation items; quiz link, black shop button, GoKwik account icon, and outline bag at right.
- At the Dawn navigation breakpoint around 990px, replace the desktop menu with the hamburger. Mobile keeps the centered wordmark and two right icons.
- Mobile menu fills the remaining viewport with a white panel. Three main links at top, quiz/login/social links near bottom, and X replacing the menu icon.
- Desktop main shell commonly has 50px side gutters at 1440px. Product mobile uses about 20px. Other sections use their own clamps (often 22px to 80px) and cannot be normalized without comparison.
- Main dark footer has an oversized animated outline/fill wordmark above footer content, brand caption, three colored dots, socials, three link groups, payment logos, copyright, and policy links. Mobile stacks the link groups.
- A floating green WhatsApp button sits at lower right. It can overlap a sticky action in the reference; do not mistake that app overlay for theme spacing.

## Homepage: section sequence and behavior

1. Responsive linked hero artwork, full width and automatic aspect ratio. Desktop image is `regenerative_serum_homepage_banner.jpg` (intrinsic 1188×450); mobile switches at 767px to `India_s_1_regenerative_serum_1.webp`. The image contains the headline and shop graphic.
2. Three serum cards in a white section. Desktop: three equal columns, 24px gaps, square image slots, aligned rows, claim above image, title, three size controls, then a dividing rule and price/action row. Default size order here is **30 / 10 / 30+30 ml**. Hover crossfades to a second image with subtle scaling. Active size has an accent top rule and very pale fill.
3. Mobile product cards become a horizontal snap rail: 14px gap; each card `clamp(236px,78vw,344px)`, next item visibly peeking. This is not a three-card vertical stack.
4. Cream clinical comparison with large heading, edge-to-edge before/after image clipping and a movable divider/range control. Initial comparison position is 50%.
5. Dark four-part story rail: numbered eyebrow, portrait 4:5 image, title, body, underlined arrow link, progress segments. Mobile card basis approximately 78%; desktop has arrow controls.
6. Dark customer video rail: portrait 9:16 media, active tile emphasis, muted neighbors, count/progress controls. Preserve poster, playback, mute, swipe, and modal behavior after dedicated interaction QA; not all playback states were exercised in this audit.
7. Judge.me review carousel with rating/count and image/text reviews.
8. Light conceptual comparison chart and paired shop/quiz links; SVG chart lines and labels, not a screenshot standing in for the entire section.
9. Closing wordmark and footer. A separate fixed black shop strip sits at the viewport bottom, with cream action and small accent arrow. Its label shortens on narrow screens.

## Collection

`/collections/frontpage` and observed `/collections/all` render the same custom landing template. Cream ground, centered explanatory heading, three promotional product images, small concern label with colored dot, size buttons in **10 / 30 / 30+30 ml** order, price, cart/buy actions, and details link. Selected size is filled black. Follow with four numbered benefits and a concluding CTA. Collection purchase styling is different from homepage cards: outline add-to-cart plus copper buy-now.

## Product pages

Desktop upper panel is two columns: large left gallery and right purchase details. Mobile stacks gallery before details. Gallery contains arrows, slide counter, and size-dependent product media. The acne gallery showed six slides. The product title, benefit line, stars/count, size buttons, price, cart/buy actions, three trust icons, ingredient disclosure, and usage disclosure must stay in their observed hierarchy.

Mobile uses a full-width dark cart button followed by a text-like buy-now action. A separate bottom purchase rail appears after scrolling. Desktop purchase actions sit side by side.

Below the hero: product-specific clinical comparison; receipt-style multi-product cost comparison; photographic gallery/lightbox; benefit image rail; ingredient reveal rail; grouped FAQ tabs; Judge.me review widget; cross-sell cards; footer. Do not flatten these into one text column.

Verified: selecting acne 10ml changes the selected control, image, quantity label, and price to ₹499. The usage disclosure expands into a four-step list. The FAQ has distinct concern, skin-type, formula, and shipping groups. Review controls and lightbox states need final implementation testing.

Snapshot prices (see JSON for identifiers and media):

| Product | 10ml | 30ml | 30+30ml |
|---|---:|---:|---:|
| Acne | ₹499 | ₹1,049 | ₹1,888.20 |
| Dark spots | ₹549 | ₹1,199 | ₹2,158.20 |
| Hydration | ₹499 | ₹1,049 | ₹1,888.20 |

Hydration renders **preorder / ships from 15 October** after client initialization. Initial HTML can say sold out. Preserve the resolved state for the dated baseline. The fourth product, Dust Bag Twill, is ₹499 and unexpectedly reuses serum content in its public template; log this reference inconsistency rather than silently redesigning it.

## Editorial pages and quiz

The four story pages share a dark numbered chapter navigation, photographic hero, large outline chapter number, animated heading, and alternating image/diagram/editorial sections. They have different diagrams and content sequences; use the route map. About has a black photographic hero, italic emphasis, beliefs, two founder profiles, and CTA. FAQ uses a dark intro and centered cream accordion list. Contact is a restrained white form with name/email, optional order number, subject select, message, and submit action.

The quiz starts directly at question 1. Four steps each contain four response buttons, a 2px progress indicator, small step count, a light question with italic phrase, and back control after the first step. Answers receive a selected dark fill and auto-advance after 240ms. Each answer increments one of `acne`, `dark`, or `hyd`; highest score wins. Ties resolve by the source key order **acne → dark → hyd**. Result is a dark full-width split panel with product-accent title/stat, supporting text, image with outlined numeral background, price/action, retake control, and two alternative products. Retake clears answers. One complete acne-result path was browser-verified; all branches were read in public source.

## Motion and breakpoints

Observed motion is CSS/vanilla JS: IntersectionObserver reveals, translate/fade, SVG line drawing, scroll snapping, image crossfades, and progress updates. Homepage card reveal: .8s with `cubic-bezier(.22,.61,.36,1)` and stagger. Image opacity: .55s; transform: .9s with `cubic-bezier(.19,1,.22,1)`. Footer outline draw: 2.2s, then fill fade 1.1s after 1.5s. Respect existing reduced-motion alternatives.

There is no single universal breakpoint: Dawn 750/990px; hero image 767px; global small headings 767px; quiz 768px; custom rails/diagrams include 600/720/760/860/980/1024px. The route inventory lists observed media queries. Reproduce each component's actual change rather than applying a single framework breakpoint everywhere.

## Integration and coverage boundaries

Browser-verified families: homepage desktop/mobile, collection desktop, acne product desktop/mobile and size/disclosure state, all four story hero views, About, FAQ, Contact, blog index and one article, quiz questions/result, mobile menu, empty GoKwik cart, acne campaign mobile, reward campaign mobile. Other routes have public source inspection and inventory coverage. Desktop screenshots use 1440×1000; mobile references use 390×844, except the cropped cart detail. Screenshot captures are evidence, not a completed visual acceptance suite.

GoKwik live cart supersedes the dormant Dawn drawer. Account/customer details are session-specific and excluded from the reference package. Populated cart, login OTP, shipping selection, checkout/payment, contact submission, review submission, reward enrollment, every video/lightbox state, and physical-device behavior were not exercised. No transaction or message was sent.
