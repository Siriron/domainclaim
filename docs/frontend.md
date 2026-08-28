# Frontend

## Stack

React + Vite + TypeScript + Tailwind CSS, `genlayer-js` for chain access, `react-router-dom` for routing.

## Structure

```
src/
  components/
    Navbar.tsx           top nav, wallet connect state
    Footer.tsx            contract address, links
    ErrorBoundary.tsx      styled crash fallback
    RdapTrace.tsx           the signature element — live RDAP + DNS resolution trace
    FileClaimForm.tsx        two explicit steps: file (surfaces the DNS record to publish), then resolve
    ChallengePanel.tsx        look up, challenge, and resolve a claim
  pages/
    Home.tsx               hero + file form + lifecycle overview
    Challenge.tsx            wraps ChallengePanel
    Docs.tsx                 in-app documentation
    NotFound.tsx              404
  hooks/
    useGenLayer.ts           read/write client, wallet connect, ensureChain
  config/
    chains.ts                single plain contract-address constant
  lib/
    contractMethods.ts        method-name registry
```

## Design system

**Subject:** a domain registry lookup — the bureaucratic layer of internet infrastructure (IANA, ICANN, registrars, RDAP) rather than a consumer app or a courtroom docket. The signature element is the RDAP + DNS trace itself: submitting a domain shows the actual bootstrap → registry → entities → DNS-ownership-check resolution happening, ending in the real fetched result rendering, rather than a generic spinner.

**Palette:**
- `#F7F5F0` paper (background)
- `#1C2321` ink (primary text)
- `#2E5339` registry (confirmed/structural accent)
- `#B8622E` stamp (challenge/void accent)
- `#8B8578` file (metadata, secondary text)

**Type:** Fraunces (display), IBM Plex Sans (body/UI), IBM Plex Mono (data — domains, addresses, the RDAP trace itself).

## Wallet connection

Built on the confirmed-working pattern: `ensureChain()` before every write, the wallet's plain address string passed as `account` (never `createAccount()`, which expects a private key), persistent connection via a silent `eth_accounts` check on mount, and a `TimeoutError` class carrying the transaction hash so a slow-but-succeeding write never looks like a failure.

## Why filing and resolving are two explicit steps

An earlier version fired `file_claim` then `resolve_claim` automatically, back to back. Once `resolve_claim` could also depend on a DNS record the caller needs time to go publish, auto-resolving immediately would produce `ownership_unverified` for nearly every caller regardless of intent — simply because they hadn't had a chance to act between the two calls. `FileClaimForm.tsx` now surfaces the DNS TXT record instructions immediately after filing and waits for an explicit "Resolve claim" click, giving the caller a real window to publish the record first if they want to.

## Second review-cycle fields: `dns_status` and `evidence_truncated`

Added when the contract was fixed in response to a steward's "More Information Needed" note (Aug 26 2026, `LESSONS.md` Part 8). Both `RdapTrace.tsx`, `FileClaimForm.tsx`, and `ChallengePanel.tsx` were updated to surface them — not just the contract.

- **`dns_status`** (`verified` / `not_verified` / `check_failed`) is shown alongside `dns_ownership_verified` everywhere the latter appears, never in place of it — the two answer different questions (`dns_ownership_verified` is the boolean the verdict actually gates on; `dns_status` explains *why* it's false when it is, which matters because only one of the two "false" causes is worth retrying). `FileClaimForm.tsx` renders a specific follow-up sentence keyed off `dns_status` (`DNS_STATUS_FOLLOWUP`) so a caller who lands on `ownership_unverified` knows whether to wait for propagation or just resolve again.
- **`evidence_truncated`** is rendered as an explicit warning line, not folded quietly into the verdict display, wherever a verdict or challenge resolution is shown — a truncated-evidence verdict is still a real, consensus-reached result, but it deserves visibly more scrutiny than one reached against a complete record.
- **`ChallengePanel.tsx` shows the challenge round's own re-derived `dns_ownership_verified`/`dns_status`/`evidence_truncated`**, distinct from the underlying claim's fields. This is deliberate: the claim's own fields only update on `OVERTURN` (an `UPHOLD`/`REJECT` correctly leaves the original resolution's stored facts untouched), which meant before this fix there was no way to see what a specific challenge round's re-check actually found on the far more common `UPHOLD`/`REJECT` outcomes. `get_challenge` now returns these three fields unconditionally for exactly this reason (see `docs/contracts.md`).

None of this frontend work has been run through a real build (`npm install && npm run build`) or live-tested against the redeployed contract — see `docs/deployment.md`'s testing-status section. What was checked instead, since no network/build tooling is available in the environment this fix was written in: brace/paren balance per touched file, a JSX-in-`.ts` sweep, and a manual cross-check that every prop/field referenced in the updated JSX has a corresponding source (either the raw `readContract` response or a locally-defined type). This confirms the code is structurally sound, not that it compiles or renders correctly — run a real `npm run build` before deploying.
