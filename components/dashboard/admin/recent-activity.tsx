import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Activity = { device: string; action: string; time: string };

export function RecentActivity({ items }: { items: Activity[] }) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 && <div className="text-sm text-muted-foreground text-center py-4">No recent activity</div>}
        <ul className="divide-y">
          {items.map((a, i) => (
            <li key={i} className="py-4 flex items-center justify-between hover:bg-muted/30 transition-colors rounded-lg px-2 -mx-2">
              <div>
                <div className="font-semibold">{a.device}</div>
                <div className="text-sm text-muted-foreground">{a.action}</div>
              </div>
              <div className="text-sm text-muted-foreground whitespace-nowrap">{a.time}</div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
