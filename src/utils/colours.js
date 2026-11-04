/* Maps a product colour name (free text from the admin) to a CSS colour, for the filter swatches. */

const COLOURS = {
  emerald: '#50C878', wine: '#722F37', green: '#008000', navy: '#000080', mustard: '#FFDB58', black: '#000000',
  teal: '#008080', maroon: '#800000', pink: '#FFC0CB', ivory: '#FFFFF0', white: '#FFFFFF', cream: '#FFFDD0',
  beige: '#F5F5DC', red: '#DC143C', blue: '#0000FF', yellow: '#FFD700', orange: '#FFA500', purple: '#800080',
  violet: '#8F00FF', lavender: '#B57EDC', turquoise: '#40E0D0', coral: '#FF7F50', peach: '#FFCBA4', mint: '#98FF98',
  olive: '#808000', brown: '#8B4513', grey: '#808080', gray: '#808080', silver: '#C0C0C0', gold: '#D4AF37',
  magenta: '#FF00FF', rani: '#E0115F', burgundy: '#800020', mauve: '#E0B0FF', rust: '#B7410E', khaki: '#C3B091',
  'bottle green': '#006A4E', 'royal blue': '#4169E1', 'sky blue': '#87CEEB', 'peacock blue': '#1CA9C9',
  'peacock green': '#0B6E5E', 'rani pink': '#E0115F', 'baby pink': '#F4C2C2', 'hot pink': '#FF69B4',
  'lemon yellow': '#FFF44F', 'navy blue': '#000080', 'dark green': '#006400', 'light green': '#90EE90',
  'off white': '#FAF9F6', 'mustard yellow': '#FFDB58', 'wine red': '#722F37', 'sea green': '#2E8B57',
};

/** Returns a CSS colour for the name, or null when it cannot be matched. */
export function colourToCss(name) {
  const key = String(name ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!key) return null;
  if (COLOURS[key]) return COLOURS[key];
  const supports = (v) => typeof CSS !== 'undefined' && CSS.supports?.('color', v);
  if (supports(key.replace(/ /g, ''))) return key.replace(/ /g, '');
  // "Light Maroon", "Pista Green"...: fall back to the last word ("maroon", "green").
  const last = key.split(' ').pop();
  if (COLOURS[last]) return COLOURS[last];
  return supports(last) ? last : null;
}

/** True when white text/ticks read better than dark ones on this hex colour. */
export function isDark(hex) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex ?? '');
  if (!m) return false;
  const n = parseInt(m[1], 16);
  const lum = (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  return lum < 0.6;
}
