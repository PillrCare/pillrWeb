-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.agencies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  status text NOT NULL,
  CONSTRAINT agencies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.caregiver_patient (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  caregiver_id uuid NOT NULL,
  patient_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  agency uuid,
  CONSTRAINT caregiver_patient_pkey PRIMARY KEY (id),
  CONSTRAINT fk_caregiver_profile FOREIGN KEY (caregiver_id) REFERENCES public.profiles(id),
  CONSTRAINT fk_patient_profile FOREIGN KEY (patient_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.connection_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT connection_codes_pkey PRIMARY KEY (id),
  CONSTRAINT connection_codes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.device_commands (
  user_id uuid NOT NULL DEFAULT auth.uid() UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  enroll boolean NOT NULL DEFAULT false,
  emergency_unlock boolean NOT NULL DEFAULT false,
  device_id text NOT NULL UNIQUE,
  clear boolean NOT NULL DEFAULT false,
  command_id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  CONSTRAINT device_commands_pkey PRIMARY KEY (command_id),
  CONSTRAINT device_commands_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.device_log (
  device_id text NOT NULL,
  time_stamp timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  total_print_ids smallint,
  search_event boolean,
  search_success boolean,
  searched_id bigint,
  total_searches bigint,
  enroll_event boolean,
  enroll_success boolean,
  enroll_id bigint,
  total_enrolls bigint,
  e_unlock boolean,
  total_e_unlocks bigint,
  clear_event boolean,
  total_opens bigint,
  time_since_last_open bigint,
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  weight real,
  is_in_window boolean,
  CONSTRAINT device_log_pkey PRIMARY KEY (id)
);
CREATE TABLE public.next_event (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  device_id text NOT NULL,
  user_id uuid NOT NULL,
  schedule_id uuid NOT NULL,
  next_time timestamp with time zone,
  seconds_until_next bigint,
  window_minutes integer DEFAULT 60,
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT next_event_pkey PRIMARY KEY (id),
  CONSTRAINT fk_next_event_user FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT fk_next_event_schedule FOREIGN KEY (schedule_id) REFERENCES public.weekly_events(id),
  CONSTRAINT fk_next_event_device FOREIGN KEY (device_id) REFERENCES public.user_device(device_id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  updated_at timestamp with time zone,
  username text UNIQUE CHECK (char_length(username) >= 3),
  user_type text,
  agency_id uuid,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT profiles_agency_id_fkey FOREIGN KEY (agency_id) REFERENCES public.agencies(id)
);
CREATE TABLE public.user_device (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  assigned_date timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  is_active boolean,
  device_id text NOT NULL UNIQUE,
  user_id uuid,
  CONSTRAINT user_device_pkey PRIMARY KEY (id, device_id),
  CONSTRAINT user_device_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.weekly_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  day_of_week smallint NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
  dose_time time without time zone NOT NULL,
  description text,
  inserted_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT weekly_events_pkey PRIMARY KEY (id),
  CONSTRAINT weekly_events_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id)
);