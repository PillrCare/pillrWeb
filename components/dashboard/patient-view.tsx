"use client";

import React, { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import ScheduleEditor from "../schedule-editor";
import PatientInfo from "./patient-info";
import Sparkline from "./sparkline";
import MissedDosesList from "./missed-doses-list";
import DeviceLog from '@/components/dashboard/device-log';
import Schedule from "./schedule";
import EmergencyUnlockButton from "./emergency-unlock-button";
import EnrollButton from "./enroll_button";
import { PatientSearch } from "./admin/patient-search";
import type { Tables } from '@/lib/types';

type DeviceLogRow = Tables<"device_log">;
type PatientStatsRow = Tables<"patient_stats">;
type ScheduleEvent = Tables<"weekly_events">;
type Profile = Tables<"profiles">;

type Patient = {
    id: string;
    username: string;
    name?: string;
    device_id?: string;
    device_status?: string;
    adherence_rate?: number;
    user_type?: string;
    agency_id?: string | null;
};

type Props = {
    initialPatients: Profile[];
    showRoleFilters?: boolean; // Enable admin role filtering
};

export default function PatientView({ initialPatients, showRoleFilters = false }: Props) {
    const supabase = useMemo(() => createClient(), []);
    const [openPatientId, setOpenPatientId] = useState<string | null>(null);
    const [patient, setPatient] = useState<Patient | null>(null);
    const [missedDoses, setMissedDoses] = useState<Array<{ medication?: string; name?: string; time?: string; reason?: string }>>([]);
    const [adherenceTrend, setAdherenceTrend] = useState<Array<{ date: string; rate: number }>>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<{ name?: string }>({});
    const [deviceLog, setDeviceLog] = useState<DeviceLogRow[]>([]);
    const [patientStats, setPatientStats] = useState<PatientStatsRow | null>(null);
    const [schedule, setSchedule] = useState<ScheduleEvent[]>([]);
    const [showScheduleEditor, setShowScheduleEditor] = useState(false);

    useEffect(() => {
        if (!openPatientId) {
            setPatient(null);
            setMissedDoses([]);
            setAdherenceTrend([]);
            setDeviceLog([]);
            setPatientStats(null);
            setSchedule([]);
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

                // Fetch device info from user_device table
                const { data: device } = await supabase
                    .from('user_device')
                    .select("*")
                    .eq('user_id', openPatientId)
                    .maybeSingle();

                // Merge device info into patient object
                const patientWithDevice = {
                    ...profile,
                    device_id: device?.device_id ?? undefined,
                    device_status: device?.is_active ? 'connected' : 'disconnected'
                };

                if (mounted) setPatient(patientWithDevice ?? null);


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

                // Load device logs using the device we already fetched
                try {
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

                // Load patient statistics from patient_stats view
                try {
                    const { data: statsData } = await supabase
                        .from('patient_stats')
                        .select('*')
                        .eq('patient_id', openPatientId)
                        .maybeSingle();
                    if (mounted) setPatientStats(statsData ?? null);
                } catch (e) {
                    console.warn('patient_stats view not available', e);
                    if (mounted) setPatientStats(null);
                }

                // Load weekly schedule with medications
                try {
                    const { data: scheduleData } = await supabase
                        .from('weekly_events')
                        .select(`
                            *,
                            medications (
                                id,
                                schedule_id,
                                name,
                                brand_name,
                                generic_name,
                                adverse_reactions,
                                drug_interaction
                            )
                        `)
                        .eq('user_id', openPatientId)
                        .order('dose_time', { ascending: true });
                    if (mounted) setSchedule(scheduleData ?? []);
                } catch (e) {
                    console.warn('weekly_events table not available', e);
                    if (mounted) setSchedule([]);
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

    return (
        <div className="w-full flex flex-col gap-4 items-start">
            <div className="w-full max-w-2xl">
                <PatientSearch
                    profiles={initialPatients}
                    onSelectUser={(userId) => setOpenPatientId(userId)}
                    showRoleFilters={showRoleFilters}
                />
            </div>

            {openPatientId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="absolute inset-0" onClick={() => setOpenPatientId(null)} />

                    <div className="relative z-10 w-full max-w-7xl max-h-[95vh] overflow-hidden bg-background rounded-lg shadow-2xl border mx-4">
                        {/* Header */}
                        <div className="flex justify-between items-center p-6 border-b bg-muted/30">
                            <div>
                                <h3 className="text-2xl font-bold">Patient Overview</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {patient?.name || patient?.username}
                                </p>
                            </div>
                            <div className="flex items-center gap-3">
                                {openPatientId && <EmergencyUnlockButton patientId={openPatientId} />}
                                {openPatientId && <EnrollButton patientId={openPatientId} />}
                                <button
                                    className="px-4 py-2 rounded-md border hover:bg-accent transition-colors font-medium"
                                    onClick={() => { setIsEditing(false); setOpenPatientId(null); }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="overflow-auto max-h-[calc(95vh-88px)] p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                                {/* Left Sidebar: Patient Info + Stats */}
                                <div className="lg:col-span-4 space-y-6">
                                    <div className="bg-card rounded-lg border shadow-sm">
                                        <PatientInfo
                                            patient={patient}
                                            isEditing={isEditing}
                                            editForm={editForm}
                                            setEditForm={setEditForm}
                                            onEdit={() => {
                                                setIsEditing(true);
                                                setEditForm({
                                                    name: patient?.name ?? patient?.username
                                                });
                                            }}
                                            onCancel={() => { setIsEditing(false); setEditForm({}); }}
                                            onSave={async () => {
                                                try {
                                                    // Map name to username field in database
                                                    const updates = { username: editForm.name };
                                                    await supabase.from('profiles').update(updates).eq('id', patient?.id);
                                                    const { data: refreshed } = await supabase.from('profiles').select('*').eq('id', patient?.id).single();

                                                    // Re-fetch device info and merge
                                                    const { data: device } = await supabase
                                                        .from('user_device')
                                                        .select("*")
                                                        .eq('user_id', patient?.id)
                                                        .maybeSingle();

                                                    const patientWithDevice = {
                                                        ...refreshed,
                                                        device_id: device?.device_id ?? undefined,
                                                        device_status: device?.is_active ? 'connected' : 'disconnected'
                                                    };

                                                    setPatient(patientWithDevice ?? patient);
                                                    setIsEditing(false);
                                                    setEditForm({});
                                                } catch (e) {
                                                    console.error('Failed to save patient', e);
                                                }
                                            }}
                                        />
                                    </div>

                                    {patientStats && (
                                        <div className="bg-card rounded-lg border shadow-sm p-5">
                                            <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                                Statistics
                                            </h4>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center py-2 border-b">
                                                    <span className="text-sm text-muted-foreground">Overall adherence</span>
                                                    <span className="text-lg font-bold text-green-600">
                                                        {(patientStats.on_time_adherence_pct ?? 0).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b">
                                                    <span className="text-sm text-muted-foreground">Past week</span>
                                                    <span className="font-semibold">{(patientStats.adherence_past_week_pct ?? 0).toFixed(1)}%</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b">
                                                    <span className="text-sm text-muted-foreground">Past month</span>
                                                    <span className="font-semibold">{(patientStats.adherence_past_month_pct ?? 0).toFixed(1)}%</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b">
                                                    <span className="text-sm text-muted-foreground">Missed doses</span>
                                                    <span className="font-semibold text-orange-600">{patientStats.missed_doses ?? 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2 border-b">
                                                    <span className="text-sm text-muted-foreground">Total opens</span>
                                                    <span className="font-semibold">{patientStats.total_opens ?? 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center py-2">
                                                    <span className="text-sm text-muted-foreground">Emergency accesses</span>
                                                    <span className="font-semibold text-red-600">{patientStats.emercency_accesses ?? 0}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="bg-card rounded-lg border shadow-sm">
                                        <DeviceLog deviceLog={deviceLog} />
                                    </div>
                                </div>

                                {/* Main Content: Charts, Schedule, and Missed Doses */}
                                <div className="lg:col-span-8 space-y-6">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 rounded-lg border shadow-sm p-6">
                                        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                            </svg>
                                            Adherence Trend (Last 7 Days)
                                        </h4>
                                        <Sparkline data={adherenceTrend} />
                                    </div>

                                    <div className="bg-card rounded-lg border shadow-sm p-6">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-lg font-semibold flex items-center gap-2">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                Weekly Schedule
                                            </h4>
                                            <button
                                                className="text-sm px-4 py-2 rounded-md border bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                                                onClick={() => setShowScheduleEditor(true)}
                                            >
                                                Edit Schedule
                                            </button>
                                        </div>
                                        <Schedule schedule={schedule} />
                                    </div>

                                    <MissedDosesList missed={missedDoses} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showScheduleEditor && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="absolute inset-0" onClick={() => setShowScheduleEditor(false)} />
                    <div className="relative z-10 w-full max-w-4xl max-h-[90vh] overflow-hidden bg-background rounded-lg shadow-2xl border mx-4">
                        <div className="flex justify-between items-center p-6 border-b bg-muted/30">
                            <h3 className="text-xl font-bold">Edit Weekly Schedule</h3>
                            <button
                                className="px-4 py-2 rounded-md border hover:bg-accent transition-colors font-medium"
                                onClick={() => setShowScheduleEditor(false)}
                            >
                                Close
                            </button>
                        </div>
                        <div className="overflow-auto max-h-[calc(90vh-88px)] p-6">
                            <ScheduleEditor which_user={openPatientId ?? undefined} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

