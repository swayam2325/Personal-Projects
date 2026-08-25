# 🥗 NutriScan — AI Calorie Tracker

Track calories by **photographing your plate** or **scanning a barcode**.
A modern, mobile-first web app — no build step, no account, no server.
Everything you log stays on your device.

### 👉 [Open the live app](https://swayam2325.github.io/Personal-Projects/)

On a phone, open that link and choose **Share → Add to Home Screen** (iOS) or
**Install app** (Android) to run it fullscreen like a native app.

## Features

- **🤖 AI meal scanning** — photograph a plate and the
  [Claude API](https://platform.claude.com/) vision model identifies each food,
  estimates portion weights from visual cues, and returns calories and macros.
  Every item shows a confidence level and stays editable before you log it.
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
- **🎯 Personalized goals** — onboarding collects height, weight, age, activity
  level, and goal, then computes daily calorie and protein targets with the
  Mifflin-St Jeor equation. Metric and imperial supported.
- **📊 Daily diary** — calorie progress ring against your goal, protein/carb/fat
  meters, per-day food log with photos, day-by-day navigation.
- **⚖️ Portion control** — enter grams directly or tap serving-size chips
  (½ / 1 / 2 servings); calories and macros update live before you add.
- **✏️ Quick add** — log homemade meals with just a name and calories.
- **👥 Profiles** — profile picker on launch; each person on the device gets
  their own goals and food log, switchable anytime from the avatar in the
  header.
- **🌙 Modern UI** — dark & light themes, bottom navigation, bottom-sheet
  product cards, mobile-first responsive layout.
- **🔒 Private** — your diary, weight, and goals live only in your browser's
  local storage. The API key is never written to storage: it's held in memory
  for the current visit only.

## Using AI meal scanning

Photo recognition calls the Claude API with your own key, so it needs one:

1. Create a key at [platform.claude.com](https://platform.claude.com/) → **API keys**
   (a few cents per scan; new accounts get free starting credit).
2. In the app, open **Scan → Meal photo**, take or upload a photo.
3. Paste the key when prompted. It is used for that visit only and never
   saved — let your browser's password manager remember it.

Barcode scanning, food search, and manual logging all work without a key.

### Try it without a camera

Type a barcode into the Scan tab's manual field, e.g.:

| Barcode | Product |
|---|---|
| `3017624010701` | Nutella |
| `5449000000996` | Coca-Cola |
| `7622210449283` | Prince chocolate biscuits |
| `0737628064502` | Thai Kitchen rice noodles |

## Running it locally (development)

The app is static — it only needs to be served over HTTP. Camera access
requires a secure context, which `localhost` satisfies:

```bash
cd calorie-tracker
python3 -m http.server 8080      # Windows: python -m http.server 8080
```

Then open <http://localhost:8080>. Note that a LAN address such as
`http://192.168.x.x:8080` will *not* get camera permission — use the
[hosted app](https://swayam2325.github.io/Personal-Projects/) on phones.

## Project structure

```
calorie-tracker/
├── index.html              # single page, all views
├── manifest.webmanifest    # PWA metadata for home-screen install
├── icon-180.png            # iOS home-screen icon
├── icon-512.png            # PWA icon
├── css/styles.css          # design tokens (light/dark) + components
└── js/
    ├── app.js              # views, diary rendering, sheets, wiring
    ├── api.js              # Open Food Facts lookup + search
    ├── vision.js           # Claude API meal-photo analysis
    ├── scanner.js          # camera + BarcodeDetector / ZXing fallback
    ├── foods.js            # built-in generic foods (USDA values)
    └── store.js            # localStorage: profiles, settings, per-day log
```

## Deployment

The live site is published from the `gh-pages` branch via GitHub Pages, which
serves the app at the repository root. Source lives in `calorie-tracker/` on
`main`.

## Data sources & licenses

- **[Open Food Facts](https://world.openfoodfacts.org)** — product data under
  the [ODbL](https://opendatacommons.org/licenses/odbl/); product images under
  CC-BY-SA. Please contribute back if you scan a product that's missing!
- **[USDA FoodData Central](https://fdc.nal.usda.gov/)** — public-domain
  nutrition values used for the built-in generic foods table.
- **[Claude API](https://platform.claude.com/)** — vision model used for
  meal-photo recognition. Photos are sent to Anthropic only when you scan.

> **Note:** AI portion estimates are approximations, not measurements. Review
> and adjust them before logging, and don't treat the numbers as medical or
> dietary advice.

## Roadmap ideas

- Weekly/monthly trends and charts
- Meal grouping (breakfast/lunch/dinner) and favorites
- Export/import so a diary can move between devices
- Offline caching via a service worker
