"use client";

import { ScheduleEvent } from "@/lib/types";
import { convertUtcDoseTimeToLocal } from "@/lib/utils";

export default function Schedule({ schedule}: { schedule: ScheduleEvent[]}) {

    const today: Date = new Date();
    const day: number = today.getDay();
    const days: string[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName: string = days[day];


    return (
        <div className="rounded border">
            <div className="flex items-center justify-between p-3">
                <h3 className="text-lg font-semibold">Weekley Schedule ({dayName})</h3>
            </div>

            <div className="flex-row justify-between">
                {schedule.map((row) => (
                    
                    <div key={row.id} className={`flex-row justify-between border rounded p-2 m-2`}>
                        <div>
                            {convertUtcDoseTimeToLocal(row.dose_time)}
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

