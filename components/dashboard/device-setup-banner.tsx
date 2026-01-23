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
    <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-start gap-4">
          <div className="rounded-full bg-blue-100 dark:bg-blue-900 p-3">
            <Wifi className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl text-blue-900 dark:text-blue-100">
              Set Up Your Pillr Device
            </CardTitle>
            <CardDescription className="text-blue-700 dark:text-blue-300 mt-2">
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
          className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          Set Up Device Now
        </Button>
      </CardFooter>
    </Card>
  );
}
