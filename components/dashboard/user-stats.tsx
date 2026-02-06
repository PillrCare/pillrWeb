"use client";

import type { Tables } from "@/lib/types";

type PatientStatsRow = Tables<"patient_stats">;

export default function UserStats({ patientStats }: { patientStats: PatientStatsRow | null }) {

  if (!patientStats) {
    return (
      <div className="bg-card border rounded-xl shadow-sm">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-lg font-semibold">Your Statistics</h3>
        </div>
        <div className="p-6 text-sm text-muted-foreground">No statistics available yet</div>
      </div>
    );
  }

  const adherence = patientStats.on_time_adherence_pct ? parseFloat(String(patientStats.on_time_adherence_pct)) : 0;
  const weeklyAdherence = patientStats.adherence_past_week_pct ? parseFloat(String(patientStats.adherence_past_week_pct)) : 0;
  const monthlyAdherence = patientStats.adherence_past_month_pct ? parseFloat(String(patientStats.adherence_past_month_pct)) : 0;
  const searchSuccessRate = patientStats.search_success_rate_pct ? parseFloat(String(patientStats.search_success_rate_pct)) : 0;

  const getAdherenceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600 dark:text-green-400";
    if (rate >= 80) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="bg-card border rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-6 border-b">
        <h3 className="text-lg font-semibold">Your Statistics</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overall Adherence</p>
          <p className={`text-3xl font-bold ${getAdherenceColor(adherence)}`}>
            {adherence.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {patientStats.on_time_count || 0} of {patientStats.total_events || 0} on time
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Past Week</p>
          <p className={`text-3xl font-bold ${getAdherenceColor(weeklyAdherence)}`}>
            {weeklyAdherence.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Past Month</p>
          <p className={`text-3xl font-bold ${getAdherenceColor(monthlyAdherence)}`}>
            {monthlyAdherence.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Missed Doses</p>
          <p className={`text-3xl font-bold ${(patientStats.missed_doses || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {patientStats.missed_doses || 0}
          </p>
          <p className="text-xs text-muted-foreground">Total missed</p>
        </div>
      </div>

      <div className="border-t p-6 bg-muted/30">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Total Opens</p>
            <p className="text-lg font-semibold">{patientStats.total_opens || 0}</p>
          </div>
      
          <div>
            <p className="text-muted-foreground mb-1">Emergency Accesses</p>
            <p className="text-lg font-semibold">{patientStats.emercency_accesses || 0}</p>
          </div>
          <div>
            <p className="text-muted-foreground mb-1">Unauthorized Attempts</p>
            <p className="text-lg font-semibold">{patientStats.failed_searches || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );

}

