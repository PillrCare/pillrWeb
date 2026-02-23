import React from "react";

export type SparklineDatum = { date?: string; rate?: number; value?: number };

/** Sparkline with rate (0–100) or value (count); height scale is 0–100 for rate or 0–max(value) for value. */
export default function Sparkline({
  data = [],
  mode = "rate",
}: {
  data?: SparklineDatum[];
  mode?: "rate" | "value";
}) {
  if (!data || data.length === 0) return <div className="text-sm text-muted-foreground">No adherence data</div>;

  const isValueMode = mode === "value";
  const maxValue = isValueMode ? Math.max(1, ...data.map((d) => d.value ?? 0)) : 100;

  return (
    <div>
      <div className="flex items-end gap-1 h-28">
        {data.map((d, i) => {
          const raw = isValueMode ? (d.value ?? 0) : (d.rate ?? 0);
          const pct = isValueMode ? (raw / maxValue) * 100 : Math.max(0, Math.min(100, raw));
          const label = isValueMode ? `${d.date ?? ""}: ${raw} taken` : `${d.date ?? ""}: ${raw}%`;
          return (
            <div
              key={i}
              className="flex-1 bg-primary/80 dark:bg-primary rounded-sm min-h-[4px]"
              style={{ height: `${Math.max(2, pct)}%` }}
              title={label}
            />
          );
        })}
      </div>
      <div className="text-xs text-muted-foreground flex justify-between mt-2">
        <span>{data[0]?.date ?? ""}</span>
        <span>{data[data.length - 1]?.date ?? ""}</span>
      </div>
    </div>
  );
}
