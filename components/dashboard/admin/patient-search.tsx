"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type Patient = {
  id: string;
  username: string | null;
  user_device?: Array<{ device_id: string }>;
};

type PatientWithCaregiver = Patient & {
  caregiver_name?: string;
};

type Props = {
  patients: Patient[];
  caregivers?: Array<{ id: string; username: string | null }>;
  caregiver_patient?: Array<{ caregiver_id: string; patient_id: string }>;
  onSelectPatient?: (patientId: string) => void;
};

export function PatientSearch({ patients, caregivers = [], caregiver_patient = [], onSelectPatient }: Props) {
  const [searchTerm, setSearchTerm] = useState("");

  // Enrich patients with caregiver info
  const enrichedPatients: PatientWithCaregiver[] = patients.map((patient) => {
    const caregiverLink = caregiver_patient.find((cp) => cp.patient_id === patient.id);
    const caregiver = caregiverLink ? caregivers.find((c) => c.id === caregiverLink.caregiver_id) : null;
    return {
      ...patient,
      caregiver_name: caregiver?.username || undefined,
    };
  });

  // Filter patients based on search term
  const filteredPatients = searchTerm.trim()
    ? enrichedPatients.filter((patient) => {
        const term = searchTerm.toLowerCase();
        return (
          patient.username?.toLowerCase().includes(term) ||
          patient.id.toLowerCase().includes(term) ||
          patient.caregiver_name?.toLowerCase().includes(term)
        );
      })
    : enrichedPatients;

  return (
    <div className="w-full space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by username, ID, or caregiver..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="w-full max-h-96 overflow-auto border rounded-md p-2">
        {filteredPatients.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-8">
            {searchTerm ? "No patients found" : "No patients"}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="p-3 bg-accent rounded border flex justify-between items-center hover:bg-accent/80 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium">{patient.username || "No username"}</div>
                  <div className="text-xs text-muted-foreground">
                    ID: {patient.id.slice(0, 8)}...
                    {patient.caregiver_name && (
                      <span className="ml-2">• Caregiver: {patient.caregiver_name}</span>
                    )}
                  </div>
                </div>
                {onSelectPatient && (
                  <button
                    className="px-3 py-1.5 text-sm bg-background rounded border hover:bg-background/80"
                    onClick={() => onSelectPatient(patient.id)}
                  >
                    View Details
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {searchTerm && (
        <div className="text-xs text-muted-foreground">
          Found {filteredPatients.length} of {patients.length} patients
        </div>
      )}
    </div>
  );
}
