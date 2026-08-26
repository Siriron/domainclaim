<div align="center">

<img src="./docs/assets/favicon.svg" width="88" alt="DomainClaim logo" />

# DomainClaim

### Domain-control attestation, bound to RDAP identity AND live DNS ownership proof — never text alone.

<br />

![Status](https://img.shields.io/badge/status-building-yellow?style=flat-square)
![Networks](https://img.shields.io/badge/networks-StudioNet-blue?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-lightgrey?style=flat-square)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Vite%20%2B%20GenVM-2E5339?style=flat-square)

<br />

**[Documentation](./docs/architecture.md)** &nbsp;·&nbsp; **[Smart Contract](./contracts/domain_claim.py)** &nbsp;·&nbsp; **[Build lessons](./LESSONS.md)**

</div>

<br />

---

## What this is

DomainClaim is an on-chain attestation of who controls a domain. A caller names a domain and an identity they claim matches the registrant; the contract fetches the live RDAP record itself and judges whether the record genuinely supports the claim — and, independently, checks whether the caller has published a specific DNS TXT record proving they actually control the domain, not merely that they know the right identity string. Nobody supplies evidence directly, and control is never granted on identity-text agreement alone.

**This design was revised after a real portal rejection** (Aug 24 2026): an earlier version reached `control_confirmed` from RDAP-text matching alone, which the reviewer correctly identified as never proving the filer controls the domain. See [`LESSONS.md`](./LESSONS.md) Part 7 for the full account of the rejection and the fix.

<br />

<div align="center">

| | |
|---|---|
| **Concept** | Single-party domain-control attestation, bound to the specific caller via DNS proof |
| **Consensus need** | A claimant asserting control benefits from a false CONTROL_CONFIRMED verdict; a domain's actual registrant, or anyone contesting a bogus claim, benefits from a false verdict the other way |
| **Evidence source** | RDAP (identity) + live DNS TXT lookup (ownership proof) — never a URL, screenshot, or identity string alone |
| **Networks** | StudioNet |

</div>

<br />

---

## How it works

1. **file_claim** — a domain and a claimed registrant identity are recorded on-chain, after deterministic syntax validation. Returns a unique DNS TXT record (name + value) the caller can optionally publish as proof of domain control.
2. **resolve_claim** — the domain's authoritative RDAP server is resolved via IANA's bootstrap file, the live record is fetched, live DNS is checked for the verification token, and a leader/validator quorum independently judges identity support — combined deterministically with whether ownership was actually proven.
3. **challenge_claim** — anyone may contest a resolved verdict within a 7-day window.
4. **resolve_challenge** — a second, fully independent consensus round re-fetches RDAP AND re-checks DNS fresh (never the original claim's stored content) and can uphold, overturn, or reject the challenge.
5. **finalize_claim** — locks the terminal state once the window closes uncontested, or once an open challenge resolves.

<br />

<details>
<summary><b>The four-way verdict, and the separate void outcome</b></summary>
<br />

A resolved claim lands in one of two structurally distinct shapes:

- **judged** — a real verdict: `control_confirmed` (RDAP identity match AND DNS ownership both verified), `ownership_unverified` (RDAP identity matched, but domain control was never proven), `control_disputed` (RDAP shows a different, specific registrant), or `registrant_unresolvable` if RDAP genuinely contains no identifying registrant data. This last case is expected to be the common one, not a rare edge case — most consumer domain registrations use privacy proxies by default, and live testing confirmed this on real domains. Publishing the DNS record is always optional: a claim resolved without it still gets an honest verdict, capped at `ownership_unverified` rather than reaching `control_confirmed`.
- **void** — no verdict was reached at all. A permanent void (an invalid domain, or one that doesn't exist as an RDAP object) blocks the same domain+identity pair from ever being refiled. A transient void (a bootstrap or fetch failure) can be retried.

Both outcomes go through full validator consensus — a void outcome is never a silent, one-node revert; it's an agreed-upon, on-chain fact, the same as a real verdict. The verdict assignment between `control_confirmed` and `ownership_unverified` is fully deterministic, never left to LLM discretion — see [`docs/contracts.md`](./docs/contracts.md) for the mechanism.

</details>

<br />

---

## Deployed contracts

<div align="center">

| Network | Address | Explorer |
|---|---|---|
| StudioNet | `0xcaF89d9eB7De0aA4532C070332419Cb1a886f9F3` | [View](https://explorer-studio.genlayer.com/address/0xcaF89d9eB7De0aA4532C070332419Cb1a886f9F3) |

</div>

<br />

---

## Quick start

```bash
cd frontend
npm install
npm run dev
```

Full deployment instructions: [`docs/deployment.md`](./docs/deployment.md)

<br />

---

## Project structure

```
contracts/domain_claim.py    The GenVM contract
frontend/                    React + Vite app
docs/                        architecture.md, deployment.md, contracts.md, frontend.md
LESSONS.md                   Build history, including a real portal rejection and its fix
LICENSE                      MIT
```

<br />

---

## Status

<div align="center">

![Tested](https://img.shields.io/badge/prior%20version%27s%20lifecycle-live%20tested-brightgreen?style=flat-square)
![Untested](https://img.shields.io/badge/dns%20ownership%20mechanism-not%20yet%20live%20tested-yellow?style=flat-square)

</div>

**This version has not yet been live-tested end to end** — it was rebuilt in direct response to the Aug 24 2026 portal rejection and audited fully (syntax, the ten-item nondet catalog, cross-file consistency checks) but not yet exercised against real infrastructure. A prior version of this contract's core lifecycle (`file_claim`, `resolve_claim`, `challenge_claim`, `resolve_challenge`, `finalize_claim`) was live-verified on StudioNet with empty stderr throughout, including a real challenge round — but that testing predates the DNS ownership-proof mechanism this version adds, and none of it exercised the new `ownership_unverified` verdict or the DNS re-verification path specifically. **Not yet tested at all:** the DNS TXT verification flow end to end (publish a record, confirm `control_confirmed` is reached only with it, confirm `ownership_unverified` without it), the unchallenged `finalize_claim` path, and `control_disputed` against a real conflicting RDAP record. See [`docs/deployment.md`](./docs/deployment.md) for the complete, itemized testing status. The frontend has not yet been deployed to a live URL.

<br />

---

<div align="center">

Built on [GenLayer](https://genlayer.com) · [Portal submission](https://portal.genlayer.foundation/)

</div>
