export const NEPAL_PROVINCES = [
  "Koshi",
  "Madhesh",
  "Bagmati",
  "Gandaki",
  "Lumbini",
  "Karnali",
  "Sudurpashchim",
] as const;

export const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
] as const;

export const MARITAL_STATUS_OPTIONS = [
  { value: "never_married", label: "Never Married" },
  { value: "divorced", label: "Divorced" },
  { value: "widowed", label: "Widowed" },
] as const;

export const RELATIONSHIP_GOAL_OPTIONS = [
  { value: "dating", label: "Dating" },
  { value: "serious", label: "Serious Relationship" },
  { value: "marriage", label: "Marriage" },
  { value: "friendship", label: "Friendship" },
] as const;

export const EDUCATION_LEVEL_OPTIONS = [
  { value: "below_see", label: "Below SEE" },
  { value: "see", label: "SEE / SLC" },
  { value: "plus_two", label: "+2 / Intermediate" },
  { value: "diploma", label: "Diploma" },
  { value: "bachelor", label: "Bachelor's" },
  { value: "master", label: "Master's" },
  { value: "mphil", label: "MPhil" },
  { value: "phd", label: "PhD" },
  { value: "other", label: "Other" },
] as const;

export const FIELD_OF_STUDY_OPTIONS = [
  { value: "it", label: "IT / Computer Science" },
  { value: "engineering", label: "Engineering" },
  { value: "medical", label: "Medical / Health Sciences" },
  { value: "business", label: "Business / Management" },
  { value: "law", label: "Law" },
  { value: "science", label: "Science" },
  { value: "arts", label: "Arts / Humanities" },
  { value: "education", label: "Education" },
  { value: "agriculture", label: "Agriculture" },
  { value: "hospitality", label: "Hotel Management / Hospitality" },
  { value: "social_work", label: "Social Work" },
  { value: "journalism", label: "Journalism / Mass Communication" },
  { value: "fine_arts", label: "Fine Arts / Design" },
  { value: "other", label: "Other" },
] as const;

export const EMPLOYMENT_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "employed", label: "Employed" },
  { value: "self_employed", label: "Self-employed" },
  { value: "freelancer", label: "Freelancer" },
  { value: "business_owner", label: "Business Owner" },
  { value: "unemployed", label: "Unemployed" },
] as const;

// Values here must exactly match the backend's Profile.WORK_PREF_CHOICES
// keys (accounts/models.py) — this is a strict choices= field.
export const WORK_PREFERENCE_OPTIONS = [
  { value: "Private", label: "Private sector" },
  { value: "Government", label: "Government" },
  { value: "Business", label: "Business / self-employed" },
  { value: "Freelancer", label: "Freelancer" },
  { value: "Student", label: "Student" },
  { value: "Retired", label: "Retired" },
  { value: "NotWorking", label: "Not working" },
] as const;

export const INCOME_OPTIONS = [
  { value: "below_20k", label: "Below NPR 20,000" },
  { value: "20k_50k", label: "NPR 20,000 - 50,000" },
  { value: "50k_100k", label: "NPR 50,000 - 100,000" },
  { value: "100k_200k", label: "NPR 100,000 - 200,000" },
  { value: "200k_plus", label: "NPR 200,000+" },
] as const;

// Labels here must exactly match the backend's Profile.RELIGION_CHOICES
// keys (accounts/models.py) — ProfileEditForm's "Religion" select submits
// the label text directly, and the backend enforces this as a strict
// choices= field, so a label that doesn't match one of those keys exactly
// gets rejected on save.
export const RELIGION_OPTIONS = [
  { value: "hindu", label: "Hindu" },
  { value: "buddhist", label: "Buddhist" },
  { value: "muslim", label: "Muslim" },
  { value: "christian", label: "Christian" },
  { value: "kirat", label: "Kirat" },
  { value: "sikh", label: "Sikh" },
  { value: "jain", label: "Jain" },
  { value: "jewish", label: "Jewish" },
  { value: "non_religious", label: "Non-religious" },
  { value: "other", label: "Other" },
] as const;

export const CASTE_OPTIONS = [
  // Hill Brahmin / Chhetri
  "Bahun",
  "Chhetri",
  "Thakuri",
  "Sanyasi / Dashnami",
  // Newar
  "Newar",
  // Hill Janajati
  "Gurung",
  "Magar",
  "Rai",
  "Limbu",
  "Tamang",
  "Sherpa",
  "Sunuwar",
  "Thakali",
  "Gharti / Bhujel",
  "Yakkha",
  "Chepang",
  "Kumal",
  "Majhi",
  "Danuwar",
  "Hyolmo",
  // Madhesi / Tarai communities
  "Yadav",
  "Kurmi",
  "Teli",
  "Sah / Sahu",
  "Mandal",
  "Kayastha",
  "Rajput",
  "Brahmin (Madhesi)",
  "Marwadi",
  "Baniya",
  "Kalwar",
  "Kanu",
  "Koiri",
  "Dhanuk",
  "Rajbanshi",
  "Tharu",
  // Dalit communities
  "Kami",
  "Damai",
  "Sarki",
  "Sunar",
  "Gaine",
  "Badi",
  "Chamar",
  "Musahar",
  "Paswan / Dusadh",
  "Dom",
  "Khatik",
  // Muslim
  "Muslim",
  "Other",
] as const;

export const GOTRA_OPTIONS = [
  "Bharadwaj",
  "Kashyap",
  "Gautam",
  "Kaushik",
  "Vashistha",
  "Atri",
  "Agastya",
  "Jamadagni",
  "Sandilya",
  "Angiras",
  "Bhrigu",
  "Parashar",
  "Garg",
  "Vatsa",
  "Upamanyu",
  "Katyayan",
  "Naitik",
  "Maitreya",
  "Kaundinya",
  "Kutsa",
  "Shrivatsa",
  "Vishwamitra",
  "Harit",
  "Mudgal",
  "Unknown",
] as const;

export const HOROSCOPE_OPTIONS = [
  { value: "required", label: "Required" },
  { value: "not_required", label: "Not Required" },
] as const;

// The 12 Vedic moon-sign (Rashi) / zodiac signs — for recording someone's
// own horoscope sign, not a matching preference (see HOROSCOPE_OPTIONS).
export const RASHI_OPTIONS = [
  { value: "mesh", label: "Aries (Mesh)" },
  { value: "vrishabha", label: "Taurus (Vrishabha)" },
  { value: "mithuna", label: "Gemini (Mithuna)" },
  { value: "karka", label: "Cancer (Karka)" },
  { value: "simha", label: "Leo (Simha)" },
  { value: "kanya", label: "Virgo (Kanya)" },
  { value: "tula", label: "Libra (Tula)" },
  { value: "vrishchika", label: "Scorpio (Vrishchika)" },
  { value: "dhanu", label: "Sagittarius (Dhanu)" },
  { value: "makara", label: "Capricorn (Makara)" },
  { value: "kumbha", label: "Aquarius (Kumbha)" },
  { value: "meena", label: "Pisces (Meena)" },
  { value: "unknown", label: "Don't know" },
] as const;

export const PERSONALITY_OPTIONS = [
  { value: "introvert", label: "Introvert" },
  { value: "ambivert", label: "Ambivert" },
  { value: "extrovert", label: "Extrovert" },
] as const;

export const LIFESTYLE_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "balanced", label: "Balanced" },
  { value: "relaxed", label: "Relaxed" },
] as const;

export const FREQUENCY_OPTIONS = [
  { value: "no", label: "No" },
  { value: "occasionally", label: "Occasionally" },
  { value: "yes", label: "Yes" },
] as const;

export const EXERCISE_OPTIONS = [
  { value: "gym", label: "Gym" },
  { value: "yoga", label: "Yoga" },
  { value: "sports", label: "Sports" },
  { value: "running", label: "Running" },
  { value: "none", label: "None" },
] as const;

export const INTEREST_OPTIONS = [
  "Trekking",
  "Hiking",
  "Travel",
  "Photography",
  "Movies",
  "Music",
  "Cricket",
  "Football",
  "Coding",
  "Reading",
  "Business",
  "Technology",
  "Fitness",
  "Cooking",
  "Art",
  "Nature",
  "Volunteering",
  "Spirituality",
] as const;

export const LOOKING_FOR_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "everyone", label: "Everyone" },
] as const;

export const DISTANCE_OPTIONS = [
  { value: "5", label: "5 KM" },
  { value: "10", label: "10 KM" },
  { value: "25", label: "25 KM" },
  { value: "50", label: "50 KM" },
  { value: "anywhere", label: "Anywhere in Nepal" },
] as const;

export const MARRIAGE_PREF_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "depends", label: "Depends" },
] as const;

export const HEIGHT_FEET = [4, 5, 6, 7] as const;
export const HEIGHT_INCHES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;
