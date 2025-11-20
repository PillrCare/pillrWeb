    import { redirect } from 'next/navigation';
    import { createClient } from "@/lib/supabase/server";


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

        if (profileError) {
            // handle or surface the error — here we redirect or you could render an error UI
            console.error("Failed to load profile:", profileError);
            // Optionally redirect, show an error, or return a server error page
            redirect("/auth/login");
        }

        redirect(`/dashboard/${profile.user_type}`)
        
    }