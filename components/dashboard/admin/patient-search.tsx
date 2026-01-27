"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { Tables } from "@/lib/types";

type Profile = Tables<"profiles">;

type Caregiver = { id: string; username: string | null };
type CaregiverPatient = { caregiver_id: string; patient_id: string };

type Props = {
  profiles: Profile[]; // mixed users in the same agency
  agencyId?: string | null; // optional, used to double-check client-side filtering
  caregivers?: Caregiver[];
  caregiver_patient?: CaregiverPatient[];
  onSelectUser?: (userId: string) => void;
  showRoleFilters?: boolean; // optional, default true for backward compatibility
};

export function PatientSearch({ profiles, agencyId, onSelectUser, showRoleFilters = true }: Props) {
  const [searchTerm, setSearchTerm] = useState("");
  type RoleFilter = "all" | "patient" | "caregiver" | "admin" | null;
  const [roleFilter, setRoleFilter] = useState<RoleFilter>(showRoleFilters ? null : "patient");

  // Restrict to agency client-side (RLS should also enforce on server)
  const inAgency = useMemo(() => {
    return profiles.filter((p) => (agencyId ? p.agency_id === agencyId : true));
  }, [profiles, agencyId]);

  const filteredByRole = useMemo(() => {
    if (roleFilter === null) return [] as Profile[];
    return roleFilter === "all" ? inAgency : inAgency.filter((p) => p.user_type === roleFilter);
  }, [inAgency, roleFilter]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return filteredByRole;
    return filteredByRole.filter((p) => {
      const matchUsername = (p.username ?? "").toLowerCase().includes(term);
      const matchId = p.id.toLowerCase().includes(term);
      return matchUsername || matchId;
    });
  }, [filteredByRole, searchTerm]);

  const counts = useMemo(() => {
    return {
      all: inAgency.length,
      patient: inAgency.filter((p) => p.user_type === "patient").length,
      caregiver: inAgency.filter((p) => p.user_type === "caregiver").length,
      admin: inAgency.filter((p) => p.user_type === "admin").length,
    };
  }, [inAgency]);

  return (
    <div className="w-full space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search by username or ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {showRoleFilters && (
        <div className="flex gap-2">
          <Button variant={roleFilter === "all" ? "secondary" : "outline"} size="sm" onClick={() => setRoleFilter("all")}>
            All <Badge variant="outline" className="ml-1">{counts.all}</Badge>
          </Button>
          <Button variant={roleFilter === "patient" ? "secondary" : "outline"} size="sm" onClick={() => setRoleFilter("patient")}>
            Patients <Badge variant="outline" className="ml-1">{counts.patient}</Badge>
          </Button>
          <Button variant={roleFilter === "caregiver" ? "secondary" : "outline"} size="sm" onClick={() => setRoleFilter("caregiver")}>
            Caregivers <Badge variant="outline" className="ml-1">{counts.caregiver}</Badge>
          </Button>
          <Button variant={roleFilter === "admin" ? "secondary" : "outline"} size="sm" onClick={() => setRoleFilter("admin")}>
            Admins <Badge variant="outline" className="ml-1">{counts.admin}</Badge>
          </Button>
        </div>
      )}

        {roleFilter === null ? (
            <div></div>
        ) : (
            <div className="w-full max-h-96 overflow-auto border rounded-md p-2">
                {filtered.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                    {searchTerm ? "No users found" : "No users"}
                </div>
                ) : (
                <div className="space-y-2">
                    {filtered.map((user) => (
                    <div
                        key={user.id}
                        className="p-3 bg-accent rounded border flex justify-between items-center hover:bg-accent/80 transition-colors"
                    >
                        <div className="flex-1">
                        <div className="font-medium flex items-center gap-2">
                            {user.username || "No username"}
                            <Badge variant="secondary" className="capitalize">{user.user_type}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                            ID: {user.id.slice(0, 8)}...
                        </div>
                        </div>
                        {onSelectUser && (
                        <button
                            className="px-3 py-1.5 text-sm bg-background rounded border hover:bg-background/80"
                            onClick={() => onSelectUser(user.id)}
                        >
                            View Details
                        </button>
                        )}
                    </div>
                    ))}
                </div>
                )}
            </div>
        )}

        {searchTerm && roleFilter !== null && (
            <div className="text-xs text-muted-foreground">
            Found {filtered.length} of {filteredByRole.length} users
            </div>
        )}
        </div>
    );
}
