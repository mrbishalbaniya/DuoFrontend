export type AvatarPreviewAnimation =
  | "idle"
  | "walk"
  | "run"
  | "wave"
  | "sit"
  | "dance"
  | "celebrate"
  | "jump"
  | "selfie"
  | "heart"
  | "look";

export type AvatarStudioBackground =
  | "transparent"
  | "studio"
  | "gradient"
  | "dark"
  | "light"
  | "space"
  | "globe";

export type AvatarGender = "male" | "female" | "";

export type AvatarModelSource = "modular" | "gltf" | "readyplayerme";

export type AvatarBodyBuild = "slim" | "average" | "athletic" | "heavy";

/**
 * Full character creator config — only these values are persisted.
 * The frontend assembles geometry from this JSON.
 */
export type AvatarConfig = {
  version: 2;
  gender: AvatarGender;
  modelSource: AvatarModelSource;
  /** Optional external GLB (RPM) — modular assembly used when empty / modular */
  modelUrl: string;

  // Face morphs 0–100
  facePreset: number;
  faceShape: number;
  faceWidth: number;
  faceHeight: number;
  jaw: number;
  jawWidth: number;
  chin: number;
  chinLength: number;
  cheeks: number;
  cheekFullness: number;

  // Skin
  skinTone: number;
  skinTexture: number;
  freckles: number;
  moles: number;
  acne: number;
  wrinkles: number;
  shine: number;
  smoothness: number;

  // Eyes
  eyeShape: number;
  eyeSize: number;
  eyeSpacing: number;
  eyeAngle: number;
  eyeColor: string;
  pupilSize: number;
  eyelashes: number;
  eyelidShape: number;

  // Brows
  browStyle: number;
  browThickness: number;
  browLength: number;
  browPosition: number;
  browRotation: number;
  browColor: string;

  // Nose
  noseWidth: number;
  noseHeight: number;
  noseLength: number;
  noseBridge: number;
  noseTip: number;
  nostrilSize: number;

  // Mouth
  lipShape: number;
  lipSize: number;
  upperLip: number;
  lowerLip: number;
  smile: number;
  mouthWidth: number;
  lipColor: string;

  // Teeth
  teethStyle: number;
  smileIntensity: number;

  // Ears
  earSize: number;
  earRotation: number;
  earShape: number;

  // Facial hair (male)
  beardStyle: number;
  beardLength: number;
  beardThickness: number;
  mustache: number;
  sideburns: number;
  facialHairColor: string;

  // Hair
  hairStyle: number;
  hairColor: string;
  hairHighlight: string;
  hairLength: number;
  hairVolume: number;
  hairShine: number;

  // Body proportions
  bodyHeight: number;
  bodyWeight: number;
  muscle: number;
  bodyFat: number;
  shoulderWidth: number;
  chestSize: number;
  waistSize: number;
  hipSize: number;
  armThickness: number;
  legThickness: number;
  handSize: number;
  footSize: number;
  bodyBuild: AvatarBodyBuild;

  // Clothing (asset IDs)
  shirtStyle: number;
  shirtColor: string;
  shirtMaterial: number;
  jacketStyle: number;
  jacketColor: string;
  pantsStyle: number;
  pantsColor: string;
  pantsMaterial: number;
  shoeStyle: number;
  shoeColor: string;
  outerwearStyle: number;
  outerwearColor: string;

  // Accessories
  glassesStyle: number;
  hatStyle: number;
  earringStyle: number;
  necklaceStyle: number;
  watchStyle: number;
  ringStyle: number;
  braceletStyle: number;
  backpackStyle: number;
  scarfStyle: number;

  idleAnimation: AvatarPreviewAnimation;
};

export type AvatarCategoryId =
  | "gender"
  | "face"
  | "skin"
  | "eyes"
  | "eyebrows"
  | "nose"
  | "mouth"
  | "teeth"
  | "ears"
  | "beard"
  | "hair"
  | "body"
  | "clothing"
  | "shoes"
  | "outerwear"
  | "accessories"
  | "hats"
  | "glasses"
  | "colors"
  | "animations"
  | "emotes"
  | "outfits";

export const SKIN_TONES = [
  "#ffe0bd",
  "#ffcd94",
  "#eac086",
  "#ffad60",
  "#c68642",
  "#8d5524",
  "#5c3a21",
  "#3b2414",
  "#f3c6a8",
  "#d4a574",
];

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  version: 2,
  gender: "",
  modelSource: "modular",
  modelUrl: "",

  facePreset: 1,
  faceShape: 50,
  faceWidth: 50,
  faceHeight: 50,
  jaw: 50,
  jawWidth: 50,
  chin: 50,
  chinLength: 50,
  cheeks: 50,
  cheekFullness: 50,

  skinTone: 2,
  skinTexture: 40,
  freckles: 0,
  moles: 0,
  acne: 0,
  wrinkles: 10,
  shine: 30,
  smoothness: 60,

  eyeShape: 1,
  eyeSize: 50,
  eyeSpacing: 50,
  eyeAngle: 50,
  eyeColor: "#3b5b8a",
  pupilSize: 50,
  eyelashes: 45,
  eyelidShape: 50,

  browStyle: 1,
  browThickness: 50,
  browLength: 50,
  browPosition: 50,
  browRotation: 50,
  browColor: "#2c1810",

  noseWidth: 50,
  noseHeight: 50,
  noseLength: 50,
  noseBridge: 50,
  noseTip: 50,
  nostrilSize: 50,

  lipShape: 1,
  lipSize: 50,
  upperLip: 50,
  lowerLip: 50,
  smile: 35,
  mouthWidth: 50,
  lipColor: "#c45c6a",

  teethStyle: 0,
  smileIntensity: 40,

  earSize: 50,
  earRotation: 50,
  earShape: 50,

  beardStyle: 0,
  beardLength: 30,
  beardThickness: 40,
  mustache: 0,
  sideburns: 0,
  facialHairColor: "#2c1810",

  hairStyle: 2,
  hairColor: "#3d2314",
  hairHighlight: "#6b4423",
  hairLength: 50,
  hairVolume: 50,
  hairShine: 40,

  bodyHeight: 50,
  bodyWeight: 45,
  muscle: 40,
  bodyFat: 30,
  shoulderWidth: 50,
  chestSize: 50,
  waistSize: 45,
  hipSize: 50,
  armThickness: 45,
  legThickness: 45,
  handSize: 50,
  footSize: 50,
  bodyBuild: "average",

  shirtStyle: 1,
  shirtColor: "#ec4899",
  shirtMaterial: 0,
  jacketStyle: 0,
  jacketColor: "#334155",
  pantsStyle: 1,
  pantsColor: "#1e293b",
  pantsMaterial: 0,
  shoeStyle: 1,
  shoeColor: "#111827",
  outerwearStyle: 0,
  outerwearColor: "#1e293b",

  glassesStyle: 0,
  hatStyle: 0,
  earringStyle: 0,
  necklaceStyle: 0,
  watchStyle: 0,
  ringStyle: 0,
  braceletStyle: 0,
  backpackStyle: 0,
  scarfStyle: 0,

  idleAnimation: "idle",
};

export function mergeAvatarConfig(raw: Partial<AvatarConfig> | null | undefined): AvatarConfig {
  const merged = { ...DEFAULT_AVATAR_CONFIG, ...(raw ?? {}), version: 2 as const };
  // Migrate v1 leftovers
  if (!merged.gender && (raw as { gender?: string } | undefined)?.gender) {
    merged.gender = (raw as { gender: AvatarGender }).gender;
  }
  if (!merged.facialHairColor) merged.facialHairColor = merged.hairColor;
  if (!merged.lipColor) merged.lipColor = "#c45c6a";
  return merged;
}

export function genderDefaults(gender: "male" | "female"): Partial<AvatarConfig> {
  if (gender === "female") {
    return {
      gender: "female",
      shoulderWidth: 42,
      chestSize: 55,
      waistSize: 40,
      hipSize: 58,
      bodyHeight: 48,
      muscle: 30,
      hairStyle: 8,
      hairLength: 70,
      beardStyle: 0,
      mustache: 0,
      shirtStyle: 1,
      pantsStyle: 7,
      shoeStyle: 4,
      bodyBuild: "slim",
    };
  }
  return {
    gender: "male",
    shoulderWidth: 58,
    chestSize: 55,
    waistSize: 48,
    hipSize: 45,
    bodyHeight: 55,
    muscle: 50,
    hairStyle: 2,
    hairLength: 35,
    shirtStyle: 1,
    pantsStyle: 1,
    shoeStyle: 1,
    bodyBuild: "athletic",
  };
}
