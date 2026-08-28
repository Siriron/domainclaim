import { useEffect, useState } from 'react';

type TraceStage = 'idle' | 'bootstrap' | 'registry' | 'entities' | 'dns' | 'done';

interface RdapTraceProps {
  domain: string;
  active: boolean;
  outcome?: {
    kind: 'judged' | 'void';
    verdict?: string;
    voidReason?: string;
    registrantSignal?: string;
    dnsOwnershipVerified?: string;
    dnsStatus?: string;
    evidenceTruncated?: string;
    confidenceBps?: number;
    reasoningSummary?: string;
  } | null;
}

const STAGE_LABEL: Record<Exclude<TraceStage, 'idle' | 'done'>, string> = {
  bootstrap: 'resolving TLD → authoritative registry (IANA bootstrap)',
  registry: 'querying registry RDAP server',
  entities: 'reading entities[] for role: registrant',
  dns: 'checking DNS TXT for domain-control proof',
};

const VERDICT_LABEL: Record<string, string> = {
  control_confirmed: 'CONTROL CONFIRMED',
  control_disputed: 'CONTROL DISPUTED',
  registrant_unresolvable: 'REGISTRANT UNRESOLVABLE',
  ownership_unverified: 'OWNERSHIP UNVERIFIED',
};

const VERDICT_TONE: Record<string, 'good' | 'bad' | 'neutral'> = {
  control_confirmed: 'good',
  control_disputed: 'bad',
  registrant_unresolvable: 'neutral',
  ownership_unverified: 'neutral',
};

// dns_status is a genuinely three-way signal, not the same thing as a
// second copy of dns_ownership_verified — "not_verified" (checked, the
// record genuinely isn't there yet) and "check_failed" (the DNS lookup
// itself didn't get a reliable answer this attempt) look identical from
// dns_ownership_verified alone ("false" either way), but only the
// second one is worth retrying. Shown separately so a caller can tell
// the difference at a glance rather than reading dns_ownership_verified
// as if it were the whole story.
const DNS_STATUS_LABEL: Record<string, string> = {
  verified: 'verified — TXT record matched',
  not_verified: 'not verified — no matching record found',
  check_failed: 'check failed — DNS lookup unreliable, worth retrying',
};

const DNS_STATUS_TONE: Record<string, 'good' | 'bad' | 'neutral'> = {
  verified: 'good',
  not_verified: 'neutral',
  check_failed: 'bad',
};

export default function RdapTrace({ domain, active, outcome }: RdapTraceProps) {
  const [stage, setStage] = useState<TraceStage>('idle');

  useEffect(() => {
    if (!active) {
      setStage('idle');
      return;
    }
    setStage('bootstrap');
    const t1 = setTimeout(() => setStage('registry'), 800);
    const t2 = setTimeout(() => setStage('entities'), 1600);
    const t3 = setTimeout(() => setStage('dns'), 2400);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [active, domain]);

  useEffect(() => {
    if (outcome) setStage('done');
  }, [outcome]);

  const lines: { label: string; live: boolean }[] = [
    { label: `query  ${domain || '—'}`, live: stage !== 'idle' },
    { label: STAGE_LABEL.bootstrap, live: ['bootstrap', 'registry', 'entities', 'dns', 'done'].includes(stage) },
    { label: STAGE_LABEL.registry, live: ['registry', 'entities', 'dns', 'done'].includes(stage) },
    { label: STAGE_LABEL.entities, live: ['entities', 'dns', 'done'].includes(stage) },
    { label: STAGE_LABEL.dns, live: ['dns', 'done'].includes(stage) },
  ];

  const tone = outcome?.verdict ? VERDICT_TONE[outcome.verdict] : 'neutral';
  const toneClass = tone === 'good' ? 'text-registry-soft' : tone === 'bad' ? 'text-stamp-soft' : 'text-file';

  return (
    <div className="rounded-sm border border-file-line bg-ink text-paper font-mono text-sm overflow-hidden">
      <div className="flex items-center gap-2 border-b border-ink-soft bg-ink-soft/40 px-4 py-2 text-xs tracking-wide text-file">
        <span className="h-2 w-2 rounded-full bg-registry-soft" />
        rdap + dns trace
      </div>
      <div className="px-4 py-4 space-y-2 min-h-[10rem]">
        {stage === 'idle' && (
          <p className="text-file">no active query</p>
        )}
        {stage !== 'idle' &&
          lines.map((line, i) =>
            line.live ? (
              <p key={i} className="text-paper/90 animate-fade-up" style={{ animationDelay: `${i * 60}ms` }}>
                <span className="text-registry-soft">›</span> {line.label}
              </p>
            ) : null
          )}

        {stage !== 'idle' && stage !== 'done' && (
          <p className="text-file">
            <span className="animate-blink-cursor">▌</span>
          </p>
        )}

        {stage === 'done' && outcome && (
          <div className="mt-3 border-t border-ink-soft pt-3 animate-fade-up">
            {outcome.kind === 'void' ? (
              <>
                <p className="text-stamp-soft font-semibold">
                  VOID — {outcome.voidReason}
                </p>
                <p className="text-file text-xs mt-1">
                  no verdict reached; see finding below
                </p>
              </>
            ) : (
              <>
                <p className={`font-semibold ${toneClass}`}>
                  {VERDICT_LABEL[outcome.verdict || ''] || outcome.verdict}
                </p>
                <p className="text-file text-xs mt-1">
                  registrant_signal: {outcome.registrantSignal} · confidence:{' '}
                  {outcome.confidenceBps != null ? (outcome.confidenceBps / 10).toFixed(1) : '—'}%
                </p>
                {outcome.dnsStatus && (
                  <p
                    className={`text-xs mt-1 ${
                      DNS_STATUS_TONE[outcome.dnsStatus] === 'good'
                        ? 'text-registry-soft'
                        : DNS_STATUS_TONE[outcome.dnsStatus] === 'bad'
                        ? 'text-stamp-soft'
                        : 'text-file'
                    }`}
                  >
                    dns: {DNS_STATUS_LABEL[outcome.dnsStatus] || outcome.dnsStatus}
                  </p>
                )}
                {outcome.evidenceTruncated === 'true' && (
                  <p className="text-stamp-soft text-xs mt-1">
                    ⚠ RDAP evidence was truncated before this verdict was reached — treat with extra scrutiny
                  </p>
                )}
                {outcome.reasoningSummary && (
                  <p className="text-paper/70 text-xs mt-2 leading-relaxed">
                    {outcome.reasoningSummary}
                  </p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
