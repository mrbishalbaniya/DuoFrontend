import { getTranslations } from "next-intl/server";
import { SupportRequestForm } from "@/components/settings/SupportRequestForm";

export default async function ReportBugPage() {
  const t = await getTranslations("settingsExtra.supportRequest.reportBug");

  return (
    <SupportRequestForm
      title={t("title")}
      icon="bug_report"
      intro={t("intro")}
      category="bug"
      subjectLabel={t("subjectLabel")}
      subjectPlaceholder={t("subjectPlaceholder")}
      messageLabel={t("messageLabel")}
      messagePlaceholder={t("messagePlaceholder")}
      submitLabel={t("submitLabel")}
      includeDeviceInfo
    />
  );
}
