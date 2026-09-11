import { getTranslations } from "next-intl/server";
import { SupportRequestForm } from "@/components/settings/SupportRequestForm";

export default async function ContactSupportPage() {
  const t = await getTranslations("settingsExtra.supportRequest.contact");

  return (
    <SupportRequestForm
      title={t("title")}
      icon="support_agent"
      intro={t("intro")}
      category="contact"
      subjectLabel={t("subjectLabel")}
      subjectPlaceholder={t("subjectPlaceholder")}
      messageLabel={t("messageLabel")}
      messagePlaceholder={t("messagePlaceholder")}
      submitLabel={t("submitLabel")}
    />
  );
}
