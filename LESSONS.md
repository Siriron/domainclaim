# LESSONS.md — DomainClaim build (Aug 2026)

Standalone record of how this build actually went, written for a future
session with no memory of this conversation — the same purpose as
SentinelSLA's own LESSONS.md. Structured the same way: confirmed facts
stated as rules, each with its evidence, not narrative. Durable,
reusable facts from this document have already been folded into
Project Knowledge's own sections 2, 4, 7, 9; this file stays in the
repo as the dated, build-specific record of how each fact was found —
read it if you want the reasoning behind a rule, not just the rule.

---

## Part 1 — Before writing any code: how the concept got picked

### 1.1 A stale memory number nearly set the wrong target

The session opened with a screenshot showing SentinelSLA accepted at
**380 points**, after a real two-round "More Information Needed" review
cycle with a named reviewer (Pavel Kolosov). Memory at the time said
**200 points, not yet submitted**. That's not a rounding error — it's
a completely different scoring calibration, and every decision after
that point (what bar to build toward, how much lifecycle depth counts)
depended on knowing the real number.

**The lesson:** when a screenshot or a direct user statement conflicts
with stored memory, the screenshot wins, and the memory gap itself is
worth understanding before proceeding — not just silently overwritten.
In this case the gap existed because SentinelSLA's actual review cycle
happened after the last memory-writing pass, so the stored "not yet
submitted" was genuinely stale, not wrong at the time it was written.
**Check memory against any freshly-provided evidence before treating
memory as ground truth, especially for anything scoring- or
status-related that could have changed since the last update.**

### 1.2 The real SentinelSLA contract was more rigorous than its own memory summary implied

Before building anything, the actual SentinelSLA repo zip was read
directly — contract source and LESSONS.md both — rather than relying
on the memory catalog's summary of it. The real contract had canonical
repo-URL binding, a GitHub repo-existence check, a duplicate-filing
guard, and (critically) a tagged `outcome: "void"` pattern that a
second review round had specifically required, none of which the
memory catalog's summary conveyed with full weight.

**The lesson:** a memory summary of a prior build is a compressed,
lossy pointer — treat it as "go read the real file," not as a
substitute for reading it, especially before adapting that build's
patterns into a new one. This mattered enormously here: the single
most important structural decision in DomainClaim's own design (the
outcome/verdict split, described in Part 3 below) came directly from
reading SentinelSLA's real `resolve_challenge` function, not from its
memory-catalog description of "reputation ledger, no stake."

### 1.3 Two concept candidates were tried and explicitly rejected before RDAP

Two ideas were run through the four-test framework and killed before
landing on domain/RDAP attestation:

- **Patent/trademark prior-art attestation** — killed at Test 2
  (evidence verifiability). Trademark/patent search has no clean,
  ID-addressable, authoritative single source the way GHSA does;
  building it would have reproduced the exact SourceChecker/Chronomark
  failure shape (a fuzzy "is there prior art" search with no bound
  evidence source) under a new name.
- **W3C/IETF standards-conformance attestation** — killed for the same
  reason: "conformance" against errata is a fuzzier judgment than a
  clean ID lookup, and no RFC-standardized, ID-addressable registry
  exists for it the way RDAP exists for domains.

**The lesson:** running rejected candidates through the framework
explicitly, and naming why each failed, is worth doing even when the
eventual concept feels obviously better in hindsight — the two
killed candidates are exactly the kind of "AI app with GenLayer
attached" trap that only becomes obvious once you've actually tried to
name the authoritative evidence source and failed to find one. If a
future session considers either of these two ideas again, both are
now confirmed-rejected, not merely undiscussed.

---

## Part 2 — A real, live evidence-source design mistake caught mid-research, before it reached code

### 2.1 rdap.org's bootstrap is a redirect, not a data API — confirmed via search, never assumed

The first design instinct was to query `rdap.org/domain/<name>`
directly as if it were a data endpoint. A web search of rdap.org's own
documentation revealed it's a **bootstrap redirector**: a query to it
returns an HTTP 302 pointing at the actual authoritative registry
server (e.g. Verisign for `.com`), and the real RDAP JSON lives at the
redirect target, not at rdap.org itself.

**Why this mattered enough to change the design:** whether
`gl.nondet.web.get()` transparently follows redirects was never
independently confirmed in this project's history — and guessing wrong
here would have silently returned an empty or wrong body to every
leader/validator, with no obvious error message pointing at the real
cause. This is structurally the same category of risk as the
GitHub-commit-HTML-vs-diff bug (Project Knowledge Bug 9) — an assumed
fetch behavior that's wrong in a way that doesn't throw, it just
returns something plausible-looking and wrong.

**The fix chosen:** route around the unconfirmed behavior entirely.
IANA's own bootstrap file (`https://data.iana.org/rdap/dns.json`) is a
flat, static, non-redirecting JSON file mapping TLD → RDAP base URL
(RFC 7484 format). Resolve the authoritative server deterministically
in contract code by fetching and parsing that file directly, then
fetch the resolved URL. This was **more auditable than the workaround
it replaced**, not merely a way to dodge an unknown.

**The generalizable lesson:** when an evidence source's own
documentation describes a **redirect-based** discovery mechanism, and
the fetch tool's redirect-following behavior isn't independently
confirmed elsewhere in this project's history, don't assume it works
like a browser. Either confirm the fetch tool's redirect behavior
directly before depending on it, or — usually simpler and more
auditable either way — find the non-redirecting canonical source
underneath the convenience layer and resolve it deterministically in
contract code instead. This is a new, generalizable instance of the
same discipline Bug 9 already established for GitHub commit URLs; it's
not domain-specific to RDAP.

### 2.2 A privacy-redaction signaling mechanism was confirmed real but deliberately not depended on

Research confirmed RFC 9537 defines a formal `redacted` JSON member
(JSONPath-based) that RDAP servers can use to signal withheld fields.
It's real, but **not universal** — many registrars simply omit or
empty the registrant entity without using this formal member at all.

**The design decision:** rather than have the LLM parse a specific
extension's exact wire format (fragile, and not how every real
registrar actually signals redaction), the judgment prompt asks a
**semantic** question — does a registrant-role entity exist with
genuine identifying data at all, regardless of which specific
mechanism explains its absence if it's missing. This mirrors Project
Knowledge's own defensive-parsing principle for LLM JSON *output* (key
aliasing over exact-format assumptions), applied here to evidence
*input* shape instead.

**The lesson, generalized:** when an evidence source has multiple,
non-uniformly-implemented ways of signaling the same underlying fact,
don't build the judgment prompt around parsing one specific mechanism's
exact syntax. Ask the semantic question the mechanisms are all trying
to answer, and let the model reason over whichever signal is actually
present in the specific record being judged. This is a new pattern,
not previously named as a standing rule before this build.

---

## Part 3 — The outcome/verdict split: read from SentinelSLA's real code, then deliberately diverged from it in two places

### 3.1 Where the pattern came from

DomainClaim's `leader_fn` never raises an exception to signal "no
valid outcome" — it always returns a tagged dict (`outcome: "judged"`
or `outcome: "void"`, each with its own further fields), and both
branches are independently re-derived and compared inside
`validator_fn` before any verdict-shaped field is touched. This exact
pattern — modeling permanent non-outcomes as tagged dicts instead of
exceptions — is the fix SentinelSLA's own **second** review round
specifically required, after a reviewer caught that an
exception-based rejection skips validator consensus entirely (only the
reverting node's reasoning runs at all).

**This was built into DomainClaim from the first draft**, not
discovered via review feedback the way it was on SentinelSLA. That's
the entire point of writing it here: the next contract that needs a
"this didn't reach a real verdict, and here's specifically why"
outcome should start from this pattern on day one, not rediscover it
after a reviewer flags an exception-based shortcut.

### 3.2 Two deliberate, named departures from the source pattern — confirmed via diff, not asserted

Before building `resolve_challenge`, SentinelSLA's actual
`resolve_challenge` function was read in full (not just its
docstring's description of itself). Two specific things were found
worth doing differently, and both were confirmed present in the
finished file via direct grep after writing it — not just described in
a comment and left unverified:

1. **No JSON stringify/parse round-trip.** SentinelSLA's challenge
   `leader_fn` manually stringifies the LLM's already-parsed dict
   result (with markdown-fence stripping) and re-parses it with
   `json.loads()` — lossless, but an avoidable deviation from the
   project's own stated safest pattern (`leader_fn` returns the parsed
   dict directly, never round-tripped through a string), and
   introduced without a stated reason in the file that most needed to
   demonstrate that discipline. DomainClaim's `resolve_challenge`
   `leader_fn` returns the dict straight through. **Confirmed via grep
   after writing:** `json.loads(` appears exactly once in the whole
   file, inside `_fetch_json`'s own body parsing a raw HTTP response —
   zero occurrences anywhere in the challenge path.

2. **A missing cross-field consistency check, added.**
   SentinelSLA's validator independently re-derives and compares
   `decision` and `final_verdict` — but never checks they're mutually
   *consistent* with each other. A leader reporting `decision: UPHOLD`
   together with a `final_verdict` that differs from the original
   verdict would still pass that validator, since only each field's
   cross-node *agreement* is checked, never their logical
   *consistency*. DomainClaim's validator adds an explicit check:
   `UPHOLD`/`REJECT` must carry the original verdict exactly, only
   `OVERTURN` may differ. **Confirmed via grep after writing:** the
   exact line (`if decision in ("UPHOLD", "REJECT") and final_verdict
   != c_mem.verdict: return False`) is present and reachable.

**The lesson, generalized:** "read a comparable contract's real source
before building the same shape again" (Project Knowledge's own
standing instruction) is not satisfied by reading its docstring or its
memory-catalog summary — the two real improvements found here only
became visible from the actual function body. And when a deliberate
improvement over a reused pattern is claimed in a docstring, **verify
it's actually present with a direct grep against the finished file
before presenting it as done** — a docstring claim and an implemented
fact are different things, and this build's own audit process caught
both by checking, not by trusting its own prior sentence.

---

## Part 4 — The two-method version was correctly called out as thin, and why

### 4.1 What happened

The first working contract had exactly two write methods: `file_claim`
and `resolve_claim`. Terminal after one resolution — no challenge, no
dispute of a resolved verdict, no lifecycle beyond "ask once, get an
answer once." The user directly called this out: *"This contract only
has two write call how can this one better than SentalSla you didn't
give effort."*

### 4.2 What the actual gap was, confirmed by direct comparison, not defended by assertion

The honest response ran a real comparison rather than defending the
method count: `grep -c "@gl.public.write"` on both files showed
SentinelSLA has 8 write methods across a real lifecycle
(register → file → resolve → challenge → resolve_challenge →
finalize), DomainClaim had 2. **That gap is not a style difference —
it's a real, structural shortfall against Test 4 (depth potential)**,
which had been asserted as "pass" earlier without actually
stress-testing whether a single-party attestation with no challenge
layer can support "a richer narrative arc" the way the framework
requires. It can't, as originally built.

**The lesson:** running the four-test framework and asserting a pass
narratively, in one's head, is not the same as stress-testing it. Test
4 specifically deserves an explicit check — "does this concept's
current shape actually have a second act, or does it end after one
judged fetch" — not just a general sense that the concept "feels deep
enough." **Method count itself is not the metric; it's a proxy that's
usually correlated with actually having a second act. Check for the
second act directly** (a real state that isn't terminal, a real
party who can contest an outcome) rather than defending or attacking a
raw method count either way.

### 4.3 The fix: found a genre-native, not bolted-on, reason for a second act

The fix wasn't "add methods to hit a number" — it was finding a
structural reason the concept's own subject matter *already* supports
a challenge: RDAP is a live, mutable record. A `control_confirmed`
verdict resolved today can go stale — the domain could be
re-registered, transferred, or newly privacy-proxied tomorrow — and
nothing in the original 2-method version let anyone say "that claim is
stale, re-check it." This is a real property of the evidence source
itself, not an invented feature to pad the method count.

**The lesson, generalized:** when a concept is found thin on Test 4,
look for a challenge/dispute/re-derivation opportunity that's
*native to the evidence source's own real-world properties* (here:
RDAP state changing over time) rather than importing a
challenge-shaped mechanism from a different concept just because it
worked there. A bolted-on challenge layer with no genuine reason to
exist would have been exactly the "scope-creep to look more
substantial" failure mode Project Knowledge's own multi-entity
guidance warns against; a challenge layer justified by the evidence
source's actual volatility is not.

---

## Part 5 — Live testing: two real confusions, both worth naming exactly, because both are avoidable

### 5.1 A reverted transaction correctly does not consume an ID — but this wasn't obvious to the tester

Sequence: `file_claim(google.com)` → id 1. `resolve_claim(1)` →
resolved. `file_claim("not a domain!!")` → **reverted** at the
deterministic syntax assert, before `next_claim_id` was ever
incremented. `file_claim(duckduckgo.com)` → id **2**, correctly, since
the reverted call never consumed one.

The user reasonably expected duckduckgo.com to be claim 3, since it
was the fourth `file_claim` call chronologically. It's actually the
second one that *succeeded*.

**The lesson, for future test-guidance:** when a deliberately-invalid
test case is part of the test plan (confirming a revert path works,
which is itself a legitimate and valuable thing to test), **say
explicitly, at the time, that a successful revert will not consume an
id** — don't wait for the confusion to happen and then explain it
after the fact. This is a small thing, but it cost a full clarifying
exchange that a single proactive sentence would have prevented.
**State ID-consumption behavior explicitly whenever a test plan
includes an intentionally-failing call**, not only when asked.

### 5.2 Losing track of which transaction had already been sent, mid-sequence

Partway through the challenge-round testing, the user said "But iv
already gave you resolve 1 transection" in response to being asked to
run `resolve_claim` again. This required tracing back through the
actual message history, in order, to determine what was true: turned
out `resolve_claim(1)` genuinely had been run several messages
earlier (during the very first domain test), and the confusion was
between that and `resolve_challenge`, a different method entirely,
which was the one actually still outstanding.

**What worked, and should be repeated:** rather than guess or
apologize generically, the actual message history was walked through
step by step, numbered, with each transaction's method name and result
restated, to establish what was objectively true before proceeding.
This resolved the confusion correctly on the first attempt.

**The lesson, generalized for any future multi-step live-testing
session:** in a long sequence of "send this, tell me the result, send
the next thing," **it is worth periodically restating the full
sequence so far** (a short numbered list: method, result, in order) —
not only when a user expresses confusion, but proactively at natural
checkpoints (e.g. right before a new phase of testing begins, like
moving from single-claim resolution into the challenge round). This
would likely have prevented the confusion in section 5.2 from
happening at all, rather than requiring a recovery step after the
fact. **A running, explicit transaction ledger during live testing is
worth maintaining and periodically restating, not just implicitly
tracked.**

### 5.3 What actually got confirmed live, and why it mattered beyond "the tests passed"

Every method in the lifecycle fired at least once with empty stderr
and zero validator disagreement: `file_claim` (x2 successful, x1
correctly-reverted), `resolve_claim` (x2), `challenge_claim`,
`resolve_challenge`, `finalize_claim`. Two structurally different real
domains (google.com via MarkMonitor Inc., duckduckgo.com via a
different registrar) both resolved to `registrant_unresolvable` at
high confidence (1000bps, 970bps) — a genuine, unprompted confirmation
of the design's own pre-testing prediction that this is the *common*
case for this evidence source, mirroring SentinelSLA's own
`closed_at`-mostly-unset finding, but arrived at independently rather
than assumed by analogy.

The one challenge round tested (asserting MarkMonitor acts as a
corporate registrant proxy for Google) resolved `REJECT`, with
`final_verdict` correctly held at the original `registrant_unresolvable`,
and — most importantly — the re-fetch's own reasoning explicitly
stated the challenge relied on external assumptions not supported by
the re-fetched RDAP data itself. This is direct, live confirmation
that the charter's "judge only what's in the fetched JSON, not outside
knowledge" instruction holds under a real adversarial-style challenge,
not just under the uncontested resolution path.

**Not yet tested, named explicitly rather than left implicit:** the
unchallenged `finalize_claim` path (blocked on a real 7-day window
elapsing — not something a live-testing session can shortcut), and
`control_confirmed`/`control_disputed` — every domain tested so far
happened to land on the same verdict branch, so the other two-thirds
of the verdict space remain unexercised against live RDAP data.

---

## Part 6 — Frontend build: what was reused correctly, and what the audit loop actually caught

### 6.1 SentinelSLA's real `useGenLayer.ts` and `chains.ts` were read from the actual repo, not reconstructed from memory

Before writing a single frontend file, SentinelSLA's real
`frontend/src/hooks/useGenLayer.ts` and `frontend/src/config/chains.ts`
were read directly from its zip. DomainClaim's hook is built on that
exact confirmed-working structure (ensureChain, plain-address account
never wrapped in createAccount, the TimeoutError class carrying the tx
hash, generous retry config) — adapted only for DomainClaim's own
method names, not rewritten from a description of the pattern.

**The lesson, reinforcing something already established but worth
restating with fresh evidence:** for a pattern that's already
confirmed working in a real prior repo, **read the actual file and
adapt it, don't reconstruct it from memory of what the pattern is
supposed to do.** This is the same discipline as Part 1.2 and Part
3.1 above, now confirmed a third time in the same build across
contract-writing, challenge-design, and frontend-wiring — it is not a
one-off practice, it is the load-bearing habit of this whole session.

### 6.2 The mandatory audit loop caught one real thing worth double-checking by hand, not just by grep

A grep for `hidden md:`/`hidden sm:`/`hidden lg:` (checklist item 11)
returned one hit, in `Navbar.tsx`. Rather than treat the grep result
alone as sufficient (a bare "one match, might be a problem" is not
actually a finding), the actual component file was read in full to
confirm whether a real mobile equivalent existed. It did — a
`flex md:hidden` block rendering the identical three nav links below
the header on small screens. **Confirmed correct by reading the code,
not assumed from either the presence or absence of a grep hit alone.**

**The lesson:** the `hidden md:` grep is a **flag for manual
verification, not a pass/fail test on its own.** A hit doesn't mean a
bug exists; it means "go look at this specific spot by hand and
confirm." Treating a grep hit as automatically bad would have
produced a false alarm here; treating the grep's silence as
automatically fine would miss a real case where no `md:hidden`
counterpart exists at all. Both the search and the manual read are
required steps, not alternatives to each other.

### 6.3 Two real inconsistencies were caught and fixed during the pre-zip pass, not asserted as clean

- **README tagline vs. `github-description.txt`** — the readme
  template's own instruction is that these should be the same
  sentence; on first draft they weren't (one was punchier/hero-toned,
  one was more literal). Caught by direct comparison
  (`grep "^### "` against `cat github-description.txt`) and fixed by
  making the README tagline match the description file exactly, not
  the other way around, since the description file is what a GitHub
  repo page actually surfaces first.
- **Packaged contract vs. live-tested contract** — before zipping,
  `diff` was run between the contract file sitting in the frontend
  repo and the exact file that had actually been live-tested through
  every method on StudioNet. They were confirmed byte-identical. This
  matters because it's entirely possible to accumulate small drift
  between "the version I tested" and "the version I packaged" across a
  long session with multiple file-copy steps — the diff check is what
  makes that confirmed rather than assumed.

**The lesson, generalized:** **"documentation must match the actual
build" (a named, staff-confirmed rejection category) is not satisfied
by writing consistent-sounding prose across multiple files — it
requires an explicit, mechanical cross-check between files that are
supposed to agree** (a diff, a direct string comparison), run as its
own step immediately before packaging, not assumed from having written
both files carefully. Two genuinely different files were checked this
way in this build and one real mismatch was found; the other confirmed
clean. Both outcomes were only knowable by actually running the check.

---

## Summary — the five habits this build reinforced or established, for quick reference

1. **A screenshot or direct user statement outranks stored memory** —
   check memory against fresh evidence, don't treat memory as
   ground truth by default (Part 1.1).
2. **Read the real file, not its summary** — this held across three
   separate contexts in one build (a prior contract's source, Part
   1.2; a prior challenge function before diverging from it, Part 3;
   a prior frontend hook before reusing it, Part 6.1). This is the
   single most repeated lesson in this document.
3. **A framework test asserted as "pass" needs an explicit
   stress-test, not just a narrative sense that it's probably fine**
   — this is what the two-method version's Test-4 failure actually
   was (Part 4.2).
4. **When an evidence source's discovery mechanism relies on
   unconfirmed fetch-tool behavior (redirects, in this case), route
   around the unknown via a more auditable canonical source rather
   than gambling on the assumption** (Part 2.1) — this is a new,
   generalized instance of the same discipline Bug 9 already
   established for GitHub commit URLs.
5. **A claimed improvement or a claimed consistency between files is
   not confirmed until it's mechanically checked** — grep the
   finished file for the specific line that proves the claim (Part
   3.2), or diff/directly-compare the two files that are supposed to
   agree (Part 6.3). This closes the loop between "I said I did X"
   and "X is actually true in the artifact," and this build caught
   real, otherwise-invisible problems specifically by doing this.
