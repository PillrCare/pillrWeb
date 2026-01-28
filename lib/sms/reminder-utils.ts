import { getSchemaDayOfWeekForDate } from '@/lib/utils';

/**
 * Check if a dose time is within the reminder window (15 minutes before)
 * @param utcDoseTime - UTC time string (HH:mm format)
 * @param dayOfWeek - Day of week (1=Monday, 7=Sunday)
 * @param reminderMinutes - Minutes before dose to send reminder (default 15)
 * @returns true if reminder should be sent now
 */
export function shouldSendReminder(
  utcDoseTime: string,
  dayOfWeek: number,
  reminderMinutes: number = 15
): boolean {
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
  
  // Convert to local time for comparison
  const localDoseTime = new Date(utcDate);
  
  // Calculate reminder time (15 minutes before)
  const reminderTime = new Date(localDoseTime.getTime() - reminderMinutes * 60 * 1000);
  
  // Check if current time is within a 5-minute window around the reminder time
  // This accounts for cron job running every 5 minutes
  const timeDiff = now.getTime() - reminderTime.getTime();
  const windowSize = 5 * 60 * 1000; // 5 minutes
  
  return timeDiff >= 0 && timeDiff <= windowSize;
}

/**
 * Format medication reminder message
 */
export function formatReminderMessage(
  medicationName: string,
  doseTime: string,
  description?: string | null
): string {
  const [hours, minutes] = doseTime.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  const timeStr = `${hours12}:${String(minutes).padStart(2, '0')} ${period}`;
  
  let message = `Reminder: Take ${medicationName} at ${timeStr}`;
  
  if (description) {
    message += `\n\nNote: ${description}`;
  }
  
  return message;
}

