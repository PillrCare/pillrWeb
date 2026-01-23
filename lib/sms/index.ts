import { TwilioProvider } from './twilio-provider';
import type { SMSProvider } from './types';

export function getSMSProvider(): SMSProvider {
  const provider = process.env.SMS_PROVIDER || 'twilio';
  
  switch (provider) {
    case 'twilio':
    default:
      return new TwilioProvider();
  }
}

export type { SMSProvider } from './types';

