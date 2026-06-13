---
name: docs-deployment
description: How apps/docs is hosted and shipped — SSG on AWS S3 + CloudFront, OpenTofu/Terraform infrastructure, and the nx-affected CI deploy workflow. Read before any question or change about docs hosting, the SSG hosting model, CloudFront, S3, CDN caching, the qalma.dev domain, the ACM/TLS cert, the OIDC deploy role, or the docs deploy pipeline. Avoids re-scanning the repo. Infra/ops scope only — not app-level concerns.
---

# docs-deployment

Infrastructure and delivery for `apps/docs` (the `@qalma/editor` docs site).
This skill covers **hosting and deployment only** — not application code.

## Hosting model: SSG (not SSR)

`apps/docs` is built as **static site generation** — prerendered HTML + hashed
assets, no Node server at runtime. Configured in `apps/docs/vite.config.ts` via
the Analog plugin: `static: true` + `prerender` (routes + `discover`) + sitemap
`host: 'https://qalma.dev/'`. Deployable output: **`dist/apps/docs/analog/public/`**.

**Why SSG over SSR for the docs:**
- Docs content only changes on redeploy → nothing to render per request.
- SEO is identical to SSR (both ship fully-rendered HTML).
- Better TTFB/FCP: prerendered HTML served from the CDN edge, no per-request compute.
- Cheaper and zero ops: no server to run, scale or patch.

**Why S3 + CloudFront over Amplify:** the build stays in the existing Nx CI
(single source of truth, Nx cache) instead of Amplify's own build system, and we
get full control of `Cache-Control` per path — the real lever for FCP/TTFB.
Amplify runs CloudFront underneath anyway, so there is no CDN/perf loss.

## Architecture

```
GitHub Actions (nx affected → nx build docs)
        │  assumes IAM role via OIDC (no stored keys)
        ▼
   private S3 bucket  ◀── OAC ──  CloudFront (edge, HTTP/3, Brotli)  ──▶  https://qalma.dev
        ▲                                ▲
   aws s3 sync                    ACM cert (us-east-1) + Route 53 apex alias
   + invalidation
```

## Where things live

- **IaC**: `infra/terraform/` — `providers.tf` (AWS + `us_east_1` alias for the
  cert), `s3.tf`, `cloudfront.tf`, `dns_cert.tf` (Route 53 zone as `data` + ACM +
  A/AAAA aliases), `iam_oidc.tf`, `variables.tf`, `outputs.tf`,
  `functions/rewrite.js`. Human walkthrough: `infra/terraform/README.md`.
- **CI**: `.github/workflows/deploy.yml`.
- **Deployable artifact**: `dist/apps/docs/analog/public/`.

## Infrastructure (Terraform/OpenTofu)

One `terraform apply` creates ~14 resources:
- **S3**: private bucket (`block public access` on), bucket policy granting
  read only to this CloudFront distribution via OAC. No website endpoint.
- **CloudFront**: distribution with `http2and3`, `compress = true` (Brotli/gzip),
  managed `CachingOptimized` policy, apex alias, `PriceClass_All` (global).
  A CloudFront Function (`functions/rewrite.js`, viewer-request) maps clean URLs
  to `…/index.html`; 403/404 `custom_error_response` → `/index.html` (SPA fallback).
- **ACM**: DNS-validated cert in **us-east-1** (required for CloudFront).
- **Route 53**: cert-validation records + apex `A`/`AAAA` aliases to CloudFront
  (hosted zone must already exist; referenced as `data`).
- **IAM/OIDC**: GitHub OIDC provider + least-privilege deploy role (S3 sync +
  CloudFront invalidation only), trust scoped to
  `repo:cdskill/qalma:ref:refs/heads/main`.

## CI deploy mechanism

`deploy.yml` runs on push to `main` (+ `workflow_dispatch`):
1. **`affected` job** — `nrwl/nx-set-shas`, then
   `pnpm exec nx show projects --affected --type app -p tag:deploy:cloudfront --json`.
   Emits a matrix of deployable apps the push actually affects. A push that does
   not affect `docs` deploys nothing.
2. **`deploy` job** (matrix per affected app) — `nx build <app>`, a `case "$app"`
   resolves per-app config (dist dir, bucket, distribution, role) from GitHub
   repo variables, then deploys. AWS auth via **OIDC** (no stored keys).

Apps opt in to deployment with the **`deploy:cloudfront`** tag in `project.json`
(`docs` has it). Add a deployable app = tag it + add a `case` branch in
`deploy.yml` + its Terraform resources + its GitHub variables.

## Cache strategy (the FCP/TTFB lever)

Set at upload time, two `aws s3 sync` passes:
- Hashed assets (`*.js`, `*.css`) → `Cache-Control: public, max-age=31536000, immutable`
  (with `--delete` to prune removed files).
- HTML + `*.xml` → `public, max-age=0, must-revalidate` (fresh content every deploy).

Then `aws cloudfront create-invalidation --paths "/*"` (one path = free up to
1000/month). Result: returning visitors re-use immutable assets from edge+browser
cache; HTML is always revalidated so deploys appear instantly.

## Live identifiers (do NOT hardcode here — public repo)

Domain `qalma.dev`, region **`eu-west-1`**, `price_class = PriceClass_All`.
Read concrete values from source, never inline:

```bash
cd infra/terraform && tofu output            # bucket_name, distribution_id, deploy_role_arn, cloudfront_domain
gh variable list --repo cdskill/qalma  # AWS_REGION, DOCS_S3_BUCKET, DOCS_CF_DISTRIBUTION_ID, DOCS_DEPLOY_ROLE_ARN
```

## Runbook

**Tooling**: Terraform is no longer in homebrew-core (BSL license). Use
**OpenTofu** (OSS, drop-in): `brew install opentofu`, command **`tofu`**. The
`.tf` files are identical for `terraform` and `tofu`. `terraform.tfvars`
(gitignored) is pre-filled for `qalma.dev`.

```bash
cd infra/terraform
eval "$(aws configure export-credentials --format env)"   # see gotcha below
tofu init && tofu apply
```

**Wire/refresh GitHub variables** (gh is admin on the repo):
```bash
R=cdskill/qalma
gh variable set AWS_REGION              --repo "$R" --body "eu-west-1"
gh variable set DOCS_S3_BUCKET          --repo "$R" --body "$(tofu output -raw bucket_name)"
gh variable set DOCS_CF_DISTRIBUTION_ID --repo "$R" --body "$(tofu output -raw distribution_id)"
gh variable set DOCS_DEPLOY_ROLE_ARN    --repo "$R" --body "$(tofu output -raw deploy_role_arn)"
```

**Deploy**: merge to `main` (when `docs` is affected) or `gh workflow run deploy.yml`.

**Verify**:
```bash
curl -I https://qalma.dev/             # 200, content-encoding: br
curl -I https://qalma.dev/sitemap.xml  # 200
```

## Gotchas (actually hit)

- **OpenTofu can't find AWS creds** while the `aws` CLI works: creds lived in
  `~/.aws/login` (type `login`, non-standard), invisible to the Go SDK. Fix:
  `eval "$(aws configure export-credentials --format env)"` before `tofu apply`.
- **`brew install terraform` fails** (removed from homebrew-core) → use OpenTofu.
- **Cost ≈ €0** under CloudFront's always-free tier (1 TB + 10M req/month). Only
  standing AWS cost is the Route 53 hosted zone ($0.50/mo), already paid.
- **Security**: no AWS keys stored anywhere — OIDC, branch-scoped trust. `infra/`
  holds no secrets; `terraform.tfstate` and `terraform.tfvars` are gitignored.

## Status (2026-06-13)

**Live.** Infra applied (14 resources), GitHub variables wired, PR #4 merged to
`main`, first deploy succeeded. `https://qalma.dev/` serves over HTTP/2+Brotli
from CloudFront; HTML is `must-revalidate`, hashed assets are `immutable`.
Subsequent deploys fire automatically when a push to `main` affects `docs`.

Known follow-up: the CI actions (`nrwl/nx-set-shas`, `pnpm/action-setup`,
`aws-actions/configure-aws-credentials`) emit a Node 20 deprecation warning —
non-blocking, bump when convenient.

Related: [[docs-hosting]] (memory), and the deploy workflow lives next to the
npm `release.yml`.
