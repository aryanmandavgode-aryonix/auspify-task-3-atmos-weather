# ATMOS

**Weather, in perspective.**

ATMOS is a modern weather forecasting experience that makes understanding weather
conditions intuitive, beautiful and effortless. It is built with plain HTML5, CSS3
and vanilla JavaScript on top of the free Open-Meteo APIs — no frameworks, no build
step, no API keys.

> Task 3 — Auspify Technologies Web Development Internship.

---

## Features

- **Live conditions** — temperature, feels-like, humidity, wind (speed, direction,
  gusts), precipitation, cloud cover, pressure, visibility and UV index, all from
  the Open-Meteo Forecast API. Nothing is hardcoded; no sample data is ever shown
  as live weather.
- **Hero experience** — city, country, live local clock (ticking in the location's
  own timezone), a large editorial temperature figure, condition, feels-like and
  today's high/low.
- **City search** — real geocoding with debounced requests, keyboard navigation
  (arrows / Enter / Escape), loading and empty states, in-memory response cache and
  a short list of recent locations.
- **Browser geolocation** — on first visit, with graceful fallback to New Delhi and
  best-effort reverse geocoding (BigDataCloud) to resolve the place name. Permission
  is never re-prompted on later visits (last location is remembered).
- **Hourly forecast (24 h)** — horizontal scroll strip with day/night-aware icons,
  precipitation probability and a smooth temperature curve whose labels are
  collision-relaxed so they never overlap. The current hour is highlighted.
- **Seven-day outlook** — condition, icon, precipitation chance and a temperature
  range bar whose position and width are computed from the week's minimum/maximum.
- **Atmospheric detail** — a composed instrument panel: wind compass, UV arc gauge,
  humidity with computed dew point (Magnus formula), sunrise/sunset dome with the
  sun's current position and daylight length, pressure, visibility and cloud cover.
- **Celsius / Fahrenheit** — one toggle converts the hero, feels-like, hourly curve
  and daily highs/lows (and the dew point). The preference is remembered.
- **Light / dark themes** — charcoal first, daylight second; respects
  `prefers-color-scheme` on first visit, applies before first paint (no flash) and
  is remembered.
- **Resilience** — typed error states for network failure, timeouts, HTTP errors,
  empty payloads and geolocation denial, with retry actions; offline/online
  detection; skeleton loading states; `prefers-reduced-motion` is respected.
- **Weather-responsive art direction** — the hero illustration and a faint
  atmospheric tint adapt to the current condition group and day/night.

## Technology

- HTML5, CSS3 (custom properties, grid, `color-mix`, masking), vanilla JavaScript
  (ES modules).
- Inter via Google Fonts, with a system-font fallback stack.
- Open-Meteo Forecast API, Open-Meteo Geocoding API, BigDataCloud reverse geocoding
  (keyless, CORS-enabled).

## Project structure

```text
index.html
README.md
package.json
manifest.webmanifest
css/
  style.css
  responsive.css
js/
  app.js
  api.js
  ui.js
  icons.js
  weather-codes.js
assets/
  icons/
    favicon.svg
    icon-192.png
    icon-512.png
  images/
    atmos-clouds.jpg
```

The project has **zero runtime dependencies** — `package.json` exists for metadata
and the optional local server convenience script. No build step, no bundler, no
frameworks.

## Running locally

The app uses ES modules, so it must be served over HTTP (opening `index.html`
directly from disk will not work in most browsers). Any static server is fine:

```bash
# Option A — npm / bun (uses package.json; runs optional npx serve)
npm start          # or: bun run start
# On first use, this may download the `serve` package automatically.

# Option B — Python
python3 -m http.server 8000

# Option C — VS Code “Live Server” extension
```

Then open the URL the server prints (e.g. `http://localhost:8000`). The
`npm start` command is an optional convenience wrapper around `npx serve`, which
may fetch `serve` the first time you run it; Python's HTTP server is also
supported.

## APIs

| Purpose | Endpoint | Notes |
| --- | --- | --- |
| Forecast | `https://api.open-meteo.com/v1/forecast` | `timezone=auto`, `forecast_days=7` |
| Geocoding | `https://geocoding-api.open-meteo.com/v1/search` | `count=8`, `language=en` |
| Reverse geocoding | `https://api.bigdatacloud.net/data/reverse-geocode-client` | keyless, best-effort |

Requested variables:

- **current** — `temperature_2m, apparent_temperature, relative_humidity_2m, is_day,
  precipitation, weather_code, cloud_cover, pressure_msl, wind_speed_10m,
  wind_direction_10m, wind_gusts_10m`
- **hourly** — `temperature_2m, apparent_temperature, precipitation_probability,
  weather_code, relative_humidity_2m, visibility, uv_index, is_day`
- **daily** — `weather_code, temperature_2m_max, temperature_2m_min, sunrise,
  sunset, uv_index_max, precipitation_probability_max`

## Design system

- **Palette** — charcoal `#101114`, surface `#191B20`, primary text `#F5F5F7`,
  secondary text `#A1A1AA`, muted atmospheric blue accent, hairline neutral borders.
  The daylight theme inverts to `#F5F5F7 / #FFFFFF` with deeper accent tones.
- **Type** — Inter; the hero figure is weight 200 at up to ~164 px with tabular
  numerals; section labels are 12 px uppercase with wide tracking.
- **Signature details** — a hand-constructed SVG icon language (every arc is
  geometrically verified), condition-tinted hero glow, monoline scene illustrations
  on a 440×320 plate, and instrument-style modules (compass, arc gauges, dome)
  instead of repeated cards.

## Accessibility

- Semantic landmarks (`header`, `main`, `footer`, `section`), one `h1` per view.
- Combobox/listbox pattern for search with `aria-activedescendant`.
- Keyboard support throughout (Escape, arrows, Enter, focus return, focus trap on
  the mobile sheet); visible focus rings; skip link.
- `aria-live` toasts, `role="alert"` for fatal errors, decorative art is
  `aria-hidden`.

## Testing performed

- Default city (New Delhi) — verified.
- City search & selection (Tokyo, Paris, Reykjavik) — verified.
- Invalid search (“asdkjh”) — empty state shown, no request spam.
- °C/°F toggle — hero, curve labels, daily rows and dew point convert correctly
  (spot-checked against manual conversion).
- Geolocation flow (grant / deny / unsupported) — verified.
- Hourly strip — 24 hours from the current hour, current hour highlighted, curve
  aligned with cells at both width buckets.
- Seven-day rows — bars positioned from the weekly min/max.
- Theme toggle — both themes, no flash on reload, meta theme-color updated.
- Mobile navigation & search sheet at 360–430 px — verified, no horizontal overflow.
- API error handling — simulated offline and malformed payloads; retry works.
- Console — clean (no errors, no stray logs).
- Browsers — Chromium and Firefox engines.

## Limitations

- Wind is always shown in km/h and visibility in km, regardless of the temperature
  unit (a deliberate simplification).
- UV index and visibility are hourly variables; the panel shows the current hour's
  value.
- Reverse geocoding depends on a third-party free service; if it is unreachable the
  location is simply labelled “Current location”.
- The forecast does not auto-refresh in the background (a deliberate choice to
  avoid unnecessary network traffic); it refreshes on any interaction.

## Credits

- Forecast and geocoding data — [Open-Meteo](https://open-meteo.com) (CC-BY 4.0).
- Reverse geocoding — [BigDataCloud](https://www.bigdatacloud.com).
- Typeface — Inter by Rasmus Andersson.
- Built as Task 3 of the Auspify Technologies Web Development Internship.
