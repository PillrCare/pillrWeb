import { createClient } from '@/lib/supabase/server';
import { getSMSProvider } from '@/lib/sms';
import { shouldSendReminder, formatReminderMessage } from '@/lib/sms/reminder-utils';
import { getSchemaDayOfWeekForDate } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

/**
 * API route to check for upcoming medications and send SMS reminders
 * Should be called by a cron job every 5 minutes
 */
export async function POST(request: Request) {
  // Optional: Add authentication/authorization check
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const smsProvider = getSMSProvider();
  
  const now = new Date();
  const currentDay = getSchemaDayOfWeekForDate(now);
  
  // Get all events for today with user phone numbers and medications
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
        sms_notifications_enabled
      ),
      medications(
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
    return Response.json({ error: 'Failed to fetch events' }, { status: 500 });
  }

  if (!events || events.length === 0) {
    return Response.json({ 
      success: true, 
      message: 'No reminders to send',
      sent: 0 
    });
  }

  const results = [];
  let sentCount = 0;
  let errorCount = 0;

  for (const event of events) {
    // Check if reminder should be sent (15 minutes before)
    if (!shouldSendReminder(event.dose_time, event.day_of_week, 15)) {
      continue;
    }

    // Check if reminder already sent today
    const today = new Date().toISOString().split('T')[0];
    const { data: existingReminder } = await supabase
      .from('sms_reminders')
      .select('id')
      .eq('event_id', event.id)
      .eq('reminder_date', today)
      .maybeSingle();

    if (existingReminder) {
      // Already sent today, skip
      continue;
    }

    const profile = Array.isArray(event.profiles) ? event.profiles[0] : event.profiles;
    if (!profile?.phone_number) {
      continue;
    }

    // Get medication name
    const medication = Array.isArray(event.medications) 
      ? event.medications[0] 
      : event.medications;
    
    const medicationName = medication?.name || 'your medication';
    
    // Convert UTC time to local for display
    const [hours, minutes] = event.dose_time.split(':').map(Number);
    const utcDate = new Date();
    utcDate.setUTCHours(hours, minutes, 0, 0);
    const localHours = utcDate.getHours();
    const localMinutes = utcDate.getMinutes();
    const localTime = `${String(localHours).padStart(2, '0')}:${String(localMinutes).padStart(2, '0')}`;

    // Format message
    const message = formatReminderMessage(
      medicationName,
      localTime,
      event.description
    );

    // Send SMS
    const smsResult = await smsProvider.sendSMS({
      to: profile.phone_number,
      message: message,
      userId: event.user_id,
    });

    if (smsResult.success) {
      // Log that reminder was sent
      await supabase.from('sms_reminders').insert({
        event_id: event.id,
        user_id: event.user_id,
        reminder_date: today,
        message_sent: message,
        twilio_message_id: smsResult.messageId,
        sent_at: new Date().toISOString(),
      });

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

  return Response.json({
    success: true,
    sent: sentCount,
    errors: errorCount,
    results: results,
  });
}

