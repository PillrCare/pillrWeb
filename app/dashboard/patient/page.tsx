import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import DeviceLog from '@/components/dashboard/device-log';
import UserStats from "@/components/dashboard/user-stats";
import GenerateCode from "@/components/generate_code";
import EnrollButton from "@/components/enroll-button";
import Schedule from "@/components/dashboard/schedule";
import type { Tables } from '@/lib/types';
import TodaysSchedule from "@/components/dashboard/todays-schedule";
import EmergencyUnlockButton from "@/components/dashboard/emergency-unlock-button";
import DeviceSetupBanner from "@/components/dashboard/device-setup-banner";

type DeviceLogRow = Tables<"device_log">;
type ScheduleEvent = Tables<"weekly_events">;
type PatientStatsRow = Tables<"patient_stats">;

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

  if (profile.user_type !== 'patient') {
    redirect(`/dashboard/${profile.user_type}`)
  }


  const { data: device, error: deviceError } = await supabase
    .from('user_device')
    .select("*")
    .eq('user_id', userId)
    .maybeSingle();
  
  if (profileError) {
    // handle or surface the error — here we redirect or you could render an error UI
    console.error("Failed to load profile:", profileError);
    // Optionally redirect, show an error, or return a server error page
    redirect("/auth/login");
  }

  // fetch recent device_log rows for this user's device (if any)
  let deviceLog: DeviceLogRow[] = [];
  if (device?.device_id) {
    const { data: logData, error: logError } = await supabase
      .from('device_log')
      .select('*')
      .eq('device_id', device.device_id)
      .order('time_stamp', { ascending: false })
      .limit(50);

    if (logError) {
      console.error('Failed to load device_log:', logError);
    } else if (logData) {
      deviceLog = logData;
    }
  }

  // Fetch patient statistics from the view
  let patientStats: PatientStatsRow | null = null;
  if (device?.device_id) {
    const { data: statsData, error: statsError } = await supabase
      .from('patient_stats')
      .select('*')
      .eq('patient_id', userId)
      .maybeSingle();

    if (statsError) {
      console.error('Failed to load patient stats:', statsError);
    } else if (statsData) {
      patientStats = statsData;
    }
  }

  // Fetch schedule regardless of device status - users should see their schedule
  let schedule: ScheduleEvent[] = [];
  const { data: scheduleData, error: scheduleError } = await supabase
    .from('weekly_events')
    .select(`
      *,
      medications (
        id,
        schedule_id,
        name,
        brand_name,
        generic_name,
        adverse_reactions,
        drug_interaction
      )
    `)
    .eq('user_id', userId)
    .order('day_of_week', { ascending: true })
    .order('dose_time', { ascending: true })

  if (scheduleError) {
    console.error('Failed to load schedule:', scheduleError);
  } else if (scheduleData) {
    schedule = scheduleData;
  }

  // Pass all device logs; client will interpret in local timezone

  
  if (deviceError) {
    // handle or surface the error — here we redirect or you could render an error UI
    console.error("Failed to load device:", deviceError);
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full bg-accent text-sm p-3 px-5 rounded-md text-foreground flex justify-between items-center">
        <div className="flex-down gap-3 items-center">
          <h2 className="font-bold text-2xl">{profile?.username ?? "No username"}</h2>
          <h4 className="font-semibold text-2xs mb-2">{profile?.user_type ?? "No role"}</h4>
        </div>
        <div className="flex inline">
          <GenerateCode/>
          <EmergencyUnlockButton patientId={user.id}/>

        </div>
      </div>

      {!device && (
        <div>
          <DeviceSetupBanner />
        </div>
      )}

      <div>
        <UserStats patientStats={patientStats} />
      </div>

      <div>
        <TodaysSchedule schedule={schedule} deviceLog={deviceLog} />
      </div>

      <div>
        <Schedule schedule={schedule} />
      </div>

      <div>
        <DeviceLog deviceLog={deviceLog} />
      </div>

      

      

      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Device Actions</h2>
        <EnrollButton userId={user.id}/>
      </div>
      
    </div>
  );
}
