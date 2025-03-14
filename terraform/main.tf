provider "aws" {}

terraform {
  required_version = "= 1.2.9"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "= 4.31.0"
    }
  }

  backend "s3" {
    bucket = "chrislewis-tfstate"
    key    = "xeno"
    region = "us-east-1"
  }
}

module "main" {
  source = "github.com/c-d-lewis/terraform-modules//s3-cloudfront-website?ref=master"

  region              = "us-east-1"
  project_name        = "xeno"
  zone_id             = "Z05682866H59A0KFT8S"
  domain_name         = "xeno.chrislewis.me.uk"
  certificate_arn     = "arn:aws:acm:us-east-1:617929423658:certificate/a69e6906-579e-431d-9e4c-707877d325b7"
  logs_bucket         = "chrislewis-cloudwatch-logs"
  default_root_object = "dist/index.html"
}
