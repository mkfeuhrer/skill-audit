# Security policy

## Scope

- The scanner itself: crashes, false negatives on the shipped rules, and
  anything that lets a scanned skill influence its own scan result
  (suppression smuggling is the class we care about most).
- Rule quality: reproducible false positives and false negatives with a
  fixture.

Out of scope: skill *content* you found with the tool. Report malicious
skills to their marketplace or host, and to the
[CSA](https://cloudsecurityalliance.org) / vendor response channels
documented in their research.

## Reporting a vulnerability

Please use
[GitHub's private vulnerability reporting](https://github.com/mkfeuhrer/skill-audit/security/advisories/new).
Do not open a public issue for anything exploitable.

Include: the commit you tested, a minimal corpus that reproduces it, and the
expected vs actual behavior. If it is a suppression-smuggling shape, include
the exact file layout (where the ignore file sat, what it contained).

## Expectations

- You will get an acknowledgment within a few days.
- Fix and disclosure happen via a GitHub security advisory, credited to you
  unless you prefer otherwise.

## Design commitments

- Zero runtime dependencies. The npm package ships only what is in `src/`
  and `bin/`; `devDependencies` never reach users.
- No network calls, no telemetry, no config evaluation. The scanner reads
  files and writes a report.
- Suppressions are read from the working directory only, and inline allows
  are opt-in — so the content being scanned cannot silence the scanner by
  default.
