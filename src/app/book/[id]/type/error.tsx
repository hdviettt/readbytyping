"use client";

export default function TypingError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-md mx-auto mt-20 p-8 text-center">
      <h2 className="text-xl font-semibold text-ink-error mb-3">
        Typing Error
      </h2>
      <p className="text-sm text-muted mb-6">
        {error.message || "Something went wrong while loading the typing interface."}
      </p>
      <div className="flex gap-3 justify-center">
        <button
          onClick={reset}
          className="px-5 py-2.5 bg-accent hover:bg-accent-hover text-background font-medium transition-colors"
        >
          Try Again
        </button>
        <a
          href="/"
          className="px-5 py-2.5 border border-border hover:border-border-hover font-medium transition-colors"
        >
          Go back to Library
        </a>
      </div>
    </div>
  );
}
