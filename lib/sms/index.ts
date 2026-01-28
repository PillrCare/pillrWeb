import { NullProvider } from './null-provider';
import type { SMSProvider } from './types';

/**
 * Get the configured SMS provider instance.
 * 
 * To add a new provider:
 * 1. Create a provider class implementing SMSProvider interface
 * 2. Import it above
 * 3. Add a case in the switch statement below
 * 4. Set SMS_PROVIDER environment variable to your provider name
 */
export function getSMSProvider(): SMSProvider {
  const provider = process.env.SMS_PROVIDER || 'null';
  
  switch (provider) {
    case 'null':
    default:
      return new NullProvider();
    // Add your provider here:
    // case 'your-provider':
    //   return new YourProvider();
  }
}

export type { SMSProvider } from './types';

