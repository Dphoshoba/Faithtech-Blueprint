import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class FaithtechStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC for our infrastructure
    const vpc = new ec2.Vpc(this, 'FaithtechVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // Security Groups
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: true,
    });

    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from within VPC'
    );

    // RDS Database
    const database = new rds.DatabaseInstance(this, 'FaithtechDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14,
      }),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [dbSecurityGroup],
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      backupRetention: cdk.Duration.days(7),
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
    });

    // S3 Bucket for static assets
    const staticAssetsBucket = new s3.Bucket(this, 'StaticAssetsBucket', {
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          expiration: cdk.Duration.days(365),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
    });

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'FaithtechDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(staticAssetsBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enableLogging: true,
      logIncludesCookies: true,
    });

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'FaithtechAlerts', {
      displayName: 'Faithtech Alerts',
    });

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'DatabaseCPUAlarm', {
      metric: database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'Database CPU utilization is too high',
      actionsEnabled: true,
    }).addAlarmAction(new cloudwatch.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, 'DatabaseConnectionsAlarm', {
      metric: database.metricDatabaseConnections(),
      threshold: 100,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'Database connection count is too high',
      actionsEnabled: true,
    }).addAlarmAction(new cloudwatch.SnsAction(alertTopic));

    // Lambda function for database backups
    const backupFunction = new lambda.Function(this, 'DatabaseBackupFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lambda/database-backup'),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      environment: {
        DATABASE_SECRET_ARN: database.secret?.secretArn || '',
        BACKUP_BUCKET: staticAssetsBucket.bucketName,
      },
      timeout: cdk.Duration.minutes(5),
    });

    // Grant permissions
    database.secret?.grantRead(backupFunction);
    staticAssetsBucket.grantWrite(backupFunction);

    // Outputs
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'Database endpoint',
    });

    new cdk.CfnOutput(this, 'DistributionDomain', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain',
    });
  }
} 