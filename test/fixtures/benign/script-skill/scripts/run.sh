#!/usr/bin/env bash
set -euo pipefail

git fetch origin --prune
git status --short
