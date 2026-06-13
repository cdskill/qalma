# Docs hosting — S3 + CloudFront

Serves the `apps/docs` SSG build (`dist/apps/docs/analog/public`) from a private
S3 bucket behind CloudFront, with a TLS cert from ACM and DNS in Route 53.
GitHub Actions builds in CI and publishes via an OIDC role (no stored AWS keys).

```
GitHub Actions (nx build docs)
        │  assume role via OIDC
        ▼
   S3 (private)  ◀── OAC ──  CloudFront (edge cache, HTTP/3, Brotli)  ──▶  https://<domain>
        ▲                                   ▲
   aws s3 sync                         ACM cert (us-east-1)
   + invalidation                     Route 53 alias
```

## Why this is fast (TTFB / FCP)

- **Edge cache** — CloudFront serves from the nearest edge PoP, so TTFB stays low worldwide.
- **Immutable assets** — hashed JS/CSS get `Cache-Control: max-age=31536000, immutable`: cached forever at edge + browser, never re-fetched.
- **Revalidated HTML** — `index.html`/`sitemap.xml` get `max-age=0, must-revalidate`: content updates appear immediately after deploy, no stale pages.
- **HTTP/3 + Brotli** — faster connection setup and smaller payloads → quicker first paint.
- **Prerendered HTML** — the SSG build already contains the rendered DOM, so the first byte the browser paints is real content (great for SEO too).

## Prerequisites

- An existing **Route 53 hosted zone** for your domain (e.g. `qalma.dev`).
- Terraform ≥ 1.6 and AWS CLI, authenticated to your account (`aws sts get-caller-identity` works).
- Permissions to create S3 / CloudFront / ACM / IAM / Route 53 resources.

## 1. Provision the infrastructure

```bash
cd infra/terraform
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: domain_name, route53_zone_name, github_repo

terraform init
terraform apply
```

`apply` creates the bucket, OAC, CloudFront distribution, ACM cert (DNS-validated
through Route 53), the alias records, and the GitHub OIDC deploy role. The cert
validation + CloudFront rollout take a few minutes.

> Already have a GitHub OIDC provider in the account? Set
> `create_oidc_provider = false` in `terraform.tfvars`.

Grab the outputs:

```bash
terraform output
```

## 2. Wire the outputs into GitHub Actions

Set them as **repository variables** (not secrets — none of these are sensitive):

```bash
gh variable set AWS_REGION               --body "eu-west-1"   # same as aws_region in tfvars
gh variable set DOCS_S3_BUCKET           --body "$(terraform output -raw bucket_name)"
gh variable set DOCS_CF_DISTRIBUTION_ID  --body "$(terraform output -raw distribution_id)"
gh variable set DOCS_DEPLOY_ROLE_ARN     --body "$(terraform output -raw deploy_role_arn)"
```

## 3. Deploy

The [`deploy-docs`](../../.github/workflows/deploy-docs.yml) workflow runs on every
push to `main` that touches `apps/docs/**` or `libs/editor/**`, and can be triggered
manually:

```bash
gh workflow run deploy-docs.yml
```

It builds the SSG output, syncs it to S3 with the per-type cache headers above,
and invalidates CloudFront.

## 4. Verify

```bash
# Before DNS propagates you can hit the raw CloudFront domain:
curl -I "https://$(terraform output -raw cloudfront_domain)/"

# After propagation:
curl -I "https://<domain>/"            # 200, HTML
curl -I "https://<domain>/sitemap.xml" # 200, application/xml
```

Check the response headers: hashed assets should show
`cache-control: public, max-age=31536000, immutable`, HTML should show
`max-age=0, must-revalidate`, and responses should be `content-encoding: br` (Brotli).

## Teardown

```bash
terraform destroy
```

(Empty the S3 bucket first if `destroy` complains it is not empty.)
