"use client";

import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import { DeviceLogRow } from "@/lib/types"

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
          {deviceLog.map((row) => (

            <div key={row.id} className="border-t flex items-start p-2">

              <div className="flex-1">

                <div className="text-sm font-medium">
                  {row.search_event ? "Search" : row.enroll_event ? "Enroll" : row.e_unlock ? "E-Unlock" : row.clear_event ? "Clear" : "Other"}
                </div>

                <div className="text-xs font-mono whitespace-pre-wrap text-muted-foreground mt-1">
                  {`searched_id: ${row.searched_id ?? "-"}\nsearch_success: ${row.search_success ?? "-"}\nenroll_id: ${row.enroll_id ?? "-"}\nenroll_success: ${row.enroll_success ?? "-"}`}
                </div>

              </div>

              <div className="w-20 text-right text-xs">{row.weight ?? "-"}</div>
              <div className="w-32 text-xs text-muted-foreground">{new Date(row.time_stamp).toISOString()}</div>

            </div>

          ))}

        </div>

      )}

    </div>

  );

}

