import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

import DeviceLog from '@/components/dashboard/device-log';
import UserStats from "@/components/dashboard/user-stats";
import GenerateCode from "@/components/generate_code";
import EnrollButton from "@/components/enroll-button";
import Schedule from "@/components/dashboard/schedule";


import type { DeviceLogRow, ScheduleEvent } from '@/lib/types';
import TodaysSchedule from "@/components/dashboard/todays-schedule";

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
  let schedule: ScheduleEvent[] = [];
  if (device?.device_id) {
    const { data: scheduleData, error: scheduleError } = await supabase
      .from('weekly_events')
      .select('*')
      .eq('user_id', userId)
      .order('dose_time', { ascending: true })

    if (scheduleError) {
      console.error('Failed to load device_log:', scheduleError);
    } else if (scheduleData) {
      schedule = scheduleData;
    }
  }

  // Filter device logs for today only
  const todaysLogs = deviceLog.filter(log => {
    const logDate = new Date(log.time_stamp);
    const today = new Date();
    return logDate.toDateString() === today.toDateString();
  });

  
  if (deviceError) {
    // handle or surface the error — here we redirect or you could render an error UI
    console.error("Failed to load device:", deviceError);
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex-down gap-3 items-center">
          <h2 className="font-bold text-2xl">{profile?.username ?? "No username"}</h2>
          <h4 className="font-semibold text-2xs mb-2">{profile?.user_type ?? "No role"}</h4>
        </div>
      </div>

      <div>
        <UserStats deviceLog={deviceLog} />
      </div>

      <div>
        <TodaysSchedule schedule={schedule} deviceLog={todaysLogs} />
      </div>

      <div>
        <Schedule schedule={schedule} />
      </div>

      <div>
        <DeviceLog deviceLog={deviceLog} />
      </div>

      <div>
        <GenerateCode/>
      </div>

      

      <div className="flex flex-col gap-2 items-start">
        <h2 className="font-bold text-2xl mb-4">Your device:</h2>
        <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          <h2 className="font-bold text-2xl">{device?.device_id ?? "No device"}</h2>
          <h4 className="font-semibold text-2xs mb-2">{device?.is_active ? "Active": "Not active"}</h4>
        </pre>

        {/* <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
          {JSON.stringify(profile, null, 2)}
        </pre> */}
        <EnrollButton userId={user.id}/>
      </div>
      
    </div>
  );
}
