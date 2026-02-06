import { redirect } from "next/navigation";

import { ContactForm } from "@/components/contact-form";
import { createClient } from "@/lib/supabase/server";
import { logSelectQuery } from "@/lib/audit";

export default async function ContactPage() {
  const supabase = await createClient();

  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    redirect("/auth/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("username, user_type")
    .eq("id", user.id)
    .maybeSingle();

  // Log PHI access
  await logSelectQuery(user.id, 'profiles', { data: profile, error: profileError }, { record_id: user.id });

  if (profileError) {
    console.error("Failed to load profile:", profileError);
    redirect("/auth/login");
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8">

      <ContactForm
        user={{
          userId: user.id,
          email: user.email ?? null,
          username: profile?.username ?? null,
          userType: profile?.user_type ?? null,
        }}
      />
    </div>
  );
}
