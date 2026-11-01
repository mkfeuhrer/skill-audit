#!/usr/bin/env bash
# skill-audit install gate: audit a skill repo before it enters your agent's context.
#
# usage: ./install-gate.sh owner/repo
#
# Clones shallowly into a temp dir, runs skill-audit over it, and only
# prints the go-ahead when no error-level finding is present. Swap in
# --fail-on warning for a stricter gate. Nothing from the repo is ever
# executed — only read.

set -euo pipefail

repo="${1:?usage: install-gate.sh owner/repo}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

echo "==> cloning ${repo} (shallow, read-only)"
git clone --quiet --depth 1 "https://github.com/${repo}.git" "$tmp/skill"

echo "==> auditing"
npx skill-audit "$tmp/skill" --fail-on error

echo "==> no blocking findings in ${repo} — safe to install:"
echo "    npx skills add ${repo}"
