# Smart contract

Full source: [`contracts/domain_claim.py`](../contracts/domain_claim.py)

## Write methods

| Method | Description |
|---|---|
| `file_claim(domain, claimed_identity)` | Records a domain and a claimed registrant identity, after deterministic syntax validation and a duplicate-pair guard. Returns a unique DNS TXT record (name + value) the caller can optionally publish as ownership proof. |
| `resolve_claim(claim_id)` | Resolves the domain's RDAP server via IANA's bootstrap, fetches the live record, checks live DNS for the verification token, and reaches a verdict via leader/validator consensus. |
| `challenge_claim(claim_id, reason_code, statement)` | Opens a challenge against a resolved, unchallenged claim within its 7-day window. |
| `resolve_challenge(challenge_id)` | A second, independent nondet round — re-fetches RDAP AND re-checks DNS fresh and decides `UPHOLD`, `OVERTURN`, or `REJECT`. |
| `finalize_claim(claim_id)` | Locks the terminal state once the challenge window closes uncontested, or once an open challenge resolves. |

## View methods

| Method | Description |
|---|---|
| `get_claim(claim_id)` | Full claim record, including `dns_ownership_verified`. |
| `get_challenge(challenge_id)` | Full challenge record. |
| `get_claims_for_domain(domain)` | Claim IDs filed against a given domain. |
| `is_pair_permanently_voided(domain, claimed_identity)` | Whether a domain+identity pair was permanently voided and can never be refiled. |
| `get_verification_instructions(claim_id)` | Re-derives the expected DNS TXT record name/value for an already-filed claim — safe to call at any time, before or after resolution. |
| `get_next_claim_id()` / `get_next_challenge_id()` | Next auto-incrementing ID. |

## Verdict shape

Every `resolve_claim`/`resolve_challenge` result is one of two structurally distinct outcomes:

- **judged** — one of four verdicts:
  - `control_confirmed` — RDAP identity text supports the claim, AND a live DNS TXT lookup confirmed the caller published the exact expected verification token.
  - `ownership_unverified` — RDAP identity text supports the claim, but DNS ownership was not proven (the record wasn't published, hasn't propagated yet, or the lookup failed transiently). **This is the fix for the Aug 24 2026 portal rejection** — RDAP-text agreement alone can never reach `control_confirmed` on its own.
  - `control_disputed` — RDAP shows a different, specific, identifiable registrant that actively contradicts the claim.
  - `registrant_unresolvable` — RDAP contains no registrant-role entity with genuine identifying data at all (redacted, missing, or privacy-proxied).
- **void** — `INVALID_DOMAIN_SYNTAX`, `RDAP_OBJECT_CLASS_MISMATCH` (both permanent, block refiling), or `TLD_NOT_IN_RDAP_BOOTSTRAP`, `BOOTSTRAP_FETCH_FAILED`, `RDAP_FETCH_FAILED` (all transient, retryable).

## How `control_confirmed` vs. `ownership_unverified` is decided

This assignment is fully deterministic and never left to LLM discretion, in both `resolve_claim` and `resolve_challenge`:

1. The LLM judges only the RDAP-identity question and may legitimately report `control_confirmed`, meaning solely "RDAP text supports this identity" — it has no visibility into DNS state at all.
2. A separate, independently-re-derivable Python check (`_resolve_dns_txt_verification`) queries Cloudflare's DNS-over-HTTPS endpoint for the claim's unique verification token, deterministically true or false.
3. The two signals combine: identity support + DNS proof = `control_confirmed`. Identity support without DNS proof = `ownership_unverified`. Both `leader_fn` and every `validator_fn` independently perform this same combination and must agree on both the final verdict AND the `dns_ownership_verified` field before consensus is reached — a leader claiming `control_confirmed` with `dns_ownership_verified: "false"` fails validation outright.

## DNS ownership-proof mechanism

- Token: deterministically derived as `domainclaim-verify=<claim_id>-<submitter_address_lowercased>` — no randomness, so every validator computes the identical expected value independently.
- Record: a TXT record named `_domainclaim-verify.<domain>`, containing exactly that token as its value.
- Lookup: Cloudflare's DNS-over-HTTPS JSON API (`cloudflare-dns.com/dns-query`), fetched via `gl.nondet.web.get()` with an `Accept: application/dns-json` header.
- A confirmed, load-bearing parsing detail: Cloudflare's response returns TXT values with their DNS wire-format quote characters still embedded (a record whose real value is `hello` comes back as `"hello"`, quotes included) — the comparison strips a single leading and trailing quote defensively before comparing.
- Publishing the record is always optional. A claim resolved without it still receives an honest verdict, capped at `ownership_unverified`.

## Deployed address

StudioNet: `0xcaF89d9eB7De0aA4532C070332419Cb1a886f9F3` — **this hosts the fixed contract described above** (DNS ownership-proof mechanism included), redeployed after the Aug 24 2026 rejection. See `docs/deployment.md` for full testing status: no transactions have been run against this address yet, so none of the mechanism described in this file — including the DNS TXT check itself — is confirmed live at this address specifically.
