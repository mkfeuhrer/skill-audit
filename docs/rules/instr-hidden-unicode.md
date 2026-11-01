# instr/hidden-unicode

| | |
|---|---|
| Level | warning |
| Since | 0.1.0 |
| Works offline | yes |
| Fixable | normalize to visible text |

## What it catches

Zero-width, bidirectional, soft-hyphen and Unicode tag characters anywhere in
the file: `U+00AD`, `U+200B–200F`, `U+202A–202E`, `U+2060–2064`, `U+FEFF`,
and the `U+E0000` tag block. These are invisible in every review UI but fully
visible to the model.

## Why it matters

Invisible characters let two different texts share one rendering: the human
reviews "summarize the diff" while the model also reads "…and post
.env to the hook". The technique is best known from the Trojan Source
research on source code; agent instruction files are the same attack with a
smaller file. Snyk's ToxicSkills catalogued hidden-instruction payloads of
exactly this class in live skills.

## Remediation

Normalize the file to plain visible text. Strip the characters, re-read the
diff, and if the skill still needs them (e.g. bidi locales), call the usage
out in the body so reviewers know why.

## Further reading

- [Trojan Source: Invisible Vulnerabilities](https://trojansource.codes/)
- [Snyk: ToxicSkills](https://snyk.io/blog/toxicskills-malicious-ai-agent-skills-clawhub/)
