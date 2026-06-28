export function getGoogleOAuthRedirectUri(): string {
  if (process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI) {
    return process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/auth/google/callback`;
  }
  return "http://localhost:3000/api/auth/google/callback";
}
