# Avilair — Premium Footwear Website

A complete, working e-commerce website built from your supplied Avilair product photography and logo. No build step required — it's a static site (HTML/CSS/JS).

## How to open it

**Just double-click `index.html`.** It works straight away — no installation needed.

To host it live, upload the whole `avilair-site` folder as-is to any static host (your own server, Netlify, Vercel, GitHub Pages, cPanel, etc.) — `index.html` is the entry point.

## What's inside

```
index.html          → the whole site (single page app)
css/style.css        → all styling
js/products-data.js  → the product catalogue (edit this to change products/prices)
js/app.js             → all site behaviour (cart, wishlist, filters, sliders, modals)
assets/brand/ → your logo (logo.jpg original; logo-header.png header badge; logo-lockup.png footer; favicon.png)
assets/banners/       → 4 generated hero-banner + category-card images (collages made from your real product photos)
assets/products/      → your product photos, organised and optimised for web, per product per colour
```

## What was built from your images

Your four uploaded folders contained **612 product photos across 90 colour/SKU folders**. I grouped these into **30 real, distinct products** (by article/mould, not by invented styles), each with its true photographed colour variants — so nothing was fabricated to hit a round number:

| Category (renamed based on what the photos actually show) | Source folder | Products | Colourways |
|---|---|---|---|
| **Block Heel Mules** (patent mules/sliders) | `Avilair` zip | 12 | 21 |
| **Heeled Sandals** (buckle ankle-strap block heels) | `Ethnic_Collection` zip | 8 | 33 |
| **Flat Sandals** (embellished flat slides/toe-rings) | `Buckle_Heels_Sandals` zip | 9 | 27 |
| **Kids Knit Slip-Ons** | kids zip | 1 | 9 |
| **Total** | | **30** | **90** |

⚠️ **Important — the two middle zip files were mislabelled.** `Ethnic_Collection.zip` actually contains buckle block-heel party sandals, and `Buckle_Heels_Sandals.zip` actually contains flat embellished/ethnic slides. I categorised everything by what's visually in the photos, not by the folder names, and renamed the on-site categories accordingly. Worth double-checking against your own SKU sheet.

## Things you should replace before launch (all clearly placeholder)

- **Prices** — every price is a reasonable placeholder, generated within category price bands. Edit `js/products-data.js` → each product's `"price"` field.
- **Product names** — "Avilair Riva", "Avilair Elle" etc. are placeholder first names I assigned per SKU. Swap in your real names/style codes.
- **Colour names** — for the Avilair-branded folders (e.g. "501 BEIGE"), I used the real supplied colour name. For the others, colour names were auto-detected from the image's dominant colour (a script, not a person, matched pixel colour to the nearest common colour name) — a few are approximate (e.g. one deep-red pair was tagged "Mauve"). Worth a manual pass over `js/products-data.js` if colour accuracy matters for search/filtering.
- **Contact / shipping / returns / privacy / terms** — footer links open placeholder text explicitly saying "add your real policy here." No fake claims, reviews, ratings or history were invented anywhere, per your brief.
- **Checkout** — "Checkout" is a placeholder message; no payment gateway is wired up (as instructed).

## Features included

Hero slider (4 category banners built from your real photos, auto-advance, swipe, arrows, dots) · category grid · new arrivals carousel · full shop grid with search, sort, and filters (category/price/size/colour) · product cards with hover image swap, wishlist heart, quick view · product detail modal with gallery, colour/size selection, accordion (details/shipping/returns), related products · cart drawer and wishlist drawer (persisted via browser localStorage) · fully responsive (mobile nav drawer, filter drawer, swipeable gallery) · basic SEO (title, meta description, alt text).

## Known limitations / next steps

- Auto-detected colour names are approximate for the two non-Avilair-branded collections (see above).
- No backend — cart/wishlist are saved in the visitor's own browser only (no shared database, no order emails). Fine for a demo/preview; you'll want a real backend + payment gateway before taking live orders.
- Google Fonts (Playfair Display, Inter) are loaded from Google's CDN — needs an internet connection to show the exact typefaces; falls back to system serif/sans-serif otherwise.
