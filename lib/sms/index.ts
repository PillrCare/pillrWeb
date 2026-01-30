import { NullProvider } from './null-provider';
import { SurgeProvider } from './surge-provider';
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
  
  // Log which provider is being used (helpful for debugging)
  if (provider === 'null') {
    console.warn('[SMS Provider] Using NullProvider - messages will be logged but not sent. Set SMS_PROVIDER=surge to enable SMS sending.');
  } else {
    console.log(`[SMS Provider] Using ${provider} provider`);
  }
  
  switch (provider) {
    case 'null':
    default:
      return new NullProvider();
    case 'surge':
      return new SurgeProvider();
    // Add your provider here:
    // case 'your-provider':
    //   return new YourProvider();
  }
}

export type { SMSProvider } from './types';

