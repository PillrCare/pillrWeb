"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Tables } from "@/lib/types";
import { formatTimestampLocal } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type DeviceLogRow = Tables<"device_log">;

export default function DeviceLog({ deviceLog }: { deviceLog: DeviceLogRow[] }) {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((v) => !v);

  return (
    <div className="bg-card border rounded-xl shadow-sm">
      <div className="flex items-center justify-between p-6 border-b">
        <h3 className="text-lg font-semibold">Recent Device Logs</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded-md">{deviceLog?.length ?? 0}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-expanded={open}
            onClick={toggle}
            className={`transition-transform ${open ? "rotate-180" : "rotate-0"}`}>
            <ChevronDown size={18} />
          </Button>
        </div>
      </div>

      {(!deviceLog || deviceLog.length === 0) && open && (
        <div className="p-6 text-sm text-muted-foreground text-center">No device log entries found.</div>
      )}

      {open && deviceLog && deviceLog.length > 0 && (
        <div className="overflow-auto max-h-[400px]">
          <div className="divide-y">
            {deviceLog.map((row) => {
              const isNew = row.event_type !== null;

              // Classification for new records
              const isNewSuccessOpen = isNew && row.event_type === "dispense_success" && row.is_in_window;
              const isNewLateOpen = isNew && row.event_type === "dispense_success" && !row.is_in_window;
              const isNewFailedAccess = isNew && row.event_type === "auth_denied";
              const isNewEnrollSuccess = isNew && row.event_type === "enrollment_success";
              const isNewEnrollFailed = isNew && row.event_type === "enrollment_failed";
              const isNewEmergencyOpen = isNew && row.event_type === "emergency_unlock";
              const isNewClear = isNew && row.event_type === "clear_templates";
              const isNewError = isNew && (row.event_type === "error_sensor" || row.event_type === "error_wifi" || row.event_type === "error_schedule_sync");

              // Classification for legacy records
              const isLegacySuccessOpen = !isNew && row.search_event && row.search_success && row.is_in_window;
              const isLegacyLateOpen = !isNew && row.search_event && row.search_success && !row.is_in_window;
              const isLegacyFailedAccess = !isNew && row.search_event && !row.search_success;

              const bgColor =
                isNewSuccessOpen || isLegacySuccessOpen
                  ? "bg-green-500/10 dark:bg-green-500/20"
                  : isNewLateOpen || isLegacyLateOpen
                  ? "bg-amber-500/10 dark:bg-amber-500/20"
                  : isNewFailedAccess || isLegacyFailedAccess || isNewEnrollFailed || isNewError
                  ? "bg-destructive/10 dark:bg-destructive/20"
                  : "bg-muted/30";

              const label = isNew
                ? isNewSuccessOpen
                  ? "Successfully Opened"
                  : isNewLateOpen
                  ? "Late Open"
                  : isNewFailedAccess
                  ? "Failed Access"
                  : isNewEnrollSuccess
                  ? "New Finger Enrolled"
                  : isNewEnrollFailed
                  ? "Enrollment Failed"
                  : isNewEmergencyOpen
                  ? "Emergency Open"
                  : isNewClear
                  ? "Clear"
                  : isNewError
                  ? "Error"
                  : row.event_type
                : isLegacySuccessOpen
                ? "Successfully Opened"
                : isLegacyLateOpen
                ? "Late Open"
                : isLegacyFailedAccess
                ? "Failed Access"
                : row.enroll_event
                ? "New Finger Enrolled"
                : row.e_unlock
                ? "Emergency Open"
                : row.clear_event
                ? "Clear"
                : "Other";

              const newDetails = isNew
                ? [
                    `fingerprint_id: ${row.fingerprint_id ?? "-"}`,
                    `is_in_window: ${row.is_in_window ?? "-"}`,
                    ...(isNewFailedAccess ? [`denial_reason: ${row.denial_reason ?? "-"}`] : []),
                    ...(isNewError
                      ? [
                          `error_code: ${row.error_code ?? "-"}`,
                          `error_message: ${row.error_message ?? "-"}`,
                        ]
                      : []),
                  ].join("\n")
                : `searched_id: ${row.searched_id ?? "-"}\nsearch_success: ${row.search_success ?? "-"}\nis_in_window: ${row.is_in_window ?? "-"}\nenroll_id: ${row.enroll_id ?? "-"}\nenroll_success: ${row.enroll_success ?? "-"}`;

              return (
                <div key={row.id} className={`flex flex-col sm:flex-row sm:items-start gap-3 p-4 ${bgColor} transition-colors`}>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground mb-2">{label}</div>
                    <div className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                      {newDetails}
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col gap-2 sm:gap-0 sm:items-end sm:text-right">
                    <div className="text-xs font-medium">{row.weight ?? "-"}</div>
                    <div className="text-xs text-muted-foreground">{formatTimestampLocal(row.time_stamp)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

}

