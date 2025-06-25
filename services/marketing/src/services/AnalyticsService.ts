import { PrismaClient } from '@prisma/client';
import { Matrix } from 'ml-matrix';
import { RandomForestClassifier } from 'ml-random-forest';
import { KMeans } from 'ml-kmeans';
import { PCA } from 'ml-pca';

const prisma = new PrismaClient();

export class AnalyticsService {
  async analyzeCampaignPerformance(campaignId: string) {
    try {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          posts: true,
          emails: true,
        },
      });

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Calculate key metrics
      const metrics = {
        totalSpent: campaign.metrics?.spent || 0,
        totalReach: campaign.metrics?.reach || 0,
        totalEngagement: campaign.metrics?.engagement || 0,
        posts: campaign.posts.length,
        emails: campaign.emails.length,
        roi: this.calculateROI(campaign),
      };

      // Perform predictive analysis
      const predictions = await this.predictCampaignOutcomes(campaign);

      return {
        metrics,
        predictions,
      };
    } catch (error) {
      console.error('Error analyzing campaign performance:', error);
      throw error;
    }
  }

  async segmentAudience(data: any[]) {
    try {
      // Prepare data for clustering
      const features = data.map(item => [
        item.engagement,
        item.frequency,
        item.recency,
      ]);

      // Perform PCA for dimensionality reduction
      const pca = new PCA(features);
      const reducedFeatures = pca.predict(features);

      // Perform K-means clustering
      const kmeans = new KMeans(reducedFeatures, 3);
      const clusters = kmeans.clusters;

      // Map clusters back to original data
      return data.map((item, index) => ({
        ...item,
        segment: clusters[index],
      }));
    } catch (error) {
      console.error('Error segmenting audience:', error);
      throw error;
    }
  }

  async predictCampaignOutcomes(campaign: any) {
    try {
      // Prepare historical data
      const historicalData = await prisma.campaign.findMany({
        where: {
          status: 'completed',
        },
        take: 100,
      });

      // Extract features
      const features = historicalData.map(c => [
        c.metrics?.spent || 0,
        c.metrics?.reach || 0,
        c.metrics?.engagement || 0,
      ]);

      // Create labels (success/failure based on ROI)
      const labels = historicalData.map(c => 
        this.calculateROI(c) > 0 ? 1 : 0
      );

      // Train random forest model
      const rf = new RandomForestClassifier({
        nEstimators: 10,
        maxDepth: 5,
      });

      rf.train(features, labels);

      // Make predictions for current campaign
      const prediction = rf.predict([
        [
          campaign.metrics?.spent || 0,
          campaign.metrics?.reach || 0,
          campaign.metrics?.engagement || 0,
        ],
      ]);

      return {
        successProbability: prediction[0],
        recommendedActions: this.getRecommendedActions(campaign, prediction[0]),
      };
    } catch (error) {
      console.error('Error predicting campaign outcomes:', error);
      throw error;
    }
  }

  private calculateROI(campaign: any): number {
    const spent = campaign.metrics?.spent || 0;
    const revenue = campaign.metrics?.revenue || 0;
    return spent > 0 ? ((revenue - spent) / spent) * 100 : 0;
  }

  private getRecommendedActions(campaign: any, successProbability: number) {
    const actions = [];

    if (successProbability < 0.5) {
      actions.push('Increase budget allocation');
      actions.push('Optimize content for better engagement');
      actions.push('Expand to additional channels');
    } else if (successProbability > 0.8) {
      actions.push('Scale campaign to larger audience');
      actions.push('Increase frequency of posts');
      actions.push('Test new content variations');
    }

    return actions;
  }
} 