"use client";

import { useState, useEffect } from "react";
import type { Tables } from "@/lib/types";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScheduleCalendar } from "@/components/schedule-calendar";
import ScheduleEditor from "@/components/schedule-editor";
import { X } from "lucide-react";

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

// Convert UTC time to local timezone for display
function utcTimeToLocal(utcTime: string): string {
  const [hours, minutes] = utcTime.split(':').map(Number);
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);
  const localHours = date.getHours();
  const localMinutes = date.getMinutes();
  return `${String(localHours).padStart(2, '0')}:${String(localMinutes).padStart(2, '0')}`;
}

export default function Schedule({ schedule}: { schedule: ScheduleEventWithMedication[]}) {
    const router = useRouter();
    const [showEditModal, setShowEditModal] = useState(false);

    // Convert schedule events to calendar format (convert UTC times to local)
    const calendarEvents = schedule.map(event => ({
      id: event.id,
      day_of_week: event.day_of_week,
      dose_time: utcTimeToLocal(event.dose_time),
      description: event.description,
      image_url: event.image_url,
      medicationData: event.medications || [],
    }));

    function handleCloseModal() {
      setShowEditModal(false);
      // Refresh the page to show updated schedule
      router.refresh();
    }

    function handleCancelModal() {
      setShowEditModal(false);
    }

    // Handle ESC key and body scroll
    useEffect(() => {
      if (!showEditModal) return;

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          handleCancelModal();
        }
      };

      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "unset";
      };
    }, [showEditModal]);

    return (
        <>
            <Card className="rounded-xl shadow-sm">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Weekly Schedule</CardTitle>
                            <CardDescription>
                                {schedule.length === 0 
                                    ? "No events scheduled yet" 
                                    : `${schedule.length} event${schedule.length !== 1 ? 's' : ''} scheduled`
                                }
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => setShowEditModal(true)}>
                            Edit Schedule
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {schedule.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <p>No events scheduled. Click &quot;Edit Schedule&quot; to add events.</p>
                        </div>
                    ) : (
                        <ScheduleCalendar 
                            events={calendarEvents} 
                            // Read-only in dashboard view - no onRemoveEvent handler
                        />
                    )}
                </CardContent>
            </Card>

            {/* Edit Schedule Modal */}
            {showEditModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
                    <div 
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm" 
                        onClick={handleCancelModal} 
                        aria-hidden 
                    />

                    <Card className="relative w-full max-w-6xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden flex flex-col">
                        <CardHeader className="relative flex-shrink-0 p-4 sm:p-6">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleCancelModal}
                                aria-label="Close dialog"
                                className="absolute top-3 right-3 sm:top-4 sm:right-4 h-8 w-8 sm:h-10 sm:w-10"
                            >
                                <X className="h-4 w-4 sm:h-5 sm:w-5" />
                            </Button>
                            <CardTitle className="pr-10 sm:pr-12 text-lg sm:text-xl">Edit Schedule</CardTitle>
                            <CardDescription className="text-sm">Add or remove medication events from your weekly schedule</CardDescription>
                        </CardHeader>
                        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                            <ScheduleEditor 
                                which_user={undefined} 
                                path="/dashboard/patient"
                                onSave={handleCloseModal}
                            />
                        </div>
                    </Card>
                </div>
            )}
        </>
    );
}

