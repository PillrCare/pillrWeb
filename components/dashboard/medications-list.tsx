import React from "react";

type Medication = {
  id?: string | number;
  name?: string;
  dosage?: string;
  compartment?: string | number;
};

export default function MedicationsList({ medications = [] }: { medications?: Medication[] }) {
  return (
    <div className="p-3 bg-accent rounded border">
      <h4 className="font-semibold mb-2">Device Compartments</h4>
      <div className="space-y-2">
        {medications.length === 0 && <div className="text-sm text-muted-foreground">No medications found.</div>}
        {medications.map((med) => (
          <div key={med.id ?? med.name} className="p-3 bg-background rounded border flex justify-between">
            <div>
              <div className="font-medium">{med.name}</div>
              <div className="text-sm text-muted-foreground">{med.dosage}</div>
            </div>
            <div className="text-sm text-primary">Compartment {med.compartment ?? '—'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
