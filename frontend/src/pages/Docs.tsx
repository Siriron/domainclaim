interface Section {
  id: string;
  title: string;
  body: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: 'overview',
    title: 'Overview',
    body: (
      <>
        <p>
          DomainClaim is an on-chain attestation of who controls a domain,
          judged entirely against RDAP — the IETF/ICANN-standardized
          successor to WHOIS. A caller names a domain and an identity they
          claim matches the registrant; the contract fetches the live RDAP
          record itself and a validator quorum judges whether the record
          genuinely supports that claim.
        </p>
        <p>
          Nobody supplies evidence directly. The domain name is the only real
          input — everything the verdict depends on is fetched by the
          contract, fresh, at resolution time.
        </p>
      </>
    ),
  },
  {
    id: 'how-it-works',
    title: 'How it works',
    body: (
      <>
        <ol className="list-decimal pl-5 space-y-2">
          <li>
            <span className="font-medium text-ink">file_claim</span> records a
            domain and a claimed registrant identity, and returns a unique DNS
            TXT record (name and value) the caller can optionally publish as
            proof of domain control. The domain is validated syntactically
            before anything is stored.
          </li>
          <li>
            <span className="font-medium text-ink">resolve_claim</span>{' '}
            resolves the domain's TLD to its authoritative RDAP server via
            IANA's own bootstrap registry, fetches the live record, checks live
            DNS for the verification token, and a leader/validator quorum
            independently judges whether a genuine registrant-role entity
            supports the claim — combined deterministically with whether DNS
            ownership was actually proven.
          </li>
          <li>
            <span className="font-medium text-ink">challenge_claim</span>{' '}
            lets anyone contest a resolved verdict within a 7-day window.
          </li>
          <li>
            <span className="font-medium text-ink">resolve_challenge</span>{' '}
            runs a second, fully independent consensus round — re-fetching
            RDAP and re-checking DNS fresh, not reading the original claim's
            stored content — and can uphold, overturn, or reject the
            challenge.
          </li>
          <li>
            <span className="font-medium text-ink">finalize_claim</span> locks
            the terminal state once the window closes uncontested, or once an
            open challenge resolves.
          </li>
        </ol>
      </>
    ),
  },
  {
    id: 'verdicts',
    title: 'Reading a verdict',
    body: (
      <>
        <p>A resolved claim lands in one of two shapes:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <span className="font-mono text-xs bg-paper-dim px-1.5 py-0.5 rounded-sm">judged</span> —
            a real verdict: <span className="font-medium">control_confirmed</span>{' '}
            (RDAP identity match AND DNS ownership both verified),{' '}
            <span className="font-medium">ownership_unverified</span> (RDAP
            identity matched, but domain control was never proven via DNS),{' '}
            <span className="font-medium">control_disputed</span>, or{' '}
            <span className="font-medium">registrant_unresolvable</span> if RDAP
            genuinely contains no identifying registrant data. This last case
            is common, not rare — most consumer domain registrations use
            privacy proxies by default. Publishing the DNS record is always
            optional — a claim resolved without it still gets an honest
            verdict, capped at ownership_unverified rather than reaching
            control_confirmed.
          </li>
          <li>
            <span className="font-mono text-xs bg-paper-dim px-1.5 py-0.5 rounded-sm">void</span> —
            no verdict was reached at all. A permanent void (an invalid domain,
            or one that doesn't exist as an RDAP object) can never be refiled
            with the same claim. A transient void (a bootstrap or fetch
            failure) can be retried.
          </li>
        </ul>
        <p className="mt-3">
          Every judged resolution also carries two independent signals, added
          in a second review cycle to close a gap where these facts were
          previously indistinguishable from a plain true/false:
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <span className="font-mono text-xs bg-paper-dim px-1.5 py-0.5 rounded-sm">dns_status</span>{' '}
            — <span className="font-medium">verified</span> (the TXT record
            genuinely matched), <span className="font-medium">not_verified</span>{' '}
            (the DNS lookup succeeded and genuinely found no matching record —
            the common case for a caller who hasn't published yet), or{' '}
            <span className="font-medium">check_failed</span> (the DNS lookup
            itself did not get a reliable answer this attempt — a resolver-side
            issue, not a confirmed absence of the record, and worth resolving
            again). Only <span className="font-medium">not_verified</span> and{' '}
            <span className="font-medium">check_failed</span> both cap the
            verdict at ownership_unverified — they used to be indistinguishable
            from each other; now only one of the two implies retrying might
            change the outcome.
          </li>
          <li>
            <span className="font-mono text-xs bg-paper-dim px-1.5 py-0.5 rounded-sm">evidence_truncated</span>{' '}
            — <span className="font-medium">true</span> if the RDAP record
            fetched for this specific resolution was too large and was cut off
            before the model ever saw the complete record. The judgment prompt
            tells the model explicitly when this happens and asks it to prefer
            an uncertain verdict over guessing — but a confident-looking verdict
            alongside evidence_truncated: true still deserves real scrutiny.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'architecture',
    title: 'Architecture',
    body: (
      <>
        <p>
          The frontend is a React + Vite single-page app that talks to the
          contract through genlayer-js, wired to a browser wallet. Reads use
          a plain read client; writes require the wallet to switch to
          StudioNet before every transaction.
        </p>
        <p>
          Evidence resolution happens entirely on-chain, inside the
          contract's nondet blocks — the frontend never fetches or
          interprets RDAP data itself. It only submits the domain and reads
          back whatever the contract already decided.
        </p>
      </>
    ),
  },
  {
    id: 'contracts',
    title: 'Smart contract',
    body: (
      <>
        <p>Every write and view method, as deployed:</p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse mt-3">
            <thead>
              <tr className="border-b border-file-line text-left">
                <th className="py-2 pr-4 font-mono text-xs text-file">method</th>
                <th className="py-2 font-mono text-xs text-file">kind</th>
              </tr>
            </thead>
            <tbody className="font-mono text-xs">
              {[
                ['file_claim', 'write'],
                ['resolve_claim', 'write'],
                ['challenge_claim', 'write'],
                ['resolve_challenge', 'write'],
                ['finalize_claim', 'write'],
                ['get_claim', 'view'],
                ['get_challenge', 'view'],
                ['get_claims_for_domain', 'view'],
                ['is_pair_permanently_voided', 'view'],
                ['get_verification_instructions', 'view'],
                ['get_next_claim_id', 'view'],
                ['get_next_challenge_id', 'view'],
              ].map(([m, k]) => (
                <tr key={m} className="border-b border-file-line/60">
                  <td className="py-2 pr-4 text-ink">{m}</td>
                  <td className="py-2 text-file">{k}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    ),
  },
  {
    id: 'faq',
    title: 'FAQ',
    body: (
      <>
        <p className="font-medium text-ink mb-1">Why does most things resolve as unresolvable?</p>
        <p className="mb-4">
          Because most consumer domain registrars default to privacy
          protection, and GDPR-driven redaction is mandatory for many
          registrants regardless of registrar choice. A genuinely disclosed
          registrant is the minority case for consumer-registered domains,
          not the majority.
        </p>
        <p className="font-medium text-ink mb-1">Do I have to publish the DNS record?</p>
        <p className="mb-4">
          No — it's optional. Resolving without it still produces an honest
          verdict, it just caps out at ownership_unverified rather than
          reaching control_confirmed, since RDAP-text agreement alone was
          found, via a real portal review, not to be sufficient proof that
          the filer actually controls the domain. If you did publish it and
          still see ownership_unverified, check the dns_status field on the
          resolved claim — check_failed means the lookup itself is worth
          retrying, while not_verified means try waiting for propagation.
        </p>
        <p className="font-medium text-ink mb-1">I published the record and it still shows unverified.</p>
        <p className="mb-4">
          DNS propagation isn't instant. The contract checks a public DNS
          resolver, not the authoritative nameserver directly — if you just
          published the record, wait for normal DNS propagation time and
          resolve again.
        </p>
        <p className="font-medium text-ink mb-1">Can I use a URL instead of a bare domain?</p>
        <p className="mb-4">
          Yes — a pasted URL is normalized down to its domain automatically
          before validation.
        </p>
        <p className="font-medium text-ink mb-1">Does this reflect historical ownership?</p>
        <p>
          No. RDAP reflects the domain's current state only. A claim resolved
          today reflects today's registry data, not whatever it showed at
          some earlier date.
        </p>
      </>
    ),
  },
];

export default function Docs() {
  return (
    <section className="mx-auto max-w-3xl px-6 py-14 md:py-20">
      <p className="font-mono text-xs uppercase tracking-wide text-registry mb-4">reference</p>
      <h1 className="font-display text-3xl md:text-4xl font-semibold text-ink mb-10">Docs</h1>

      <div className="space-y-3">
        {SECTIONS.map((s, i) => (
          <details
            key={s.id}
            open={i === 0}
            className="group rounded-sm border border-file-line bg-white"
          >
            <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-medium text-ink list-none">
              {s.title}
              <span className="text-file transition-transform group-open:rotate-45">+</span>
            </summary>
            <div className="border-t border-file-line px-5 py-4 text-sm text-ink-soft leading-relaxed space-y-3">
              {s.body}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
