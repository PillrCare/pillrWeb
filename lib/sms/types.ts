export interface SMSProvider {
  sendSMS(params: {
    to: string;
    message: string;
    userId?: string;
  }): Promise<{ success: boolean; messageId?: string; error?: string }>;
}

