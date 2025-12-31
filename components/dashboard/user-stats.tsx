"use client";

import type { Tables } from "@/lib/types";

type PatientStatsRow = Tables<"patient_stats">;

export default function UserStats({ patientStats }: { patientStats: PatientStatsRow | null }) {

  if (!patientStats) {
    return (
      <div className="rounded border">
        <div className="flex items-center justify-between p-3">
          <h3 className="text-lg font-semibold">Your Statistics</h3>
        </div>
        <div className="p-4 text-sm text-muted-foreground">No statistics available yet</div>
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
    <div className="rounded border">
      <div className="flex items-center justify-between p-3 border-b">
        <h3 className="text-lg font-semibold">Your Statistics</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Overall Adherence</p>
          <p className={`text-2xl font-bold ${getAdherenceColor(adherence)}`}>
            {adherence.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">
            {patientStats.on_time_count || 0} of {patientStats.total_events || 0} on time
          </p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Past Week</p>
          <p className={`text-2xl font-bold ${getAdherenceColor(weeklyAdherence)}`}>
            {weeklyAdherence.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">Last 7 days</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Past Month</p>
          <p className={`text-2xl font-bold ${getAdherenceColor(monthlyAdherence)}`}>
            {monthlyAdherence.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground">Last 30 days</p>
        </div>

        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">Missed Doses</p>
          <p className={`text-2xl font-bold ${(patientStats.missed_doses || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {patientStats.missed_doses || 0}
          </p>
          <p className="text-xs text-muted-foreground">Total missed</p>
        </div>
      </div>

      <div className="border-t p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Total Opens</p>
            <p className="font-semibold">{patientStats.total_opens || 0}</p>
          </div>
      
          <div>
            <p className="text-muted-foreground">Emergency Accesses</p>
            <p className="font-semibold">{patientStats.emercency_accesses || 0}</p>
          </div>
          {/* <div>
            <p className="text-muted-foreground">Enrolled Fingers</p>
            <p className="font-semibold">{patientStats.total_enrolled_fingers || 0}</p>
          </div> */}
          <div>
            <p className="text-muted-foreground">Unauthorized Attempts</p>
            <p className="font-semibold">{patientStats.failed_searches || 0}</p>
          </div>
          
        </div>
      </div>
    </div>
  );

}

