# AWS Backup Configuration

# Backup Vault
resource "aws_backup_vault" "main" {
  name = "${var.project_name}-backup-vault"
  tags = var.tags
}

# Backup Plan
resource "aws_backup_plan" "main" {
  name = "${var.project_name}-backup-plan"

  rule {
    rule_name         = "daily_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 ? * * *)" # Daily at 5 AM UTC

    lifecycle {
      delete_after = 30
    }
  }

  rule {
    rule_name         = "weekly_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 ? * SUN *)" # Weekly on Sunday at 5 AM UTC

    lifecycle {
      delete_after = 90
    }
  }

  rule {
    rule_name         = "monthly_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 1 * ? *)" # Monthly on the 1st at 5 AM UTC

    lifecycle {
      delete_after = 365
    }
  }

  tags = var.tags
}

# Backup Selection
resource "aws_backup_selection" "main" {
  name         = "${var.project_name}-backup-selection"
  plan_id      = aws_backup_plan.main.id
  iam_role_arn = aws_iam_role.backup_role.arn

  resources = [
    aws_db_instance.main.arn,
    aws_elasticache_cluster.main.arn,
    aws_s3_bucket.static_assets.arn,
  ]
}

# IAM Role for AWS Backup
resource "aws_iam_role" "backup_role" {
  name = "${var.project_name}-backup-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "backup.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "backup_role" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup"
  role       = aws_iam_role.backup_role.name
}

# Cross-Region Replication
resource "aws_backup_vault" "replica" {
  provider = aws.replica
  name     = "${var.project_name}-backup-vault-replica"
  tags     = var.tags
}

resource "aws_backup_plan" "replica" {
  provider = aws.replica
  name     = "${var.project_name}-backup-plan-replica"

  rule {
    rule_name         = "replica_backups"
    target_vault_name = aws_backup_vault.replica.name
    schedule          = "cron(0 6 ? * * *)" # Daily at 6 AM UTC

    lifecycle {
      delete_after = 365
    }
  }

  tags = var.tags
}

# S3 Cross-Region Replication
resource "aws_s3_bucket" "backup" {
  provider = aws.replica
  bucket   = "${var.project_name}-backup-${var.replica_region}"
  acl      = "private"

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

resource "aws_s3_bucket_policy" "backup" {
  provider = aws.replica
  bucket   = aws_s3_bucket.backup.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.backup_role.arn
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.backup.arn,
          "${aws_s3_bucket.backup.arn}/*"
        ]
      }
    ]
  })
}

# CloudWatch Alarms for Backup
resource "aws_cloudwatch_metric_alarm" "backup_failure" {
  alarm_name          = "${var.project_name}-backup-failure"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "BackupJobFailure"
  namespace           = "AWS/Backup"
  period             = "300"
  statistic          = "Sum"
  threshold          = "0"
  alarm_description  = "This metric monitors failed backup jobs"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  dimensions = {
    BackupVaultName = aws_backup_vault.main.name
  }
}

resource "aws_cloudwatch_metric_alarm" "backup_restore_failure" {
  alarm_name          = "${var.project_name}-backup-restore-failure"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RestoreJobFailure"
  namespace           = "AWS/Backup"
  period             = "300"
  statistic          = "Sum"
  threshold          = "0"
  alarm_description  = "This metric monitors failed restore jobs"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  dimensions = {
    BackupVaultName = aws_backup_vault.main.name
  }
}

# Backup Testing
resource "aws_backup_plan" "test" {
  name = "${var.project_name}-backup-test-plan"

  rule {
    rule_name         = "test_backups"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 7 ? * SAT *)" # Weekly on Saturday at 7 AM UTC

    lifecycle {
      delete_after = 7
    }
  }

  tags = var.tags
}

resource "aws_backup_selection" "test" {
  name         = "${var.project_name}-backup-test-selection"
  plan_id      = aws_backup_plan.test.id
  iam_role_arn = aws_iam_role.backup_role.arn

  resources = [
    aws_db_instance.main.arn,
  ]
}

# Backup Monitoring
resource "aws_cloudwatch_dashboard" "backup" {
  dashboard_name = "${var.project_name}-backup-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Backup", "BackupJobSuccess", "BackupVaultName", aws_backup_vault.main.name],
            ["AWS/Backup", "BackupJobFailure", "BackupVaultName", aws_backup_vault.main.name]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Backup Jobs"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Backup", "RestoreJobSuccess", "BackupVaultName", aws_backup_vault.main.name],
            ["AWS/Backup", "RestoreJobFailure", "BackupVaultName", aws_backup_vault.main.name]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Restore Jobs"
        }
      },
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Backup", "BackupJobDuration", "BackupVaultName", aws_backup_vault.main.name]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Backup Job Duration"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Backup", "RestoreJobDuration", "BackupVaultName", aws_backup_vault.main.name]
          ]
          period = 300
          stat   = "Average"
          region = var.aws_region
          title  = "Restore Job Duration"
        }
      }
    ]
  })
} 