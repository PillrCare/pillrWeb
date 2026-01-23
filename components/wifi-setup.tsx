"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function WifiSetup({ path = "/dashboard" }: { path?: string }) {
  const router = useRouter();

  const handleSkip = () => {
    router.push('/dashboard');
  };

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Connect Your Device to WiFi</h1>
        <p className="text-base text-muted-foreground">Follow these simple steps to set up your Pillr device</p>
      </div>
      
      <div className="space-y-6">
        <section aria-labelledby="instructions-heading" className="p-6 bg-accent/10 border border-accent/30 rounded-lg">
          <h2 id="instructions-heading" className="text-lg font-semibold mb-4">Setup Instructions</h2>
          <ol className="space-y-3">
            {[
              "Plug in your Pillr device and wait for the light to turn on",
              "The device will create a temporary WiFi network called 'Pillr-Cadence'",
              "On your phone, go to WiFi settings and connect to 'Pillr-Cadence'",
              "Click 'Sign Into Network' to open the configuration page",
              "Enter your home WiFi name and password",
              "The device will automatically connect to your network",
	      "Scan the QR code on your device to connect it to your account"
            ].map((instruction, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center text-sm font-medium">
                  {i + 1}
                </span>
                <span className="text-sm leading-relaxed pt-0.5">{instruction}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg" role="region" aria-label="Important note">
          <p className="text-sm leading-relaxed text-blue-900 dark:text-blue-100">
            ⚠️ Make sure your device is plugged in and powered on and connected before proceeding.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4">
        <button
          className="px-6 py-2.5 bg-secondary text-secondary-foreground font-medium rounded-lg hover:bg-secondary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 dark:focus:ring-offset-background"
          onClick={handleSkip}
          aria-label="Skip WiFi setup and proceed to next step"
        >
          Done
        </button>
      </div>
    </div>
  );
}
