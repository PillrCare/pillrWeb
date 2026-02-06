# Send SMS Reminders Edge Function

This Supabase Edge Function sends automated SMS medication reminders to users 15 minutes before their scheduled doses.

## Overview

The function is called by pg_cro n every 5 minutes to:
1. Query `weekly_events` for today's medication schedules
2. Filter events that are 15 minutes in the future
3. Check user SMS opt-in status and phone numbers
4. Send SMS reminders via Surge.app API

## Environment Variables

Set these via Supabase secrets:

```bash
supabase secrets set SURGE_API_KEY=your_api_key
supabase secrets set SURGE_ACCOUNT_ID=your_account_id
supabase secrets set SURGE_API_URL=https://api.surge.app  # Optional
```

Pre-populated by Supabase:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## Deployment

```bash
supabase functions deploy send-sms-reminders
```

## Testing

Test the function manually:

```bash
curl -X POST https://<project-ref>.supabase.co/functions/v1/send-sms-reminders \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Response Format

```json
{
  "success": true,
  "sent": 5,
  "errors": 0,
  "results": [
    {
      "eventId": "uuid",
      "userId": "uuid",
      "success": true,
      "messageId": "msg_..."
    }
  ]
}
```

## Error Handling

The function returns appropriate HTTP status codes:
- `200` - Success (even if some SMS failed)
- `500` - Internal server error

Check Supabase Dashboard → Edge Functions → Logs for detailed error messages.
