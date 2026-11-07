/* ============================================================
   ATMOS — weather-codes.js
   WMO 4677 weather-code mapping. Labels follow the official
   Open-Meteo / WMO descriptions. Kept separate from rendering.
   ============================================================ */

'use strict';

/**
 * Canonical condition groups used across the app
 * (icons, hero scenes, hero tint).
 */
export const GROUPS = [
  'clear',
  'mainly-clear',
  'partly-cloudy',
  'overcast',
  'fog',
  'drizzle',
  'rain',
  'snow',
  'rain-showers',
  'snow-showers',
  'thunder',
];

/** WMO code -> human label (Open-Meteo descriptive convention). */
export const CODES = {
  0: 'Clear sky',
  1: 'Mainly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Fog',
  48: 'Depositing rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Light freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Slight rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Light freezing rain',
  67: 'Heavy freezing rain',
  71: 'Slight snowfall',
  73: 'Moderate snowfall',
  75: 'Heavy snowfall',
  77: 'Snow grains',
  80: 'Slight rain showers',
  81: 'Rain showers',
  82: 'Violent rain showers',
  85: 'Slight snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with slight hail',
  99: 'Thunderstorm with heavy hail',
};

/** WMO code -> condition group. Unknown codes degrade gracefully. */
const CODE_TO_GROUP = {
  0: 'clear',
  1: 'mainly-clear',
  2: 'partly-cloudy',
  3: 'overcast',
  45: 'fog',
  48: 'fog',
  51: 'drizzle',
  53: 'drizzle',
  55: 'drizzle',
  56: 'drizzle',
  57: 'drizzle',
  61: 'rain',
  63: 'rain',
  65: 'rain',
  66: 'rain',
  67: 'rain',
  71: 'snow',
  73: 'snow',
  75: 'snow',
  77: 'snow',
  80: 'rain-showers',
  81: 'rain-showers',
  82: 'rain-showers',
  85: 'snow-showers',
  86: 'snow-showers',
  95: 'thunder',
  96: 'thunder',
  99: 'thunder',
};

/** Human label for a WMO code (falls back to a sensible phrase). */
export function describe(code) {
  return CODES[code] ?? 'Unsettled';
}

/** Condition group for a WMO code (falls back to overcast). */
export function groupOf(code) {
  return CODE_TO_GROUP[code] ?? 'overcast';
}

/**
 * Icon key for a code, accounting for day / night.
 * Night variants only where the sky state actually differs.
 */
export function iconKeyFor(code, isDay) {
  const g = groupOf(code);
  switch (g) {
    case 'clear':
    case 'mainly-clear':
      return isDay ? 'sun' : 'moon';
    case 'partly-cloudy':
      return isDay ? 'cloud-sun' : 'cloud-moon';
    case 'overcast':
      return 'cloud';
    case 'fog':
      return 'cloud-fog';
    case 'drizzle':
      return 'cloud-drizzle';
    case 'rain':
      return 'cloud-rain';
    case 'snow':
      return 'cloud-snow';
    case 'rain-showers':
      return isDay ? 'cloud-sun-rain' : 'cloud-moon-rain';
    case 'snow-showers':
      return isDay ? 'cloud-sun-snow' : 'cloud-moon-snow';
    case 'thunder':
      return 'cloud-bolt';
    default:
      return 'cloud';
  }
}

/** Hero glow bucket (drives a faint weather-responsive tint). */
export function tintFor(code, isDay) {
  const g = groupOf(code);
  switch (g) {
    case 'clear':
    case 'mainly-clear':
      return isDay ? 'warm' : 'cool';
    case 'partly-cloudy':
      return isDay ? 'warm-soft' : 'cool';
    case 'snow':
    case 'snow-showers':
      return 'pale';
    case 'thunder':
      return 'storm';
    case 'overcast':
    case 'fog':
      return 'neutral';
    default:
      return 'cool';
  }
}
