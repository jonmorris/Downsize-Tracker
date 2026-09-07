# Downsize Tracker

A phone-first tracker for everything you're selling, giving away, or throwing out.
Installs to your home screen, works offline, and keeps every byte of data on your
own device.

<!-- Warm Paper aesthetic · light + dark · React + Vite + IndexedDB -->

## What it does

**Dashboard** — compact enough to read at a glance, and free to scroll when it
needs to. Your money goal
with two overlapping bars on one track: yellow for where you'd land if
everything still on the shelf sold at your estimates, terracotta painted over
it for what you've actually banked. Then your item-count goal, a tile per state (not dealt with, listed,
sold, given away, thrown away, estimated value still on the shelf), and the few
highest-value things still in the house. Every tile is tappable and jumps to the
matching filter.

**Items** — search across names, notes, tags, categories and plans; filter by
status, plan, category and tag; sort by date, name or value. Each card carries
the one button that moves the item along: `List it` → `Sold` for things you're
selling, or a single `Given away` / `Thrown away` for everything else. Marking
something sold pops a sheet for the real sale price, which is what counts toward
your goal.

An entry can cover more than one thing: **How many** on the item form defaults
to 1, but setting it to 50 for "all my Pokémon cards" makes that single entry
count as 50 toward your item goal and the dashboard tiles, without 50 rows to
tick off. Values stay per-entry — the estimate and the sale price are for the
whole lot.

**Settings** — both goals, plus full management of *plans* (what you do with a
thing) and *categories*: add, rename, reorder, delete. Backup export/import, a
theme switch, and a reset.

### Item lifecycle

```
Sell:        To do  →  Listed  →  Sold        (asks for the actual price)
Give away:   To do  →  Given away
Throw away:  To do  →  Thrown away
```

`Listed` only appears on plans that have the *listed stage* switch turned on, so
custom plans decide for themselves.

## Getting it on your phone

1. **One-time setup**, both of which the workflow cannot do for you:
   - The repo must be **public**, unless you're on a paid GitHub plan — Pages
     is not available for private repos on the free plan, and the settings
     page hides the Source dropdown behind an upgrade prompt.
   - In **Settings → Pages**, set **Source** to **GitHub Actions**.
     `GITHUB_TOKEN` may deploy to an existing Pages site but not create one,
     so until this is set the deploy fails at *Configure Pages* even though
     the build passes.
2. Push to `main` (or any `claude/**` branch) — the workflow builds and deploys.
3. On your phone, open `https://<your-username>.github.io/Downsize-Tracker/`.
4. **iOS:** Share → *Add to Home Screen*. **Android:** menu → *Install app*.

After that it launches full-screen from its own icon and works with no signal.

Hosting somewhere else? Build with a different base path:

```bash
BASE_PATH=/ npm run build     # then serve dist/
```

## Running it locally

```bash
npm install
npm run dev        # http://localhost:5173/Downsize-Tracker/
npm run build      # typecheck + production build into dist/
npm run preview    # serve the production build
npm run icons      # regenerate the PWA icon set from scripts/gen-icons.mjs
```

## Where your data lives

In this browser's IndexedDB on this device. Nothing is uploaded, there is no
account, and no server ever sees it. The flip side: **clearing your browser data
deletes it**, and it does not follow you to a new phone. Use
**Settings → Export backup** now and then — it writes a single JSON file with
your items, goals, categories, plans and photos, and **Import backup** restores
it (replacing everything, or merging into what's there).

## Layout

```
src/
  db.ts            IndexedDB wrapper + first-run seeding
  store.tsx        app state, persistence, backup/restore
  stats.ts         dashboard numbers derived from items
  types.ts         Item, Method, Category, Settings, Filters
  defaults.ts      starting categories, plans, accent palette
  screens/         Dashboard, ItemsList, SettingsScreen, and the sheets
  components/      ItemCard, Sheet, Photo, Icons
  styles.css       the Warm Paper design tokens and every component style
scripts/
  gen-icons.mjs    renders the PNG icon set with no image dependencies
```
