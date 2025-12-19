import { ContactForm } from "@/components/contact-form";
import { createClient } from "@/lib/supabase/server";

export default async function ContactPage() {
  const supabase = await createClient();

  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;

  let profile = null;
  if (user) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("username, user_type")
      .eq("id", user.id)
      .maybeSingle();

    if (!profileError && profileData) {
      profile = profileData;
    }
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <ContactForm
        user={{
          userId: user?.id ?? null,
          email: user?.email ?? null,
          username: profile?.username ?? null,
          userType: profile?.user_type ?? null,
        }}
      />
    </div>
  );
}
