# Architecture

## Overview

DomainClaim has two layers that stay deliberately separate: a GenVM contract that fetches and judges evidence, and a frontend that only submits domains and reads back whatever the contract already decided. The frontend never fetches or interprets RDAP data itself — every fact behind a verdict is resolved entirely on-chain.

## Evidence resolution

1. A domain's TLD is extracted deterministically in the contract's plain (non-nondet) code.
2. Inside the nondet block, `_resolve_rdap_base_url` fetches IANA's own bootstrap registry file (`https://data.iana.org/rdap/dns.json`) and resolves the authoritative RDAP server URL for that TLD — a static, non-redirecting file, chosen deliberately over `rdap.org`'s redirect-based bootstrap, whose redirect-following behavior under `gl.nondet.web.get()` was never independently confirmed.
3. The resolved server is queried directly for the domain's RDAP record.
4. The record's `entities` array is reasoned over by an LLM prompt that judges whether a genuine registrant-role entity exists and, if so, whether it supports the caller's claimed identity.
5. A leader proposes a result; every validator independently re-derives the same fetch-and-judge sequence and the result is only accepted on agreement.

## The outcome/verdict split

Every nondet call in this contract returns a tagged result — either `outcome: "judged"` (a real verdict) or `outcome: "void"` (no verdict reached, with a specific reason code). Both are independently re-derived and compared by every validator before any verdict-shaped field is touched. This means a fetch failure or an invalid domain never short-circuits consensus via a raised exception; the reason it didn't resolve becomes an agreed-upon, on-chain fact in the same way a real verdict would.

## Challenge round independence

`resolve_challenge` re-runs the identical `_fetch_domain_rdap` fetch path `resolve_claim` uses — never reading the original claim's stored RDAP content. This means an `OVERTURN` genuinely reflects the registry's current state at challenge-resolution time, not a re-argument of the same stale evidence.

## Frontend

React + Vite + TypeScript + Tailwind, talking to the contract through `genlayer-js`. Reads use a plain `createClient({ chain: studionet })` client with no wallet requirement. Writes require a connected browser wallet, an explicit `ensureChain()` call before every transaction to force StudioNet, and pass the wallet's plain address string as `account` — never wrapped in `createAccount()`, which expects a private key, not a browser wallet address.
