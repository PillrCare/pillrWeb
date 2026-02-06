-- Migration: Setup pg_cron job for SMS reminders
-- Purpose: Schedule automatic SMS reminders via Supabase Edge Function
-- Affected: Creates a cron job that runs every 5 minutes

-- Enable required extensions if not already enabled
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Function to call the Edge Function for sending SMS reminders
-- This function will be called by pg_cron every 5 minutes
-- Uses SECURITY DEFINER because pg_cron needs elevated privileges to make HTTP calls
create or replace function public.call_sms_reminders_edge_function()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  project_url text;
  function_url text;
  response_status int;
  response_body text;
  cron_secret_value text;
  request_id bigint;
  http_result record;
begin
  -- Get the Supabase project URL
  -- Try to get from database setting first, then construct from current_database()
  begin
    project_url := current_setting('app.settings.supabase_url', true);
  exception
    when others then
      -- If setting doesn't exist, construct from database name
      -- Supabase database names typically include the project ref
      project_url := 'https://' || current_database() || '.supabase.co';
  end;
  
  -- Ensure project_url is not null (fallback to a default if needed)
  if project_url is null or project_url = '' then
    -- You need to set this manually - replace 'kermwtyzelyfkgjrfqtb' with your project ref
    project_url := 'https://kermwtyzelyfkgjrfqtb.supabase.co';
  end if;
  
  -- Construct the Edge Function URL
  -- Edge Functions are accessible at: /functions/v1/<function-name>
  function_url := project_url || '/functions/v1/send-sms-reminders';
  
  -- Validate URL is not null before proceeding
  if function_url is null or function_url = '' then
    raise exception 'Function URL is null or empty. Check project_url construction.';
  end if;
  
  -- Set CRON_SECRET here (must match the secret set in Edge Function secrets)
  -- Replace 'YOUR_SECRET_HERE' with your actual secret token
  -- If you don't want to use a secret, set this to empty string: ''
  cron_secret_value := 'YOUR_SECRET_HERE';
  
  -- Call the Edge Function via HTTP POST using pg_net
  -- Include CRON_SECRET in header if configured (for authentication)
  -- The Edge Function uses SUPABASE_SERVICE_ROLE_KEY internally for database access
  -- pg_net.http_post returns a request ID, then we collect the response
  declare
    request_id bigint;
    http_result record;
  begin
    -- Make the HTTP request (returns request ID)
    select net.http_post(
      url := function_url,
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', cron_secret_value
      )::jsonb,
      body := '{}'::jsonb,
      timeout_milliseconds := 30000
    ) into request_id;
    
    -- Collect the response (synchronous)
    select * into http_result
    from net.http_collect_response(request_id, async := false);
    
    response_status := http_result.status_code;
    response_body := http_result.body::text;
  end;
  
  -- Log warnings for non-200 responses (for debugging)
  if response_status != 200 then
    raise warning 'SMS reminders Edge Function returned status %: %', response_status, response_body;
  end if;
end;
$$;

-- Create the cron job to run every 5 minutes
-- Schedule format: minute hour day-of-month month day-of-week
-- '*/5 * * * *' means every 5 minutes
select cron.schedule(
  'send-sms-reminders',
  '*/5 * * * *',
  $$
  select public.call_sms_reminders_edge_function();
  $$
);

-- Add comment explaining the cron job
comment on function public.call_sms_reminders_edge_function() is 
  'Calls the send-sms-reminders Edge Function to check for upcoming medication doses and send SMS reminders. Scheduled to run every 5 minutes via pg_cron. The function uses pg_net to make HTTP POST requests to the Edge Function endpoint. If CRON_SECRET is set in Edge Function secrets and database settings, it will be included in the x-cron-secret header for authentication.';
