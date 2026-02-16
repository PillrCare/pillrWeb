import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="flex-1 w-full flex flex-col gap-8 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Privacy Policy</h1>
        <p className="text-muted-foreground">Last updated: February 7, 2025</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Introduction</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            Welcome to Pillr ("we," "our," or "us"). We are committed to protecting your privacy and ensuring the security of your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our medication adherence monitoring service.
          </p>
          <p>
            By using Pillr, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, do not use our service.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Information We Collect</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>We collect several types of information from and about users of our service:</p>
          <ul>
            <li><strong>Account Information:</strong> Username, email address, and user type (Patient, Caregiver, or Manager)</li>
            <li><strong>Medical Information:</strong> Medication schedules, medication names, dosages, and adherence data</li>
            <li><strong>Device Information:</strong> Device IDs, device logs, and biometric data (fingerprints)</li>
            <li><strong>Phone Numbers:</strong> Mobile phone numbers for SMS verification and medication reminders</li>
            <li><strong>Usage Data:</strong> Information about how you access and use our service</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>SMS Verification and Phone Number Privacy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none space-y-4">
          <div>
            <h3 className="font-semibold text-lg mb-2">Collection and Use of Phone Numbers</h3>
            <p>
              When you opt into SMS notifications, we collect your mobile phone number to provide medication reminders and important service updates. Your phone number is collected only with your explicit consent and is used solely for the following purposes:
            </p>
            <ul>
              <li>Sending medication reminder notifications 15 minutes before scheduled doses</li>
              <li>Delivering important service updates and alerts</li>
              <li>Verifying your identity for account security purposes</li>
              <li>Enabling two-factor authentication (if enabled)</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Phone Number Storage and Security</h3>
            <p>
              Your phone number is stored securely in our database and is encrypted both in transit and at rest. We use industry-standard security measures to protect your phone number from unauthorized access, disclosure, alteration, or destruction.
            </p>
            <p>
              Phone numbers are stored in E.164 format (e.g., +1234567890) to ensure international compatibility and proper delivery of SMS messages.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">SMS Service Providers</h3>
            <p>
              We use third-party SMS service providers to deliver text messages. These providers are contractually obligated to:
            </p>
            <ul>
              <li>Maintain the confidentiality and security of your phone number</li>
              <li>Use your phone number solely for delivering messages on our behalf</li>
              <li>Comply with applicable data protection laws and regulations</li>
              <li>Not sell, rent, or share your phone number with other parties</li>
            </ul>
            <p>
              Our SMS providers may have access to your phone number only to the extent necessary to deliver messages. They are not permitted to use your phone number for their own marketing purposes or to contact you for any reason other than delivering messages we request.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Opt-In and Opt-Out</h3>
            <p>
              SMS notifications are entirely optional. You can opt into SMS notifications by providing your phone number and enabling SMS preferences in your account settings. You can opt out at any time by:
            </p>
            <ul>
              <li>Visiting your SMS Preferences page in the dashboard</li>
              <li>Disabling SMS notifications in your account settings</li>
              <li>Replying "STOP" to any SMS message you receive from us</li>
              <li>Contacting us directly to request removal</li>
            </ul>
            <p>
              When you opt out, we will stop sending SMS messages immediately. Your phone number may be retained in our records for a reasonable period to ensure we honor your opt-out request and for legal compliance purposes, but it will not be used for sending messages.
            </p>
            <p>
              To opt back into SMS notifications after opting out, you can reply "START" to any message from us, or re-enable SMS notifications in your account settings.
            </p>
            <p>
              For help with SMS notifications, reply "HELP" to any message from us, or contact us through our <Link href="/contact" className="text-primary hover:underline">contact form</Link>.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Message Frequency and Content</h3>
            <p>
              If you opt into SMS notifications, you will receive:
            </p>
            <ul>
              <li>Medication reminder messages approximately 15 minutes before each scheduled dose</li>
              <li>A welcome message when you first opt in</li>
              <li>Important service updates or alerts (sent infrequently)</li>
            </ul>
            <p>
              Message frequency varies depending on your medication schedule. Standard message and data rates may apply. You can control notification preferences through your account settings.
            </p>
            <p>
              Your wireless carrier is not liable for delayed or undelivered messages. Messages are sent on a best-effort basis, and delivery is not guaranteed.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Sharing of Phone Numbers</h3>
            <p>
              We do not sell, rent, or share your phone number with third parties except:
            </p>
            <ul>
              <li>With SMS service providers who deliver messages on our behalf (as described above)</li>
              <li>When required by law, court order, or government regulation</li>
              <li>To protect our rights, property, or safety, or that of our users</li>
              <li>In connection with a business transfer, merger, or acquisition (with notice to users)</li>
            </ul>
            <p>
              We do not share your phone number with advertisers or marketing companies.
            </p>
            <p className="font-semibold mt-4">
              All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Data Retention</h3>
            <p>
              We retain your phone number for as long as your account is active and you have opted into SMS notifications. If you opt out, we may retain your phone number for a reasonable period to ensure we honor your opt-out request and comply with legal obligations. You can request deletion of your phone number by contacting us.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-lg mb-2">Your Rights Regarding Phone Numbers</h3>
            <p>
              You have the right to:
            </p>
            <ul>
              <li>Access your phone number stored in our system</li>
              <li>Correct or update your phone number at any time</li>
              <li>Request deletion of your phone number (subject to legal retention requirements)</li>
              <li>Opt out of SMS notifications at any time</li>
              <li>Receive a copy of your phone number data in a portable format</li>
            </ul>
            <p>
              To exercise these rights, please contact us using the information provided at the end of this policy.
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground">
              For detailed SMS terms and conditions, including message types, opt-out procedures, and carrier information, please see our <Link href="/terms-and-conditions" className="text-primary hover:underline">SMS Terms and Conditions</Link>.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How We Use Your Information</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide and maintain our medication adherence monitoring service</li>
            <li>Send medication reminders and important notifications</li>
            <li>Process and manage your medication schedules</li>
            <li>Monitor device activity and adherence patterns</li>
            <li>Improve our service and develop new features</li>
            <li>Respond to your inquiries and provide customer support</li>
            <li>Comply with legal obligations and enforce our terms of service</li>
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Security</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            We implement appropriate technical and organizational measures to protect your personal information, including:
          </p>
          <ul>
            <li>Encryption of data in transit and at rest</li>
            <li>Regular security assessments and updates</li>
            <li>Access controls and authentication requirements</li>
            <li>Secure data storage and backup procedures</li>
            <li>Employee training on data protection</li>
          </ul>
          <p>
            However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your information, we cannot guarantee absolute security.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Sharing and Disclosure</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>We may share your information in the following circumstances:</p>
          <ul>
            <li><strong>Caregivers:</strong> If you are a patient, authorized caregivers may view your medication schedules and adherence data</li>
            <li><strong>Service Providers:</strong> We may share information with third-party service providers who perform services on our behalf (e.g., SMS delivery, cloud hosting)</li>
            <li><strong>Legal Requirements:</strong> We may disclose information if required by law or in response to valid legal requests</li>
            <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred</li>
          </ul>
          <p className="font-semibold mt-4">
            All the above categories exclude text messaging originator opt-in data and consent; this information will not be shared with any third parties.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Rights</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>Depending on your location, you may have certain rights regarding your personal information:</p>
          <ul>
            <li><strong>Access:</strong> Request access to your personal information</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Portability:</strong> Request transfer of your data to another service</li>
            <li><strong>Objection:</strong> Object to certain processing of your information</li>
            <li><strong>Restriction:</strong> Request restriction of processing</li>
          </ul>
          <p>
            To exercise these rights, please contact us using the information provided below.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Children's Privacy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            Our service is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Changes to This Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact Us</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none">
          <p>
            If you have any questions about this Privacy Policy or our data practices, please contact us:
          </p>
          <p>
            <strong>Email:</strong> <Link href="/contact" className="text-primary hover:underline">Contact Us</Link><br />
            <strong>Website:</strong> <Link href="/contact" className="text-primary hover:underline">Contact Form</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
