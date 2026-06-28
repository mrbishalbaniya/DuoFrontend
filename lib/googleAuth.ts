export function getGoogleOAuthRedirectUri(): string {
  if (process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI) {
    return process.env.NEXT_PUBLIC_GOOGLE_REDIRECT_URI;
  }

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:8000/api";

  return `${apiBase}/auth/google/callback/`;
}
