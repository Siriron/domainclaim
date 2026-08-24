import { useState } from 'react';
import { useGenLayer } from '../hooks/useGenLayer';
import { EXPLORER_TX_URL } from '../config/chains';

const REASON_CODES = [
  { value: 'RDAP_STATE_CHANGED', label: 'RDAP state changed since resolution' },
  { value: 'MISJUDGED_EXISTING_DATA', label: 'Original judgment misread the fetched data' },
  { value: 'OTHER', label: 'Other' },
];

type Step = 'lookup' | 'found' | 'challenging' | 'resolving' | 'resolved' | 'error';

export default function ChallengePanel() {
  const { account, connect, connecting, writeContract, readContract, methods } = useGenLayer();

  const [claimIdInput, setClaimIdInput] = useState('');
  const [claim, setClaim] = useState<any | null>(null);
  const [reasonCode, setReasonCode] = useState(REASON_CODES[1].value);
  const [statement, setStatement] = useState('');
  const [step, setStep] = useState<Step>('lookup');
  const [error, setError] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<number | null>(null);
  const [resolution, setResolution] = useState<any | null>(null);
  const [challengeTx, setChallengeTx] = useState<string | null>(null);
  const [resolveTx, setResolveTx] = useState<string | null>(null);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setClaim(null);
    const id = Number(claimIdInput);
    if (!Number.isInteger(id) || id <= 0) {
      setError('Enter a valid claim number.');
      return;
    }
    try {
      const result = await readContract(methods.getClaim, [id]);
      setClaim(result);
      setStep('found');
    } catch (err: any) {
      setError('No claim found with that number.');
    }
  }

  async function handleChallenge(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!account) {
      try {
        await connect();
      } catch (err: any) {
        setError(err?.message || 'Could not connect a wallet.');
        return;
      }
    }

    if (statement.trim().length === 0) {
      setError('A challenge needs a statement explaining the objection.');
      return;
    }

    setStep('challenging');
    try {
      const claimId = Number(claim.claim_id);
      const { hash: cHash } = await writeContract(methods.challengeClaim, [
        claimId,
        reasonCode,
        statement.trim(),
      ]);
      setChallengeTx(cHash);

      const nextChId = await readContract(methods.getNextChallengeId);
      const chId = Number(nextChId.next_challenge_id) - 1;
      setChallengeId(chId);

      setStep('resolving');
      const { hash: rHash } = await writeContract(methods.resolveChallenge, [chId]);
      setResolveTx(rHash);

      const challengeResult = await readContract(methods.getChallenge, [chId]);
      setResolution(challengeResult);
      setStep('resolved');
    } catch (err: any) {
      setError(err?.message || 'The challenge could not be filed or resolved.');
      setStep('error');
    }
  }

  function reset() {
    setClaimIdInput('');
    setClaim(null);
    setStatement('');
    setStep('lookup');
    setError(null);
    setChallengeId(null);
    setResolution(null);
    setChallengeTx(null);
    setResolveTx(null);
  }

  const canChallenge = claim && claim.status === 'resolved_pending';

  return (
    <div className="space-y-6">
      {step === 'lookup' && (
        <form onSubmit={handleLookup} className="flex gap-3">
          <input
            type="text"
            inputMode="numeric"
            value={claimIdInput}
            onChange={(e) => setClaimIdInput(e.target.value)}
            placeholder="Claim number"
            className="flex-1 rounded-sm border border-file-line bg-white px-3.5 py-2.5 font-mono text-sm text-ink placeholder:text-file/60 focus:border-registry"
          />
          <button
            type="submit"
            className="rounded-sm bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft transition-colors"
          >
            Look up
          </button>
        </form>
      )}

      {error && step !== 'resolved' && (
        <div className="rounded-sm border border-stamp/40 bg-stamp/5 px-3.5 py-2.5 text-sm text-stamp">
          {error}
        </div>
      )}

      {claim && (
        <div className="rounded-sm border border-file-line bg-white p-5 space-y-2">
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm text-ink">{claim.domain}</p>
            <span className="text-xs uppercase tracking-wide text-file">
              claim #{claim.claim_id}
            </span>
          </div>
          <div className="field-divider" />
          <p className="text-sm text-ink-soft">
            <span className="text-file">claimed:</span> {claim.claimed_identity}
          </p>
          <p className="text-sm">
            <span className="text-file">status:</span>{' '}
            <span className="font-medium">{claim.status}</span>
          </p>
          {claim.outcome === 'judged' && (
            <p className="text-sm">
              <span className="text-file">verdict:</span>{' '}
              <span className="font-medium">{claim.verdict}</span>
            </p>
          )}
          {claim.outcome === 'void' && (
            <p className="text-sm">
              <span className="text-file">void reason:</span>{' '}
              <span className="font-medium">{claim.void_reason_code}</span>
            </p>
          )}

          {!canChallenge && step === 'found' && (
            <p className="mt-2 text-xs text-stamp">
              {claim.status === 'challenged'
                ? 'This claim already has an open challenge.'
                : claim.status === 'finalized'
                ? 'This claim is finalized and can no longer be challenged.'
                : 'This claim has not resolved yet — nothing to challenge.'}
            </p>
          )}
        </div>
      )}

      {canChallenge && (step === 'found' || step === 'challenging' || step === 'resolving') && (
        <form onSubmit={handleChallenge} className="space-y-4">
          <div>
            <label htmlFor="reason" className="block text-xs uppercase tracking-wide text-file mb-1.5">
              Reason
            </label>
            <select
              id="reason"
              value={reasonCode}
              onChange={(e) => setReasonCode(e.target.value)}
              disabled={step !== 'found'}
              className="w-full rounded-sm border border-file-line bg-white px-3.5 py-2.5 text-sm text-ink focus:border-registry disabled:opacity-60"
            >
              {REASON_CODES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="statement" className="block text-xs uppercase tracking-wide text-file mb-1.5">
              Statement
            </label>
            <textarea
              id="statement"
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              disabled={step !== 'found'}
              rows={4}
              placeholder="Explain specifically what the re-fetched record should show, or why the original judgment was wrong."
              className="w-full rounded-sm border border-file-line bg-white px-3.5 py-2.5 text-sm text-ink placeholder:text-file/60 focus:border-registry disabled:opacity-60"
            />
          </div>

          <button
            type="submit"
            disabled={step !== 'found' || connecting}
            className="w-full rounded-sm bg-stamp px-4 py-3 text-sm font-medium text-paper hover:bg-stamp-soft transition-colors disabled:opacity-50"
          >
            {connecting
              ? 'Connecting wallet…'
              : step === 'challenging'
              ? 'Opening challenge…'
              : step === 'resolving'
              ? 'Re-fetching RDAP and re-judging — this can take a few minutes…'
              : !account
              ? 'Connect wallet and open challenge'
              : 'Open challenge'}
          </button>

          {(step === 'challenging' || step === 'resolving') && (
            <p className="text-xs text-file">
              This runs a second, fully independent consensus round against a
              fresh RDAP fetch — not the original claim's stored result.
            </p>
          )}
        </form>
      )}

      {step === 'resolved' && resolution && (
        <div className="animate-stamp-in rounded-sm border-2 border-ink bg-white p-6 space-y-3">
          <p
            className={
              'text-lg font-display font-semibold ' +
              (resolution.decision === 'OVERTURN' ? 'text-stamp' : 'text-registry')
            }
          >
            {resolution.decision}
          </p>
          <div className="field-divider" />
          <p className="text-sm">
            <span className="text-file">final verdict:</span>{' '}
            <span className="font-medium">{resolution.final_verdict}</span>
          </p>
          {resolution.resolution_summary && (
            <p className="text-sm text-ink-soft leading-relaxed">{resolution.resolution_summary}</p>
          )}
          <div className="pt-2 space-y-1 text-xs text-file">
            {challengeTx && (
              <p>
                <a href={EXPLORER_TX_URL(challengeTx)} target="_blank" rel="noreferrer" className="underline decoration-file-line hover:text-registry">
                  challenge_claim transaction ↗
                </a>
              </p>
            )}
            {resolveTx && (
              <p>
                <a href={EXPLORER_TX_URL(resolveTx)} target="_blank" rel="noreferrer" className="underline decoration-file-line hover:text-registry">
                  resolve_challenge transaction ↗
                </a>
              </p>
            )}
          </div>
          <button
            onClick={reset}
            className="mt-2 rounded-sm bg-ink px-4 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft transition-colors"
          >
            Look up another claim
          </button>
        </div>
      )}

      {step === 'found' && (
        <button
          onClick={reset}
          className="text-xs text-file underline decoration-file-line hover:text-registry"
        >
          Look up a different claim
        </button>
      )}
    </div>
  );
}
