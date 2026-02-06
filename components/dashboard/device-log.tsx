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
              const isSuccessfulOpen = row.search_event && row.search_success && row.is_in_window;
              const isLateOpen = row.search_event && row.search_success && !row.is_in_window;
              const isFailedAccess = row.search_event && !row.search_success;
              
              const bgColor = isFailedAccess 
                ? 'bg-destructive/10 dark:bg-destructive/20' 
                : isSuccessfulOpen 
                ? 'bg-green-500/10 dark:bg-green-500/20'
                : isLateOpen
                ? 'bg-amber-500/10 dark:bg-amber-500/20'
                : 'bg-muted/30';

              return (
                <div key={row.id} className={`flex flex-col sm:flex-row sm:items-start gap-3 p-4 ${bgColor} transition-colors`}>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground mb-2">
                      {row.search_event && row.search_success && row.is_in_window
                        ? "Successfully Opened"
                        : row.search_event && row.search_success && !row.is_in_window
                        ? "Late Open"
                        : row.search_event && !row.search_success
                        ? "Failed Access"
                        : row.enroll_event
                        ? "New Finger Enrolled"
                        : row.e_unlock
                        ? "Emergency Open"
                        : row.clear_event
                        ? "Clear"
                        : "Other"}
                    </div>
                    <div className="text-xs font-mono whitespace-pre-wrap text-muted-foreground">
                      {`searched_id: ${row.searched_id ?? "-"}\nsearch_success: ${row.search_success ?? "-"}\nis_in_window: ${row.is_in_window ?? "-"}\nenroll_id: ${row.enroll_id ?? "-"}\nenroll_success: ${row.enroll_success ?? "-"}`}
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

