"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { MedicationSearch } from "@/components/medication-search";
import type { MedicationSearchResult, MedicationInfo } from "@/lib/medication";
import { searchMedication } from "@/lib/medication";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Plus, Clock, Calendar } from "lucide-react";

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
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  // Group events by day for display
  const eventsByDay = DAYS.map(day => ({
    ...day,
    events: events
      .filter(ev => ev.day_of_week === day.value)
      .sort((a, b) => a.dose_time.localeCompare(b.dose_time))
  }));

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Set Your Medication Schedule</h1>
        <p className="text-muted-foreground">Add medications and set times for each day of the week</p>
      </div>

      {/* Add Event Form */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Event
          </CardTitle>
          <CardDescription>Create a new medication schedule entry</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-6">
            {/* Time Input */}
            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Time
              </Label>
              <Input
                id="time"
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
                className="w-full"
              />
            </div>

            {/* Medication Search */}
            <div className="space-y-2">
              <Label htmlFor="medication">Medication (optional)</Label>
              <MedicationSearch
                value={medicationSearchValue}
                onChange={handleMedicationSearchChange}
                onSelect={handleMedicationSelect}
                placeholder="Search for medication..."
                className="w-full"
              />
            </div>

            {/* Notes/Description */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                type="text"
                value={newDesc ?? ""}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Additional notes (e.g., With food, morning)"
                className="w-full"
              />
            </div>

            {/* Day Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Apply to:
              </Label>
              <div className="flex flex-col gap-3">
                <Button
                  type="button"
                  variant={isDaily ? "default" : "outline"}
                  onClick={handleDailyToggle}
                  className="w-full justify-start h-auto p-4"
                >
                  <div className={`
                    w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0 mr-3
                    ${isDaily ? 'bg-primary-foreground border-primary-foreground' : 'border-foreground/50'}
                  `}>
                    {isDaily && (
                      <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <span className="font-medium">Daily (all days)</span>
                </Button>
                
                {!isDaily && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                    {DAYS.map((day) => {
                      const isSelected = selectedDays.includes(day.value);
                      return (
                        <Button
                          key={day.value}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          onClick={() => handleDayToggle(day.value)}
                          className="h-auto p-3 flex flex-col items-center gap-2"
                        >
                          <div className={`
                            w-5 h-5 border-2 rounded flex items-center justify-center
                            ${isSelected ? 'bg-primary-foreground border-primary-foreground' : 'border-foreground/50'}
                          `}>
                            {isSelected && (
                              <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <span className="text-sm font-medium">{day.label.slice(0, 3)}</span>
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Add Button */}
            <Button
              onClick={addEvent}
              disabled={!newTime || (!isDaily && selectedDays.length === 0)}
              size="lg"
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Schedule */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Current Schedule</CardTitle>
          <CardDescription>
            {events.length === 0 
              ? "No events scheduled yet" 
              : `${events.length} event${events.length !== 1 ? 's' : ''} scheduled`
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No events scheduled. Add an event above to get started.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventsByDay.map((dayData) => (
                dayData.events.length > 0 && (
                  <div key={dayData.value} className="border rounded-lg p-4 bg-muted/30">
                    <div className="font-semibold text-lg mb-3 text-foreground">{dayData.label}</div>
                    <div className="space-y-2">
                      {dayData.events.map((ev, idx) => {
                        const medicationName: string | null = ev.medicationData?.name || ev.medication?.name || null;
                        return (
                          <div 
                            key={`${dayData.value}-${idx}-${ev.dose_time}`} 
                            className="flex items-center justify-between p-4 bg-background border rounded-lg hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-center gap-4 flex-wrap flex-1 min-w-0">
                              <div className="font-semibold text-lg min-w-[100px]">
                                {formatTimeDisplay(ev.dose_time)}
                              </div>
                              {ev.medicationData && (
                                <div className="font-semibold">
                                  {ev.medicationData.name}
                                  {ev.medicationData.brand_name && ev.medicationData.brand_name !== ev.medicationData.name && (
                                    <span className="text-sm ml-1 text-muted-foreground">
                                      ({ev.medicationData.brand_name})
                                    </span>
                                  )}
                                  {ev.medicationData.generic_name && ev.medicationData.generic_name !== ev.medicationData.name && (
                                    <span className="text-sm ml-1 text-muted-foreground">
                                      - {ev.medicationData.generic_name}
                                    </span>
                                  )}
                                </div>
                              )}
                              {ev.medication && !ev.medicationData && (
                                <div className="font-semibold">
                                  {ev.medication.name}
                                  {ev.medication.brandName && ev.medication.brandName !== ev.medication.name && (
                                    <span className="text-sm ml-1 text-muted-foreground">
                                      ({ev.medication.brandName})
                                    </span>
                                  )}
                                  {ev.medication.genericName && ev.medication.genericName !== ev.medication.name && (
                                    <span className="text-sm ml-1 text-muted-foreground">
                                      - {ev.medication.genericName}
                                    </span>
                                  )}
                                </div>
                              )}
                              {ev.description && (
                                <div className="text-sm text-muted-foreground">{ev.description}</div>
                              )}
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeEvent(ev.day_of_week, ev.dose_time, ev.description ?? null, medicationName ?? null)}
                              className="ml-4"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Remove
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          size="lg" 
          onClick={saveAndContinue} 
          disabled={saving}
          className="flex-1"
        >
          {saving ? "Saving…" : "Save and Continue"}
        </Button>
        <Button 
          variant="outline" 
          size="lg" 
          onClick={() => router.push(path)}
          className="flex-1"
        >
          Skip for now
        </Button>
      </div>
    </div>
  );
}

