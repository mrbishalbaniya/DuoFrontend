import { LegalPage } from "@/components/settings/LegalPage";

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy policy"
      updatedLabel="Last updated September 2026"
      intro="This policy explains what information Duo collects, how we use it, and the choices you have. By using Duo, you agree to the practices described here."
      sections={[
        {
          heading: "1. Information we collect",
          body: [
            "Account details you provide, such as your name, email, phone number, date of birth, and password.",
            "Profile information you choose to share, including photos, bio, education, occupation, and preferences.",
            "Verification data, such as a selfie used to confirm you match your profile photos.",
            "Location data, when you enable location features, to show nearby matches or your position on the map.",
            "Usage data, such as swipes, matches, messages, and app activity, used to operate and improve Duo.",
            "Payment information processed by our payment partner (eSewa) when you buy coins or Premium — Duo does not store your full payment card or wallet credentials.",
            "Device information, such as device identifiers, browser type, and IP address, used for security and to keep you signed in.",
          ],
        },
        {
          heading: "2. How we use your information",
          body: [
            "To operate core features: matching, messaging, calls, verification, and payments.",
            "To keep your account secure, including detecting suspicious logins and enforcing two-factor authentication.",
            "To personalize what you see, such as Discovery recommendations based on your preferences.",
            "To communicate with you about your account, security alerts, and — only if you opt in — product updates.",
            "To investigate reports of abuse, harassment, or violations of our Terms of Service.",
          ],
        },
        {
          heading: "3. Sharing your information",
          body: [
            "Other users see the profile information you choose to make public (photos, bio, age, etc.).",
            "We share data with service providers who help us run Duo, such as cloud hosting, email delivery, and payment processing — bound by confidentiality obligations.",
            "We may disclose information if required by law, to protect the rights and safety of our users, or to investigate fraud or abuse.",
            "We do not sell your personal information to third parties.",
          ],
        },
        {
          heading: "4. Your choices and rights",
          body: [
            "You can edit or delete profile information at any time from your profile settings.",
            "You can control who sees your location, or turn location sharing off entirely, from Location privacy settings.",
            "You can manage notification preferences from Settings > Notifications.",
            "You can deactivate your account from Settings > Delete account. Contact support if you would like your data permanently erased rather than deactivated.",
          ],
        },
        {
          heading: "5. Data retention and security",
          body: [
            "We retain your data for as long as your account is active, and for a limited period afterward to comply with legal obligations and resolve disputes.",
            "We use industry-standard safeguards, including encrypted connections, hashed passwords, and optional two-factor authentication, to protect your account.",
            "No system is perfectly secure. If you notice suspicious activity on your account, review Security alerts and change your password immediately.",
          ],
        },
        {
          heading: "6. Changes to this policy",
          body: [
            "We may update this policy from time to time. Material changes will be communicated in-app or by email before they take effect.",
          ],
        },
        {
          heading: "7. Contact us",
          body: [
            "Questions about this policy or your data can be sent through Settings > Contact support.",
          ],
        },
      ]}
    />
  );
}
