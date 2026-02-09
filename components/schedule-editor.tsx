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
import { X, Plus, Clock, Calendar, Image as ImageIcon } from "lucide-react";
import { ImageViewer } from "@/components/dashboard/image-viewer";

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
  const [newImageFile, setNewImageFile] = useState<File | null>(null);
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null);
  const [medicationSearchValue, setMedicationSearchValue] = useState("");
  const [selectedMedications, setSelectedMedications] = useState<MedicationInfo[]>([]); // Array for multiple medications
  const [isDaily, setIsDaily] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
    
    // Reset form
    setNewTime("");
    setNewDesc(null);
    setNewImageFile(null);
    setNewImagePreview(null);
    setMedicationSearchValue("");
    setSelectedMedications([]);
    setIsDaily(false);
    setSelectedDays([]);
  }

  function removeEvent(dayOfWeek: number, doseTime: string, description: string | null) {
    setEvents((s) => {
      // Find and remove the first matching event
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
        router.push(path);
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
                        // Get medications from either medicationData (existing) or medications (newly added)
                        const medications = ev.medicationData && ev.medicationData.length > 0
                          ? ev.medicationData
                          : (ev.medications && ev.medications.length > 0
                              ? ev.medications.map(m => ({
                                  id: '',
                                  schedule_id: '',
                                  name: m.name,
                                  brand_name: m.brandName || null,
                                  generic_name: m.genericName || null,
                                  adverse_reactions: null,
                                  drug_interaction: null,
                                }))
                              : []);
                        
                        return (
                          <div 
                            key={`${dayData.value}-${idx}-${ev.dose_time}`} 
                            className="flex items-center justify-between p-4 bg-background border rounded-lg hover:shadow-sm transition-shadow"
                          >
                            <div className="flex items-start gap-4 flex-wrap flex-1 min-w-0">
                              <div className="font-semibold text-lg min-w-[100px]">
                                {formatTimeDisplay(ev.dose_time)}
                              </div>
                              {medications.length > 0 && (
                                <div className="flex-1 min-w-0">
                                  <div className="font-semibold">
                                    {medications.map((med, medIdx) => {
                                      const displayName = med.brand_name || med.name || med.generic_name || 'Unknown';
                                      return (
                                        <span key={`${med.name}-${medIdx}`}>
                                          {medIdx > 0 && <span className="text-muted-foreground">, </span>}
                                          <span>{displayName}</span>
                                        </span>
                                      );
                                    })}
                                  </div>
                                  {medications.length > 1 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {medications.length} medication{medications.length !== 1 ? 's' : ''}
                                    </div>
                                  )}
                                </div>
                              )}
                              {ev.description && (
                                <div className="text-sm text-muted-foreground">{ev.description}</div>
                              )}
                              {ev.image_url && (
                                <div className="flex-shrink-0">
                                  <ImageViewer imageUrl={ev.image_url} alt="Event image" thumbnailSize="sm" />
                                </div>
                              )}
                            </div>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => removeEvent(ev.day_of_week, ev.dose_time, ev.description ?? null)}
                              className="ml-4 flex-shrink-0"
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

