"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MedicationSearch } from "@/components/medication-search";
import type { MedicationSearchResult, MedicationInfo } from "@/lib/medication";
import { searchMedication } from "@/lib/medication";

type EventItem = {
  day_of_week: number;
  dose_time: string;
  description?: string | null;
  medication?: MedicationInfo | null;
};

const DAYS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 7, label: "Sunday" },
];

// Convert UTC time to local timezone
function utcTimeToLocal(dayOfWeek: number, utcTime: string): { day_of_week: number; dose_time: string } {
  const [hours, minutes] = utcTime.split(':').map(Number);
  
  // Create a Date object with the UTC time (using a reference date)
  const date = new Date();
  const currentDay = date.getUTCDay(); // 0 = Sunday
  const targetUTCDay = dayOfWeek === 7 ? 0 : dayOfWeek;
  let daysOffset = targetUTCDay - currentDay;
  if (daysOffset < 0) daysOffset += 7;
  
  date.setUTCDate(date.getUTCDate() + daysOffset);
  date.setUTCHours(hours, minutes, 0, 0);
  
  // Get the local time from this UTC date
  const localHours = date.getHours();
  const localMinutes = date.getMinutes();
  const localDay = date.getDay(); // 0 = Sunday
  const localDayOfWeek = localDay === 0 ? 7 : localDay;
  
  const localTime = `${String(localHours).padStart(2, '0')}:${String(localMinutes).padStart(2, '0')}`;
  
  return { day_of_week: localDayOfWeek, dose_time: localTime };
}

// Convert local time to UTC
function localTimeToUTC(dayOfWeek: number, localTime: string): { day_of_week: number; dose_time: string } {
  const [hours, minutes] = localTime.split(':').map(Number);
  
  // Create a Date object with the local time
  const date = new Date();
  const currentDay = date.getDay();
  const targetLocalDay = dayOfWeek === 7 ? 0 : dayOfWeek;
  let daysOffset = targetLocalDay - currentDay;
  if (daysOffset < 0) daysOffset += 7;
  
  date.setDate(date.getDate() + daysOffset);
  date.setHours(hours, minutes, 0, 0);
  
  // Get the UTC time
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  const utcDay = date.getUTCDay();
  const utcDayOfWeek = utcDay === 0 ? 7 : utcDay;
  
  const utcTime = `${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;
  
  return { day_of_week: utcDayOfWeek, dose_time: utcTime };
}

// Format 24-hour time to 12-hour with AM/PM
function formatTimeDisplay(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export default function ScheduleEditor({ which_user, path = "/dashboard" }: { which_user?: string; path?: string }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [addingDay, setAddingDay] = useState<number | null>(null);
  const [newTime, setNewTime] = useState("");
  const [newDesc, setNewDesc] = useState<string | null>(null);
  const [medicationSearchValue, setMedicationSearchValue] = useState("");
  const [selectedMedication, setSelectedMedication] = useState<MedicationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // `userId` is the target user whose schedule we're editing (could be the same).
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      const { data: userData, error: userError } = await supabase.auth.getUser();
      const user = userData?.user;

      if (userError || !user) {
        router.push("/dashboard");
        return;
      }

      if (!mounted) return;

      const targetId = which_user ?? user.id;
      setUserId(targetId);

      const { data: rows, error } = await supabase
        .from("weekly_events")
        .select("day_of_week, dose_time, description")
        .eq("user_id", targetId)
        .order("day_of_week", { ascending: true })
        .order("dose_time", { ascending: true });

      if (!error && rows) {
        const mapped = rows.map((r: unknown) => {
          const row = r as {
            day_of_week: number;
            dose_time: string | number | null;
            description?: string | null;
          };
          const utcTime = typeof row.dose_time === "string" ? row.dose_time : String(row.dose_time);
          // Convert from UTC to local timezone
          const localEvent = utcTimeToLocal(row.day_of_week, utcTime);
          return {
            day_of_week: localEvent.day_of_week,
            dose_time: localEvent.dose_time,
            description: row.description ?? null,
          };
        });
        setEvents(mapped);
      }

      setLoading(false);
    }

    load();

    return () => {
      mounted = false;
    };
    // supabase is stable (created with useMemo) so it's safe to include in deps
  }, [router, which_user, supabase]);

  function startAdd(day: number) {
    setAddingDay(day);
    setNewTime("");
    setNewDesc(null);
    setMedicationSearchValue("");
    setSelectedMedication(null);
  }

  async function handleMedicationSelect(medication: MedicationSearchResult) {
    // When medication is selected, fetch full medication details from API
    setMedicationSearchValue(medication.name);
    
    try {
      const fullMedicationInfo = await searchMedication(medication.name);
      if (!('message' in fullMedicationInfo)) {
        // Store the full medication info - it will be saved when the event is confirmed
        // We'll store it temporarily and use it in confirmAdd
        setSelectedMedication(fullMedicationInfo);
      }
    } catch (error) {
      console.error('Failed to fetch medication details:', error);
    }
  }

  function handleMedicationSearchChange(value: string) {
    // Update search value as user types
    setMedicationSearchValue(value);
  }

  function confirmAdd() {
    if (addingDay === null || !newTime) return;
    setEvents((s) => [...s, { 
      day_of_week: addingDay!, 
      dose_time: newTime, 
      description: newDesc,
      medication: selectedMedication 
    }]);
    setAddingDay(null);
    setNewTime("");
    setNewDesc(null);
    setMedicationSearchValue("");
    setSelectedMedication(null);
  }

  function removeEvent(index: number) {
    setEvents((s) => s.filter((_, i) => i !== index));
  }

  async function saveAndContinue() {
    if (!userId) return;
    setSaving(true);

    try {
      const { error: delError } = await supabase.from("weekly_events").delete().eq("user_id", userId);
      if (delError) console.error("delete error", delError);

      const payload = events.map((e) => {
        // Convert from local timezone to UTC before saving
        const utcEvent = localTimeToUTC(e.day_of_week, e.dose_time);
        return {
          user_id: userId,
          day_of_week: utcEvent.day_of_week,
          dose_time: utcEvent.dose_time,
          description: e.description,
        };
      });

      if (payload.length > 0) {
        // Insert events and get back the IDs
        const { data: insertedEvents, error: insertError } = await supabase
          .from("weekly_events")
          .insert(payload)
          .select("id");

        if (insertError) {
          console.error("insert error", insertError);
          return;
        }

        // Now insert medications for events that have medication info
        const medicationsToInsert = [];
        for (let i = 0; i < events.length; i++) {
          const event = events[i];
          if (event.medication && insertedEvents && insertedEvents[i]) {
            const medication = event.medication;
            
            // Convert arrays to text for database storage
            const adverseReactionsText = medication.sideEffects && medication.sideEffects.length > 0
              ? medication.sideEffects.join('\n\n')
              : null;
            
            const drugInteractionText = medication.drugInteractions && medication.drugInteractions.length > 0
              ? medication.drugInteractions.join('\n\n')
              : null;

            medicationsToInsert.push({
              schedule_id: insertedEvents[i].id,
              name: medication.name,
              brand_name: medication.brandName || null,
              generic_name: medication.genericName || null,
              adverse_reactions: adverseReactionsText,
              drug_interaction: drugInteractionText,
            });
          }
        }

        // Insert medications if any
        if (medicationsToInsert.length > 0) {
          const { error: medicationError } = await supabase
            .from("medications")
            .insert(medicationsToInsert);
          
          if (medicationError) {
            console.error("medication insert error", medicationError);
          }
        }
      }

      console.log("saved events", payload);
    } finally {
      setSaving(false);
    }
    router.push(path);

  }

  if (loading) {
    return <div>Loading…</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-12">
      <h1 className="text-xl font-semibold">Set your medication schedule</h1>

      <div className="text-xs font-mono p-3 bg-accent rounded border">
        {DAYS.map((d) => (
          <div key={d.value} className="text-sm m-3 p-3 px-5 rounded-md text-foreground bg-background flex-down gap-3 items-center">
            <div>
              <strong>{d.label}</strong>
              <button className="m-2 p-2 bg-accent rounded border" onClick={() => startAdd(d.value)}>+ Add</button>
            </div>

            <div className="p-2 bg-accent rounded border">
              {events.filter((ev) => ev.day_of_week === d.value).length === 0 && <div>No events for {d.label}.</div>}

              {events.map((ev, idx) => ev.day_of_week === d.value && (
                <div className="p-2 mb-2 bg-background rounded border" key={`${d.value}-${idx}`}>
                  <div className="m-1">{formatTimeDisplay(ev.dose_time)}</div>
                  <div className="m-1">{ev.description ?? "No description"}</div>
                  <button className="p-2 m-1 bg-destructive rounded border" onClick={() => removeEvent(idx)}>Remove</button>
                </div>
              ))}

              {addingDay === d.value && (
                <div className="p-2 bg-background rounded border">
                  <div className="text-lg w-full p-2">
                    <label className="pr-2">Time</label>
                    <input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                  </div>
                  <div className="w-full mt-3">
                    <label className="block mb-2">Medication</label>
                    <MedicationSearch
                      value={medicationSearchValue}
                      onChange={handleMedicationSearchChange}
                      onSelect={handleMedicationSelect}
                      placeholder="Search for medication..."
                      className="w-full"
                    />
                  </div>
                  <div className="w-full mt-3">
                    <label className="block mb-2">Description (optional)</label>
                    <input
                      className="w-full p-2 mt-2"
                      value={newDesc ?? ""}
                      onChange={(e) => setNewDesc(e.target.value)}
                      placeholder="Medication name or additional notes (e.g., With food, morning)"
                    />
                  </div>
                  <div className="mt-3">
                    <button className="m-1 p-1 bg-accent rounded border" onClick={confirmAdd}>Add</button>
                    <button className="m-1 p-1 bg-destructive rounded border" onClick={() => {
                      setAddingDay(null);
                      setMedicationSearchValue("");
                    }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="w-full flex justify-left">
        <button className="p-2 bg-accent border rounded" onClick={saveAndContinue} disabled={saving}>{saving ? "Saving…" : "Save and Continue"}</button>
        <button className="p-2 ml-2 bg-destructive border rounded" onClick={() => router.push(path)}>Skip for now</button>
      </div>
    </div>
  );
}

