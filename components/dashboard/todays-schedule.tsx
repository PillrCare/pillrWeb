"use client";

import { ScheduleEvent, DeviceLogRow } from "@/lib/types";
import { getSchemaDayOfWeekForDate } from "@/lib/utils";

export default function TodaysSchedule({ schedule, deviceLog }: { schedule: ScheduleEvent[], deviceLog: DeviceLogRow[] }) {

    const today: Date = new Date();
    const jsDay: number = today.getDay();
    const days: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName: string = days[jsDay];
    const schemaDay = getSchemaDayOfWeekForDate(today);

    // Determine the status color of an event, interpreting dose_time as local time-of-day
    const getEventStatus = (doseTime: string): string => {
        const now = new Date();
        const [hours, minutes, seconds] = doseTime.split(':').map(Number);
        const eventTime = new Date(now);
        eventTime.setHours(hours, minutes, seconds || 0, 0);

        if (eventTime > now) {
            return 'bg-gray-200 dark:bg-gray-700';
        }

        const twoHoursAfterEvent = new Date(eventTime.getTime() + 2 * 60 * 60 * 1000);
        const hasRecentLog = deviceLog.some(log => {
            const logTime = new Date(log.time_stamp);
            return logTime >= eventTime && logTime <= twoHoursAfterEvent;
        });

        if (hasRecentLog) {
            return 'bg-green-200 dark:bg-green-800';
        }

        const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
        if (eventTime < twoHoursAgo) {
            return 'bg-red-200 dark:bg-red-800';
        }

        return 'bg-red-200 dark:bg-red-800';
    };

    return (
        <div className="rounded border">
            <div className="flex items-center justify-between p-3">
                <h3 className="text-lg font-semibold">Todays Schedule ({dayName})</h3>
            </div>

            <div className="flex-row justify-between">
                {schedule.filter(row => row.day_of_week === schemaDay).map((row) => (
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

