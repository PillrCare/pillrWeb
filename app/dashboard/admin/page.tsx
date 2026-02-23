"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/dashboard/admin/stat-card";
import { StackedDosesChart, MissedDosesByDayChart } from "@/components/dashboard/admin/bar-chart";
import { SimplePieChart } from "@/components/dashboard/admin/pie-chart";
import { RecentActivity } from "@/components/dashboard/admin/recent-activity";
import PatientView from "@/components/dashboard/patient-view";
import type { Tables } from "@/lib/types";

type Profile = Tables<"profiles">;
type PatientStatsRow = Tables<"patient_stats">;

export default function AdminDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeCaregivers, setActiveCaregivers] = useState<Profile[] | null>(null);
  const [patients, setPatients] = useState<Profile[] | null>(null);
  const [agencyProfiles, setAgencyProfiles] = useState<Profile[] | null>(null);
  const [patientStats, setPatientStats] = useState<PatientStatsRow[] | null>(null);
  const [doseEvents, setDoseEvents] = useState<{ expected_date: string; status: string }[] | null>(null);
  const [recentLogs, setRecentLogs] = useState<{ device_id: string; time_stamp: string; event_type: string | null; error_code: string | null }[] | null>(null);
  const [loading, setLoading] = useState(true);

  // Load admin profile and fetch data
  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const { data: userData, error: userError } = await supabase.auth.getUser();
        const user = userData?.user;

        if (userError || !user) {
          return;
        }

        setUserId(user.id);

        // Verify admin access and get profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.user_type !== "admin") {
          return;
        }

        // Redirect to SMS preferences if user hasn't seen the opt-in page
        if (profile && !profile.sms_opt_in_shown) {
          window.location.href = "/dashboard/sms-preferences";
          return;
        }

        if (mounted) {
          // profile is still used for subsequent queries; no need to store separately in state
        }

        // Fetch active caregivers
        const { data: caregivers } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_type", "caregiver")
          .eq("agency_id", profile?.agency_id);

        // Fetch all patients
        const { data: patientList } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_type", "patient")
          .eq("agency_id", profile?.agency_id);

        // Fetch all profiles in the same agency for directory search
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .eq("agency_id", profile?.agency_id);

        // Fetch patient statistics from the view
        const { data: stats } = await supabase
          .from("patient_stats")
          .select("*");

        // Fetch real per-day dose events for the past 7 days (filter by expected_date like patient-view)
        const patientIds = patientList?.map(p => p.id) ?? [];
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const startDate = sevenDaysAgo.toISOString().slice(0, 10);
        const { data: doseData } = patientIds.length > 0
          ? await supabase
              .from("scheduled_dose_events")
              .select("expected_date, status")
              .in("user_id", patientIds)
              .gte("expected_date", startDate)
              .order("expected_date", { ascending: true })
          : { data: [] };

        // Fetch recent device log entries using event_type (not deprecated boolean fields)
        const deviceIds = stats?.map(s => s.device_id).filter(Boolean) ?? [];
        const { data: logs } = deviceIds.length > 0
          ? await supabase
              .from("device_log")
              .select("device_id, time_stamp, event_type, error_code")
              .in("device_id", deviceIds)
              .order("time_stamp", { ascending: false })
              .limit(10)
          : { data: [] };

        if (mounted) {
          setActiveCaregivers(caregivers);
          setPatients(patientList);
          setAgencyProfiles(profiles);
          setPatientStats(stats);
          setDoseEvents(doseData);
          setRecentLogs(logs);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [supabase]);

  // Calculate adherence metrics from patient_stats view
  const adherenceByPatient: number[] = [];
  let totalAdherence = 0;
  let patientsWithData = 0;
  let totalMissedDoses = 0;
  let weeklyAdherenceSum = 0;
  let weeklyAdherenceCount = 0;
  let totalEmergencyAccesses = 0;

  if (patientStats && patientStats.length > 0) {
    patientStats.forEach(stat => {
      const adherence = stat.on_time_adherence_pct ? parseFloat(String(stat.on_time_adherence_pct)) : 0;
      const weeklyAdherence = stat.adherence_past_week_pct ? parseFloat(String(stat.adherence_past_week_pct)) : 0;

      if (adherence > 0 || (stat.total_events && stat.total_events > 0)) {
        adherenceByPatient.push(adherence);
        totalAdherence += adherence;
        patientsWithData++;
      }

      if (weeklyAdherence > 0) {
        weeklyAdherenceSum += weeklyAdherence;
        weeklyAdherenceCount++;
      }

      totalMissedDoses += stat.missed_doses || 0;
      totalEmergencyAccesses += stat.emercency_accesses || 0;
    });
  }

  const avgAdherence = patientsWithData > 0 ? Math.round(totalAdherence / patientsWithData) : 0;
  const avgWeeklyAdherence = weeklyAdherenceCount > 0 ? Math.round(weeklyAdherenceSum / weeklyAdherenceCount) : avgAdherence;

  // Build per-day dose counts from scheduled_dose_events (last 7 days)
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  type DayCounts = { label: string; dateStr: string; taken: number; missed: number; total: number; adherencePct: number; hasEvents: boolean };
  const dayCounts: DayCounts[] = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayName = days[date.getDay()];
    const dateStr = date.toISOString().slice(0, 10);

    const dayEvents = doseEvents?.filter(e => e.expected_date === dateStr) ?? [];
    const total = dayEvents.length;
    const taken = dayEvents.filter(e => e.status === "taken_on_time" || e.status === "taken_late").length;
    const missed = dayEvents.filter(e => e.status === "missed").length;
    const adherencePct = total > 0 ? Math.round((taken / total) * 100) : 0;

    dayCounts.push({
      label: dayName,
      dateStr,
      taken,
      missed,
      total,
      adherencePct,
      hasEvents: total > 0,
    });
  }

  // Detect multi-day gaps: >= 2 consecutive days with scheduled doses and adherence <= 60%
  const LOW_ADHERENCE_THRESHOLD = 60;
  const MIN_GAP_STREAK_DAYS = 2;
  const gapDayIndexes = new Set<number>();
  let streakStart = -1;
  for (let i = 0; i < dayCounts.length; i++) {
    const d = dayCounts[i];
    const isLow = d.hasEvents && d.adherencePct <= LOW_ADHERENCE_THRESHOLD;
    if (isLow) {
      if (streakStart === -1) streakStart = i;
    } else {
      if (streakStart !== -1 && i - streakStart >= MIN_GAP_STREAK_DAYS) {
        for (let j = streakStart; j < i; j++) gapDayIndexes.add(j);
      }
      streakStart = -1;
    }
  }
  if (streakStart !== -1 && dayCounts.length - streakStart >= MIN_GAP_STREAK_DAYS) {
    for (let j = streakStart; j < dayCounts.length; j++) gapDayIndexes.add(j);
  }

  const gapDays = gapDayIndexes.size;

  // Data for stacked chart (taken vs missed by day)
  const dosesByDayData = dayCounts.map((d) => ({
    label: d.label,
    dateStr: d.dateStr,
    taken: d.taken,
    missed: d.missed,
  }));

  // Data for missed-doses-by-day chart (adherence trend: how many missed per day)
  const missedByDayData = dayCounts.map((d, i) => ({
    label: d.label,
    dateStr: d.dateStr,
    missed: d.missed,
    isGap: gapDayIndexes.has(i),
  }));

  // Calculate adherence distribution from actual patient data
  const distribution = {
    high: adherenceByPatient.filter(a => a >= 90).length,
    medium: adherenceByPatient.filter(a => a >= 80 && a < 90).length,
    low: adherenceByPatient.filter(a => a >= 70 && a < 80).length,
    poor: adherenceByPatient.filter(a => a < 70).length,
  };

  const slices = [
    { label: "90-100%", value: distribution.high, color: "#10b981" },
    { label: "80-89%", value: distribution.medium, color: "#f59e0b", labelColor: "text-amber-600" },
    { label: "70-79%", value: distribution.low, color: "#ef4444", labelColor: "text-red-500" },
    ...(distribution.poor > 0 ? [{ label: "Below 70%", value: distribution.poor, color: "#991b1b", labelColor: "text-red-700" }] : []),
  ];

  function formatRelativeTime(timestamp: string): string {
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  }

  function eventTypeToAction(eventType: string | null, errorCode: string | null): string {
    switch (eventType) {
      case "dispense_success": return "Medication dispensed";
      case "emergency_unlock": return "Emergency unlock";
      case "enrollment_success": return "Fingerprint enrolled";
      case "enrollment_failed": return "Fingerprint enrollment failed";
      case "auth_denied": return "Access denied";
      case "clear_templates": return "Templates cleared";
      case "error_sensor":
      case "error_wifi":
      case "error_schedule_sync":
        return errorCode ? `Device error: ${errorCode}` : `Device error: ${eventType}`;
      default: return "Device event";
    }
  }

  const activity = (recentLogs ?? []).map(log => ({
    device: `Device ${log.device_id.slice(-6)}`,
    action: eventTypeToAction(log.event_type, log.error_code),
    time: formatRelativeTime(log.time_stamp),
  }));

  if (loading) {
    return <div>Loading…</div>;
  }

  if (!userId) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border rounded-xl shadow-sm p-6">
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">System overview and analytics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Patients" value={patients?.length || 0} subtitle={`${patientsWithData} with active devices`} />
        <StatCard title="Active Caregivers" value={activeCaregivers?.length || 0} subtitle="All active" />
        <StatCard title="Avg Adherence" value={`${avgAdherence}%`} subtitle={patientsWithData > 0 ? `Based on ${patientsWithData} patients` : "No data yet"} subtitleClassName={avgAdherence >= 85 ? "text-green-600" : "text-amber-600"} />
        <StatCard title="Total Missed Doses" value={totalMissedDoses} subtitle={totalMissedDoses > 0 ? "Across all patients" : "All on track"} subtitleClassName={totalMissedDoses > 5 ? "text-red-600" : totalMissedDoses > 0 ? "text-amber-600" : "text-green-600"} />
        <StatCard
          title="Gap Days (Last 7d)"
          value={gapDays}
          subtitle={gapDays > 0 ? "Consecutive low-adherence days detected" : "No multi-day gaps"}
          subtitleClassName={gapDays > 0 ? "text-red-600" : "text-green-600"}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Avg Weekly Adherence" value={`${avgWeeklyAdherence}%`} subtitle="Past 7 days across patients" subtitleClassName={avgWeeklyAdherence >= 85 ? "text-green-600" : "text-amber-600"} />
        <StatCard title="Emergency Accesses" value={totalEmergencyAccesses} subtitle={totalEmergencyAccesses > 0 ? "Across all patients" : "None recorded"} subtitleClassName={totalEmergencyAccesses > 0 ? "text-amber-600" : "text-green-600"} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StackedDosesChart title="Weekly doses: taken vs missed" data={dosesByDayData} />
        <MissedDosesByDayChart title="Missed doses per day" data={missedByDayData} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SimplePieChart title="Adherence Distribution" slices={slices} />
      </div>

      {/* Recent Activity */}
      <RecentActivity items={activity} />

      {/* Directory */}
      <div className="bg-card border rounded-xl shadow-sm p-6">
        <h2 className="text-2xl font-semibold mb-6">Directory</h2>
        <PatientView
          initialPatients={agencyProfiles || []}
          showRoleFilters={true}
        />
      </div>
    </div>
  );
}
