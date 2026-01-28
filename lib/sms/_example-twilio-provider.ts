/**
 * EXAMPLE: Twilio SMS Provider Implementation
 * 
 * This file serves as an example of how to implement an SMS provider.
 * To use Twilio:
 * 1. Install: npm install twilio
 * 2. Rename this file to twilio-provider.ts
 * 3. Update lib/sms/index.ts to import and use TwilioProvider
 * 4. Set SMS_PROVIDER=twilio environment variable
 * 5. Configure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
 */

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

