import ChallengePanel from '../components/ChallengePanel';

export default function Challenge() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-14 md:py-20">
      <p className="font-mono text-xs uppercase tracking-wide text-stamp mb-4">
        contest a resolved claim
      </p>
      <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink mb-4">
        RDAP is a live record. A resolved verdict isn't the last word.
      </h1>
      <p className="text-ink-soft text-base leading-relaxed mb-10 max-w-xl">
        A domain can be re-registered, transferred, or newly privacy-proxied
        the moment after a claim resolves. Look up a resolved claim below —
        challenging it triggers a second, independent consensus round against
        a fresh RDAP fetch, not a re-argument of the original one.
      </p>
      <ChallengePanel />
    </section>
  );
}
