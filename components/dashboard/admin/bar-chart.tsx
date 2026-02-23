import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BarDatum = { label: string; value: number; isGap?: boolean; hasEvents?: boolean };

function barColor(value: number, isGap?: boolean): string {
  if (isGap) return "#b91c1c"; // critical gap
  if (value >= 85) return "#10b981";
  if (value >= 70) return "#f59e0b";
  return "#ef4444";
}

export function SimpleBarChart({ title, data }: { title: string; data: BarDatum[] }) {
  const max = Math.max(100, ...data.map((d) => d.value));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56 flex items-end justify-between gap-2">
          {data.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
              {d.value > 0 && (
                <span className="text-xs font-medium" style={{ color: barColor(d.value, d.isGap) }}>
                  {d.value}%
                </span>
              )}
              <div
                className={`w-full rounded-sm min-h-[4px] ${d.isGap ? "ring-2 ring-red-500/70" : ""}`}
                style={{ height: `${(d.value / max) * 100}%`, backgroundColor: barColor(d.value, d.isGap) }}
                title={
                  d.isGap
                    ? `${d.label}: ${d.value}% (part of multi-day gap)`
                    : `${d.label}: ${d.value}%`
                }
              />
              <span className={`text-xs ${d.isGap ? "text-red-700 font-semibold" : "text-muted-foreground"}`}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Avg adherence %. Red, outlined bars indicate multi-day gaps where patients missed doses in a row.
        </div>
      </CardContent>
    </Card>
  );
}

/** Per-day counts: taken and missed doses (from scheduled_dose_events). */
export type DosesByDayDatum = { label: string; dateStr: string; taken: number; missed: number };

export function StackedDosesChart({ title, data }: { title: string; data: DosesByDayDatum[] }) {
  const max = Math.max(
    1,
    ...data.map((d) => d.taken + d.missed)
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56 flex items-end justify-between gap-2">
          {data.map((d) => {
            const total = d.taken + d.missed;
            const takenPct = max > 0 ? (d.taken / max) * 100 : 0;
            const missedPct = max > 0 ? (d.missed / max) * 100 : 0;
            const isEmpty = total === 0;
            return (
              <div key={d.label} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                {!isEmpty && (
                  <span className="text-xs font-medium text-muted-foreground">
                    {d.taken}/{total}
                  </span>
                )}
                {isEmpty ? (
                  <div
                    className="w-full rounded-sm min-h-[4px] bg-muted"
                    style={{ height: "4px" }}
                    title={`${d.label}: No scheduled doses`}
                  />
                ) : (
                  <div
                    className="w-full rounded-sm min-h-[4px] flex flex-col-reverse overflow-hidden"
                    style={{ height: `${((total / max) * 100)}%`, minHeight: "8px" }}
                    title={`${d.label}: ${d.taken} taken, ${d.missed} missed`}
                  >
                    {d.missed > 0 && (
                      <div
                        className="w-full flex-shrink-0 bg-red-500"
                        style={{ height: `${(d.missed / total) * 100}%`, minHeight: "2px" }}
                      />
                    )}
                    {d.taken > 0 && (
                      <div
                        className="w-full flex-shrink-0 bg-emerald-500"
                        style={{ height: `${(d.taken / total) * 100}%`, minHeight: "2px" }}
                      />
                    )}
                  </div>
                )}
                <span className="text-xs text-muted-foreground">{d.label}</span>
                {!isEmpty && d.missed > 0 && (
                  <span className="text-[10px] font-medium text-red-600">{d.missed} missed</span>
                )}
              </div>
            );
          })}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Green = taken on time or late. Red = missed. Numbers show taken/total and “X missed” when applicable.
        </div>
      </CardContent>
    </Card>
  );
}

/** Missed doses count per day (for “adherence trend” / holes). */
export type MissedByDayDatum = { label: string; dateStr: string; missed: number; isGap?: boolean };

export function MissedDosesByDayChart({ title, data }: { title: string; data: MissedByDayDatum[] }) {
  const max = Math.max(1, ...data.map((d) => d.missed));
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56 flex items-end justify-between gap-2">
          {data.map((d) => (
            <div key={d.label} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
              {d.missed > 0 && (
                <span className={`text-xs font-medium ${d.isGap ? "text-red-700" : "text-red-600"}`}>
                  {d.missed}
                </span>
              )}
              <div
                className={`w-full rounded-sm min-h-[4px] ${d.isGap ? "ring-2 ring-red-500/70" : ""}`}
                style={{
                  height: `${max > 0 ? (d.missed / max) * 100 : 0}%`,
                  backgroundColor: d.missed > 0 ? "#dc2626" : "var(--muted)",
                  minHeight: d.missed > 0 ? "8px" : "4px",
                }}
                title={d.isGap ? `${d.label}: ${d.missed} missed (part of multi-day gap)` : `${d.label}: ${d.missed} missed`}
              />
              <span className={`text-xs ${d.isGap ? "text-red-700 font-semibold" : "text-muted-foreground"}`}>
                {d.label}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Number of missed doses per day (all patients). Red outline = day is part of a multi-day low-adherence gap.
        </div>
      </CardContent>
    </Card>
  );
}
