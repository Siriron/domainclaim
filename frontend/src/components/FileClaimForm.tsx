import { useState } from 'react';
import RdapTrace from './RdapTrace';
import { useGenLayer } from '../hooks/useGenLayer';
import { EXPLORER_TX_URL } from '../config/chains';

type Phase = 'idle' | 'filing' | 'resolving' | 'done' | 'error';

interface Outcome {
  kind: 'judged' | 'void';
  verdict?: string;
  voidReason?: string;
  registrantSignal?: string;
  confidenceBps?: number;
  reasoningSummary?: string;
}

export default function FileClaimForm({ onFiled }: { onFiled?: (claimId: number) => void }) {
  const { account, connect, connecting, writeContract, readContract, methods } = useGenLayer();

  const [domain, setDomain] = useState('');
  const [claimedIdentity, setClaimedIdentity] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [claimId, setClaimId] = useState<number | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fileTxHash, setFileTxHash] = useState<string | null>(null);
  const [resolveTxHash, setResolveTxHash] = useState<string | null>(null);

  const canSubmit = domain.trim().length > 0 && claimedIdentity.trim().length > 0;

  async function handleSubmit(e: React.FormEvent) {
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

      setPhase('resolving');
      const { hash: rHash } = await writeContract(methods.resolveClaim, [filedId]);
      setResolveTxHash(rHash);

      const claim = await readContract(methods.getClaim, [filedId]);

      if (claim.outcome === 'void') {
        setOutcome({ kind: 'void', voidReason: claim.void_reason_code });
      } else {
        setOutcome({
          kind: 'judged',
          verdict: claim.verdict,
          registrantSignal: claim.registrant_signal,
          confidenceBps: Number(claim.confidence_bps),
          reasoningSummary: claim.reasoning_summary,
        });
      }
      setPhase('done');
    } catch (err: any) {
      setError(err?.message || 'The claim could not be filed or resolved.');
      setPhase('error');
    }
  }

  function reset() {
    setDomain('');
    setClaimedIdentity('');
    setPhase('idle');
    setClaimId(null);
    setOutcome(null);
    setError(null);
    setFileTxHash(null);
    setResolveTxHash(null);
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={handleSubmit} className="space-y-5">
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
            disabled={phase === 'filing' || phase === 'resolving'}
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
            disabled={phase === 'filing' || phase === 'resolving'}
            className="w-full rounded-sm border border-file-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-file/60 focus:border-registry disabled:opacity-60"
          />
          <p className="mt-1.5 text-xs text-file">
            Checked against RDAP directly. Nothing you enter here is treated as evidence.
          </p>
        </div>

        {phase === 'done' ? (
          <button
            type="button"
            onClick={reset}
            className="w-full rounded-sm bg-ink px-4 py-3 text-sm font-medium text-paper hover:bg-ink-soft transition-colors"
          >
            File another claim
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSubmit || phase === 'filing' || phase === 'resolving' || connecting}
            className="w-full rounded-sm bg-registry px-4 py-3 text-sm font-medium text-paper hover:bg-registry-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {connecting
              ? 'Connecting wallet…'
              : phase === 'filing'
              ? 'Filing claim…'
              : phase === 'resolving'
              ? 'Resolving against RDAP — this can take a few minutes…'
              : !account
              ? 'Connect wallet and file claim'
              : 'File claim'}
          </button>
        )}

        {(phase === 'filing' || phase === 'resolving') && (
          <p className="text-xs text-file">
            Consensus genuinely takes real minutes, especially while the validator
            quorum reads the RDAP record. Leave this open.
          </p>
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
                <a
                  href={EXPLORER_TX_URL(fileTxHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-file-line hover:text-registry"
                >
                  file_claim transaction ↗
                </a>
              </p>
            )}
            {resolveTxHash && (
              <p>
                <a
                  href={EXPLORER_TX_URL(resolveTxHash)}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-file-line hover:text-registry"
                >
                  resolve_claim transaction ↗
                </a>
              </p>
            )}
          </div>
        )}
      </form>

      <RdapTrace
        domain={domain}
        active={phase === 'filing' || phase === 'resolving' || phase === 'done'}
        outcome={outcome}
      />
    </div>
  );
}
