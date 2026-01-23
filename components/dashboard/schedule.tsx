"use client";

import type { Tables } from "@/lib/types";
import { convertUtcDoseTimeToLocal } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
        <div className="rounded border">
            <div className="flex items-center justify-between p-3">
                <h3 className="text-lg font-semibold">Weekly Schedule </h3>
                <button onClick={() => router.push("/auth/profile-setup/schedule")}>
                    Edit Schedule
                </button>
            </div>

            <div className="flex flex-col gap-4 p-3">
                {eventsByDay.map((dayData) => (
                    <div key={dayData.value} className="border rounded p-3">
                        <div className="font-semibold text-lg mb-2">
                            {dayData.label} - {formatDate(dayData.date)}
                        </div>
                        {dayData.events.length === 0 ? (
                            <div className="text-gray-500 text-sm">No events scheduled</div>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {dayData.events.map((row) => {
                                    const medication = row.medications && row.medications.length > 0 ? row.medications[0] : null;
                                    return (
                                        <div key={row.id} className="border rounded p-2 bg-background">
                                            <div className="flex items-center gap-3">
                                                <div className="font-medium">
                                                    {convertUtcDoseTimeToLocal(row.dose_time)}
                                                </div>
                                                {medication && (
                                                    <div className="font-semibold">
                                                        {medication.name}
                                                        {medication.brand_name && medication.brand_name !== medication.name && (
                                                            <span className="text-sm ml-1">
                                                                ({medication.brand_name})
                                                            </span>
                                                        )}
                                                        {medication.generic_name && medication.generic_name !== medication.name && (
                                                            <span className="text-sm ml-1">
                                                                - {medication.generic_name}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                                {row.description && (
                                                    <div className="text-sm text-gray-600">
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

