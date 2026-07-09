export type ActivityLevel = "low" | "moderate" | "high" | "trending" | "viral";

export type ActivityBadge = "trending" | "event" | "popular" | "recommended";

export type ActivityZone = {
  id: string;
  lat: number;
  lng: number;
  score: number;
  level: ActivityLevel;
  active_users: number;
  friends_active: number;
  radius_km: number;
  name: string;
  badges: ActivityBadge[];
  events: string[];
  messages: number;
  matches: number;
  likes: number;
  trending: boolean;
};

export type DisplayZone = ActivityZone & {
  displayScore: number;
  displayRadius: number;
  phase: number;
};

export type ActivityZoneResponse = {
  zones: ActivityZone[];
  updated_at: string;
};

export type ActivityLayerFlags = {
  live: boolean;
  trending: boolean;
  nearby: boolean;
  events: boolean;
  friends: boolean;
};
