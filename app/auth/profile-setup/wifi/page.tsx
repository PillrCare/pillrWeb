import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

import WifiSetup from "@/components/wifi-setup";



export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const supabase = await createClient();

  // get authenticated user
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    // not authenticated — redirect to login
    redirect("/auth/login");
  }

  // const userId = user.id;

  // Get returnTo parameter from URL, default to /dashboard
  const params = await searchParams;
  const returnTo = params.returnTo ?? "/dashboard";

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <WifiSetup path={returnTo} />
      </div>
    </div>
  );
}
