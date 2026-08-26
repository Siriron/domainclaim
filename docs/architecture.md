# Architecture

## Overview

DomainClaim has two layers that stay deliberately separate: a GenVM contract that fetches and judges evidence, and a frontend that only submits domains and reads back whatever the contract already decided. The frontend never fetches or interprets RDAP or DNS data itself — every fact behind a verdict is resolved entirely on-chain.

## Evidence resolution — two independent signals, combined deterministically

**Identity (RDAP):**
1. A domain's TLD is extracted deterministically in the contract's plain (non-nondet) code.
2. Inside the nondet block, `_resolve_rdap_base_url` fetches IANA's own bootstrap registry file (`https://data.iana.org/rdap/dns.json`) and resolves the authoritative RDAP server URL for that TLD — a static, non-redirecting file, chosen deliberately over `rdap.org`'s redirect-based bootstrap, whose redirect-following behavior under `gl.nondet.web.get()` was never independently confirmed.
3. The resolved server is queried directly for the domain's RDAP record.
4. The record's `entities` array is reasoned over by an LLM prompt that judges whether a genuine registrant-role entity exists and, if so, whether it supports the caller's claimed identity.

**Ownership (DNS):**
1. `file_claim` deterministically derives a unique verification token from the claim id and the submitter's address (`_generate_verification_token`) — no randomness, no storage read, so every validator can independently re-derive the identical expected value.
2. `resolve_claim` queries Cloudflare's DNS-over-HTTPS JSON endpoint for a TXT record at `_domainclaim-verify.<domain>` and checks whether any returned value matches the expected token — a fully deterministic string comparison, no LLM involved.
3. This mirrors the same domain-control verification pattern ACME/Let's Encrypt's DNS-01 challenge, Google Search Console, and Cloudflare all use: DNS-zone control is the same level of access as changing a domain's nameservers or registrar, and is real, live-checkable proof of control that RDAP-text matching alone can never provide.

**Combining the two signals:** the LLM judges the identity question only, and may legitimately report that RDAP text supports the claim. That signal is never trusted as final on its own — Python code downstream combines it with the independently-checked DNS result to assign the real verdict: `control_confirmed` requires both signals to agree; identity support without DNS proof caps out at `ownership_unverified`. This assignment happens identically, and is independently re-derived and cross-node-compared, in both `resolve_claim` and the challenge round's `resolve_challenge` — an `OVERTURN` can't reach `control_confirmed` without its own genuine, freshly-re-checked DNS proof.

## Why this design exists: a real portal rejection

An earlier version of this contract reached `control_confirmed` from RDAP-text matching alone. It was rejected on Aug 24 2026 with this exact reasoning: *"control_confirmed only matches public RDAP identity text and never proves the filer controls the domain."* The gap was structural, not cosmetic — nothing in the original design checked the actual caller (`gl.message.sender_address`) against the domain at all, so anyone who knew a domain's publicly-disclosed registrant name could reach the same verdict as the domain's real owner. See [`LESSONS.md`](../LESSONS.md) Part 7 for the complete account, including the specific research (Cloudflare's DNS-over-HTTPS response format, a real quote-escaping gotcha in TXT record values) the fix depended on.

## The outcome/verdict split

Every nondet call in this contract returns a tagged result — either `outcome: "judged"` (a real verdict) or `outcome: "void"` (no verdict reached, with a specific reason code). Both are independently re-derived and compared by every validator before any verdict-shaped field is touched. This means a fetch failure or an invalid domain never short-circuits consensus via a raised exception; the reason it didn't resolve becomes an agreed-upon, on-chain fact in the same way a real verdict would.

## Challenge round independence

`resolve_challenge` re-runs the identical RDAP fetch path `resolve_claim` uses, AND re-checks DNS fresh — never reading the original claim's stored content for either signal. This means an `OVERTURN` genuinely reflects both the registry's and the domain's current state at challenge-resolution time, not a re-argument of the same stale evidence.

## Frontend

React + Vite + TypeScript + Tailwind, talking to the contract through `genlayer-js`. Reads use a plain `createClient({ chain: studionet })` client with no wallet requirement. Writes require a connected browser wallet, an explicit `ensureChain()` call before every transaction to force StudioNet, and pass the wallet's plain address string as `account` — never wrapped in `createAccount()`, which expects a private key, not a browser wallet address.

Filing and resolving are two explicit UI steps, not one automatic flow: `file_claim` surfaces the DNS TXT record instructions, giving the caller a real chance to go publish it before calling `resolve_claim` — auto-resolving immediately would produce `ownership_unverified` for nearly every caller regardless of intent, simply because they hadn't had time to act yet.
