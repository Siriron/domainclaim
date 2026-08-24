# Deployment

## Contract

Deployed via GenLayer Studio's UI (`.py` uploaded directly, never pasted) at:

StudioNet: `0x4A2f5830676b1Fea8A8873Ad4daa75c2CaCD7477`

## Frontend

```bash
cd frontend
npm install
npm run build
```

Deploy the `frontend/` directory to Vercel. `vercel.json` handles the SPA rewrite. The contract address lives as a single plain constant in `src/config/chains.ts` — no environment variables, no `.env` file.

**Not yet deployed to a live URL** — run the build steps above to deploy, rather than treating any URL as live until it's confirmed.

## Testing status

Every method in the lifecycle — `file_claim`, `resolve_claim`, `challenge_claim`, `resolve_challenge`, `finalize_claim` — has been run live against the deployed StudioNet contract through GenLayer Studio's Run and Debug panel, with empty stderr and zero validator disagreement across every transaction. A full challenge round was exercised: a challenge against a resolved `google.com` claim resolved `REJECT`, with `final_verdict` correctly held at the original verdict, and the re-fetch's reasoning explicitly noting the challenge relied on assumptions not supported by the re-fetched RDAP data.

Two real domains were tested end to end: `google.com` and `duckduckgo.com`, both resolving to `registrant_unresolvable` at high confidence (1000bps and 970bps respectively), each with a reasoning summary naming the specific RDAP entities actually present rather than generic language.

**Not yet tested:**
- The unchallenged `finalize_claim` path — it requires the real 7-day challenge window to elapse, which hasn't happened yet.
- `control_confirmed` and `control_disputed` — no domain with a genuinely disclosed, non-proxied registrant has been tested yet, so only the `registrant_unresolvable` branch has live confirmation.
