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
