import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { logSelectQuery } from "@/lib/audit";

import PatientView from "@/components/dashboard/patient-view";
import ConnectPatient from "@/components/connect_patient";  

export default async function DashboardPatient() {
  const supabase = await createClient();

  // get authenticated user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    // not authenticated — redirect to login
    redirect("/auth/login");
  }

  const userId = user.id;

  // fetch profile row
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  // Log PHI access
  await logSelectQuery(userId, 'profiles', { data: profile, error: profileError }, { record_id: userId });

  if (profileError) {
    // handle or surface the error — here we redirect or you could render an error UI
    console.error("Failed to load profile:", profileError);
    // Optionally redirect, show an error, or return a server error page
    redirect("/auth/login");
  }

  // Redirect to SMS preferences if user hasn't seen the opt-in page
  if (!profile.sms_opt_in_shown) {
    redirect("/dashboard/sms-preferences");
  }

  if (profile.user_type !== 'caregiver') {
    redirect(`/dashboard/${profile.user_type}`)
  }

  // Fetch caregiver's patients via relationship table
  const { data: relationships, error: relError } = await supabase
    .from("caregiver_patient")
    .select(`
      patient_id,
      profiles!fk_patient_profile (
        id,
        username,
        user_type,
        agency_id,
        timezone,
        updated_at
      )
    `)
    .eq("caregiver_id", userId);

  // Log PHI access (caregiver viewing patient relationships and patient profiles)
  await logSelectQuery(userId, 'caregiver_patient', { data: relationships, error: relError });
  // Note: Patient profiles are accessed via join - the relationship access is logged above

  if (relError) {
    console.error("Failed to load patients:", relError);
  }

  // Extract patient profiles from join result
  // Foreign key relationships return as objects, not arrays
  const patients = relationships?.map((r: any) => r.profiles).filter((p: any) => p != null) ?? [];

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
        {/* Header Card */}
        <div className="w-full bg-card border rounded-xl shadow-sm p-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold">{profile?.username ?? "No username"}</h1>
            <p className="text-sm text-muted-foreground capitalize">{profile?.user_type ?? "No role"}</p>
          </div>
        </div>

        {/* Patients Section */}
        <div className="w-full bg-card border rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl font-semibold">Your Patients</h2>
            <ConnectPatient/>
          </div>
          <PatientView initialPatients={patients}/>
        </div>
      </div>
  );
}
