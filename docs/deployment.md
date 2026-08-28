# Deployment

## Contract

Deployed via GenLayer Studio's UI (`.py` uploaded directly, never pasted) at:

StudioNet: `0x03E5E595834cAF1c50Eb88229eA1e6520B344b88`

Deploy transaction: `0xefddbaa290bd51e8fac4d8a2a055f8b81a87a79910dbee7707912b2df663c5d3` — `SUCCESS` / `Accepted` / `FINALIZED`, Aug 27 2026, 5:44:45 AM. Confirmed directly against the explorer (`explorer-studio.genlayer.com`), not assumed from the deploy having been requested.

**This address hosts the second review-cycle fix** (`contracts/domain_claim.py` in this repo) — the response to the Aug 26 2026 "More Information Needed" steward note on the DNS ownership-proof resubmission. It supersedes `0xcaF89d9eB7De0aA4532C070332419Cb1a886f9F3` (the DNS-ownership-proof-fix version, which itself superseded `0x4A2f5830676b1Fea8A8873Ad4daa75c2CaCD7477`, the original pre-DNS-fix version rejected Aug 25 2026). All three addresses are real and each was genuinely deployed in sequence; only `0x03E5E595834cAF1c50Eb88229eA1e6520B344b88` reflects the current file in this repo.

**No transactions beyond the deploy itself have been run against this address.** By explicit instruction, this build is not being live-tested before completion — see "Testing status" below for exactly what that does and does not mean for confidence in the fix.

## Frontend

```bash
cd frontend
npm install
npm run build
```

Deploy the `frontend/` directory to Vercel. `vercel.json` handles the SPA rewrite. The contract address lives as a single plain constant in `src/config/chains.ts` — no environment variables, no `.env` file. Updated to `0x03E5E595834cAF1c50Eb88229eA1e6520B344b88` as part of this fix — see `frontend.md` for the specific fields the UI now surfaces from the second review cycle.

**Not yet deployed to a live URL** — run the build steps above to deploy, rather than treating any URL as live until it's confirmed.

## Testing status

### What was live-tested (the pre-second-review-cycle version, before this specific fix)

Every method in the DNS-ownership-proof-fix lifecycle — `file_claim`, `resolve_claim`, `challenge_claim`, `resolve_challenge`, `finalize_claim` — was run live against `0xcaF89d9eB7De0aA4532C070332419Cb1a886f9F3` through GenLayer Studio's Run and Debug panel prior to this fix, with empty stderr and zero validator disagreement across every transaction. Two real domains were tested end to end, `google.com` and `duckduckgo.com`, both resolving to `registrant_unresolvable` at high confidence (1000bps and 970bps respectively). A full challenge round was exercised against a resolved `google.com` claim, resolving `REJECT` with `final_verdict` correctly held at the original verdict.

**None of that testing exercised any of the five things this specific fix changes** — it predates them entirely. See the section below for what mechanical verification *has* been done on the current file.

### What has NOT been tested at all — the current, second-review-cycle-fixed version deployed at `0x03E5E595834cAF1c50Eb88229eA1e6520B344b88`

By explicit instruction for this build, none of the following has been exercised live. This is a deliberate, requested exception to this project's own standing "live-test before considering it done" discipline (project knowledge section 9.2, checklist item 4) — not an oversight, and not evidence the fix is wrong, but a real gap in confidence that should be named plainly rather than rounded up:

- **`resolve_challenge`'s RDAP-refetch-failure branch reaching consensus.** The specific bug fixed — a leader/validator pair both landing on this branch and being unable to agree because `dns_ownership_verified` was absent from the returned dict — has not been exercised against a real RDAP fetch failure during a live challenge round.
- **The `dns_status` three-way distinction** (`verified` / `not_verified` / `check_failed`) against real DNS infrastructure. No real Cloudflare DoH `SERVFAIL` (`Status: 2`) response, and no real NXDOMAIN (`Status: 3`) response, has been observed and confirmed to route to the correct branch.
- **`evidence_truncated` against a genuinely oversized RDAP record.** No domain with an RDAP response over the 6000-character fetch cap has been resolved to confirm the truncation flag sets correctly and the model actually receives the truncation warning in its prompt.
- **The two new defensive ID-collision assertions** (`assert cid not in self.claims`, `assert chid not in self.challenges`) under normal operation. These are expected, by the reasoning in the contract's own docstring, to never fire — but that expectation itself has not been confirmed by actually filing a claim and a challenge against this deployment.
- Everything already listed as untested in the DNS-ownership-proof-fix version (the DNS TXT flow end to end against a real published record, `control_disputed`, the unchallenged `finalize_claim` path, Cloudflare DoH parsing against a real live TXT record) remains equally untested here, since none of it has changed in this fix.

### What HAS been verified on the current file, and what that does and doesn't prove

- **Static syntax check** (`python3`'s `ast.parse`): passes. Confirms the file is valid Python; proves nothing about GenVM-specific runtime behavior.
- **The full section 4 ten-item mandatory nondet audit**, run mechanically via grep/script against the complete file, twice (once after the initial fix, once after the docstring pass): clean both times. Confirms the fix introduces no violation of any of the ten confirmed structural GenVM rules (no `.send()`, no `self.` inside nondet closures, no `json.loads()` on already-decoded values, no stray class-body constants treated as storage, no `float()`, positional `run_nondet_unsafe`, no `DynArray` on nested dataclasses, correct timestamp parsing, no `Address`-keyed `TreeMap`). **This does not confirm the fix behaves correctly against real RDAP/DNS infrastructure or reaches genuine multi-validator consensus** — only live execution can confirm that.
- **Field-by-field cross-check**: every key returned by both `leader_fn`s (in `resolve_claim` and `resolve_challenge`) is independently re-derived and compared in the corresponding `validator_fn`, confirmed by direct extraction and comparison of the actual dict keys in both functions — not eyeballed.
- **Successful deploy**: the file compiles and loads correctly under GenVM's own schema validation (confirmed via the `SUCCESS`/`FINALIZED` constructor transaction on the explorer). This is a real, meaningful signal — a syntax or schema-load error would have failed here — but it says nothing about the correctness of any specific write method's logic.

**Recommended test sequence, for whenever live testing does happen:** file a claim on a domain under a TLD absent from IANA's RDAP bootstrap (e.g. `.io`, confirmed absent as of mid-2026 sources — verify current status first, since bootstrap coverage changes over time) to force a deterministic, repeatable void and exercise the fetch-failure path; open and resolve a challenge against a resolved claim to exercise `resolve_challenge`'s fixed branch; resolve a claim on a domain with a genuinely large RDAP record to exercise `evidence_truncated`; and file/challenge at least once each to confirm the two new ID-assertions never fire under normal operation.
