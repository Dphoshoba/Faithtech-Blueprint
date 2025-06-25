import { PrismaClient } from '@prisma/client';
import { BetaChurch, BetaSurvey, BetaSurveyResponse } from '../types/BetaChurch';

export class UserSurveys {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createSurvey(params: {
    title: string;
    description: string;
    questions: Array<{
      type: 'multiple_choice' | 'rating' | 'text' | 'boolean';
      text: string;
      required: boolean;
      options?: string[];
      minRating?: number;
      maxRating?: number;
    }>;
    targetAudience: {
      churchIds?: string[];
      userRoles?: string[];
      featureUsers?: string[];
    };
    schedule: {
      startDate: Date;
      endDate: Date;
      reminderFrequency?: number; // in days
    };
  }): Promise<BetaSurvey> {
    const { title, description, questions, targetAudience, schedule } = params;

    return this.prisma.betaSurvey.create({
      data: {
        title,
        description,
        questions: questions.map(q => ({
          type: q.type,
          text: q.text,
          required: q.required,
          options: q.options,
          minRating: q.minRating,
          maxRating: q.maxRating,
        })),
        targetAudience,
        schedule,
        status: 'DRAFT',
      },
    });
  }

  async publishSurvey(surveyId: string): Promise<BetaSurvey> {
    const survey = await this.prisma.betaSurvey.findUnique({
      where: { id: surveyId },
      include: {
        responses: true,
      },
    });

    if (!survey) {
      throw new Error('Survey not found');
    }

    if (survey.status !== 'DRAFT') {
      throw new Error('Survey is not in draft status');
    }

    // Get target users
    const targetUsers = await this.getTargetUsers(survey.targetAudience);

    // Create survey invitations
    await Promise.all(
      targetUsers.map(user =>
        this.prisma.betaSurveyInvitation.create({
          data: {
            surveyId,
            userId: user.id,
            status: 'PENDING',
            sentAt: new Date(),
          },
        })
      )
    );

    // Update survey status
    return this.prisma.betaSurvey.update({
      where: { id: surveyId },
      data: {
        status: 'ACTIVE',
        publishedAt: new Date(),
      },
    });
  }

  async submitResponse(params: {
    surveyId: string;
    userId: string;
    responses: Array<{
      questionId: string;
      answer: any;
    }>;
  }): Promise<BetaSurveyResponse> {
    const { surveyId, userId, responses } = params;

    // Validate survey is active
    const survey = await this.prisma.betaSurvey.findUnique({
      where: { id: surveyId },
      include: {
        questions: true,
      },
    });

    if (!survey || survey.status !== 'ACTIVE') {
      throw new Error('Survey is not active');
    }

    // Validate all required questions are answered
    const requiredQuestions = survey.questions.filter(q => q.required);
    const answeredQuestionIds = responses.map(r => r.questionId);
    const missingRequired = requiredQuestions.filter(
      q => !answeredQuestionIds.includes(q.id)
    );

    if (missingRequired.length > 0) {
      throw new Error('Missing required questions');
    }

    // Create response
    return this.prisma.betaSurveyResponse.create({
      data: {
        surveyId,
        userId,
        responses: responses.map(r => ({
          questionId: r.questionId,
          answer: r.answer,
        })),
        submittedAt: new Date(),
      },
    });
  }

  async getSurveyResults(surveyId: string): Promise<{
    summary: {
      totalInvited: number;
      totalResponses: number;
      responseRate: number;
      averageCompletionTime: number;
    };
    questionResults: Array<{
      questionId: string;
      type: string;
      text: string;
      results: any;
    }>;
  }> {
    const survey = await this.prisma.betaSurvey.findUnique({
      where: { id: surveyId },
      include: {
        questions: true,
        responses: true,
        invitations: true,
      },
    });

    if (!survey) {
      throw new Error('Survey not found');
    }

    // Calculate summary statistics
    const totalInvited = survey.invitations.length;
    const totalResponses = survey.responses.length;
    const responseRate = (totalResponses / totalInvited) * 100;

    const completionTimes = survey.responses.map(r => {
      const invitation = survey.invitations.find(i => i.userId === r.userId);
      return invitation
        ? r.submittedAt.getTime() - invitation.sentAt.getTime()
        : 0;
    });

    const averageCompletionTime =
      completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length;

    // Calculate results for each question
    const questionResults = survey.questions.map(question => {
      const questionResponses = survey.responses.flatMap(r =>
        r.responses.filter(qr => qr.questionId === question.id)
      );

      let results;
      switch (question.type) {
        case 'multiple_choice':
          results = this.calculateMultipleChoiceResults(questionResponses);
          break;
        case 'rating':
          results = this.calculateRatingResults(questionResponses);
          break;
        case 'boolean':
          results = this.calculateBooleanResults(questionResponses);
          break;
        case 'text':
          results = this.calculateTextResults(questionResponses);
          break;
      }

      return {
        questionId: question.id,
        type: question.type,
        text: question.text,
        results,
      };
    });

    return {
      summary: {
        totalInvited,
        totalResponses,
        responseRate,
        averageCompletionTime,
      },
      questionResults,
    };
  }

  private async getTargetUsers(targetAudience: {
    churchIds?: string[];
    userRoles?: string[];
    featureUsers?: string[];
  }): Promise<Array<{ id: string }>> {
    const { churchIds, userRoles, featureUsers } = targetAudience;

    const where: any = {};

    if (churchIds?.length) {
      where.churchId = { in: churchIds };
    }

    if (userRoles?.length) {
      where.role = { in: userRoles };
    }

    if (featureUsers?.length) {
      where.featureUsage = {
        some: {
          featureId: { in: featureUsers },
        },
      };
    }

    return this.prisma.user.findMany({
      where,
      select: { id: true },
    });
  }

  private calculateMultipleChoiceResults(responses: Array<{ answer: string }>) {
    const counts = responses.reduce((acc, { answer }) => {
      acc[answer] = (acc[answer] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = responses.length;
    return Object.entries(counts).map(([option, count]) => ({
      option,
      count,
      percentage: (count / total) * 100,
    }));
  }

  private calculateRatingResults(responses: Array<{ answer: number }>) {
    const ratings = responses.map(r => r.answer);
    const average = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const distribution = ratings.reduce((acc, rating) => {
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      average,
      distribution: Object.entries(distribution).map(([rating, count]) => ({
        rating: Number(rating),
        count,
        percentage: (count / ratings.length) * 100,
      })),
    };
  }

  private calculateBooleanResults(responses: Array<{ answer: boolean }>) {
    const trueCount = responses.filter(r => r.answer).length;
    const falseCount = responses.length - trueCount;

    return {
      true: {
        count: trueCount,
        percentage: (trueCount / responses.length) * 100,
      },
      false: {
        count: falseCount,
        percentage: (falseCount / responses.length) * 100,
      },
    };
  }

  private calculateTextResults(responses: Array<{ answer: string }>) {
    return {
      total: responses.length,
      responses: responses.map(r => r.answer),
    };
  }
} 