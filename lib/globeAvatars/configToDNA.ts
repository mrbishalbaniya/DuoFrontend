import type { AvatarConfig } from "@/lib/avatarStudio/types";
import { SKIN_TONES } from "@/lib/avatarStudio/types";

import type { AvatarDNA } from "./types";

/**
 * Map saved Avatar Studio config → globe AvatarDNA so the same look
 * appears on the map without rebuilding the globe renderer.
 */
export function avatarConfigToDNA(config: AvatarConfig, profileId: string): AvatarDNA {
  const seed = Math.abs(hash(profileId));
  const skin =
    SKIN_TONES[Math.min(SKIN_TONES.length - 1, Math.max(0, config.skinTone))] ?? SKIN_TONES[2]!;

  let accessory: AvatarDNA["accessory"] = "none";
  if (config.glassesStyle > 0) accessory = "glasses";
  else if (config.hatStyle > 0) accessory = "hat";
  else if (config.earringStyle > 0) accessory = "earrings";

  let outfitStyle: AvatarDNA["outfitStyle"] = "casual";
  if (config.jacketStyle > 0) outfitStyle = "formal";
  else if (config.shirtStyle >= 3) outfitStyle = "sporty";

  return {
    seed,
    skinTone: skin,
    hairStyle: (config.hairStyle % 4) as 0 | 1 | 2 | 3,
    hairColor: config.hairColor,
    shirtColor: config.shirtColor,
    pantsColor: config.pantsColor,
    shoeColor: config.shoeColor,
    accessory,
    outfitStyle,
  };
}

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
