import type { MapProfile } from "@/components/map/types";

export type PresenceStatus = "online" | "away" | "busy" | "offline";

export type AvatarAnimationState = "idle" | "selected" | "walking";

export type AvatarDNA = {
  seed: number;
  skinTone: string;
  hairStyle: 0 | 1 | 2 | 3;
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  shoeColor: string;
  accessory: "none" | "glasses" | "hat" | "earrings";
  outfitStyle: "casual" | "formal" | "sporty";
};

export type GlobeAvatarInstance = {
  id: string;
  profile: MapProfile;
  lng: number;
  lat: number;
  offsetLng: number;
  offsetLat: number;
  clusterId?: string;
  presence: PresenceStatus;
  animation: AvatarAnimationState;
  selected: boolean;
};

export type AvatarScreenPoint = {
  id: string;
  x: number;
  y: number;
  radius: number;
};

export type WeatherAccessory = "none" | "sunglasses" | "umbrella" | "winter";
