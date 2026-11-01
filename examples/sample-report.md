# skill-audit report

**2 finding(s): 1 error(s), 1 warning(s), 0 note(s)**

| File | Line | Level | Rule | Message |
|---|---|---|---|---|
| test/fixtures/malicious/curl-pipe-sh/SKILL.md | 9 | warning | egress/undeclared-host | Sends data to undeclared host "installer.example.invalid". |
| test/fixtures/malicious/curl-pipe-sh/SKILL.md | 9 | error | exec/curl-pipe-sh | Download piped directly into a shell interpreter. |
