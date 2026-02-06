import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type StatCardProps = {
  icon?: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  subtitleClassName?: string;
};

export function StatCard({ icon, title, value, subtitle, subtitleClassName }: StatCardProps) {
  return (
    <Card className="rounded-xl shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="flex items-center gap-3">
          {icon && <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary grid place-items-center">{icon}</div>}
          <div>
            <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
            <div className="text-2xl font-bold mt-1">{typeof value === "number" ? value.toLocaleString() : value}</div>
          </div>
        </div>
      </CardHeader>
      {subtitle && (
        <CardContent className="pt-0">
          <div className={`text-sm ${subtitleClassName ?? "text-muted-foreground"}`}>{subtitle}</div>
        </CardContent>
      )}
    </Card>
  );
}
