<div align="center">

<img src="./docs/assets/favicon.svg" width="88" alt="DomainClaim logo" />

# DomainClaim

### Domain-control attestation judged against RDAP alone — the contract fetches the live registry record itself, never a submitted URL or screenshot.

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

DomainClaim is an on-chain attestation of who controls a domain, judged entirely against RDAP — the IETF/ICANN-standardized successor to WHOIS. A caller names a domain and an identity they claim matches the registrant; the contract fetches the live RDAP record itself, and a validator quorum judges whether the record genuinely supports the claim. Nobody supplies evidence directly.

<br />

<div align="center">

| | |
|---|---|
| **Concept** | Single-party domain-registrant attestation |
| **Consensus need** | A claimant asserting control benefits from a false CONTROL_CONFIRMED verdict; a domain's actual registrant, or anyone contesting a bogus claim, benefits from a false verdict the other way |
| **Evidence source** | RDAP, resolved via IANA's own bootstrap registry and fetched fresh — never a URL or screenshot the caller supplies |
| **Networks** | StudioNet |

</div>

<br />

---

## How it works

1. **file_claim** — a domain and a claimed registrant identity are recorded on-chain, after deterministic syntax validation.
2. **resolve_claim** — the domain's authoritative RDAP server is resolved via IANA's bootstrap file, the live record is fetched, and a leader/validator quorum independently judges whether a genuine registrant-role entity supports the claim.
3. **challenge_claim** — anyone may contest a resolved verdict within a 7-day window.
4. **resolve_challenge** — a second, fully independent consensus round re-fetches RDAP fresh (never the original claim's stored content) and can uphold, overturn, or reject the challenge.
5. **finalize_claim** — locks the terminal state once the window closes uncontested, or once an open challenge resolves.

<br />

<details>
<summary><b>The three-way verdict, and the separate void outcome</b></summary>
<br />

A resolved claim lands in one of two structurally distinct shapes:

- **judged** — a real verdict: `control_confirmed`, `control_disputed`, or `registrant_unresolvable` if RDAP genuinely contains no identifying registrant data. This last case is expected to be the common one, not a rare edge case — most consumer domain registrations use privacy proxies by default, and live testing has confirmed this on real domains.
- **void** — no verdict was reached at all. A permanent void (an invalid domain, or one that doesn't exist as an RDAP object) blocks the same domain+identity pair from ever being refiled. A transient void (a bootstrap or fetch failure) can be retried.

Both outcomes go through full validator consensus — a void outcome is never a silent, one-node revert; it's an agreed-upon, on-chain fact, the same as a real verdict.

</details>

<br />

---

## Deployed contracts

<div align="center">

| Network | Address | Explorer |
|---|---|---|
| StudioNet | `0x4A2f5830676b1Fea8A8873Ad4daa75c2CaCD7477` | [View](https://explorer-studio.genlayer.com/address/0x4A2f5830676b1Fea8A8873Ad4daa75c2CaCD7477) |

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
LICENSE                      MIT
```

<br />

---

## Status

<div align="center">

![Tested](https://img.shields.io/badge/full%20lifecycle%20on%20StudioNet-tested-brightgreen?style=flat-square)
![Untested](https://img.shields.io/badge/unchallenged%20finalize%20path-untested-yellow?style=flat-square)

</div>

Every method in the lifecycle — `file_claim`, `resolve_claim`, `challenge_claim`, `resolve_challenge`, `finalize_claim` — has been run live against the deployed StudioNet contract with empty stderr and zero validator disagreement, including one full challenge round that resolved `REJECT` with the original verdict correctly held. Two real domains (`google.com`, `duckduckgo.com`) both resolved to `registrant_unresolvable` at high confidence, confirming the design's own prediction that this is the common case for this evidence source. **Not yet tested:** the unchallenged `finalize_claim` path, since it requires the real 7-day challenge window to elapse — and no domain with a genuinely disclosed, non-proxied registrant has been observed yet, so `control_confirmed`/`control_disputed` remain unexercised against live RDAP data. The frontend has not yet been deployed to a live URL.

<br />

---

<div align="center">

Built on [GenLayer](https://genlayer.com) · [Portal submission](https://portal.genlayer.foundation/)

</div>
