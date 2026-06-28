"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
        <h2 className="text-lg font-semibold">Application error</h2>
        <p className="max-w-md text-sm text-gray-600">
          {error.message || "A critical error occurred."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white"
        >
          Reload
        </button>
      </body>
    </html>
  );
}
