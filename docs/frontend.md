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
    RdapTrace.tsx           the signature element — live RDAP resolution trace
    FileClaimForm.tsx        file + resolve, combined into one flow
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

**Subject:** a domain registry lookup — the bureaucratic layer of internet infrastructure (IANA, ICANN, registrars, RDAP) rather than a consumer app or a courtroom docket. The signature element is the RDAP trace itself: submitting a domain shows the actual bootstrap → registry → entities resolution happening, ending in the real fetched record rendering, rather than a generic spinner.

**Palette:**
- `#F7F5F0` paper (background)
- `#1C2321` ink (primary text)
- `#2E5339` registry (confirmed/structural accent)
- `#B8622E` stamp (challenge/void accent)
- `#8B8578` file (metadata, secondary text)

**Type:** Fraunces (display), IBM Plex Sans (body/UI), IBM Plex Mono (data — domains, addresses, the RDAP trace itself).

## Wallet connection

Built on the confirmed-working pattern: `ensureChain()` before every write, the wallet's plain address string passed as `account` (never `createAccount()`, which expects a private key), persistent connection via a silent `eth_accounts` check on mount, and a `TimeoutError` class carrying the transaction hash so a slow-but-succeeding write never looks like a failure.
