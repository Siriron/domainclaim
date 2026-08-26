# Deployment

## Contract

Deployed via GenLayer Studio's UI (`.py` uploaded directly, never pasted) at:

StudioNet: `0xcaF89d9eB7De0aA4532C070332419Cb1a886f9F3`

**This address hosts the fixed contract** (DNS ownership-proof mechanism, `contracts/domain_claim.py` in this repo) — redeployed after the Aug 24 2026 rejection of the prior RDAP-identity-only version, which lived at a different address (`0x4A2f5830676b1Fea8A8873Ad4daa75c2CaCD7477`, now superseded). **No transactions have been run against this deployment yet.** See the Testing status section below before assuming any of the fixed-version behavior — including the DNS TXT flow itself — has been confirmed live.

## Frontend

```bash
cd frontend
npm install
npm run build
```

Deploy the `frontend/` directory to Vercel. `vercel.json` handles the SPA rewrite. The contract address lives as a single plain constant in `src/config/chains.ts` — no environment variables, no `.env` file.

**Not yet deployed to a live URL** — run the build steps above to deploy, rather than treating any URL as live until it's confirmed.

## Testing status

### What was live-tested (prior version, before the DNS ownership-proof fix)

Every method in the pre-fix lifecycle — `file_claim`, `resolve_claim`, `challenge_claim`, `resolve_challenge`, `finalize_claim` — was run live against the deployed StudioNet contract through GenLayer Studio's Run and Debug panel, with empty stderr and zero validator disagreement across every transaction. A full challenge round was exercised: a challenge against a resolved `google.com` claim resolved `REJECT`, with `final_verdict` correctly held at the original verdict. Two real domains were tested end to end, `google.com` and `duckduckgo.com`, both resolving to `registrant_unresolvable` at high confidence (1000bps and 970bps respectively).

**None of this testing exercised the DNS ownership-proof mechanism** — it didn't exist yet. Both tested domains landed on `registrant_unresolvable`, a verdict branch the DNS check doesn't affect at all (RDAP itself had no registrant data to check identity against, so ownership proof was never relevant to either result).

### What has NOT been tested at all (the current, fixed version)

- **The DNS TXT verification flow end to end.** No claim has ever been filed, had its TXT record actually published under a real domain, and been resolved to confirm `control_confirmed` is reached only with a genuine, live-matching record.
- **`ownership_unverified`, the new fourth verdict.** Never observed live — only confirmed to exist correctly in the audited contract code (the deterministic assignment logic, and both leader/validator consistency checks requiring `dns_ownership_verified` to match the verdict).
- **`control_disputed`.** No domain has been tested where RDAP shows a specific, identifiable registrant that actively contradicts the caller's claimed identity.
- **DNS re-verification inside `resolve_challenge`.** The challenge round's own independent DNS re-check (added specifically so an `OVERTURN` can't reach `control_confirmed` without genuine re-verified proof) has never been exercised live.
- **The unchallenged `finalize_claim` path.** Requires the real 7-day challenge window to elapse, which hasn't happened on any claim yet.
- **Cloudflare DoH response parsing against a real, live TXT record.** The quote-stripping logic in `_resolve_dns_txt_verification` was built from documented response-format research (see `LESSONS.md` Part 7.4), not confirmed against an actual live DNS-over-HTTPS response for a record this contract itself created.

**Recommended test sequence before resubmitting:** file a claim, retrieve the TXT record via `get_verification_instructions`, actually publish it on a domain you control, wait for DNS propagation, then resolve and confirm `control_confirmed` with `dns_ownership_verified: "true"`. Separately, resolve a claim without publishing the record and confirm it caps at `ownership_unverified` with `dns_ownership_verified: "false"`. Both are necessary — one confirms the mechanism works, the other confirms it doesn't grant the favorable verdict by default.
