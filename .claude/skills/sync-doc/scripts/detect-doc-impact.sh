#!/usr/bin/env bash
#
# detect-doc-impact.sh — détecte les changements de libs/editor susceptibles
# d'impacter la doc apps/docs, en se basant sur la surface publique (index.ts).
#
# Usage:
#   detect-doc-impact.sh [git-range]
#     (def) working tree (non commité + staged), sinon fallback HEAD~1
#     ex.   detect-doc-impact.sh main...HEAD
#           detect-doc-impact.sh HEAD~3
#
# Sortie : 3 sections (candidats sync / pages doc concernées / exports sans doc).
# Heuristique de départ — affine le jugement à la lecture du diff réel.

set -euo pipefail

ROOT="$(git rev-parse --show-toplevel)"
LIB="libs/editor/src"
INDEX="$LIB/index.ts"
DOCS="apps/docs/src"
RANGE="${1:-}"

cd "$ROOT"

# --- 1. Fichiers changés sous libs/editor/src -------------------------------
if [ -n "$RANGE" ]; then
  changed="$(git diff --name-only "$RANGE" -- "$LIB" || true)"
else
  changed="$( { git diff --name-only -- "$LIB"; git diff --cached --name-only -- "$LIB"; } | sort -u )"
  if [ -z "$changed" ]; then
    changed="$(git diff --name-only HEAD~1 -- "$LIB" 2>/dev/null || true)"
    [ -n "$changed" ] && echo "ℹ️  Aucun changement non commité — fallback sur HEAD~1." >&2
  fi
fi
changed="$(printf '%s\n' "$changed" | sed '/^$/d' | sort -u)"

if [ -z "$changed" ]; then
  echo "✅ Aucun changement sous $LIB — rien à synchroniser."
  exit 0
fi

# --- 2. Modules ré-exportés depuis index.ts ---------------------------------
# Extrait les chemins des `export * from './lib/...'` → forme libs/editor/src/lib/...
exports="$(grep -oE "from '\\./[^']+'" "$INDEX" | sed -E "s/from '\\.\\///; s/'//" || true)"

echo "═══ Fichiers changés sous $LIB ═══"
printf '%s\n' "$changed" | sed 's/^/  • /'
echo

echo "═══ Candidats sync (touchent la surface publique) ═══"
public_hits=""
for f in $changed; do
  rel="${f#"$LIB"/}"             # ex: lib/plugins/link.ts
  stem="${rel%.ts}"             # ex: lib/plugins/link
  if [ "$rel" = "index.ts" ]; then
    echo "  ⚑ index.ts — la surface d'export elle-même change (TOUJOURS doc-pertinent)"
    public_hits="$public_hits index.ts"
  elif printf '%s\n' "$exports" | grep -qx "$stem"; then
    echo "  ⚑ $f → exporté publiquement ($stem)"
    public_hits="$public_hits $stem"
  else
    echo "  · $f → pas directement ré-exporté (probablement interne — vérifier le diff)"
  fi
done
[ -z "$public_hits" ] && echo "  (aucun — changements vraisemblablement internes)"
echo

# --- 3. Pages de doc qui mentionnent les symboles concernés -----------------
echo "═══ Pages de doc concernées / exports sans doc ═══"
for stem in $public_hits; do
  [ "$stem" = "index.ts" ] && continue
  name="$(basename "$stem")"   # ex: link
  # Symboles exportés par le module (heuristique : noms exportés)
  symbols="$(grep -hoE "export (const|function|class|interface|type|enum) ([A-Za-z0-9_]+)" \
              "$LIB/$stem.ts" 2>/dev/null | awk '{print $3}' | sort -u || true)"
  # Cherche le nom du module + ses symboles dans la doc
  pattern="$name"
  for s in $symbols; do pattern="$pattern|$s"; done
  matches="$(grep -rlE "$pattern" "$DOCS" 2>/dev/null || true)"
  if [ -n "$matches" ]; then
    echo "  ✎ '$name' documenté dans :"
    printf '%s\n' "$matches" | sed 's/^/      → /'
  else
    echo "  ＋ '$name' exporté mais AUCUNE page de doc ne le mentionne (doc manquante ?)"
  fi
done

echo
echo "→ Lis maintenant le \`git diff\` de chaque candidat pour confirmer le caractère"
echo "  doc-pertinent (cf. tableau dans SKILL.md) avant toute édition."
