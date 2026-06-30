export function getGoogleOAuthRedirectUri(): string {
  let uri: string;
  if (process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI) {
    uri = process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
  } else if (typeof window !== "undefined") {
    uri = `${window.location.origin}/api/auth/google/callback`;
  } else {
    uri = "http://localhost:3000/api/auth/google/callback";
  }
  // Google requires an exact redirect URI match (no trailing slash).
  return uri.replace(/\/$/, "");
}
