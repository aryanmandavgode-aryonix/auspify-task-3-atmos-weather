/* ============================================================
   ATMOS — ui.js
   Rendering only. All state arrives from app.js; all markup is
   built here. No network code lives in this file.
   ============================================================ */

'use strict';

import { icon, scene } from './icons.js';
import { describe, groupOf, iconKeyFor, tintFor } from './weather-codes.js';

/* ------------------------------------------------------------
   Small helpers
   ------------------------------------------------------------ */

const $ = (id) => document.getElementById(id);

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

const round = (n) => Math.round(Number(n) || 0);

/** Temperature for display in the active unit. */
export function tempInUnit(celsius, unit) {
  return unit === 'f' ? celsius * 9 / 5 + 32 : celsius;
}
const fmtDeg = (c, unit) => `${Math.round(tempInUnit(c, unit))}°`;

const CARDINALS = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
const cardinal = (deg) => CARDINALS[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];

function beaufort(kmh) {
  const t = [ [1,'Calm'], [6,'Light air'], [12,'Light breeze'], [20,'Gentle breeze'],
    [29,'Moderate breeze'], [39,'Fresh breeze'], [50,'Strong breeze'], [62,'Near gale'],
    [75,'Gale'], [89,'Strong gale'], [103,'Storm'] ];
  for (const [lim, label] of t) if (kmh < lim) return label;
  return 'Violent storm';
}

function uvCategory(v) {
  if (v == null) return '—';
  if (v < 3) return 'Low';
  if (v < 6) return 'Moderate';
  if (v < 8) return 'High';
  if (v < 11) return 'Very high';
  return 'Extreme';
}

function visibilityCategory(km) {
  if (km == null) return '—';
  if (km >= 20) return 'Excellent';
  if (km >= 10) return 'Very good';
  if (km >= 4) return 'Good';
  if (km >= 2) return 'Moderate';
  if (km >= 1) return 'Poor';
  return 'Very poor';
}

function pressureCategory(hpa) {
  if (hpa == null) return '—';
  if (hpa >= 1022) return 'High';
  if (hpa >= 1013) return 'Normal';
  if (hpa >= 1000) return 'Slightly low';
  return 'Low';
}

function cloudCategory(pct) {
  if (pct == null) return '—';
  if (pct < 10) return 'Clear';
  if (pct < 25) return 'Mostly clear';
  if (pct < 50) return 'Partly cloudy';
  if (pct < 85) return 'Mostly cloudy';
  return 'Overcast';
}

/** Magnus dew point (a=17.62, b=243.12). */
function dewPoint(t, rh) {
  if (t == null || rh == null || rh <= 0) return null;
  const a = (17.62 * t) / (243.12 + t) + Math.log(rh / 100);
  const dp = (243.12 * a) / (17.62 - a);
  return Number.isFinite(dp) ? dp : null;
}

/* ------------------------------------------------------------
   Hydration, chrome
   ------------------------------------------------------------ */

export function hydrateIcons(root = document) {
  root.querySelectorAll('[data-ic]').forEach((el) => {
    if (el.dataset.icDone) return;
    el.dataset.icDone = '1';
    el.innerHTML = icon(el.getAttribute('data-ic'), 'ic');
  });
}

export function setProgress(on) {
  $('header-progress')?.classList.toggle('active', !!on);
  document.body.classList.toggle('is-loading', !!on);
}

export function setThemeMeta(theme) {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.content = theme === 'light' ? '#F5F5F7' : '#101114';
  const btn = $('btn-theme');
  if (btn) btn.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
}

/* ------------------------------------------------------------
   Toasts
   ------------------------------------------------------------ */

export function showToast({ message, actionLabel, onAction, tone = 'info', ttl = 5200 }) {
  const rootEl = $('toast-root');
  if (!rootEl) return () => {};
  const node = document.createElement('div');
  node.className = `toast toast-${tone}`;
  node.innerHTML = `
    ${icon(tone === 'error' ? 'alert' : 'droplet', 'toast-ic')}
    <p class="toast-msg">${esc(message)}</p>
    ${actionLabel ? `<button type="button" class="toast-act">${esc(actionLabel)}</button>` : ''}
    <button type="button" class="toast-x" aria-label="Dismiss">${icon('x', 'ic')}</button>`;
  rootEl.appendChild(node);
  requestAnimationFrame(() => node.classList.add('in'));

  let gone = false;
  const dismiss = () => {
    if (gone) return;
    gone = true;
    node.classList.remove('in');
    setTimeout(() => node.remove(), 260);
  };
  if (ttl > 0) setTimeout(dismiss, ttl);
  node.querySelector('.toast-x')?.addEventListener('click', dismiss);
  node.querySelector('.toast-act')?.addEventListener('click', () => { dismiss(); onAction?.(); });
  return dismiss;
}

/* ------------------------------------------------------------
   Clock / place line
   ------------------------------------------------------------ */

function placeMinutes(tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(new Date());
    const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 0);
    const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
    return h * 60 + m;
  } catch {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  }
}

function clockLine(tz) {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: tz, weekday: 'long', day: 'numeric', month: 'long',
      hour: '2-digit', minute: '2-digit', hour12: false, timeZoneName: 'short',
    }).formatToParts(new Date());
    const get = (t) => parts.find((p) => p.type === t)?.value ?? '';
    return `${get('weekday')}, ${get('day')} ${get('month')} · ${get('hour')}:${get('minute')} ${get('timeZoneName')}`;
  } catch {
    return new Date().toDateString();
  }
}

export function renderClock(state) {
  const tz = state?.data?.timezone || state?.place?.timezone;
  const el = $('hero-clock');
  if (el && tz) el.textContent = clockLine(tz);
}

export function renderPlaceLine(state) {
  const place = state.place;
  const label = $('header-location-text');
  if (label) label.textContent = place?.name ?? '—';
}

/* ------------------------------------------------------------
   Hero
   ------------------------------------------------------------ */

export function renderHero(state) {
  const { place, data, unit } = state;
  const cur = data.current;
  const isDay = cur.is_day === 1;
  const code = cur.weather_code;
  const today = data.daily;

  $('hero-copy').innerHTML = `
    <p class="hero-kicker">${icon('pin', 'ic ic-sm')}<span>${esc(
      [place.country, place.admin1 && place.admin1 !== place.name ? place.admin1 : null]
        .filter(Boolean).join(' · ') || '—'
    )}</span></p>
    <h1 class="hero-city" id="hero-city">${esc(place.name)}</h1>
    <p class="hero-sub"><span id="hero-clock">${esc(clockLine(data.timezone || place.timezone))}</span></p>
    <div class="hero-figure">
      <div class="hero-temp">
        <span class="hero-temp-val">${Math.round(tempInUnit(cur.temperature_2m, unit))}</span>
        <span class="hero-temp-unit">°${unit === 'f' ? 'F' : 'C'}</span>
      </div>
      <p class="hero-condition">${esc(describe(code))}</p>
      <p class="hero-meta">
        <span>Feels like ${fmtDeg(cur.apparent_temperature, unit)}</span>
        <span class="meta-sep" aria-hidden="true"></span>
        <span class="hl"><b class="t-high">H ${fmtDeg(today.temperature_2m_max[0], unit)}</b><b class="t-low">L ${fmtDeg(today.temperature_2m_min[0], unit)}</b></span>
      </p>
    </div>`;

  // Weather-responsive scene + tint
  const g = groupOf(code);
  $('hero-scene').innerHTML = scene(g, isDay);
  const hero = $('hero');
  hero.dataset.tint = tintFor(code, isDay);

  const note = $('insights-note');
  if (note) note.textContent = `Measured ${(data.timezone ? clockLine(data.timezone) : '').split('· ').pop()?.trim() || ''}`;
}

export function renderHeroSkeleton() {
  const copy = $('hero-copy');
  if (!copy) return;
  copy.innerHTML = `
    <div class="skel skel-line w-32"></div>
    <div class="skel skel-line w-60"></div>
    <div class="skel skel-line w-48"></div>
    <div class="skel skel-temp"></div>
    <div class="skel skel-line w-40"></div>`;
  $('hero-scene').innerHTML = '';
  $('hero').dataset.tint = '';
}

export function renderHeroError(err, onRetry) {
  const copy = $('hero-copy');
  if (!copy) return;
  copy.innerHTML = `
    <div class="hero-error" role="alert">
      ${icon('alert', 'ic')}
      <h1 class="hero-error-title">Weather unavailable</h1>
      <p class="hero-error-msg">${esc(err?.message || 'Something went wrong.')}</p>
      <button type="button" class="btn" id="hero-retry">${icon('retry', 'ic')} Try again</button>
    </div>`;
  $('hero').dataset.tint = '';
  $('hero-retry')?.addEventListener('click', onRetry);
}

/* ------------------------------------------------------------
   Hourly — scroll strip with a smooth temperature curve.
   Layout is expressed from one set of constants so the SVG
   overlay and the flex cells can never drift apart.
   ------------------------------------------------------------ */

const H = {
  time: 16, gap1: 6, icon: 28, gap2: 12, curve: 64, gap3: 12, precip: 16, pad: 8,
};
const CELL_H = H.time + H.gap1 + H.icon + H.gap2 + H.curve + H.gap3 + H.precip + H.pad;
const CURVE_TOP = H.time + H.gap1 + H.icon + H.gap2; // y of curve zone start
const BAND_TOP = CURVE_TOP + 10;
const BAND_BOTTOM = CURVE_TOP + 58;
const MIN_LABEL_GAP = 20;

function cellWidth() {
  return window.innerWidth < 768 ? 64 : 68;
}

/** Push neighbouring labels apart, then clamp into the band. */
function relax(ys) {
  for (let pass = 0; pass < 2; pass++) {
    for (let i = 1; i < ys.length; i++) {
      if (Math.abs(ys[i] - ys[i - 1]) < MIN_LABEL_GAP) {
        ys[i] = ys[i] >= ys[i - 1] ? ys[i - 1] + MIN_LABEL_GAP : ys[i - 1] - MIN_LABEL_GAP;
      }
    }
    for (let i = ys.length - 2; i >= 0; i--) {
      if (Math.abs(ys[i] - ys[i + 1]) < MIN_LABEL_GAP) {
        ys[i] = ys[i] <= ys[i + 1] ? ys[i + 1] - MIN_LABEL_GAP : ys[i + 1] + MIN_LABEL_GAP;
      }
    }
  }
  return ys.map((y) => Math.min(BAND_BOTTOM, Math.max(BAND_TOP, y)));
}

/** Catmull-Rom -> cubic beziers through all points. */
function smoothPath(pts) {
  if (pts.length < 2) return '';
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const p0 = pts[Math.max(i - 2, 0)];
    const p1 = pts[i - 1];
    const p2 = pts[i];
    const p3 = pts[Math.min(i + 1, pts.length - 1)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0]} ${p2[1]}`;
  }
  return d;
}

/** Slice 24 hours starting at the current hour. */
export function hourSlice(data) {
  const times = data.hourly.time;
  const curHour = `${data.current.time.slice(0, 13)}:00`;
  let idx = times.findIndex((t) => t >= curHour);
  if (idx < 0) idx = 0;
  const end = Math.min(idx + 24, times.length);
  const out = [];
  for (let i = idx; i < end; i++) {
    out.push({
      time: times[i].slice(11, 16),
      temp: data.hourly.temperature_2m?.[i] ?? 0,
      code: data.hourly.weather_code?.[i] ?? 3,
      isDay: data.hourly.is_day?.[i] === 1,
      pop: data.hourly.precipitation_probability?.[i] ?? 0,
    });
  }
  return out;
}

export function renderHourly(state) {
  const { data, unit } = state;
  const hours = hourSlice(data);
  const CELL = cellWidth();
  const wrap = $('hourly-wrap');
  if (!wrap) return;

  const temps = hours.map((h) => tempInUnit(h.temp, unit));
  const lo = Math.min(...temps);
  const hi = Math.max(...temps);
  const span = hi - lo || 1;

  let ys = temps.map((t) => BAND_BOTTOM - ((t - lo) / span) * (BAND_BOTTOM - BAND_TOP));
  ys = relax(ys);

  const cells = hours
    .map((h, i) => {
      const now = i === 0;
      const pop = h.pop > 0 ? Math.round(h.pop) : 0;
      return `
      <div class="hc${now ? ' is-now' : ''}">
        <span class="hc-time">${now ? 'Now' : esc(h.time)}</span>
        <span class="hc-icon">${icon(iconKeyFor(h.code, h.isDay))}</span>
        <span class="hc-curve"></span>
        <span class="hc-precip">${pop ? `${icon('droplet', 'ic-xs')} ${pop}%` : '&nbsp;'}</span>
      </div>`;
    })
    .join('');

  const pts = ys.map((y, i) => [i * CELL + CELL / 2, Math.round(y)]);
  const labels = pts
    .map((p, i) => `<text x="${p[0]}" y="${p[1]}" class="hc-temp${i === 0 ? ' is-now' : ''}">${Math.round(temps[i])}°</text>`)
    .join('');
  const nowDot = `<circle cx="${pts[0][0]}" cy="${pts[0][1]}" r="3.2" class="hc-dot"/>`;

  wrap.innerHTML = `
    <div class="panel hourly-panel">
      <div class="hourly-scroll" tabindex="0" role="region" aria-label="Hourly forecast for the next 24 hours, scroll horizontally">
        <div class="hourly-track" style="height:${CELL_H}px">
          ${cells}
          <svg class="hourly-curve" aria-hidden="true" width="${hours.length * CELL}" height="${CELL_H}" style="left:0;top:0">
            <path class="hc-path" d="${smoothPath(pts)}"/>
            ${nowDot}
            ${labels}
          </svg>
        </div>
      </div>
    </div>`;
}

export function renderHourlySkeleton() {
  const wrap = $('hourly-wrap');
  if (!wrap) return;
  const blocks = Array.from({ length: 10 }, () => '<div class="hc-skel"></div>').join('');
  wrap.innerHTML = `<div class="panel hourly-panel"><div class="hourly-scroll">${blocks}</div></div>`;
}

/* ------------------------------------------------------------
   Daily — seven-day outlook with range bars
   ------------------------------------------------------------ */

export function renderDaily(state) {
  const { data, unit } = state;
  const d = data.daily;
  const n = d.time.length;
  const lows = [], highs = [];
  for (let i = 0; i < n; i++) {
    lows.push(tempInUnit(d.temperature_2m_min[i], unit));
    highs.push(tempInUnit(d.temperature_2m_max[i], unit));
  }
  const weekLo = Math.min(...lows);
  const weekHi = Math.max(...highs);
  const weekSpan = weekHi - weekLo || 1;

  const rows = [];
  for (let i = 0; i < n; i++) {
    const dt = new Date(
      Number(d.time[i].slice(0, 4)), Number(d.time[i].slice(5, 7)) - 1, Number(d.time[i].slice(8, 10))
    );
    const dayName = i === 0 ? 'Today' : dt.toLocaleDateString('en-GB', { weekday: 'short' });
    const dateStr = dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const left = ((lows[i] - weekLo) / weekSpan) * 100;
    const width = Math.max(((highs[i] - lows[i]) / weekSpan) * 100, 4);
    const pop = d.precipitation_probability_max?.[i] ?? 0;
    const popPct = pop > 0 ? Math.round(pop) : 0;
    rows.push(`
      <li class="daily-row${i === 0 ? ' is-today' : ''}">
        <span class="d-day">${dayName}</span>
        <span class="d-date">${dateStr}</span>
        <span class="d-ic">${icon(iconKeyFor(d.weather_code[i], true))}</span>
        <span class="d-cond">${esc(describe(d.weather_code[i]))}</span>
        <span class="d-precip">${popPct ? `${icon('droplet', 'ic-xs')} ${popPct}%` : ''}</span>
        <span class="d-low">${Math.round(lows[i])}°</span>
        <span class="d-bar"><span class="d-bar-fill" style="left:${left.toFixed(1)}%;width:${width.toFixed(1)}%"></span></span>
        <span class="d-high">${Math.round(highs[i])}°</span>
      </li>`);
  }

  $('daily-wrap').innerHTML = `<div class="panel"><ul class="daily-list">${rows.join('')}</ul></div>`;
}

export function renderDailySkeleton() {
  const rows = Array.from({ length: 7 }, () => '<li class="daily-row daily-skel"></li>').join('');
  $('daily-wrap').innerHTML = `<div class="panel"><ul class="daily-list">${rows}</ul></div>`;
}

/* ------------------------------------------------------------
   Insights — one composed instrument panel
   ------------------------------------------------------------ */

function windDial(bearing) {
  const ticks = [];
  for (let a = 30; a < 360; a += 30) {
    if (a % 90 === 0) continue;
    const r1 = 47, r2 = 52;
    const rad = (a * Math.PI) / 180;
    ticks.push(
      `<line x1="${(70 + r1 * Math.sin(rad)).toFixed(1)}" y1="${(70 - r1 * Math.cos(rad)).toFixed(1)}" x2="${(70 + r2 * Math.sin(rad)).toFixed(1)}" y2="${(70 - r2 * Math.cos(rad)).toFixed(1)}"/>`
    );
  }
  return `<svg class="dial" viewBox="0 0 140 140" aria-hidden="true" focusable="false">
    <circle cx="70" cy="70" r="53" class="dial-ring"/>
    <g class="dial-ticks">${ticks.join('')}</g>
    <text x="70" y="34" class="dial-card">N</text>
    <text x="111" y="74" class="dial-card">E</text>
    <text x="70" y="117" class="dial-card">S</text>
    <text x="29" y="74" class="dial-card">W</text>
    <g class="dial-needle" transform="rotate(${round(bearing)} 70 70)">
      <path d="M70 24l7.5 15h-15z" class="dial-head"/>
      <path d="M70 39v23" class="dial-tail"/>
    </g>
    <circle cx="70" cy="70" r="5.5" class="dial-hub"/>
  </svg>`;
}

function uvGauge(v) {
  const f = Math.min(Math.max(v ?? 0, 0), 11) / 11;
  const end = 180 - f * 180;
  const rad = (end * Math.PI) / 180;
  const px = 80 + 60 * Math.cos(rad);
  const py = 84 - 60 * Math.sin(rad);
  return `<svg class="gauge" viewBox="0 0 160 104" aria-hidden="true" focusable="false">
    <path class="gauge-track" d="M20 84A60 60 0 0 1 140 84"/>
    ${f > 0.01 ? `<path class="gauge-val" d="M20 84A60 60 0 0 1 ${px.toFixed(1)} ${py.toFixed(1)}"/>` : ''}
    <circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="4" class="gauge-dot"/>
    <text x="20" y="100" class="gauge-cap">0</text>
    <text x="140" y="100" class="gauge-cap">11+</text>
  </svg>`;
}

function sunArc(sunrise, sunset, tz) {
  const sr = sunrise.slice(11, 16);
  const ss = sunset.slice(11, 16);
  const toMin = (s) => Number(s.slice(0, 2)) * 60 + Number(s.slice(3, 5));
  const srM = toMin(sr), ssM = toMin(ss);
  const nowM = placeMinutes(tz);
  const dayLen = ssM - srM;

  let u = null;
  let note = 'Sun below horizon';
  if (nowM >= srM && nowM <= ssM) {
    u = dayLen > 0 ? (nowM - srM) / dayLen : 0;
    const h = Math.floor(dayLen / 60), m = dayLen % 60;
    note = `Daylight ${h}h ${m}m`;
  }
  const ux = u == null ? null : 30 + 200 * u;
  const uy = u == null ? null : 96 - 304 * u * (1 - u);
  const splitCtrl = u == null ? null : [30 + 100 * u, 96 - 152 * u];

  return `<svg class="sunarc" viewBox="0 0 260 118" aria-hidden="true" focusable="false">
    <path class="arc-horizon" d="M10 96h240"/>
    <path class="arc-track" d="M30 96Q130 -56 230 96"/>
    ${u != null ? `<path class="arc-val" d="M30 96Q${splitCtrl[0].toFixed(1)} ${splitCtrl[1].toFixed(1)} ${ux.toFixed(1)} ${uy.toFixed(1)}"/>` : ''}
    ${u != null ? `<circle cx="${ux.toFixed(1)}" cy="${uy.toFixed(1)}" r="6" class="arc-sun"/>` : ''}
    <text x="30" y="112" class="arc-cap">${esc(sr)}</text>
    <text x="130" y="112" class="arc-note">${esc(note)}</text>
    <text x="230" y="112" class="arc-cap" text-anchor="end">${esc(ss)}</text>
  </svg>`;
}

export function renderInsights(state) {
  const { data, unit } = state;
  const cur = data.current;
  const hourlyIdx = data.hourly.time.indexOf(`${data.current.time.slice(0, 13)}:00`);
  const visKm = data.hourly.visibility?.[hourlyIdx] ?? null;
  const uvVal = data.hourly.uv_index?.[hourlyIdx] ?? null;
  const dp = dewPoint(cur.temperature_2m, cur.relative_humidity_2m);
  const tz = data.timezone;
  const pres = cur.pressure_msl;

  const gaugePos = Math.min(Math.max(((pres ?? 1013) - 980) / 70, 0), 1) * 100;

  const grid = $('insights-grid');
  grid.innerHTML = `
    <section class="mod mod-wind" aria-label="Wind">
      <h3 class="mod-label"><span class="mod-idx">01</span>Wind</h3>
      <div class="mod-body">
        <div class="stat">
          <p class="stat-main"><span class="stat-big">${round(cur.wind_speed_10m)}</span><span class="stat-unit">km/h</span></p>
          <p class="stat-sub">${beaufort(cur.wind_speed_10m)} · from the ${cardinal(cur.wind_direction_10m)}</p>
          <p class="stat-note">Gusts ${round(cur.wind_gusts_10m)} km/h · bearing ${round(cur.wind_direction_10m)}°</p>
        </div>
        ${windDial(cur.wind_direction_10m)}
      </div>
    </section>

    <section class="mod mod-uv" aria-label="UV index">
      <h3 class="mod-label"><span class="mod-idx">02</span>UV index</h3>
      <div class="mod-body">
        <div class="stat">
          <p class="stat-main"><span class="stat-big">${uvVal == null ? '—' : Math.round(uvVal * 10) / 10}</span><span class="stat-unit">${uvCategory(uvVal)}</span></p>
          <p class="stat-note">Max today ${data.daily.uv_index_max?.[0] ?? '—'} · ${uvCategory(data.daily.uv_index_max?.[0])}</p>
        </div>
        ${uvGauge(uvVal)}
      </div>
    </section>

    <section class="mod mod-hum" aria-label="Humidity">
      <h3 class="mod-label"><span class="mod-idx">03</span>Humidity</h3>
      <div class="mod-body">
        <div class="stat">
          <p class="stat-main"><span class="stat-big">${round(cur.relative_humidity_2m)}</span><span class="stat-unit">%</span></p>
          <p class="stat-sub">${dp == null ? '' : `Dew point ${fmtDeg(dp, unit)}`}</p>
        </div>
        <div class="meter"><span style="width:${Math.min(Math.max(cur.relative_humidity_2m, 0), 100)}%"></span></div>
      </div>
    </section>

    <section class="mod mod-sun" aria-label="Sunrise and sunset">
      <h3 class="mod-label"><span class="mod-idx">04</span>Sun</h3>
      <div class="mod-body mod-body-sun">
        ${sunArc(data.daily.sunrise[0], data.daily.sunset[0], tz)}
        <div class="sun-times">
          <span>${icon('sunrise', 'ic')} ${esc(data.daily.sunrise[0].slice(11, 16))}</span>
          <span>${icon('sunset', 'ic')} ${esc(data.daily.sunset[0].slice(11, 16))}</span>
        </div>
      </div>
    </section>

    <section class="mod mod-pre" aria-label="Pressure">
      <h3 class="mod-label"><span class="mod-idx">05</span>Pressure</h3>
      <div class="mod-body">
        <div class="stat">
          <p class="stat-main"><span class="stat-big">${pres == null ? '—' : round(pres).toLocaleString('en-US')}</span><span class="stat-unit">hPa</span></p>
          <p class="stat-sub">${pressureCategory(pres)} · sea level</p>
        </div>
        <div class="meter"><span style="left:${gaugePos.toFixed(1)}%"></span></div>
      </div>
    </section>

    <section class="mod mod-vis" aria-label="Visibility">
      <h3 class="mod-label"><span class="mod-idx">06</span>Visibility</h3>
      <div class="mod-body">
        <div class="stat">
          <p class="stat-main"><span class="stat-big">${visKm == null ? '—' : visKm >= 10 ? round(visKm) : Math.round(visKm * 10) / 10}</span><span class="stat-unit">km</span></p>
          <p class="stat-sub">${visibilityCategory(visKm)} · at the current hour</p>
        </div>
      </div>
    </section>

    <section class="mod mod-clo" aria-label="Cloud cover">
      <h3 class="mod-label"><span class="mod-idx">07</span>Cloud cover</h3>
      <div class="mod-body">
        <div class="stat">
          <p class="stat-main"><span class="stat-big">${cur.cloud_cover == null ? '—' : round(cur.cloud_cover)}</span><span class="stat-unit">%</span></p>
          <p class="stat-sub">${cloudCategory(cur.cloud_cover)}</p>
        </div>
        <div class="meter"><span style="width:${Math.min(Math.max(cur.cloud_cover ?? 0, 0), 100)}%"></span></div>
      </div>
    </section>`;
}

export function renderInsightsSkeleton() {
  const grid = $('insights-grid');
  grid.innerHTML = Array.from({ length: 7 }, () => '<div class="mod-skel"></div>').join('');
}

/* ------------------------------------------------------------
   Search popover states
   ------------------------------------------------------------ */

export function renderSearchRecents(recents, onPick) {
  const body = $('search-body');
  if (!recents.length) {
    body.innerHTML = `
      <div class="sr-state">
        ${icon('search', 'ic')}
        <p>Search for any city — try “Tokyo” or “Paris”.</p>
      </div>`;
    return;
  }
  body.innerHTML = `
    <p class="sr-caption">Recent</p>
    <ul id="sr-list" class="recents" role="listbox" aria-label="Recent locations">
      ${recents.map((r, i) => `
        <li role="option" id="opt-${i}" class="sr-opt" data-idx="${i}">
          ${icon('pin', 'ic')}
          <span class="sr-main">${esc(r.name)}</span>
          <span class="sr-sub">${esc([r.admin1, r.country].filter(Boolean).join(' · '))}</span>
        </li>`).join('')}
    </ul>`;
}

export function renderSearchResults(query, results) {
  const body = $('search-body');
  if (!results.length) {
    body.innerHTML = `
      <div class="sr-state">
        ${icon('search', 'ic')}
        <p>No cities found for “${esc(query)}”.</p>
        <p class="sr-hint">Try a different spelling or a larger nearby city.</p>
      </div>`;
    return;
  }
  body.innerHTML = `
    <ul id="sr-list" class="results" role="listbox" aria-label="Matching cities">
      ${results.map((r, i) => `
        <li role="option" id="opt-${i}" class="sr-opt${i === 0 ? ' active' : ''}" aria-selected="${i === 0}" data-idx="${i}">
          <span class="sr-main">${esc(r.name)}</span>
          <span class="sr-sub">${esc([r.admin1, r.country].filter(Boolean).join(' · '))}</span>
          ${icon('chevron', 'ic ic-dim')}
        </li>`).join('')}
    </ul>`;
}

export function renderSearchLoading() {
  $('search-body').innerHTML = `
    <div class="sr-state">
      <span class="spinner" aria-hidden="true"></span>
      <p>Searching…</p>
    </div>`;
}

export function renderSearchError(msg) {
  $('search-body').innerHTML = `
    <div class="sr-state" role="alert">
      ${icon('alert', 'ic')}
      <p>${esc(msg)}</p>
    </div>`;
}

/** Move the active option; supports wrapping. */
export function moveActive(dir, listEl, inputEl) {
  const opts = listEl ? [...listEl.querySelectorAll('[role="option"]')] : [];
  if (!opts.length) return -1;
  let idx = opts.findIndex((o) => o.classList.contains('active'));
  idx = dir === 'next' ? (idx + 1) % opts.length : (idx - 1 + opts.length) % opts.length;
  setActive(idx, listEl, inputEl);
  return idx;
}

export function setActive(idx, listEl, inputEl) {
  const opts = listEl ? [...listEl.querySelectorAll('[role="option"]')] : [];
  opts.forEach((o, i) => {
    const on = i === idx;
    o.classList.toggle('active', on);
    o.setAttribute('aria-selected', on ? 'true' : 'false');
    if (on) o.scrollIntoView({ block: 'nearest' });
  });
  if (inputEl && opts[idx]) inputEl.setAttribute('aria-activedescendant', opts[idx].id);
}

export const searchListEl = () => document.getElementById('sr-list');
