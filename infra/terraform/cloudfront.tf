resource "aws_cloudfront_origin_access_control" "docs" {
  name                              = "${var.domain_name}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_function" "rewrite" {
  name    = "${replace(var.domain_name, ".", "-")}-rewrite"
  runtime = "cloudfront-js-2.0"
  comment = "Rewrite clean URLs to prerendered index.html"
  publish = true
  code    = file("${path.module}/functions/rewrite.js")
}

resource "aws_cloudfront_distribution" "docs" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "Qalma docs (${var.domain_name})"
  default_root_object = "index.html"
  aliases             = [var.domain_name]
  price_class         = var.price_class

  # HTTP/3 (QUIC) + HTTP/2: faster connection setup → better TTFB.
  http_version = "http2and3"

  origin {
    origin_id                = "s3-docs"
    domain_name              = aws_s3_bucket.docs.bucket_regional_domain_name
    origin_access_control_id = aws_cloudfront_origin_access_control.docs.id
  }

  default_cache_behavior {
    target_origin_id       = "s3-docs"
    viewer_protocol_policy = "redirect-to-https"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]

    # Edge Brotli/Gzip compression → smaller payloads → faster FCP.
    compress = true

    # Managed "CachingOptimized" policy (honours the Cache-Control headers we
    # set per-object at upload time: immutable for hashed assets, revalidate
    # for HTML/sitemap).
    cache_policy_id = "658327ea-f89d-4fab-a63d-7e88639e58f6"

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.rewrite.arn
    }
  }

  # Missing objects on a private OAC origin return 403. Serve the SPA shell so
  # Angular can client-render any route that wasn't prerendered.
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 10
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.docs.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }
}
