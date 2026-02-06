"use client";

import type { Tables } from "@/lib/types";
import { convertUtcDoseTimeToLocal } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type ScheduleEvent = Tables<"weekly_events">;

type MedicationData = {
  id: string;
  schedule_id: string;
  name: string;
  brand_name?: string | null;
  generic_name?: string | null;
  adverse_reactions?: string | null;
  drug_interaction?: string | null;
};

type ScheduleEventWithMedication = ScheduleEvent & {
  medications?: MedicationData[];
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

// Get the date for a specific day of week in the current week
function getDateForDayOfWeek(dayOfWeek: number): Date {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  const schemaCurrentDay = currentDay === 0 ? 7 : currentDay; // Convert to schema format (1=Mon, 7=Sun)
  
  // Calculate days difference
  let daysDiff = dayOfWeek - schemaCurrentDay;
  
  // If the day is earlier in the week (e.g., today is Friday (5) and we want Monday (1))
  // we need to go to next week's Monday
  if (daysDiff < 0) {
    daysDiff += 7;
  }
  
  const targetDate = new Date(today);
  targetDate.setDate(today.getDate() + daysDiff);
  return targetDate;
}

// Format date as "Mon, Jan 15"
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
}

export default function Schedule({ schedule}: { schedule: ScheduleEventWithMedication[]}) {
    const router = useRouter();

    // Group events by day_of_week
    const eventsByDay = DAYS.map(day => ({
      ...day,
      date: getDateForDayOfWeek(day.value),
      events: schedule
        .filter(event => event.day_of_week === day.value)
        .sort((a, b) => a.dose_time.localeCompare(b.dose_time))
    }));

    return (
        <div className="bg-card border rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold">Weekly Schedule</h3>
                <Button variant="outline" size="sm" onClick={() => router.push("/auth/profile-setup/schedule")}>
                    Edit Schedule
                </Button>
            </div>

            <div className="p-6 space-y-4">
                {eventsByDay.map((dayData) => (
                    <div key={dayData.value} className="border rounded-lg p-4 bg-muted/30">
                        <div className="font-semibold text-base mb-3 text-foreground">
                            {dayData.label} - {formatDate(dayData.date)}
                        </div>
                        {dayData.events.length === 0 ? (
                            <div className="text-muted-foreground text-sm">No events scheduled</div>
                        ) : (
                            <div className="space-y-2">
                                {dayData.events.map((row) => {
                                    const medications = row.medications && row.medications.length > 0 ? row.medications : [];
                                    return (
                                        <div key={row.id} className="border rounded-lg p-3 bg-background">
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                                                <div className="font-medium min-w-[80px]">
                                                    {convertUtcDoseTimeToLocal(row.dose_time)}
                                                </div>
                                                {medications.length > 0 && (
                                                    <div className="font-semibold flex-1">
                                                        {medications.map((med, idx) => {
                                                            const displayName = med.brand_name || med.name || med.generic_name || 'Unknown';
                                                            return (
                                                                <span key={`${med.id || med.name}-${idx}`}>
                                                                    {idx > 0 && <span className="text-muted-foreground">, </span>}
                                                                    <span>{displayName}</span>
                                                                </span>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                                {row.description && (
                                                    <div className="text-sm text-muted-foreground">
                                                        {row.description}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

