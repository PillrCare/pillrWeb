import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { logSelectQuery } from "@/lib/audit";

import DeviceLog from '@/components/dashboard/device-log';
import UserStats from "@/components/dashboard/user-stats";
import GenerateCode from "@/components/generate_code";
import Schedule from "@/components/dashboard/schedule";
import type { Tables } from '@/lib/types';
import TodaysSchedule from "@/components/dashboard/todays-schedule";
import DeviceSetupBanner from "@/components/dashboard/device-setup-banner";
import DeviceCommandsCard from "@/components/dashboard/device-commands-card";

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

  if (profile.user_type !== 'patient') {
    redirect(`/dashboard/${profile.user_type}`)
  }


  const { data: device, error: deviceError } = await supabase
    .from('user_device')
    .select("*")
    .eq('user_id', userId)
    .maybeSingle();

  // Log PHI access
  await logSelectQuery(userId, 'user_device', { data: device, error: deviceError }, { record_id: device?.device_id || userId });
  
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

    // Log PHI access (device_log contains biometric data)
    await logSelectQuery(userId, 'device_log', { data: logData, error: logError }, { record_id: device.device_id });

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

    // Log PHI access
    await logSelectQuery(userId, 'patient_stats', { data: statsData, error: statsError }, { record_id: userId });

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

  // Log PHI access (weekly_events and medications contain medication schedules)
  await logSelectQuery(userId, 'weekly_events', { data: scheduleData, error: scheduleError }, { record_id: userId });
  // Note: medications are accessed via join, logged as part of weekly_events

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
    <div className="flex-1 w-full flex flex-col gap-6">
        {/* Header Card */}
        <div className="w-full bg-card border rounded-xl shadow-sm p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold">{profile?.username ?? "No username"}</h1>
              <p className="text-sm text-muted-foreground capitalize">{profile?.user_type ?? "No role"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <GenerateCode/>
            </div>
          </div>
        </div>

        {/* Device Setup or Device Commands */}
        {!device ? (
          <div>
            <DeviceSetupBanner />
          </div>
        ) : (
          <div>
            <DeviceCommandsCard patientId={user.id} />
          </div>
        )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <UserStats patientStats={patientStats} />
            </div>
            <div>
              <TodaysSchedule schedule={schedule} deviceLog={deviceLog} />
            </div>
          </div>

          {/* Schedule Section */}
          <div>
            <Schedule schedule={schedule} />
          </div>

          {/* Device Log Section */}
          <div>
            <DeviceLog deviceLog={deviceLog} />
          </div>
    </div>
  );
}
