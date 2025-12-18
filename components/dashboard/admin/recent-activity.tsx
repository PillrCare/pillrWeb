import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Activity = { device: string; action: string; time: string };

export function RecentActivity({ items }: { items: Activity[] }) {
  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 && <div className="text-sm text-muted-foreground">No recent activity</div>}
        <ul className="divide-y">
          {items.map((a, i) => (
            <li key={i} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{a.device}</div>
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
