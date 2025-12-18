import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Slice = { label: string; value: number; color: string; labelColor?: string };

export function SimplePieChart({ title, slices }: { title: string; slices: Slice[] }) {
  const total = slices.reduce((s, c) => s + c.value, 0) || 1;
  let current = 0;
  const gradient = slices
    .map((s) => {
      const start = (current / total) * 100;
      current += s.value;
      const end = (current / total) * 100;
      return `${s.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <div
            className="h-40 w-40 rounded-full"
            style={{ background: `conic-gradient(${gradient})` }}
            aria-label="Adherence distribution"
          />
          <ul className="space-y-2 text-sm">
            {slices.map((s) => (
              <li key={s.label} className="flex items-center gap-2">
                <span className="inline-block h-3 w-3 rounded-sm" style={{ backgroundColor: s.color }} />
                <span className={s.labelColor ?? "text-muted-foreground"}>
                  {s.label}: {s.value}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
