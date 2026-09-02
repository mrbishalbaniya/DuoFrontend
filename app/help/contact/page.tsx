import { SupportRequestForm } from "@/components/settings/SupportRequestForm";

export default function ContactSupportPage() {
  return (
    <SupportRequestForm
      title="Contact support"
      icon="support_agent"
      intro="Have a question or ran into an issue? Send us a message and the Duo team will get back to you."
      category="contact"
      subjectLabel="Subject"
      subjectPlaceholder="What's this about?"
      messageLabel="Message"
      messagePlaceholder="Tell us what's going on..."
      submitLabel="Send message"
    />
  );
}
