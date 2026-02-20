import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function TermsAndConditionsPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-5xl mx-auto px-4 sm:px-6">
      <div className="space-y-2">
        <h1 className="text-3xl sm:text-4xl font-bold">SMS Terms and Conditions</h1>
        <p className="text-muted-foreground">Last updated: February 7, 2025</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Message Types</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-foreground">
            By opting into SMS notifications from Pillr, you will receive the following types of messages:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground">
            <li><strong className="text-foreground">Medication Reminders:</strong> Messages sent approximately 15 minutes before each scheduled medication dose</li>
            <li><strong className="text-foreground">Welcome Messages:</strong> A confirmation message when you first opt into SMS notifications</li>
            <li><strong className="text-foreground">Service Updates:</strong> Important service updates or alerts (sent infrequently)</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Opt-Out and Opt-In</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p className="text-foreground">
            You can opt out of SMS notifications at any time by:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground">
            <li>Replying "STOP" to any SMS message you receive from us</li>
            <li>Visiting your SMS Preferences page in the dashboard</li>
            <li>Disabling SMS notifications in your account settings</li>
            <li>Contacting us directly to request removal</li>
          </ul>
          <p className="text-foreground">
            When you opt out, we will stop sending SMS messages immediately. Your phone number may be retained in our records for a reasonable period to ensure we honor your opt-out request and for legal compliance purposes, but it will not be used for sending messages.
          </p>
          <p className="text-foreground">
            To opt back into SMS notifications after opting out, you can:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground">
            <li>Reply "START" to any message from us</li>
            <li>Re-enable SMS notifications in your account settings</li>
            <li>Visit your SMS Preferences page and enable notifications</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Get Help</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-foreground">
            For help with SMS notifications, you can:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2 text-muted-foreground">
            <li>Reply "HELP" to any SMS message you receive from us</li>
            <li>Contact us through our <Link href="/contact" className="text-primary hover:underline">contact form</Link></li>
            <li>Visit your SMS Preferences page in the dashboard for account settings</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Message Frequency</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-foreground">
            Message frequency varies depending on your medication schedule. You will receive one reminder message approximately 15 minutes before each scheduled medication dose. The exact frequency depends on how many medications you have scheduled and their dosing times.
          </p>
          <p className="text-foreground">
            You can control notification preferences through your account settings at any time.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Rates and Charges</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-foreground">
            Standard message and data rates may apply. Charges are determined by your wireless carrier and your mobile phone plan. Pillr does not charge for SMS messages, but your carrier may apply standard messaging rates.
          </p>
          <p className="text-foreground">
            Please check with your wireless carrier for details about your messaging plan and any applicable charges.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Carrier Liability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-foreground">
            Your wireless carrier is not liable for delayed or undelivered messages. Messages are sent on a best-effort basis, and delivery is not guaranteed. Factors such as network availability, signal strength, and carrier limitations may affect message delivery.
          </p>
          <p className="text-foreground">
            Pillr is not responsible for messages that are delayed, lost, or not received due to carrier issues, network problems, or other factors beyond our control.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Privacy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-foreground">
            Your privacy is important to us. For detailed information about how we collect, use, and protect your phone number and SMS data, please review our <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>.
          </p>
          <p className="text-foreground">
            All text messaging originator opt-in data and consent information will not be shared with any third parties.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Consent</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-foreground">
            By opting into SMS notifications, you consent to receive automated text messages from Pillr at the phone number you provide. You understand that consent is not a condition of purchase or use of our services, and you may opt out at any time as described above.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changes to Terms</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-foreground">
            We reserve the right to modify these SMS Terms and Conditions at any time. We will notify you of any material changes by updating the "Last updated" date on this page. Your continued use of SMS notifications after such modifications constitutes acceptance of the updated terms.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p className="text-foreground">
            If you have any questions about these SMS Terms and Conditions, please contact us:
          </p>
          <p className="text-foreground">
            <strong>Contact Form:</strong> <Link href="/contact" className="text-primary hover:underline">Contact Us</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
