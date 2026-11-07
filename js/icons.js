/* ============================================================
   ATMOS — icons.js
   A single, consistent icon language. Every glyph is drawn on a
   24pt grid with a 1.7 stroke; scene illustrations use a 440x320
   plate. All geometry is constructed from verifiable primitives
   (semicircles, computed ray radii, circle-intersection crecents),
   so the family stays optically coherent at any size.
   ============================================================ */

'use strict';

/* ------------------------------------------------------------
   Reusable, verified path fragments (24pt grid)
   ------------------------------------------------------------ */

// Flat cloud — three verified semicircle/arc segments:
// left bulge r2.9 (x3.7..6.6), shallow top arc r7.1 (apex 12,7.51),
// right bulge r2.9 (x17.4..20.3), closed by the base line y15.8.
const FLAT_CLOUD =
  'M6.6 15.8a2.9 2.9 0 0 1 0-5.8a7.1 7.1 0 0 1 10.8 0a2.9 2.9 0 0 1 0 5.8Z';

// Full cloud — taller sibling: left r3.6, semicircular top r5.4
// (apex 12,6.2), right r3.6, base y18.8.
const FULL_CLOUD =
  'M6.6 18.8a3.6 3.6 0 0 1 0-7.2a5.4 5.4 0 0 1 10.8 0a3.6 3.6 0 0 1 0 7.2Z';

// Slanted rain strokes (rain / shower icons)
const RAIN_3 = 'M8 17.2l-1.2 3.2M12 17.2l-1.2 3.2M16 17.2l-1.2 3.2';
const RAIN_3_LOW = 'M9.5 19.2l-1.1 2.9M13.5 19.2l-1.1 2.9M17.5 19.2l-1.1 2.9';

// Crescents — outline built from the two intersection points of a
// bright circle (O) and a carving circle (C). Verified for each pair.
// Solo moon: O r7.5 @(10,14), C r6.5 @(13.4,10.8); horns (8.37,6.68),(17.21,16.06)
const CRESCENT_MOON =
  'M8.37 6.68A7.5 7.5 0 1 0 17.21 16.06A6.5 6.5 0 0 1 8.37 6.68Z';
// Compact crescent: O r4 @(5.5,6.5), C r3.6 @(8.2,4.7); horns (5.35,2.51),(9.13,8.17)
const CRESCENT_SMALL =
  'M5.35 2.51A4 4 0 1 0 9.13 8.17A3.6 3.6 0 0 1 5.35 2.51Z';

// Sun with eight rays (rays span r8..r10 around a r4 disc)
const SUN_RAYS =
  'M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41';

// Small sun for compositions — disc + six rays, upper-left placement
const SUN_SMALL = [
  '<circle cx="6" cy="7" r="2.5"/>',
  '<path d="M6 3.5V2.3M1.3 7h1.2M9.5 7h1.2M8.5 4.5 9.3 3.7M3.5 4.5 2.7 3.7M8.5 9.5 9.3 10.3"/>',
].join('');

// Compact sun for shower compositions (slightly lower, smaller disc)
const SUN_TINY = [
  '<circle cx="6" cy="6.5" r="2.4"/>',
  '<path d="M6 1.8V3M1.3 6.5h1.2M9.5 6.5h1.2M8.5 4 9.3 3.2M3.5 4 2.7 3.2M8.5 9 9.3 9.8"/>',
].join('');

/* ------------------------------------------------------------
   24pt icon table
   ------------------------------------------------------------ */

const ICONS = {
  /* --- weather ------------------------------------------------ */
  sun: `<circle cx="12" cy="12" r="4"/><path d="${SUN_RAYS}"/>`,
  moon: `<path d="${CRESCENT_MOON}"/>`,
  cloud: `<path d="${FULL_CLOUD}"/>`,
  'cloud-sun': `${SUN_SMALL}<g transform="translate(2.5 4)"><path d="${FLAT_CLOUD}"/></g>`,
  'cloud-moon': `<path d="${CRESCENT_SMALL}"/><g transform="translate(2.5 4)"><path d="${FLAT_CLOUD}"/></g>`,
  'cloud-fog': `<g transform="translate(0 -3.5)"><path d="${FLAT_CLOUD}"/></g><path d="M6 16.4h12M8.4 19.6h9.2"/>`,
  'cloud-drizzle': `<path d="${FLAT_CLOUD}"/><path d="M9.5 17.4l-.9 2.4M14.5 17.4l-.9 2.4"/><circle cx="11.8" cy="21.3" r=".6" fill="currentColor" stroke="none"/><circle cx="16.8" cy="21.3" r=".6" fill="currentColor" stroke="none"/>`,
  'cloud-rain': `<path d="${FLAT_CLOUD}"/><path d="${RAIN_3}"/>`,
  'cloud-snow': `<path d="${FLAT_CLOUD}"/><circle cx="8.5" cy="18.6" r=".7" fill="currentColor" stroke="none"/><circle cx="12.5" cy="18.6" r=".7" fill="currentColor" stroke="none"/><circle cx="16.5" cy="18.6" r=".7" fill="currentColor" stroke="none"/><circle cx="10.5" cy="21.3" r=".7" fill="currentColor" stroke="none"/><circle cx="14.5" cy="21.3" r=".7" fill="currentColor" stroke="none"/>`,
  'cloud-sun-rain': `${SUN_TINY}<g transform="translate(2.5 1.5)"><path d="${FLAT_CLOUD}"/></g><path d="${RAIN_3_LOW}"/>`,
  'cloud-moon-rain': `<path d="${CRESCENT_SMALL}"/><g transform="translate(2.5 1.5)"><path d="${FLAT_CLOUD}"/></g><path d="${RAIN_3_LOW}"/>`,
  'cloud-sun-snow': `${SUN_TINY}<g transform="translate(2.5 1.5)"><path d="${FLAT_CLOUD}"/></g><circle cx="8.5" cy="20" r=".7" fill="currentColor" stroke="none"/><circle cx="12.5" cy="20" r=".7" fill="currentColor" stroke="none"/><circle cx="16.5" cy="20" r=".7" fill="currentColor" stroke="none"/><circle cx="10.5" cy="22.3" r=".7" fill="currentColor" stroke="none"/><circle cx="14.5" cy="22.3" r=".7" fill="currentColor" stroke="none"/>`,
  'cloud-moon-snow': `<path d="${CRESCENT_SMALL}"/><g transform="translate(2.5 1.5)"><path d="${FLAT_CLOUD}"/></g><circle cx="8.5" cy="20" r=".7" fill="currentColor" stroke="none"/><circle cx="12.5" cy="20" r=".7" fill="currentColor" stroke="none"/><circle cx="16.5" cy="20" r=".7" fill="currentColor" stroke="none"/><circle cx="10.5" cy="22.3" r=".7" fill="currentColor" stroke="none"/><circle cx="14.5" cy="22.3" r=".7" fill="currentColor" stroke="none"/>`,
  'cloud-bolt': `<path d="${FLAT_CLOUD}"/><path d="M13.5 17.4l-2.8 2.8h3.6l-2.8 2.8"/>`,

  /* --- interface ----------------------------------------------- */
  search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  locate: '<circle cx="12" cy="12" r="7"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  droplet: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7Z"/>',
  wind: '<path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2M9.6 4.6A2 2 0 1 1 11 8H2M12.6 19.4A2 2 0 1 0 14 16H2"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  sunrise: '<path d="M12 2v8M4.93 10.93l1.41 1.41M2 18h2M20 18h2M19.07 10.93l-1.41 1.41M22 22H2M8 6l4-4 4 4"/>',
  sunset: '<path d="M12 2v8M4.93 10.93l1.41 1.41M2 18h2M20 18h2M19.07 10.93l-1.41 1.41M22 22H2M16 6l-4 4-4-4"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><circle cx="12" cy="17" r=".6" fill="currentColor" stroke="none"/>',
  retry: '<path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/>',
};

/** Render a named icon as an inline SVG string. */
export function icon(name, cls = 'ic') {
  const body = ICONS[name];
  if (!body) return '';
  return `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
}

/* ------------------------------------------------------------
   Hero scene illustrations — 440x320 plate
   Shared grammar: hairline horizon, monoline clouds, a single
   warm or cool accent, restrained density.
   ------------------------------------------------------------ */

// Verified scene primitives
const SC_FLAT_CLOUD =
  'M120 214a11 11 0 0 1 0-22a37.5 37.5 0 0 1 120 0a11 11 0 0 1 0 22Z'; // base y214, apex (180,177)
const SC_UPPER_CLOUD =
  'M96 150a9 9 0 0 1 0-18a84 84 0 0 1 104 0a9 9 0 0 1 0 18Z'; // base y150, apex (148,114)
const SC_CRESCENT =
  'M168 91.2A34 34 0 1 0 182.8 129A30 30 0 0 1 168 91.2Z'; // O r34 @(150,120), C r30 @(196,102)

const HORIZON = 'M36 260h368';

function scSun(cx, cy) {
  // disc r34, eight rays spanning r46..r62 — all radii precomputed
  const d = Math.round(Math.SQRT1_2 * 46); // 32.5
  const e = Math.round(Math.SQRT1_2 * 62); // 43.8 -> 44
  return `<circle class="sc-warm-fill" cx="${cx}" cy="${cy}" r="34"/>
    <path class="sc-warm sc-thin" d="M${cx} ${cy - 62}v16M${cx - 62} ${cy}h16M${cx + 62} ${cy}h-16M${cx} ${cy + 62}v-16M${cx + d} ${cy - d}L${cx + e} ${cy - e}M${cx - d} ${cy - d}L${cx - e} ${cy - e}M${cx + d} ${cy + d}L${cx + e} ${cy + e}M${cx - d} ${cy + d}L${cx - e} ${cy + e}"/>`;
}

function scStars(list) {
  return list
    .map(([x, y, r]) => `<circle class="sc-dot" cx="${x}" cy="${y}" r="${r}"/>`)
    .join('');
}

/**
 * Build the hero illustration for a condition group.
 * @param {string} group  condition group key
 * @param {boolean} isDay
 */
export function scene(group, isDay) {
  const parts = [];

  switch (group) {
    case 'clear':
    case 'mainly-clear':
      if (isDay) {
        parts.push(scSun(300, 128));
        parts.push('<path class="sc-line" d="M70 208a14 14 0 0 1 28 0a10 10 0 0 1 20 0"/>');
      } else {
        parts.push(`<g transform="translate(150 -8)"><path class="sc-line" d="${SC_CRESCENT}"/></g>`);
        parts.push(scStars([[92, 72, 2.5], [140, 140, 2], [84, 192, 2], [204, 62, 2], [368, 168, 2]]));
      }
      break;

    case 'partly-cloudy':
      if (isDay) {
        parts.push(scSun(170, 110));
        parts.push(`<g transform="translate(84 -12)"><path class="sc-line" d="${SC_FLAT_CLOUD}"/></g>`);
      } else {
        parts.push(`<g transform="translate(0 -20)"><path class="sc-line" d="${SC_CRESCENT}"/></g>`);
        parts.push(`<g transform="translate(84 -12)"><path class="sc-line" d="${SC_FLAT_CLOUD}"/></g>`);
        parts.push(scStars([[300, 84, 2.5], [352, 128, 2], [268, 44, 2]]));
      }
      break;

    case 'overcast':
      parts.push(`<path class="sc-line sc-far" d="${SC_UPPER_CLOUD}"/>`);
      parts.push(`<path class="sc-line" d="${SC_FLAT_CLOUD}"/>`);
      break;

    case 'fog':
      parts.push(`<g transform="translate(0 -26)"><path class="sc-line" d="${SC_FLAT_CLOUD}"/></g>`);
      parts.push('<path class="sc-fogline" d="M56 208h176M92 232h188"/>');
      break;

    case 'drizzle':
      parts.push(`<g transform="translate(0 -12)"><path class="sc-line" d="${SC_FLAT_CLOUD}"/></g>`);
      parts.push('<path class="sc-accent" d="M150 216l-7 19M184 216l-7 19M218 216l-7 19"/>');
      parts.push(scStars([[167, 247, 3], [201, 247, 3], [235, 247, 3]]));
      break;

    case 'rain':
    case 'rain-showers':
      if (group === 'rain-showers' && isDay) parts.push(scSun(150, 86));
      if (group === 'rain-showers' && !isDay) {
        parts.push(`<g transform="translate(-96 -66)"><path class="sc-line" d="${SC_CRESCENT}"/></g>`);
      }
      parts.push(`<g transform="translate(${group === 'rain-showers' ? 40 : 0} ${group === 'rain-showers' ? -6 : -12})"><path class="sc-line" d="${SC_FLAT_CLOUD}"/></g>`);
      parts.push(
        group === 'rain-showers'
          ? '<path class="sc-accent" d="M176 224l-9 24M204 224l-9 24M232 224l-9 24M260 224l-9 24"/>'
          : '<path class="sc-accent" d="M144 224l-9 24M172 224l-9 24M200 224l-9 24M228 224l-9 24"/>'
      );
      break;

    case 'snow':
    case 'snow-showers':
      if (group === 'snow-showers' && isDay) parts.push(scSun(150, 86));
      if (group === 'snow-showers' && !isDay) {
        parts.push(`<g transform="translate(-96 -66)"><path class="sc-line" d="${SC_CRESCENT}"/></g>`);
      }
      parts.push(`<g transform="translate(${group === 'snow-showers' ? 40 : 0} ${group === 'snow-showers' ? -6 : -12})"><path class="sc-line" d="${SC_FLAT_CLOUD}"/></g>`);
      parts.push(
        group === 'snow-showers'
          ? scStars([[186, 230, 3.5], [224, 230, 3.5], [262, 230, 3.5], [205, 248, 3.5], [243, 248, 3.5]])
          : scStars([[146, 230, 3.5], [184, 230, 3.5], [222, 230, 3.5], [165, 248, 3.5], [203, 248, 3.5]])
      );
      break;

    case 'thunder':
      parts.push(`<g transform="translate(0 -12)"><path class="sc-line" d="${SC_FLAT_CLOUD}"/></g>`);
      parts.push('<path class="sc-warm" d="M186 214l-23 33h31l-23 33"/>');
      parts.push('<path class="sc-accent" d="M146 222l-8 26M226 222l-8 26"/>');
      return wrapScene(parts, 292); // deeper horizon for this scene
  }

  return wrapScene(parts, 260);
}

function wrapScene(parts, horizonY) {
  const horizon = `<path class="sc-hair" d="M36 ${horizonY}h368"/>`;
  return `<svg class="scene-svg" viewBox="0 0 440 320" fill="none" aria-hidden="true" focusable="false">${parts.join('')}${horizon}</svg>`;
}
