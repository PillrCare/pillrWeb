"use client";

import { DeviceLogRow } from "@/lib/types"

export default function UserStats({ deviceLog }: { deviceLog: DeviceLogRow[] }) {

  const numOpens: number = deviceLog.filter(row => row.search_success === true).length;

  return (
    <div className="rounded border">
      <div className="flex items-center justify-between p-3">
        <h3 className="text-lg font-semibold">User Stats</h3>
      </div>

      {(!deviceLog || deviceLog.length === 0) && (
        <div className="p-4 text-sm">No Stats Yet</div>
      )}

      {deviceLog && deviceLog.length > 0 && (
        
        <div className="flex">
          <div className="w-full text-left text-lg">Successful opens: {numOpens}</div>

        

        </div>

      )}

    </div>

  );

}

