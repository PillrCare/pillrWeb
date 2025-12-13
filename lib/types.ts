export type DeviceLogRow = {
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

export type ScheduleEvent = {
  id: string;
  user_id: string;
  day_of_week: number;
  dose_time: string;
  description: string | null;
  inserted_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  updated_at: string | null;
  username: string | null;
  user_type: 'admin' | 'caregiver' | 'patient' | null;
  agency_id: string | null;
};

export type IncidentType = 'hardware_malfunction' | 'software_bug' | 'missed_dose_inquiry' | 'other';
export type ImpactLevel = 'none' | 'minor' | 'major' | 'serious_injury';
export type IncidentStatus = 'open' | 'investigating' | 'resolved' | 'closed';

export type Incident = {
  id: string;
  reporter_id: string;
  reporter_role: string;
  affected_patient_id: string;
  incident_type: IncidentType;
  description: string;
  impact_on_patient: ImpactLevel;
  evidence_url: string | null;
  agency_id: string;
  created_at: string;
  updated_at: string;
  status: IncidentStatus;
};

export type IncidentFormData = {
  affected_patient_id: string;
  incident_type: IncidentType;
  description: string;
  impact_on_patient: ImpactLevel;
  evidence_file?: File;
};
