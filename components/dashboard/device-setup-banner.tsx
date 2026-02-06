"use client";

import { useRouter } from "next/navigation";
import { Wifi } from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DeviceSetupBanner() {
  const router = useRouter();

  const handleSetupClick = () => {
    router.push("/auth/profile-setup/wifi?returnTo=/dashboard/patient");
  };

  return (
    <Card className="bg-primary/10 border-primary/20 rounded-xl shadow-sm">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-primary/20 p-3">
            <Wifi className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">
              Set Up Your Pillr Device
            </CardTitle>
            <CardDescription className="mt-2">
              Connect your Pillr device to WiFi to start tracking your medication schedule.
              This only takes a few minutes.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardFooter>
        <Button
          size="lg"
          onClick={handleSetupClick}
          variant="default"
        >
          Set Up Device Now
        </Button>
      </CardFooter>
    </Card>
  );
}
