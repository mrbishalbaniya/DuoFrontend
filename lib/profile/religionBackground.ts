/**
 * Religion → caste/community → sub-caste/clan (thar) → gotra, for Nepal.
 *
 * Sources and reasoning (kept here so the lists can be reviewed later):
 * - Caste/ethnic groups follow the Nepal census (CBS 2011 / NSO 2021) caste
 *   and ethnicity tables, grouped by the religion each community mostly
 *   reports. Janajati groups such as Gurung, Magar and Tamang appear under both
 *   Hindu and Buddhist because the census records large shares of each.
 * - Gotra is a Vedic patrilineal lineage. It is used by Bahun, Chhetri,
 *   Thakuri, Sanyasi, Madhesi castes, most Dalit communities and Newars (both
 *   Hindu and Buddhist Newars keep one, e.g. Shakya/Bajracharya → Kashyap).
 *   Jain Marwadi families keep gotras too. Kirat and most Janajati groups use
 *   clans (thar / pacha / ru) instead, so they get a clan list, not gotra.
 * - Muslims, Christians, Sikhs and Jews don't use gotra. Muslims in Nepal are
 *   usually described by community (Madhesi, Churaute/hill, Kashmiri,
 *   Tibetan), not caste.
 */

export type ReligionKey =
  | "hindu"
  | "buddhist"
  | "muslim"
  | "christian"
  | "kirat"
  | "sikh"
  | "jain"
  | "jewish"
  | "non_religious"
  | "other";

// --- Gotra lists -----------------------------------------------------------

/** Sapta-rishi and other common Vedic gotras used across Nepal. */
export const VEDIC_GOTRAS = [
  "Agastya",
  "Angiras",
  "Atreya",
  "Atri",
  "Bharadwaj",
  "Bhrigu",
  "Dhananjaya",
  "Garg",
  "Gautam",
  "Ghritakaushik",
  "Harit",
  "Jamadagni",
  "Kapil",
  "Kashyap",
  "Katyayan",
  "Kaundinya",
  "Kaushik",
  "Kutsa",
  "Maitreya",
  "Mandavya",
  "Maudgalya",
  "Parashar",
  "Sandilya",
  "Savarna",
  "Shrivatsa",
  "Upamanyu",
  "Vashistha",
  "Vatsa",
  "Vishwamitra",
] as const;

/** Common Oswal/Maheshwari gotras kept by Marwadi and Jain families. */
const MARWADI_GOTRAS = [
  "Agarwal (Garg)",
  "Bansal",
  "Goyal",
  "Kansal",
  "Mittal",
  "Singhal",
  "Tayal",
  "Jindal",
  "Bhandari",
  "Chordia",
  "Kothari",
  "Lodha",
  "Surana",
  "Maheshwari",
  ...VEDIC_GOTRAS,
];

// --- Sub-caste / clan lists -----------------------------------------------

const CLANS: Record<string, { label: string; options: string[] }> = {
  Bahun: {
    label: "Sub-group",
    options: ["Upadhyaya (Purbiya)", "Kumai", "Jaisi", "Rajopadhyaya", "Other"],
  },
  Chhetri: {
    label: "Thar (surname group)",
    options: [
      "Adhikari", "Basnet", "Bhandari", "Bista", "Bohara", "Budhathoki", "Karki",
      "Khadka", "Khatri", "Kunwar", "Rawal", "Rana", "Rokaya", "Thapa", "Other",
    ],
  },
  Thakuri: {
    label: "Thar (clan)",
    options: ["Shah", "Malla", "Chand", "Singh", "Sen", "Hamal", "Rathaur", "Kalyal", "Other"],
  },
  Newar: {
    label: "Newar caste",
    options: [
      "Rajopadhyaya", "Bajracharya", "Shakya", "Joshi", "Karmacharya", "Shrestha",
      "Pradhan", "Amatya", "Malla", "Tuladhar", "Kansakar", "Maharjan", "Dangol",
      "Manandhar", "Tamrakar", "Awale", "Chitrakar", "Nakarmi", "Ranjitkar",
      "Khadgi", "Kapali", "Other",
    ],
  },
  Gurung: {
    label: "Clan (Char jat / Sora jat)",
    options: [
      "Ghale", "Ghotane", "Lamichhane", "Lama", "Plon", "Kromchhain", "Tamu (other)", "Other",
    ],
  },
  Magar: {
    label: "Clan",
    options: ["Ale", "Budha", "Gharti", "Pun", "Rana", "Roka", "Thapa", "Jhankri", "Other"],
  },
  Tamang: {
    label: "Clan",
    options: [
      "Moktan", "Yonjan", "Lopchan", "Waiba", "Ghising", "Bomjan", "Syangtan",
      "Thokar", "Titung", "Pakhrin", "Dong", "Blon", "Gole", "Other",
    ],
  },
  Sherpa: {
    label: "Clan (ru)",
    options: [
      "Salaka", "Goparma", "Chiawa", "Pinasa", "Thimmi", "Paldorje", "Lhukpa",
      "Gardza", "Mendewa", "Khambadze", "Other",
    ],
  },
  Thakali: {
    label: "Clan",
    options: ["Gauchan", "Tulachan", "Sherchan", "Bhattachan", "Other"],
  },
  Rai: {
    label: "Rai group",
    options: [
      "Bantawa", "Chamling", "Kulung", "Thulung", "Sampang", "Khaling", "Dumi",
      "Bahing", "Yamphu", "Mewahang", "Lohorung", "Nachhiring", "Athpahariya", "Other",
    ],
  },
  Limbu: {
    label: "Thum (region)",
    options: [
      "Panthare", "Tamarkhole", "Phedappe", "Chhathare", "Yangwarok", "Mewakhola",
      "Maiwakhola", "Chaubise", "Other",
    ],
  },
  Tharu: {
    label: "Tharu group",
    options: ["Rana", "Dangaura", "Kathariya", "Kochila", "Chitwaniya", "Other"],
  },
  "Brahmin (Madhesi)": {
    label: "Sub-group",
    options: ["Maithil", "Kanyakubja", "Bhumihar", "Other"],
  },
  Muslim: {
    label: "Community",
    options: ["Madhesi Muslim", "Churaute (Hill Muslim)", "Kashmiri", "Tibetan Muslim", "Other"],
  },
};

// --- Caste lists by religion ----------------------------------------------

const HILL_HIGH_CASTES = ["Bahun", "Chhetri", "Thakuri", "Sanyasi / Dashnami"];
const MADHESI_CASTES = [
  "Yadav", "Kurmi", "Teli", "Sah / Sahu", "Mandal", "Kayastha", "Rajput",
  "Brahmin (Madhesi)", "Kalwar", "Kanu", "Koiri", "Dhanuk", "Rajbanshi", "Tharu",
];
const DALIT_CASTES = [
  "Kami", "Damai", "Sarki", "Sunar", "Gaine", "Badi", "Chamar", "Musahar",
  "Paswan / Dusadh", "Dom", "Khatik",
];
const HINDU_JANAJATI = [
  "Magar", "Gurung", "Tamang", "Sunuwar", "Thakali", "Gharti / Bhujel",
  "Chepang", "Kumal", "Majhi", "Danuwar",
];
const BUDDHIST_JANAJATI = [
  "Tamang", "Gurung", "Magar", "Sherpa", "Thakali", "Hyolmo", "Chepang",
  "Sunuwar", "Gharti / Bhujel", "Tharu",
];

export const ALL_CASTES = Array.from(
  new Set([
    ...HILL_HIGH_CASTES,
    "Newar",
    ...HINDU_JANAJATI,
    ...BUDDHIST_JANAJATI,
    "Rai",
    "Limbu",
    "Yakkha",
    ...MADHESI_CASTES,
    "Marwadi",
    "Baniya",
    ...DALIT_CASTES,
  ])
);

const CASTES_BY_RELIGION: Record<ReligionKey, string[]> = {
  hindu: [...HILL_HIGH_CASTES, "Newar", ...HINDU_JANAJATI, ...MADHESI_CASTES, "Marwadi", "Baniya", ...DALIT_CASTES, "Other"],
  buddhist: ["Newar", ...BUDDHIST_JANAJATI, "Other"],
  kirat: ["Rai", "Limbu", "Yakkha", "Sunuwar", "Other"],
  jain: ["Marwadi", "Baniya", "Newar", "Other"],
  muslim: ["Muslim"],
  // Converts keep their community of origin.
  christian: [...ALL_CASTES, "Other"],
  non_religious: [...ALL_CASTES, "Other"],
  other: [...ALL_CASTES, "Other"],
  sikh: [],
  jewish: [],
};

/** Castes that keep a Vedic gotra. Janajati and Kirat groups use clans instead. */
const GOTRA_CASTES = new Set([
  ...HILL_HIGH_CASTES,
  "Newar",
  ...MADHESI_CASTES.filter((caste) => caste !== "Tharu" && caste !== "Rajbanshi"),
  ...DALIT_CASTES,
  "Marwadi",
  "Baniya",
]);

// --- Public helpers ---------------------------------------------------------

const RELIGION_ALIASES: Record<string, ReligionKey> = {
  hindu: "hindu",
  buddhist: "buddhist",
  muslim: "muslim",
  islam: "muslim",
  christian: "christian",
  kirat: "kirat",
  sikh: "sikh",
  jain: "jain",
  jewish: "jewish",
  "non-religious": "non_religious",
  non_religious: "non_religious",
  other: "other",
};

/** Accepts either the option value ("hindu") or its label ("Hindu"). */
export function toReligionKey(religion: string | null | undefined): ReligionKey | "" {
  const raw = (religion ?? "").trim().toLowerCase();
  return RELIGION_ALIASES[raw] ?? (raw ? "other" : "");
}

/** Caste/community choices for a religion. Empty means the question is skipped. */
export function casteOptionsFor(religion: string | null | undefined): string[] {
  const key = toReligionKey(religion);
  return key ? CASTES_BY_RELIGION[key] : [];
}

export function casteLabelFor(religion: string | null | undefined): string {
  const key = toReligionKey(religion);
  if (key === "muslim") return "Community";
  if (key === "kirat" || key === "buddhist") return "Community";
  return "Caste / Community";
}

/** Sub-caste or clan list for a caste, with the label to show above it. */
export function subCasteFor(caste: string | null | undefined): { label: string; options: string[] } | null {
  return caste ? CLANS[caste] ?? null : null;
}

/** Gotra list for a religion + caste, or null when gotra doesn't apply. */
export function gotraOptionsFor(
  religion: string | null | undefined,
  caste: string | null | undefined
): string[] | null {
  const key = toReligionKey(religion);
  if (!caste || !["hindu", "buddhist", "jain"].includes(key)) return null;
  if (!GOTRA_CASTES.has(caste)) return null;
  // Only Newars keep a gotra among Buddhists.
  if (key === "buddhist" && caste !== "Newar") return null;
  const list = caste === "Marwadi" || caste === "Baniya" ? MARWADI_GOTRAS : [...VEDIC_GOTRAS];
  return [...list, "Don't know"];
}

/**
 * Clear answers that no longer apply after religion or caste changes, so the
 * saved profile never has e.g. a Hindu gotra on a Muslim profile.
 */
export function reconcileBackground(next: {
  religion: string;
  caste: string;
  subCaste: string;
  gotra: string;
}): { caste: string; subCaste: string; gotra: string } {
  const castes = casteOptionsFor(next.religion);
  const caste = castes.includes(next.caste) ? next.caste : castes.length === 1 ? castes[0] : "";
  const sub = subCasteFor(caste);
  const subCaste = sub && sub.options.includes(next.subCaste) ? next.subCaste : "";
  const gotras = gotraOptionsFor(next.religion, caste);
  const gotra = gotras && gotras.includes(next.gotra) ? next.gotra : "";
  return { caste, subCaste, gotra };
}
