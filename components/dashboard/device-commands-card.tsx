"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings2 } from "lucide-react";
import DeviceCommandsModal from "./device-commands-modal";

interface DeviceCommandsCardProps {
    patientId: string;
}

export default function DeviceCommandsCard({ patientId }: DeviceCommandsCardProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Card className="bg-card border rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader>
                    <div className="flex items-start gap-4">
                        <div className="rounded-full bg-primary/20 p-3">
                            <Settings2 className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex-1">
                            <CardTitle className="text-xl">Device Commands</CardTitle>
                            <CardDescription className="mt-2">
                                Manage your device settings, enroll fingerprints, and emergency access.
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Button
                        size="lg"
                        onClick={() => setOpen(true)}
                        variant="default"
                        className="w-full sm:w-auto"
                    >
                        <Settings2 className="h-4 w-4 mr-2" />
                        Open Device Commands
                    </Button>
                </CardContent>
            </Card>
            <DeviceCommandsModal 
                patientId={patientId} 
                open={open} 
                onOpenChange={setOpen} 
            />
        </>
    );
}
