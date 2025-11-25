"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ScheduleEditor from "../schedule-editor";

type Patient = {
    id: string;
    username: string;
};

export default function PatientView() {
    const supabase = useMemo(() => createClient(), []);
    const [patients, setPatients] = useState<Patient[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openPatientId, setOpenPatientId] = useState<string | null>(null);
    const [removePatientId, setRemovePatientId] = useState<string | null>(null);
    const [removing, setRemoving] = useState(false);
    const [removeError, setRemoveError] = useState<string | null>(null);

    useEffect(() => {
        let mounted = true;

        async function load() {
            setLoading(true);

            try {
                const { data: userData, error: userError } = await supabase.auth.getUser();
                const user = userData?.user;

                if (userError || !user) {
                    setError("Not authenticated");
                    return;
                }

                const { data: patients, error: patientsError } = await supabase
                    .from("profiles")
                    .select("username, id")
                    .eq("user_type", "patient");

                if (patientsError) {
                    console.error("Failed to load patient list", patientsError);
                    setError(patientsError.message ?? String(patientsError));
                    return;
                }
                if (patients && mounted) {
                    const mapped = patients.map((r: unknown) => {
                        const row = r as { username: string; id: string };
                        return {
                            username: row.username,
                            id: row.id,
                        };
                    });
                    setPatients(mapped);
                }

                // if (mounted) setPatients(data ?? []);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        load();

        return () => {
            mounted = false;
        };
    }, [supabase]);

    async function confirmRemoveAssociation() {
        if (!removePatientId) return;
        setRemoving(true);
        setRemoveError(null);

        try {
            const { data: userData, error: userError } = await supabase.auth.getUser();
            const user = userData?.user;

            if (userError || !user) {
                setRemoveError("Not authenticated");
                return;
            }

            const caregiverId = user.id;

            const { error: delError } = await supabase
                .from("caregiver_patient")
                .delete()
                .eq("caregiver_id", caregiverId)
                .eq("patient_id", removePatientId);

            if (delError) {
                console.error("Failed to remove association", delError);
                setRemoveError(delError.message ?? String(delError));
                return;
            }

            // Remove the patient from local list so the UI updates immediately
            setPatients((prev) => (prev ? prev.filter((x) => x.id !== removePatientId) : prev));
            setRemovePatientId(null);
        } finally {
            setRemoving(false);
        }
    }

    // `editPatient` removed because it's unused; callers should use `setOpenPatientId` directly.

    if (loading) return <div>Loading…</div>;
    if (error) return <div className="text-destructive">{error}</div>;

    return (
        <div className="w-full flex flex-col gap-2 items-start">
            <h2 className="font-bold text-2xl mb-4">Your patients</h2>
            <pre className="w-full text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
                {patients?.map((p, idx) => (
                        <div className="w-full m-2 p-2 bg-accent rounded border flex justify-between align-center" key={p.id ?? idx}>
                                <div className="text-2xl w-full center">{p.username}</div>
                                <div className="flex gap-2">
                                    <button className="p-2 m-1 bg-background rounded border" onClick={() => setOpenPatientId(String(p.id))}>Edit schedule</button>
                                    <button className="p-2 m-1 bg-destructive rounded border" onClick={() => setRemovePatientId(String(p.id))}>Remove</button>
                                </div>
                        </div>

                ))}
            </pre>

            {openPatientId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setOpenPatientId(null)} />

                    <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-auto bg-background rounded p-4 border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Edit schedule for patient</h3>
                            <button className="p-2 bg-destructive rounded border" onClick={() => setOpenPatientId(null)}>Close</button>
                        </div>
                        <ScheduleEditor which_user={openPatientId ?? undefined} />
                    </div>
                </div>
            )}

            {removePatientId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setRemovePatientId(null)} />

                    <div className="relative z-10 w-full max-w-md overflow-auto bg-background rounded p-4 border">
                        <div className="mb-4">
                            <h3 className="text-lg font-semibold">Remove patient</h3>
                            <p className="text-sm mt-2">Are you sure you want to remove this patient? This will delete the caregiver–patient association.</p>
                            {removeError && <div className="text-destructive mt-2">{removeError}</div>}
                        </div>
                        <div className="flex gap-2 justify-end">
                            <button className="p-2 bg-background rounded border" onClick={() => setRemovePatientId(null)} disabled={removing}>Cancel</button>
                            <button className="p-2 bg-destructive rounded border" onClick={() => confirmRemoveAssociation()} disabled={removing}>{removing ? "Removing…" : "Yes, remove"}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

