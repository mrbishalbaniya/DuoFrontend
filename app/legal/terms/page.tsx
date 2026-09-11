import { getTranslations } from "next-intl/server";
import { LegalPage } from "@/components/settings/LegalPage";

export default async function TermsOfServicePage() {
  const t = await getTranslations("settingsExtra.legal.terms");

  const sectionKeys = [
    "eligibility",
    "yourAccount",
    "communityStandards",
    "coinsPremiumPayments",
    "safety",
    "accountTermination",
    "disclaimersLiability",
    "changesToTerms",
    "contactUs",
  ] as const;

  return (
    <LegalPage
      title={t("title")}
      updatedLabel={t("updatedLabel")}
      intro={t("intro")}
      sections={sectionKeys.map((key) => ({
        heading: t(`sections.${key}.heading`),
        body: t.raw(`sections.${key}.body`) as string[],
      }))}
    />
  );
}
