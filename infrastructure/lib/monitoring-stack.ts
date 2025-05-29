import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create SNS topic for alerts
    const alertTopic = new sns.Topic(this, 'MonitoringAlerts', {
      displayName: 'Faithtech Monitoring Alerts',
    });

    // Add email subscription for alerts
    alertTopic.addSubscription(
      new subscriptions.EmailSubscription('alerts@faithtech.com')
    );

    // Create CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'FaithtechDashboard', {
      dashboardName: 'Faithtech-Monitoring',
    });

    // Database Metrics
    const database = rds.DatabaseInstance.fromDatabaseInstanceAttributes(
      this,
      'ImportedDatabase',
      {
        instanceEndpointAddress: cdk.Fn.importValue('DatabaseEndpoint'),
        instanceIdentifier: 'FaithtechDatabase',
        port: 5432,
      }
    );

    // Database Alarms
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

    new cloudwatch.Alarm(this, 'DatabaseStorageAlarm', {
      metric: database.metricFreeStorageSpace(),
      threshold: 1024 * 1024 * 1024, // 1GB
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'Database storage space is running low',
      actionsEnabled: true,
    }).addAlarmAction(new cloudwatch.SnsAction(alertTopic));

    // Application Metrics
    const applicationErrors = new cloudwatch.Metric({
      namespace: 'Faithtech/Application',
      metricName: 'ErrorCount',
      statistic: 'Sum',
      period: cdk.Duration.minutes(5),
    });

    new cloudwatch.Alarm(this, 'ApplicationErrorsAlarm', {
      metric: applicationErrors,
      threshold: 10,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      alarmDescription: 'High number of application errors',
      actionsEnabled: true,
    }).addAlarmAction(new cloudwatch.SnsAction(alertTopic));

    // API Metrics
    const apiLatency = new cloudwatch.Metric({
      namespace: 'Faithtech/API',
      metricName: 'Latency',
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    new cloudwatch.Alarm(this, 'APILatencyAlarm', {
      metric: apiLatency,
      threshold: 1000, // 1 second
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'API latency is too high',
      actionsEnabled: true,
    }).addAlarmAction(new cloudwatch.SnsAction(alertTopic));

    // Add widgets to dashboard
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Database Metrics',
        left: [
          database.metricCPUUtilization(),
          database.metricDatabaseConnections(),
          database.metricFreeStorageSpace(),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Application Metrics',
        left: [applicationErrors],
      }),
      new cloudwatch.GraphWidget({
        title: 'API Metrics',
        left: [apiLatency],
      })
    );

    // Create log groups
    new cloudwatch.LogGroup(this, 'ApplicationLogs', {
      logGroupName: '/faithtech/application',
      retention: cloudwatch.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    new cloudwatch.LogGroup(this, 'APILogs', {
      logGroupName: '/faithtech/api',
      retention: cloudwatch.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create log group for database logs
    new cloudwatch.LogGroup(this, 'DatabaseLogs', {
      logGroupName: '/faithtech/database',
      retention: cloudwatch.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });
  }
} 