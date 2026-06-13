terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Optional but recommended: store state remotely once the bucket exists.
  # backend "s3" {
  #   bucket = "qalma-tfstate"
  #   key    = "docs/terraform.tfstate"
  #   region = "eu-west-1"
  # }
}

provider "aws" {
  region = var.aws_region
}

# CloudFront is a global service and its ACM certificate MUST live in us-east-1,
# regardless of where the origin bucket is. This aliased provider handles the cert.
provider "aws" {
  alias  = "us_east_1"
  region = "us-east-1"
}
