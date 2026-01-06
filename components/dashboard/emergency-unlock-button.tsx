"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface EmergencyUnlockButtonProps {
    patientId: string;
}

export default function EmergencyUnlockButton({ patientId }: EmergencyUnlockButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const supabase = createClient();

    const handleEmergencyUnlock = async () => {
        setIsLoading(true);
        try {
            const { error } = await supabase
                .from('device_commands')
                .update({ emergency_unlock: true })
                .eq('user_id', patientId);

            if (error) {
                console.error('Failed to trigger emergency unlock:', error);
                alert('Failed to trigger emergency unlock');
            } else {
                alert('Emergency unlock triggered successfully');
            }
        } catch (e) {
            console.error('Error triggering emergency unlock:', e);
            alert('Error triggering emergency unlock');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            className="p-2 rounded border bg-orange-500 hover:bg-orange-600 text-white disabled:bg-gray-400 disabled:cursor-not-allowed"
            onClick={handleEmergencyUnlock}
            disabled={isLoading}
        >
            {isLoading ? 'Unlocking...' : 'Emergency Unlock'}
        </button>
    );
}
