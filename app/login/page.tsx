"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { getGoogleOAuthRedirectUri } from "@/lib/googleAuth";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-on-surface-variant">
          Loading...
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const { login, loginWithGoogle } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next");
  const safeNext =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : null;
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const googleRedirectUri = getGoogleOAuthRedirectUri();
  const googleAuthError = searchParams.get("error") === "google_auth";
  const googleAuthReason = searchParams.get("reason") ?? "";
  const passwordResetSuccess = searchParams.get("reset") === "success";

  useEffect(() => {
    if (passwordResetSuccess) {
      setError("");
    }
  }, [passwordResetSuccess]);

  useEffect(() => {
    if (!googleAuthError) return;

    if (googleAuthReason.includes("invalid_client") || googleAuthReason.includes("client secret")) {
      setError(
        "Google client secret is wrong on the backend. Reset it in Google Cloud Console, then update Render and Django Admin Integration settings."
      );
      return;
    }

    if (googleAuthReason.includes("Redirect URI is not allowed")) {
      setError(
        "Google redirect URI is not allowed on the backend. Add the URL below in Google Cloud Console, then try again."
      );
      return;
    }

    if (googleAuthReason) {
      setError(googleAuthReason);
      return;
    }

    setError(
      "Google sign-in failed. Add the redirect URI below in Google Cloud Console, then try again."
    );
  }, [googleAuthError, googleAuthReason]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError("Username or email is required.");
      return;
    }
    if (trimmedUsername.length > 150) {
      setError("Username or email is too long.");
      return;
    }
    if (!password) {
      setError("Password is required.");
      return;
    }
    if (password.length > 128) {
      setError("Password is too long.");
      return;
    }

    setLoading(true);
    try {
      await login(trimmedUsername, password);
      router.push(safeNext ?? "/match");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid username or password."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credential: string) => {
    setError("");
    setLoading(true);
    try {
      const data = await loginWithGoogle(credential);
      const onboarded = data.user?.profile?.is_onboarded;
      if (!onboarded) {
        sessionStorage.setItem("duo_register_via_google", "1");
      }
      if (safeNext) {
        router.push(safeNext);
      } else {
        router.push(onboarded ? "/match" : "/register");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Google sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <header className="mb-12 z-10 text-center">
        <h1 className="text-3xl font-black text-gradient-brand font-[var(--font-headline)] tracking-tight mb-2">
          Duo
        </h1>
        <p className="text-on-surface-variant text-sm font-medium">
          Find your digital heirloom
        </p>
      </header>

      <main className="w-full max-w-md z-10">
        <div className="glass-card rounded-[2rem] p-8 shadow-[0_40px_60px_-15px] shadow-primary/15">
          <div className="mb-8">
            <h2 className="font-[var(--font-headline)] text-2xl font-bold text-on-surface mb-1">
              Welcome back
            </h2>
            <p className="text-on-surface-variant text-sm">
              Please enter your details to continue
            </p>
          </div>

          {passwordResetSuccess && (
            <div className="mb-6 p-4 bg-primary-container text-on-primary-container rounded-xl text-sm font-medium">
              Your password has been updated. Sign in with your new password.
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl text-sm font-medium space-y-3">
              <p>{error}</p>
              {googleAuthError && (
                <div className="rounded-lg bg-black/10 p-3 text-xs leading-relaxed">
                  {error.includes("client secret") ? (
                    <>
                      <p className="font-semibold mb-1">Fix backend Google credentials</p>
                      <ol className="list-decimal space-y-1 pl-4">
                        <li>Google Cloud Console → Credentials → your Web client → reset/copy Client secret</li>
                        <li>Render → DuoBackend → Environment → set GOOGLE_OAUTH_CLIENT_SECRET</li>
                        <li>
                          Django Admin → Integration settings → paste the same secret (or clear admin fields to
                          use Render env)
                        </li>
                      </ol>
                    </>
                  ) : (
                    <>
                      <p className="font-semibold mb-1">Google Cloud Console setup</p>
                      <p className="mb-2">
                        Credentials → your Web client → Authorized redirect URIs → add this exact URL:
                      </p>
                      <code className="block break-all rounded bg-black/10 px-2 py-1">
                        {googleRedirectUri}
                      </code>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant ml-1" htmlFor="username">
                Email
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                  person
                </span>
                <input
                  className="w-full pl-12 pr-4 py-4 bg-surface-container-high rounded-[1rem] border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-on-surface placeholder:text-outline"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block text-sm font-semibold text-on-surface-variant" htmlFor="password">
                  Password
                </label>
                <Link
                  href="/login/forgot-password"
                  className="text-xs font-semibold text-accent hover:underline underline-offset-4"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                  lock
                </span>
                <input
                  className="w-full pl-12 pr-12 py-4 bg-surface-container-high rounded-[1rem] border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-on-surface placeholder:text-outline"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  type={showPassword ? "text" : "password"}
                  required
                />
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-symbols-outlined">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-brand text-white py-4 rounded-full font-bold text-base shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 font-[var(--font-headline)] disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-outline-variant/20" />
            <span className="text-xs font-bold uppercase tracking-widest text-outline">or</span>
            <div className="h-px flex-1 bg-outline-variant/20" />
          </div>

          <GoogleSignInButton
            onSuccess={handleGoogleSuccess}
            onError={() => setError("Google sign-in was cancelled or failed.")}
            disabled={loading}
          />
        </div>

        <div className="mt-8 text-center">
          <p className="text-on-surface-variant font-medium text-sm">
            New to Duo?{" "}
            <Link className="text-accent font-bold hover:underline underline-offset-4 ml-1" href="/register">
              Create an account
            </Link>
          </p>
        </div>
      </main>

      <footer className="mt-auto py-6 z-10">
        <div className="flex gap-6 text-[11px] font-bold text-outline uppercase tracking-widest">
          <Link className="hover:text-primary transition-colors" href="#">Privacy Policy</Link>
          <Link className="hover:text-primary transition-colors" href="#">Terms of Service</Link>
          <Link className="hover:text-primary transition-colors" href="#">Help Center</Link>
        </div>
      </footer>
    </div>
  );
}
