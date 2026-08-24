# Smart contract

Full source: [`contracts/domain_claim.py`](../contracts/domain_claim.py)

## Write methods

| Method | Description |
|---|---|
| `file_claim(domain, claimed_identity)` | Records a domain and a claimed registrant identity, after deterministic syntax validation and a duplicate-pair guard. |
| `resolve_claim(claim_id)` | Resolves the domain's RDAP server via IANA's bootstrap, fetches the live record, and reaches a verdict via leader/validator consensus. |
| `challenge_claim(claim_id, reason_code, statement)` | Opens a challenge against a resolved, unchallenged claim within its 7-day window. |
| `resolve_challenge(challenge_id)` | A second, independent nondet round — re-fetches RDAP fresh and decides `UPHOLD`, `OVERTURN`, or `REJECT`. |
| `finalize_claim(claim_id)` | Locks the terminal state once the challenge window closes uncontested, or once an open challenge resolves. |

## View methods

| Method | Description |
|---|---|
| `get_claim(claim_id)` | Full claim record. |
| `get_challenge(challenge_id)` | Full challenge record. |
| `get_claims_for_domain(domain)` | Claim IDs filed against a given domain. |
| `is_pair_permanently_voided(domain, claimed_identity)` | Whether a domain+identity pair was permanently voided and can never be refiled. |
| `get_next_claim_id()` / `get_next_challenge_id()` | Next auto-incrementing ID. |

## Verdict shape

Every `resolve_claim`/`resolve_challenge` result is one of two structurally distinct outcomes:

- **judged** — `control_confirmed`, `control_disputed`, or `registrant_unresolvable`.
- **void** — `INVALID_DOMAIN_SYNTAX`, `RDAP_OBJECT_CLASS_MISMATCH` (both permanent, block refiling), or `TLD_NOT_IN_RDAP_BOOTSTRAP`, `BOOTSTRAP_FETCH_FAILED`, `RDAP_FETCH_FAILED` (all transient, retryable).

## Deployed address

StudioNet: `0x4A2f5830676b1Fea8A8873Ad4daa75c2CaCD7477`
