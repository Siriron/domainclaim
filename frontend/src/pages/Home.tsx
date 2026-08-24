import { useState } from 'react';
import RdapTrace from '../components/RdapTrace';
import FileClaimForm from '../components/FileClaimForm';
import { EXPLORER_ADDRESS_URL, STUDIONET_CONTRACT_ADDRESS } from '../config/chains';

const DEMO_OUTCOME = {
  kind: 'judged' as const,
  verdict: 'registrant_unresolvable',
  registrantSignal: 'absent',
  confidenceBps: 1000,
  reasoningSummary:
    'The RDAP record contains no entity with the "registrant" role. Only a registrar entity and an abuse contact are present — no genuine registrant name, organization, or email is disclosed, redacted, or obscured.',
};

export default function Home() {
  const [demoActive, setDemoActive] = useState(false);

  return (
    <div>
      {/* Hero — the trace itself is the thesis, not a headline describing it */}
      <section className="mx-auto max-w-6xl px-6 pt-14 pb-16 md:pt-20 md:pb-24">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-wide text-registry mb-4">
              domain-control attestation
            </p>
            <h1 className="type-scale-hero font-display font-semibold text-ink mb-6">
              Who controls a domain, according to the registry — not a screenshot.
            </h1>
            <p className="text-ink-soft text-lg leading-relaxed max-w-md mb-8">
              DomainClaim fetches the live RDAP record for a domain and judges a
              claimed registrant identity against it directly. No party supplies
              evidence. The record speaks for itself, or it doesn't — and the
              contract says so plainly either way.
            </p>
            <button
              onClick={() => setDemoActive(true)}
              className="rounded-sm bg-registry px-5 py-3 text-sm font-medium text-paper hover:bg-registry-soft transition-colors"
            >
              See a real resolved record
            </button>
          </div>

          <RdapTrace
            domain="google.com"
            active={demoActive}
            outcome={demoActive ? DEMO_OUTCOME : null}
          />
        </div>
      </section>

      {/* Concept table */}
      <section className="border-y border-file-line bg-paper-dim">
        <div className="mx-auto max-w-6xl px-6 py-12 grid gap-8 md:grid-cols-4">
          {[
            { label: 'Concept', value: 'Single-party domain-registrant attestation' },
            { label: 'Consensus need', value: 'Both a claimant and the true registrant benefit from a false verdict' },
            { label: 'Evidence source', value: 'RDAP, fetched fresh — never submitter-supplied' },
            { label: 'Network', value: 'StudioNet' },
          ].map((item) => (
            <div key={item.label}>
              <p className="text-xs uppercase tracking-wide text-file mb-1.5">{item.label}</p>
              <p className="text-sm text-ink-soft leading-snug">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* File a claim */}
      <section className="mx-auto max-w-6xl px-6 py-16 md:py-20">
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-ink mb-2">
          File a claim
        </h2>
        <p className="text-file mb-8 max-w-lg">
          Name a domain and the identity you believe controls it. The contract
          fetches RDAP and resolves both steps as one flow below.
        </p>
        <FileClaimForm />
      </section>

      {/* Lifecycle */}
      <section className="border-t border-file-line bg-paper-dim">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="font-display text-2xl font-semibold text-ink mb-8">How a claim moves</h2>
          <div className="grid gap-6 md:grid-cols-5">
            {[
              { step: 'file_claim', desc: 'Domain and claimed identity recorded on-chain.' },
              { step: 'resolve_claim', desc: 'RDAP fetched live; verdict reached by validator quorum.' },
              { step: 'challenge_claim', desc: 'Anyone may contest a resolved verdict within 7 days.' },
              { step: 'resolve_challenge', desc: 'A second, independent round re-fetches RDAP fresh.' },
              { step: 'finalize_claim', desc: 'Locked once the window closes or a challenge resolves.' },
            ].map((s, i) => (
              <div key={s.step} className="relative">
                <p className="font-mono text-xs text-registry mb-2">{String(i + 1).padStart(2, '0')}</p>
                <p className="font-mono text-sm text-ink font-medium mb-1.5">{s.step}</p>
                <p className="text-xs text-file leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deployed record */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="rounded-sm border-2 border-ink bg-white p-8 max-w-xl">
          <p className="font-mono text-xs uppercase tracking-wide text-file mb-3">deployed record</p>
          <p className="font-mono text-sm text-ink break-all mb-4">{STUDIONET_CONTRACT_ADDRESS}</p>
          <a
            href={EXPLORER_ADDRESS_URL(STUDIONET_CONTRACT_ADDRESS)}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-registry underline decoration-file-line hover:text-registry-soft"
          >
            View on explorer ↗
          </a>
        </div>
      </section>
    </div>
  );
}
