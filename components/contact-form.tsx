"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CONTACT_REASONS = [
  { value: "patient_emergency", label: "Patient emergency" },
  { value: "software_bug", label: "Software bug" },
  { value: "hardware_bug", label: "Hardware bug" },
  { value: "talk_to_us", label: "Talk to us" },
  { value: "other", label: "Other" },
] as const;

type ContactReason = (typeof CONTACT_REASONS)[number]["value"];
type ContactPreference = "email" | "phone";

type ContactUser = {
  userId: string;
  email: string | null;
  username?: string | null;
  userType?: string | null;
};

type Props = {
  user: ContactUser;
};

export function ContactForm({ user }: Props) {
  const [contactEmail, setContactEmail] = useState(user.email ?? "");
  const [phone, setPhone] = useState("");
  const [contactPreference, setContactPreference] =
    useState<ContactPreference>("email");
  const [reason, setReason] = useState<ContactReason>("talk_to_us");
  const [description, setDescription] = useState("");
  const [bestTime, setBestTime] = useState("");

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  const resetForm = () => {
    setPhone("");
    setContactPreference("email");
    setReason("talk_to_us");
    setDescription("");
    setBestTime("");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");
    setMessage(null);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contactEmail.trim(),
          phone: phone.trim() || undefined,
          contactPreference,
          reason,
          description: description.trim(),
          bestTime: bestTime.trim() || undefined,
        }),
      });

      const body = (await response.json()) as { error?: string };

      if (!response.ok) {
        throw new Error(body.error || "Unable to send your message.");
      }

      setStatus("success");
      setMessage("Message sent. We will reach out soon.");
      resetForm();
    } catch (error) {
      setStatus("error");
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contact Pillr Support</CardTitle>
        <CardDescription>
          This note will automatically include who you are. Tell us how to reach
          you and what you need help with.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-md border bg-accent/50 p-4 text-sm">
          <p className="font-medium">Signed in as</p>
          <p>
            {user.username || "Unknown user"} ({user.userType || "role unknown"})
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="contact-email">Your email</Label>
            <Input
              id="contact-email"
              name="contact-email"
              type="email"
              required
              placeholder="you@example.com"
              onChange={(event) => setContactEmail(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="phone">Phone (optional)</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="(555) 555-5555"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label>How should we contact you?</Label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {(["email", "phone"] as ContactPreference[]).map((option) => (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition hover:bg-accent ${
                    contactPreference === option ? "border-primary" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="contactPreference"
                    value={option}
                    checked={contactPreference === option}
                    onChange={() => setContactPreference(option)}
                    className="h-4 w-4"
                  />
                  <span className="capitalize">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="reason">Reason</Label>
            <select
              id="reason"
              name="reason"
              className="h-10 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={reason}
              onChange={(event) => setReason(event.target.value as ContactReason)}
            >
              {CONTACT_REASONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              name="description"
              required
              minLength={10}
              className="min-h-[140px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Tell us what is happening and any steps to reproduce."
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="best-time">Best time to reach you (optional)</Label>
            <Input
              id="best-time"
              name="best-time"
              type="text"
              placeholder="Weekdays after 3pm, Eastern"
              value={bestTime}
              onChange={(event) => setBestTime(event.target.value)}
            />
          </div>

          {status === "success" && (
            <div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-700">
              {message}
            </div>
          )}

          {status === "error" && (
            <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {message ?? "Something went wrong sending your message."}
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={status === "loading"}>
              {status === "loading" ? "Sending..." : "Send message"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={resetForm}
              disabled={status === "loading"}
            >
              Clear
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
