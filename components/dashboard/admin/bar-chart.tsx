import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BarDatum = { label: string; value: number };

function barColor(value: number): string {
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
                <span className="text-xs font-medium" style={{ color: barColor(d.value) }}>
                  {d.value}%
                </span>
              )}
              <div
                className="w-full rounded-sm min-h-[4px]"
                style={{ height: `${(d.value / max) * 100}%`, backgroundColor: barColor(d.value) }}
                title={`${d.label}: ${d.value}%`}
              />
              <span className="text-xs text-muted-foreground">{d.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">Avg Adherence %</div>
      </CardContent>
    </Card>
  );
}
