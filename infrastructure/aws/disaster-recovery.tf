# Disaster Recovery Configuration

# Cross-Region Replication for S3
resource "aws_s3_bucket" "backup" {
  bucket = "${var.project_name}-backup-${var.aws_region}"
  acl    = "private"

  versioning {
    enabled = true
  }

  lifecycle_rule {
    enabled = true

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }

  tags = var.tags
}

resource "aws_s3_bucket_replication_configuration" "backup" {
  bucket = aws_s3_bucket.backup.id
  role   = aws_iam_role.replication.arn

  destination {
    bucket        = aws_s3_bucket.backup_dr.arn
    storage_class = "STANDARD"
  }
}

resource "aws_s3_bucket" "backup_dr" {
  provider = aws.dr
  bucket   = "${var.project_name}-backup-dr"
  acl      = "private"

  versioning {
    enabled = true
  }

  tags = var.tags
}

# IAM Role for S3 Replication
resource "aws_iam_role" "replication" {
  name = "${var.project_name}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "replication" {
  name = "${var.project_name}-s3-replication-policy"
  role = aws_iam_role.replication.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.backup.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Resource = [
          "${aws_s3_bucket.backup.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Resource = [
          "${aws_s3_bucket.backup_dr.arn}/*"
        ]
      }
    ]
  })
}

# RDS Cross-Region Replica
resource "aws_db_instance" "dr_replica" {
  provider = aws.dr

  identifier           = "${var.project_name}-dr-replica"
  replicate_source_db  = aws_db_instance.main.identifier
  instance_class       = aws_db_instance.main.instance_class
  allocated_storage    = aws_db_instance.main.allocated_storage
  storage_type         = aws_db_instance.main.storage_type
  skip_final_snapshot  = true
  publicly_accessible  = false
  multi_az            = true

  tags = var.tags
}

# Route53 Health Checks
resource "aws_route53_health_check" "primary" {
  fqdn              = aws_lb.main.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = var.tags
}

resource "aws_route53_health_check" "dr" {
  provider = aws.dr

  fqdn              = aws_lb.dr.dns_name
  port              = 443
  type              = "HTTPS"
  resource_path     = "/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = var.tags
}

# Route53 Failover Configuration
resource "aws_route53_record" "failover" {
  zone_id = var.route53_zone_id
  name    = var.domain_name
  type    = "A"

  failover_routing_policy {
    type = "PRIMARY"
  }

  set_identifier = "primary"
  health_check_id = aws_route53_health_check.primary.id

  alias {
    name                   = aws_lb.main.dns_name
    zone_id                = aws_lb.main.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "failover_dr" {
  provider = aws.dr
  zone_id  = var.route53_zone_id
  name     = var.domain_name
  type     = "A"

  failover_routing_policy {
    type = "SECONDARY"
  }

  set_identifier = "dr"
  health_check_id = aws_route53_health_check.dr.id

  alias {
    name                   = aws_lb.dr.dns_name
    zone_id                = aws_lb.dr.zone_id
    evaluate_target_health = true
  }
}

# CloudWatch Alarms for DR
resource "aws_cloudwatch_metric_alarm" "primary_health" {
  alarm_name          = "${var.project_name}-primary-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period             = "60"
  statistic          = "Minimum"
  threshold          = "1"
  alarm_description  = "This metric monitors the health of the primary region"
  alarm_actions      = [aws_sns_topic.dr_alerts.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.primary.id
  }
}

resource "aws_cloudwatch_metric_alarm" "dr_health" {
  provider = aws.dr

  alarm_name          = "${var.project_name}-dr-health"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period             = "60"
  statistic          = "Minimum"
  threshold          = "1"
  alarm_description  = "This metric monitors the health of the DR region"
  alarm_actions      = [aws_sns_topic.dr_alerts.arn]

  dimensions = {
    HealthCheckId = aws_route53_health_check.dr.id
  }
}

# SNS Topic for DR Alerts
resource "aws_sns_topic" "dr_alerts" {
  name = "${var.project_name}-dr-alerts"
}

resource "aws_sns_topic_policy" "dr_alerts" {
  arn = aws_sns_topic.dr_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.dr_alerts.arn
      }
    ]
  })
}

# DR Testing Schedule
resource "aws_cloudwatch_event_rule" "dr_test" {
  name                = "${var.project_name}-dr-test"
  description         = "Schedule for DR testing"
  schedule_expression = "cron(0 0 ? * 1 *)"  # Weekly on Sunday at midnight
}

resource "aws_cloudwatch_event_target" "dr_test" {
  rule      = aws_cloudwatch_event_rule.dr_test.name
  target_id = "${var.project_name}-dr-test"
  arn       = aws_lambda_function.dr_test.arn
}

# Lambda Function for DR Testing
resource "aws_lambda_function" "dr_test" {
  filename         = "lambda/dr-test.zip"
  function_name    = "${var.project_name}-dr-test"
  role            = aws_iam_role.dr_test.arn
  handler         = "index.handler"
  runtime         = "nodejs14.x"
  timeout         = 300
  memory_size     = 256

  environment {
    variables = {
      PRIMARY_REGION = var.aws_region
      DR_REGION     = var.dr_region
    }
  }

  tags = var.tags
}

# IAM Role for DR Testing Lambda
resource "aws_iam_role" "dr_test" {
  name = "${var.project_name}-dr-test-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "dr_test" {
  name = "${var.project_name}-dr-test-policy"
  role = aws_iam_role.dr_test.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "rds:DescribeDBInstances",
          "rds:StartDBInstance",
          "rds:StopDBInstance",
          "ec2:DescribeInstances",
          "ec2:StartInstances",
          "ec2:StopInstances",
          "route53:GetHealthCheckStatus",
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
} 