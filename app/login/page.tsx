"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "Invalid username or password. Try: demo / demo1234"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="soft-abstract-bg min-h-screen flex flex-col items-center justify-center p-6">
      <header className="mb-12 z-10 text-center">
        <h1 className="text-3xl font-black text-gradient-brand font-[var(--font-headline)] tracking-tight mb-2">
          Duo
        </h1>
        <p className="text-on-surface-variant text-sm font-medium">
          Find your digital heirloom
        </p>
      </header>

      <main className="w-full max-w-md z-10">
        <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_40px_60px_-15px] shadow-primary/8 border border-white/20">
          <div className="mb-8">
            <h2 className="font-[var(--font-headline)] text-2xl font-bold text-on-surface mb-1">
              Welcome back
            </h2>
            <p className="text-on-surface-variant text-sm">
              Please enter your details to continue
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface-variant ml-1" htmlFor="username">
                Username
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                  person
                </span>
                <input
                  className="w-full pl-12 pr-4 py-4 bg-surface rounded-[1rem] border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-on-surface placeholder:text-outline shadow-sm"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="demo"
                  type="text"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="block text-sm font-semibold text-on-surface-variant" htmlFor="password">
                  Password
                </label>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
                  lock
                </span>
                <input
                  className="w-full pl-12 pr-12 py-4 bg-surface rounded-[1rem] border-none ring-1 ring-outline-variant/30 focus:ring-2 focus:ring-primary/40 transition-all outline-none text-on-surface placeholder:text-outline shadow-sm"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="demo1234"
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

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/30"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-4 text-outline font-bold tracking-widest">
                Demo credentials
              </span>
            </div>
          </div>

          <div className="bg-surface rounded-xl p-4 text-center">
            <p className="text-sm text-on-surface-variant">
              Username: <code className="font-bold text-primary">demo</code> &nbsp;|&nbsp;
              Password: <code className="font-bold text-primary">demo1234</code>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-on-surface-variant font-medium text-sm">
            New to Duo?{" "}
            <Link className="text-secondary font-bold hover:underline underline-offset-4 ml-1" href="/onboarding">
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
