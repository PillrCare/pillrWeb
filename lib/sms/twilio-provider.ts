import twilio from 'twilio';
import type { SMSProvider } from './types';

export class TwilioProvider implements SMSProvider {
  private client: twilio.Twilio;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured. Please set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.');
    }

    this.client = twilio(accountSid, authToken);
  }

  async sendSMS({ to, message }: { to: string; message: string }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;
      if (!twilioPhoneNumber) {
        throw new Error('TWILIO_PHONE_NUMBER environment variable not set');
      }

      const result = await this.client.messages.create({
        body: message,
        from: twilioPhoneNumber,
        to: to,
      });

      return { success: true, messageId: result.sid };
    } catch (error) {
      console.error('Twilio SMS error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      };
    }
  }
}

