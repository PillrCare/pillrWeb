"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function ClaimDeviceContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const supabase = createClient();

    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [claiming, setClaiming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        const initialize = async () => {
            // Get params from URL
            const id = searchParams.get("id");

            if (!id) {
                setError("Invalid device setup link. Missing device ID.");
                setLoading(false);
                return;
            }

            setDeviceId(id);

            // Check if user is logged in
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                // Redirect to login but keep the params
                router.push(`/auth/login?redirect=/claim-device?id=${id}`);
                return;
            }

            setUserId(user.id);

            // Check if device is already claimed
            const { data: existingDevice } = await supabase
                .from("user_device")
                .select("device_id, user_id")
                .eq("device_id", id)
                .single();

            if (existingDevice?.user_id) {
                setError("This device has already been claimed.");
                setLoading(false);
                return;
            }

            setLoading(false);
        };

        initialize();
    }, [searchParams, router, supabase]);

    const handleClaim = async () => {
        if (!deviceId || !userId) return;

        setClaiming(true);
        setError(null);

        try {
            // Insert new device row
            const { data, error: claimError } = await supabase
                .from("user_device")
                .insert({
                    device_id: deviceId,
                    user_id: userId,
                    is_active: true
                })
                .select();

            console.log("Insert result:", { data, error: claimError });

            if (claimError) {
                console.error("Failed to claim device:", claimError);
                // Check if it's a duplicate key error
                if (claimError.code === '23505') {
                    setError("This device has already been claimed.");
                } else {
                    setError(`Failed to claim device: ${claimError.message || JSON.stringify(claimError)}`);
                }
                return;
            }

            // Log the action
            await supabase.from("caregiver_logs").insert({
                caregiver_id: userId,
                patient_id: userId, // Self-setup
                device_id: deviceId,
                action: "device_claimed",
                details: `Device ${deviceId} claimed successfully`
            });

            // Redirect to dashboard
            router.push("/dashboard?device_claimed=true");
        } catch (e) {
            console.error("Error claiming device:", e);
            setError("An unexpected error occurred. Please try again.");
        } finally {
            setClaiming(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-lg">Verifying device...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Setup Error</h2>
                    <p className="text-red-800 mb-6">{error}</p>
                    <button
                        onClick={() => router.push("/dashboard")}
                        className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                        Go to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
            <div className="max-w-lg w-full bg-white rounded-lg shadow-xl p-8">
                <div className="text-center mb-6">
                    <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Device Found!</h1>
                    <p className="text-gray-600">Device ID: {deviceId?.slice(-8).toUpperCase()}</p>
                </div>

                <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
                    <p className="text-sm text-blue-800">
                        <strong>Next steps:</strong> After claiming, you'll be able to enroll fingerprints and configure medication schedules.
                    </p>
                </div>

                <button
                    onClick={handleClaim}
                    disabled={claiming}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {claiming ? "Claiming Device..." : "Claim This Device"}
                </button>
            </div>
        </div>
    );
}

export default function ClaimDevicePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        }>
            <ClaimDeviceContent />
        </Suspense>
    );
}
