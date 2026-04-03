"use client";

/**
 * Meridian Bank — wire transfer verification demo page
 * Copy this file into your other Next.js app as app/verify/page.tsx (or any route).
 *
 * Required env vars in that app:
 *   NEXT_PUBLIC_VOUCH_BASE_URL=https://your-vouch-deployment.vercel.app
 *   NEXT_PUBLIC_VOUCH_API_KEY=vk_live_...
 *
 * No extra dependencies needed beyond React + Next.js.
 */

import { useState } from "react";

const VOUCH_BASE_URL =
  process.env.NEXT_PUBLIC_VOUCH_BASE_URL ?? "https://app.vouchapi.com";
const VOUCH_API_KEY = process.env.NEXT_PUBLIC_VOUCH_API_KEY ?? "";

// ── base64url helpers ──────────────────────────────────────────────────────

function base64url2buf(b64: string): ArrayBuffer {
  const base64 = b64.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(base64);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0)).buffer;
}

function buf2base64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// ── Vouch flow ─────────────────────────────────────────────────────────────

type VouchReceipt = {
  challenge_id: string;
  verified: boolean;
  verified_at: string;
  credential_id: string;
  pqc_public_key: string;
  pqc_signature: string;
  transaction_context: unknown;
};

async function runVouchFlow(txContext: Record<string, unknown>): Promise<VouchReceipt> {
  // Step 1 — create challenge
  const challengeRes = await fetch(`${VOUCH_BASE_URL}/api/vouch/challenge`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOUCH_API_KEY}`,
    },
    body: JSON.stringify({
      action: "wire_transfer",
      transaction_context: txContext,
    }),
  });

  if (!challengeRes.ok) {
    const err = await challengeRes.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Challenge failed (${challengeRes.status})`);
  }

  const { challenge_id, webauthn_options } = (await challengeRes.json()) as {
    challenge_id: string;
    webauthn_options: {
      challenge: string;
      rpId: string;
      allowCredentials: { id: string; type: string; transports?: string[] }[];
      userVerification: string;
      timeout?: number;
    };
  };

  // Step 2 — browser WebAuthn
  const getOptions: CredentialRequestOptions = {
    publicKey: {
      challenge: base64url2buf(webauthn_options.challenge),
      rpId: webauthn_options.rpId,
      allowCredentials: webauthn_options.allowCredentials.map((c) => ({
        id: base64url2buf(c.id),
        type: c.type as PublicKeyCredentialType,
        transports: c.transports as AuthenticatorTransport[] | undefined,
      })),
      userVerification:
        (webauthn_options.userVerification as UserVerificationRequirement) ??
        "required",
      timeout: webauthn_options.timeout ?? 60000,
    },
  };

  const credential = (await navigator.credentials.get(getOptions)) as PublicKeyCredential | null;

  if (!credential) throw new Error("No credential returned from authenticator");

  const response = credential.response as AuthenticatorAssertionResponse;

  const assertion = {
    id: credential.id,
    rawId: buf2base64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: buf2base64url(response.clientDataJSON),
      authenticatorData: buf2base64url(response.authenticatorData),
      signature: buf2base64url(response.signature),
      userHandle: response.userHandle ? buf2base64url(response.userHandle) : null,
    },
  };

  // Step 3 — verify
  const verifyRes = await fetch(
    `${VOUCH_BASE_URL}/api/vouch/verify/${challenge_id}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${VOUCH_API_KEY}`,
      },
      body: JSON.stringify({ assertion }),
    }
  );

  if (!verifyRes.ok) {
    const err = await verifyRes.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Verify failed (${verifyRes.status})`);
  }

  return verifyRes.json() as Promise<VouchReceipt>;
}

// ── Passkey registration flow ─────────────────────────────────────────────

type RegisterResult = { credential_id: string; created_at?: string } & Record<string, unknown>;

async function runRegisterFlow(): Promise<RegisterResult> {
  // Step 1 — start registration
  const startRes = await fetch(`${VOUCH_BASE_URL}/api/passkey/register/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOUCH_API_KEY}`,
    },
    body: JSON.stringify({}),
  });

  if (!startRes.ok) {
    const err = await startRes.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Register start failed (${startRes.status})`);
  }

  const { options } = (await startRes.json()) as {
    options: {
      challenge: string;
      rp: { name: string; id: string };
      user: { id: string; name: string; displayName: string };
      pubKeyCredParams: { type: string; alg: number }[];
      authenticatorSelection?: Record<string, unknown>;
      timeout?: number;
      attestation?: string;
    };
  };

  // Step 2 — browser WebAuthn create
  const createOptions: CredentialCreationOptions = {
    publicKey: {
      challenge: base64url2buf(options.challenge),
      rp: options.rp,
      user: {
        id: base64url2buf(options.user.id),
        name: options.user.name,
        displayName: options.user.displayName,
      },
      pubKeyCredParams: options.pubKeyCredParams as PublicKeyCredentialParameters[],
      authenticatorSelection: options.authenticatorSelection as AuthenticatorSelectionCriteria | undefined,
      timeout: options.timeout ?? 60000,
      attestation: (options.attestation as AttestationConveyancePreference) ?? "none",
    },
  };

  const credential = (await navigator.credentials.create(createOptions)) as PublicKeyCredential | null;
  if (!credential) throw new Error("No credential returned from authenticator");

  const response = credential.response as AuthenticatorAttestationResponse;

  const attestation = {
    id: credential.id,
    rawId: buf2base64url(credential.rawId),
    type: credential.type,
    response: {
      clientDataJSON: buf2base64url(response.clientDataJSON),
      attestationObject: buf2base64url(response.attestationObject),
    },
  };

  // Step 3 — complete registration
  const completeRes = await fetch(`${VOUCH_BASE_URL}/api/passkey/register/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${VOUCH_API_KEY}`,
    },
    body: JSON.stringify({ attestation }),
  });

  if (!completeRes.ok) {
    const err = await completeRes.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? `Register complete failed (${completeRes.status})`);
  }

  return completeRes.json() as Promise<RegisterResult>;
}

// ── Transfer details (hardcoded demo) ─────────────────────────────────────

const TRANSFER = {
  recipient: "Emma Clarke",
  accountLast4: "8821",
  bank: "Chase",
  amount: 4750.0,
  currency: "USD",
  reference: "Invoice #INV-2026-0041",
  scheduledFor: "Today, 3:45 PM EST",
};

// ── Page ───────────────────────────────────────────────────────────────────

type Step = "idle" | "challenge" | "biometric" | "verifying" | "success" | "error";

export default function TransferVerifyPage() {
  const [step, setStep] = useState<Step>("idle");
  const [receipt, setReceipt] = useState<VouchReceipt | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [regStep, setRegStep] = useState<"idle" | "creating" | "completing" | "success" | "error">("idle");
  const [regResult, setRegResult] = useState<RegisterResult | null>(null);
  const [regError, setRegError] = useState<string | null>(null);

  async function handleRegister() {
    setRegError(null);
    setRegStep("creating");
    try {
      setRegStep("completing");
      const result = await runRegisterFlow();
      setRegResult(result);
      setRegStep("success");
    } catch (e) {
      setRegError(e instanceof Error ? e.message : "Registration failed");
      setRegStep("error");
    }
  }

  async function handleVerify() {
    setErrorMsg(null);
    setStep("challenge");

    try {
      setStep("biometric");
      const result = await runVouchFlow({
        amount: TRANSFER.amount,
        currency: TRANSFER.currency,
        recipient: TRANSFER.recipient,
        recipient_account_last4: TRANSFER.accountLast4,
        reference: TRANSFER.reference,
      });
      setStep("verifying");
      // small pause so "verifying" state is visible
      await new Promise((r) => setTimeout(r, 600));
      setReceipt(result);
      setStep("success");
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Verification failed");
      setStep("error");
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-slate-800 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <span className="font-semibold text-slate-800 tracking-tight text-sm">Meridian</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-slate-500">
            <span className="text-slate-800 font-medium">Payments</span>
            <span>Accounts</span>
            <span>Cards</span>
            <span>Settings</span>
          </nav>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
              AL
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-start justify-center px-4 py-12">
        <div className="w-full max-w-lg">

          {/* Registration test card */}
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 mb-10">
            <div className="px-5 py-4">
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Dev test</div>
              <div className="text-sm font-semibold text-slate-800">Register a passkey</div>
              <p className="text-xs text-slate-500 mt-1">
                Calls <code className="font-mono bg-slate-100 px-1 rounded">/api/passkey/register/start</code> then <code className="font-mono bg-slate-100 px-1 rounded">/api/passkey/register/complete</code>.
              </p>
            </div>
            <div className="px-5 py-4">
              {regStep === "idle" && (
                <button
                  onClick={handleRegister}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors duration-150"
                >
                  Register passkey
                </button>
              )}
              {(regStep === "creating" || regStep === "completing") && (
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin shrink-0" />
                  <span className="text-sm text-slate-600">
                    {regStep === "creating" ? "Waiting for authenticator…" : "Completing registration…"}
                  </span>
                </div>
              )}
              {regStep === "error" && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" className="shrink-0 mt-0.5">
                      <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span className="text-xs text-red-600">{regError}</span>
                  </div>
                  <button
                    onClick={() => { setRegStep("idle"); setRegError(null); }}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors duration-150"
                  >
                    Try again
                  </button>
                </div>
              )}
              {regStep === "success" && regResult && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-sm font-medium text-emerald-700">Passkey registered</span>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3 font-mono text-[10px] text-slate-500 break-all leading-relaxed">
                    {JSON.stringify(regResult, null, 2)}
                  </div>
                  <button
                    onClick={() => { setRegStep("idle"); setRegResult(null); }}
                    className="text-xs text-slate-400 hover:text-slate-600 underline"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
            <span>Payments</span>
            <span>/</span>
            <span>Wire transfer</span>
            <span>/</span>
            <span className="text-slate-600">Verify</span>
          </div>

          <h1 className="text-xl font-semibold text-slate-900 mb-1">Confirm wire transfer</h1>
          <p className="text-sm text-slate-500 mb-6">
            Review the details and verify your identity to complete this transfer.
          </p>

          {/* Transfer card */}
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 mb-5">
            <div className="px-5 py-4">
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-3">Transfer details</div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-sm font-medium text-slate-800">{TRANSFER.recipient}</div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    {TRANSFER.bank} ···· {TRANSFER.accountLast4}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-semibold text-slate-900">
                    ${TRANSFER.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{TRANSFER.currency}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <div className="text-slate-400">Reference</div>
                  <div className="text-slate-700 mt-0.5 font-mono">{TRANSFER.reference}</div>
                </div>
                <div>
                  <div className="text-slate-400">Scheduled</div>
                  <div className="text-slate-700 mt-0.5">{TRANSFER.scheduledFor}</div>
                </div>
              </div>
            </div>

            <div className="px-5 py-4">
              <div className="text-xs text-slate-400 uppercase tracking-wide mb-3">Security</div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">Biometric verification required</div>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                    Transfers above $1,000 require biometric confirmation.
                    Your device will prompt you to use Face ID, Touch ID, or your security key.
                  </p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400">Secured by</span>
                    <span className="text-[10px] font-semibold text-slate-600 tracking-tight">Vouch</span>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status / action */}
          {step === "idle" && (
            <button
              onClick={handleVerify}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-3 rounded-xl transition-colors duration-150"
            >
              Verify and send
            </button>
          )}

          {(step === "challenge" || step === "biometric" || step === "verifying") && (
            <div className="bg-white rounded-xl border border-slate-200 px-5 py-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-5 h-5 border-2 border-slate-300 border-t-slate-700 rounded-full animate-spin" />
                <span className="text-sm font-medium text-slate-800">
                  {step === "challenge" && "Creating secure challenge…"}
                  {step === "biometric" && "Waiting for biometric…"}
                  {step === "verifying" && "Verifying signature…"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(["challenge", "biometric", "verifying"] as Step[]).map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                      ["challenge", "biometric", "verifying"].indexOf(s) <=
                      ["challenge", "biometric", "verifying"].indexOf(step as string)
                        ? "bg-slate-700"
                        : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1.5">
                <span>Challenge</span>
                <span>Biometric</span>
                <span>Signing</span>
              </div>
            </div>
          )}

          {step === "error" && (
            <div className="bg-white rounded-xl border border-red-200 px-5 py-5">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-800">Verification failed</div>
                  <div className="text-xs text-slate-500 mt-0.5">{errorMsg}</div>
                </div>
              </div>
              <button
                onClick={() => { setStep("idle"); setErrorMsg(null); }}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium py-2.5 rounded-lg transition-colors duration-150"
              >
                Try again
              </button>
            </div>
          )}

          {step === "success" && receipt && (
            <div className="bg-white rounded-xl border border-emerald-200 divide-y divide-slate-100">
              <div className="px-5 py-5 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">Transfer verified</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Sent{" "}
                    <span className="font-medium">
                      ${TRANSFER.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>{" "}
                    to {TRANSFER.recipient}
                  </div>
                </div>
              </div>

              <div className="px-5 py-4">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-3">Verification receipt</div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Status</span>
                    <span className="inline-flex items-center gap-1.5 text-emerald-600 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                      Verified
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Verified at</span>
                    <span className="text-slate-700">
                      {new Date(receipt.verified_at).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Challenge ID</span>
                    <span className="font-mono text-slate-600 truncate max-w-[200px]">
                      {receipt.challenge_id.slice(0, 18)}…
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Credential</span>
                    <span className="font-mono text-slate-600 truncate max-w-[200px]">
                      {receipt.credential_id.slice(0, 18)}…
                    </span>
                  </div>
                </div>
              </div>

              <div className="px-5 py-4">
                <div className="text-xs text-slate-400 uppercase tracking-wide mb-2">Post-quantum signature</div>
                <div className="bg-slate-50 rounded-lg p-3 font-mono text-[10px] text-slate-500 break-all leading-relaxed">
                  {receipt.pqc_signature.slice(0, 120)}…
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                  <span className="text-[10px] text-slate-400">
                    ML-DSA signed · Secured by Vouch
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
