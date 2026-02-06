# SMS Reminders Architecture

This document describes the architecture for automated SMS medication reminders in Pillr.

## Overview

SMS reminders are sent automatically to users 15 minutes before their scheduled medication doses. The system uses:
- **Supabase Edge Functions** - Serverless function that queries the database and sends SMS
- **pg_cron** - PostgreSQL extension that schedules the Edge Function to run every 5 minutes
- **Surge.app** - SMS provider for sending messages

## Architecture Flow

```
pg_cron (every 5 min)
    ↓
PostgreSQL Function (call_sms_reminders_edge_function)
    ↓
HTTP POST to Edge Function
    ↓
Edge Function (send-sms-reminders)
    ↓
Query weekly_events table
    ↓
Filter events 15 minutes in future
    ↓
Check user SMS opt-in & phone number
    ↓
Send SMS via Surge.app API
```

## Components

### 1. Supabase Edge Function: `send-sms-reminders`

**Location**: `supabase/functions/send-sms-reminders/index.ts`

**Purpose**: 
- Queries `weekly_events` table for today's events
- Filters events that are 15 minutes in the future (within a 5-minute window)
- Checks user's `sms_notifications_enabled` and `phone_number` from `profiles` table
- Sends SMS reminders via Surge.app API

**Environment Variables** (set via Supabase secrets):
- `SURGE_API_KEY` - Surge.app API key (Bearer token)
- `SURGE_ACCOUNT_ID` - Surge.app account ID
- `SURGE_API_URL` - Optional, defaults to `https://api.surge.app`
- `CRON_SECRET` - Optional secret token for authenticating cron requests (recommended for security)

**Pre-populated by Supabase**:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for database access (bypasses RLS)

### 2. pg_cron Job

**Location**: `supabase/migrations/20260131033018_setup_sms_reminders_cron.sql`

**Purpose**: 
- Schedules the Edge Function to run every 5 minutes
- Uses `pg_net` extension to make HTTP calls to the Edge Function

**Schedule**: `*/5 * * * *` (every 5 minutes)

**Function**: `public.call_sms_reminders_edge_function()`
- Makes HTTP POST request to Edge Function endpoint
- Handles errors and logs warnings for debugging

## Database Schema

### weekly_events Table

```sql
- id (uuid)
- user_id (uuid) - References profiles.id
- day_of_week (smallint) - 1=Monday, 7=Sunday
- dose_time (time) - UTC time in HH:mm format
- description (text) - Medication name/description
```

### profiles Table

```sql
- id (uuid)
- phone_number (text) - E.164 format phone number
- sms_notifications_enabled (boolean) - User's SMS opt-in status
- sms_opt_in_shown (boolean) - Whether user has seen opt-in page
```

## Deployment

### 1. Deploy Edge Function

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>

# Deploy the Edge Function
supabase functions deploy send-sms-reminders
```

### 2. Set Environment Variables (Secrets)

**Via Supabase Dashboard:**
1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Add the following secrets:
   - `SURGE_API_KEY` = your Surge API key
   - `SURGE_ACCOUNT_ID` = your Surge account ID
   - `SURGE_API_URL` = `https://api.surge.app` (optional)
   - `CRON_SECRET` = a random secret token (recommended for security)

**Via CLI:**
```bash
# Set Surge.app credentials
supabase secrets set SURGE_API_KEY=your_surge_api_key
supabase secrets set SURGE_ACCOUNT_ID=your_surge_account_id

# Optional: Set custom API URL
supabase secrets set SURGE_API_URL=https://api.surge.app

# Optional but recommended: Set cron secret for authentication
supabase secrets set CRON_SECRET=your-random-secret-token
```

**Set CRON_SECRET in Database (if using SQL):**
```sql
-- Run this in SQL Editor after setting the secret
alter database current_database() 
set app.settings.cron_secret = 'your-random-secret-token';
```

### 3. Run Migration

```bash
# Apply the pg_cron migration
supabase db push

# Or manually run the migration in Supabase SQL Editor
```

### 4. Configure Database Settings (if needed)

If the Edge Function URL cannot be auto-detected, or if you're using CRON_SECRET, set these in SQL Editor:

```sql
-- Set Supabase project URL (if auto-detection fails)
alter database current_database() 
set app.settings.supabase_url = 'https://<your-project-ref>.supabase.co';

-- Set CRON_SECRET (must match the secret set in Edge Function secrets)
alter database current_database() 
set app.settings.cron_secret = 'your-random-secret-token';
```

**Note:** The `cron_secret` in the database setting must match the `CRON_SECRET` environment variable set in Edge Function secrets.

## How It Works

1. **Every 5 minutes**, pg_cron triggers `call_sms_reminders_edge_function()`
2. The function makes an HTTP POST request to the Edge Function endpoint
3. The Edge Function:
   - Gets current date/time and calculates today's day of week (1-7)
   - Queries `weekly_events` for events matching today's day
   - Joins with `profiles` to get user phone numbers and SMS preferences
   - Filters to only users with `sms_notifications_enabled = true` and valid `phone_number`
   - For each event, checks if it's 15 minutes in the future (within 5-minute window)
   - Sends SMS via Surge.app API with medication name and time
   - Returns summary of sent/error counts

## Timezone Handling

- All times in the database are stored in **UTC**
- The Edge Function calculates reminders based on UTC times
- SMS messages display times in 12-hour format (AM/PM)
- The 15-minute reminder window accounts for the 5-minute cron interval

## Monitoring

### Check Cron Job Status

```sql
-- View all cron jobs
select * from cron.job;

-- View cron job run history
select * from cron.job_run_details 
where jobid = (select jobid from cron.job where jobname = 'send-sms-reminders')
order by start_time desc 
limit 10;
```

### Check Edge Function Logs

View logs in Supabase Dashboard:
1. Go to **Edge Functions** → **send-sms-reminders**
2. Click **Logs** tab
3. View execution history and errors

### Test Edge Function Manually

```bash
# Call the Edge Function directly
curl -X POST https://<your-project-ref>.supabase.co/functions/v1/send-sms-reminders \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Troubleshooting

### Cron Job Not Running

1. Check if pg_cron extension is enabled:
   ```sql
   select * from pg_extension where extname = 'pg_cron';
   ```

2. Check if pg_net extension is enabled:
   ```sql
   select * from pg_extension where extname = 'pg_net';
   ```

3. Verify cron job exists:
   ```sql
   select * from cron.job where jobname = 'send-sms-reminders';
   ```

### Edge Function Errors

1. Check Edge Function logs in Supabase Dashboard
2. Verify environment variables are set:
   ```bash
   supabase secrets list
   ```
3. Test Edge Function manually (see above)

### SMS Not Sending

1. Verify user has `sms_notifications_enabled = true`
2. Verify user has a valid `phone_number` in E.164 format
3. Check Surge.app API credentials are correct
4. Verify the event's `day_of_week` matches today
5. Check if event time is within the 15-minute reminder window

## Security Considerations

- Edge Function uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS for cron operations
- **Authentication**: The Edge Function supports optional `CRON_SECRET` authentication via `x-cron-secret` header to prevent unauthorized calls
- Edge Function endpoint can be public but should use `CRON_SECRET` for production
- SMS provider credentials are stored as Supabase secrets (encrypted)
- User phone numbers are only accessed for users who have opted in
- **Recommendation**: Set `CRON_SECRET` in both Edge Function secrets and database settings for production use

## Future Enhancements

- Add retry logic for failed SMS sends
- Track SMS delivery status via webhooks
- Support multiple reminder times (e.g., 30 min, 1 hour before)
- Add rate limiting to prevent SMS spam
- Support timezone-aware reminders based on user's timezone preference
