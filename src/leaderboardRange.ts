import type { GetLeaderboardOptions } from "./mongo";

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

/** Compact aliases for lastJan / lastFebruary / etc. (1-based month) */
const LAST_MONTH_ALIASES: Record<string, number> = {
  lastjan: 1,
  lastjanuary: 1,
  lastfeb: 2,
  lastfebruary: 2,
  lastmar: 3,
  lastmarch: 3,
  lastapr: 4,
  lastapril: 4,
  lastmay: 5,
  lastjun: 6,
  lastjune: 6,
  lastjul: 7,
  lastjuly: 7,
  lastaug: 8,
  lastaugust: 8,
  lastsep: 9,
  lastsept: 9,
  lastseptember: 9,
  lastoct: 10,
  lastoctober: 10,
  lastnov: 11,
  lastnovember: 11,
  lastdec: 12,
  lastdecember: 12,
};

export type ParsedLeaderboardRange = {
  options: GetLeaderboardOptions;
  title: string;
};

export const LEADERBOARD_RANGE_HELP =
  "Try: `/cactpot leaderboard` (this month), `last month`, `last 30 days`, `all time`, `lastJan`...`lastDec`, `2024`, or `january 2024`";

function compact(text: string): string {
  return text.toLowerCase().replace(/[\s_-]+/g, "");
}

function monthTitle(year: number, month: number): string {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

/** Most recent past calendar month with that name (if we're in it, use prior year). */
export function lastNamedMonth(
  month: number,
  now = new Date()
): { year: number; month: number } {
  const year =
    now.getMonth() + 1 > month ? now.getFullYear() : now.getFullYear() - 1;
  return { year, month };
}

function previousCalendarMonth(now = new Date()): { year: number; month: number } {
  const month = now.getMonth(); // 0-based; convert to previous calendar month
  if (month === 0) return { year: now.getFullYear() - 1, month: 12 };
  return { year: now.getFullYear(), month };
}

function parseMonthYear(
  text: string
): { month: number; year: number } | undefined {
  const months = MONTH_NAMES.map((m) => m.toLowerCase());
  const splitted = text.trim().split(/\s+/);
  if (splitted.length !== 2) return undefined;
  const [maybeMonth, maybeYear] = splitted;
  const idx = months.findIndex((_month) =>
    new RegExp(`^${maybeMonth.toLowerCase()}`).test(_month)
  );
  if (idx === -1) return undefined;
  if (!/^\d{4}$/.test(maybeYear)) return undefined;
  return { month: idx + 1, year: parseInt(maybeYear, 10) };
}

export function parseLeaderboardRange(
  text: string,
  now = new Date()
): ParsedLeaderboardRange | null {
  const raw = text.trim();
  const key = compact(raw);

  if (!raw) {
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    return {
      options: { year, month },
      title: monthTitle(year, month),
    };
  }

  if (key === "all" || key === "alltime") {
    return { options: { all: true }, title: "All Time" };
  }

  if (key === "lastmonth") {
    const { year, month } = previousCalendarMonth(now);
    return {
      options: { year, month },
      title: `Last Month (${monthTitle(year, month)})`,
    };
  }

  if (key === "last30days" || key === "last30") {
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    // exclusive end: start of tomorrow so today's rounds are included
    const to = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    return {
      options: { from, to },
      title: "Last 30 Days",
    };
  }

  const lastMonth = LAST_MONTH_ALIASES[key];
  if (lastMonth) {
    const { year, month } = lastNamedMonth(lastMonth, now);
    return {
      options: { year, month },
      title: monthTitle(year, month),
    };
  }

  if (/^\d{4}$/.test(raw)) {
    const year = parseInt(raw, 10);
    return { options: { year }, title: String(year) };
  }

  const monthYear = parseMonthYear(raw);
  if (monthYear) {
    return {
      options: monthYear,
      title: monthTitle(monthYear.year, monthYear.month),
    };
  }

  return null;
}

// silence unused in case tree-shaking cares — startOfMonth used by callers via options only
