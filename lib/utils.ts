import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// This check can be removed, it is just for tutorial purposes
export const hasEnvVars =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// Timezone utilities
// All storage/computation should use UTC; display uses user's local timezone

// Map JS getDay() (0=Sun..6=Sat) to DB schema day_of_week (1=Mon..7=Sun)
export function getSchemaDayOfWeekForDate(date: Date): number {
  const js = date.getDay(); // 0..6
  // Convert to 1..7 where 1=Monday, 7=Sunday
  return js === 0 ? 7 : js; // 1=Mon..6=Sat, 7=Sun
}

// Format a UTC time-of-day (HH:mm[:ss]) as local time string for the user
export function formatUtcTimeForLocalDisplay(
  doseTime: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const [hStr, mStr = "0", sStr = "0"] = doseTime.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const s = parseInt(sStr, 10);
  const now = new Date();
  // Construct a UTC date using today's UTC date with provided time
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m, s, 0));
  return d.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    ...(s ? { second: "2-digit" } : {}),
    ...options,
  });
}

// Build a Date representing today's event time in UTC (epoch ms comparable)
export function getTodayUtcEventDate(doseTime: string): Date {
  const [hStr, mStr = "0", sStr = "0"] = doseTime.split(":");
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10);
  const s = parseInt(sStr, 10);
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h, m, s, 0));
}

// Format a server timestamp (ISO) for local display
export function formatTimestampLocal(ts: string, options?: Intl.DateTimeFormatOptions): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, options);
}
