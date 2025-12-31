"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ScheduleEditor from "../schedule-editor";
import PatientInfo from "./patient-info";
import Sparkline from "./sparkline";
import MissedDosesList from "./missed-doses-list";
import DeviceLog from '@/components/dashboard/device-log';
import type { Tables } from '@/lib/types';

type DeviceLogRow = Tables<"device_log">;


type Patient = {
    id: string;
    username: string;
    name?: string;
    age?: number;
    phone?: string;
    email?: string;
    address?: string;
    device_id?: string;
    device_status?: string;
    adherence_rate?: number;
};

export default function PatientView() {
    const supabase = useMemo(() => createClient(), []);
    const [patients, setPatients] = useState<Patient[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openPatientId, setOpenPatientId] = useState<string | null>(null);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [missedDoses, setMissedDoses] = useState<Array<{ medication?: string; name?: string; time?: string; reason?: string }>>([]);
    const [adherenceTrend, setAdherenceTrend] = useState<Array<{ date: string; rate: number }>>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<{ name?: string; age?: number; phone?: string; email?: string; address?: string }>({});
    const [deviceLog, setDeviceLog] = useState<DeviceLogRow[]>([]);

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

    useEffect(() => {
        if (!openPatientId) {
            setPatient(null);
            setMissedDoses([]);
            setAdherenceTrend([]);
            setDeviceLog([]);
            return;
        }

        let mounted = true;


        async function loadPatientDetails() {
            try {
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', openPatientId)
                    .single();

                if (profileError) {
                    console.warn('No profile found', profileError);
                }

                if (mounted) setPatient(profile ?? null);


                // try to load missed doses
                try {
                    const { data: missed } = await supabase.from('missed_doses').select('*').eq('user_id', openPatientId).order('created_at', { ascending: false }).limit(10);
                    if (mounted) setMissedDoses(missed ?? []);
                } catch (e) {
                    console.warn('missed_doses table not available', e);
                    if (mounted) setMissedDoses([]);
                }

                // try to load adherence trend
                try {
                    const { data: trend } = await supabase.from('adherence').select('date, rate').eq('user_id', openPatientId).order('date', { ascending: true }).limit(7);
                    if (mounted && trend && trend.length > 0) setAdherenceTrend(trend);
                    else if (mounted) setAdherenceTrend([{ date: new Date().toISOString().slice(0, 10), rate: profile?.adherence_rate ?? 0 }]);
                } catch (e) {
                    console.warn('adherence table not available', e);
                    if (mounted) setAdherenceTrend([{ date: new Date().toISOString().slice(0, 10), rate: profile?.adherence_rate ?? 0 }]);
                }
                
                try {
                    console.log("************************")

                    const { data: device } = await supabase
                        .from('user_device')
                        .select("*")
                        .eq('user_id', openPatientId)
                        .maybeSingle();
                    console.log(device.device_id)
                    if (device?.device_id) {
                        const { data: logData } = await supabase
                            .from('device_log')
                            .select('*')
                            .eq('device_id', device.device_id)
                            .order('time_stamp', { ascending: false })
                            .limit(50);

                        if (mounted) setDeviceLog(logData ?? []);
                    } else {
                        if (mounted) setDeviceLog([]);
                    }

                } catch (e) {
                    console.warn("user device logs not available", e);
                    if (mounted) setDeviceLog([]);
                }

            } catch (e) {
                console.error('Failed to load patient details', e);
            }
        }

        loadPatientDetails();

        return () => {
            mounted = false;
        };
    }, [openPatientId, supabase]);


    if (loading) return <div>Loading…</div>;
    if (error) return <div className="text-destructive">{error}</div>;

    return (
        <div className="w-full flex flex-col gap-2 items-start">
            <h2 className="font-bold text-2xl mb-4">Your patients</h2>
            <pre className="w-full text-xs font-mono p-3 rounded border max-h-64 overflow-auto">
                {patients?.map((p, idx) => (
                    <div className="w-full m-2 p-2 bg-accent rounded border flex justify-between align-center" key={p.id ?? idx}>
                        <div className="text-2xl w-full center">{p.username}</div>
                        <div className="flex gap-2">
                          <button className="p-2 m-1 bg-background rounded border" onClick={() => setOpenPatientId(String(p.id))}>See Details</button>
                          {/* <button className="p-2 m-1 bg-destructive rounded border" onClick={() => editPatient(idx)}>Remove</button> */}
                        </div>
                    </div>

                ))}
            </pre>

            {openPatientId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0" onClick={() => setOpenPatientId(null)} />

                    <div className="relative z-10 w-full max-w-6xl max-h-[90vh] overflow-auto bg-background rounded p-6 border">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Patient Details & Schedule</h3>
                            <div className="flex items-center gap-2">
                                <button className="p-2 rounded border" onClick={() => { setIsEditing(false); setOpenPatientId(null); }}>Close</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Left column: Patient Info + Stats + Problems */}
                            <div className="lg:col-span-1 space-y-4">
                                <PatientInfo
                                    patient={patient}
                                    isEditing={isEditing}
                                    editForm={editForm}
                                    setEditForm={setEditForm}
                                    onEdit={() => { setIsEditing(true); setEditForm({ name: patient?.name, age: patient?.age, phone: patient?.phone, email: patient?.email, address: patient?.address }); }}
                                    onCancel={() => { setIsEditing(false); setEditForm({}); }}
                                    onSave={async () => {
                                        try {
                                            const updates = { ...editForm };
                                            await supabase.from('profiles').update(updates).eq('id', patient?.id);
                                            // refresh
                                            const { data: refreshed } = await supabase.from('profiles').select('*').eq('id', patient?.id).single();
                                            setPatient(refreshed ?? patient);
                                            setIsEditing(false);
                                            setEditForm({});
                                        } catch (e) {
                                            console.error('Failed to save patient', e);
                                        }
                                    }}
                                />
                            </div>

                            <div className="p-3 bg-red-50 rounded border border-red-200">
                                <h4 className="font-semibold mb-2"> No Recent Missed Doses</h4>
                                <div className="space-y-2">
                                    
                                </div>
                            </div>

                             <div className="lg:col-span-1 space-y-4">
                                <DeviceLog deviceLog={deviceLog} />
                             </div>


                            {/* Middle + Right: Chart, meds, missed doses, and scheduler */}
                            <div className="lg:col-span-2 space-y-4">
                                <div className="p-3 bg-accent rounded border">
                                    <h4 className="font-semibold mb-3">Adherence Trend (Last 7 Days)</h4>
                                    <Sparkline data={adherenceTrend} />
                                </div>

                                {/* <MedicationsList medications={medications} /> */}

                                <MissedDosesList missed={missedDoses} />

                                <div className="p-3 bg-accent rounded border">
                                    <h4 className="font-semibold mb-3">Weekly Schedule</h4>
                                    <ScheduleEditor which_user={openPatientId ?? undefined} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

