import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <p className="font-mono text-xs uppercase tracking-wide text-stamp mb-3">
        no record at this path
      </p>
      <h1 className="font-display text-4xl font-semibold text-ink mb-3">Nothing filed here.</h1>
      <p className="text-file max-w-sm mb-6">
        This page doesn't exist. If you were looking for a specific claim, use
        the challenge lookup instead of a direct URL.
      </p>
      <Link
        to="/"
        className="rounded-sm bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft transition-colors"
      >
        File a claim
      </Link>
    </div>
  );
}
