export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      agencies: {
        Row: {
          created_at: string
          id: string
          name: string
          status: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          status: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          status?: string
        }
        Relationships: []
      }
      caregiver_patient: {
        Row: {
          agency: string | null
          caregiver_id: string
          created_at: string
          id: string
          patient_id: string
        }
        Insert: {
          agency?: string | null
          caregiver_id: string
          created_at?: string
          id?: string
          patient_id: string
        }
        Update: {
          agency?: string | null
          caregiver_id?: string
          created_at?: string
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_caregiver_profile"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "patient_stats"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_caregiver_profile"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_patient_profile"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "patient_stats"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_patient_profile"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      connection_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "connection_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "patient_stats"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "connection_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_commands: {
        Row: {
          clear: boolean
          command_id: number
          created_at: string
          device_id: string
          emergency_unlock: boolean
          enroll: boolean
          user_id: string
        }
        Insert: {
          clear?: boolean
          command_id?: never
          created_at?: string
          device_id: string
          emergency_unlock?: boolean
          enroll?: boolean
          user_id?: string
        }
        Update: {
          clear?: boolean
          command_id?: never
          created_at?: string
          device_id?: string
          emergency_unlock?: boolean
          enroll?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_commands_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "patient_stats"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "device_commands_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      device_log: {
        Row: {
          clear_event: boolean | null
          device_id: string
          e_unlock: boolean | null
          enroll_event: boolean | null
          enroll_id: number | null
          enroll_success: boolean | null
          event_schedule_id: string | null
          id: number
          is_in_window: boolean | null
          search_event: boolean | null
          search_success: boolean | null
          searched_id: number | null
          time_since_last_open: number | null
          time_stamp: string
          total_e_unlocks: number | null
          total_enrolls: number | null
          total_opens: number | null
          total_print_ids: number | null
          total_searches: number | null
          weight: number | null
        }
        Insert: {
          clear_event?: boolean | null
          device_id: string
          e_unlock?: boolean | null
          enroll_event?: boolean | null
          enroll_id?: number | null
          enroll_success?: boolean | null
          event_schedule_id?: string | null
          id?: number
          is_in_window?: boolean | null
          search_event?: boolean | null
          search_success?: boolean | null
          searched_id?: number | null
          time_since_last_open?: number | null
          time_stamp?: string
          total_e_unlocks?: number | null
          total_enrolls?: number | null
          total_opens?: number | null
          total_print_ids?: number | null
          total_searches?: number | null
          weight?: number | null
        }
        Update: {
          clear_event?: boolean | null
          device_id?: string
          e_unlock?: boolean | null
          enroll_event?: boolean | null
          enroll_id?: number | null
          enroll_success?: boolean | null
          event_schedule_id?: string | null
          id?: number
          is_in_window?: boolean | null
          search_event?: boolean | null
          search_success?: boolean | null
          searched_id?: number | null
          time_since_last_open?: number | null
          time_stamp?: string
          total_e_unlocks?: number | null
          total_enrolls?: number | null
          total_opens?: number | null
          total_print_ids?: number | null
          total_searches?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_device_log_schedule"
            columns: ["event_schedule_id"]
            isOneToOne: false
            referencedRelation: "weekly_events"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          adverse_reactions: string | null
          brand_name: string | null
          created_at: string
          drug_interaction: string | null
          generic_name: string | null
          id: string
          name: string
          schedule_id: string
          updated_at: string
        }
        Insert: {
          adverse_reactions?: string | null
          brand_name?: string | null
          created_at?: string
          drug_interaction?: string | null
          generic_name?: string | null
          id?: string
          name: string
          schedule_id: string
          updated_at?: string
        }
        Update: {
          adverse_reactions?: string | null
          brand_name?: string | null
          created_at?: string
          drug_interaction?: string | null
          generic_name?: string | null
          id?: string
          name?: string
          schedule_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "weekly_events"
            referencedColumns: ["id"]
          },
        ]
      }
      next_event: {
        Row: {
          device_id: string
          id: string
          next_time: string | null
          schedule_id: string
          seconds_until_next: number | null
          updated_at: string
          user_id: string
          window_minutes: number | null
        }
        Insert: {
          device_id: string
          id?: string
          next_time?: string | null
          schedule_id: string
          seconds_until_next?: number | null
          updated_at?: string
          user_id: string
          window_minutes?: number | null
        }
        Update: {
          device_id?: string
          id?: string
          next_time?: string | null
          schedule_id?: string
          seconds_until_next?: number | null
          updated_at?: string
          user_id?: string
          window_minutes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_next_event_device"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "patient_stats"
            referencedColumns: ["device_id"]
          },
          {
            foreignKeyName: "fk_next_event_device"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "user_device"
            referencedColumns: ["device_id"]
          },
          {
            foreignKeyName: "fk_next_event_schedule"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "weekly_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_next_event_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "patient_stats"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_next_event_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          agency_id: string | null
          id: string
          timezone: string
          updated_at: string | null
          user_type: string | null
          username: string | null
        }
        Insert: {
          agency_id?: string | null
          id: string
          timezone?: string
          updated_at?: string | null
          user_type?: string | null
          username?: string | null
        }
        Update: {
          agency_id?: string | null
          id?: string
          timezone?: string
          updated_at?: string | null
          user_type?: string | null
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_dose_events: {
        Row: {
          actual_timestamp_utc: string | null
          created_at: string
          day_of_week: number
          device_log_id: number | null
          expected_date: string
          expected_time_utc: string
          expected_timestamp_utc: string
          id: string
          schedule_id: string
          status: string
          updated_at: string
          user_id: string
          window_end_utc: string
          window_minutes: number
          window_start_utc: string
        }
        Insert: {
          actual_timestamp_utc?: string | null
          created_at?: string
          day_of_week: number
          device_log_id?: number | null
          expected_date: string
          expected_time_utc: string
          expected_timestamp_utc: string
          id?: string
          schedule_id: string
          status?: string
          updated_at?: string
          user_id: string
          window_end_utc: string
          window_minutes?: number
          window_start_utc: string
        }
        Update: {
          actual_timestamp_utc?: string | null
          created_at?: string
          day_of_week?: number
          device_log_id?: number | null
          expected_date?: string
          expected_time_utc?: string
          expected_timestamp_utc?: string
          id?: string
          schedule_id?: string
          status?: string
          updated_at?: string
          user_id?: string
          window_end_utc?: string
          window_minutes?: number
          window_start_utc?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_dose_events_device_log_id_fkey"
            columns: ["device_log_id"]
            isOneToOne: false
            referencedRelation: "device_log"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_dose_events_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "weekly_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_dose_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "patient_stats"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "scheduled_dose_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_device: {
        Row: {
          assigned_date: string
          device_id: string
          id: number
          is_active: boolean | null
          user_id: string | null
        }
        Insert: {
          assigned_date?: string
          device_id: string
          id?: number
          is_active?: boolean | null
          user_id?: string | null
        }
        Update: {
          assigned_date?: string
          device_id?: string
          id?: number
          is_active?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_device_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "patient_stats"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "user_device_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_events: {
        Row: {
          day_of_week: number
          description: string | null
          dose_time: string
          id: string
          inserted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          day_of_week: number
          description?: string | null
          dose_time: string
          id?: string
          inserted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          day_of_week?: number
          description?: string | null
          dose_time?: string
          id?: string
          inserted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "patient_stats"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "weekly_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      patient_stats: {
        Row: {
          adherence_past_month_pct: number | null
          adherence_past_week_pct: number | null
          agency_id: string | null
          caregiver_id: string | null
          device_id: string | null
          emercency_accesses: number | null
          emergency_dose_count: number | null
          emergency_intervention_rate_pct: number | null
          failed_enrolls: number | null
          failed_searches: number | null
          late_count: number | null
          late_doses_pct: number | null
          missed_doses: number | null
          on_time_adherence_pct: number | null
          on_time_count: number | null
          patient_id: string | null
          search_success_count: number | null
          search_success_rate_pct: number | null
          total_enrolled_fingers: number | null
          total_events: number | null
          total_expected_doses: number | null
          total_opens: number | null
          total_search_events: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_caregiver_profile"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "patient_stats"
            referencedColumns: ["patient_id"]
          },
          {
            foreignKeyName: "fk_caregiver_profile"
            columns: ["caregiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _get_agency_for_id: { Args: { _user_id: string }; Returns: string }
      _target_device_id: { Args: never; Returns: string }
      backfill_scheduled_dose_events: {
        Args: { p_days_back?: number }
        Returns: number
      }
      connect_with_code: { Args: { input_code: string }; Returns: Json }
      convert_local_to_utc: {
        Args: { p_date: string; p_time: string; p_tz: string }
        Returns: string
      }
      generate_connection_code: {
        Args: never
        Returns: {
          generated_code: string
          generated_expiry: string
        }[]
      }
      generate_scheduled_dose_events: {
        Args: { p_date?: string; p_lookahead_days?: number }
        Returns: number
      }
      get_agency_id: { Args: never; Returns: string }
      get_patient_from_device: {
        Args: { _device_id: string }
        Returns: {
          agency_id: string | null
          id: string
          timezone: string
          updated_at: string | null
          user_type: string | null
          username: string | null
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_caregiver_for: { Args: { patient: string }; Returns: boolean }
      mark_missed_doses: { Args: never; Returns: number }
      sync_next_event_for_device: {
        Args: { p_device_id: string }
        Returns: undefined
      }
      upsert_device_command: {
        Args: {
          p_clear: boolean
          p_device_id: string
          p_emergency_unlock: boolean
          p_enroll: boolean
          p_user_id: string
        }
        Returns: {
          clear: boolean
          command_id: number
          created_at: string
          device_id: string
          emergency_unlock: boolean
          enroll: boolean
          user_id: string
        }[]
      }
    }
    Enums: {
      user_role: "patient" | "caregiver" | "admin"
      user_type: "Manager" | "Caretaker" | "Patient"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["patient", "caregiver", "admin"],
      user_type: ["Manager", "Caretaker", "Patient"],
    },
  },
} as const
