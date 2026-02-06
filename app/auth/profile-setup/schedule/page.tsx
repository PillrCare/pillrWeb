import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import ScheduleEditor from "@/components/schedule-editor";



export default async function Page() {
  const supabase = await createClient();

  // get authenticated user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    // not authenticated — redirect to login
    redirect("/auth/login");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-4xl">
        <ScheduleEditor which_user={user.id} path="/dashboard/patient" />
      </div>
    </div>
  );
}
