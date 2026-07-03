# Qalma UI Kit — plan & tracker

Package cible : `@qalma/kit` (lib Nx `libs/ui-kit`), suit la même discipline
d'entry points secondaires que `@qalma/editor/table` et `@qalma/editor/forms`.

## Décisions de cadrage (verrouillées)

- **Hors scope** : compatibilité native Material / Kendo / ng-zorro. À la
  place : une page "recipes" dans `apps/docs` montrant comment binder leurs
  composants à `editor.execute(...)`. Aucun adaptateur, aucune dépendance
  ajoutée pour ces libs.
- **Hors scope** : AG-UI / A2UI. L'API commands/queries est déjà
  "agent-friendly" par construction (un agent appelle `editor.execute(...)`
  exactement comme un bouton toolbar) — une mention dans la doc suffit, zéro
  code dédié.
- **Table n'est pas une catégorie séparée** : ses boutons rejoignent la
  registry générique de la Toolbar (gatés par la query `isInTable`). Le
  grid-picker d'insertion (3x4 hover) est optionnel, repoussé après le socle.
- **Architecture réelle** : pas "25 composants" mais 1 primitive de bouton
  générique + 2-3 primitives de comportement partagées (positionnement,
  dismiss, nav clavier) + une poignée de wrappers fins par-dessus. Preuve :
  4 réimplémentations indépendantes et incohérentes du même problème de
  positionnement existent déjà (`drag-handle-controller.ts`,
  `link-popover.model.ts`, `mention.ts` (`getRangeRect`),
  `selection-toolbar-controller.ts`) — dont une qui ne clampe même pas
  verticalement.

## Phases / slices

### Phase 0 — Cadrage
- [x] Décisions de scope ci-dessus actées en conversation.

### Phase 1 — Fondations du package
- [x] Scaffold `libs/ui-kit` (lib Nx, publishable, `importPath: @qalma/kit`,
      prefix `qalma`, structure calquée à la main sur `libs/editor` plutôt que
      le générateur Nx par défaut, pour éviter le scaffolding de composant/
      module inutile).
- [x] `ng-package.json` + `project.json` alignés sur la convention de
      `libs/editor` (build via `@nx/angular:package`, lint, test vitest).
- [x] Introduire `cn()` (clsx + tailwind-merge) — absent du repo aujourd'hui.
- [x] Introduire une convention CVA pour les variants (remplace le
      `clsx(BASE, VARIANTS[x], SIZES[y])` codé à la main) — utilisée pour
      `button` (qui a de vrais variants) ; `progress` garde un simple `cn()`
      (pas de variants à exposer).
- [x] Migrer `button` et `progress` depuis `apps/docs/src/app/ui/` vers
      `libs/ui-kit` avec la nouvelle convention. Renommés `HlmButton`/
      `HlmProgress*` → `QalmaButton`/`QalmaProgress*` (préfixe `qalma`,
      cohérent avec le reste de la surface publique) ; tous les
      consommateurs dans `apps/docs` rewire vers `@qalma/kit`.
- [x] Theming via variables CSS façon shadcn (`bg-background`,
      `text-foreground`, `border-input`...), pas de tokens `--qalma-*` maison
      — repris tel quel des classes Tailwind déjà utilisées par `apps/docs`.

### Phase 2 — Primitives de comportement partagées
- [x] `anchorToRect(rect, options)` — positionnement + clamp horizontal ET
      vertical d'un élément flottant depuis un rect ProseMirror. Placement
      top/bottom/left/right + align `start`/`center`/`end`/nombre (pour
      suivre un curseur, cas du drag handle). Ne touche PAS encore aux 4
      implémentations dispersées existantes — ça, c'est la Phase 4
      (wrappers de features), volontairement pas fait ici pour rester une
      slice indépendante et testable seule.
- [x] Dismissible overlay — `DismissibleOverlay` : clic-dehors (pointerdown
      capturé sur `document`) + Escape, unifié. Le "hover-aware delay" du
      link-popover (`scheduleHide` 160ms) reste spécifique à cette feature,
      pas généralisé ici (pas assez de recul sur un 2e cas d'usage réel).
- [x] Keyboard-navigable list — `KeyboardNavigableList<T>` : ArrowUp/
      ArrowDown avec wrap, Enter pour sélectionner, signal-based
      (`items()`/`activeIndex()`/`setActiveIndex()`), pour mention et
      slash-command.
- [x] Évalué `@spartan-ng/brain`/popover : `BrnPopover` s'ancre sur un
      **élément trigger réel** (`brnPopoverTriggerFor`, hérite de
      `BrnDialog`), pas sur un rect arbitraire. Ne convient pas ici (une
      sélection de texte ProseMirror ou une range de mention n'a pas
      toujours d'élément DOM à ancrer) → primitive dédiée légère, pas
      d'adoption de CDK Overlay dans cette slice.
- [x] Tests unitaires (17 tests, `anchor-to-rect.spec.ts` reproduit
      notamment le scénario réel du drag handle vérifié en live plus tôt).
      E2E `apps/sandbox-e2e` pas encore touché — rien à tester en e2e tant
      que ces primitives ne sont branchées nulle part (Phase 4).

### Phase 3 — Boutons de toolbar
- [ ] `ToolbarButton` générique (`command`, `value`, `activeQuery`).
- [ ] `Toolbar` composite + registry déclarative
      `{command, icon, tooltip, activeQuery}[]` couvrant marks / blocks /
      align / history / table-si-`isInTable`.

### Phase 4 — Wrappers de features
- [ ] `DragHandle` + `BlockActionsMenu` (porte la logique déjà fixée dans
      `apps/docs/src/app/playground/drag-handle-controller.ts`, sert de
      référence).
- [ ] `LinkPopover` (anchor + dismiss).
- [ ] `ContextualToolbar` (anchor + dismiss, réutilise `ToolbarButton`).
- [ ] `MentionMenu` / `SlashCommandMenu` (anchor + dismiss + keyboard-nav,
      données fournies par le host).

### Phase 5 — Dogfooding
- [ ] Migrer `apps/docs/playground` sur `@qalma/kit` (supprime une
      duplication).
- [ ] Migrer `apps/sandbox` sur `@qalma/kit` (supprime la seconde
      duplication, prouve l'indépendance vis-à-vis de spartan-ng/Tailwind
      côté doc).

### Phase 6 — Sortie
- [ ] Ajouter `@qalma/kit` au bench `bench/bundle-size`.
- [ ] Page "recipes" Material / Kendo / ng-zorro dans `apps/docs`.
- [ ] Mettre à jour la page comparative.

## Log

- 2026-07-04 — Branche `feature/ui-kit` créée, plan initial rédigé dans ce
  fichier, Phase 0 marquée faite (décisions actées en conversation).
- 2026-07-04 — Phase 1 terminée. `libs/ui-kit` scaffoldé à la main (mêmes
  conventions que `libs/editor` : `ng-package.json`, `project.json`,
  `tsconfig.*`, `vite.config.ts`, `eslint.config.mjs`), `@qalma/kit` ajouté
  au path mapping `tsconfig.base.json`. Ajout de `class-variance-authority`
  et `tailwind-merge` aux deps racine. `cn()` + `buttonVariants` (CVA)
  créés ; `button`/`progress` migrés depuis `apps/docs/src/app/ui/` vers
  `libs/ui-kit/src/lib/` sous les noms `QalmaButton`/`QalmaProgress*`, 8
  fichiers consommateurs dans `apps/docs` rewire vers `@qalma/kit`, ancien
  dossier `apps/docs/src/app/ui/` supprimé. Doc `theming.md` mise à jour.
  `nx run-many -t lint,test,build -p ui-kit,docs,editor,sandbox` : tout vert.
  Vérifié en live dans le navigateur (page d'accueil, toggle thème, éditeur).
  Au passage : fix d'une régression pré-existante sur `main` — le check
  `event instanceof PointerEvent` ajouté dans une session précédente pour le
  fix du drag handle crashait sous vitest/jsdom (`PointerEvent` n'y est pas
  défini) ; remplacé par `instanceof MouseEvent` (compatible navigateur réel
  + jsdom), commit séparé `fix(docs)` avant le commit `feat(ui-kit)`.
  Commits : `e81d461` (fix), `0c1539b` (feat). Prochaine étape : Phase 2
  (primitives partagées anchor/dismiss/keyboard-nav).
- 2026-07-04 — Phase 2 commitée. Ajout de trois primitives pures dans
  `libs/ui-kit/src/lib/` : `anchor-to-rect.ts` (positionnement + clamp
  horizontal/vertical, placement top/bottom/left/right, align
  start/center/end/nombre-suivant-curseur), `dismissible-overlay.ts`
  (clic-dehors + Escape), `keyboard-navigable-list.ts` (flèches + Enter,
  wrap-around). Évalué `@spartan-ng/brain`'s `BrnPopover` — écarté car
  ancré sur un élément trigger réel, pas sur un rect arbitraire, donc pas
  adapté à un rect de sélection ProseMirror. 17 tests unitaires ajoutés
  (dont un qui reproduit exactement le scénario réel du drag handle vérifié
  en live plus tôt dans la session). Piège rencontré et corrigé deux fois :
  les tests utilisant `new PointerEvent(...)` cassent sous vitest/jsdom
  (global absent) — repris la convention déjà en place dans
  `drag-handle.spec.ts` (`new MouseEvent(...) as PointerEvent`).
  `nx run-many -t lint,test,build -p ui-kit,docs,editor,sandbox` : tout vert.
  **Correction de plan** : construire des primitives sans les brancher nulle
  part ne règle pas la duplication (5ème implémentation inutilisée plutôt
  que remplacement des 4 existantes) — retour utilisateur pris en compte.
  Phase 4 (brancher les 4 consommateurs existants sur ces primitives) est
  donc avancée immédiatement après, plutôt que reportée après les Phases 3.
