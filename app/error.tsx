"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
      <h2 className="text-lg font-semibold text-on-surface">Something went wrong</h2>
      <p className="max-w-md text-sm text-on-surface-variant">
        {error.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-full bg-primary px-5 py-2 text-sm font-medium text-on-primary"
      >
        Try again
      </button>
    </div>
  );
}
