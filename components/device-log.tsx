"use client";

import React from "react";

type DeviceLogRow = {
  id: number;
  device_id: string;
  time_stamp: string;
  total_print_ids?: number | null;
  search_event?: boolean | null;
  search_success?: boolean | null;
  searched_id?: number | null;
  total_searches?: number | null;
  enroll_event?: boolean | null;
  enroll_success?: boolean | null;
  enroll_id?: number | null;
  total_enrolls?: number | null;
  e_unlock?: boolean | null;
  total_e_unlocks?: number | null;
  clear_event?: boolean | null;
  total_opens?: number | null;
  time_since_last_open?: number | null;
  weight?: number | null;
};

export default function DeviceLog({ deviceLog }: { deviceLog: DeviceLogRow[] }) {
  if (!deviceLog || deviceLog.length === 0) {
    return (
      <div className="p-4 rounded border text-sm">No device log entries found.</div>
    );
  }

  return (
    <div className="overflow-auto rounded border">
      
      {deviceLog.map((row) => (
            <div key={row.id} className="border-t flex">
              <div className="p-2 align-top">
                {row.search_event ? "Search" : row.enroll_event ? "Enroll" : row.e_unlock ? "E-Unlock" : row.clear_event ? "Clear" : "Other"}
              </div>
              <div className="p-2 align-top">
                <div className="text-xs font-mono whitespace-pre-wrap">
                  {`searched_id: ${row.searched_id ?? "-"}\nsearch_success: ${row.search_success ?? "-"}\nenroll_id: ${row.enroll_id ?? "-"}\nenroll_success: ${row.enroll_success ?? "-"}`}
                </div>
              </div>
              {/* <p className="p-2 align-top">{row.weight ?? "-"}</p> */}
              <p className="p-2 align-top text-xs">{new Date(row.time_stamp).toISOString()}</p>

            </div>
          ))}
    </div>
  );
}

export type { DeviceLogRow };
