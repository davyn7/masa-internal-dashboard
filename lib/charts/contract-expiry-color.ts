const NEUTRAL_MONTHS = 9
const GREEN_MONTHS = 18

// Anchor colors: red (expiring) → gray (neutral) → green (long runway)
const RED = { l: 0.42, c: 0.18, h: 19 }
const NEUTRAL = { l: 0.35, c: 0.01, h: 248 }
const GREEN = { l: 0.42, c: 0.16, h: 162 }

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function toOklch(l: number, c: number, h: number): string {
  return `oklch(${l.toFixed(3)} ${c.toFixed(3)} ${h.toFixed(1)})`
}

/** Red → neutral: fade chroma while holding the red hue (avoids sweeping through orange/blue). */
function interpolateRedToNeutral(t: number): string {
  return toOklch(
    lerp(RED.l, NEUTRAL.l, t),
    lerp(RED.c, NEUTRAL.c, t),
    RED.h,
  )
}

/** Neutral → green: ramp chroma while holding the green hue. */
function interpolateNeutralToGreen(t: number): string {
  return toOklch(
    lerp(NEUTRAL.l, GREEN.l, t),
    lerp(NEUTRAL.c, GREEN.c, t),
    GREEN.h,
  )
}

/** Map months-until-expiry to background color. 9 months = neutral. */
export function getExpiryColor(monthsUntilExpiry: number): string {
  const months = Math.max(0, monthsUntilExpiry)

  if (months <= NEUTRAL_MONTHS) {
    return interpolateRedToNeutral(months / NEUTRAL_MONTHS)
  }

  const t = Math.min(1, (months - NEUTRAL_MONTHS) / (GREEN_MONTHS - NEUTRAL_MONTHS))
  return interpolateNeutralToGreen(t)
}

/** Pick readable text color for a given expiry background. */
export function getExpiryTextColor(monthsUntilExpiry: number): string {
  const months = Math.max(0, monthsUntilExpiry)
  if (months <= 3 || months >= 14) return 'oklch(0.97 0.01 248)'
  return 'oklch(0.92 0.01 248)'
}

export const EXPIRY_LEGEND = {
  red: 0,
  neutral: NEUTRAL_MONTHS,
  green: GREEN_MONTHS,
} as const
