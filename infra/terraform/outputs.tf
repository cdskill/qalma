output "bucket_name" {
  description = "S3 origin bucket — set as GitHub variable DOCS_S3_BUCKET."
  value       = aws_s3_bucket.docs.bucket
}

output "distribution_id" {
  description = "CloudFront distribution id — set as GitHub variable DOCS_CF_DISTRIBUTION_ID."
  value       = aws_cloudfront_distribution.docs.id
}

output "deploy_role_arn" {
  description = "IAM role the CI assumes via OIDC — set as GitHub variable DOCS_DEPLOY_ROLE_ARN."
  value       = aws_iam_role.deploy.arn
}

output "cloudfront_domain" {
  description = "Raw CloudFront domain (useful to test before DNS propagates)."
  value       = aws_cloudfront_distribution.docs.domain_name
}

output "site_url" {
  value = "https://${var.domain_name}"
}
