import { LegalPage } from "@/components/settings/LegalPage";

export default function TermsOfServicePage() {
  return (
    <LegalPage
      title="Terms of service"
      updatedLabel="Last updated September 2026"
      intro="These terms govern your use of Duo. By creating an account, you agree to follow them."
      sections={[
        {
          heading: "1. Eligibility",
          body: [
            "You must be at least 18 years old to use Duo. By creating an account, you confirm that you meet this requirement and that all information you provide is accurate.",
          ],
        },
        {
          heading: "2. Your account",
          body: [
            "You're responsible for keeping your login credentials secure and for all activity on your account. Enable two-factor authentication for extra protection.",
            "You may not create more than one account, impersonate another person, or misrepresent your identity, age, or intentions.",
          ],
        },
        {
          heading: "3. Community standards",
          body: [
            "Treat other members with respect. Harassment, hate speech, threats, and unsolicited explicit content are not tolerated.",
            "Do not use Duo for commercial solicitation, spam, or to request money from other members.",
            "Report or block anyone who violates these standards. We review reports and may suspend or remove accounts that break these rules.",
          ],
        },
        {
          heading: "4. Coins, Premium & payments",
          body: [
            "Duo Coins are a virtual currency purchased with real money via eSewa and used within the app for Premium features.",
            "Coins have no cash value and are non-transferable and non-refundable except where required by law.",
            "Premium subscriptions renew or expire as described at the time of purchase. Manage or review your subscription from your Wallet.",
          ],
        },
        {
          heading: "5. Safety",
          body: [
            "Duo helps you meet people but cannot guarantee the accuracy of what members share or the outcome of any interaction.",
            "Always meet new people in public places, tell someone where you're going, and never send money or financial information to someone you haven't met in person.",
            "Report suspicious behavior immediately using the report tools in chat.",
          ],
        },
        {
          heading: "6. Account termination",
          body: [
            "You may deactivate your account at any time from Settings > Delete account.",
            "We may suspend or terminate accounts that violate these terms, engage in fraud, or pose a risk to other members' safety.",
          ],
        },
        {
          heading: "7. Disclaimers & limitation of liability",
          body: [
            "Duo is provided \"as is\" without warranties of any kind. We are not responsible for the conduct of any member, on or off the platform.",
            "To the fullest extent permitted by law, Duo's liability for any claim relating to your use of the app is limited to the amount you paid us, if any, in the twelve months before the claim arose.",
          ],
        },
        {
          heading: "8. Changes to these terms",
          body: [
            "We may update these terms periodically. Continued use of Duo after changes take effect means you accept the updated terms.",
          ],
        },
        {
          heading: "9. Contact us",
          body: [
            "Questions about these terms can be sent through Settings > Contact support.",
          ],
        },
      ]}
    />
  );
}
