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
import { X, Plus, Clock, Calendar, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { ScheduleCalendar } from "@/components/schedule-calendar";

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
  image_url?: string | null;
  imageFile?: File | null; // Temporary file for new events
  medications?: MedicationInfo[]; // Array of medications (up to 7)
  medicationData?: MedicationData[]; // Array of existing medication data
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
export function formatTimeDisplay(time24: string): string {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
}

export default function ScheduleEditor({ which_user, path = "/dashboard", onSave }: { which_user?: string; path?: string; onSave?: () => void }) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [newTime, setNewTime] = useState("");
  const [newDesc, setNewDesc] = useState<string | null>(null);
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [medicationSearchValue, setMedicationSearchValue] = useState("");
  const [selectedMedications, setSelectedMedications] = useState<MedicationInfo[]>([]); // Array for multiple medications
  const [isDaily, setIsDaily] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<{ dayOfWeek: number; doseTime: string; description: string | null } | null>(null);
  const [matchingEventsCount, setMatchingEventsCount] = useState(0);
  // `userId` is the target user whose schedule we're editing (could be the same).
  const [userId, setUserId] = useState<string | null>(null);
  
  const MAX_MEDICATIONS_PER_EVENT = 7;

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
          image_url,
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
            image_url?: string | null;
            medications?: MedicationData[] | null;
          };
          const utcTime = typeof row.dose_time === "string" ? row.dose_time : String(row.dose_time);
          // Convert from UTC to local timezone
          const localEvent = utcTimeToLocal(row.day_of_week, utcTime);
          
          // Get medication data array (medications is an array from the join)
          const medicationData = row.medications && row.medications.length > 0 
            ? row.medications 
            : [];
          
          return {
            id: row.id,
            day_of_week: localEvent.day_of_week,
            dose_time: localEvent.dose_time,
            description: row.description ?? null,
            image_url: row.image_url ?? null,
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
    // Check if we've reached the limit
    if (selectedMedications.length >= MAX_MEDICATIONS_PER_EVENT) {
      return;
    }
    
    // Check if medication is already selected
    if (selectedMedications.some(m => m.name === medication.name)) {
      setMedicationSearchValue("");
      return;
    }
    
    // When medication is selected, fetch full medication details from API
    setMedicationSearchValue("");
    
    try {
      const fullMedicationInfo = await searchMedication(medication.name);
      if (!('message' in fullMedicationInfo)) {
        // Add to the array of selected medications
        setSelectedMedications([...selectedMedications, fullMedicationInfo]);
      }
    } catch (error) {
      console.error('Failed to fetch medication details:', error);
    }
  }
  
  function removeSelectedMedication(index: number) {
    setSelectedMedications(selectedMedications.filter((_, i) => i !== index));
  }

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setNewImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function removeSelectedImage() {
    setNewImageFile(null);
    setNewImagePreview(null);
  }

  async function uploadImageToStorage(userId: string, eventId: string, file: File): Promise<string | null> {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${eventId}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return null;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
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
    // If an image is selected, we'll store the file and upload it when saving
    const newEvents = daysToAdd.map(day => ({
      day_of_week: day,
      dose_time: newTime,
      description: newDesc,
      imageFile: newImageFile || undefined, // Store file for later upload
      image_url: newImagePreview || null, // Use preview as temporary URL for display
      medications: selectedMedications.length > 0 ? [...selectedMedications] : undefined
    }));

    setEvents((s) => [...s, ...newEvents]);
    
    // Reset form and close modal
    setNewTime("");
    setNewDesc(null);
    setNewImageFile(null);
    setNewImagePreview(null);
    setMedicationSearchValue("");
    setSelectedMedications([]);
    setIsDaily(false);
    setSelectedDays([]);
    setShowAddModal(false);
  }

  // Check if events match (same time, medications, and description)
  function eventsMatch(event1: EventItem, event2: EventItem): boolean {
    if (event1.dose_time !== event2.dose_time) return false;
    if (event1.description !== event2.description) return false;
    
    // Compare medications
    const meds1: (MedicationInfo | MedicationData)[] = event1.medications || event1.medicationData || [];
    const meds2: (MedicationInfo | MedicationData)[] = event2.medications || event2.medicationData || [];
    
    if (meds1.length !== meds2.length) return false;
    
    // Compare medication names
    const names1 = meds1.map(m => {
      if ('brandName' in m || 'genericName' in m) {
        return (m as MedicationInfo).name;
      } else {
        return (m as MedicationData).name;
      }
    }).sort();
    
    const names2 = meds2.map(m => {
      if ('brandName' in m || 'genericName' in m) {
        return (m as MedicationInfo).name;
      } else {
        return (m as MedicationData).name;
      }
    }).sort();
    
    return names1.every((name, idx) => name === names2[idx]);
  }

  function removeEvent(dayOfWeek: number, doseTime: string, description: string | null) {
    // Find the event being deleted
    const eventToDelete = events.find(e => 
      e.day_of_week === dayOfWeek &&
      e.dose_time === doseTime &&
      e.description === description
    );

    if (!eventToDelete) return;

    // Find all matching events (same time, medications, description)
    const matchingEvents = events.filter(e => eventsMatch(e, eventToDelete));
    
    if (matchingEvents.length > 1) {
      // Show confirmation dialog
      setPendingDelete({ dayOfWeek, doseTime, description });
      setMatchingEventsCount(matchingEvents.length);
    } else {
      // No duplicates, just delete the single event
      performDelete(dayOfWeek, doseTime, description, false);
    }
  }

  function performDelete(dayOfWeek: number, doseTime: string, description: string | null, deleteAll: boolean) {
    if (deleteAll) {
      // Find the event being deleted to match against
      const eventToDelete = events.find(e => 
        e.day_of_week === dayOfWeek &&
        e.dose_time === doseTime &&
        e.description === description
      );

      if (eventToDelete) {
        // Delete all matching events
        setEvents((s) => s.filter(e => !eventsMatch(e, eventToDelete)));
      }
    } else {
      // Delete only the specific event
      setEvents((s) => {
        const index = s.findIndex(e => 
          e.day_of_week === dayOfWeek &&
          e.dose_time === doseTime &&
          e.description === description
        );
        if (index !== -1) {
          return s.filter((_, i) => i !== index);
        }
        return s;
      });
    }
    
    setPendingDelete(null);
    setMatchingEventsCount(0);
  }

  async function saveAndContinue() {
    if (!userId) return;
    setSaving(true);

    try {
      const { error: delError } = await supabase.from("weekly_events").delete().eq("user_id", userId);
      if (delError) {
        console.error("delete error", delError);
        setSaving(false);
        return;
      }

      const payload = events.map((e) => {
        const utcEvent = localTimeToUTC(e.day_of_week, e.dose_time);
        return {
          user_id: userId,
          day_of_week: utcEvent.day_of_week,
          dose_time: utcEvent.dose_time,
          description: e.description,
          image_url: e.imageFile ? null : (e.image_url || null),
        };
      });

      if (payload.length === 0) {
        setSaving(false);
        if (onSave) {
          onSave();
        } else {
          router.push(path);
        }
        return;
      }

      // Insert events first to get real event IDs
      const { data: insertedEvents, error: insertError } = await supabase
        .from("weekly_events")
        .insert(payload)
        .select("id");

      if (insertError) {
        console.error("insert error", insertError);
        setSaving(false);
        return;
      }

      if (!insertedEvents || insertedEvents.length === 0) {
        console.error("No events were inserted");
        setSaving(false);
        return;
      }

      // Upload images using real event IDs, then update events with URLs
      const updatePromises = events.map(async (event, index) => {
        if (!event.imageFile || !insertedEvents[index]) {
          return;
        }

        const insertedEvent = insertedEvents[index];
        const uploadedUrl = await uploadImageToStorage(userId, insertedEvent.id, event.imageFile);
        
        if (uploadedUrl) {
          const { error: updateError } = await supabase
            .from("weekly_events")
            .update({ image_url: uploadedUrl })
            .eq("id", insertedEvent.id);

          if (updateError) {
            console.error(`Failed to update image_url for event ${insertedEvent.id}:`, updateError);
          }
        }
      });

      await Promise.all(updatePromises);

      // Insert medications for events that have medication info
      const medicationsToInsert = [];
      
      for (let i = 0; i < events.length; i++) {
        const event = events[i];
        if (insertedEvents && insertedEvents[i]) {
          let medicationsToSave: MedicationInfo[] = [];
          
          if (event.medications && event.medications.length > 0) {
            medicationsToSave = event.medications;
          } else if (event.medicationData && event.medicationData.length > 0) {
            medicationsToSave = event.medicationData.map(medData => ({
              name: medData.name,
              brandName: medData.brand_name || undefined,
              genericName: medData.generic_name || undefined,
              sideEffects: medData.adverse_reactions 
                ? medData.adverse_reactions.split('\n\n').filter(s => s.trim())
                : undefined,
              drugInteractions: medData.drug_interaction
                ? medData.drug_interaction.split('\n\n').filter(s => s.trim())
                : undefined,
            }));
          }
          
          for (const medicationToSave of medicationsToSave) {
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

      if (medicationsToInsert.length > 0) {
        const { error: medicationError } = await supabase
          .from("medications")
          .insert(medicationsToInsert);
        
        if (medicationError) {
          console.error("medication insert error", medicationError);
        }
      }

    } finally {
      setSaving(false);
    }
    
    if (onSave) {
      onSave();
    } else {
      router.push(path);
    }

  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    );
  }

  function closeAddModal() {
    setShowAddModal(false);
    // Reset form when closing
    setNewTime("");
    setNewDesc(null);
    setNewImageFile(null);
    setNewImagePreview(null);
    setMedicationSearchValue("");
    setSelectedMedications([]);
    setIsDaily(false);
    setSelectedDays([]);
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-4 sm:gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold">Set Your Medication Schedule</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Add medications and set times for each day of the week</p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          size="lg"
          className="w-full sm:w-auto flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Add Event
        </Button>
      </div>

      {/* Calendar View */}
      <Card className="rounded-xl shadow-sm">
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
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
              <p>No events scheduled. Click &quot;Add Event&quot; to get started.</p>
            </div>
          ) : (
            <ScheduleCalendar events={events} onRemoveEvent={removeEvent} />
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          size="lg" 
          onClick={saveAndContinue} 
          disabled={saving}
          className="w-full sm:flex-1"
        >
          {saving ? "Saving…" : onSave ? "Save Changes" : "Save and Continue"}
        </Button>
        {!onSave && (
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => router.push(path)}
            className="w-full sm:flex-1"
          >
            Skip for now
          </Button>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={closeAddModal} 
            aria-hidden 
          />

          <Card className="relative w-full max-w-2xl max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <CardHeader className="relative p-4 sm:p-6">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeAddModal}
                aria-label="Close dialog"
                className="absolute top-3 right-3 sm:top-4 sm:right-4 h-8 w-8 sm:h-10 sm:w-10"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
              <CardTitle className="flex items-center gap-2 pr-10 sm:pr-12 text-lg sm:text-xl">
                <Plus className="h-5 w-5" />
                Add New Event
              </CardTitle>
              <CardDescription className="text-sm">Create a new medication schedule entry</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
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
                  <Label htmlFor="medication">
                    Medications (optional, up to {MAX_MEDICATIONS_PER_EVENT})
                    {selectedMedications.length > 0 && (
                      <span className="text-muted-foreground font-normal ml-2">
                        ({selectedMedications.length}/{MAX_MEDICATIONS_PER_EVENT})
                      </span>
                    )}
                  </Label>
                  {selectedMedications.length < MAX_MEDICATIONS_PER_EVENT ? (
                    <MedicationSearch
                      value={medicationSearchValue}
                      onChange={handleMedicationSearchChange}
                      onSelect={handleMedicationSelect}
                      placeholder="Search for medication..."
                      className="w-full"
                    />
                  ) : (
                    <div className="text-sm text-muted-foreground p-2 border rounded-lg bg-muted/30">
                      Maximum of {MAX_MEDICATIONS_PER_EVENT} medications per event reached
                    </div>
                  )}
                  
                  {/* Display selected medications */}
                  {selectedMedications.length > 0 && (
                    <div className="space-y-2 mt-2">
                      {selectedMedications.map((med, index) => (
                        <div
                          key={`${med.name}-${index}`}
                          className="flex items-center justify-between p-3 bg-muted/50 border rounded-lg"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold truncate">{med.name}</div>
                            {med.brandName && med.brandName !== med.name && (
                              <div className="text-sm text-muted-foreground truncate">
                                Brand: {med.brandName}
                              </div>
                            )}
                            {med.genericName && med.genericName !== med.name && (
                              <div className="text-sm text-muted-foreground truncate">
                                Generic: {med.genericName}
                              </div>
                            )}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSelectedMedication(index)}
                            className="ml-2 flex-shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
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

                {/* Image Upload */}
                <div className="space-y-2">
                  <Label htmlFor="image" className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4" />
                    Image (optional)
                  </Label>
                  {!newImagePreview ? (
                    <div className="flex items-center gap-2">
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="w-full"
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="relative w-full max-w-md">
                        <img
                          src={newImagePreview}
                          alt="Preview"
                          className="w-full h-auto rounded-lg border-2 border-input object-cover max-h-64"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={removeSelectedImage}
                          className="absolute top-2 right-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {newImageFile?.name} ({(newImageFile?.size ? (newImageFile.size / 1024).toFixed(1) : 0)} KB)
                      </p>
                    </div>
                  )}
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-3">
                        {DAYS.map((day) => {
                          const isSelected = selectedDays.includes(day.value);
                          return (
                            <Button
                              key={day.value}
                              type="button"
                              variant={isSelected ? "default" : "outline"}
                              onClick={() => handleDayToggle(day.value)}
                              className="h-auto p-3 sm:p-3 min-h-[60px] sm:min-h-0 flex flex-col items-center gap-2 touch-manipulation"
                            >
                              <div className={`
                                w-5 h-5 border-2 rounded flex items-center justify-center flex-shrink-0
                                ${isSelected ? 'bg-primary-foreground border-primary-foreground' : 'border-foreground/50'}
                              `}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-primary" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-xs sm:text-sm font-medium">{day.label.slice(0, 3)}</span>
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
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {pendingDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setPendingDelete(null)} 
            aria-hidden 
          />

          <Card className="relative w-full max-w-md">
            <CardHeader className="relative">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-xl">Delete Event{matchingEventsCount > 1 ? 's' : ''}?</CardTitle>
              </div>
              <CardDescription>
                {matchingEventsCount > 1 
                  ? `This event appears ${matchingEventsCount} times in your schedule (same time, medications, and notes). Would you like to delete all occurrences?`
                  : 'Are you sure you want to delete this event?'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                {matchingEventsCount > 1 && (
                  <Button
                    variant="destructive"
                    onClick={() => performDelete(pendingDelete.dayOfWeek, pendingDelete.doseTime, pendingDelete.description, true)}
                    className="flex-1"
                  >
                    Delete All ({matchingEventsCount})
                  </Button>
                )}
                <Button
                  variant="destructive"
                  onClick={() => performDelete(pendingDelete.dayOfWeek, pendingDelete.doseTime, pendingDelete.description, false)}
                  className="flex-1"
                >
                  Delete This One Only
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPendingDelete(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

