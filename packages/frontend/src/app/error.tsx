'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to console for debugging
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-slate-900">
      <div className="max-w-md text-center">
        <h2 className="text-2xl font-bold text-red-500 mb-4">
          Something went wrong!
        </h2>
        <div className="bg-slate-800 p-4 rounded text-left text-sm overflow-auto mb-4 max-h-60">
          <p className="text-red-400 font-mono break-words">
            {error.message}
          </p>
          {error.digest && (
            <p className="text-gray-500 mt-2 text-xs">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
