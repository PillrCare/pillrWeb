"use client";

import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

function SMSPreferencesClient() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const returnTo = searchParams.get("returnTo");

  useEffect(() => {
    async function loadPreferences() {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          router.push("/auth/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("phone_number, sms_notifications_enabled")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) {
          console.error("Error loading preferences:", profileError);
          setError("Failed to load SMS preferences");
          return;
        }

        if (profile) {
          setPhoneNumber(profile.phone_number || "");
          setOptIn(profile.sms_notifications_enabled || false);
        }
      } catch (err) {
        console.error("Error loading preferences:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [router, supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (optIn && !phoneNumber.trim()) {
      setError("Please enter a phone number to opt into SMS notifications.");
      return;
    }

    // Validate phone number format if provided
    if (phoneNumber.trim()) {
      const cleanedPhone = phoneNumber.replace(/\s|-|\(|\)|\./g, "");
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      if (!phoneRegex.test(cleanedPhone)) {
        setError("Please enter a valid phone number in E.164 format (e.g., +1234567890).");
        return;
      }
      if (!cleanedPhone.startsWith("+")) {
        setPhoneNumber("+" + cleanedPhone);
      }
    }

    try {
      setSaving(true);

      const response = await fetch("/api/sms/opt-in", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim() || null,
          smsNotificationsEnabled: optIn,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update SMS preferences");
      }

      setSuccess("SMS preferences updated successfully!");
      
      // Reload preferences to reflect changes
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("phone_number, sms_notifications_enabled")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile) {
          setPhoneNumber(profile.phone_number || "");
          setOptIn(profile.sms_notifications_enabled || false);
        }
      }

      // Redirect after a short delay if there's a returnTo parameter
      if (returnTo) {
        setTimeout(() => {
          router.push(returnTo);
        }, 1500);
      }
    } catch (err) {
      console.error("Error updating SMS preferences:", err);
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <div className="w-full">
        <h1 className="text-2xl font-bold mb-2">SMS Notification Preferences</h1>
        <p className="text-sm text-muted-foreground">
          Manage your SMS medication reminder preferences
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>SMS Notifications</CardTitle>
          <CardDescription>
            Control how you receive medication reminders via SMS
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sms-opt-in"
                  checked={optIn}
                  onCheckedChange={(checked) => {
                    setOptIn(checked === true);
                    setError(null);
                    setSuccess(null);
                  }}
                  disabled={saving}
                />
                <Label
                  htmlFor="sms-opt-in"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  Enable SMS medication reminders
                </Label>
              </div>
              <p className="text-sm text-muted-foreground ml-6">
                Receive timely reminders for your scheduled medications 15 minutes before each dose
              </p>
            </div>

            {optIn && (
              <div className="space-y-2">
                <Label htmlFor="phone-number">
                  Phone Number <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="phone-number"
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setError(null);
                    setSuccess(null);
                  }}
                  disabled={saving}
                  required={optIn}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  Enter your phone number in E.164 format (e.g., +1234567890)
                </p>
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive p-3 bg-destructive/10 rounded border border-destructive/20">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-600 p-3 bg-green-50 rounded border border-green-200">
                {success}
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Preferences"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function SMSPreferencesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh w-full items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      }
    >
      <SMSPreferencesClient />
    </Suspense>
  );
}

