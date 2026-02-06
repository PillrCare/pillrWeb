/**
 * Supabase Edge Function: Send SMS Reminders
 * 
 * This function is called by pg_cron every 5 minutes to check for upcoming
 * medication doses and send SMS reminders to users who have opted in.
 * 
 * Environment Variables (set via Supabase secrets):
 * - SURGE_API_KEY - Surge.app API key
 * - SURGE_ACCOUNT_ID - Surge.app account ID
 * - CRON_SECRET - Secret token for authenticating cron requests (optional but recommended)
 * 
 * Pre-populated by Supabase:
 * - SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from 'npm:@supabase/supabase-js@2.39.3';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const SURGE_API_KEY = Deno.env.get('SURGE_API_KEY') ?? '';
const SURGE_ACCOUNT_ID = Deno.env.get('SURGE_ACCOUNT_ID') ?? '';
const SURGE_API_URL = Deno.env.get('SURGE_API_URL') ?? 'https://api.surge.app';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

interface WeeklyEvent {
  id: string;
  user_id: string;
  day_of_week: number;
  dose_time: string; // HH:mm format in UTC
  description: string | null;
}

interface Profile {
  id: string;
  phone_number: string | null;
  sms_notifications_enabled: boolean;
  timezone: string;
}

interface Medication {
  id: string;
  schedule_id: string;
  name: string;
  brand_name: string | null;
  generic_name: string | null;
}

/**
 * Get the day of week in schema format (1=Monday, 7=Sunday)
 * Maps JS getDay() (0=Sun..6=Sat) to schema format (1=Mon..7=Sun)
 */
function getSchemaDayOfWeekForDate(date: Date): number {
  const js = date.getDay(); // 0..6
  return js === 0 ? 7 : js; // 1=Mon..6=Sat, 7=Sun
}

/**
 * Check if a dose time reminder should be sent now
 * 
 * Logic:
 * 1. Calculate ideal reminder time (15 minutes before dose)
 * 2. Round reminder time DOWN to nearest 5-minute interval (cron runs every 5 min)
 * 3. Check if current time matches the rounded reminder time (within 5-minute window)
 * 
 * Example: Dose at 11:37
 * - Ideal reminder: 11:22 (15 min before)
 * - Rounded reminder: 11:20 (round down to nearest 5 min)
 * - Send when cron runs at 11:20 (within window)
 * 
 * @param utcDoseTime - UTC time string (HH:mm format)
 * @param dayOfWeek - Day of week (1=Monday, 7=Sunday)
 * @returns true if reminder should be sent now
 */
function shouldSendReminder(utcDoseTime: string, dayOfWeek: number): boolean {
  const now = new Date();
  const currentDay = getSchemaDayOfWeekForDate(now);
  
  // Check if it's the right day
  if (currentDay !== dayOfWeek) {
    return false;
  }

  // Parse UTC dose time
  const [hours, minutes] = utcDoseTime.split(':').map(Number);
  
  // Create a Date object for today's UTC time
  const utcDate = new Date();
  utcDate.setUTCHours(hours, minutes, 0, 0);
  
  // Calculate ideal reminder time (15 minutes before dose)
  const idealReminderTime = new Date(utcDate.getTime() - 15 * 60 * 1000);
  
  // Round reminder time DOWN to nearest 5-minute interval
  // This ensures we catch reminders at 5-minute cron intervals
  // Example: 11:37 dose -> 11:22 ideal -> 11:20 rounded (sent at 11:20)
  const reminderHours = idealReminderTime.getUTCHours();
  const reminderMinutes = idealReminderTime.getUTCMinutes();
  const roundedMinutes = Math.floor(reminderMinutes / 5) * 5; // Round down to 0, 5, 10, 15, etc.
  
  // Create rounded reminder time
  const roundedReminderTime = new Date();
  roundedReminderTime.setUTCFullYear(idealReminderTime.getUTCFullYear());
  roundedReminderTime.setUTCMonth(idealReminderTime.getUTCMonth());
  roundedReminderTime.setUTCDate(idealReminderTime.getUTCDate());
  roundedReminderTime.setUTCHours(reminderHours);
  roundedReminderTime.setUTCMinutes(roundedMinutes);
  roundedReminderTime.setUTCSeconds(0);
  roundedReminderTime.setUTCMilliseconds(0);
  
  // Check if current time is within a 5-minute window around the rounded reminder time
  // This accounts for cron job running every 5 minutes
  const timeDiff = now.getTime() - roundedReminderTime.getTime();
  const windowSize = 5 * 60 * 1000; // 5 minutes
  
  // Reminder should be sent if we're within the window (0 to 5 minutes after rounded time)
  return timeDiff >= 0 && timeDiff <= windowSize;
}

/**
 * Convert UTC time to Mountain Time and format as 12-hour
 * 
 * NOTE: Currently hardcoded to Mountain Time (America/Denver) for all users.
 * This handles both MST (UTC-7) and MDT (UTC-6) automatically based on DST.
 * 
 * TODO: Update to use user's timezone from profiles.timezone when available
 * 
 * This matches the pattern used in lib/utils.ts formatUtcTimeForLocalDisplay
 */
function convertUtcToLocalTime(utcTime: string, userTimezone: string | undefined): string {
  // Parse UTC time (HH:mm format)
  const [hours, minutes] = utcTime.split(':').map(Number);
  
  // Create a Date object for today at the UTC time
  // This matches the pattern from lib/utils.ts
  const now = new Date();
  const utcDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    hours,
    minutes,
    0,
    0
  ));
  
  // Convert to Mountain Time (America/Denver)
  // This automatically handles DST transitions
  const localTimeStr = utcDate.toLocaleTimeString('en-US', {
    timeZone: 'America/Denver',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
  
  return localTimeStr;
}

/**
 * Format medication reminder message
 */
function formatReminderMessage(
  medicationName: string,
  utcDoseTime: string,
  userTimezone: string | undefined, // Currently unused - hardcoded to Mountain Time
  description?: string | null
): string {
  // Convert UTC time to Mountain Time (see convertUtcToLocalTime for details)
  const localTimeStr = convertUtcToLocalTime(utcDoseTime, userTimezone);
  
  let message = `Reminder: Take ${medicationName} at ${localTimeStr}`;
  
  if (description) {
    message += `\n\nNote: ${description}`;
  }
  
  return message;
}

/**
 * Send SMS via Surge.app API
 */
async function sendSMSViaSurge(
  to: string,
  message: string,
  userId?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!SURGE_API_KEY || !SURGE_ACCOUNT_ID) {
    return {
      success: false,
      error: 'Surge.app API credentials not configured',
    };
  }

  try {
    const endpoint = `${SURGE_API_URL}/accounts/${SURGE_ACCOUNT_ID}/messages`;
    
    const requestBody: {
      conversation: {
        contact: {
          phone_number: string;
        };
      };
      body: string;
      metadata?: Record<string, string>;
    } = {
      conversation: {
        contact: {
          phone_number: to,
        },
      },
      body: message,
    };

    if (userId) {
      requestBody.metadata = { userId };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SURGE_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData);
      } catch {
        const errorText = await response.text();
        errorMessage = errorText || errorMessage;
      }
      throw new Error(`Surge.app API error: ${errorMessage}`);
    }

    const result = await response.json();
    const messageId = result.id;

    return {
      success: true,
      messageId: messageId || `surge-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  } catch (error) {
    console.error('Surge.app SMS error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

Deno.serve(async (req: Request) => {
  try {
    // Optional authentication: Check for CRON_SECRET if configured
    // This prevents unauthorized calls to the function
    if (CRON_SECRET) {
      const authHeader = req.headers.get('x-cron-secret') || req.headers.get('authorization');
      const providedSecret = authHeader?.replace('Bearer ', '') || authHeader;
      
      if (providedSecret !== CRON_SECRET) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    // Initialize Supabase client with service role key (bypasses RLS)
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const now = new Date();
    const currentDay = getSchemaDayOfWeekForDate(now);

    // Query weekly_events for today's events with user profile info and medications
    // Only get events for users who have SMS enabled and phone numbers
    const { data: events, error: eventsError } = await supabase
      .from('weekly_events')
      .select(`
        id,
        user_id,
        day_of_week,
        dose_time,
        description,
        profiles!inner(
          id,
          phone_number,
          sms_notifications_enabled,
          timezone
        ),
        medications(
          id,
          name,
          brand_name,
          generic_name
        )
      `)
      .eq('day_of_week', currentDay)
      .eq('profiles.sms_notifications_enabled', true)
      .not('profiles.phone_number', 'is', null);

    if (eventsError) {
      console.error('Error fetching events:', eventsError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch events', details: eventsError.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!events || events.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No reminders to send', sent: 0 }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    const results = [];
    let sentCount = 0;
    let errorCount = 0;

    for (const event of events) {
      // Check if reminder should be sent (15 minutes before)
      if (!shouldSendReminder(event.dose_time, event.day_of_week)) {
        continue;
      }

      // Get profile (handle both array and object responses)
      const profile = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles;
      
      if (!profile?.phone_number || !profile?.sms_notifications_enabled) {
        continue;
      }

      // Get medication info (prefer brand_name, then name, then generic_name, then description)
      const medications: Medication[] = Array.isArray(event.medications) 
        ? event.medications 
        : (event.medications ? [event.medications] : []);
      
      // Format medication names for SMS
      let medicationName = 'your medication';
      if (medications.length > 0) {
        // Get display names for each medication (prefer brand_name, then name, then generic_name)
        const medicationNames = medications.map(med => 
          med.brand_name || med.name || med.generic_name || 'medication'
        );
        
        // Format with commas and "and" for the last one
        if (medicationNames.length === 1) {
          medicationName = medicationNames[0];
        } else if (medicationNames.length === 2) {
          medicationName = `${medicationNames[0]} and ${medicationNames[1]}`;
        } else {
          // 3 or more: "ibuprofen, ozempic, and adderall"
          const allButLast = medicationNames.slice(0, -1).join(', ');
          const last = medicationNames[medicationNames.length - 1];
          medicationName = `${allButLast}, and ${last}`;
        }
      } else if (event.description) {
        medicationName = event.description;
      }

      // Format message with timezone conversion
      // NOTE: Currently converting all times to Mountain Time (America/Denver)
      // TODO: Update to use profile.timezone when timezone field is properly populated
      const noteDescription = (medications.length > 0 && event.description) 
        ? event.description 
        : null;
      
      const message = formatReminderMessage(
        medicationName,
        event.dose_time,
        undefined, // Not used currently - hardcoded to Mountain Time in convertUtcToLocalTime
        noteDescription
      );

      // Send SMS
      const smsResult = await sendSMSViaSurge(
        profile.phone_number,
        message,
        event.user_id
      );

      if (smsResult.success) {
        sentCount++;
        results.push({
          eventId: event.id,
          userId: event.user_id,
          success: true,
          messageId: smsResult.messageId,
        });
      } else {
        errorCount++;
        results.push({
          eventId: event.id,
          userId: event.user_id,
          success: false,
          error: smsResult.error,
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent: sentCount,
        errors: errorCount,
        results: results,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Edge Function error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
