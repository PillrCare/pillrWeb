import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function SMSOptInPage() {
  const supabase = await createClient();

  // get authenticated user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    redirect("/auth/login");
  }

  // Redirect to SMS preferences page
  redirect("/dashboard/sms-preferences?returnTo=/auth/profile-setup/schedule");
}

