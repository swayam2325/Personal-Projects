# 🥗 NutriScan — Camera Calorie Tracker

Track calories for any food by **scanning its barcode with your camera**.
A modern, mobile-first web app — no build step, no account, no server.
Everything you log stays on your device.

## Features

- **📷 Camera barcode scanner** — point your camera at any packaged food's
  barcode (EAN-13, EAN-8, UPC-A, UPC-E, Code 128). Uses the native
  `BarcodeDetector` API on Chrome/Edge/Android and falls back to
  [ZXing](https://github.com/zxing-js/browser) on Safari/Firefox.
  Manual barcode entry is also available.
- **🌍 Reliable food data** — product names, calories, macros, and photos come
  from [Open Food Facts](https://world.openfoodfacts.org), an open database of
  2.8M+ products (ODbL license, free API, no key needed).
- **🔎 Food search** — full-text search across Open Food Facts, plus a built-in
  offline table of ~75 common generic foods (apple, rice, chicken breast, …)
  with USDA FoodData Central values.
- **📊 Daily diary** — calorie progress ring against your goal, protein/carb/fat
  meters, per-day food log with photos, day-by-day navigation.
- **⚖️ Portion control** — enter grams directly or tap serving-size chips
  (½ / 1 / 2 servings); calories and macros update live before you add.
- **✏️ Quick add** — log homemade meals with just a name and calories.
- **🌙 Modern UI** — dark & light themes, bottom navigation, bottom-sheet
  product cards, mobile-first responsive layout.
- **🔒 Private** — all data lives in your browser's localStorage.

## Run it

The app is static — it just needs to be served over HTTP (camera access
requires `localhost` or HTTPS):

```bash
cd calorie-tracker
python3 -m http.server 8080
# or: npx serve .
```

Then open <http://localhost:8080>.

> **Testing on your phone:** the camera only works in a secure context, so
> `http://<your-laptop-ip>:8080` won't get camera permission. Either deploy the
> folder to any static host (GitHub Pages, Netlify, Vercel — it's just files),
> or tunnel with `npx ngrok http 8080`. Manual barcode entry and search work
> regardless.

### Try it without a camera

Type a barcode into the Scan tab's manual field, e.g.:

| Barcode | Product |
|---|---|
| `3017624010701` | Nutella |
| `5449000000996` | Coca-Cola |
| `7622210449283` | Prince chocolate biscuits |
| `0737628064502` | Thai Kitchen rice noodles |

## Project structure

```
calorie-tracker/
├── index.html          # single page, all views
├── css/styles.css      # design tokens (light/dark) + components
└── js/
    ├── app.js          # views, diary rendering, product sheet, wiring
    ├── api.js          # Open Food Facts lookup + search (normalizes data)
    ├── scanner.js      # camera + BarcodeDetector / ZXing fallback
    ├── foods.js        # built-in generic foods (USDA values)
    └── store.js        # localStorage: settings + per-day log
```

## Data sources & licenses

- **[Open Food Facts](https://world.openfoodfacts.org)** — product data under
  the [ODbL](https://opendatacommons.org/licenses/odbl/); product images under
  CC-BY-SA. Please contribute back if you scan a product that's missing!
- **[USDA FoodData Central](https://fdc.nal.usda.gov/)** — public-domain
  nutrition values used for the built-in generic foods table.

## Roadmap ideas

- Photo-based food recognition (AI vision) for unpackaged meals
- Weekly/monthly trends and charts
- Meal grouping (breakfast/lunch/dinner) and favorites
- Export/import data, PWA install + offline caching
