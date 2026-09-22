"use client";

import { PixelSprite } from "@/components/PixelSprite";

// Global error boundary (spec Quality: loading/empty/error states).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-forest flex items-center justify-center p-6">
      <div className="pixel-card max-w-md w-full p-6 text-center">
        <div className="text-4xl mb-3" aria-hidden><PixelSprite name="alert" size={40} /></div>
        <div className="font-pixel text-xs mb-2">Something broke</div>
        <p className="text-sm text-ink-soft mb-4">
          The forest is quiet… an unexpected error occurred. Your data is safe — try again.
        </p>
        {error.digest ? (
          <p className="text-[10px] text-ink-soft opacity-60 mb-4 font-mono">ref: {error.digest}</p>
        ) : null}
        <button
          onClick={reset}
          className="pixel-btn pixel-btn-primary w-full"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
