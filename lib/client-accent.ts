/**
 * A small, deliberately minor personalisation touch for the report: derive
 * a consistent accent colour from the client's name, used only for the
 * client-name text and a thin stripe on the cover block. Everything else
 * about the report (palette, type, table treatment) stays pure EY.
 *
 * This is NOT an attempt to know any real company's actual brand colour.
 * There's no reliable way to verify a client's current brand guidelines
 * from a typed name alone, and getting that visibly wrong in a
 * client-facing document would be worse than not trying. Instead this is
 * deterministic: the same name always produces the same accent, so it
 * reads as "personalised for this client" without claiming to be their
 * real identity.
 */

// Excludes a wedge of the hue wheel around EY's own yellow (~56°) so the
// derived accent never lands close enough to it to wash out against the
// beam/cover block. Without this, e.g. "JSW" hashes to hue 70, close enough
// to the brand yellow that the accent barely reads as different.
const EXCLUDE_START = 35;
const EXCLUDE_WIDTH = 55; // excludes roughly 35°-90°

function hashToHue(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  const usableRange = 360 - EXCLUDE_WIDTH;
  const raw = hash % usableRange;
  return raw < EXCLUDE_START ? raw : raw + EXCLUDE_WIDTH;
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const sFrac = s / 100;
  const lFrac = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sFrac * Math.min(lFrac, 1 - lFrac);
  const f = (n: number) => lFrac - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

/** Fixed saturation/lightness so the result is always a solid, readable
 * colour regardless of hue, never washed-out pastel, never near-black. */
export function clientAccentRgb(clientName: string): [number, number, number] {
  const hue = hashToHue(clientName.trim().toLowerCase());
  return hslToRgb(hue, 62, 42);
}

export function clientAccentCss(clientName: string): string {
  const [r, g, b] = clientAccentRgb(clientName);
  return `rgb(${r}, ${g}, ${b})`;
}
