import { PrismaClient } from '@prisma/client';
import { BetaChurch, BetaFeature, BetaVariant } from '../types/BetaChurch';

export class ABTesting {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createExperiment(params: {
    name: string;
    description: string;
    featureId: string;
    variants: Array<{
      name: string;
      weight: number;
      configuration: Record<string, any>;
    }>;
    duration: number; // in days
  }): Promise<BetaFeature> {
    const { name, description, featureId, variants, duration } = params;

    // Create experiment
    const experiment = await this.prisma.betaFeature.create({
      data: {
        name,
        description,
        type: 'EXPERIMENT',
        status: 'ACTIVE',
        startDate: new Date(),
        endDate: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
        variants: {
          create: variants.map(variant => ({
            name: variant.name,
            weight: variant.weight,
            configuration: variant.configuration,
          })),
        },
      },
      include: {
        variants: true,
      },
    });

    return experiment;
  }

  async assignVariant(churchId: string, experimentId: string): Promise<BetaVariant> {
    // Get experiment with variants
    const experiment = await this.prisma.betaFeature.findUnique({
      where: { id: experimentId },
      include: { variants: true },
    });

    if (!experiment) {
      throw new Error('Experiment not found');
    }

    // Check if church already has a variant assigned
    const existingAssignment = await this.prisma.betaVariantAssignment.findFirst({
      where: {
        churchId,
        variant: {
          featureId: experimentId,
        },
      },
      include: {
        variant: true,
      },
    });

    if (existingAssignment) {
      return existingAssignment.variant;
    }

    // Calculate total weight
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);

    // Assign variant based on weights
    let random = Math.random() * totalWeight;
    let selectedVariant: BetaVariant | null = null;

    for (const variant of experiment.variants) {
      random -= variant.weight;
      if (random <= 0) {
        selectedVariant = variant;
        break;
      }
    }

    if (!selectedVariant) {
      selectedVariant = experiment.variants[0];
    }

    // Create assignment
    await this.prisma.betaVariantAssignment.create({
      data: {
        churchId,
        variantId: selectedVariant.id,
        assignedAt: new Date(),
      },
    });

    return selectedVariant;
  }

  async trackEvent(params: {
    churchId: string;
    experimentId: string;
    eventName: string;
    eventData?: Record<string, any>;
  }): Promise<void> {
    const { churchId, experimentId, eventName, eventData } = params;

    // Get variant assignment
    const assignment = await this.prisma.betaVariantAssignment.findFirst({
      where: {
        churchId,
        variant: {
          featureId: experimentId,
        },
      },
      include: {
        variant: true,
      },
    });

    if (!assignment) {
      throw new Error('No variant assigned for this experiment');
    }

    // Record event
    await this.prisma.betaEvent.create({
      data: {
        churchId,
        featureId: experimentId,
        variantId: assignment.variantId,
        eventName,
        eventData,
        timestamp: new Date(),
      },
    });
  }

  async getExperimentResults(experimentId: string): Promise<{
    variantResults: Array<{
      variant: BetaVariant;
      metrics: {
        totalUsers: number;
        conversionRate: number;
        averageEngagement: number;
        events: Record<string, number>;
      };
    }>;
    overallMetrics: {
      totalUsers: number;
      averageConversionRate: number;
      averageEngagement: number;
    };
  }> {
    // Get experiment with variants
    const experiment = await this.prisma.betaFeature.findUnique({
      where: { id: experimentId },
      include: {
        variants: {
          include: {
            assignments: true,
            events: true,
          },
        },
      },
    });

    if (!experiment) {
      throw new Error('Experiment not found');
    }

    // Calculate metrics for each variant
    const variantResults = experiment.variants.map(variant => {
      const assignments = variant.assignments;
      const events = variant.events;

      // Calculate conversion rate (users who performed target action)
      const targetEvents = events.filter(e => e.eventName === 'target_action');
      const conversionRate = assignments.length > 0
        ? targetEvents.length / assignments.length
        : 0;

      // Calculate average engagement (events per user)
      const averageEngagement = assignments.length > 0
        ? events.length / assignments.length
        : 0;

      // Count events by type
      const eventCounts = events.reduce((counts, event) => {
        counts[event.eventName] = (counts[event.eventName] || 0) + 1;
        return counts;
      }, {} as Record<string, number>);

      return {
        variant,
        metrics: {
          totalUsers: assignments.length,
          conversionRate,
          averageEngagement,
          events: eventCounts,
        },
      };
    });

    // Calculate overall metrics
    const totalUsers = variantResults.reduce((sum, r) => sum + r.metrics.totalUsers, 0);
    const averageConversionRate = variantResults.reduce((sum, r) => sum + r.metrics.conversionRate, 0) / variantResults.length;
    const averageEngagement = variantResults.reduce((sum, r) => sum + r.metrics.averageEngagement, 0) / variantResults.length;

    return {
      variantResults,
      overallMetrics: {
        totalUsers,
        averageConversionRate,
        averageEngagement,
      },
    };
  }

  async endExperiment(experimentId: string): Promise<BetaFeature> {
    // Get experiment results
    const results = await this.getExperimentResults(experimentId);

    // Find winning variant
    const winningVariant = results.variantResults.reduce((winner, current) => {
      if (!winner || current.metrics.conversionRate > winner.metrics.conversionRate) {
        return current;
      }
      return winner;
    });

    // Update experiment status and set winning variant
    const updatedExperiment = await this.prisma.betaFeature.update({
      where: { id: experimentId },
      data: {
        status: 'COMPLETED',
        endDate: new Date(),
        winningVariantId: winningVariant.variant.id,
        results: {
          variantResults: results.variantResults,
          overallMetrics: results.overallMetrics,
        },
      },
      include: {
        variants: true,
      },
    });

    return updatedExperiment;
  }
} 