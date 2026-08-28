# LESSONS.md — DomainClaim build (Aug 2026)

Standalone record of how this build actually went, written for a future
session with no memory of this conversation — the same purpose as
SentinelSLA's own LESSONS.md. Structured the same way: confirmed facts
stated as rules, each with its evidence, not narrative.

**Unlike SentinelSLA's own LESSONS.md, the generalizable rules below
have NOT been folded into Project Knowledge** — by explicit user
choice, Project Knowledge doesn't get updated on every app. This file
is the only place these rules live. If a future session is working on
a different app and hasn't read this file, it will not automatically
know any of Part 0's rules — they aren't in the shared document the
way Bugs 1–10 are. Part 0 below is written to stand alone for that
reason: read it before starting a new build even outside DomainClaim's
own repo, since these six rules are general project discipline, not
DomainClaim-specific facts. Parts 1–7 are this build's own dated
story — the evidence and reasoning behind Part 0's rules, plus
everything that's genuinely specific to DomainClaim itself, including
a real portal rejection and its fix (Part 7).

---

## Part 0 — General rules from this build, not yet in Project Knowledge

These five are written to be usable on their own, without needing the
rest of this file's DomainClaim-specific context. If Project Knowledge
is ever bulk-updated in the future, these are the candidates — until
then, this is where they live.

### 0.1 Fresh evidence outranks stored memory

When a screenshot, a direct user statement, or any other fresh
evidence conflicts with what memory currently says (a score, a status,
a "not yet submitted"), the fresh evidence wins, and the gap is worth
understanding before proceeding rather than silently papered over —
memory updates in the background and can be genuinely stale, not
wrong at the time it was written. See Part 1.1 below for exactly what
this caught on this build.

### 0.2 Read the real file, not its summary — especially before reusing or diverging from a pattern

A memory-catalog summary, or a prior build's own docstring describing
itself, is a compressed, lossy pointer — treat it as "go read the real
file," not as a substitute for reading it. This held across three
separate moments in this one build: a prior contract's actual source
had more rigor than its memory summary implied (Part 1.2); a real,
generalizable improvement over a prior challenge function was only
visible from its actual body, not its docstring (Part 3); a
confirmed-working frontend hook was correctly adapted from the real
file, not reconstructed from a description of the pattern (Part 6.1).
This is the single most repeated lesson from this build — worth
checking on every future build, not treated as a one-off practice.

### 0.3 A framework test asserted as "pass" needs an explicit stress-test

Concluding "this concept probably has depth potential" narratively is
not the same as checking whether it actually has a second act — a
real non-terminal state, a real party who can contest an outcome.
When a concept's Test 4 pass is asserted, ask explicitly: does the
evidence source have a property that could make a resolved verdict
genuinely become wrong later, and does the design let anyone act on
that? A challenge/dispute layer added to satisfy this should come from
the evidence source's own real-world properties (see Part 4.3's RDAP
example) — not imported from a different concept's shape just because
it worked there, which is scope-creep dressed as depth.

### 0.4 Don't depend on an unconfirmed redirect; route around it

When an evidence source's own documentation describes discovery via
HTTP redirect rather than a direct data response, and the fetch
tool's redirect-following behavior isn't independently confirmed, this
is the same risk category as a fetch returning something
plausible-looking but structurally wrong with no obvious error (the
same class of bug as GitHub commit URLs returning HTML instead of
diff content). Either confirm the fetch tool's redirect behavior
directly, or — usually simpler either way — find the non-redirecting
canonical source underneath the convenience layer and resolve it
deterministically in contract code instead. See Part 2.1 for the exact
case this caught on this build (rdap.org vs. IANA's static bootstrap
file).

Relatedly: when an evidence source can signal the same real-world fact
through multiple, non-uniformly-implemented mechanisms (see Part 2.2 —
RDAP's several ways of signaling privacy redaction), write the
judgment prompt to ask the semantic question the mechanisms are all
trying to answer, not to parse any one mechanism's exact wire format.

### 0.5 A claimed improvement or claimed consistency isn't confirmed until it's mechanically checked

Saying "I did X" in a docstring or a comment is not the same as X
being true in the finished artifact. Grep the finished file for the
specific line that proves a claimed fix or improvement is actually
present (Part 3.2). Diff or directly compare any two files that are
supposed to agree — a README tagline against a description file, a
packaged contract against the exact version that was live-tested —
immediately before packaging, not assumed from having written both
carefully (Part 6.3). Run these as their own explicit step; this build
caught two real, otherwise-invisible problems specifically by doing
this, not by re-reading more carefully.

### 0.6 State id-consumption and transaction-sequence status proactively during live testing

When a test plan includes a deliberately-invalid call to confirm a
revert path works, say explicitly at the time whether a failing call
will consume an auto-incrementing id — don't wait for a resulting
mismatch to explain it after the fact (see Part 5.1). At natural
checkpoints in a long live-testing sequence (e.g. moving into a new
phase like a challenge round), proactively restate the full
transaction sequence so far as a short numbered list — method, result,
in order — rather than only reconstructing it reactively once the
person expresses confusion (see Part 5.2).

### 0.7 A concept can pass Test 1 as written and still let anyone assert someone else's claim

Test 1 asks "who benefits from a false verdict" — DomainClaim answered
that correctly the first time (a claimant benefits from a false
control_confirmed). But a real portal rejection (Part 7 below) found a
gap Test 1's question doesn't directly probe: the verdict verified an
ABSTRACT fact ("does this identity string match RDAP's public text")
rather than a fact SPECIFIC TO THE CALLER ("does the person calling
this method right now actually control this domain"). Nothing checked
`gl.message.sender_address` against the domain at all — anyone could
type a well-known company's name into `claimed_identity` for a domain
that company owns but they don't, and reach `control_confirmed` purely
by knowing the right string, no relationship to the domain required.
**The added check, for any future concept:** after confirming who
benefits from a false verdict, ask separately — does reaching the
favorable verdict require proving something specific to the caller
(their identity, their control, their authorization), or does it only
require asserting a fact that's true regardless of who's asking? If
it's the latter, the concept verifies the wrong thing even though Test
1 technically "passes" — and needs a genuine caller-binding mechanism
(a signed challenge, a DNS/file-based control proof, an on-chain
credential check) before it's actually sound. This is a different
failure mode than 0.4/0.5's evidence-source-quality lessons: those are
about whether the EVIDENCE is trustworthy; this is about whether the
evidence, however trustworthy, is even bound to the right PERSON.

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

## Part 7 — The real portal rejection, and the fix (Aug 24-25 2026)

Everything in Parts 1-6 describes the build that got submitted and
rejected. This part covers what happened after: a real reviewer
verdict, a real structural gap, and the fix — the single most
consequential thing that's happened to this contract, and the reason
Part 0.7 exists.

### 7.1 The verbatim rejection

Submitted Aug 24 2026 to the Projects track. Rejected Aug 25 2026.
Verbatim reviewer feedback: *"control_confirmed only matches public
RDAP identity text and never proves the filer controls the domain. A
stronger version should bind the caller to a DNS or signed ownership
challenge and test the void/challenge lifecycle end to end."*

This is worth reading exactly, not summarized, because the precision
matters: the reviewer named the specific verdict label
(`control_confirmed`), the specific mechanism gap (identity text vs.
filer proof), and the specific fix category (DNS or signed challenge)
— all three in one sentence, with no ambiguity about what needed to
change.

### 7.2 What the gap actually was, and why the framework didn't catch it

Test 1 (concept evaluation) was run correctly and DomainClaim
genuinely passed it: a claimant benefits from a false
`control_confirmed`, a true registrant benefits from a false verdict
the other way. But Test 1's question — "who benefits from a false
verdict" — is about the STAKES, not about whether the mechanism
verifies the right thing to determine the verdict honestly. The
contract could correctly identify that stakes existed, build a
technically rigorous nondet/consensus/challenge apparatus around
judging RDAP text, and still never check whether
`gl.message.sender_address` (the actual caller) had any relationship
to the domain being judged at all. Two different callers, one who
truly owns `example.com` and one who's never touched it, would receive
the identical `control_confirmed` verdict for the identical
`claimed_identity` string — the contract had no way to tell them
apart. This is now written up as a new, generalized concept-evaluation
principle in Part 0.7 above: Test 1 needs a companion check asking
whether the verdict binds to the specific caller or only to an
abstract, caller-independent fact.

### 7.3 Why appeal was rejected as the response, and resubmit was chosen instead

The portal offers two paths on a rejection: appeal (one per
submission, asking a reviewer to reconsider with missed context) or
resubmit-corrected (a new, editable copy of the submission, consuming
a fresh weekly Project-track slot — confirmed directly from the
portal's own "1 of 2 Project slots used this week" UI state at
resubmission time, not assumed). Appeal was explicitly ruled out: the
reviewer's finding was correct, not a case of missed context, so
appealing would have asked a reviewer to reverse a correct decision.
Resubmit-with-a-real-fix was the honest path, and it also preserves
the one available appeal for a future case where it's actually
warranted rather than spending it here.

### 7.4 The fix mechanism, chosen and researched before writing code

Three real design questions were worked through, in order, before any
code changed:

**Which proof mechanism — DNS or HTTP well-known-path?** The reviewer
named both as acceptable ("DNS or signed ownership challenge"). DNS
TXT was chosen deliberately over HTTP well-known-path for a specific,
stated reason: DNS-zone control (the ability to publish an arbitrary
record under a domain) is the SAME level of access as changing that
domain's nameservers or registrar — genuine domain control. HTTP
well-known-path control can be true of a subdomain host or a
CDN/reverse-proxy operator who doesn't control the domain's
registration at all — a real, weaker guarantee for the exact question
this concept needs answered. This is also the pattern real systems
(ACME/Let's Encrypt DNS-01, Google Search Console, Cloudflare) use for
exactly this purpose, not an invented mechanism.

**How to query DNS from a GenVM contract with no native DNS
primitive?** GenVM's documented nondet capabilities are web fetch and
LLM calls — no confirmed native DNS-lookup tool. Rather than assume
one exists or guess at a workaround, DNS-over-HTTPS (a real, documented
JSON-over-HTTP API — Cloudflare's `cloudflare-dns.com/dns-query`) was
used, fetched via the exact same `gl.nondet.web.get()` mechanism
already proven for RDAP and IANA bootstrap fetching. Before writing
the parser, `gl.nondet.web.get()`'s support for custom headers (this
endpoint requires `Accept: application/dns-json`) was confirmed
directly against GenLayer's own SDK reference page
(`sdk.genlayer.com/main/api/genlayer.html`), which documents `.get()`,
`.post()`, `.delete()`, `.head()`, and `.patch()` as all accepting a
`headers: dict[str, str | bytes]` keyword argument — not assumed or
guessed at.

**A real, load-bearing gotcha found via research, not discovered
live:** Cloudflare's DoH JSON response returns TXT record values WITH
the DNS wire-format quote characters still embedded in the string — a
TXT record whose real value is `hello` comes back as the four-
character-longer string `"hello"`, quotes included. Confirmed via
multiple independent sources: a real bug report showing unescaped
embedded quotes in this exact response shape (later fixed), and
Cloudflare's own documentation noting no formal IETF RFC governs this
JSON schema at all, so behavior isn't guaranteed uniform across
providers. The comparison logic strips a single leading and trailing
quote character defensively, rather than assuming zero, one, or two
layers of quoting — the same defensive posture this contract's
existing `_coerce_*` helpers already apply to LLM output, now
confirmed to generalize to a different untrusted-format boundary (a
public API's own response encoding, not an LLM's).

### 7.5 A design decision that mattered as much as the mechanism itself: what does "not verified" mean, and does it need the LLM at all?

Two decisions here, both worth stating explicitly since getting either
wrong would have reintroduced a version of the same rejected gap in a
new place:

**DNS verification is fully deterministic — no LLM involved.** A TXT
record equality check needs no interpretation, unlike judging whether
RDAP identity text supports a claim. Running it through the LLM would
have been pure overhead and a new, unnecessary source of
non-determinism for a question with a definite yes/no answer. The
final leader/validator design keeps the LLM scoped to exactly what it
was always scoped to (the RDAP-identity question) and does the DNS
check as plain, independently-re-derivable Python inside the same
nondet closure — two genuinely separate signals combined
deterministically, not blended into one fuzzier judgment.

**The LLM's own output must never be trusted to directly assert
`control_confirmed` or grant itself ownership proof — but this was
originally implemented wrong, caught, and fixed within the same
editing session.** The first version of this fix HARD-REJECTED
(`raise gl.vm.UserError`) any raw LLM output containing "control_
confirmed" or "ownership_unverified" as its verdict string, reasoning
that these were "reserved labels" only the deterministic DNS check
should assign. On reflection this was actually wrong and would have
broken every legitimate resolution: the charter correctly invites the
LLM to say "RDAP text supports this identity," and the natural word
for that is `control_confirmed` — rejecting it outright would fail
every well-behaved response. The corrected design: the LLM's raw
`control_confirmed` output is treated as a legitimate but NON-FINAL
signal ("RDAP text supports this," nothing about DNS), and Python code
downstream re-derives the actual final verdict by combining that
signal with the independently-checked `dns_verified` boolean — the LLM
is never blocked from saying `control_confirmed`, it's simply never
trusted as the last word on it. **The lesson:** when adding a
deterministic override for an LLM-produced label, the instinct to
"reject the label outright so the deterministic check is authoritative"
is usually wrong — it conflates "don't trust this value as final" with
"don't allow this value to be produced at all," and the second one
breaks legitimate output. The correct pattern is: let the label
through, then re-derive the trusted final value from it plus the
deterministic signal — never gate on the raw label's mere presence.
This was caught by re-reading the just-written code with the actual
charter's instructions in mind, not by live testing — worth noting as
a case where catching a self-introduced bug happened during the
writing itself, not the audit pass afterward.

### 7.6 The frontend needed a structural change, not a patch, once resolve could legitimately wait on the caller

The original frontend fired `file_claim` then `resolve_claim`
automatically, back to back, in one handler — reasonable when
resolution depended only on RDAP. Once resolution could also depend on
a DNS record the caller needs time to go publish, auto-resolving
immediately would produce `ownership_unverified` for essentially every
caller, even ones who fully intended to verify, just because they
hadn't had time to act yet. The fix split filing and resolving into
two explicit UI steps with the DNS instructions surfaced in between —
not a visual tweak, a real change to the interaction model driven
directly by the contract's own new two-signal design. **The lesson:**
when a contract change adds a legitimate reason for a caller to pause
mid-flow (here: go do something off-chain before the next call), check
whether the frontend's existing flow assumes uninterrupted automation
— it may need restructuring, not just new fields rendered into the
same shape.

### 7.7 Every downstream artifact needed the same fix propagated, checked explicitly rather than assumed complete

Beyond the contract's core logic, six more places needed the same
four-verdict, DNS-aware shape and were checked one at a time, not
assumed to inherit correctness from the contract alone: the
`resolve_challenge` path (an `OVERTURN` reaching `control_confirmed`
needed its own independent DNS re-check — a challenge that could
reinstate the exact rejected gap in a second code path would have been
a real, embarrassing miss); both charters' prose (an LLM told nothing
about the new DNS-gating would have no way to understand why its
output might get overridden); the storage model and every view method
(a new field silently missing from a response is a silent regression);
and the docstring itself (a docstring still describing the old
three-verdict, RDAP-only design would be actively misleading to a
future reader, worse than no docstring at all). Each was checked via
direct grep or read-through against the finished file, matching Part
0.5's existing discipline, not assumed complete because the core fix
was done.

---

## Part 8 — Second review cycle: "More Information Needed" on the DNS-fix resubmission (Aug 26 2026)

The fixed version from Part 7 was pushed and resubmitted, and passed
the first rejection's specific concern (RDAP-text-only
`control_confirmed`) — but a steward (Pavel Kolosov) came back with
four more specific, narrower gaps in the SAME resubmission review, not
a second full rejection. This section exists because the fix pattern
here is structurally the same kind of finding as Part 7's — a real,
narrow, load-bearing gap named precisely, not a vague "needs more
polish" — and the same discipline (read the actual code the feedback
is about, don't paraphrase-and-patch) applied again, cleanly, on a
much smaller scale. Read this alongside Part 7, not instead of it.

### 8.1 The four things named, and what was actually wrong at the source level

The steward's note, read carefully against the real file rather than
assumed from its wording alone, named four genuinely distinct gaps:

1. **"Make challenge resolution reassess the fresh RDAP record against
   the claimed identity"** — already correct; `resolve_challenge`'s
   `leader_fn` already re-fetches RDAP fresh via the same
   `_fetch_domain_rdap` path `resolve_claim` uses. No fix needed here;
   confirmed by reading the code, not assumed from the feedback's
   framing.
2. **"Return validator-compatible results for RDAP failures"** — a
   real bug: the re-fetch-failure branch inside `resolve_challenge`'s
   `leader_fn` returned a dict with NO `dns_ownership_verified` key at
   all, while `validator_fn` unconditionally checks that key is in
   `("true", "false")` on every branch. `None not in (...)` is `True`,
   so `validator_fn` returned `False` unconditionally — every RDAP
   re-fetch failure during a challenge could never reach consensus,
   regardless of how many validators agreed on `REJECT`. This is
   exactly the kind of gap that's invisible until the specific code
   path executes, the same lesson as every bug in section 4's catalog.
3. **"Distinguish resolver failures from an absent TXT record"** — a
   real bug in `_resolve_dns_txt_verification`: the "no Answer list"
   branch returned `(True, False)` regardless of Cloudflare's DoH
   `Status` field, collapsing a genuine resolver failure (SERVFAIL,
   `Status: 2`) into the identical signal as an honest "caller hasn't
   published yet" (`Status: 0` with zero records, or `Status: 3`
   NXDOMAIN — both real, definitive answers). Confirmed against
   Cloudflare's own documented RCODE semantics before fixing, not
   assumed. Fixed by checking `Status` explicitly: `0`/`3` are real
   answers (`ok=True`), anything else is a resolver failure
   (`ok=False`) — and a THIRD state, `dns_status` (`verified` /
   `not_verified` / `check_failed`), was added throughout so a
   resolver hiccup no longer silently, permanently caps a claim at
   `ownership_unverified` the same way a genuinely-checked absence
   does. The pre-existing `dns_verified = bool(dns_ok and dns_matched)`
   pattern at both call sites had ALREADY been throwing this exact
   distinction away even before the helper function's own bug — fixing
   only the helper without fixing both call sites would have been an
   incomplete fix.
4. **"Avoid silently judging truncated RDAP evidence"** — a real gap:
   `_sanitize(rdap_json_text, _MAX_FETCH_LEN)` hard-truncates at 6000
   chars with zero signal to the LLM or to storage that truncation
   happened. A verbose registrar's RDAP record could be cut mid-object
   and reasoned over as if complete. Fixed with a pre-sanitize
   `_is_truncated()` check, surfaced explicitly in both prompts
   (instructing the model to prefer the "can't tell" verdict/decision
   over guessing when truncated), and threaded through both
   leader/validator pairs into a new `evidence_truncated` field stored
   on both `ClaimRecord` and `ChallengeRecord`.
5. **"Bind each new claim or challenge ID to its own finalized
   transaction instead of the latest global counter"** — checked
   against GenLayer's actual documented `gl.message` surface
   (`contract_address`, `sender_address`, `origin_address`, `value`,
   `chain_id` — confirmed via live search against
   docs.genlayer.com/developers/intelligent-contracts before writing
   anything, not assumed from memory) before deciding how to respond:
   there is no transaction-hash-shaped field exposed to contract code
   at all, so a literal "bind to the transaction" fix would have meant
   guessing at an unconfirmed API, which is precisely the mistake this
   project's own methodology (section 6) exists to prevent. The
   counters are also never touched inside a nondet closure anywhere in
   this contract, so the specific reentrancy-style bug this phrasing
   might suggest does not appear to be reachable given GenVM's
   documented per-transaction execution model. What was added instead:
   a defensive `assert cid not in self.claims` /
   `assert chid not in self.challenges` immediately after each ID is
   read, before it's used — cheap, uses only already-confirmed
   `TreeMap` semantics, and turns a silent overwrite into a loud,
   named revert if the "counters can't collide" assumption is ever
   wrong. **This is flagged here as the one item in this response
   where the fix is a defensive hardening rather than a confirmed
   root-cause fix** — if a steward comes back saying this doesn't
   address what they meant, the next step is to ask what GenLayer
   mechanism they have in mind, not to guess again.

### 8.2 The pattern from Part 7 held: fix every call site, not just the one the feedback pointed at

Item 3 above is the clearest example: the feedback's wording ("absent
TXT record") could be read as pointing only at
`_resolve_dns_txt_verification`'s internals. But the two nested
`leader_fn`s (in `resolve_claim` AND `resolve_challenge`) were ALSO
independently collapsing `dns_ok`/`dns_matched` into a single boolean
before this fix — meaning even a perfect fix to the helper function
alone would have been silently thrown away one call frame up. Reading
every call site of a function named in feedback, not just the
function's own body, is the same "propagate to every downstream
artifact" discipline Part 7.7 already named — it held again here at a
much smaller scale.

### 8.3 A genuinely new, honest gap surfaced by fixing an old one

Adding `dns_status`/`evidence_truncated` to `ClaimRecord` exposed a
question the original design hadn't needed to ask: should the
CHALLENGE record itself also carry these fields, even on `UPHOLD`/
`REJECT` where the claim's own fields correctly stay untouched? The
claim only gets its `dns_status`/`evidence_truncated` overwritten on
`OVERTURN` (by design — an upheld or rejected challenge shouldn't
touch the original resolution's stored facts). But that meant, before
this fix, `get_challenge` had NO way to show what a specific challenge
round's own re-derivation actually found on `UPHOLD`/`REJECT` — a
steward reviewing an `UPHOLD` decision couldn't tell whether it was
reached against a clean re-fetch or against truncated evidence / a
failed DNS check. This wasn't asked for directly, but leaving it out
would have been inconsistent with fixing the identical visibility gap
everywhere else in this response. Added three fields to
`ChallengeRecord` (`dns_ownership_verified`, `dns_status`,
`evidence_truncated`), written unconditionally on every
`resolve_challenge` call regardless of decision, distinct from the
CLAIM's own fields which stay conditional on `OVERTURN`. **The
lesson:** fixing a visibility gap on one path can reveal the identical
gap, previously masked, on an adjacent path that shares the same
underlying data — check for that explicitly rather than declaring the
fix complete once the originally-named path is closed.

### 8.4 What was deliberately NOT done, and why

Two things were considered and explicitly deferred rather than done
silently:
- Querying multiple independent DoH resolvers and requiring agreement,
  which would strengthen the `check_failed`/`not_verified` distinction
  further against a single resolver being wrong. This was already a
  named, deliberate gap before this review cycle (see the module
  docstring's "DELIBERATE GAPS" section) and nothing in the steward's
  feedback specifically asked for it — expanding scope here would have
  diluted a resubmission note that's already covering five distinct
  points.
- A response-time SLA or deadline-precommitment mechanic for the DNS
  ownership proof itself (e.g. "the caller has N days to publish
  before the claim expires"). Not asked for, and RDAP/DNS control is
  re-checkable indefinitely via the existing challenge mechanism
  regardless — adding a deadline here would be solving a problem this
  concept doesn't actually have.

The general rule this confirms, worth stating explicitly since it
isn't yet in Part 0: **when a steward names N specific things, fix
exactly those N things (plus anything a fix to one of them structurally
requires, per 8.3 above) and name explicitly what you're deliberately
not touching, rather than using the review cycle as an opportunity to
also fix every other named-but-deferred gap in the docstring.** A
resubmission note that says "I also fixed X, Y, Z which nobody asked
about" reads as scope drift to a reviewer checking specifically whether
the FOUR things they named got fixed, and makes that check harder.

### 8.5 STATE AS OF DEPLOYMENT (Aug 27 2026) — read this before assuming anything beyond the deploy itself is confirmed

The fixes described in this Part were deployed to StudioNet on Aug 27
2026 at `0x03E5E595834cAF1c50Eb88229eA1e6520B344b88` (deploy tx
`0xefddbaa290bd51e8fac4d8a2a055f8b81a87a79910dbee7707912b2df663c5d3`,
confirmed `SUCCESS`/`Accepted`/`FINALIZED` directly against the
explorer). This section originally said "nothing has been re-deployed"
— that is now out of date; the deploy happened. What follows replaces
that earlier state, not adds to it.

- **The deploy itself succeeded** — a genuine, meaningful signal. A
  syntax error or a GenVM schema-load failure (the exact class of
  failure `"py-genlayer:test"` used to cause, see section 3) would
  have failed here. This confirms the file is valid, loadable GenVM
  Python. It does NOT confirm any write method's logic is correct.
- **By explicit instruction, none of the four steward-named scenarios
  (or the two ID-assertion guards) have been live-tested, and this
  build will NOT be live-tested before being considered complete.**
  This is a deliberate, one-time exception to this project's own
  standing "live-test before considering it done" discipline (section
  9.2, checklist item 4) for this specific fix cycle — not an
  oversight, not a claim that testing happened and passed, and not a
  precedent for future builds. State this plainly in the resubmission
  note rather than letting the deploy's success imply more than it
  does.
- **Nothing has been pushed to the GitHub repo yet** as of this
  writing — the repo update (contract file, `LESSONS.md`, `README.md`,
  `docs/deployment.md`, `docs/contracts.md`, `docs/frontend.md`, and
  the three frontend components/pages touched for the new fields) is
  ready in this session's working copy but the actual `git push` is a
  separate, human action not yet confirmed done.
- The full section 4 ten-item nondet audit WAS run against the
  complete rewritten file (mechanically, via grep/script, per section
  13.5's confirmed process), twice, and passed clean both times. This
  confirms the fix doesn't violate any of the ten confirmed structural
  rules — it does NOT confirm the fix behaves correctly against real
  RDAP/DNS infrastructure, which only live testing (deliberately not
  done this cycle) could confirm.
- **When writing the resubmission note for this cycle:** use the
  confirmed-working "state what changed, what proves it's fixed,
  include live evidence inline" shape from project knowledge section
  10.1 — but be honest that "what proves it's fixed" here is a
  mechanical audit and a successful deploy, NOT live execution against
  real infrastructure, since that's what actually happened. Do not
  imply live verification occurred. If a steward asks for live proof
  specifically, that is the correct next request to act on, not a sign
  this response's honesty was wrong.

---



## Summary

The six general rules referenced throughout this document — fresh
evidence over stored memory, read the real file, stress-test Test 4
rather than asserting it, don't depend on unconfirmed redirects,
mechanically check any claimed improvement or consistency, and check
whether a verdict binds to the specific caller or only to an
abstract fact — are written out in full at the top of this file, in
**Part 0**, since they aren't (by explicit choice) folded into Project
Knowledge and this file is where they live. If you're revisiting this
document later and only have time to reread one section, reread Part
0 — and if you're revisiting specifically because of a rejection or a
review-cycle fix, read Part 7 as well, which is the fullest worked
example of what a real structural gap and its fix actually look like
in this project's own history.
