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

    // `editPatient` removed because it's unused; callers should use `setOpenPatientId` directly.

    if (loading) return <div>Loading…</div>;
    if (error) return <div className="text-destructive">{error}</div>;

    return (
        <div className="w-full flex flex-col gap-2 items-start">
            <h2 className="font-bold text-2xl mb-4">Your patients</h2>
            <pre className="w-full text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
                {/* {JSON.stringify(patients, null, 2)} */}
                {patients?.map((p, idx) => (
                    <div className="w-full m-2 p-2 bg-accent rounded border flex justify-between align-center" key={p.id ?? idx}>
                        <div className="text-2xl w-full center">{p.username}</div>
                        <div className="flex gap-2">
                          <button className="p-2 m-1 bg-background rounded border" onClick={() => setOpenPatientId(String(p.id))}>Edit schedule</button>
                          {/* <button className="p-2 m-1 bg-destructive rounded border" onClick={() => editPatient(idx)}>Remove</button> */}
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
        </div>
    );
}

