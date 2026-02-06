    import { redirect } from 'next/navigation';
    import { createClient } from "@/lib/supabase/server";
    import { logSelectQuery } from "@/lib/audit";


    export default async function MyServerComponent() {
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

        redirect(`/dashboard/${profile.user_type}`)
        
    }