#!/usr/bin/env bash
# Render build script (run from backend/).
# Render does not carry ~/.cache from build to runtime, so we copy Prisma's
# query-engine binary into backend/, which is the first path Prisma checks.
set -euo pipefail

pip install -r requirements.txt
prisma generate
prisma py fetch

ENGINE_NAME="prisma-query-engine-debian-openssl-3.0.x"
SEARCH_DIRS=("${PRISMA_BINARY_CACHE_DIR:-}" "$HOME/.cache/prisma-python")
ENGINE_SRC=""
for dir in "${SEARCH_DIRS[@]}"; do
  [ -n "$dir" ] && [ -d "$dir" ] || continue
  ENGINE_SRC=$(find "$dir" -type f \( -name "$ENGINE_NAME" -o -name "query-engine-debian-openssl-3.0.x" \) | head -n 1)
  [ -n "$ENGINE_SRC" ] && break
done

if [ -z "$ENGINE_SRC" ]; then
  echo "ERROR: Prisma query engine binary not found after fetch" >&2
  exit 1
fi

cp "$ENGINE_SRC" "./$ENGINE_NAME"
chmod +x "./$ENGINE_NAME"
echo "Copied Prisma engine from $ENGINE_SRC to $(pwd)/$ENGINE_NAME"

prisma db push
python -m scripts.backfill_question_skills
