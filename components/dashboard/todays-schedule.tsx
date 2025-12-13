"use client";

import { ScheduleEvent, DeviceLogRow } from "@/lib/types"

export default function TodaysSchedule({ schedule, deviceLog }: { schedule: ScheduleEvent[], deviceLog: DeviceLogRow[] }) {

    const today: Date = new Date();
    const day: number = today.getDay();
    const days: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName: string = days[day];

    // Function to determine the status color of an event
    const getEventStatus = (doseTime: string): string => {
        const now = new Date();
        const [hours, minutes, seconds] = doseTime.split(':').map(Number);
        const eventTime = new Date(now);
        eventTime.setHours(hours, minutes, seconds || 0, 0);

        // If event is in the future, return grey
        if (eventTime > now) {
            return 'bg-gray-200 dark:bg-gray-700';
        }

        // Check if there's a log within 2 hours of the event time
        const twoHoursAfterEvent = new Date(eventTime.getTime() + 2 * 60 * 60 * 1000);
        const hasRecentLog = deviceLog.some(log => {
            const logTime = new Date(log.time_stamp);
            return logTime >= eventTime && logTime <= twoHoursAfterEvent;
        });

        if (hasRecentLog) {
            return 'bg-green-200 dark:bg-green-800';
        }

        // Check if it's been more than 2 hours since the event
        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        if (eventTime < twoHoursAgo) {
            return 'bg-red-200 dark:bg-red-800';
        }

        // Within 2 hours after event but no log yet
        return 'bg-red-200 dark:bg-red-800';
    };

    // const events: ScheduleEvent = schedule.filter(row => row.day_of_week === day);

    return (
        <div className="rounded border">
            <div className="flex items-center justify-between p-3">
                <h3 className="text-lg font-semibold">Todays Schedule ({dayName})</h3>
            </div>

            <div className="flex-row justify-between">
                {schedule.filter(row => row.day_of_week === day).map((row) => (
                    
                    <div key={row.id} className={`flex-row justify-between border rounded p-2 m-2 ${getEventStatus(row.dose_time)}`}>
                        <div>
                            {row.dose_time} 
                        </div>
                        <div>
                            {row.description}
                        </div>

                    </div>

                ))}
            </div>
            

        </div>

    );

}

