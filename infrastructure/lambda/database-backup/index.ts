import { SecretsManager } from 'aws-sdk';
import { S3 } from 'aws-sdk';
import { RDS } from 'aws-sdk';

const secretsManager = new SecretsManager();
const s3 = new S3();
const rds = new RDS();

export const handler = async (event: any): Promise<void> => {
  try {
    // Get database credentials from Secrets Manager
    const secret = await secretsManager.getSecretValue({
      SecretId: process.env.DATABASE_SECRET_ARN!
    }).promise();

    const credentials = JSON.parse(secret.SecretString!);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.sql`;

    // Create backup using pg_dump
    const backupCommand = `PGPASSWORD=${credentials.password} pg_dump -h ${credentials.host} -U ${credentials.username} -d ${credentials.dbname} -F c -f /tmp/${backupFileName}`;
    
    // Execute backup command
    const { exec } = require('child_process');
    await new Promise((resolve, reject) => {
      exec(backupCommand, (error: any, stdout: any, stderr: any) => {
        if (error) {
          console.error(`Backup error: ${error}`);
          reject(error);
          return;
        }
        resolve(stdout);
      });
    });

    // Upload backup to S3
    await s3.upload({
      Bucket: process.env.BACKUP_BUCKET!,
      Key: `database-backups/${backupFileName}`,
      Body: require('fs').createReadStream(`/tmp/${backupFileName}`),
      ServerSideEncryption: 'AES256'
    }).promise();

    // Clean up local backup file
    require('fs').unlinkSync(`/tmp/${backupFileName}`);

    // Delete old backups (keep last 7 days)
    const oldBackups = await s3.listObjects({
      Bucket: process.env.BACKUP_BUCKET!,
      Prefix: 'database-backups/'
    }).promise();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const oldBackupKeys = oldBackups.Contents
      ?.filter(obj => obj.LastModified && obj.LastModified < sevenDaysAgo)
      .map(obj => ({ Key: obj.Key! }));

    if (oldBackupKeys && oldBackupKeys.length > 0) {
      await s3.deleteObjects({
        Bucket: process.env.BACKUP_BUCKET!,
        Delete: { Objects: oldBackupKeys }
      }).promise();
    }

    console.log('Database backup completed successfully');
  } catch (error) {
    console.error('Error during database backup:', error);
    throw error;
  }
}; 