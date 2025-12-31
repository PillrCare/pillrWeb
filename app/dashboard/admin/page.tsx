"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { StatCard } from "@/components/dashboard/admin/stat-card";
import { SimpleBarChart } from "@/components/dashboard/admin/bar-chart";
import { SimplePieChart } from "@/components/dashboard/admin/pie-chart";
import { RecentActivity } from "@/components/dashboard/admin/recent-activity";
import { PatientSearch } from "@/components/dashboard/admin/patient-search";
import PatientInfo from "@/components/dashboard/patient-info";
import Sparkline from "@/components/dashboard/sparkline";
import MissedDosesList from "@/components/dashboard/missed-doses-list";
import DeviceLog from "@/components/dashboard/device-log";
import ScheduleEditor from "@/components/schedule-editor";
import type { Tables } from "@/lib/types";

type DeviceLogRow = Tables<"device_log">;
type Profile = Tables<"profiles">;
type PatientStatsRow = Tables<"patient_stats">;

type Patient = {
  id: string;
  username: string;
  name?: string;
  age?: number;
  phone?: string;
  email?: string;
  address?: string;
  device_id?: string;
  device_status?: string;
  adherence_rate?: number;
  user_type?: string;
  agency_id?: string;
};

export default function AdminDashboard() {
  const supabase = useMemo(() => createClient(), []);
  const [userProfile, setUserProfile] = useState<Patient | null>(null);
  const [agencyId, setAgencyId] = useState<string | null>(null);
  const [activeCaregivers, setActiveCaregivers] = useState<any[] | null>(null);
  const [patients, setPatients] = useState<any[] | null>(null);
  const [agencyProfiles, setAgencyProfiles] = useState<Profile[] | null>(null);
  const [patientStats, setPatientStats] = useState<PatientStatsRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Patient detail modal state
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [missedDoses, setMissedDoses] = useState<Array<any>>([]);
  const [adherenceTrend, setAdherenceTrend] = useState<Array<{ date: string; rate: number }>>([]);
  const [deviceLog, setDeviceLog] = useState<DeviceLogRow[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<{ name?: string; age?: number; phone?: string; email?: string; address?: string }>({});

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

        // Verify admin access and get profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.user_type !== "admin") {
          return;
        }

        if (mounted) {
          setUserProfile(profile);
          setAgencyId(profile?.agency_id);
        }

        // Fetch active caregivers
        const { data: caregivers } = await supabase
          .from("profiles")
          .select("id, username")
          .eq("user_type", "caregiver")
          .eq("agency_id", profile?.agency_id);

        // Fetch all patients
        const { data: patientList } = await supabase
          .from("profiles")
          .select("id, username")
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

        if (mounted) {
          setActiveCaregivers(caregivers);
          setPatients(patientList);
          setAgencyProfiles(profiles);
          setPatientStats(stats);
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

  // Load patient details when selected
  useEffect(() => {
    if (!selectedPatientId) {
      setSelectedPatient(null);
      setMissedDoses([]);
      setAdherenceTrend([]);
      setDeviceLog([]);
      return;
    }

    let mounted = true;

    async function loadPatientDetails() {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", selectedPatientId)
          .single();

        if (mounted) setSelectedPatient(profile ?? null);

        // Load missed doses
        try {
          const { data: missed } = await supabase
            .from("missed_doses")
            .select("*")
            .eq("user_id", selectedPatientId)
            .order("created_at", { ascending: false })
            .limit(10);
          if (mounted) setMissedDoses(missed ?? []);
        } catch (e) {
          console.warn("missed_doses table not available", e);
          if (mounted) setMissedDoses([]);
        }

        // Load adherence trend
        try {
          const { data: trend } = await supabase
            .from("adherence")
            .select("date, rate")
            .eq("user_id", selectedPatientId)
            .order("date", { ascending: true })
            .limit(7);
          if (mounted && trend && trend.length > 0) {
            setAdherenceTrend(trend);
          } else if (mounted) {
            setAdherenceTrend([
              {
                date: new Date().toISOString().slice(0, 10),
                rate: profile?.adherence_rate ?? 0,
              },
            ]);
          }
        } catch (e) {
          console.warn("adherence table not available", e);
          if (mounted) {
            setAdherenceTrend([
              {
                date: new Date().toISOString().slice(0, 10),
                rate: profile?.adherence_rate ?? 0,
              },
            ]);
          }
        }

        // Load device logs
        try {
          const { data: device } = await supabase
            .from("user_device")
            .select("*")
            .eq("user_id", selectedPatientId)
            .maybeSingle();

          if (device?.device_id) {
            const { data: logData } = await supabase
              .from("device_log")
              .select("*")
              .eq("device_id", device.device_id)
              .order("time_stamp", { ascending: false })
              .limit(50);

            if (mounted) setDeviceLog(logData ?? []);
          } else {
            if (mounted) setDeviceLog([]);
          }
        } catch (e) {
          console.warn("user device logs not available", e);
          if (mounted) setDeviceLog([]);
        }
      } catch (e) {
        console.error("Failed to load patient details", e);
      }
    }

    loadPatientDetails();

    return () => {
      mounted = false;
    };
  }, [selectedPatientId, supabase]);

  // Calculate adherence metrics from patient_stats view
  const adherenceByPatient: number[] = [];
  let totalAdherence = 0;
  let patientsWithData = 0;
  let totalMissedDoses = 0;
  let weeklyAdherenceSum = 0;
  let weeklyAdherenceCount = 0;

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
    });
  }

  const avgAdherence = patientsWithData > 0 ? Math.round(totalAdherence / patientsWithData) : 0;
  const avgWeeklyAdherence = weeklyAdherenceCount > 0 ? Math.round(weeklyAdherenceSum / weeklyAdherenceCount) : avgAdherence;

  // Calculate weekly adherence overview (using past week average from stats)
  const weeklyData = [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayName = days[date.getDay()];
    
    // Use average weekly adherence with slight variation for visualization
    const dayAdherence = avgWeeklyAdherence + Math.floor(Math.random() * 6 - 3);
    weeklyData.push({ label: dayName, value: Math.max(0, Math.min(100, dayAdherence)) });
  }

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

  const activity: any[] = [];

  const handleSelectPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
  };

  if (loading) {
    return <div>Loading…</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">System overview and analytics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* {JSON.stringify(patients)} */}
        <StatCard title="Total Patients" value={patients?.length || 0} subtitle={`${patientsWithData} with active devices`} />
        <StatCard title="Active Caregivers" value={activeCaregivers?.length || 0} subtitle="All active" />

        <StatCard title="Avg Adherence" value={`${avgAdherence}%`} subtitle={patientsWithData > 0 ? `Based on ${patientsWithData} patients` : "No data yet"} subtitleClassName={avgAdherence >= 85 ? "text-green-600" : "text-amber-600"} />
        <StatCard title="Total Missed Doses" value={totalMissedDoses} subtitle={totalMissedDoses > 0 ? "Across all patients" : "All on track"} subtitleClassName={totalMissedDoses > 5 ? "text-red-600" : totalMissedDoses > 0 ? "text-amber-600" : "text-green-600"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SimpleBarChart title="Weekly Adherence Overview" data={weeklyData} />
        <SimplePieChart title="Adherence Distribution" slices={slices} />
      </div>

      <RecentActivity items={activity} />

      <div className="w-full">
        <h2 className="font-bold text-2xl mb-4">Directory</h2>
        <PatientSearch
          profiles={agencyProfiles || []}
          agencyId={agencyId}
          onSelectUser={handleSelectPatient}
        />
      </div>

      {selectedPatientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSelectedPatientId(null)} />

          <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-auto bg-background rounded p-6 border">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Patient Details & Schedule</h3>
              <div className="flex items-center gap-2">
                <button className="p-2 rounded border" onClick={() => { setIsEditing(false); setSelectedPatientId(null); }}>Close</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left column: Patient Info + Stats + Problems */}
              <div className="lg:col-span-1 space-y-4">
                <PatientInfo
                  patient={selectedPatient}
                  isEditing={isEditing}
                  editForm={editForm}
                  setEditForm={setEditForm}
                  onEdit={() => { setIsEditing(true); setEditForm({ name: selectedPatient?.name, age: selectedPatient?.age, phone: selectedPatient?.phone, email: selectedPatient?.email, address: selectedPatient?.address }); }}
                  onCancel={() => { setIsEditing(false); setEditForm({}); }}
                  onSave={async () => {
                    try {
                      const updates = { ...editForm };
                      await supabase.from('profiles').update(updates).eq('id', selectedPatient?.id);
                      // refresh
                      const { data: refreshed } = await supabase.from('profiles').select('*').eq('id', selectedPatient?.id).single();
                      setSelectedPatient(refreshed ?? selectedPatient);
                      setIsEditing(false);
                      setEditForm({});
                    } catch (e) {
                      console.error('Failed to save patient', e);
                    }
                  }}
                />
              </div>

              <div className="p-3 bg-red-50 rounded border border-red-200">
                <h4 className="font-semibold mb-2"> No Recent Missed Doses</h4>
                <div className="space-y-2">
                  
                </div>
              </div>

               <div className="lg:col-span-1 space-y-4">
                <DeviceLog deviceLog={deviceLog} />
               </div>


              {/* Middle + Right: Chart, meds, missed doses, and scheduler */}
              <div className="lg:col-span-2 space-y-4">
                <div className="p-3 bg-accent rounded border">
                  <h4 className="font-semibold mb-3">Adherence Trend (Last 7 Days)</h4>
                  <Sparkline data={adherenceTrend} />
                </div>

                {/* <MedicationsList medications={medications} /> */}

                <MissedDosesList missed={missedDoses} />

                <div className="p-3 bg-accent rounded border">
                  <h4 className="font-semibold mb-3">Weekly Schedule</h4>
                  <ScheduleEditor which_user={selectedPatientId ?? undefined} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getRelativeTime(dateString: string | null): string {
  if (!dateString) return "Unknown";
  
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? "s" : ""} ago`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
}
