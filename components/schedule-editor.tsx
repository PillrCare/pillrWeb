"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MedicationSearch } from "@/components/medication-search";
import type { MedicationSearchResult, MedicationInfo } from "@/lib/medication";
import { searchMedication } from "@/lib/medication";

type MedicationData = {
  id: string;
  schedule_id: string;
  name: string;
  brand_name?: string | null;
  generic_name?: string | null;
  adverse_reactions?: string | null;
  drug_interaction?: string | null;
};

type EventItem = {
  id?: string;
  day_of_week: number;
  dose_time: string;
  description?: string | null;
  medication?: MedicationInfo | null;
  medicationData?: MedicationData | null;
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
// Note: day_of_week is NOT converted - it represents the conceptual day (Mon=1, Sun=7)
// Only the time is converted from UTC to local
function utcTimeToLocal(dayOfWeek: number, utcTime: string): { day_of_week: number; dose_time: string } {
  const [hours, minutes] = utcTime.split(':').map(Number);
  
  // Create a Date object with today's date and the UTC time
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);
  
  // Get the local time from this UTC date
  const localHours = date.getHours();
  const localMinutes = date.getMinutes();
  
  const localTime = `${String(localHours).padStart(2, '0')}:${String(localMinutes).padStart(2, '0')}`;
  
  // day_of_week stays the same - it's a conceptual day, not a date
  return { day_of_week: dayOfWeek, dose_time: localTime };
}

// Convert local time to UTC
// Note: day_of_week is NOT converted - it represents the conceptual day (Mon=1, Sun=7)
// Only the time is converted from local to UTC
function localTimeToUTC(dayOfWeek: number, localTime: string): { day_of_week: number; dose_time: string } {
  const [hours, minutes] = localTime.split(':').map(Number);
  
  // Create a Date object with today's date and the local time
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  // Get the UTC time
  const utcHours = date.getUTCHours();
  const utcMinutes = date.getUTCMinutes();
  
  const utcTime = `${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;
  
  // day_of_week stays the same - it's a conceptual day, not a date
  return { day_of_week: dayOfWeek, dose_time: utcTime };
}

// Format 24-hour time to 12-hour with AM/PM
function formatTimeDisplay(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
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
  const [newTime, setNewTime] = useState("");
  const [newDesc, setNewDesc] = useState<string | null>(null);
  const [medicationSearchValue, setMedicationSearchValue] = useState("");
  const [selectedMedication, setSelectedMedication] = useState<MedicationInfo | null>(null);
  const [isDaily, setIsDaily] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
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
        .select(`
          id,
          day_of_week, 
          dose_time, 
          description,
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
        .eq("user_id", targetId)
        .order("day_of_week", { ascending: true })
        .order("dose_time", { ascending: true });

      if (!error && rows) {
        const mapped = rows.map((r: unknown) => {
          const row = r as {
            id: string;
            day_of_week: number;
            dose_time: string | number | null;
            description?: string | null;
            medications?: MedicationData[] | null;
          };
          const utcTime = typeof row.dose_time === "string" ? row.dose_time : String(row.dose_time);
          // Convert from UTC to local timezone
          const localEvent = utcTimeToLocal(row.day_of_week, utcTime);
          
          // Get medication data if it exists (medications is an array from the join)
          const medicationData = row.medications && row.medications.length > 0 
            ? row.medications[0] 
            : null;
          
          return {
            id: row.id,
            day_of_week: localEvent.day_of_week,
            dose_time: localEvent.dose_time,
            description: row.description ?? null,
            medicationData: medicationData,
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

  async function handleMedicationSelect(medication: MedicationSearchResult) {
    // When medication is selected, fetch full medication details from API
    setMedicationSearchValue(medication.name);
    
    try {
      const fullMedicationInfo = await searchMedication(medication.name);
      if (!('message' in fullMedicationInfo)) {
        // Store the full medication info - it will be saved when the event is confirmed
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

  function handleDayToggle(dayValue: number) {
    if (selectedDays.includes(dayValue)) {
      setSelectedDays(selectedDays.filter(d => d !== dayValue));
    } else {
      setSelectedDays([...selectedDays, dayValue]);
    }
  }

  function handleDailyToggle() {
    setIsDaily(!isDaily);
    if (!isDaily) {
      // When enabling daily, select all days
      setSelectedDays(DAYS.map(d => d.value));
    } else {
      // When disabling daily, clear selections
      setSelectedDays([]);
    }
  }

  function addEvent() {
    if (!newTime) return;
    
    // Determine which days to add the event to
    const daysToAdd = isDaily ? DAYS.map(d => d.value) : selectedDays;
    
    if (daysToAdd.length === 0) {
      // User needs to select at least one day
      return;
    }

    // Create events for each selected day
    const newEvents = daysToAdd.map(day => ({
      day_of_week: day,
      dose_time: newTime,
      description: newDesc,
      medication: selectedMedication
    }));

    setEvents((s) => [...s, ...newEvents]);
    
    // Reset form
    setNewTime("");
    setNewDesc(null);
    setMedicationSearchValue("");
    setSelectedMedication(null);
    setIsDaily(false);
    setSelectedDays([]);
  }

  function removeEvent(dayOfWeek: number, doseTime: string, description: string | null, medicationName: string | null) {
    setEvents((s) => {
      // Find and remove the first matching event
      const index = s.findIndex(e => 
        e.day_of_week === dayOfWeek &&
        e.dose_time === doseTime &&
        e.description === description &&
        ((e.medication?.name === medicationName) || (e.medicationData?.name === medicationName) || (!e.medication && !e.medicationData && !medicationName))
      );
      if (index !== -1) {
        return s.filter((_, i) => i !== index);
      }
      return s;
    });
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
        // Note: Since we delete all events and re-insert, medications are cascade deleted,
        // so we only need to insert medications for events that have them (either new or preserved)
        const medicationsToInsert = [];
        
        for (let i = 0; i < events.length; i++) {
          const event = events[i];
          if (insertedEvents && insertedEvents[i]) {
            // Use medication from event.medication (newly selected) or reconstruct from medicationData (preserved)
            let medicationToSave: MedicationInfo | null = null;
            
            if (event.medication) {
              // New medication selected
              medicationToSave = event.medication;
            } else if (event.medicationData) {
              // Preserve existing medication - reconstruct MedicationInfo from MedicationData
              medicationToSave = {
                name: event.medicationData.name,
                brandName: event.medicationData.brand_name || undefined,
                genericName: event.medicationData.generic_name || undefined,
                sideEffects: event.medicationData.adverse_reactions 
                  ? event.medicationData.adverse_reactions.split('\n\n').filter(s => s.trim())
                  : undefined,
                drugInteractions: event.medicationData.drug_interaction
                  ? event.medicationData.drug_interaction.split('\n\n').filter(s => s.trim())
                  : undefined,
              };
            }
            
            if (medicationToSave) {
              const adverseReactionsText = medicationToSave.sideEffects && medicationToSave.sideEffects.length > 0
                ? medicationToSave.sideEffects.join('\n\n')
                : null;
              const drugInteractionText = medicationToSave.drugInteractions && medicationToSave.drugInteractions.length > 0
                ? medicationToSave.drugInteractions.join('\n\n')
                : null;

              medicationsToInsert.push({
                schedule_id: insertedEvents[i].id,
                name: medicationToSave.name,
                brand_name: medicationToSave.brandName || null,
                generic_name: medicationToSave.genericName || null,
                adverse_reactions: adverseReactionsText,
                drug_interaction: drugInteractionText,
              });
            }
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

  // Group events by day for display
  const eventsByDay = DAYS.map(day => ({
    ...day,
    events: events
      .filter(ev => ev.day_of_week === day.value)
      .sort((a, b) => a.dose_time.localeCompare(b.dose_time))
  }));

  return (
    <div className="flex-1 w-full flex flex-col gap-8">
      <h1 className="text-xl font-semibold">Set your medication schedule</h1>

      {/* Add Event Form */}
      <div className="border rounded p-4 bg-background">
        <h2 className="text-lg font-semibold mb-4">Add New Event</h2>
        
        <div className="flex flex-col gap-4">
          {/* Time Input */}
          <div>
            <label className="block mb-2 font-medium">Time</label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          {/* Medication Search */}
          <div>
            <label className="block mb-2 font-medium">Medication (optional)</label>
            <MedicationSearch
              value={medicationSearchValue}
              onChange={handleMedicationSearchChange}
              onSelect={handleMedicationSelect}
              placeholder="Search for medication..."
              className="w-full"
            />
          </div>

          {/* Notes/Description */}
          <div>
            <label className="block mb-2 font-medium">Notes (optional)</label>
            <input
              type="text"
              value={newDesc ?? ""}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Additional notes (e.g., With food, morning)"
              className="w-full p-2 border rounded"
            />
          </div>

          {/* Day Selection */}
          <div>
            <label className="block mb-3 font-medium">Apply to:</label>
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={handleDailyToggle}
                className={`
                  flex items-center gap-3 cursor-pointer p-3 rounded border transition-all text-left
                  ${isDaily 
                    ? 'bg-accent border-2 border-foreground font-semibold' 
                    : 'hover:bg-accent/50 border'
                  }
                `}
              >
                <div className={`
                  w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0
                  ${isDaily ? 'bg-foreground border-foreground' : 'border-foreground/50'}
                `}>
                  {isDaily && (
                    <svg className="w-3 h-3 text-background" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <span className="font-medium">Daily (all days)</span>
              </button>
              
              {!isDaily && (
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
                  {DAYS.map((day) => {
                    const isSelected = selectedDays.includes(day.value);
                    return (
                      <button
                        key={day.value}
                        type="button"
                        onClick={() => handleDayToggle(day.value)}
                        className={`
                          flex items-center gap-3 cursor-pointer p-3 rounded border transition-all
                          sm:flex-1 sm:min-w-[120px] sm:max-w-[180px]
                          ${isSelected 
                            ? 'bg-accent border-2 border-foreground font-semibold shadow-sm' 
                            : 'hover:bg-accent/50 border hover:border-foreground/50'
                          }
                        `}
                      >
                        <div className={`
                          w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0
                          ${isSelected ? 'bg-foreground border-foreground' : 'border-foreground/50'}
                        `}>
                          {isSelected && (
                            <svg className="w-3 h-3 text-background" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-sm font-medium">{day.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Add Button */}
          <button
            onClick={addEvent}
            disabled={!newTime || (!isDaily && selectedDays.length === 0)}
            className="p-2 bg-accent border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Add Event
          </button>
        </div>
      </div>

      {/* Current Schedule */}
      <div className="border rounded p-4 bg-background">
        <h2 className="text-lg font-semibold mb-4">Current Schedule</h2>
        
        {events.length === 0 ? (
          <div className="text-gray-500">No events scheduled. Add an event above to get started.</div>
        ) : (
          <div className="flex flex-col gap-4">
            {eventsByDay.map((dayData) => (
              dayData.events.length > 0 && (
                <div key={dayData.value} className="border rounded p-3">
                  <div className="font-semibold mb-2">{dayData.label}</div>
                  <div className="flex flex-col gap-2">
                    {dayData.events.map((ev, idx) => {
                      const medicationName: string | null = ev.medicationData?.name || ev.medication?.name || null;
                      return (
                        <div key={`${dayData.value}-${idx}-${ev.dose_time}`} className="flex items-center justify-between p-2 bg-accent rounded">
                          <div className="flex items-center gap-4 flex-wrap">
                            <div className="font-medium">{formatTimeDisplay(ev.dose_time)}</div>
                            {ev.medicationData && (
                              <div className="font-semibold">
                                {ev.medicationData.name}
                                {ev.medicationData.brand_name && ev.medicationData.brand_name !== ev.medicationData.name && (
                                  <span className="text-sm ml-1">
                                    ({ev.medicationData.brand_name})
                                  </span>
                                )}
                                {ev.medicationData.generic_name && ev.medicationData.generic_name !== ev.medicationData.name && (
                                  <span className="text-sm ml-1">
                                    - {ev.medicationData.generic_name}
                                  </span>
                                )}
                              </div>
                            )}
                            {ev.medication && !ev.medicationData && (
                              <div className="font-semibold">
                                {ev.medication.name}
                                {ev.medication.brandName && ev.medication.brandName !== ev.medication.name && (
                                  <span className="text-sm ml-1">
                                    ({ev.medication.brandName})
                                  </span>
                                )}
                                {ev.medication.genericName && ev.medication.genericName !== ev.medication.name && (
                                  <span className="text-sm ml-1">
                                    - {ev.medication.genericName}
                                  </span>
                                )}
                              </div>
                            )}
                            {ev.description && (
                              <div className="text-sm text-gray-600">{ev.description}</div>
                            )}
                          </div>
                          <button
                            className="p-1 bg-destructive text-white rounded text-sm"
                            onClick={() => removeEvent(ev.day_of_week, ev.dose_time, ev.description ?? null, medicationName ?? null)}
                          >
                            Remove
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="w-full flex justify-left">
        <button className="p-2 bg-accent border rounded" onClick={saveAndContinue} disabled={saving}>
          {saving ? "Saving…" : "Save and Continue"}
        </button>
        <button className="p-2 ml-2 bg-destructive border rounded" onClick={() => router.push(path)}>
          Skip for now
        </button>
      </div>
    </div>
  );
}

