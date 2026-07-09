import type { AvatarCategoryId, AvatarConfig, AvatarPreviewAnimation } from "./types";
import { DEFAULT_AVATAR_CONFIG, SKIN_TONES, genderDefaults } from "./types";
import { HAIR_LIBRARY, PANTS_LIBRARY, SHIRT_LIBRARY, SHOE_LIBRARY } from "./modularAssembler";

export type ControlKind = "slider" | "swatch" | "select" | "toggle" | "gender";

export type AvatarControl = {
  key: keyof AvatarConfig;
  label: string;
  kind: ControlKind;
  min?: number;
  max?: number;
  options?: { value: number | string; label: string }[];
  colors?: string[];
  maleOnly?: boolean;
  femaleOnly?: boolean;
};

export type AvatarCategory = {
  id: AvatarCategoryId;
  label: string;
  icon: string;
  controls: AvatarControl[];
};

const HAIR_LABELS = [
  "Buzz Cut",
  "Crew Cut",
  "Fade",
  "Undercut",
  "Short",
  "Taper",
  "Curly",
  "Wavy",
  "Afro",
  "Messy",
  "Straight",
  "Long",
  "Layered",
  "Curtains",
  "Wolf cut",
  "Ponytail",
  "High pony",
  "Low pony",
  "Bun",
  "Space buns",
  "Top knot",
  "Braids",
  "Cornrows",
  "Locs",
  "Dreads",
  "Pigtails",
  "Half-up",
  "Side part",
  "Middle part",
  "Quiff",
  "Pompadour",
  "Mohawk",
  "Pixie",
  "Bob",
  "Hime",
  "Shaggy",
  "Slick",
  "Mullet",
  "Fringe",
  "Bowl",
  "Spiky",
  "Highlight short",
  "Highlight long",
  "Wavy long",
  "Curly long",
  "Braided bun",
  "Fade curly",
  "Classic",
];

const HAIR_STYLES = Array.from({ length: HAIR_LIBRARY }, (_, i) => ({
  value: i,
  label: HAIR_LABELS[i] ?? `Style ${i + 1}`,
}));

const SHIRT_STYLES = [
  { value: 0, label: "Tank Top" },
  { value: 1, label: "T-Shirt" },
  { value: 2, label: "Polo" },
  { value: 3, label: "Hoodie" },
  { value: 4, label: "Shirt" },
  { value: 5, label: "Sweater" },
  { value: 6, label: "Blouse" },
  { value: 7, label: "Crop Top" },
];

const PANTS_STYLES = [
  { value: 0, label: "Jeans" },
  { value: 1, label: "Chinos" },
  { value: 2, label: "Joggers" },
  { value: 3, label: "Shorts" },
  { value: 4, label: "Cargo Pants" },
  { value: 5, label: "Formal Pants" },
  { value: 6, label: "Skirt" },
  { value: 7, label: "Dress" },
];

const SHOE_STYLES = [
  { value: 0, label: "Sneakers" },
  { value: 1, label: "Boots" },
  { value: 2, label: "Running Shoes" },
  { value: 3, label: "Sandals" },
  { value: 4, label: "Heels" },
  { value: 5, label: "Loafers" },
  { value: 6, label: "Formal Shoes" },
];

const BEARDS = [
  { value: 0, label: "Clean" },
  { value: 1, label: "Stubble" },
  { value: 2, label: "Short beard" },
  { value: 3, label: "Full beard" },
  { value: 4, label: "Goatee" },
  { value: 5, label: "Van Dyke" },
];

const ANIMATIONS: { value: AvatarPreviewAnimation; label: string }[] = [
  { value: "idle", label: "Idle" },
  { value: "walk", label: "Walk" },
  { value: "run", label: "Run" },
  { value: "wave", label: "Wave" },
  { value: "sit", label: "Sit" },
  { value: "dance", label: "Dance" },
  { value: "celebrate", label: "Celebrate" },
  { value: "jump", label: "Jump" },
  { value: "selfie", label: "Selfie" },
  { value: "look", label: "Look Around" },
  { value: "heart", label: "Heart" },
];

const COLORS = {
  hair: ["#1a1208", "#3d2314", "#6b4423", "#c9a227", "#e8e8e8", "#8b4513", "#2c1810", "#ec4899", "#6366f1"],
  cloth: ["#ec4899", "#6366f1", "#14b8a6", "#f97316", "#22c55e", "#ef4444", "#ffffff", "#111827", "#fbbf24"],
  pants: ["#1e293b", "#334155", "#4c1d95", "#0f766e", "#713f12", "#64748b", "#000000"],
  lips: ["#c45c6a", "#9f1239", "#fb7185", "#be123c", "#7f1d1d", "#fda4af"],
  eyes: ["#1e293b", "#3b82f6", "#16a34a", "#92400e", "#64748b", "#7c3aed", "#0ea5e9"],
};

export const AVATAR_CATEGORIES: AvatarCategory[] = [
  {
    id: "gender",
    label: "Character",
    icon: "wc",
    controls: [{ key: "gender", label: "Body type", kind: "gender" }],
  },
  {
    id: "face",
    label: "Face",
    icon: "face",
    controls: [
      { key: "facePreset", label: "Face preset", kind: "select", options: [
        { value: 0, label: "Soft" }, { value: 1, label: "Classic" }, { value: 2, label: "Angular" }, { value: 3, label: "Round" },
      ]},
      { key: "faceShape", label: "Face shape", kind: "slider", min: 0, max: 100 },
      { key: "faceWidth", label: "Face width", kind: "slider", min: 0, max: 100 },
      { key: "faceHeight", label: "Face height", kind: "slider", min: 0, max: 100 },
      { key: "jaw", label: "Jaw size", kind: "slider", min: 0, max: 100 },
      { key: "jawWidth", label: "Jaw width", kind: "slider", min: 0, max: 100 },
      { key: "chin", label: "Chin shape", kind: "slider", min: 0, max: 100 },
      { key: "chinLength", label: "Chin length", kind: "slider", min: 0, max: 100 },
      { key: "cheeks", label: "Cheekbones", kind: "slider", min: 0, max: 100 },
      { key: "cheekFullness", label: "Cheek fullness", kind: "slider", min: 0, max: 100 },
    ],
  },
  {
    id: "skin",
    label: "Skin",
    icon: "palette",
    controls: [
      { key: "skinTone", label: "Skin tone", kind: "select", options: SKIN_TONES.map((_, i) => ({ value: i, label: `Tone ${i + 1}` })) },
      { key: "skinTexture", label: "Skin texture", kind: "slider", min: 0, max: 100 },
      { key: "freckles", label: "Freckles", kind: "slider", min: 0, max: 100 },
      { key: "moles", label: "Moles", kind: "slider", min: 0, max: 100 },
      { key: "acne", label: "Acne", kind: "slider", min: 0, max: 100 },
      { key: "wrinkles", label: "Wrinkles", kind: "slider", min: 0, max: 100 },
      { key: "shine", label: "Shine", kind: "slider", min: 0, max: 100 },
      { key: "smoothness", label: "Smoothness", kind: "slider", min: 0, max: 100 },
    ],
  },
  {
    id: "eyes",
    label: "Eyes",
    icon: "visibility",
    controls: [
      { key: "eyeShape", label: "Eye shape", kind: "select", options: [
        { value: 0, label: "Almond" }, { value: 1, label: "Round" }, { value: 2, label: "Hooded" }, { value: 3, label: "Upturned" },
      ]},
      { key: "eyeSize", label: "Eye size", kind: "slider", min: 0, max: 100 },
      { key: "eyeSpacing", label: "Eye spacing", kind: "slider", min: 0, max: 100 },
      { key: "eyeAngle", label: "Eye angle", kind: "slider", min: 0, max: 100 },
      { key: "eyeColor", label: "Iris color", kind: "swatch", colors: COLORS.eyes },
      { key: "pupilSize", label: "Pupil size", kind: "slider", min: 0, max: 100 },
      { key: "eyelashes", label: "Eyelashes", kind: "slider", min: 0, max: 100 },
      { key: "eyelidShape", label: "Eyelid shape", kind: "slider", min: 0, max: 100 },
    ],
  },
  {
    id: "eyebrows",
    label: "Eyebrows",
    icon: "remove",
    controls: [
      { key: "browStyle", label: "Style", kind: "select", options: [
        { value: 0, label: "Straight" }, { value: 1, label: "Arched" }, { value: 2, label: "Soft" }, { value: 3, label: "Bold" },
      ]},
      { key: "browThickness", label: "Thickness", kind: "slider", min: 0, max: 100 },
      { key: "browLength", label: "Length", kind: "slider", min: 0, max: 100 },
      { key: "browPosition", label: "Position", kind: "slider", min: 0, max: 100 },
      { key: "browRotation", label: "Rotation", kind: "slider", min: 0, max: 100 },
      { key: "browColor", label: "Color", kind: "swatch", colors: COLORS.hair },
    ],
  },
  {
    id: "nose",
    label: "Nose",
    icon: "air",
    controls: [
      { key: "noseWidth", label: "Width", kind: "slider", min: 0, max: 100 },
      { key: "noseHeight", label: "Height", kind: "slider", min: 0, max: 100 },
      { key: "noseLength", label: "Length", kind: "slider", min: 0, max: 100 },
      { key: "noseBridge", label: "Bridge", kind: "slider", min: 0, max: 100 },
      { key: "noseTip", label: "Tip", kind: "slider", min: 0, max: 100 },
      { key: "nostrilSize", label: "Nostril size", kind: "slider", min: 0, max: 100 },
    ],
  },
  {
    id: "mouth",
    label: "Mouth",
    icon: "sentiment_satisfied",
    controls: [
      { key: "lipShape", label: "Lip shape", kind: "select", options: [
        { value: 0, label: "Thin" }, { value: 1, label: "Full" }, { value: 2, label: "Heart" }, { value: 3, label: "Wide" },
      ]},
      { key: "lipSize", label: "Lip size", kind: "slider", min: 0, max: 100 },
      { key: "upperLip", label: "Upper lip", kind: "slider", min: 0, max: 100 },
      { key: "lowerLip", label: "Lower lip", kind: "slider", min: 0, max: 100 },
      { key: "smile", label: "Smile", kind: "slider", min: 0, max: 100 },
      { key: "mouthWidth", label: "Mouth width", kind: "slider", min: 0, max: 100 },
      { key: "lipColor", label: "Lip color", kind: "swatch", colors: COLORS.lips },
    ],
  },
  {
    id: "teeth",
    label: "Teeth",
    icon: "dentistry",
    controls: [
      { key: "teethStyle", label: "Style", kind: "select", options: [
        { value: 0, label: "Natural" }, { value: 1, label: "Bright white" }, { value: 2, label: "Braces" },
        { value: 3, label: "Gap" }, { value: 4, label: "Gold tooth" },
      ]},
      { key: "smileIntensity", label: "Smile intensity", kind: "slider", min: 0, max: 100 },
    ],
  },
  {
    id: "ears",
    label: "Ears",
    icon: "hearing",
    controls: [
      { key: "earSize", label: "Size", kind: "slider", min: 0, max: 100 },
      { key: "earRotation", label: "Rotation", kind: "slider", min: 0, max: 100 },
      { key: "earShape", label: "Shape", kind: "slider", min: 0, max: 100 },
    ],
  },
  {
    id: "beard",
    label: "Facial Hair",
    icon: "face_6",
    controls: [
      { key: "beardStyle", label: "Beard", kind: "select", options: BEARDS, maleOnly: true },
      { key: "beardLength", label: "Length", kind: "slider", min: 0, max: 100, maleOnly: true },
      { key: "beardThickness", label: "Thickness", kind: "slider", min: 0, max: 100, maleOnly: true },
      { key: "mustache", label: "Mustache", kind: "slider", min: 0, max: 100, maleOnly: true },
      { key: "sideburns", label: "Sideburns", kind: "slider", min: 0, max: 100, maleOnly: true },
      { key: "facialHairColor", label: "Color", kind: "swatch", colors: COLORS.hair, maleOnly: true },
    ],
  },
  {
    id: "hair",
    label: "Hair",
    icon: "content_cut",
    controls: [
      { key: "hairStyle", label: "Hairstyle", kind: "select", options: HAIR_STYLES },
      { key: "hairColor", label: "Hair color", kind: "swatch", colors: COLORS.hair },
      { key: "hairHighlight", label: "Highlights", kind: "swatch", colors: COLORS.hair },
      { key: "hairLength", label: "Length", kind: "slider", min: 0, max: 100 },
      { key: "hairVolume", label: "Volume", kind: "slider", min: 0, max: 100 },
      { key: "hairShine", label: "Shine", kind: "slider", min: 0, max: 100 },
    ],
  },
  {
    id: "body",
    label: "Body",
    icon: "accessibility_new",
    controls: [
      { key: "bodyBuild", label: "Build preset", kind: "select", options: [
        { value: "slim", label: "Slim" }, { value: "average", label: "Average" },
        { value: "athletic", label: "Athletic" }, { value: "heavy", label: "Heavy" },
      ]},
      { key: "bodyHeight", label: "Height", kind: "slider", min: 0, max: 100 },
      { key: "bodyWeight", label: "Weight", kind: "slider", min: 0, max: 100 },
      { key: "muscle", label: "Muscle", kind: "slider", min: 0, max: 100 },
      { key: "bodyFat", label: "Body fat", kind: "slider", min: 0, max: 100 },
      { key: "shoulderWidth", label: "Shoulders", kind: "slider", min: 0, max: 100 },
      { key: "chestSize", label: "Chest", kind: "slider", min: 0, max: 100 },
      { key: "waistSize", label: "Waist", kind: "slider", min: 0, max: 100 },
      { key: "hipSize", label: "Hips", kind: "slider", min: 0, max: 100 },
      { key: "armThickness", label: "Arms", kind: "slider", min: 0, max: 100 },
      { key: "legThickness", label: "Legs", kind: "slider", min: 0, max: 100 },
      { key: "handSize", label: "Hands", kind: "slider", min: 0, max: 100 },
      { key: "footSize", label: "Feet", kind: "slider", min: 0, max: 100 },
    ],
  },
  {
    id: "clothing",
    label: "Clothing",
    icon: "checkroom",
    controls: [
      { key: "shirtStyle", label: "Top", kind: "select", options: SHIRT_STYLES },
      { key: "shirtColor", label: "Top color", kind: "swatch", colors: COLORS.cloth },
      { key: "shirtMaterial", label: "Top material", kind: "select", options: [
        { value: 0, label: "Cotton" }, { value: 1, label: "Knit" }, { value: 2, label: "Silk" }, { value: 3, label: "Denim" },
      ]},
      { key: "pantsStyle", label: "Bottoms", kind: "select", options: PANTS_STYLES },
      { key: "pantsColor", label: "Bottoms color", kind: "swatch", colors: COLORS.pants },
      { key: "pantsMaterial", label: "Bottoms material", kind: "select", options: [
        { value: 0, label: "Denim" }, { value: 1, label: "Cotton" }, { value: 2, label: "Leather" }, { value: 3, label: "Sport" },
      ]},
    ],
  },
  {
    id: "shoes",
    label: "Shoes",
    icon: "steps",
    controls: [
      { key: "shoeStyle", label: "Style", kind: "select", options: SHOE_STYLES },
      { key: "shoeColor", label: "Color", kind: "swatch", colors: COLORS.cloth },
    ],
  },
  {
    id: "outerwear",
    label: "Outerwear",
    icon: "dry_cleaning",
    controls: [
      { key: "jacketStyle", label: "Jacket", kind: "select", options: [
        { value: 0, label: "None" }, { value: 1, label: "Bomber" }, { value: 2, label: "Denim" }, { value: 3, label: "Blazer" }, { value: 4, label: "Suit" },
      ]},
      { key: "jacketColor", label: "Jacket color", kind: "swatch", colors: COLORS.pants },
      { key: "outerwearStyle", label: "Coat", kind: "select", options: [
        { value: 0, label: "None" }, { value: 1, label: "Coat" }, { value: 2, label: "Rain Jacket" }, { value: 3, label: "Winter Jacket" },
      ]},
      { key: "outerwearColor", label: "Coat color", kind: "swatch", colors: COLORS.pants },
    ],
  },
  {
    id: "glasses",
    label: "Glasses",
    icon: "eyeglasses",
    controls: [
      { key: "glassesStyle", label: "Style", kind: "select", options: [
        { value: 0, label: "None" }, { value: 1, label: "Round" }, { value: 2, label: "Square" }, { value: 3, label: "Sunglasses" }, { value: 4, label: "Aviators" },
      ]},
    ],
  },
  {
    id: "hats",
    label: "Hats",
    icon: "styler",
    controls: [
      { key: "hatStyle", label: "Style", kind: "select", options: [
        { value: 0, label: "None" }, { value: 1, label: "Cap" }, { value: 2, label: "Beanie" }, { value: 3, label: "Bucket" }, { value: 4, label: "Fedora" },
      ]},
    ],
  },
  {
    id: "accessories",
    label: "Accessories",
    icon: "diamond",
    controls: [
      { key: "earringStyle", label: "Earrings", kind: "select", options: [
        { value: 0, label: "None" }, { value: 1, label: "Studs" }, { value: 2, label: "Hoops" },
      ]},
      { key: "necklaceStyle", label: "Necklace", kind: "select", options: [
        { value: 0, label: "None" }, { value: 1, label: "Chain" }, { value: 2, label: "Pendant" },
      ]},
      { key: "watchStyle", label: "Watch", kind: "select", options: [
        { value: 0, label: "None" }, { value: 1, label: "Sport" }, { value: 2, label: "Classic" },
      ]},
      { key: "ringStyle", label: "Rings", kind: "select", options: [
        { value: 0, label: "None" }, { value: 1, label: "Band" }, { value: 2, label: "Statement" },
      ]},
      { key: "braceletStyle", label: "Bracelet", kind: "select", options: [
        { value: 0, label: "None" }, { value: 1, label: "Chain" }, { value: 2, label: "Cuff" },
      ]},
      { key: "backpackStyle", label: "Backpack", kind: "select", options: [
        { value: 0, label: "None" }, { value: 1, label: "Daypack" }, { value: 2, label: "Sling" },
      ]},
      { key: "scarfStyle", label: "Scarf", kind: "select", options: [
        { value: 0, label: "None" }, { value: 1, label: "Knit" }, { value: 2, label: "Silk" },
      ]},
    ],
  },
  {
    id: "colors",
    label: "Colors",
    icon: "colors",
    controls: [
      { key: "shirtColor", label: "Top", kind: "swatch", colors: COLORS.cloth },
      { key: "pantsColor", label: "Bottoms", kind: "swatch", colors: COLORS.pants },
      { key: "hairColor", label: "Hair", kind: "swatch", colors: COLORS.hair },
      { key: "shoeColor", label: "Shoes", kind: "swatch", colors: COLORS.cloth },
      { key: "eyeColor", label: "Eyes", kind: "swatch", colors: COLORS.eyes },
      { key: "lipColor", label: "Lips", kind: "swatch", colors: COLORS.lips },
    ],
  },
  {
    id: "animations",
    label: "Animations",
    icon: "animation",
    controls: [{ key: "idleAnimation", label: "Preview", kind: "select", options: ANIMATIONS }],
  },
  {
    id: "emotes",
    label: "Emotes",
    icon: "mood",
    controls: [
      {
        key: "idleAnimation",
        label: "Emote",
        kind: "select",
        options: ANIMATIONS.filter((a) =>
          ["wave", "dance", "celebrate", "heart", "selfie", "jump", "look"].includes(a.value)
        ),
      },
    ],
  },
  {
    id: "outfits",
    label: "Saved Outfits",
    icon: "bookmark",
    controls: [],
  },
];

export function categoriesForGender(gender: AvatarConfig["gender"]): AvatarCategory[] {
  return AVATAR_CATEGORIES.map((cat) => ({
    ...cat,
    controls: cat.controls.filter((c) => {
      if (c.maleOnly && gender !== "male") return false;
      if (c.femaleOnly && gender !== "female") return false;
      return true;
    }),
  })).filter((cat) => cat.id === "gender" || cat.id === "outfits" || cat.controls.length > 0 || cat.id === "beard");
}

export function randomizeAvatarConfig(seed = Date.now(), gender?: "male" | "female"): AvatarConfig {
  const g = gender ?? (Math.sin(seed) > 0 ? "male" : "female");
  const pick = <T,>(arr: T[], n: number) =>
    arr[Math.floor(Math.abs(Math.sin(seed + n)) * arr.length) % arr.length]!;
  const pct = (n: number) => Math.floor(Math.abs(Math.sin(seed * (n + 1.7))) * 100);

  return {
    ...DEFAULT_AVATAR_CONFIG,
    ...genderDefaults(g),
    faceShape: pct(1),
    faceWidth: 35 + (pct(2) % 40),
    faceHeight: 35 + (pct(3) % 40),
    jaw: pct(4),
    jawWidth: pct(5),
    chin: pct(6),
    cheeks: pct(7),
    skinTone: Math.floor(pct(8) / (100 / SKIN_TONES.length)) % SKIN_TONES.length,
    hairStyle: Math.floor(pct(9) / (100 / HAIR_LIBRARY)) % HAIR_LIBRARY,
    hairColor: pick(COLORS.hair, 10),
    hairHighlight: pick(COLORS.hair, 11),
    hairLength: pct(12),
    hairVolume: pct(13),
    eyeColor: pick(COLORS.eyes, 14),
    eyeSize: 35 + (pct(15) % 40),
    eyeSpacing: 35 + (pct(16) % 40),
    shirtStyle: Math.floor(pct(17) / (100 / SHIRT_LIBRARY)) % SHIRT_LIBRARY,
    shirtColor: pick(COLORS.cloth, 18),
    pantsStyle: Math.floor(pct(19) / (100 / PANTS_LIBRARY)) % PANTS_LIBRARY,
    pantsColor: pick(COLORS.pants, 20),
    shoeStyle: Math.floor(pct(21) / (100 / SHOE_LIBRARY)) % SHOE_LIBRARY,
    shoeColor: pick(COLORS.cloth, 22),
    glassesStyle: pct(23) > 75 ? 1 + (pct(24) % 3) : 0,
    hatStyle: pct(25) > 85 ? 1 + (pct(26) % 3) : 0,
    beardStyle: g === "male" && pct(27) > 55 ? 1 + (pct(28) % 4) : 0,
    bodyHeight: 30 + (pct(29) % 50),
    bodyWeight: 30 + (pct(30) % 45),
    muscle: 25 + (pct(31) % 55),
    shoulderWidth: 30 + (pct(32) % 50),
    idleAnimation: "idle",
    modelSource: "modular",
    modelUrl: "",
  };
}

void SHIRT_LIBRARY;
void PANTS_LIBRARY;
void SHOE_LIBRARY;
