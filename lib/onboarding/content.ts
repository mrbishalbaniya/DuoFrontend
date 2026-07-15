export type OnboardingSlide = {
  id: string;
  title: string;
  headline: string;
  body: string;
  icon: string;
  accentClass: string;
  accentBgClass: string;
  statLabel?: string;
  statValue?: string;
};

/** Product tour shown once after a successful new registration (mirrors DuoMobile intro). */
export const PRODUCT_ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: "welcome",
    title: "Welcome to Duo",
    headline: "Find your life partner",
    body: "Duo blends deep-rooted tradition with intelligent matching for meaningful, lasting connections across Nepal.",
    icon: "favorite",
    accentClass: "text-primary",
    accentBgClass: "bg-primary/15 border-primary/25",
    statLabel: "Made in Nepal",
    statValue: "Kathmandu",
  },
  {
    id: "discover",
    title: "Swipe discovery",
    headline: "Browse with intention",
    body: "A respectful swipe experience designed to make finding matches engaging yet mindful.",
    icon: "swipe",
    accentClass: "text-love",
    accentBgClass: "bg-love/15 border-love/25",
    statLabel: "Verified profiles",
    statValue: "10k+",
  },
  {
    id: "match",
    title: "Smart matching",
    headline: "Compatibility that counts",
    body: "Our algorithm weighs cultural, professional, and personal signals so you meet people who truly fit.",
    icon: "auto_awesome",
    accentClass: "text-tertiary",
    accentBgClass: "bg-tertiary/15 border-tertiary/25",
    statLabel: "Success rate",
    statValue: "85%",
  },
  {
    id: "chat",
    title: "Secure chat",
    headline: "Connect with confidence",
    body: "Private messaging with safety controls and a premium chat experience built for trust.",
    icon: "forum",
    accentClass: "text-accent",
    accentBgClass: "bg-accent/15 border-accent/25",
    statLabel: "End-to-end",
    statValue: "Protected",
  },
];

export const SHOW_PRODUCT_ONBOARDING_KEY = "duo_show_product_onboarding";
