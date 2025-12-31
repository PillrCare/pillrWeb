"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Tables } from "@/lib/types";
import { formatTimestampLocal } from "@/lib/utils";

type DeviceLogRow = Tables<"device_log">;

export default function DeviceLog({ deviceLog }: { deviceLog: DeviceLogRow[] }) {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((v) => !v);

  return (
    <div className="rounded border">
      <div className="flex items-center justify-between p-3">
        <h3 className="text-lg font-semibold">Recent Device Logs</h3>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{deviceLog?.length ?? 0}</span>
          <button
            aria-expanded={open}
            onClick={toggle}
            className={`p-2 rounded hover:bg-muted/50 transition-transform ${open ? "rotate-180" : "rotate-0"}`}>
            <ChevronDown size={18} />
          </button>
        </div>
      </div>

      {(!deviceLog || deviceLog.length === 0) && open && (
        <div className="p-4 text-sm">No device log entries found.</div>
      )}

      {open && deviceLog && deviceLog.length > 0 && (
        <div className="overflow-auto">
          {deviceLog.map((row) => {
            const isSuccessfulOpen = row.search_event && row.search_success && row.is_in_window;
            const isLateOpen = row.search_event && row.search_success && !row.is_in_window;
            const isFailedAccess = row.search_event && !row.search_success;
            
            const bgColor = isFailedAccess 
              ? 'bg-red-100 dark:bg-red-900/20' 
              : isSuccessfulOpen 
              ? 'bg-green-100 dark:bg-green-900/20'
              : isLateOpen
              ? 'bg-amber-100 dark:bg-amber-900/20'
              : 'bg-accent';

            return (
              <div key={row.id} className={`border-t flex items-start p-2 ${bgColor}`}>
                
                <div className="flex-1 w-full">
                  <div className="text-lg font-medium text-foreground">
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
                  

                  <div className="text-xs font-mono whitespace-pre-wrap text-foreground mt-1 pl-4">
                    {`searched_id: ${row.searched_id ?? "-"}\nsearch_success: ${row.search_success ?? "-"}\nis_in_window: ${row.is_in_window ?? "-"}\nenroll_id: ${row.enroll_id ?? "-"}\nenroll_success: ${row.enroll_success ?? "-"}`}
                  </div>

                </div>

                <div className="w-20 text-center text-xs">{row.weight ?? "-"}</div>
                
                <div className="w-32 text-xs text-muted-foreground">{formatTimestampLocal(row.time_stamp)}</div>

              </div>
            );
          })}

        </div>

      )}

    </div>

  );

}

