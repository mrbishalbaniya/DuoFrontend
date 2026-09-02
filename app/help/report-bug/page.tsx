import { SupportRequestForm } from "@/components/settings/SupportRequestForm";

export default function ReportBugPage() {
  return (
    <SupportRequestForm
      title="Report a bug"
      icon="bug_report"
      intro="Found something broken? Describe what happened and the steps to reproduce it — screenshots help too, just describe what they show."
      category="bug"
      subjectLabel="What's broken?"
      subjectPlaceholder="e.g. Photos won't upload"
      messageLabel="What happened?"
      messagePlaceholder="What were you doing, what did you expect, and what happened instead?"
      submitLabel="Submit report"
      includeDeviceInfo
    />
  );
}
