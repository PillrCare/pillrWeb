"use client";

import type { Tables } from "@/lib/types";

type PatientStatsRow = Tables<"patient_stats">;
type DeviceMetricsRow = Tables<"device_metrics">;

export default function UserStats({
  patientStats,
  deviceMetrics,
}: {
  patientStats: PatientStatsRow | null;
  deviceMetrics: DeviceMetricsRow | null;
}) {

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

  const getAdherenceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600 dark:text-green-400";
    if (rate >= 80) return "text-amber-600 dark:text-amber-400";
    return "text-red-600 dark:text-red-400";
  };

  const totalOpens = deviceMetrics?.total_dispenses ?? patientStats.total_opens ?? 0;
  const emergencyAccesses = deviceMetrics?.total_emergency_unlocks ?? patientStats.emercency_accesses ?? 0;
  const unknownFingerprints = deviceMetrics?.total_unknown_fingerprints ?? patientStats.failed_searches ?? 0;
  const scheduleDenials = deviceMetrics?.total_schedule_denials ?? 0;
  const lastDispenseTime = deviceMetrics?.last_dispense_time ?? null;
  const avgDispenseWeight = deviceMetrics?.avg_dispense_weight ?? null;
  const totalErrors = deviceMetrics?.total_errors ?? 0;

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-card border rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-6 border-b">
        <h3 className="text-lg font-semibold">Your Statistics</h3>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6">
        <div className="flex flex-col space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Overall Adherence</p>
          <p className={`text-3xl font-bold ${getAdherenceColor(adherence)}`}>
            {adherence.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground min-h-[2.5rem]">
            {patientStats.on_time_count || 0} of {patientStats.total_events || 0} on time
          </p>
        </div>

        <div className="flex flex-col space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Past Week</p>
          <p className={`text-3xl font-bold ${getAdherenceColor(weeklyAdherence)}`}>
            {weeklyAdherence.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground min-h-[2.5rem]">Last 7 days</p>
        </div>

        <div className="flex flex-col space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Past Month</p>
          <p className={`text-3xl font-bold ${getAdherenceColor(monthlyAdherence)}`}>
            {monthlyAdherence.toFixed(1)}%
          </p>
          <p className="text-xs text-muted-foreground min-h-[2.5rem]">Last 30 days</p>
        </div>

        <div className="flex flex-col space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Missed Doses</p>
          <p className={`text-3xl font-bold ${(patientStats.missed_doses || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
            {patientStats.missed_doses || 0}
          </p>
          <p className="text-xs text-muted-foreground min-h-[2.5rem]">Total missed</p>
        </div>
      </div>

      <div className="border-t p-6 bg-muted/30">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
          <div>
            <p className="text-muted-foreground mb-1">Total Opens</p>
            <p className="text-lg font-semibold">{totalOpens}</p>
          </div>

          <div>
            <p className="text-muted-foreground mb-1">Emergency Accesses</p>
            <p className="text-lg font-semibold">{emergencyAccesses}</p>
          </div>

          <div>
            <p className="text-muted-foreground mb-1">Unknown Fingerprint Attempts</p>
            <p className="text-lg font-semibold">{unknownFingerprints}</p>
          </div>

          <div>
            <p className="text-muted-foreground mb-1">Out-of-Window Attempts</p>
            <p className="text-lg font-semibold">{scheduleDenials}</p>
          </div>

          <div>
            <p className="text-muted-foreground mb-1">Device Errors</p>
            <p className={`text-lg font-semibold ${totalErrors > 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
              {totalErrors}
            </p>
          </div>

          <div>
            <p className="text-muted-foreground mb-1">Last Opened</p>
            <p className="text-lg font-semibold">
              {lastDispenseTime ? formatTimestamp(lastDispenseTime) : "—"}
            </p>
          </div>

          {avgDispenseWeight !== null && (
            <div>
              <p className="text-muted-foreground mb-1">Avg Dispense Weight (g)</p>
              <p className="text-lg font-semibold">{avgDispenseWeight.toFixed(1)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

}
