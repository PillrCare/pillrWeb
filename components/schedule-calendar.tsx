"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageViewer } from "@/components/dashboard/image-viewer";
import { formatTimeDisplay } from "./schedule-editor";

const DAYS = [
  { value: 1, label: "Monday", short: "Mon" },
  { value: 2, label: "Tuesday", short: "Tue" },
  { value: 3, label: "Wednesday", short: "Wed" },
  { value: 4, label: "Thursday", short: "Thu" },
  { value: 5, label: "Friday", short: "Fri" },
  { value: 6, label: "Saturday", short: "Sat" },
  { value: 7, label: "Sunday", short: "Sun" },
];

type MedicationData = {
  id: string;
  schedule_id: string;
  name: string;
  brand_name?: string | null;
  generic_name?: string | null;
};

type CalendarEvent = {
  id?: string;
  day_of_week: number;
  dose_time: string;
  description?: string | null;
  image_url?: string | null;
  medications?: any[];
  medicationData?: MedicationData[];
};

interface ScheduleCalendarProps {
  events: CalendarEvent[];
  onRemoveEvent?: (dayOfWeek: number, doseTime: string, description: string | null) => void;
}

function ExpandableEvent({ event, onRemove, isMobile = false }: { event: CalendarEvent; onRemove?: () => void; isMobile?: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const medications = event.medicationData && event.medicationData.length > 0
    ? event.medicationData
    : (event.medications && event.medications.length > 0
        ? event.medications.map(m => ({
            id: '',
            schedule_id: '',
            name: m.name,
            brand_name: m.brandName || null,
            generic_name: m.genericName || null,
          }))
        : []);

  const medicationText = medications.length > 0 
    ? medications.map(m => m.brand_name || m.name || m.generic_name || '').join(', ')
    : '';
  
  const hasLongContent = 
    medicationText.length > 30 ||
    (event.description && event.description.length > 30) ||
    !!event.image_url;

  return (
    <div 
      className={`bg-background border rounded-lg p-2 sm:p-2 hover:shadow-md transition-shadow group ${hasLongContent ? 'cursor-pointer' : ''}`}
      onClick={hasLongContent ? () => setIsExpanded(!isExpanded) : undefined}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="font-semibold text-xs sm:text-xs text-primary flex-1">
          {formatTimeDisplay(event.dose_time)}
        </div>
        <div className="flex items-center gap-1">
          {hasLongContent && (
            <div className={`${isMobile ? 'h-8 w-8' : 'h-5 w-5'} flex items-center justify-center transition-opacity`}>
              {isExpanded ? (
                <ChevronUp className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'} text-muted-foreground`} />
              ) : (
                <ChevronDown className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'} text-muted-foreground`} />
              )}
            </div>
          )}
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              className={`${isMobile ? 'h-8 w-8 opacity-100' : 'h-5 w-5 opacity-0 group-hover:opacity-100'} transition-opacity`}
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <X className={`${isMobile ? 'h-4 w-4' : 'h-3 w-3'}`} />
            </Button>
          )}
        </div>
      </div>
      
      {medications.length > 0 && (
        <div className={`text-xs sm:text-xs font-medium mb-1 ${!isExpanded && medicationText.length > 30 ? 'line-clamp-2' : ''}`}>
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
      )}
      
      {event.description && (
        <div className={`text-xs sm:text-xs text-muted-foreground mb-1 ${!isExpanded && event.description.length > 30 ? 'line-clamp-1' : ''}`}>
          {event.description}
        </div>
      )}
      
      {event.image_url && (
        <div className={`mt-1 transition-all ${!isExpanded ? 'hidden' : 'block'}`}>
          <ImageViewer imageUrl={event.image_url} alt="Event" thumbnailSize={isMobile ? "md" : "sm"} />
        </div>
      )}
    </div>
  );
}

export function ScheduleCalendar({ events, onRemoveEvent }: ScheduleCalendarProps) {
  // Group events by day
  const eventsByDay = DAYS.map(day => ({
    ...day,
    events: events
      .filter(ev => ev.day_of_week === day.value)
      .sort((a, b) => a.dose_time.localeCompare(b.dose_time))
  }));

  return (
    <div className="w-full">
      {/* Mobile View - List Layout */}
      <div className="block md:hidden space-y-4">
        {eventsByDay.map((dayData) => (
          <div
            key={dayData.value}
            className="border rounded-lg p-4 bg-muted/20"
          >
            <div className="font-semibold text-base mb-3 text-foreground pb-2 border-b">
              {dayData.label}
            </div>
            {dayData.events.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No events
              </div>
            ) : (
              <div className="space-y-2">
                {dayData.events.map((ev, idx) => (
                  <ExpandableEvent
                    key={`${dayData.value}-${idx}-${ev.dose_time}`}
                    event={ev}
                    onRemove={onRemoveEvent ? () => onRemoveEvent(ev.day_of_week, ev.dose_time, ev.description ?? null) : undefined}
                    isMobile={true}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Desktop View - Calendar Grid */}
      <div className="hidden md:block">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 mb-4">
          {/* Day Headers */}
          {DAYS.map((day) => (
            <div
              key={day.value}
              className="text-center font-semibold text-sm text-muted-foreground py-2"
            >
              {day.short}
            </div>
          ))}
        </div>

        {/* Calendar Cells */}
        <div className="grid grid-cols-7 gap-2">
          {eventsByDay.map((dayData) => (
            <div
              key={dayData.value}
              className="min-h-[400px] border rounded-lg p-3 bg-muted/20 flex flex-col"
            >
              <div className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                {dayData.events.length === 0 ? (
                  <div className="text-xs text-muted-foreground text-center py-4">
                    No events
                  </div>
                ) : (
                  dayData.events.map((ev, idx) => (
                    <ExpandableEvent
                      key={`${dayData.value}-${idx}-${ev.dose_time}`}
                      event={ev}
                      onRemove={onRemoveEvent ? () => onRemoveEvent(ev.day_of_week, ev.dose_time, ev.description ?? null) : undefined}
                      isMobile={false}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
