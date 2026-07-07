# Qalma UI Kit — plan & tracker

Package cible : `@qalma/kit` (lib Nx `libs/ui-kit`). Cette slice garde un
entrypoint public unique ; des entrypoints secondaires pourront être ajoutés
plus tard si le bench bundle-size ou des consommateurs réels montrent que le
barrel monolithique coûte trop cher.

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
      `button` (qui a de vrais variants). `progress` reste local à
      `apps/docs`, car la barre de navigation est du chrome d'application
      docs, pas une primitive éditeur réutilisable.
- [x] Migrer `button` depuis `apps/docs/src/app/ui/` vers `libs/ui-kit`
      avec la nouvelle convention. Renommé `HlmButton` → `QalmaButton`
      (préfixe `qalma`, cohérent avec le reste de la surface publique) ;
      les consommateurs button dans `apps/docs` rewire vers `@qalma/kit`.
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
- [x] Tests unitaires (18 tests, `anchor-to-rect.spec.ts` reproduit
      notamment le scénario réel du drag handle vérifié en live plus tôt).
- [x] **Branché dans les 4 consommateurs réels** (voir détail dans le log —
      retour utilisateur pris en compte, pas resté en primitives inutilisées).
      E2E `apps/sandbox-e2e` toujours pas touché — sandbox n'utilise aucune
      de ces features aujourd'hui (drag handle, link popover, mention,
      slash-command sont uniquement dans `apps/docs/playground`).

### Phase 3 — Boutons de toolbar

- [x] `QalmaToolbarButton` générique (`command`, `value`, `icon`, `label`) —
      composant élément `<qalma-toolbar-button>` (`display:contents`) qui rend
      un `<button>` interne câblé à la directive `QalmaCommand` de
      `@qalma/editor` + un `<ng-icon>`. Branché dans `PlaygroundToolbar` (34
      boutons de commande migrés, migration bit-perfect). Pas d'`activeQuery` :
      l'état actif vient de `QalmaCommand.isCommandActive`, suffisant pour les
      boutons de commande purs ; les boutons à état dérivé d'une query (color
      pickers, image/link) restent des contrôles custom hors de ce composant.
- [x] Registry déclarative (`toolbar-commands.ts`) : fragments de données purs
      `ToolbarCommandItem[]` (HEADINGS / INLINE_MARKS / ALIGN / LISTS /
      TABLE_INSERT / TABLE_OPS / HISTORY + CLEAR_FORMATTING / UNSET_LINK), plus
      un type `ToolbarTemplateItem` (échappatoire `TemplateRef` pour les
      contrôles custom intercalés). `QalmaToolbarRegistry` composite
      (`<qalma-toolbar-registry [groups]>`, `display:contents`) : rend les
      groupes séparés par un séparateur, filtre les groupes vides (pas de
      séparateur orphelin), délègue chaque item à `QalmaToolbarButton` ou à un
      `ngTemplateOutlet`. `provideQalmaToolbarIcons()` enregistre le jeu lucide
      des fragments. Branché dans `PlaygroundToolbar` : le `table-si-isInTable`
      est géré en composant la liste de groupes (`...(inTable() ? OPS : [])`).

### Phase 4 — Wrappers de features (composants réutilisables dans `@qalma/kit`)

Distinct de la Phase 2 : la Phase 2 a branché les _primitives_ dans le code
existant d'`apps/docs` (moins de duplication, bugs corrigés). Il reste à
extraire ces features en vrais composants exportés par `@qalma/kit`, que
`apps/docs` ET `apps/sandbox` pourraient tous les deux consommer :

- [x] `DragHandle` + `BlockActionsMenu` en composant `@qalma/kit`. Extraction
      des 3 fichiers (controller pur + directive adaptateur + composant
      présentationnel) depuis `apps/docs/playground` vers `libs/ui-kit`,
      renommés `Qalma*`, thème shadcn conservé bit-perfect. `DismissibleOverlay`
      (primitive Phase 2 restée sans consommateur) branchée ici pour le
      clic-dehors du menu — enfin un vrai consommateur. Menu d'actions gardé
      hardcodé (5 actions standard = commandes du DragHandlePlugin). Branché
      dans les DEUX consommateurs docs : `playground` ET `examples/notion-doc`.
- [x] `LinkPopover` en composant `@qalma/kit`. Extraction propre des 3 fichiers
      (modèle `LinkPopover`/`createLinkPopoverPlacement`/`findEditorLinkElement`,
      controller entièrement générique, composant présentationnel) — comme le
      drag-handle, aucune data app-spécifique. Renommé `QalmaLinkPopover`
      (`qalma-link-popover`), attribut `data-qalma-link-popover`, thème shadcn
      bit-perfect. Dismiss hover-delay (160ms) gardé tel quel (c'est un preview
      au survol, pas un menu → PAS de `DismissibleOverlay`). Branché dans les
      QUATRE consommateurs docs : `playground`, `comment-box`, `mail-box`,
      `product-review`.
- [x] `ContextualToolbar` en composant `@qalma/kit`. Extraction fidèle des 3
      fichiers (composant `QalmaContextualToolbar` + controller
      `QalmaSelectionToolbarController` + directive `QalmaSelectionToolbarDirective`)
      — entièrement générique comme le drag-handle/link-popover. Positionnement
      point-ancre + CSS `translate(-50%,-100%)` self-centering **conservé tel
      quel** (pas `anchorToRect`, largeur dynamique). Boutons de formatage
      hardcodés gardés (bold/italic/inline-code/monospace/link). Un seul
      consommateur : `playground`.
- [x] `MentionMenu` / `SlashCommandMenu` en composants `@qalma/kit`, avec base
      partagée `QalmaSuggestionMenu` (placement + nav clavier + highlighting +
      scroll) et primitive `flipAbovePlacement` extraite (géométrie flip-above
      dédupliquée des deux `createPlacement`, parallèle à `anchorToRect`).
      `QalmaMentionMenu` (avatar + loading) et `QalmaSlashCommandMenu` (icône +
      shortcut + header/footer, icônes auto-fournies) rendent chacun leur item ;
      types d'option kit (`QalmaMentionOption`, `QalmaSlashCommandOption`).
      Controllers restés dans l'app (data + insertion) mais consommant les types
      kit + `flipAbovePlacement`. Branché dans les TROIS consommateurs docs :
      `playground`, `examples/notion-doc`, `examples/comment-box`.

### Phase 5 — Dogfooding

- [x] Migrer `apps/docs/playground` sur `@qalma/kit` — fait de facto pendant
      les Phases 3-4 : le playground (et les exemples notion-doc/comment-box/
      mail-box/product-review) consomment désormais toolbar/registry, menus,
      drag-handle, link-popover, contextual-toolbar du kit ; plus de duplication
      côté docs.
- [x] Migrer `apps/sandbox` sur `@qalma/kit` (supprime la seconde
      duplication, prouve l'indépendance vis-à-vis de spartan-ng/Tailwind
      côté doc) :
  - [x] Thème : tokens shadcn (palette warm des docs) ajoutés à
        `apps/sandbox/src/styles.css` (`:root` + `@theme inline`, light-only,
        SANS spartan-ng) — c'est tout ce dont le kit a besoin pour se thémer.
  - [x] Toolbar : `sandbox-toolbar.ts` migré sur `QalmaToolbarRegistry` +
        fragments + `provideQalmaToolbarIcons`, contrôles custom (image/link,
        swatches couleur, select langage) en `<ng-template>` restylés shadcn
        (`TOOLBAR_BUTTON_CLASS` réutilisé). Ordre propre au sandbox préservé.
  - [x] Menus mention/slash : controllers `sandbox-mention.ts`/
        `sandbox-slash-command.ts` migrés sur les types kit +
        `flipAbovePlacement`, composants `sandbox-*-menu.ts` supprimés au
        profit de `QalmaMentionMenu`/`QalmaSlashCommandMenu`.
  - [x] Link-popover : `sandbox-link-popover.ts` +
        `link-popover-controller.ts` + `link-popover.model.ts` (copies sandbox)
        supprimés au profit de `QalmaLinkPopover` + `LinkPopoverController` du
        kit ; au passage le placement gagne le clamp vertical `anchorToRect`
        (le sandbox ne clampait pas). `app.spec.ts` repointé sur
        `QalmaLinkPopover`.

### Phase 6 — Sortie

- [x] Ajouter `ui-kit` à la configuration Nx release (`nx.json` +
      `nx-release-publish` packageRoot projet).
- [x] Ajouter la documentation `@qalma/kit` dans `apps/docs` : entrée header
      "UI Kit", **section `/kit` autonome** (sidebar scopée propre, PAS un
      groupe enfoui sous les docs éditeur), index `/kit`, pages dédiées
      (`/kit/theming`, `/kit/button`, etc.) avec preview + snippet expansible.
      Switcher `Docs | UI Kit` en tête de sidebar pour passer d'une section à
      l'autre (voir log 2026-07-06).
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
  dossier `apps/docs/src/app/ui/` supprimé. **Décision révisée le
  2026-07-05 : `progress` est ressorti du kit et restauré dans `apps/docs`,
  car c'est du chrome propre à l'application docs.** Doc `theming.md` mise à jour.
  `nx run-many -t lint,test,build -p ui-kit,docs,editor,sandbox` : tout vert.
  Vérifié en live dans le navigateur (page d'accueil, toggle thème, éditeur).
  Au passage : fix d'une régression pré-existante sur `main` — le check
  `event instanceof PointerEvent` ajouté dans une session précédente pour le
  fix du drag handle crashait sous vitest/jsdom (`PointerEvent` n'y est pas
  défini) ; remplacé par `instanceof MouseEvent` (compatible navigateur réel et
  jsdom), commit séparé `fix(docs)` avant le commit `feat(ui-kit)`.
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
- 2026-07-04 — Branchement réel des primitives dans les 4 consommateurs
  existants (PAS ENCORE COMMIT, à la demande explicite). En le faisant
  vraiment (pas juste en pensée), plusieurs choses se sont révélées :
  - **Vrai bug trouvé dans `anchorToRect`** : quand l'élément flottant est
    plus haut que le bloc ancré (cas courant — un bouton de 30px contre un
    paragraphe d'une ligne de 24px), le clamp donnait un résultat arbitraire
    au lieu de centrer. Corrigé (`resolveCrossAxis` détecte
    `size >= span` et centre), test dédié ajouté, et ça reproduit
    exactement l'ancien comportement de `drag-handle-controller.ts` pour ce
    cas (dégénère déjà en centrage pour les blocs courts).
  - **`drag-handle-controller.ts`** : `updateFromBlock` utilise maintenant
    `anchorToRect` (placement `left`, align = position du curseur). Le
    `clamp()` local et `HANDLE_VERTICAL_MARGIN` supprimés. Test existant
    (`translate3d(142px, 77px, 0)`) toujours vert sans modification —
    migration bit-perfect. Revérifié en live dans le navigateur (bouton
    aligné sur la ligne survolée, ne saute plus à l'ouverture du menu).
  - **`link-popover.model.ts`** : `createLinkPopoverPlacement` réécrite avec
    `anchorToRect` (placement `bottom`, align `start`). Corrige le vrai bug
    identifié en Phase 0 : l'ancien code ne clampait JAMAIS verticalement
    (`rect.bottom + 8` pouvait sortir de l'écran) — hauteur estimée à 56px
    (ligne unique `h-9` + padding) faute d'élément réel à mesurer au moment
    du calcul.
  - **`selection-toolbar-controller.ts` : intentionnellement PAS migré.**
    Son positionnement (point-ancre + `translate(-50%,-100%)` en CSS,
    laissant le navigateur centrer sur la taille réelle et non estimée)
    est mieux adapté à un contenu de largeur dynamique que ma primitive
    actuelle, qui a besoin d'une taille fixe en JS. Le forcer aurait
    dégradé le comportement, pas amélioré.
  - **`mention.ts` / `slash-command.ts` : positionnement intentionnellement
    PAS migré.** Leur logique maison (flip au-dessus si pas de place en
    dessous, `maxHeight` dynamique selon l'espace disponible) est plus
    avancée que ce que fait `anchorToRect` aujourd'hui — migrer aurait été
    une régression. `KeyboardNavigableList`, en revanche, EST branché dans
    les deux : `handleNavigationKey` délègue ArrowUp/ArrowDown/Enter à la
    primitive et garde Escape/Tab/Espace en local (`moveActiveOption` local
    supprimé, devenu mort). Ça a forcé une correction d'API sur la
    primitive elle-même : `handleKeydown(event: KeyboardEvent)` →
    `handleKey(key: string)`, parce que ce système relaie les touches via
    un `CustomEvent` (`detail.key`), pas un vrai `KeyboardEvent` — découvert
    seulement en essayant de brancher un 2e vrai consommateur.
  - **`DismissibleOverlay` reste non branché.** Les 4 flows de dismiss
    existants sont hétérogènes (hover-based pour le link popover,
    keydown scopé à la surface pour le contextual toolbar, boutons +
    Escape pour le drag handle menu) — aucun n'est un remplacement direct
    sans revoir aussi le comportement. Pas fait dans cette slice pour ne
    pas mélanger "brancher les primitives existantes" et "changer des
    comportements de dismiss non demandés".
  - Vérifié en live dans le navigateur : positionnement du drag handle
    (inchangé, toujours correct), navigation clavier mention (ArrowDown
    ×2 → index 2, ArrowUp → index 1, Enter → insertion + fermeture réelles)
    et slash-command (même chose + Escape → fermeture) — testé en pilotant
    les vraies instances des contrôleurs via `ng.getComponent`, pas
    seulement via les tests unitaires de la primitive.
  - `nx run-many -t lint,test,build -p ui-kit,docs,editor,sandbox` : tout
    vert (22 tests `docs` inchangés, 18 tests `ui-kit`).
  - Prochaine étape : Phase 3 (`ToolbarButton` générique + registry) — en
    attente de feu vert. Phase 4 restante (extraire ces features en vrais
    composants `@qalma/kit` réutilisables par `apps/sandbox`) reste à faire
    séparément.
- 2026-07-04 — Phase 3, slice 1 : `QalmaToolbarButton` (PAS ENCORE COMMIT).
  Composant `libs/ui-kit/src/lib/toolbar-button.ts` exporté par `@qalma/kit`.
  Décisions de conception prises en la construisant :
  - **Composant élément `<qalma-toolbar-button>`, pas directive sur `<button>`.**
    Première tentative en `button[qalmaToolbarButton]` +
    `hostDirectives: [QalmaCommand]` : rejetée par le lint. (1) `component-selector` du kit
    impose `type: element` / kebab-case → un sélecteur d'attribut camelCase ne
    passe pas ; (2) la règle a11y `@angular-eslint/template/elements-content`
    côté docs interdit un `<button>` vide (34 erreurs) puisque l'icône serait
    injectée par le template du composant, invisible à l'analyse. Solution :
    élément `<qalma-toolbar-button>` qui rend un `<button>` INTERNE portant
    `QalmaCommand` + `<ng-icon>` (l'icône est du contenu réel → règle a11y OK),
    host en `display:contents` (classe Tailwind `contents`) pour que le bouton
    interne reste l'item flex direct de `<qalma-toolbar>` (gap/align préservés).
    Bonus vs hostDirectives : `[disabled]` s'applique au vrai `<button>`, pas à
    un élément custom non-form.
  - **`@qalma/kit` dépend désormais de `@qalma/editor` et `@ng-icons/core`** —
    ajoutés en `peerDependencies`. Décision révisée le 2026-07-06 :
    ces peers sont assumés comme obligatoires tant que `@qalma/kit` publie un
    seul entrypoint/FESM, car les imports top-level doivent être résolus même
    pour un consommateur qui n'importe que `cn`/`anchorToRect`. Des entrypoints
    secondaires restent l'option de découpe si le coût réel le justifie.
    `nx build ui-kit` OK sans toucher `allowedNonPeerDependencies` (réservé aux
    non-peers).
    Tags Nx vides → aucune contrainte de module-boundary sur ui-kit→editor.
  - **Pas de spec unitaire** (aligné sur `command.ts`/`toolbar.ts` de l'editor,
    non testés) : `QALMA_EDITOR_CONTEXT` n'est pas public et le vrai
    `QalmaEditor` ne compile pas proprement sous JIT/vitest (NG0303/NG0950,
    cf. `control-value-accessor.spec.ts`) → un test mockerait un token privé.
    La preuve réelle est faite en live (consigne #4).
  - `PlaygroundToolbar` : 34 blocs `<button qalmaCommand><ng-icon></button>`
    → `<qalma-toolbar-button command icon label />`. Défaut de style du
    composant = ancien `commandClass` shadcn exact (icône `text-[0.9rem]`) →
    migration bit-perfect. `commandClass`/`iconClass` gardés : encore utilisés
    par les 3 boutons custom (image/upload/link à handlers `(click)` propres).
    `QalmaCommand` retiré des imports du toolbar (plus de `qalmaCommand` nu).
  - `nx run-many -t lint,test,build -p ui-kit,docs,editor` : tout vert.
  - Vérifié en live (home / playground) en pilotant le vrai contrôleur via
    `ng.getComponent`/`ng.applyChanges` : rendu bit-perfect (28 boutons hors
    table, host `display:contents`, bouton 29.6px ≈ 1.85rem, icônes SVG),
    exécution réelle d'une commande (clic Italic curseur replié : état actif ;
    `aria-pressed` false→true→false, `isCommandActive` suit), zéro erreur
    console.
  - Prochaine étape : Phase 3 slice 2 (registry déclarative + `Toolbar`
    composite piloté par données, branché dans les DEUX toolbars) — en attente
    de feu vert.
- 2026-07-04 — Phase 3, slice 2 : registry + composite (PAS ENCORE COMMIT).
  Trois choix de scope tranchés avec l'utilisateur avant de démarrer :
  (a) livrer **les deux** — fragments de données ET composite ; (b) icônes via
  **`provideQalmaToolbarIcons()`** dans le kit (`@ng-icons/lucide` en peer
  obligatoire tant que le kit reste en entrypoint unique) ; (c) périmètre
  **docs (playground) uniquement** ce coup-ci, la migration sandbox reste en
  Phase 5.
  - `libs/ui-kit/src/lib/toolbar-commands.ts` : types (`ToolbarCommandItem`,
    `ToolbarTemplateItem`, `ToolbarItem`, `ToolbarGroup`) + fragments exportés
    (source de vérité command/icon/label, réutilisables par sandbox en Phase 5)
    et garde `isToolbarCommandItem`.
  - `libs/ui-kit/src/lib/toolbar-registry.ts` : `QalmaToolbarRegistry`
    (`qalma-toolbar-registry`, `display:contents`). Décision clé : le composite
    rend **les items seulement**, pas de conteneur `role=toolbar` — c'est le
    `<qalma-toolbar>` de `@qalma/editor` qui garde la sémantique, le composite
    va dedans. Content-projection Angular étant statique (impossible de
    sélectionner un `<ng-content>` par nom runtime dans un `@for`), les
    contrôles custom passent par un `ToolbarTemplateItem { template: TemplateRef }`
    et `ngTemplateOutlet` — le consommateur déclare des `<ng-template>` et les
    référence dans le tableau de groupes. `visibleGroups` filtre les groupes
    vides (sinon séparateur orphelin quand un groupe conditionnel disparaît).
  - `libs/ui-kit/src/lib/toolbar-icons.ts` : `provideQalmaToolbarIcons()`.
    `@ng-icons/lucide` ajouté en peer obligatoire tant que le kit reste sur un
    entrypoint public unique.
  - `PlaygroundToolbar` réécrit : la liste explicite de `<qalma-toolbar-button>`
    → `<qalma-toolbar-registry [groups]="toolbarGroups(color, codeLang, insert)">`
    - 3 `<ng-template>` (color pickers / select langage / boutons image·upload·
      link). `toolbarGroups(...)` est une **méthode** recevant les `TemplateRef`
      en arguments de binding (pas un `computed` via `viewChild`) pour éviter le
      problème de timing viewChild-dans-la-même-vue ; recrée le tableau à chaque
      CD mais `@for track` stabilise le DOM. `provideIcons` local réduit de 40 à
      6 icônes (les 34 du registry viennent du provider ; restent Baseline/
      Highlighter/PaintBucket/Image/ImageUp/Link des contrôles custom).
      `separatorClass` supprimé (géré par le composite) ; `commandClass`/
      `iconClass`/`languageSelectClass` gardés (contrôles custom).
  - Pas de spec unitaire (même raison que slice 1 : rendre la registry monte
    des `QalmaToolbarButton` → `QalmaCommand` → `QALMA_EDITOR_CONTEXT` privé,
    non montable proprement sous JIT/vitest). Preuve en live.
  - `nx run-many -t lint,test,build -p ui-kit,docs,editor` : tout vert.
  - Vérifié en live via le vrai contrôleur (`ng.getComponent`/`applyChanges`) :
    8 groupes / 7 séparateurs, 28 boutons hors table, `display:contents` ;
    groupe table conditionnel (34 boutons + 6 ops quand `isInTable`, filtré
    sinon sans séparateur orphelin) ; bouton table rendu par la registry
    exécute réellement (Add row : +1 `<tr>`) ; `<select>` langage (template
    item) apparaît sur code block actif ; 34/34 icônes SVG rendues (chemin
    `provideQalmaToolbarIcons`) ; zéro erreur console.
  - Prochaine étape : en attente de feu vert. Restes ouverts : Phase 4
    (extraire drag-handle / link-popover / mention-menu / slash-command-menu en
    composants `@qalma/kit`) et Phase 5 (dogfooding : migrer playground puis
    sandbox — c'est là que la registry/composite servent un 2e consommateur).
- 2026-07-05 — Phase 4, slice DragHandle (PAS ENCORE COMMIT). Décisions prises
  avec l'utilisateur avant de démarrer : menu d'actions **hardcodé** (extraction
  fidèle) ; **ajouter le clic-dehors via `DismissibleOverlay`** (retire une
  primitive Phase 2 sans consommateur + améliore l'UX) ; périmètre **docs
  uniquement** (sandbox n'a pas de drag-handle, ça reste Phase 5).
  - `git mv` des 4 fichiers
    `apps/docs/playground/drag-handle{,-controller,-directive}.ts` +
    `drag-handle.spec.ts` → `libs/ui-kit/src/lib/`
    (spec renommé `drag-handle-controller.spec.ts`). Renommage `Playground`→
    `Qalma` (blanket sûr : ces fichiers ne contiennent que des symboles
    drag-handle), sélecteurs `app-playground-drag-handle`→`qalma-drag-handle`,
    `appPlaygroundDragHandle`→`qalmaDragHandle`, attributs
    `data-playground-drag-*`→`data-qalma-drag-*` (internes aux 4 fichiers,
    aucun CSS/e2e externe — vérifié). Imports `@qalma/kit`→relatifs
    (`./anchor-to-rect`, `./button`).
  - `DismissibleOverlay` branché dans le composant : connecté pour la vie du
    composant, `isInside = closest('[data-qalma-drag-handle]')` (grip + menu),
    `onDismiss` ferme le menu (no-op quand fermé). Escape + clic-dehors gérés.
    Le composant s'auto-fournit ses 6 icônes lucide via `provideIcons` dans son
    propre décorateur (pas de helper séparé nécessaire : icônes rendues dans son
    propre template, contrairement au cas toolbar).
  - Directive (`[qalmaDragHandle]`, exportAs `qalmaDragHandle`) et controller
    (`QalmaDragHandleController` + types `QalmaDragHandleView`/
    `QalmaDragDropIndicator`/`QalmaDragBlockHighlight` + `QalmaDragStart`)
    exportés du barrel. Pas de nouvelle dep : `@ng-icons/lucide` (peer
    obligatoire depuis la slice 2) couvre les icônes du menu ; `@qalma/editor` (peer) fournit
    `DragHandleCommandValue`/`DragHandleMoveCommandValue`.
  - Deux consommateurs docs rewire : `playground.ts` ET `examples/notion-doc.ts`
    (ce dernier découvert par grep repo-wide — pas seulement le playground).
  - `nx run-many -t lint,test,build -p ui-kit,docs,editor` : tout vert. Kit
    28 tests (18 + 10 du spec drag-handle déplacé, qui monte un vrai éditeur +
    DragHandlePlugin sous jsdom). Zéro référence orpheline repo-wide.
  - Vérifié en live via le vrai contrôleur (`ng.getComponent`) : handle apparaît
    au survol à la bonne position (`anchorToRect`, `translate3d(140px,401px,0)`,
    grip 30×30) ; menu ouvre (5 actions) ; **clic-dehors ferme le menu** et le
    handle persiste (nouveau `DismissibleOverlay`) ; Escape ferme ; **Duplicate
    exécute** (20→21 blocs) + dismiss du handle. Capture non récupérable :
    onglet preview `document.hidden=true` + viewport 0×0 → l'`IntersectionObserver`
    du `@defer (on viewport)` ne monte pas le playground (piège d'env connu,
    `preview_resize` ne débloque pas). Preuve fonctionnelle suffisante + build
    prod propre.
  - Prochaine étape : en attente de feu vert. Reste Phase 4 : `LinkPopover`,
    `MentionMenu`/`SlashCommandMenu` (garder leur positionnement flip-above),
    `ContextualToolbar` (garder son positionnement propre) ; puis Phase 5.
- 2026-07-05 — Phase 4, slice Mention/SlashCommand menus (PAS ENCORE COMMIT).
  Trois choix tranchés avec l'utilisateur : (a) **deux composants + base
  partagée** (pas un menu générique à template, pas non plus deux copies
  fidèles) ; (b) **extraire aussi la primitive `flipAbovePlacement`** ; (c)
  **les deux menus** dans la même slice. Périmètre docs (sandbox = Phase 5).
  - `flip-above-placement.ts` : `SuggestionMenuPlacement` (type unique,
    remplace les deux `Playground*Placement` identiques) + `flipAbovePlacement`
    (géométrie openAbove/maxHeight/clamp paramétrée width/desiredHeight/
    minHeight/margin/gap). **Petite convergence de comportement assumée** : les
    deux `createPlacement` différaient d'un `gap` près sur le seuil openAbove /
    le plancher (LOADING_HEIGHT vs OPTION_HEIGHT) ; la primitive unifie sur une
    formule cohérente (celle de mention). 4 tests dédiés.
  - `suggestion-menu-base.ts` : `@Directive()` abstraite générique
    `QalmaSuggestionMenu<TOption>` — inputs `placement`/`activeIndex`, outputs
    `activate`/`pick`/`dismiss`, `handleOptionKeydown` (Escape/flèches+focus/
    Enter·Espace, wrap), `focusOption`+`scrollOptionIntoView` via attributs
    standardisés `data-suggestion-index`/`data-suggestion-options`. Le scroll
    est un no-op pour un menu sans scroller marqué (mention garde son focus-
    scroll natif ; slash marque son scroller). Les composants concrets ne
    fournissent que leur template + exposent `optionList`.
  - `mention-menu.ts` (`QalmaMentionMenu`, `QalmaMentionOption`) et
    `slash-command-menu.ts` (`QalmaSlashCommandMenu`, `QalmaSlashCommandOption`,
    icônes lucide auto-fournies + effet scroll-into-view sur activeIndex).
    Type slash = rendu (icon/label/description/shortcut) + champs contrôleur
    (command/value?/placement?/keywords) → non générique, l'app utilise le type
    kit direct (évite un composant Angular générique, plus fragile en template).
  - Controllers `mention.ts`/`slash-command.ts` restés dans l'app (data +
    insertion + `KeyboardNavigableList` de surface) mais : types locaux
    supprimés au profit des types kit, `createPlacement` réécrits en un appel à
    `flipAbovePlacement` (les helpers de rect/desiredHeight restent locaux).
  - Anciens `mention-menu.ts`/`slash-command-menu.ts` du playground supprimés
    (git rm). `slash-command.spec.ts` (teste le controller, reste dans l'app)
    repointé sur `QalmaSlashCommandOption`.
  - TROIS consommateurs rewire : `playground`, `examples/notion-doc` (slash),
    `examples/comment-box` (mention).
  - `nx run-many -t lint,test,build -p ui-kit,docs,editor` : tout vert. Kit
    32 tests (28 + 4 flip-above). Zéro référence orpheline repo-wide.
  - Vérifié en live (viewport desktop forcé d'emblée → pas de piège @defer
    cette fois) via le vrai contrôleur : slash `/` ouvre 12 options, flip
    au-dessus près du bas (`top:null`/`bottom` set), filtrage `/h`→9, nav
    clavier de la base (ArrowDown : activeIndex 0→1), pick→insert réel
    (blockquote 1→2) + fermeture ; mention `@` ouvre 5 suggestions avec avatar-
    initiale, flip-above, pick→insertion de la mention + fermeture ; capture du
    menu slash rendu bit-perfect ; zéro erreur console.
  - Prochaine étape : en attente de feu vert. Reste Phase 4 : `LinkPopover`,
    `ContextualToolbar` ; puis Phase 5 (dogfooding sandbox — où la base/les
    menus/`flipAbovePlacement` serviront un 2e jeu de consommateurs).
- 2026-07-05 — Phase 4, slice LinkPopover (PAS ENCORE COMMIT). Extraction
  propre, sans fork de conception (le controller est entièrement générique,
  comme le drag-handle — aucune data app-spécifique, contrairement à mention/
  slash) : `git mv` des 3 fichiers `link-popover{.model,-controller,}.ts` vers
  `libs/ui-kit/src/lib/`, `PlaygroundLinkPopover`→`QalmaLinkPopover`,
  `app-playground-link-popover`→`qalma-link-popover`, `data-link-popover`→
  `data-qalma-link-popover` (interne aux 2 fichiers qui bougent ensemble,
  sandbox a ses copies séparées), imports `@qalma/kit`→relatifs. Dismiss
  hover-delay 160ms conservé tel quel (preview au survol, pas un menu → pas de
  `DismissibleOverlay`, cf. décision Phase 2). `LinkPopover`/`LinkPopoverPlacement`/
  `LinkPopoverController` + composant exportés du barrel.
  - QUATRE consommateurs rewire : `playground`, `examples/comment-box`,
    `examples/mail-box`, `examples/product-review` (les 3 exemples ne
    référençaient que le controller + le composant ; `playground` importe aussi
    le type `LinkPopover` pour `onLinkSave`). Piège : le script de renommage a
    changé les symboles mais pas les chemins d'import de mail-box/product-review
    → `docs:build` cassé, corrigé en pointant leurs imports sur `@qalma/kit`
    (placés dans le groupe des packages externes pour `import/order`).
  - Pas de spec (aucun n'existait ; controller vérifié en live). `nx run-many
-t lint,test,build -p ui-kit,docs,editor` : tout vert. Zéro orphelin.
  - Vérifié en live (viewport desktop forcé) via le vrai contrôleur : survol
    d'un lien → preview `role="dialog"` positionné via `anchorToRect`
    (left:528/top:518), href affiché + boutons edit/unlink ; clic Edit → mode
    édition (input url + save) ; dismiss hover-delay (reste ouvert immédiatement,
    fermé après 160ms) ; capture bit-perfect ; zéro erreur console.
  - Prochaine étape : en attente de feu vert. Reste Phase 4 :
    `ContextualToolbar` (garder son positionnement point-ancre + self-centering
    CSS propre) ; puis Phase 5 (dogfooding sandbox).
- 2026-07-05 — Phase 4, slice ContextualToolbar (PAS ENCORE COMMIT).
  **Phase 4 désormais complète.** Extraction fidèle, sans fork (controller
  entièrement générique comme drag-handle/link-popover) : `git mv` des 3
  fichiers `contextual-toolbar.ts` + `selection-toolbar-{controller,directive}.ts`
  vers `libs/ui-kit/src/lib/`, blanket `Playground`→`Qalma`, sélecteurs
  `app-playground-contextual-toolbar`→`qalma-contextual-toolbar` et
  `appPlaygroundSelectionToolbar`→`qalmaSelectionToolbar`, import `QalmaButton`
  →`./button`. Noms d'origine gardés (composant "Contextual", controller/
  directive "Selection" — léger décalage historique, préservé). Positionnement
  point-ancre + `translate(-50%,-100%)` self-centering conservé (le seul des 4
  qui n'utilise PAS `anchorToRect`, décision Phase 2 : largeur dynamique).
  Boutons hardcodés (bold/italic/inline-code/monospace/link). Un seul
  consommateur : `playground`. Pas de spec (aucun n'existait).
  - `nx run-many -t lint,test,build -p ui-kit,docs,editor` : tout vert. Zéro
    orphelin repo-wide.
  - Vérifié en live via le vrai contrôleur : sélection de texte → toolbar
    `role="toolbar"` apparaît, positionnée via le transform point-ancre
    (`translate3d(298px,281px,0) translate(-50%,-100%)`), 5 boutons ; clic Bold
    exécute (strong 6→7, classe `qalma-command-active` reflète l'état) ; capture
    bit-perfect ; zéro erreur console.
  - Piège d'env : un `nx serve docs` résiduel bloquait le port 4200 (dev server
    d'une session preview précédente non tué par preview_stop) → tué via `kill`
    avant de relancer.
  - **Phase 4 finie** (DragHandle, LinkPopover, Mention/SlashCommand, Contextual
    Toolbar). Prochaine étape : Phase 5 (dogfooding — migrer `apps/sandbox` sur
    tous les composants `@qalma/kit` ; c'est le 2e jeu de consommateurs qui
    prouve l'indépendance vis-à-vis de spartan-ng/Tailwind côté docs) ; puis
    Phase 6 (bench bundle-size + page recipes + page comparative).
- 2026-07-05 — Phase 5, slice 1 : thème + toolbar sandbox (PAS ENCORE COMMIT).
  Choix utilisateur : réutiliser la palette warm des docs (pas d'identité
  slate/sky propre) ; thème + toolbar d'abord (menus + link-popover ensuite).
  - **Thème** : bloc `:root` (couleurs warm des docs) + `@theme inline`
    (mapping `--color-*` + `--radius-*`) ajouté en tête de
    `apps/sandbox/src/styles.css`. Light-only (le sandbox n'a pas de dark mode).
    Fonts non copiées (le kit utilise `font-mono`/`font-medium` par défaut de
    Tailwind v4). **Point clé : aucun import de spartan-ng** — définir les tokens
    suffit à thémer tous les composants du kit. C'est la preuve d'indépendance.
  - **Toolbar** : `sandbox-toolbar.ts` réécrit comme `PlaygroundToolbar` —
    `<qalma-toolbar-registry [groups]>` piloté par les fragments + 5
    `<ng-template>` pour les contrôles custom (image/upload, swatches highlight,
    swatches text+bg + clears, select langage, link). `setHighlight`/
    `unsetHighlight` en `ToolbarCommandItem` inline. `commandClass` des boutons
    custom = `TOOLBAR_BUTTON_CLASS` importé du kit (cohérence visuelle) ;
    `colorSwatchClass`/`languageSelectClass` restylés shadcn. `provideIcons`
    local réduit aux 4 icônes custom (Highlighter/Image/ImageUp/Link) ; les
    autres via `provideQalmaToolbarIcons`. Ordre propre au sandbox conservé
    (headings → image → align → marks → highlight → colors → lists → link →
    history).
  - `.claude/launch.json` : entrée `sandbox` ajoutée (serve nx sandbox, 4200)
    pour le preview.
  - `nx run-many -t lint,test,build -p ui-kit,docs,editor,sandbox` : tout vert
    **en `--parallel=1`** (le build ng-packagr du kit flake sous forte
    parallélisation — échecs transitoires, pas des erreurs réelles ; confirmé en
    isolé). 55 tests sandbox inchangés.
  - Vérifié en live (app sandbox servie, viewport desktop) via le vrai
    contrôleur : toolbar rendue avec la registry (29 boutons de commande +
    icônes, 8 séparateurs/9 groupes, 15 swatches, `display:contents`), fond
    `bg-secondary/40` résolu depuis le token warm ; clic Bold exécute
    (`<strong>` +1) et le bouton actif affiche `bg-accent-subtle`
    rgb(240,226,200) + `text-accent` rgb(140,90,43) (tokens warm, inspectés
    stabilisés — les 1ères lectures capturaient la transition CSS) ; swatch
    Yellow highlight appliqué (classe active) ; zéro erreur console.
  - Prochaine étape : Phase 5 slices suivantes — migrer les menus mention/slash
    du sandbox (`sandbox-mention*.ts`, `sandbox-slash-command*.ts`) puis le
    link-popover (`sandbox-link-popover.ts` + controller/model locaux) sur le
    kit, et supprimer les copies. En attente de feu vert.
- 2026-07-05 — Phase 5, slice 2 : menus + link-popover sandbox (PAS ENCORE
  COMMIT). **Phase 5 finie.** Choix utilisateur : tout finir en une slice (les
  deux sont des décalques mécaniques sans nouvelle décision) ; thème warm
  cohérent. Les types d'option/placement sandbox étaient identiques aux versions
  docs pré-migration → décalque exact.
  - Controllers `sandbox-mention.ts`/`sandbox-slash-command.ts` : types locaux
    (`Sandbox*Option`/`Sandbox*Placement`) remplacés par les types kit,
    `createMentionPlacement`/`createSlashCommandPlacement` réécrits en un appel à
    `flipAbovePlacement` (formule identique aux docs → bit-perfect). `handleEditorKeydown`
    et la nav `moveActiveOption` propres au sandbox conservés (KeyboardNavigableList
    non branché ici, hors scope). `SandboxMentionController`/`SandboxSlashCommandController`/
    `createSandboxMentionSource` gardés (data + insertion).
  - Composants copies supprimés (git rm) : `sandbox-mention-menu.ts`,
    `sandbox-slash-command-menu.ts`, `sandbox-link-popover.ts`,
    `link-popover-controller.ts`, `link-popover.model.ts`. Le controller
    link-popover sandbox ne différait du kit QUE par `data-link-popover` ; le
    modèle sandbox n'avait PAS de clamp vertical → passer au kit apporte le fix
    `anchorToRect` (même correction qu'en Phase 2 docs).
  - `sandbox-editor.ts` rewire sur `QalmaLinkPopover`/`QalmaMentionMenu`/
    `QalmaSlashCommandMenu` + `LinkPopoverController` du kit ; `app.spec.ts`
    (test du link-popover, 55 tests) repointé sur `QalmaLinkPopover` — mêmes
    aria-labels (`Edit link`/`Unlink`, `Save link`/`Cancel`), test inchangé.
  - `nx run-many -t lint,test,build -p ui-kit,docs,editor,sandbox --parallel=1` :
    tout vert (55 tests sandbox). Zéro orphelin.
  - Vérifié en live (sandbox servi) via le vrai contrôleur : slash `/` ouvre 10
    options (composant kit, `bg-popover` = token warm blanc, flipAbovePlacement
    en-dessous), pick "Text" exécute + ferme ; mention `@` ouvre 5 suggestions
    (avatar-initiale), pick insère + ferme ; link-popover au survol =
    `data-qalma-link-popover` (composant kit), `role=dialog`, fond warm,
    positionné via `anchorToRect`, mode édition input+Save/Cancel ; zéro erreur
    console.
  - **Phase 5 finie** (playground de facto en Phases 3-4 ; sandbox : thème +
    toolbar + menus + link-popover). Prochaine étape : Phase 6 (ajouter
    `@qalma/kit` au bench `bench/bundle-size` ; page recipes Material/Kendo/
    ng-zorro ; page comparative). En attente de feu vert.
- 2026-07-05 — Ajustement post-revue : `QalmaProgress*` retiré de
  `@qalma/kit`. La barre de progression de navigation reste une primitive
  locale `apps/docs/src/app/ui/progress.ts` (`HlmProgress*`) parce qu'elle
  appartient au chrome de l'application docs, pas à l'UI kit éditeur. Cela
  retire aussi la dépendance `@spartan-ng/brain` du package `libs/ui-kit`.
  Côté build, `ui-kit` déclare maintenant sa dépendance Nx implicite vers
  `editor` et son `build` dépend de `^build`, pour que `nx build sandbox`
  puisse ordonner `editor` avant `ui-kit` même en parallèle. `ui-kit` a aussi
  été ajouté aux projets Nx release et son `nx-release-publish.packageRoot`
  pointe vers `dist/libs/ui-kit`.
- 2026-07-06 — Doc UI Kit sortie en **section autonome** (Option B, choix
  utilisateur, PAS ENCORE COMMIT). Les 11 pages kit étaient enfouies comme
  9e groupe dans la longue sidebar docs éditeur (`/docs/ui-kit*`) ; extraites
  en section `/kit` avec sa propre navigation.
  - Routes : `pages/docs/ui-kit*.page.ts` → `pages/kit/*` (préfixe `ui-kit-`
    retiré ; `ui-kit.page.ts` → `pages/kit/(overview).page.ts` = index `/kit`,
    convention groupe pathless Analog `(name)` déjà utilisée par `(home)`).
    Layout `pages/kit.page.ts` (Analog : `kit.page.ts` + dossier `kit/` = layout
    parent des enfants). Même profondeur → imports relatifs inchangés.
  - Chrome partagé extrait : `docs/docs-shell.ts` (`DocsShell`) porte le header +
    grille 3 colonnes + scan TOC (`ngAfterViewChecked`) ; `docs.page.ts` et
    `kit.page.ts` deviennent des layouts fins qui passent `[groups]` + `section`
    et projettent leur `<router-outlet>` dans son `<ng-content>`.
  - `DocsSidebar` : `DOCS_NAV` hardcodé → inputs `groups`/`section` ; switcher
    `role=tablist` `Docs | UI Kit` (via `DOCS_SECTIONS`) en tête. Data : groupe
    UI Kit retiré de `DOCS_NAV` (docs-nav.ts) → nouveau `docs/kit-nav.ts`
    (`KIT_NAV`, 3 groupes : Getting Started / Components / Primitives). Effet de
    bord propre : `generate-llms-full.mjs` (scanne les `href:'/docs/…'` de
    docs-nav) ne référence plus les pages kit (démos composant, pas de `.md`).
  - **Bug attrapé en live** : la sidebar gatait le rendu `routerLink` sur
    `isDocsRoute` (`startsWith('/docs/')`) → les liens `/kit/*` tombaient dans la
    branche `<a href>` nue (reload full-page, pas de highlight actif).
    Généralisé en `isRouterRoute` (`startsWith('/') && !includes('#')`, comme le
    header). Vérifié : lien actif `bg-accent-subtle !text-accent` OK.
  - `docs-header.ts` : liens "UI Kit" `/docs/ui-kit` → `/kit` (HEADER_NAV +
    desktop nav) ; nav détaillée mobile rendue section-aware (`docsGroups`
    computed depuis `router.url` : `/kit` → KIT_NAV, sinon DOCS_NAV, via
    `toSignal(NavigationEnd)`). `vite.config` : seed prerender `/kit` ajouté
    (discover crawle le reste depuis l'overview + header — [[docs-prerender-routes]]).
  - `nx run-many -t lint,build,test -p docs --parallel=1` : tout vert (12 tests).
    Prerender SSG : 11 pages `/kit/*` émises sous `analog/public/kit/**`, zéro
    `docs/ui-kit*` résiduel, zéro lien `/docs/ui-kit` restant. Vérifié en live :
    `/kit` sidebar = 3 groupes kit only (0 groupe éditeur), switcher UI Kit
    sélectionné ; clic "Docs" → `/docs/introduction`, sidebar éditeur (10 groupes,
    plus de groupe UI Kit), "Docs" sélectionné ; `/kit/button` rend le preview
    live (8 boutons), `/kit/theming` la table de tokens ; capture prise.
- 2026-07-06 — Revue qualité doc kit (6 retours utilisateur, PAS ENCORE COMMIT) :
  - **Cursor pointer** : Tailwind v4 a retiré `button { cursor:pointer }` du
    preflight → ajouté à `buttonVariants` (source, couvre tous les `qalmaBtn`) +
    aux boutons bruts de `kit-example.ts`/`code-panel.ts`.
  - **Le code ne reflétait pas le visuel** (grave) : preview (`<ng-content>`) et
    snippet (`[code]` string) étaient 2 sources qui divergeaient (button : 6
    variants affichés, 3 en code). Refonte **source unique via `?raw`** (choix
    utilisateur) : 8 previews extraites en vrais composants
    `apps/docs/src/app/kit/demos/*.demo.ts`, la page rend le composant ET envoie
    `import src from './x.demo.ts?raw'` à `[code]`. Impossible de diverger.
    Typage `?raw` déjà fourni par `vite/client` (vite-env.d.ts). 8 snippets morts
    supprimés de `ui-kit-snippets.ts` (reste `install` + `theme`).
  - **Drag handle cassé** (#3) : l'ancienne demo était un faux (`<qalma-content
class="sr-only">` + handle épinglé sur pos 0 de l'éditeur caché → actions sur
    contenu invisible). Réécrite avec le **vrai** `QalmaDragHandleDirective` sur
    éditeur visible. Idem contextual-toolbar (vrai `QalmaSelectionToolbarDirective`,
    plus de sr-only) et link-popover (vrai `LinkPopoverController`). Piège API : les
    directives prennent l'éditeur via l'alias du sélecteur (`[qalmaDragHandle]=
"editor"`), pas un `[editor]` séparé. `<qalma-drag-handle>` touche `document`
    au constructeur → guard `browserReady`/`afterNextRender` (SSR prerender).
    Vérifié live : hover→grip, menu 5 actions, Duplicate mute le contenu visible 3→4.
  - **Doc icônes** (#4) : nouvelle page `/kit/icons` (+ entrée nav) + demo `?raw`.
    Seam : `provideQalmaToolbarIcons()` = défauts lucide ; override par un
    `provideIcons({ lucideBold: monSvg })` APRÈS (dernier gagne, vérifié live), ou
    nom custom dans le `icon` d'un `ToolbarCommandItem`. Note honnête : icônes des
    composants auto-fournis (drag handle, slash) pas surchargeables aujourd'hui.
  - **Conflit tokens** (#5) : décision = garder les tokens shadcn non-préfixés
    (pas de `--qalma-*`), documenter le **scoping** (définir les tokens sur un
    conteneur `.qalma-surface` au lieu de `:root` pour isoler). Section ajoutée à
    la page theming.
  - **Skills** (#6) : `plugins/qalma/skills/qalma/SKILL.md` + `references/
editor-integration.md` disaient encore "keep all UI in app" sans mentionner
    `@qalma/kit` (écrits avant le package). Ajout : section "Optional UI Kit",
    nuance des règles, description frontmatter. Repack `nx build skills` OK
    (dist/libs/skills/pack/skills reflète le kit).
  - `nx run-many -t lint,test,build -p docs,skills,ui-kit --parallel=1` : tout
    vert. Les 11+1 pages `/kit/*` prerendent (nouvelle route `/kit/icons` : dev
    server à redémarrer + `rm node_modules/.vite`, cf. [[analog-content-dev-cache]]).
- 2026-07-06 — Fix : contextual-toolbar de la doc ne s'affichait pas (retour
  utilisateur). Cause : la demo n'incluait pas `SelectionPlugin`, or
  `QalmaSelectionToolbarController.refresh()` lit `query('selection')` → toujours
  null → toolbar cachée. Le playground, lui, inclut `SelectionPlugin` (d'où le
  décalage). Ajouté à `contextual-toolbar.demo.ts`. Vérifié live : sélection →
  toolbar 5 boutons au-dessus, Bold exécute (`<strong>`). Link-popover revérifié
  au passage (hover → popover href + Edit/Unlink) : OK, pas de plugin manquant.
