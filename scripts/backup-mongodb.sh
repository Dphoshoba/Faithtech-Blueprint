#!/bin/bash

# Configuration
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/mongodb"
S3_BUCKET="faithtech-blueprint-backups"
RETENTION_DAYS=30

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# MongoDB connection string (from environment or parameter)
MONGO_URI=$1

if [ -z "$MONGO_URI" ]; then
  echo "Error: MongoDB connection string not provided"
  echo "Usage: $0 <mongodb-uri>"
  exit 1
fi

# Create backup
echo "Starting MongoDB backup..."
mongodump --uri="$MONGO_URI" --out="$BACKUP_DIR/backup_$TIMESTAMP"

if [ $? -ne 0 ]; then
  echo "Error: Backup failed"
  exit 1
fi

# Compress backup
echo "Compressing backup..."
tar -czf "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" -C "$BACKUP_DIR" "backup_$TIMESTAMP"

if [ $? -ne 0 ]; then
  echo "Error: Compression failed"
  rm -rf "$BACKUP_DIR/backup_$TIMESTAMP"
  exit 1
fi

# Upload to S3
echo "Uploading to S3..."
aws s3 cp "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" "s3://$S3_BUCKET/mongodb/backup_$TIMESTAMP.tar.gz"

if [ $? -ne 0 ]; then
  echo "Error: Upload to S3 failed"
  rm -rf "$BACKUP_DIR/backup_$TIMESTAMP"
  rm -f "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"
  exit 1
fi

# Delete local temporary files
echo "Cleaning up local files..."
rm -rf "$BACKUP_DIR/backup_$TIMESTAMP"
rm -f "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"

# Delete old backups from S3
echo "Removing backups older than $RETENTION_DAYS days..."
aws s3 ls "s3://$S3_BUCKET/mongodb/" | grep backup_ | awk '{print $4}' | while read -r backup_file; do
  backup_date=$(echo "$backup_file" | sed -E 's/backup_([0-9]{8})_.*/\1/')
  backup_date_seconds=$(date -d "${backup_date:0:4}-${backup_date:4:2}-${backup_date:6:2}" +%s)
  current_date_seconds=$(date +%s)
  age_days=$(( (current_date_seconds - backup_date_seconds) / 86400 ))
  
  if [ "$age_days" -gt "$RETENTION_DAYS" ]; then
    echo "Deleting old backup: $backup_file"
    aws s3 rm "s3://$S3_BUCKET/mongodb/$backup_file"
  fi
done

echo "Backup completed successfully."

# Add backup status to monitoring
if [ -n "$MONITORING_ENDPOINT" ]; then
  curl -X POST "$MONITORING_ENDPOINT" \
    -H "Content-Type: application/json" \
    -d "{
      \"status\": \"success\",
      \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\",
      \"backup_file\": \"backup_$TIMESTAMP.tar.gz\",
      \"size\": $(stat -f%z "$BACKUP_DIR/backup_$TIMESTAMP.tar.gz" 2>/dev/null || echo 0)
    }"
fi 