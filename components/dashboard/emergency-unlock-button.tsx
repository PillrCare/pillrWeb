"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface EmergencyUnlockButtonProps {
    patientId: string;
}

export default function EmergencyUnlockButton({ patientId }: EmergencyUnlockButtonProps) {
    const supabase = createClient();
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const openModal = () => {
        setError(null);
        setShowModal(true);
    };

    const closeModal = () => {
        if (loading) return;
        setShowModal(false);
        setError(null);
    };

    const handleEmergencyUnlock = async () => {
        setLoading(true);
        setError(null);
        try {

            // Trigger emergency unlock
            const { error: unlockError } = await supabase
                .from('device_commands')
                .update({ 
                    emergency_unlock: true,
                })
                .eq('user_id', patientId);

            if (unlockError) {
                console.error('Failed to trigger emergency unlock:', unlockError);
                setError(unlockError.message ?? 'Failed to trigger emergency unlock');
                return;
            }

            setShowModal(false);
        } catch (e) {
            console.error('Error triggering emergency unlock:', e);
            setError('Error triggering emergency unlock');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Button
                variant="destructive"
                size="default"
                onClick={openModal}
                disabled={loading}
            >
                Emergency Open
            </Button>

            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => closeModal()} aria-hidden />

                    <Card className="relative w-full max-w-2xl">
                        <CardHeader className="relative">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={closeModal}
                                disabled={loading}
                                aria-label="Close dialog"
                                className="absolute top-4 right-4"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                            <CardTitle id="modal-title" className="text-2xl text-destructive pr-12">
                                Confirm Emergency Unlock
                            </CardTitle>
                            <CardDescription className="mt-2">
                                This action will unlock the device to the next scheduled dose.
                            </CardDescription>
                        </CardHeader>

                        <CardContent>
                            <div className="mb-6 p-4 bg-destructive/10 border-l-4 border-destructive rounded-lg">
                                <p className="text-base leading-relaxed">
                                    Are you sure you want to emergency open the device? This will unlock it to the next scheduled dose.
                                </p>
                            </div>

                            {error ? (
                                <div className="text-sm text-destructive mb-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20 font-medium">
                                    {error}
                                </div>
                            ) : null}
                        </CardContent>

                        <CardFooter className="flex justify-center gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                size="lg"
                                onClick={closeModal}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="lg"
                                onClick={handleEmergencyUnlock}
                                disabled={loading}
                            >
                                {loading ? "Unlocking..." : "Emergency Open"}
                            </Button>
                        </CardFooter>
                    </Card>
                </div>
            )}
        </>
    );
}
