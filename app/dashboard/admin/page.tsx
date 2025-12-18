import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/admin/stat-card";
import { SimpleBarChart } from "@/components/dashboard/admin/bar-chart";
import { SimplePieChart } from "@/components/dashboard/admin/pie-chart";
import { RecentActivity } from "@/components/dashboard/admin/recent-activity";
import { PatientSearch } from "@/components/dashboard/admin/patient-search";

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Get authenticated user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    redirect("/auth/login");
  }

  // Verify admin access
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.user_type !== "admin") {
    redirect(`/dashboard/${profile?.user_type || ""}`);
  }

  // const { data: people } = await supabase
  //   .from("profiles")
  //   .select("id, username, user_type")

  // const activeCaregivers = people?.filter((x) => x.user_type = "caregiver")
  // const patients = people?.filter((x) => x.user_type = "patient")


  // Fetch active caregivers
  const { data: activeCaregivers } = await supabase
    .from("profiles")
    .select("id, username")
    .eq("user_type", "caregiver");

  // Fetch all patients with their device logs for adherence calculation
  const { data: patients } = await supabase
    .from("profiles")
    .select("id, username")
    // .select("id, username, user_device(device_id)")
    .eq("user_type", "patient");

  // Fetch caregiver-patient relationships
  const { data: caregiver_patient } = await supabase
    .from("caregiver_patient")
    .select("caregiver_id, patient_id");

  console.log(patients)
  

  // Calculate adherence metrics
  let totalAdherence = 0;
  let patientsWithData = 0;
  const adherenceByPatient: number[] = [];

  // if (patients) {
  //   for (const patient of patients) {
  //     const deviceId = patient.user_device?.[0]?.device_id;
  //     if (deviceId) {
  //       // Get weekly events for this patient
  //       const { data: events } = await supabase
  //         .from("weekly_events")
  //         .select("*")
  //         .eq("user_id", patient.id);

  //       // Get device logs from past week
  //       const weekAgo = new Date();
  //       weekAgo.setDate(weekAgo.getDate() - 7);
        
  //       const { data: logs } = await supabase
  //         .from("device_log")
  //         .select("*")
  //         .eq("device_id", deviceId)
  //         .gte("time_stamp", weekAgo.toISOString())
  //         .eq("search_success", true);

  //       if (events && events.length > 0) {
  //         const expectedDoses = events.length * 7; // events per week
  //         const actualDoses = logs?.length || 0;
  //         const adherence = Math.min(100, (actualDoses / expectedDoses) * 100);
          
  //         totalAdherence += adherence;
  //         patientsWithData++;
  //         adherenceByPatient.push(adherence);
  //       }
  //     }
  //   }
  // }

  const avgAdherence = patientsWithData > 0 ? Math.round(totalAdherence / patientsWithData) : 0;

  // Calculate weekly adherence overview (past 7 days)
  const weeklyData = [];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayName = days[date.getDay()];
    
    // Simple mock calculation - you'd want to calculate actual adherence per day
    const dayAdherence = avgAdherence + Math.floor(Math.random() * 10 - 5);
    weeklyData.push({ label: dayName, value: Math.max(0, Math.min(100, dayAdherence)) });
  }

  // Calculate adherence distribution
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

  // Fetch recent profile updates (mock activity for now)
  const { data: recentEvents } = await supabase
    .from("device_log")
    .select("*")
    .order("time_stamp", { ascending: false })
    .limit(5);

  const activity = recentEvents?.map(p => ({
    device: p.device_id || "Unknown user",
    action: "Updated patient information",
    time: getRelativeTime(p.time_stamp),
  })) || [];

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
        <StatCard title="Low Adherence" value={distribution.poor + distribution.low} subtitle={distribution.poor + distribution.low > 0 ? "Needs attention" : "All good"} subtitleClassName={distribution.poor + distribution.low > 0 ? "text-red-600" : "text-green-600"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SimpleBarChart title="Weekly Adherence Overview" data={weeklyData} />
        <SimplePieChart title="Adherence Distribution" slices={slices} />
      </div>

      <RecentActivity items={activity} />

      <div className="w-full">
        <h2 className="font-bold text-2xl mb-4">Patient Directory</h2>
        <PatientSearch
          patients={patients || []}
          caregivers={activeCaregivers || []}
          caregiver_patient={caregiver_patient || []}
        />
      </div>
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
