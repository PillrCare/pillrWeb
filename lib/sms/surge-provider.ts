import type { SMSProvider } from './types';

/**
 * Surge.app SMS Provider Implementation
 * 
 * This provider integrates with Surge.app's SMS API.
 * Documentation: https://docs.surge.app/api-reference/
 * 
 * Environment Variables Required:
 * - SURGE_API_KEY - Your Surge.app API key (Bearer token)
 * - SURGE_ACCOUNT_ID - Your Surge.app account ID (e.g., "acct_01j9a43avnfqzbjfch6pygv1td")
 * 
 * Optional:
 * - SURGE_API_URL - API base URL (defaults to https://api.surge.app)
 * 
 * To configure:
 * 1. Get your API key and account ID from Surge.app dashboard
 * 2. Set SURGE_API_KEY and SURGE_ACCOUNT_ID environment variables
 * 3. Set SMS_PROVIDER=surge to use this provider
 * 
 * API Reference:
 * - Endpoint: POST /accounts/{account_id}/messages
 * - Auth: Bearer token in Authorization header
 * - Request: { conversation: { contact: { phone_number } }, body: "message text" }
 * - Response: { id: "msg_...", ... }
 */
export class SurgeProvider implements SMSProvider {
  private apiKey: string;
  private accountId: string;
  private apiUrl: string;

  constructor() {
    this.apiKey = process.env.SURGE_API_KEY || '';
    this.accountId = process.env.SURGE_ACCOUNT_ID || '';
    this.apiUrl = process.env.SURGE_API_URL || 'https://api.surge.app';

    if (!this.apiKey) {
      throw new Error(
        'Surge.app API key not configured. Please set SURGE_API_KEY environment variable.'
      );
    }

    if (!this.accountId) {
      throw new Error(
        'Surge.app account ID not configured. Please set SURGE_ACCOUNT_ID environment variable.'
      );
    }
  }

  async sendSMS({ 
    to, 
    message, 
    userId 
  }: { 
    to: string; 
    message: string; 
    userId?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Surge.app API endpoint: POST /accounts/{account_id}/messages
      const endpoint = `${this.apiUrl}/accounts/${this.accountId}/messages`;
      
      // Request body format per Surge.app API docs
      // Uses conversation object with contact phone_number
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

      // Add metadata if userId provided (for tracking)
      if (userId) {
        requestBody.metadata = { userId };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
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

      // Surge.app returns message object with 'id' field (e.g., "msg_01j9e0m1m6fc38gsv2vkfqgzz2")
      const messageId = result.id;

      if (!messageId) {
        console.warn('Surge.app response did not include message ID:', result);
      }

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
}

