# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Pillr is a medication adherence monitoring application using IoT devices. It connects patients with caregivers and agencies to track medication schedules and device interactions.

## Development Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Build for production
npm run lint         # Run ESLint
npm start            # Start production server
```

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19 and TypeScript
- **Database/Auth**: Supabase (PostgreSQL with RLS, cookie-based SSR auth)
- **Styling**: Tailwind CSS with shadcn/ui components (New York style)
- **Email**: Resend for transactional emails

## Architecture

### Supabase Client Pattern

Two separate clients for different contexts:
- `lib/supabase/client.ts` - Browser client using `createBrowserClient`
- `lib/supabase/server.ts` - Server client using `createServerClient` with cookies (always create fresh instance per request, never cache globally)

### User Roles and Dashboard Routing

Three user types stored in `profiles.user_type`:
- `Patient` - Routes to `/dashboard/patient`
- `Caretaker` - Routes to `/dashboard/caregiver`
- `Manager` - Routes to `/dashboard/admin`

Dashboard redirects are handled in `app/dashboard/page.tsx` based on user type.

### Timezone Handling

- Database stores all times in UTC
- `lib/utils.ts` provides conversion functions for display
- Schema uses `day_of_week` as 1=Monday through 7=Sunday (differs from JS `getDay()` where 0=Sunday)
- Use `getSchemaDayOfWeekForDate()` for JS Date to schema conversion

### Key Database Tables

See `SCHEMA.md` for full schema. Important tables:
- `profiles` - User data with `user_type` and `agency_id`
- `weekly_events` - Medication schedule (day, dose_time, description)
- `device_commands` - Commands sent to IoT devices (enroll, emergency_unlock, clear)
- `device_log` - Device activity logs
- `caregiver_patient` - Caregiver-patient relationships
- `connection_codes` - Temporary pairing codes

### Database Functions

Key functions available:
- `generate_connection_code()` - Create pairing codes
- `connect_with_code()` - Connect users via code
- `is_caregiver_for()` - Check caregiver permissions
- `upsert_device_command()` - Manage device commands
- `convert_local_to_utc()` - Timezone conversion

## Supabase Development Guidelines

### Database Functions

- Default to `SECURITY INVOKER`
- Always set `search_path = ''` and use fully qualified names (`public.table_name`)
- Prefer `IMMUTABLE` or `STABLE` over `VOLATILE` when possible

### RLS Policies

- Use `auth.uid()` for user identification, wrap in `(select auth.uid())` for performance
- Create separate policies for SELECT, INSERT, UPDATE, DELETE (not `FOR ALL`)
- Always specify role with `TO authenticated` or `TO anon`
- Add indexes on columns used in RLS policies

### SQL Style

- Use lowercase for SQL keywords
- Use snake_case for identifiers
- Prefer plural table names, singular column names
- Always add schema prefix (`public.table_name`)

### Realtime (if implementing)

- Use `broadcast` pattern, avoid `postgres_changes` (doesn't scale)
- Topic naming: `scope:entity:id` (e.g., `room:123:messages`)
- Event naming: `entity_action` (e.g., `message_created`)
- Set `private: true` for channels using RLS
- Always include cleanup/unsubscribe logic

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
RESEND_API_KEY
CONTACT_EMAIL
RESEND_FROM_EMAIL
```
