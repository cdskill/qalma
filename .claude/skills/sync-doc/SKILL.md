---
name: sync-doc
description: Synchronise la documentation (apps/docs) avec la librairie @qalma/editor (libs/editor) après un changement de code. À déclencher quand on modifie libs/editor et qu'on veut vérifier/mettre à jour la doc — uniquement si le changement touche la surface publique réellement documentée. Ignore les refactos internes, tests et changements privés.
---

# sync-doc

Garde la doc `apps/docs` alignée sur le **contrat public** de `@qalma/editor`
(`libs/editor`). Le but n'est PAS de re-documenter à chaque commit, mais de
détecter quand un changement de code rend la doc **fausse ou incomplète**, et de
corriger uniquement ce qui le nécessite.

## Principe directeur

Ne synchronise **que** si le changement touche le contrat public documenté :

| Doc-pertinent (→ sync) | Non doc-pertinent (→ ignorer) |
|---|---|
| Export ajouté/supprimé/renommé dans `index.ts` | Helper privé, fonction non exportée |
| Signature publique modifiée (params, type de retour, options) | Refacto interne à contrat identique |
| `@Input` / `@Output` / sélecteur de composant changé | Tests (`*.spec.ts`), fixtures |
| Valeur par défaut / option publique d'un plugin changée | Commentaires, formatage, renommage interne |
| Comportement décrit par une page de doc qui change | Perf/optimisation sans impact d'API |

En cas de doute : un changement est doc-pertinent **uniquement** s'il est
observable par un consommateur qui n'importe que depuis `@qalma/editor`.

## Ancrages du repo

- **Surface publique** : `libs/editor/src/index.ts` (re-exporte les plugins,
  l'éditeur, la toolbar, les commandes). C'est la source de vérité du contrat.
- **Doc** : `apps/docs/src` — pages Analog (`src/app/pages/**`) et, à terme,
  contenu markdown (`src/content/**` / pages `.md`).
- **Package documenté** : `@qalma/editor`.

## Workflow

### 1. Déterminer le set de changements

Argument optionnel : une plage git (`$1`, ex. `main...HEAD`, `HEAD~3`).
Par défaut : working tree (non commité), sinon `HEAD~1`.

Lance le détecteur d'impact :

```bash
bash .claude/skills/sync-doc/scripts/detect-doc-impact.sh "$ARGS"
```

Il liste, parmi les fichiers changés sous `libs/editor/src` :
- ceux qui touchent un **module exporté** depuis `index.ts` (→ candidats sync) ;
- pour chaque symbole concerné, les **pages de doc qui le mentionnent** ;
- les **exports sans page de doc** (→ doc manquante à créer).

S'il ne ressort **aucun** candidat → la doc n'a rien à synchroniser. Dis-le et
arrête-toi là (ne touche à rien).

### 2. Qualifier chaque changement

Pour chaque fichier candidat, lis le `git diff` réel et classe selon le tableau
ci-dessus. Écarte explicitement les changements non doc-pertinents. Ne garde que
les deltas de contrat public (nouvel export, signature, `@Input`/`@Output`,
sélecteur, option/valeur par défaut, comportement documenté).

### 3. Cartographier code → doc

Pour chaque delta retenu :
- **Page existante trouvée** (le détecteur l'a matchée) → cette page doit être
  mise à jour. Note précisément quoi (ex. « ajouter l'option `placeholder` au
  tableau d'options du plugin »).
- **Export public sans page** → doc manquante. Propose la création d'une page
  (n'invente pas le contenu : dérive-le des signatures et du JSDoc du code).
- **Export supprimé/renommé encore mentionné dans la doc** → corrige/supprime
  les références obsolètes (priorité haute : la doc est *fausse*).

### 4. Proposer un plan, puis appliquer

Présente un plan court : `fichier doc` → `changement` → `raison (delta de code)`.
Puis applique les éditions. Reste fidèle au code : titres de sections, noms
d'options, signatures et exemples doivent matcher la source de `libs/editor`.
Ne reformule pas la prose existante au-delà du nécessaire.

### 5. Vérifier

```bash
nx build docs   # le prerender SSG échoue si une page/route est cassée
```

Si des liens internes ou des exemples de code ont changé, vérifie qu'ils
compilent/résolvent. Rapporte ce qui a été synchronisé et ce qui a été
délibérément ignoré (et pourquoi).

## Garde-fous

- N'invente jamais d'API : tout ce qui est documenté doit exister dans
  `libs/editor/src`. Si un symbole n'est pas exporté depuis `index.ts`, il n'a
  pas à apparaître dans la doc.
- Ne crée pas de page de doc pour un export interne/utilitaire qui ne fait pas
  partie de l'usage public.
- En l'absence de changement doc-pertinent, ne produis aucune édition.
