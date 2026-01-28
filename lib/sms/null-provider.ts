import type { SMSProvider } from './types';

/**
 * Placeholder SMS provider that logs messages instead of sending them.
 * Replace this with an actual provider implementation when ready.
 * 
 * To add a new provider:
 * 1. Create a new file (e.g., `your-provider.ts`)
 * 2. Implement the SMSProvider interface
 * 3. Update `lib/sms/index.ts` to return your provider based on SMS_PROVIDER env var
 */
export class NullProvider implements SMSProvider {
  async sendSMS({ to, message, userId }: {
    to: string;
    message: string;
    userId?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    // Log the message instead of sending it
    console.log('[SMS Provider] Message would be sent:', {
      to,
      message,
      userId,
      timestamp: new Date().toISOString(),
    });

    // Return success with a mock message ID
    // In production, replace this with actual SMS sending logic
    return {
      success: true,
      messageId: `mock-${Date.now()}-${Math.random().toString(36).substring(7)}`,
    };
  }
}

