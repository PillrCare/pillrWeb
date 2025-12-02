import React from "react";

export default function Sparkline({ data = [] }: { data?: Array<{ date?: string; rate?: number }> }) {
  if (!data || data.length === 0) return <div className="text-sm text-muted-foreground">No adherence data</div>;

  return (
    <div>
      <div className="flex items-end gap-1 h-28">
        {data.map((d, i) => {
          const val = Math.max(0, Math.min(100, d.rate ?? 0));
          return <div key={i} className="flex-1 bg-background rounded-sm" style={{ height: `${val}%` }} title={`${d.date}: ${val}%`} />;
        })}
      </div>
      <div className="text-xs text-muted-foreground flex justify-between mt-2">
        <span>{data[0]?.date ?? ''}</span>
        <span>{data[data.length - 1]?.date ?? ''}</span>
      </div>
    </div>
  );
}
