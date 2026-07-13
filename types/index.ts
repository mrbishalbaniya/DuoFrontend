export type PhotoAnalysisStatus = "APPROVED" | "WARNING" | "REJECTED";

export interface PhotoAnalysis {
  id: number;
  image_url: string;
  face_detected: boolean;
  face_count: number;
  face_centered: boolean;
  blur_score: number;
  brightness_score: number;
  resolution_passed: boolean;
  image_width: number;
  image_height: number;
  quality_score: number;
  ai_generated_probability: number;
  duplicate_probability: number;
  status: PhotoAnalysisStatus;
  warnings: string[];
  rejection_reasons: string[];
  is_primary: boolean;
  created_at: string;
}

export interface PhotoUploadAnalysisResponse {
  success: boolean;
  image_url?: string;
  analysis: PhotoAnalysis;
  detail?: string;
}

export type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED" | "UNDER_REVIEW";

export type LivenessStep = "smile" | "blink" | "head_left" | "head_right";

export interface VerificationStartResponse {
  session_id: string;
  session_token: string;
  expires_at: string;
  instructions: string[];
  liveness_steps: LivenessStep[];
  handoff_url?: string;
}

export interface LivenessStepResponse {
  step: LivenessStep;
  passed: boolean;
  score: number;
  detail: string;
  liveness_steps_completed: LivenessStep[];
  baseline_captured?: boolean;
}

export interface VerificationStatusResponse {
  status: VerificationStatus;
  similarity_score: number;
  liveness_score: number;
  fraud_probability: number;
  verified_badge: boolean;
  rejection_reasons?: string[];
  session?: UserVerificationSession;
}

export interface VerificationSessionDetail extends VerificationStatusResponse {
  liveness_steps: LivenessStep[];
  handoff_url: string;
  expires_at: string;
}

export interface VerificationHandoffEmailResponse {
  sent: boolean;
  email: string;
  handoff_url: string;
  session_token: string;
  expires_at: string;
}

export interface UserVerificationSession {
  id: number;
  session_token: string;
  profile_photo_url: string;
  selfie_photo_url: string;
  similarity_score: number;
  liveness_score: number;
  fraud_probability: number;
  verification_status: VerificationStatus;
  liveness_steps_completed?: LivenessStep[];
  rejection_reasons: string[];
  verified_badge: boolean;
  verified_at: string | null;
  expires_at: string | null;
  created_at: string;
}

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
  location_ghost_mode?: boolean;
  location_visibility?: "friends" | "friends_except" | "only_these";
  location_visibility_friends?: number[];
  /** Present on match profiles: whether this person shares location with you. */
  location_shared?: boolean;
  is_premium?: boolean;
  subscription_expires_at?: string | null;
  wallet_balance?: number;
  preview_distance_km?: number;
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

export type SwipeAction = "LIKE" | "SKIP" | "SUPERLIKE";

export interface SwipeResponse {
  matched?: boolean;
  is_match?: boolean;
  match?: MatchSessionData & { compatibility_score?: number };
  match_id?: number;
  other_user_profile?: Profile;
}

export interface LikedProfile {
  swipe_id?: number;
  profile: Profile;
  liked_at?: string;
  action?: SwipeAction;
  locked?: boolean;
}

export interface SubscriptionPlan {
  plan_id: string;
  name: string;
  description: string;
  currency: string;
  amount: number;
  duration_days: number;
  badge?: string | null;
}

export interface SubscriptionStatus {
  is_premium: boolean;
  expires_at: string | null;
  plan: SubscriptionPlan;
}

export interface EsewaPaymentForm {
  amount: string;
  tax_amount: string;
  total_amount: string;
  transaction_uuid: string;
  product_code: string;
  product_service_charge: string;
  product_delivery_charge: string;
  success_url: string;
  failure_url: string;
  signed_field_names: string;
  signature: string;
}

export interface InitiateSubscriptionResponse {
  payment_url: string;
  transaction_uuid: string;
  form: EsewaPaymentForm;
}

export interface WalletTransaction {
  type: "top_up" | "purchase" | "adjustment";
  amount: string;
  balance_after: string;
  description: string;
  reference_id: string;
  created_at: string;
}

export interface CoinPack {
  id: string;
  coins: number;
  price_npr: number;
  label: string;
}

export interface WalletSummary {
  balance: number;
  coins?: number;
  currency: string;
  top_up_presets: number[];
  coin_packs?: CoinPack[];
  transactions: WalletTransaction[];
}

export interface WalletPurchaseResponse {
  is_premium: boolean;
  expires_at: string;
  balance: number;
  plan: SubscriptionPlan;
}

export interface VisitedProfile {
  visit_id?: number;
  profile: Profile;
  visited_at?: string;
  locked?: boolean;
}

export interface ProfileVisitorsResponse {
  is_premium: boolean;
  premium_required: boolean;
  count: number;
  results: VisitedProfile[];
}

export interface LikesYouResponse {
  is_premium: boolean;
  premium_required: boolean;
  count: number;
  results: LikedProfile[];
}

export interface Match {
  id: number;
  other_user_profile: Profile;
  matched_at?: string;
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
  delivered_at?: string | null;
  read_at?: string | null;
  edited_at?: string | null;
  message_type?: "text" | "image" | "voice";
  reply_to?: MessageReplyPreview | null;
  client_temp_id?: string;
  send_status?: "pending" | "sent" | "failed";
}

export interface MessageReplyPreview {
  id: number;
  content: string;
  sender_name: string;
  image_url?: string;
  message_type?: string;
}

export interface Conversation {
  id: number;
  /** 10-digit shareable id used in /chat?conversation=… */
  public_id?: string;
  match_id?: number;
  match_created_at?: string;
  other_user_nickname?: string;
  other_user_profile?: Profile;
  last_message?: string | { content?: string; timestamp?: string; created_at?: string };
  last_message_at?: string;
  updated_at?: string;
  created_at?: string;
  unread_count?: number;
  is_archived?: boolean;
  is_muted?: boolean;
  is_pinned?: boolean;
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
  message_type?: string;
  delivered_at?: string | null;
  read_at?: string | null;
  edited_at?: string | null;
  reply_to?: MessageReplyPreview | null;
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
