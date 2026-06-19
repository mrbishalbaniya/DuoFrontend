export interface Profile {
  id?: number;
  user_id?: number;
  full_name: string;
  age?: number | string | null;
  phone_country_code?: string;
  phone_number?: string;
  gender?: string;
  bio?: string;
  location?: string;
  education?: string;
  occupation?: string;
  religion?: string;
  work_preference?: string;
  photo_url?: string | null;
  photo_urls?: string[];
  lifestyle_tags?: string[];
  is_verified?: boolean;
  is_onboarded?: boolean;
  profile_completeness?: number;
  pref_age_min?: number;
  pref_age_max?: number;
  pref_min_height?: string;
  pref_occupation?: string;
  pref_values?: string;
  pref_gender?: "everyone" | "women" | "men";
  pref_location?: string;
  pref_max_distance_km?: number;
  pref_relationship_goal?: "everyone" | "serious" | "casual" | "dating";
  pref_verified_only?: boolean;
  relationship_goal?: "serious" | "casual" | "dating" | "";
}

export interface User {
  id: number;
  username: string;
  email?: string;
  profile: Profile;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginResponse extends AuthTokens {
  user?: User;
}

export interface RegisterResponse {
  tokens: AuthTokens;
  user?: User;
}

export type SwipeAction = "LIKE" | "SKIP";

export interface SwipeResponse {
  matched?: boolean;
  is_match?: boolean;
  match?: MatchSessionData & { compatibility_score?: number };
  match_id?: number;
  other_user_profile?: Profile;
}

export interface Match {
  id: number;
  other_user_profile: Profile;
  compatibility_score?: number;
  shared_interests?: string[];
  insight_summary?: string;
  created_at?: string;
  values_score?: number;
  lifestyle_score?: number;
  career_score?: number;
  hobbies_score?: number;
  spark_factors?: string[];
  vision_insight?: string;
  communication_insight?: string;
}

export interface ChatMessage extends Message {
  is_mine?: boolean;
  is_read?: boolean;
  is_deleted_for_me?: boolean;
  is_deleted_for_everyone?: boolean;
  sender_photo?: string;
  sender_name?: string;
  timestamp?: string;
}

export interface Conversation {
  id: number;
  other_user_profile?: Profile;
  last_message?: string | { content?: string; timestamp?: string; created_at?: string };
  last_message_at?: string;
  updated_at?: string;
  created_at?: string;
  unread_count?: number;
}

export interface ConversationDetail extends Conversation {
  is_other_user_typing?: boolean;
}

export interface Message {
  id: number;
  conversation?: number;
  sender_id?: number;
  content: string;
  image_url?: string | null;
  created_at?: string;
  reactions?: Record<string, number[] | number>;
  is_deleted?: boolean;
}

export interface ProfileFormData {
  full_name: string;
  age: string | number;
  bio: string;
  location: string;
  phone_country_code?: string;
  phone_number?: string;
  education: string;
  occupation: string;
  pref_age_min: number;
  pref_age_max: number;
  pref_values: string;
  pref_gender?: string;
  pref_location?: string;
  pref_max_distance_km?: number;
  pref_relationship_goal?: string;
  pref_verified_only?: boolean;
  relationship_goal?: string;
  gender?: string;
  religion?: string;
  work_preference?: string;
  is_onboarded?: boolean;
}

export interface OnboardingFormData {
  email: string;
  password: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  religion: string;
  education: string;
  occupation: string;
  work_preference: string;
  bio: string;
}

export interface MatchSessionData {
  other_user_profile?: Profile;
  match_id?: number;
  compatibility_score?: number;
}
