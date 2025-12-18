import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type BarDatum = { label: string; value: number };

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
            <div key={d.label} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
              <div
                className="w-full bg-blue-300 rounded-sm min-h-[4px]"
                style={{ height: `${(d.value / max) * 100}%` }}
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
