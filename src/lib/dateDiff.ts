// Calendar-aware "time since" breakdown — reproduces the live site's counter algorithm
// (borrowing with days-from-previous-month), NOT fixed 30-day/365-day approximations.
// Origin is an AUTHORIZED DEVIATION (ANSWERS.md §2): 7 Jan 2019, midnight, viewer-local.
export const COUNTER_ORIGIN = new Date(2019, 0, 7, 0, 0, 0, 0);

export interface Elapsed {
  y: number;
  mo: number;
  d: number;
  h: number;
  mi: number;
  s: number;
}

export function elapsedSince(from: Date, to: Date = new Date()): Elapsed {
  let y = to.getFullYear() - from.getFullYear();
  let mo = to.getMonth() - from.getMonth();
  let d = to.getDate() - from.getDate();
  let h = to.getHours() - from.getHours();
  let mi = to.getMinutes() - from.getMinutes();
  let s = to.getSeconds() - from.getSeconds();

  if (s < 0) { s += 60; mi -= 1; }
  if (mi < 0) { mi += 60; h -= 1; }
  if (h < 0) { h += 24; d -= 1; }
  if (d < 0) {
    // days in the month before `to` (viewer-local), matching the live rollover behaviour
    const daysInPrevMonth = new Date(to.getFullYear(), to.getMonth(), 0).getDate();
    d += daysInPrevMonth;
    mo -= 1;
  }
  if (mo < 0) { mo += 12; y -= 1; }
  return { y, mo, d, h, mi, s };
}

// Format exactly as the live site: "7y 8m 7d 19h 43m 37s" — no zero-padding, "m" for month AND minute.
export function formatElapsed(e: Elapsed): string {
  return `${e.y}y ${e.mo}m ${e.d}d ${e.h}h ${e.mi}m ${e.s}s`;
}
