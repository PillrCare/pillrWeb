import { createClient } from "@/lib/supabase/server";
import { getSMSProvider } from "@/lib/sms";

export const dynamic = 'force-dynamic';

/**
 * API route to handle SMS opt-in preferences
 * Updates user profile with phone number and SMS preferences
 * Sends welcome SMS if user opts in
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return Response.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    let { phoneNumber, smsNotificationsEnabled } = body;

    // Get current profile to check if user is opting in for the first time
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('sms_notifications_enabled, phone_number')
      .eq('id', user.id)
      .maybeSingle();

    const wasOptedIn = currentProfile?.sms_notifications_enabled || false;
    const isOptingIn = smsNotificationsEnabled && !wasOptedIn;

    // Validate input
    if (smsNotificationsEnabled && !phoneNumber) {
      return Response.json(
        { error: 'Phone number is required when opting into SMS notifications' },
        { status: 400 }
      );
    }

    // Normalize phone number format (ensure E.164)
    if (phoneNumber) {
      // Remove formatting characters
      phoneNumber = phoneNumber.replace(/\s|-|\(|\)|\./g, "");
      // Add + if not present (assuming US numbers for now)
      if (!phoneNumber.startsWith("+")) {
        phoneNumber = "+" + phoneNumber;
      }
    }

    // Update profile
    const updateData: {
      phone_number: string | null;
      sms_notifications_enabled: boolean;
      sms_opt_in_shown: boolean;
    } = {
      phone_number: phoneNumber || null,
      sms_notifications_enabled: smsNotificationsEnabled || false,
      sms_opt_in_shown: true, // Mark as shown
    };

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user.id);

    if (updateError) {
      console.error('Error updating profile:', updateError);
      return Response.json(
        { error: 'Failed to update SMS preferences' },
        { status: 500 }
      );
    }

    // Only send welcome SMS if user is opting in for the first time (not just updating preferences)
    if (isOptingIn && phoneNumber) {
      try {
        const smsProvider = getSMSProvider();
        const welcomeMessage = "Welcome to Pillr! You're now subscribed to SMS medication reminders. You'll receive notifications 15 minutes before each scheduled dose.";

        console.log(`[SMS Opt-in] Sending welcome SMS to ${phoneNumber}`);
        const smsResult = await smsProvider.sendSMS({
          to: phoneNumber,
          message: welcomeMessage,
          userId: user.id,
        });

        if (!smsResult.success) {
          console.error('[SMS Opt-in] Failed to send welcome SMS:', smsResult.error);
          // Don't fail the request if SMS fails - preferences are still saved
        } else {
          console.log(`[SMS Opt-in] Welcome SMS sent successfully. Message ID: ${smsResult.messageId}`);
        }
      } catch (smsError) {
        console.error('[SMS Opt-in] Error sending welcome SMS:', smsError);
        // Don't fail the request if SMS fails - preferences are still saved
      }
    }

    return Response.json({
      success: true,
      message: 'SMS preferences updated successfully',
    });
  } catch (error) {
    console.error('Error in SMS opt-in route:', error);
    return Response.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

