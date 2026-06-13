variable "aws_region" {
  description = "Region for the S3 origin bucket (CloudFront caches in front of it, so this is just the origin location)."
  type        = string
  default     = "eu-west-1"
}

variable "domain_name" {
  description = "Public domain the docs are served on, e.g. docs.qalma.dev"
  type        = string
}

variable "route53_zone_name" {
  description = "Name of the EXISTING Route 53 hosted zone that owns the domain, e.g. qalma.dev"
  type        = string
}

variable "github_repo" {
  description = "owner/repo allowed to assume the deploy role via GitHub OIDC."
  type        = string
  default     = "cdskill/qalma"
}

variable "github_branch" {
  description = "Branch allowed to deploy the docs."
  type        = string
  default     = "main"
}

variable "price_class" {
  description = "CloudFront price class. PriceClass_100 = NA + EU (cheapest). Use PriceClass_200 / PriceClass_All for wider edge coverage."
  type        = string
  default     = "PriceClass_100"
}

variable "create_oidc_provider" {
  description = "Create the GitHub OIDC provider. Set to false if your AWS account already has one for token.actions.githubusercontent.com."
  type        = bool
  default     = true
}
