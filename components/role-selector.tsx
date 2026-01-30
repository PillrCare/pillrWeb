"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";


interface Option {
      id: string;
      label: string;
    }

    const options: Option[] = [
      { id: 'patient', label: 'Patient' },
      { id: 'caregiver', label: 'Caregiver' },
    ];


export function RoleSelector({ className }: { className?: string }) {
    const [role, setRole] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const handleRoleChange = async (e: React.FormEvent) => {
        e.preventDefault();
        const supabase = createClient();
        setIsLoading(true);
        setErrorMessage(null);
            try {
                if (!role) {
                    setErrorMessage("Please select a role");
                    return;
                }

                // Get the currently signed-in user to target their profile row
                const {
                    data: { user },
                    error: userError,
                } = await supabase.auth.getUser();

                if (userError) throw userError;
                if (!user || !user.id) throw new Error("Not authenticated");
                
                // derive username from email local-part (before @), fallback to id
                const emailLocalPart = user.email ? user.email.split('@')[0] : null;
                const username = emailLocalPart ?? user.id;

                const { error: updateError } = await supabase
                    .from('profiles')
                    .update({ user_type: role, username })
                    .eq('id', user.id)
                    .select();

                if (updateError) throw updateError;
                
                // Route users based on selected role
                if (role === "patient") {
                    // For patients, show SMS opt-in first, then schedule setup
                    router.push("/auth/profile-setup/sms-opt-in");
                } else if (role === "caregiver") {
                    router.push("/dashboard");
                } else {
                    router.push("/");
                }
            } catch (error: unknown) {
                setErrorMessage(error instanceof Error ? error.message : "An error occurred");
            } finally {
                setIsLoading(false);
            }
    };

    return (
        <form onSubmit={handleRoleChange}>
            <div className="w-full flex flex-col items-center gap-4 mb-6">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="lg" className={cn(className, "px-6 py-3 text-lg h-12")}>
                            <Users size={24} className="mr-2" />
                        {role ? role.charAt(0).toUpperCase() + role.slice(1) : "Select role"}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-content" align="start">
                        <DropdownMenuRadioGroup value={role ?? ""} onValueChange={(val) => setRole(val)}>
                        {options.map((option) => (
                            <DropdownMenuRadioItem key={option.id} className="flex gap-2" value={option.id}>
                                <span>{option.label}</span>
                            </DropdownMenuRadioItem>
                        ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Finishing account..." : "Finish account"}
            </Button>
            {errorMessage ? <p className="text-sm text-red-600 mt-2">{errorMessage}</p> : null}
        </form>
        
    );
}
