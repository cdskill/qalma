---
name: docs-deployment
description: Comment apps/docs est hébergé et déployé — SSG sur AWS S3 + CloudFront, infra OpenTofu/Terraform, et le workflow CI nx-affected. À lire avant toute question/modif sur l'hébergement de la doc, CloudFront, S3, le cache CDN, le domaine qalma.dev, la cert TLS, le rôle OIDC, ou le pipeline de déploiement de la doc. Évite de re-scanner le repo.
---

# docs-deployment

`apps/docs` (site de doc de `@qalma/editor`) est un build **SSG** publié sur
**AWS S3 + CloudFront**, déployé par le CI GitHub Actions. Pas de SSR, pas de
serveur. Domaine : **`qalma.dev`** (apex).

```
GitHub Actions (nx affected → nx build docs)
        │  assume role via OIDC (aucune clé stockée)
        ▼
   S3 privé  ◀── OAC ──  CloudFront (edge, HTTP/3, Brotli)  ──▶  https://qalma.dev
        ▲                          ▲
   aws s3 sync              ACM cert (us-east-1) + Route 53 alias apex
   + invalidation
```

## Où vit quoi

- **Infra IaC** : `infra/terraform/` — `providers.tf` (AWS + alias `us_east_1`
  pour la cert), `s3.tf`, `cloudfront.tf`, `dns_cert.tf` (zone Route 53 en
  `data` + ACM + alias A/AAAA), `iam_oidc.tf`, `variables.tf`, `outputs.tf`,
  `functions/rewrite.js`. Doc humaine : `infra/terraform/README.md`.
- **CI** : `.github/workflows/deploy.yml`.
- **Sortie SSG déployable** : `dist/apps/docs/analog/public/` (HTML + assets +
  `sitemap.xml`, aucun serveur).
- **App** : `apps/docs` — SSG (`static: true` + `prerender` dans `vite.config.ts`),
  **zoneless** (`provideZonelessChangeDetection()` dans `app.config.ts`),
  sitemap `host: 'https://qalma.dev/'`. Taggée `deploy:cloudfront` dans
  `project.json`. Voir aussi [[docs-hosting]].

## Mécanisme de déploiement (CI)

Le workflow `deploy.yml` tourne sur push `main` (+ `workflow_dispatch`) :

1. Job `affected` : `nrwl/nx-set-shas` puis
   `pnpm exec nx show projects --affected --type app -p tag:deploy:cloudfront --json`
   → liste des apps **déployables réellement affectées**. Sort un matrix JSON.
   Un push qui n'affecte pas `docs` ne déploie **rien**.
2. Job `deploy` (matrice sur les apps affectées) : `nx build <app>`, puis un
   `case "$app"` résout la config (dist dir, bucket, distribution, role) — pour
   `docs` via les variables GitHub. Auth AWS par **OIDC** (pas de clé).

**Ajouter une app déployable** = la tagger `deploy:cloudfront` + ajouter une
branche dans le `case` de `deploy.yml` + créer ses ressources Terraform + ses
variables GitHub.

## Stratégie de cache (le levier perf FCP/TTFB)

Posée à l'upload, en 2 passes `aws s3 sync` :
- Assets hashés (`*.js`, `*.css`) → `Cache-Control: public, max-age=31536000, immutable`
  (avec `--delete` pour purger les anciens).
- HTML + `*.xml` → `public, max-age=0, must-revalidate` (contenu frais à chaque deploy).

Puis `aws cloudfront create-invalidation --paths "/*"` (1 chemin = gratuit
jusqu'à 1000/mois). CloudFront : `compress = true` (Brotli/gzip), `http2and3`.
La `functions/rewrite.js` (viewer-request) mappe les clean-URLs vers
`…/index.html` ; `custom_error_response` 403/404 → `/index.html` (fallback SPA).

## Identifiants live (NE PAS hardcoder ici — repo public)

Domaine `qalma.dev`, région **`eu-west-1`**, `price_class = PriceClass_All`.
Les valeurs concrètes (bucket, distribution id, role ARN, account id, domaine
CloudFront) se lisent à la source, jamais en dur :

```bash
cd infra/terraform && tofu output      # bucket_name, distribution_id, deploy_role_arn, cloudfront_domain
gh variable list --repo cdskill/angular-rte   # AWS_REGION, DOCS_S3_BUCKET, DOCS_CF_DISTRIBUTION_ID, DOCS_DEPLOY_ROLE_ARN
```

## Runbook

**Provisionner / modifier l'infra** (IaC) — outils :
- Terraform n'est **plus dans homebrew-core** (licence BSL). On utilise
  **OpenTofu** (OSS, drop-in) : `brew install opentofu`, commande **`tofu`**.
  Les `.tf` sont identiques pour `terraform` et `tofu`.
- `terraform.tfvars` (gitignoré) est prérempli pour `qalma.dev`.

```bash
cd infra/terraform
eval "$(aws configure export-credentials --format env)"   # ⚠️ voir gotcha creds
tofu init && tofu apply
```

**Brancher/rafraîchir les variables GitHub** (gh est admin sur le repo) :
```bash
R=cdskill/angular-rte
gh variable set AWS_REGION              --repo "$R" --body "eu-west-1"
gh variable set DOCS_S3_BUCKET          --repo "$R" --body "$(tofu output -raw bucket_name)"
gh variable set DOCS_CF_DISTRIBUTION_ID --repo "$R" --body "$(tofu output -raw distribution_id)"
gh variable set DOCS_DEPLOY_ROLE_ARN    --repo "$R" --body "$(tofu output -raw deploy_role_arn)"
```

**Déployer** : merge sur `main` (si `docs` affecté) ou `gh workflow run deploy.yml`.

**Vérifier** :
```bash
curl -I https://qalma.dev/             # 200, content-encoding: br
curl -I https://qalma.dev/sitemap.xml  # 200
```

## Gotchas (réellement rencontrés)

- **Creds AWS introuvables par OpenTofu** alors que le CLI `aws` marche : les
  creds étaient dans `~/.aws/login` (type `login`, non-standard), invisible pour
  le SDK Go. Fix : `eval "$(aws configure export-credentials --format env)"`
  avant `tofu apply` (exporte les creds courants en variables d'env).
- **`brew install terraform` échoue** (retiré de homebrew-core) → OpenTofu.
- **zoneless est requis** : zone.js n'est pas installé ; sans
  `provideZonelessChangeDetection()` l'app ne bootstrappe pas côté client.
- **Coût** : ~0 € (palier gratuit permanent CloudFront 1 To + 10M req/mois).
  Seul coût standing = la hosted zone Route 53 (0,50 $/mois), déjà payée.
- **Sécurité** : pas de clé AWS stockée — OIDC verrouillé sur
  `repo:cdskill/angular-rte:ref:refs/heads/main`. Le dossier `infra/` ne contient
  aucun secret ; `terraform.tfstate` et `terraform.tfvars` sont gitignorés.

## État au 2026-06-13

- Infra **appliquée** (14 ressources live), variables GitHub **branchées**.
- **PR #4** (`feat/docs-deploy-cloudfront`) **ouverte, pas encore mergée** → le
  premier déploiement se déclenchera au merge (qui affecte `docs`). Tant que ce
  n'est pas mergé + déployé, le bucket est vide et `qalma.dev` renvoie une erreur.
