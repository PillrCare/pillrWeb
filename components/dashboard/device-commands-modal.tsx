"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { X, AlertTriangle, Fingerprint } from "lucide-react";

interface DeviceCommandsModalProps {
    patientId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function DeviceCommandsModal({ patientId, open, onOpenChange }: DeviceCommandsModalProps) {
    const supabase = createClient();
    const [emergencyLoading, setEmergencyLoading] = useState(false);
    const [enrollLoading, setEnrollLoading] = useState(false);
    const [emergencyError, setEmergencyError] = useState<string | null>(null);
    const [enrollError, setEnrollError] = useState<string | null>(null);
    const [showEmergencyConfirm, setShowEmergencyConfirm] = useState(false);
    const [showEnrollInstructions, setShowEnrollInstructions] = useState(false);

    const closeModal = () => {
        if (emergencyLoading || enrollLoading) return;
        onOpenChange(false);
        setShowEmergencyConfirm(false);
        setShowEnrollInstructions(false);
        setEmergencyError(null);
        setEnrollError(null);
    };

    const handleEmergencyUnlock = async () => {
        setEmergencyLoading(true);
        setEmergencyError(null);
        try {
            const { error: unlockError } = await supabase
                .from('device_commands')
                .update({ 
                    emergency_unlock: true,
                })
                .eq('user_id', patientId);

            if (unlockError) {
                console.error('Failed to trigger emergency unlock:', unlockError);
                setEmergencyError(unlockError.message ?? 'Failed to trigger emergency unlock');
                return;
            }

            setShowEmergencyConfirm(false);
            closeModal();
        } catch (e) {
            console.error('Error triggering emergency unlock:', e);
            setEmergencyError('Error triggering emergency unlock');
        } finally {
            setEmergencyLoading(false);
        }
    };

    const handleEnroll = async () => {
        setEnrollLoading(true);
        setEnrollError(null);
        try {
            // First, get the device_id from user_device table
            const { data: devices, error: devicesError } = await supabase
                .from("user_device")
                .select("device_id")
                .eq("user_id", patientId)
                .not("device_id", "is", null)
                .order("assigned_date", { ascending: false })
                .limit(1);

            if (devicesError) {
                console.error("Error querying user_device for enroll:", devicesError);
                setEnrollError("Failed to query devices. See console for details.");
                return;
            }

            const deviceId = devices && devices.length > 0 ? devices[0].device_id : null;

            if (!deviceId) {
                setEnrollError("No registered device found for this user.");
                return;
            }

            // Try to update existing command, or insert new one
            const { data: updatedRows, error: updateError } = await supabase
                .from("device_commands")
                .update({ enroll: true })
                .eq("device_id", deviceId)
                .select();

            if (updateError) {
                console.error("Failed to update device_commands (enroll):", updateError);
            }

            if (!updatedRows || updatedRows.length === 0) {
                const { data: inserted, error: insertError } = await supabase
                    .from("device_commands")
                    .insert({ device_id: deviceId, enroll: true, emergency_unlock: false, clear: false })
                    .select();

                if (insertError) {
                    console.error("Failed to insert device_commands row (enroll):", insertError);
                    setEnrollError("Failed to send enroll command. See console for details.");
                    return;
                }
            }

            setShowEnrollInstructions(false);
            closeModal();
        } catch (e) {
            console.error("Error triggering enroll", e);
            setEnrollError("Error triggering enroll");
        } finally {
            setEnrollLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} aria-hidden />

            <Card className="relative w-full max-w-2xl">
                <CardHeader className="relative">
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={closeModal}
                        disabled={emergencyLoading || enrollLoading}
                        aria-label="Close dialog"
                        className="absolute top-4 right-4"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                    <CardTitle className="text-2xl pr-12">Device Commands</CardTitle>
                    <CardDescription>Manage your device settings and actions</CardDescription>
                </CardHeader>

                <CardContent className="space-y-6">
                    {/* Emergency Unlock Section */}
                    <div className="space-y-4">
                        {!showEmergencyConfirm ? (
                            <>
                                <div className="flex items-start gap-4 p-4 border rounded-lg bg-destructive/5 border-destructive/20 hover:bg-destructive/10 transition-colors">
                                    <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-1">Emergency Open</h3>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Unlock the device to the next scheduled dose. Use this in emergency situations.
                                        </p>
                                        <Button
                                            variant="destructive"
                                            onClick={() => setShowEmergencyConfirm(true)}
                                            disabled={emergencyLoading || enrollLoading || showEnrollInstructions}
                                        >
                                            Emergency Open
                                        </Button>
                                    </div>
                                </div>
                                {emergencyError && (
                                    <div className="text-sm text-destructive p-3 bg-destructive/10 rounded-lg border border-destructive/20 font-medium">
                                        {emergencyError}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="space-y-4 p-4 border-2 border-destructive rounded-lg bg-destructive/5">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-destructive" />
                                    <h3 className="font-semibold text-lg text-destructive">Confirm Emergency Unlock</h3>
                                </div>
                                <p className="text-sm">
                                    Are you sure you want to emergency open the device? This will unlock it to the next scheduled dose.
                                </p>
                                {emergencyError && (
                                    <div className="text-sm text-destructive p-3 bg-destructive/10 rounded-lg border border-destructive/20 font-medium">
                                        {emergencyError}
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowEmergencyConfirm(false);
                                            setEmergencyError(null);
                                        }}
                                        disabled={emergencyLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleEmergencyUnlock}
                                        disabled={emergencyLoading}
                                    >
                                        {emergencyLoading ? "Unlocking..." : "Confirm Emergency Open"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Enroll Finger Section */}
                    <div className="space-y-4">
                        {!showEnrollInstructions ? (
                            <>
                                <div className="flex items-start gap-4 p-4 border rounded-lg bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
                                    <Fingerprint className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-lg mb-1">Enroll New Finger</h3>
                                        <p className="text-sm text-muted-foreground mb-3">
                                            Add a new fingerprint to your device for biometric access.
                                        </p>
                                        <Button
                                            variant="default"
                                            onClick={() => setShowEnrollInstructions(true)}
                                            disabled={emergencyLoading || enrollLoading || showEmergencyConfirm}
                                        >
                                            Enroll New Finger
                                        </Button>
                                    </div>
                                </div>
                                {enrollError && (
                                    <div className="text-sm text-destructive p-3 bg-destructive/10 rounded-lg border border-destructive/20 font-medium">
                                        {enrollError}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="space-y-4 p-4 border-2 border-primary rounded-lg bg-primary/5">
                                <div className="flex items-center gap-2">
                                    <Fingerprint className="h-5 w-5 text-primary" />
                                    <h3 className="font-semibold text-lg">Enrollment Instructions</h3>
                                </div>
                                <div className="p-4 bg-primary/10 border-l-4 border-primary rounded-lg">
                                    <ol className="list-decimal list-inside text-sm space-y-2 leading-relaxed">
                                        <li>Press "Send Enroll Command" below.</li>
                                        <li>Immediately place the user's finger on the device sensor.</li>
                                        <li>When the sensor flashes red, remove the finger briefly, then place it back on the sensor.</li>
                                        <li>Once the sensor turns green, the enrollment is complete.</li>
                                        <li>Test the fingerprint to confirm it works.</li>
                                    </ol>
                                </div>
                                {enrollError && (
                                    <div className="text-sm text-destructive p-3 bg-destructive/10 rounded-lg border border-destructive/20 font-medium">
                                        {enrollError}
                                    </div>
                                )}
                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowEnrollInstructions(false);
                                            setEnrollError(null);
                                        }}
                                        disabled={enrollLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={handleEnroll}
                                        disabled={enrollLoading}
                                    >
                                        {enrollLoading ? "Sending..." : "Send Enroll Command"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
