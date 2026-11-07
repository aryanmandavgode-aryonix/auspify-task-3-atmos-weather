/* ============================================================
   ATMOS — app.js
   Orchestration: state, preferences, geolocation, search
   controller, unit + theme switching, resilience.
   ============================================================ */

'use strict';

import { getForecast, searchCities, reverseGeocode, AppError } from './api.js';
import * as ui from './ui.js';

/* ------------------------------------------------------------
   Constants & state
   ------------------------------------------------------------ */

const DEFAULT_PLACE = {
  name: 'New Delhi',
  admin1: 'Delhi',
  country: 'India',
  latitude: 28.6139,
  longitude: 77.209,
  timezone: 'Asia/Kolkata',
};

const LS = {
  theme: 'atmos:theme',
  unit: 'atmos:unit',
  place: 'atmos:place',
  recents: 'atmos:recents',
};

const state = {
  place: null,          // active place
  pendingPlace: null,   // place currently being fetched
  data: null,           // last successful forecast
  unit: 'c',
  theme: 'dark',
  recents: [],
  lastQuery: '',
  bootResolved: false,  // first successful load happened
  lastAttemptFailed: false,
};

const searchState = {
  open: false,
  timer: 0,
  cache: new Map(),
  results: [],
};

let clockTimer = 0;

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const read = (k, fallback) => {
  try { const v = localStorage.getItem(k); return v == null ? fallback : v; }
  catch { return fallback; }
};
const write = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };
const readJSON = (k, fallback) => {
  try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};

/* ------------------------------------------------------------
   Data loading
   ------------------------------------------------------------ */

async function loadWeather(place) {
  state.pendingPlace = place;
  state.lastAttemptFailed = false;
  ui.setProgress(true);
  try {
    const data = await getForecast(place.latitude, place.longitude);
    state.place = place;
    state.data = data;
    state.bootResolved = true;
    persistPlace(place);
    renderEverything();
  } catch (err) {
    state.lastAttemptFailed = true;
    if (state.data) {
      // Keep previous content visible; surface a recoverable toast.
      ui.showToast({
        message: err?.message || 'Could not refresh conditions.',
        actionLabel: 'Retry',
        onAction: () => loadWeather(place),
        tone: 'error',
        ttl: 8000,
      });
    } else {
      ui.renderHeroError(err, () => loadWeather(place));
      hideSections(true);
    }
  } finally {
    ui.setProgress(false);
    state.pendingPlace = null;
  }
}

function renderEverything() {
  hideSections(false);
  ui.renderPlaceLine(state);
  ui.renderHero(state);
  ui.renderHourly(state);
  ui.renderDaily(state);
  ui.renderInsights(state);
  startClock();
}

function hideSections(hide) {
  for (const id of ['section-hourly', 'section-daily', 'section-insights']) {
    document.getElementById(id)?.classList.toggle('is-hidden', hide);
  }
}

function startClock() {
  clearInterval(clockTimer);
  ui.renderClock(state);
  clockTimer = setInterval(() => ui.renderClock(state), 30000);
}

function persistPlace(place) {
  if (!place.name || /current location/i.test(place.name)) return;
  write(LS.place, JSON.stringify({
    name: place.name, admin1: place.admin1 || '', country: place.country || '',
    latitude: place.latitude, longitude: place.longitude, timezone: place.timezone || '',
  }));
}

function pushRecent(place) {
  if (!place.name || /current location/i.test(place.name)) return;
  const key = (p) => `${(p.latitude ?? 0).toFixed(2)},${(p.longitude ?? 0).toFixed(2)}`;
  state.recents = state.recents.filter((r) => key(r) !== key(place));
  state.recents.unshift({
    name: place.name, admin1: place.admin1 || '', country: place.country || '',
    latitude: place.latitude, longitude: place.longitude, timezone: place.timezone || '',
  });
  state.recents = state.recents.slice(0, 4);
  write(LS.recents, JSON.stringify(state.recents));
}

/* ------------------------------------------------------------
   Geolocation
   ------------------------------------------------------------ */

function geolocate({ manual = false } = {}) {
  if (!('geolocation' in navigator)) {
    if (manual) ui.showToast({ message: 'Geolocation is not supported by this browser. Search for your city instead.', tone: 'info' });
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 8000, maximumAge: 600000 }
    );
  }).then(async (coords) => {
    if (!coords) {
      if (manual) {
        ui.showToast({
          message: 'Location unavailable. Check the browser permission, or search for your city.',
          tone: 'info',
        });
      }
      return null;
    }
    // A late resolution must never clobber a place the user already chose.
    if (!manual && state.bootResolved) return null;

    const place = {
      name: 'Current location', admin1: '', country: '',
      latitude: coords.lat, longitude: coords.lon, timezone: '',
    };
    loadWeather(place);

    // Best-effort naming (never blocks the forecast).
    const named = await reverseGeocode(coords.lat, coords.lon);
    if (!named) return place;
    place.name = named.name;
    place.admin1 = named.admin1;
    place.country = named.country;
    if (state.place === place || state.pendingPlace === place) {
      persistPlace(place);
      ui.renderPlaceLine(state);
      if (state.data && state.place === place) ui.renderHero(state);
    }
    return place;
  });
}

/* ------------------------------------------------------------
   Search
   ------------------------------------------------------------ */

function openSearch() {
  if (searchState.open) return;
  searchState.open = true;
  const pop = document.getElementById('search-popover');
  pop.hidden = false;
  requestAnimationFrame(() => pop.classList.add('open'));
  document.getElementById('btn-search').setAttribute('aria-expanded', 'true');
  if (window.innerWidth < 768) document.body.style.overflow = 'hidden';
  const input = document.getElementById('search-input');
  input.value = '';
  searchState.lastQuery = '';
  searchState.results = [];
  ui.renderSearchRecents(state.recents);
  setTimeout(() => input.focus(), 40);
}

function closeSearch() {
  if (!searchState.open) return;
  searchState.open = false;
  clearTimeout(searchState.timer);
  document.body.style.overflow = '';
  const pop = document.getElementById('search-popover');
  pop.classList.remove('open');
  document.getElementById('btn-search').setAttribute('aria-expanded', 'false');
  setTimeout(() => { pop.hidden = true; }, 200);
  document.getElementById('btn-search').focus();
}

function pickPlace(p) {
  closeSearch();
  pushRecent(p);
  loadWeather(p);
}

function onSearchInput(value) {
  const q = value.trim();
  clearTimeout(searchState.timer);
  if (q.length < 2) {
    searchState.lastQuery = '';
    searchState.results = [];
    ui.renderSearchRecents(state.recents);
    return;
  }
  if (q === searchState.lastQuery) return;
  searchState.timer = setTimeout(() => runSearch(q), 280);
}

async function runSearch(q) {
  if (searchState.cache.has(q)) {
    searchState.results = searchState.cache.get(q);
    ui.renderSearchResults(q, searchState.results);
    return;
  }
  searchState.lastQuery = q;
  ui.renderSearchLoading();
  try {
    const results = await searchCities(q);
    if (searchState.lastQuery !== q) return;
    searchState.results = results;
    searchState.cache.set(q, results);
    if (searchState.cache.size > 12) searchState.cache.delete(searchState.cache.keys().next().value);
    ui.renderSearchResults(q, results);
  } catch (err) {
    if (searchState.lastQuery !== q) return;
    ui.renderSearchError(err?.message || 'Search is unavailable right now.');
  }
}

function onSearchKeydown(e) {
  const list = ui.searchListEl();
  if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    e.preventDefault();
    ui.moveActive(e.key === 'ArrowDown' ? 'next' : 'prev', list, e.target);
  } else if (e.key === 'Enter') {
    const src = searchState.results.length ? searchState.results : state.recents;
    const activeIdx = list ? [...list.querySelectorAll('[role="option"]')].findIndex((o) => o.classList.contains('active')) : 0;
    const idx = activeIdx >= 0 ? activeIdx : 0;
    const r = src[idx];
    if (r) {
      pickPlace({
        name: r.name, admin1: r.admin1 || '', country: r.country || '',
        latitude: r.latitude, longitude: r.longitude, timezone: r.timezone || '',
      });
    }
  }
}

/* ------------------------------------------------------------
   Chrome bindings
   ------------------------------------------------------------ */

function bindChrome() {
  // Unit toggle
  const setUnit = (unit) => {
    state.unit = unit;
    write(LS.unit, unit);
    document.getElementById('unit-thumb').dataset.at = unit;
    document.getElementById('unit-c').setAttribute('aria-pressed', unit === 'c' ? 'true' : 'false');
    document.getElementById('unit-f').setAttribute('aria-pressed', unit === 'f' ? 'true' : 'false');
    if (state.data) {
      ui.renderHero(state);
      ui.renderHourly(state);
      ui.renderDaily(state);
      ui.renderInsights(state);
    }
  };
  document.getElementById('unit-c').addEventListener('click', () => setUnit('c'));
  document.getElementById('unit-f').addEventListener('click', () => setUnit('f'));

  // Theme
  document.getElementById('btn-theme').addEventListener('click', () => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    state.theme = next;
    write(LS.theme, next);
    const root = document.documentElement;
    root.classList.add('theme-anim');
    root.dataset.theme = next;
    setTimeout(() => root.classList.remove('theme-anim'), 380);
    ui.setThemeMeta(next);
  });

  // Search open/close
  document.getElementById('btn-search').addEventListener('click', () => (searchState.open ? closeSearch() : openSearch()));
  document.getElementById('btn-location').addEventListener('click', openSearch);
  document.getElementById('search-close').addEventListener('click', closeSearch);

  const input = document.getElementById('search-input');
  input.addEventListener('input', (e) => onSearchInput(e.target.value));
  input.addEventListener('keydown', onSearchKeydown);

  document.getElementById('search-clear').addEventListener('click', () => {
    input.value = '';
    input.focus();
    onSearchInput('');
  });

  document.getElementById('search-locate').addEventListener('click', () => {
    closeSearch();
    ui.showToast({ message: 'Requesting your location…', tone: 'info', ttl: 2600 });
    geolocate({ manual: true });
  });

  // Popover dismissal (desktop popover only — the sheet covers the page on mobile)
  document.addEventListener('pointerdown', (e) => {
    if (!searchState.open) return;
    const pop = document.getElementById('search-popover');
    if (pop.contains(e.target)) return;
    if (window.matchMedia('(min-width: 768px)').matches) closeSearch();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && searchState.open) closeSearch();
    if (e.key === 'Tab' && searchState.open && window.innerWidth < 768) {
      // Keep focus inside the mobile sheet.
      const focusables = document.getElementById('search-popover').querySelectorAll('input, button, [role="option"]');
      const list = [...focusables].filter((f) => !f.hidden);
      if (!list.length) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // Search body delegation (results + recents)
  document.getElementById('search-body').addEventListener('click', (e) => {
    const opt = e.target.closest('[role="option"]');
    if (!opt) return;
    const idx = Number(opt.dataset.idx);
    const src = searchState.results.length ? searchState.results : state.recents;
    const r = src[idx];
    if (!r) return;
    pickPlace({
      name: r.name, admin1: r.admin1 || '', country: r.country || '',
      latitude: r.latitude, longitude: r.longitude, timezone: r.timezone || '',
    });
  });

  document.getElementById('search-body').addEventListener('pointermove', (e) => {
    const opt = e.target.closest('[role="option"]');
    if (!opt) return;
    const list = ui.searchListEl();
    const opts = list ? [...list.querySelectorAll('[role="option"]')] : [];
    ui.setActive(opts.indexOf(opt), list, document.getElementById('search-input'));
  });

  // Online / offline resilience
  window.addEventListener('offline', () => {
    ui.showToast({ message: 'You are offline. Data may be out of date.', tone: 'error', ttl: 0 });
  });
  window.addEventListener('online', () => {
    document.querySelector('.toast')?.remove();
    if (state.lastAttemptFailed && state.pendingPlace === null) {
      loadWeather(state.place || DEFAULT_PLACE);
    }
  });

  // Reveal sections as they enter the viewport (skipped under reduced motion)
  if (!reduceMotion() && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    document.querySelectorAll('.section').forEach((s) => io.observe(s));
  } else {
    document.querySelectorAll('.section').forEach((s) => s.classList.add('in'));
  }

  // Re-render the curve-dependent strip when the width bucket changes
  let bucket = window.innerWidth < 768 ? 'sm' : 'lg';
  window.addEventListener('resize', () => {
    const next = window.innerWidth < 768 ? 'sm' : 'lg';
    if (next === bucket) return;
    bucket = next;
    if (state.data) ui.renderHourly(state);
  });
}

/* ------------------------------------------------------------
   Boot
   ------------------------------------------------------------ */

async function boot() {
  ui.hydrateIcons();
  bindChrome();

  // Preferences
  state.theme = document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  ui.setThemeMeta(state.theme);
  state.unit = read(LS.unit, 'c') === 'f' ? 'f' : 'c';
  document.getElementById('unit-thumb').dataset.at = state.unit;
  document.getElementById('unit-c').setAttribute('aria-pressed', state.unit === 'c' ? 'true' : 'false');
  document.getElementById('unit-f').setAttribute('aria-pressed', state.unit === 'f' ? 'true' : 'false');
  state.recents = readJSON(LS.recents, []);

  document.getElementById('year').textContent = String(new Date().getFullYear());

  // Skeletons for the first paint
  ui.renderHeroSkeleton();
  ui.renderHourlySkeleton();
  ui.renderDailySkeleton();
  ui.renderInsightsSkeleton();
  if (reduceMotion()) document.documentElement.classList.add('reduce-motion');

  // Resolve the initial place: saved -> geolocation -> default
  const saved = readJSON(LS.place, null);
  if (saved && typeof saved.latitude === 'number') {
    state.place = saved;
    loadWeather(saved);
    return;
  }

  const coords = await geolocate();
  if (!coords) {
    ui.showToast({
      message: 'Location unavailable — showing New Delhi. Search for any city, or use the locator.',
      tone: 'info',
      ttl: 6000,
    });
    loadWeather(DEFAULT_PLACE);
  }
}

boot().catch((err) => {
  ui.renderHeroError(err instanceof AppError ? err : null, () => location.reload());
});
