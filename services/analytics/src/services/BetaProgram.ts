import { PrismaClient } from '@prisma/client';
import { ChurchMetrics, UserActivity, FeatureUsage } from '../types/Analytics';
import { Matrix } from 'ml-matrix';
import { RandomForestRegression } from 'ml-random-forest';
import { KMeans } from 'ml-kmeans';
import { PCA } from 'ml-pca';
import { SentimentAnalyzer } from 'natural';
import { OpenAI } from 'openai';

export class BetaProgram {
  private prisma: PrismaClient;
  private openai: OpenAI;
  private sentimentAnalyzer: SentimentAnalyzer;

  constructor() {
    this.prisma = new PrismaClient();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.sentimentAnalyzer = new SentimentAnalyzer('English', 'afinn', 'pattern');
  }

  async createSurvey(params: {
    churchId: string;
    title: string;
    questions: Array<{
      type: 'multiple_choice' | 'text' | 'rating';
      question: string;
      options?: string[];
    }>;
    targetAudience: 'all' | 'specific_roles' | 'specific_features';
    targetRoles?: string[];
    targetFeatures?: string[];
  }): Promise<{
    surveyId: string;
    status: 'draft' | 'active' | 'completed';
  }> {
    const { churchId, title, questions, targetAudience, targetRoles, targetFeatures } = params;

    const survey = await this.prisma.survey.create({
      data: {
        churchId,
        title,
        questions: questions as any,
        targetAudience,
        targetRoles,
        targetFeatures,
        status: 'draft',
      },
    });

    return {
      surveyId: survey.id,
      status: survey.status,
    };
  }

  async submitSurveyResponse(params: {
    surveyId: string;
    userId: string;
    responses: Array<{
      questionId: string;
      answer: string | number | string[];
    }>;
  }): Promise<{
    responseId: string;
    sentiment: number;
    insights: string[];
  }> {
    const { surveyId, userId, responses } = params;

    // Analyze sentiment for text responses
    const textResponses = responses.filter(r => typeof r.answer === 'string');
    const sentiments = textResponses.map(r => 
      this.sentimentAnalyzer.getSentiment((r.answer as string).split(' '))
    );
    const averageSentiment = sentiments.reduce((a, b) => a + b, 0) / sentiments.length;

    // Generate insights using OpenAI
    const insights = await this.generateInsights(responses);

    const response = await this.prisma.surveyResponse.create({
      data: {
        surveyId,
        userId,
        responses: responses as any,
        sentiment: averageSentiment,
        insights,
      },
    });

    return {
      responseId: response.id,
      sentiment: averageSentiment,
      insights,
    };
  }

  async getSurveyAnalytics(params: {
    surveyId: string;
  }): Promise<{
    totalResponses: number;
    completionRate: number;
    averageSentiment: number;
    sentimentTrend: Array<{
      date: Date;
      sentiment: number;
    }>;
    topInsights: string[];
    featureFeedback: Array<{
      feature: string;
      rating: number;
      comments: string[];
    }>;
  }> {
    const { surveyId } = params;

    const responses = await this.prisma.surveyResponse.findMany({
      where: { surveyId },
      include: {
        user: true,
      },
    });

    const totalResponses = responses.length;
    const completionRate = this.calculateCompletionRate(responses);
    const averageSentiment = this.calculateAverageSentiment(responses);
    const sentimentTrend = this.calculateSentimentTrend(responses);
    const topInsights = await this.aggregateTopInsights(responses);
    const featureFeedback = await this.analyzeFeatureFeedback(responses);

    return {
      totalResponses,
      completionRate,
      averageSentiment,
      sentimentTrend,
      topInsights,
      featureFeedback,
    };
  }

  async generateFeedbackReport(params: {
    churchId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<{
    summary: string;
    keyFindings: string[];
    recommendations: string[];
    sentimentAnalysis: {
      overall: number;
      byFeature: Record<string, number>;
      byUserRole: Record<string, number>;
    };
    featureRequests: Array<{
      feature: string;
      count: number;
      priority: 'high' | 'medium' | 'low';
    }>;
  }> {
    const { churchId, startDate, endDate } = params;

    // Get all survey responses for the period
    const responses = await this.prisma.surveyResponse.findMany({
      where: {
        survey: {
          churchId,
        },
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        survey: true,
        user: true,
      },
    });

    // Generate summary using OpenAI
    const summary = await this.generateSummary(responses);

    // Extract key findings
    const keyFindings = await this.extractKeyFindings(responses);

    // Generate recommendations
    const recommendations = await this.generateRecommendations(responses);

    // Analyze sentiment
    const sentimentAnalysis = this.analyzeSentiment(responses);

    // Analyze feature requests
    const featureRequests = await this.analyzeFeatureRequests(responses);

    return {
      summary,
      keyFindings,
      recommendations,
      sentimentAnalysis,
      featureRequests,
    };
  }

  private async generateInsights(responses: Array<{
    questionId: string;
    answer: string | number | string[];
  }>): Promise<string[]> {
    const prompt = `Analyze the following survey responses and provide key insights:
      ${JSON.stringify(responses, null, 2)}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing user feedback and extracting meaningful insights.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    return completion.choices[0].message.content.split('\n').filter(Boolean);
  }

  private calculateCompletionRate(responses: any[]): number {
    const totalQuestions = responses[0]?.survey.questions.length || 0;
    const completedQuestions = responses.reduce(
      (sum, r) => sum + r.responses.length,
      0
    );
    return (completedQuestions / (totalQuestions * responses.length)) * 100;
  }

  private calculateAverageSentiment(responses: any[]): number {
    return (
      responses.reduce((sum, r) => sum + r.sentiment, 0) / responses.length
    );
  }

  private calculateSentimentTrend(responses: any[]): Array<{
    date: Date;
    sentiment: number;
  }> {
    const dailySentiments = responses.reduce((acc, r) => {
      const date = r.createdAt.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { sum: 0, count: 0 };
      }
      acc[date].sum += r.sentiment;
      acc[date].count += 1;
      return acc;
    }, {} as Record<string, { sum: number; count: number }>);

    return Object.entries(dailySentiments).map(([date, { sum, count }]) => ({
      date: new Date(date),
      sentiment: sum / count,
    }));
  }

  private async aggregateTopInsights(responses: any[]): Promise<string[]> {
    const allInsights = responses.flatMap(r => r.insights);
    const prompt = `Analyze these insights and provide the top 5 most important ones:
      ${JSON.stringify(allInsights, null, 2)}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing user feedback and extracting meaningful insights.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    return completion.choices[0].message.content.split('\n').filter(Boolean);
  }

  private async analyzeFeatureFeedback(responses: any[]): Promise<Array<{
    feature: string;
    rating: number;
    comments: string[];
  }>> {
    const featureFeedback = responses.reduce((acc, r) => {
      r.responses.forEach((response: any) => {
        if (response.questionId.startsWith('feature_')) {
          const feature = response.questionId.replace('feature_', '');
          if (!acc[feature]) {
            acc[feature] = {
              feature,
              ratings: [],
              comments: [],
            };
          }
          if (typeof response.answer === 'number') {
            acc[feature].ratings.push(response.answer);
          } else if (typeof response.answer === 'string') {
            acc[feature].comments.push(response.answer);
          }
        }
      });
      return acc;
    }, {} as Record<string, { feature: string; ratings: number[]; comments: string[] }>);

    return Object.values(featureFeedback).map(({ feature, ratings, comments }) => ({
      feature,
      rating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
      comments,
    }));
  }

  private async generateSummary(responses: any[]): Promise<string> {
    const prompt = `Generate a summary of the following survey responses:
      ${JSON.stringify(responses, null, 2)}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing user feedback and providing concise summaries.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  }

  private async extractKeyFindings(responses: any[]): Promise<string[]> {
    const prompt = `Extract the key findings from these survey responses:
      ${JSON.stringify(responses, null, 2)}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing user feedback and extracting key findings.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    return completion.choices[0].message.content.split('\n').filter(Boolean);
  }

  private async generateRecommendations(responses: any[]): Promise<string[]> {
    const prompt = `Based on these survey responses, provide actionable recommendations:
      ${JSON.stringify(responses, null, 2)}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing user feedback and providing actionable recommendations.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    return completion.choices[0].message.content.split('\n').filter(Boolean);
  }

  private analyzeSentiment(responses: any[]): {
    overall: number;
    byFeature: Record<string, number>;
    byUserRole: Record<string, number>;
  } {
    const byFeature: Record<string, number[]> = {};
    const byUserRole: Record<string, number[]> = {};

    responses.forEach(r => {
      // Overall sentiment
      const overall = r.sentiment;

      // By feature
      r.responses.forEach((response: any) => {
        if (response.questionId.startsWith('feature_')) {
          const feature = response.questionId.replace('feature_', '');
          if (!byFeature[feature]) {
            byFeature[feature] = [];
          }
          byFeature[feature].push(r.sentiment);
        }
      });

      // By user role
      const role = r.user.role;
      if (!byUserRole[role]) {
        byUserRole[role] = [];
      }
      byUserRole[role].push(r.sentiment);
    });

    return {
      overall: responses.reduce((sum, r) => sum + r.sentiment, 0) / responses.length,
      byFeature: Object.entries(byFeature).reduce(
        (acc, [feature, sentiments]) => ({
          ...acc,
          [feature]: sentiments.reduce((a, b) => a + b, 0) / sentiments.length,
        }),
        {}
      ),
      byUserRole: Object.entries(byUserRole).reduce(
        (acc, [role, sentiments]) => ({
          ...acc,
          [role]: sentiments.reduce((a, b) => a + b, 0) / sentiments.length,
        }),
        {}
      ),
    };
  }

  private async analyzeFeatureRequests(responses: any[]): Promise<Array<{
    feature: string;
    count: number;
    priority: 'high' | 'medium' | 'low';
  }>> {
    const featureRequests = responses.reduce((acc, r) => {
      r.responses.forEach((response: any) => {
        if (response.questionId === 'feature_requests') {
          const features = (response.answer as string).split(',').map(f => f.trim());
          features.forEach(feature => {
            if (!acc[feature]) {
              acc[feature] = 0;
            }
            acc[feature]++;
          });
        }
      });
      return acc;
    }, {} as Record<string, number>);

    const prompt = `Analyze these feature request counts and assign priorities:
      ${JSON.stringify(featureRequests, null, 2)}`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at analyzing feature requests and assigning priorities.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 500,
    });

    const priorities = JSON.parse(completion.choices[0].message.content);

    return Object.entries(featureRequests).map(([feature, count]) => ({
      feature,
      count,
      priority: priorities[feature],
    }));
  }
} 