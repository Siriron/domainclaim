import { useState } from 'react';
import RdapTrace from './RdapTrace';
import { useGenLayer } from '../hooks/useGenLayer';
import { EXPLORER_TX_URL } from '../config/chains';

type Phase = 'idle' | 'filing' | 'filed' | 'resolving' | 'done' | 'error';

interface Outcome {
  kind: 'judged' | 'void';
  verdict?: string;
  voidReason?: string;
  registrantSignal?: string;
  dnsOwnershipVerified?: string;
  confidenceBps?: number;
  reasoningSummary?: string;
}

interface OwnershipProof {
  recordType: string;
  recordName: string;
  recordValue: string;
}

const VERDICT_COPY: Record<string, { label: string; tone: 'good' | 'bad' | 'neutral' }> = {
  control_confirmed: { label: 'Control confirmed — RDAP identity match and DNS ownership both verified.', tone: 'good' },
  control_disputed: { label: 'Control disputed — RDAP shows a different, specific registrant.', tone: 'bad' },
  registrant_unresolvable: { label: 'Registrant unresolvable — RDAP discloses no identifying registrant data.', tone: 'neutral' },
  ownership_unverified: { label: 'Ownership unverified — RDAP identity matched, but domain control was never proven.', tone: 'neutral' },
};

export default function FileClaimForm({ onFiled }: { onFiled?: (claimId: number) => void }) {
  const { account, connect, connecting, writeContract, readContract, methods } = useGenLayer();

  const [domain, setDomain] = useState('');
  const [claimedIdentity, setClaimedIdentity] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [claimId, setClaimId] = useState<number | null>(null);
  const [proof, setProof] = useState<OwnershipProof | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileTxHash, setFileTxHash] = useState<string | null>(null);
  const [resolveTxHash, setResolveTxHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const canSubmit = domain.trim().length > 0 && claimedIdentity.trim().length > 0;

  async function handleFile(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOutcome(null);

    if (!account) {
      try {
        await connect();
      } catch (err: any) {
        setError(err?.message || 'Could not connect a wallet.');
        return;
      }
    }

    setPhase('filing');
    try {
      const { hash: fHash } = await writeContract(methods.fileClaim, [
        domain.trim(),
        claimedIdentity.trim(),
      ]);
      setFileTxHash(fHash);

      const nextIdResult = await readContract(methods.getNextClaimId);
      const filedId = Number(nextIdResult.next_claim_id) - 1;
      setClaimId(filedId);
      onFiled?.(filedId);

      const verifyInfo = await readContract(methods.getVerificationInstructions, [filedId]);
      setProof({
        recordType: verifyInfo.record_type,
        recordName: verifyInfo.record_name,
        recordValue: verifyInfo.record_value,
      });

      setPhase('filed');
    } catch (err: any) {
      setError(err?.message || 'The claim could not be filed.');
      setPhase('error');
    }
  }

  async function handleResolve() {
    if (claimId === null) return;
    setError(null);
    setPhase('resolving');
    try {
      const { hash: rHash } = await writeContract(methods.resolveClaim, [claimId]);
      setResolveTxHash(rHash);

      const claim = await readContract(methods.getClaim, [claimId]);

      if (claim.outcome === 'void') {
        setOutcome({ kind: 'void', voidReason: claim.void_reason_code });
      } else {
        setOutcome({
          kind: 'judged',
          verdict: claim.verdict,
          registrantSignal: claim.registrant_signal,
          dnsOwnershipVerified: claim.dns_ownership_verified,
          confidenceBps: Number(claim.confidence_bps),
          reasoningSummary: claim.reasoning_summary,
        });
      }
      setPhase('done');
    } catch (err: any) {
      setError(err?.message || 'The claim could not be resolved.');
      setPhase('error');
    }
  }

  function copyValue() {
    if (!proof) return;
    navigator.clipboard.writeText(proof.recordValue).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }

  function reset() {
    setDomain('');
    setClaimedIdentity('');
    setPhase('idle');
    setClaimId(null);
    setProof(null);
    setOutcome(null);
    setError(null);
    setFileTxHash(null);
    setResolveTxHash(null);
  }

  const verdictCopy = outcome?.verdict ? VERDICT_COPY[outcome.verdict] : null;

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="space-y-5">
        {(phase === 'idle' || phase === 'filing') && (
          <form onSubmit={handleFile} className="space-y-5">
            <div>
              <label htmlFor="domain" className="block text-xs uppercase tracking-wide text-file mb-1.5">
                Domain
              </label>
              <input
                id="domain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="example.com"
                disabled={phase === 'filing'}
                className="w-full rounded-sm border border-file-line bg-white px-3.5 py-2.5 font-mono text-sm text-ink placeholder:text-file/60 focus:border-registry disabled:opacity-60"
              />
            </div>

            <div>
              <label htmlFor="identity" className="block text-xs uppercase tracking-wide text-file mb-1.5">
                Claimed registrant identity
              </label>
              <input
                id="identity"
                type="text"
                value={claimedIdentity}
                onChange={(e) => setClaimedIdentity(e.target.value)}
                placeholder="Name, organization, or email"
                disabled={phase === 'filing'}
                className="w-full rounded-sm border border-file-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-file/60 focus:border-registry disabled:opacity-60"
              />
              <p className="mt-1.5 text-xs text-file">
                Checked against RDAP directly. Nothing you enter here is treated as evidence.
              </p>
            </div>

            <button
              type="submit"
              disabled={!canSubmit || phase === 'filing' || connecting}
              className="w-full rounded-sm bg-registry px-4 py-3 text-sm font-medium text-paper hover:bg-registry-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connecting ? 'Connecting wallet…' : phase === 'filing' ? 'Filing claim…' : !account ? 'Connect wallet and file claim' : 'File claim'}
            </button>
          </form>
        )}

        {(phase === 'filed' || phase === 'resolving' || (phase === 'done' && proof)) && proof && (
          <div className="space-y-4">
            <div className="rounded-sm border border-file-line bg-white p-5">
              <p className="text-xs uppercase tracking-wide text-file mb-3">
                Optional — prove domain control
              </p>
              <p className="text-sm text-ink-soft leading-relaxed mb-4">
                To reach <span className="font-medium text-registry">control_confirmed</span> rather
                than <span className="font-medium text-stamp">ownership_unverified</span>, publish this
                as a DNS TXT record before resolving. This step can be skipped — resolving without it
                still gets an honest verdict, capped at ownership_unverified.
              </p>
              <div className="space-y-2 font-mono text-xs">
                <div>
                  <p className="text-file mb-1">record name</p>
                  <p className="text-ink bg-paper-dim px-2.5 py-2 rounded-sm break-all">{proof.recordName}</p>
                </div>
                <div>
                  <p className="text-file mb-1">record value</p>
                  <div className="flex gap-2">
                    <p className="flex-1 text-ink bg-paper-dim px-2.5 py-2 rounded-sm break-all">{proof.recordValue}</p>
                    <button
                      onClick={copyValue}
                      type="button"
                      className="shrink-0 rounded-sm border border-file-line px-3 text-ink hover:bg-paper-dim transition-colors"
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>
              <p className="mt-3 text-xs text-file">
                DNS propagation can take time after publishing. If resolving right after publishing
                shows ownership_unverified, the record may not have propagated yet — try again shortly.
              </p>
            </div>

            <button
              onClick={handleResolve}
              disabled={phase === 'resolving'}
              className="w-full rounded-sm bg-registry px-4 py-3 text-sm font-medium text-paper hover:bg-registry-soft transition-colors disabled:opacity-50"
            >
              {phase === 'resolving' ? 'Resolving against RDAP and DNS — this can take a few minutes…' : 'Resolve claim'}
            </button>
          </div>
        )}

        {phase === 'resolving' && (
          <p className="text-xs text-file">
            Consensus genuinely takes real minutes, especially while the validator
            quorum reads the RDAP record and checks DNS. Leave this open.
          </p>
        )}

        {phase === 'done' && outcome && (
          <div className="rounded-sm border-2 border-ink bg-white p-5 space-y-2">
            {verdictCopy && (
              <p
                className={
                  'text-sm font-medium ' +
                  (verdictCopy.tone === 'good' ? 'text-registry' : verdictCopy.tone === 'bad' ? 'text-stamp' : 'text-ink-soft')
                }
              >
                {verdictCopy.label}
              </p>
            )}
            <button
              type="button"
              onClick={reset}
              className="mt-2 rounded-sm bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft transition-colors"
            >
              File another claim
            </button>
          </div>
        )}

        {error && (
          <div className="rounded-sm border border-stamp/40 bg-stamp/5 px-3.5 py-2.5 text-sm text-stamp">
            {error}
          </div>
        )}

        {claimId !== null && (
          <div className="text-xs text-file space-y-1">
            <p>Claim #{claimId}</p>
            {fileTxHash && (
              <p>
                <a href={EXPLORER_TX_URL(fileTxHash)} target="_blank" rel="noreferrer" className="underline decoration-file-line hover:text-registry">
                  file_claim transaction ↗
                </a>
              </p>
            )}
            {resolveTxHash && (
              <p>
                <a href={EXPLORER_TX_URL(resolveTxHash)} target="_blank" rel="noreferrer" className="underline decoration-file-line hover:text-registry">
                  resolve_claim transaction ↗
                </a>
              </p>
            )}
          </div>
        )}
      </div>

      <RdapTrace
        domain={domain}
        active={phase === 'resolving' || phase === 'done'}
        outcome={outcome}
      />
    </div>
  );
}
