"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import DeviceCommandsModal from "./device-commands-modal";

interface DeviceCommandsButtonProps {
    patientId: string;
}

export default function DeviceCommandsButton({ patientId }: DeviceCommandsButtonProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <Button
                variant="outline"
                size="default"
                onClick={() => setOpen(true)}
            >
                <Settings2 className="h-4 w-4 mr-2" />
                Device Commands
            </Button>
            <DeviceCommandsModal 
                patientId={patientId} 
                open={open} 
                onOpenChange={setOpen} 
            />
        </>
    );
}
