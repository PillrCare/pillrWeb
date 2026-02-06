"use client";

import { useEffect, useState } from "react";
import type { Tables } from "@/lib/types";
import { convertUtcDoseTimeToLocal, getLocalDateFromUtcDoseTime } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type MedicationData = {
  id: string;
  schedule_id: string;
  name: string;
  brand_name?: string | null;
  generic_name?: string | null;
  adverse_reactions?: string | null;
  drug_interaction?: string | null;
};

type ScheduleEvent = Tables<"weekly_events"> & {
  medications?: MedicationData[];
};
type DeviceLogRow = Tables<"device_log">;

type ScheduledDoseEvent = {
  schedule_id: string;
  expected_date: string;
  status: 'pending' | 'taken_on_time' | 'taken_late' | 'missed' | 'emergency_access';
  actual_timestamp_utc: string | null;
};

export default function TodaysSchedule({ schedule, deviceLog }: { schedule: ScheduleEvent[], deviceLog: DeviceLogRow[] }) {
    const [scheduledDoses, setScheduledDoses] = useState<ScheduledDoseEvent[]>([]);

    const today: Date = new Date();
    const jsDay: number = today.getDay(); // JavaScript: 0=Sunday, 1=Monday, ..., 6=Saturday
    const days: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName: string = days[jsDay];

    // Convert to schema format: Monday=1, Tuesday=2, ..., Sunday=7
    // JavaScript: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    // Schema:     7=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
    const schemaDay = jsDay === 0 ? 7 : jsDay;

    // Filter events for today
    const todaysEvents = schedule.filter(row => row.day_of_week === schemaDay);

    // Fetch scheduled dose events on mount
    useEffect(() => {
        const supabase = createClient();
        const fetchScheduledDoses = async () => {
            const todayDate = new Date().toISOString().split('T')[0];
            const { data } = await supabase
                .from('scheduled_dose_events')
                .select('schedule_id, expected_date, status, actual_timestamp_utc')
                .eq('expected_date', todayDate);

            if (data) {
                setScheduledDoses(data as ScheduledDoseEvent[]);
            }
        };

        fetchScheduledDoses();
    }, []);

    // Determine the status color based on scheduled_dose_events
    const getEventStatus = (scheduleId: string): string => {
        const today = new Date().toISOString().split('T')[0];
        const dose = scheduledDoses.find(
            d => d.schedule_id === scheduleId && d.expected_date === today
        );

        if (!dose) {
            // No data yet - fallback to grey
            return 'bg-gray-200 dark:bg-gray-700';
        }

        switch (dose.status) {
            case 'taken_on_time':
                return 'bg-green-200 dark:bg-green-800';
            case 'taken_late':
                return 'bg-yellow-200 dark:bg-yellow-800';
            case 'missed':
                return 'bg-red-200 dark:bg-red-800';
            case 'emergency_access':
                return 'bg-purple-200 dark:bg-purple-800';
            case 'pending':
            default:
                return 'bg-gray-200 dark:bg-gray-700';
        }
    };

    // const events: ScheduleEvent = schedule.filter(row => row.day_of_week === day);

    return (
        <div className="bg-card border rounded-xl shadow-sm">
            <div className="flex items-center justify-between p-6 border-b">
                <h3 className="text-lg font-semibold">Today's Schedule ({dayName})</h3>
            </div>

            <div className="p-6 space-y-3">
                {todaysEvents.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground bg-muted/30 rounded-lg">No events scheduled for {dayName}.</div>
                ) : (
                    todaysEvents.map((row) => {
                        const medication = row.medications && row.medications.length > 0 ? row.medications[0] : null;
                        return (
                            <div key={row.id} className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border rounded-lg p-4 transition-all ${getEventStatus(row.id)}`}>
                                <div className="flex items-center gap-4">
                                    <div className="font-semibold text-lg min-w-[80px]">
                                        {convertUtcDoseTimeToLocal(row.dose_time)}
                                    </div>
                                    {medication && (
                                        <div className="font-semibold">
                                            {medication.name}
                                            {medication.brand_name && medication.brand_name !== medication.name && (
                                                <span className="text-sm ml-1 text-muted-foreground">
                                                    ({medication.brand_name})
                                                </span>
                                            )}
                                            {medication.generic_name && medication.generic_name !== medication.name && (
                                                <span className="text-sm ml-1 text-muted-foreground">
                                                    - {medication.generic_name}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                                {row.description && (
                                    <div className="text-sm text-muted-foreground">
                                        {row.description}
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}

