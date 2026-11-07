/* ============================================================
   ATMOS — api.js
   Network layer only. No DOM code lives here.
   Endpoints:
     - Open-Meteo Forecast  https://api.open-meteo.com/v1/forecast
     - Open-Meteo Geocoding  https://geocoding-api.open-meteo.com/v1/search
     - BigDataCloud reverse geocoding (free, keyless, CORS-enabled)
   ============================================================ */

'use strict';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
const REVERSE_URL = 'https://api.bigdatacloud.net/data/reverse-geocode-client';
const TIMEOUT_MS = 9000;

/** Typed application error. kind drives user-facing copy upstream. */
export class AppError extends Error {
  constructor(message, kind = 'generic') {
    super(message);
    this.name = 'AppError';
    this.kind = kind;
  }
}

async function fetchJSON(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new AppError(
        `The weather service returned an error (${res.status}).`,
        'http'
      );
    }
    const json = await res.json();
    if (json == null || typeof json !== 'object') {
      throw new AppError('The service returned an unreadable response.', 'empty');
    }
    return json;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err && err.name === 'AbortError') {
      throw new AppError('The request timed out. Check your connection and try again.', 'timeout');
    }
    throw new AppError(
      "Can't reach the service. Check your connection and try again.",
      'network'
    );
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Search cities by name.
 * @returns {Promise<Array>} geocoding results (may be empty)
 */
export async function searchCities(query) {
  const url = `${GEOCODE_URL}?name=${encodeURIComponent(query)}&count=8&language=en&format=json`;
  const data = await fetchJSON(url);
  return Array.isArray(data.results) ? data.results : [];
}

/**
 * Reverse-geocode coordinates into a place name.
 * Best-effort: returns null on any failure, never throws.
 */
export async function reverseGeocode(lat, lon) {
  try {
    const url = `${REVERSE_URL}?latitude=${lat}&longitude=${lon}&localityLanguage=en`;
    const data = await fetchJSON(url);
    const name = data.city || data.locality || null;
    if (!name) return null;
    return {
      name,
      admin1: data.principalSubdivision || '',
      country: data.countryName || '',
    };
  } catch {
    return null;
  }
}

/**
 * Fetch a full forecast for a location.
 * timezone=auto returns times in the location's own zone.
 */
export async function getForecast(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current:
      'temperature_2m,apparent_temperature,relative_humidity_2m,is_day,precipitation,weather_code,cloud_cover,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m',
    hourly:
      'temperature_2m,apparent_temperature,precipitation_probability,weather_code,relative_humidity_2m,visibility,uv_index,is_day',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '7',
  });
  const data = await fetchJSON(`${FORECAST_URL}?${params}`);

  // Shape validation — an empty or partial payload is an error state,
  // never something we present as real weather.
  const ok =
    data &&
    data.current &&
    typeof data.current.time === 'string' &&
    Array.isArray(data.hourly?.time) &&
    data.hourly.time.length > 0 &&
    Array.isArray(data.daily?.time) &&
    data.daily.time.length > 0;
  if (!ok) {
    throw new AppError('The forecast came back empty. Try again in a moment.', 'empty');
  }
  return data;
}
