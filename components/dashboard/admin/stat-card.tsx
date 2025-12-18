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
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-center gap-3">
          {icon && <div className="h-8 w-8 rounded-md bg-primary/10 text-primary grid place-items-center">{icon}</div>}
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="mt-1">{typeof value === "number" ? value.toLocaleString() : value}</CardDescription>
          </div>
        </div>
      </CardHeader>
      {subtitle && (
        <CardContent>
          <div className={`text-sm ${subtitleClassName ?? "text-muted-foreground"}`}>{subtitle}</div>
        </CardContent>
      )}
    </Card>
  );
}
