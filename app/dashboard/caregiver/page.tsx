import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

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

  if (profile.user_type !== 'caregiver') {
    redirect(`/dashboard/${profile.user_type}`)
  }
  
  if (profileError) {
    // handle or surface the error — here we redirect or you could render an error UI
    console.error("Failed to load profile:", profileError);
    // Optionally redirect, show an error, or return a server error page
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex-down gap-3 items-center">
          <h2 className="font-bold text-2xl">{profile?.username ?? "No username"}</h2>
          <h4 className="font-semibold text-2xs mb-2">{profile?.user_type ?? "No role"}</h4>
        </div>
      </div>
{/* 
      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your user details</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(profile, null, 2)}
        </pre>
      </div> */}

      <div className="w-full">
        <div className="w-full flex justify-between items-center">
          <h2 className="font-bold text-2xl mb-4">Your patients</h2>
          <div>
            <ConnectPatient/>
          </div>
        </div>
        <PatientView/>
      </div>
      
      
    </div>
  );
}
