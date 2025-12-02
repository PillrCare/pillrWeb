import React from "react";

type MissedDose = {
  medication?: string;
  name?: string;
  time?: string;
  reason?: string;
};

export default function MissedDosesList({ missed = [] }: { missed?: MissedDose[] }) {
  if (!missed || missed.length === 0) return null;

  return (
    <div className="p-3 bg-accent rounded border">
      <h4 className="font-semibold mb-2">Recent Missed Doses</h4>
      <div className="space-y-2">
        {missed.map((dose, idx) => (
          <div key={idx} className="flex items-center justify-between p-3 bg-red-50 rounded border border-red-200">
            <div>
              <div className="font-medium">{dose.medication ?? dose.name}</div>
              <div className="text-sm text-muted-foreground">{dose.time}</div>
            </div>
            <div className="text-sm">{dose.reason ?? 'Not verified'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
