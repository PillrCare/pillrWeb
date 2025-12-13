import { NextResponse } from "next/server";
import { Resend } from "resend";

import { createClient } from "@/lib/supabase/server";

const CONTACT_REASONS: Record<string, string> = {
  patient_emergency: "Patient Emergency",
  software_bug: "Software Bug",
  hardware_bug: "Hardware Bug",
  talk_to_us: "Talk To Us",
  other: "Other",
};

const escapeHtml = (input: string) =>
  input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

type ContactBody = {
  email: string;
  phone?: string;
  contactPreference: "email" | "phone";
  reason: keyof typeof CONTACT_REASONS;
  description: string;
  bestTime?: string;
};

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not configured." },
      { status: 500 },
    );
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  const user = userData?.user;

  if (userError || !user) {
    return NextResponse.json(
      { error: "You must be signed in to contact support." },
      { status: 401 },
    );
  }

  let body: Partial<ContactBody> = {};
  try {
    body = (await request.json()) as ContactBody;
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request payload." },
      { status: 400 },
    );
  }

  const {
    email,
    phone,
    contactPreference,
    reason,
    description,
    bestTime,
  } = body;

  const contactEmail = email?.trim();
  const contactDescription = description?.trim();
  const contactPhone = phone?.trim();
  const contactBestTime = bestTime?.trim();

  if (
    !contactEmail ||
    !contactDescription ||
    !contactPreference ||
    !reason
  ) {
    return NextResponse.json(
      { error: "Missing required fields." },
      { status: 400 },
    );
  }

  if (!(contactPreference === "email" || contactPreference === "phone")) {
    return NextResponse.json(
      { error: "Invalid contact preference." },
      { status: 400 },
    );
  }

  if (!Object.hasOwn(CONTACT_REASONS, reason)) {
    return NextResponse.json(
      { error: "Invalid reason provided." },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, user_type")
    .eq("id", user.id)
    .maybeSingle();

  const resend = new Resend(process.env.RESEND_API_KEY);

  const subject = `Contact request: ${CONTACT_REASONS[reason]} — ${
    profile?.username ?? user.email ?? user.id
  }`;

  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
      <h2 style="margin-bottom: 12px;">New contact request</h2>
      <p style="margin: 4px 0;">Reason: <strong>${CONTACT_REASONS[reason]}</strong></p>
      <p style="margin: 4px 0;">Preferred contact: <strong>${contactPreference}</strong></p>
      <p style="margin: 4px 0;">Provided email: <strong>${escapeHtml(contactEmail)}</strong></p>
      <p style="margin: 4px 0;">Provided phone: <strong>${
        contactPhone ? escapeHtml(contactPhone) : "(none)"
      }</strong></p>
      <p style="margin: 4px 0;">Best time to reach: <strong>${
        contactBestTime ? escapeHtml(contactBestTime) : "(not specified)"
      }</strong></p>

      <h3 style="margin: 16px 0 8px;">Message</h3>
      <div style="white-space: pre-wrap; background: #f8fafc; padding: 12px; border-radius: 8px; border: 1px solid #e2e8f0;">${escapeHtml(
        contactDescription,
      )}</div>

      <h3 style="margin: 16px 0 8px;">Sender</h3>
      <ul style="padding-left: 18px;">
        <li>User ID: ${user.id}</li>
        <li>Email: ${user.email ?? "(none)"}</li>
        <li>Username: ${profile?.username ?? "(none)"}</li>
        <li>Role: ${profile?.user_type ?? "(none)"}</li>
      </ul>

      <p style="margin-top: 12px; font-size: 12px; color: #64748b;">Origin: ${
        request.headers.get("origin") ?? "(unknown)"
      }</p>
    </div>
  `;

  const text = `New contact request\n\nReason: ${CONTACT_REASONS[reason]}\nPreferred contact: ${contactPreference}\nEmail: ${contactEmail}\nPhone: ${contactPhone || "(none)"}\nBest time: ${
    contactBestTime || "(not specified)"
  }\n\nMessage:\n${contactDescription}\n\nSender\n- User ID: ${user.id}\n- Email: ${
    user.email ?? "(none)"
  }\n- Username: ${profile?.username ?? "(none)"}\n- Role: ${
    profile?.user_type ?? "(none)"
  }\nOrigin: ${request.headers.get("origin") ?? "(unknown)"}`;

  try {
    await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL || "Pillr Contact <onboarding@resend.dev>",
      to: process.env.CONTACT_EMAIL || "pillr.care@gmail.com",
      subject,
      html,
      text,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send contact email", error);
    return NextResponse.json(
      { error: "Failed to send contact email." },
      { status: 500 },
    );
  }
}
