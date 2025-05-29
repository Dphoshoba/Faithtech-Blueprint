import { EventEmitter } from '../../utils/event-emitter';
import { Cache } from '../../utils/cache';
import { Queue } from '../../utils/queue';
import logger from '../../utils/logger';

export interface BetaParticipant {
  id: string;
  churchName: string;
  churchSize: number;
  location: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  techReadiness: number;
  useCases: string[];
  status: 'pending' | 'approved' | 'rejected' | 'onboarded';
  createdAt: Date;
  updatedAt: Date;
}

export interface BetaCriteria {
  minChurchSize: number;
  maxChurchSize: number;
  requiredUseCases: string[];
  minTechReadiness: number;
  maxParticipants: number;
}

export class BetaService {
  private eventEmitter: EventEmitter;
  private cache: Cache;
  private queue: Queue;
  private criteria: BetaCriteria;

  constructor() {
    this.eventEmitter = new EventEmitter();
    this.cache = new Cache({ maxSize: 1000 });
    this.queue = new Queue({
      concurrency: 5,
      rateLimit: { maxRequests: 100, timeWindow: 60000 }
    });
    
    // Default beta criteria
    this.criteria = {
      minChurchSize: 50,
      maxChurchSize: 5000,
      requiredUseCases: ['worship', 'community', 'giving'],
      minTechReadiness: 3,
      maxParticipants: 50
    };
  }

  async applyForBeta(application: Omit<BetaParticipant, 'id' | 'status' | 'createdAt' | 'updatedAt'>): Promise<BetaParticipant> {
    logger.info('Processing beta application', { churchName: application.churchName });

    // Validate application
    this.validateApplication(application);

    // Check if church already applied
    const existingApplication = await this.findApplicationByEmail(application.contactEmail);
    if (existingApplication) {
      throw new Error('Church has already applied for the beta program');
    }

    // Create new application
    const participant: BetaParticipant = {
      ...application,
      id: this.generateId(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Store application
    await this.storeApplication(participant);

    // Queue evaluation
    await this.queue.enqueue({
      id: `evaluate-${participant.id}`,
      execute: () => this.evaluateApplication(participant),
      priority: 1
    });

    return participant;
  }

  private validateApplication(application: Omit<BetaParticipant, 'id' | 'status' | 'createdAt' | 'updatedAt'>): void {
    const errors: string[] = [];

    if (!application.churchName?.trim()) {
      errors.push('Church name is required');
    }

    if (!application.contactName?.trim()) {
      errors.push('Contact name is required');
    }

    if (!application.contactEmail?.trim()) {
      errors.push('Contact email is required');
    }

    if (!application.contactPhone?.trim()) {
      errors.push('Contact phone is required');
    }

    if (application.churchSize < this.criteria.minChurchSize) {
      errors.push(`Church size must be at least ${this.criteria.minChurchSize}`);
    }

    if (application.churchSize > this.criteria.maxChurchSize) {
      errors.push(`Church size must be less than ${this.criteria.maxChurchSize}`);
    }

    if (application.techReadiness < this.criteria.minTechReadiness) {
      errors.push(`Tech readiness score must be at least ${this.criteria.minTechReadiness}`);
    }

    if (application.useCases.length === 0) {
      errors.push('At least one use case must be selected');
    }

    if (errors.length > 0) {
      throw new Error(`Invalid application: ${errors.join(', ')}`);
    }
  }

  private async evaluateApplication(participant: BetaParticipant): Promise<void> {
    logger.info('Evaluating beta application', { id: participant.id });

    // Check if we've reached max participants
    const currentCount = await this.getApprovedCount();
    if (currentCount >= this.criteria.maxParticipants) {
      await this.rejectApplication(participant.id, 'Beta program has reached maximum capacity');
      return;
    }

    // Evaluate based on criteria
    const score = this.calculateApplicationScore(participant);
    const threshold = 7; // Minimum score to be approved

    if (score >= threshold) {
      await this.approveApplication(participant.id);
    } else {
      await this.rejectApplication(participant.id, 'Application did not meet minimum requirements');
    }
  }

  private calculateApplicationScore(participant: BetaParticipant): number {
    let score = 0;

    // Church size score (0-3)
    const sizeRatio = (participant.churchSize - this.criteria.minChurchSize) / 
                     (this.criteria.maxChurchSize - this.criteria.minChurchSize);
    score += Math.min(3, sizeRatio * 3);

    // Tech readiness score (0-3)
    score += participant.techReadiness;

    // Use cases score (0-4)
    const requiredUseCases = this.criteria.requiredUseCases;
    const matchingUseCases = participant.useCases.filter(uc => requiredUseCases.includes(uc));
    score += (matchingUseCases.length / requiredUseCases.length) * 4;

    return score;
  }

  private async approveApplication(id: string): Promise<void> {
    const participant = await this.getApplication(id);
    if (!participant) {
      throw new Error('Application not found');
    }

    participant.status = 'approved';
    participant.updatedAt = new Date();
    await this.storeApplication(participant);

    // Queue onboarding process
    await this.queue.enqueue({
      id: `onboard-${id}`,
      execute: () => this.startOnboarding(participant),
      priority: 2
    });

    this.eventEmitter.emit('beta:approved', { participant });
  }

  private async rejectApplication(id: string, reason: string): Promise<void> {
    const participant = await this.getApplication(id);
    if (!participant) {
      throw new Error('Application not found');
    }

    participant.status = 'rejected';
    participant.updatedAt = new Date();
    await this.storeApplication(participant);

    this.eventEmitter.emit('beta:rejected', { participant, reason });
  }

  private async startOnboarding(participant: BetaParticipant): Promise<void> {
    logger.info('Starting onboarding process', { id: participant.id });

    // Send welcome email
    await this.sendWelcomeEmail(participant);

    // Schedule orientation call
    await this.scheduleOrientationCall(participant);

    // Create church account
    await this.createChurchAccount(participant);

    participant.status = 'onboarded';
    participant.updatedAt = new Date();
    await this.storeApplication(participant);

    this.eventEmitter.emit('beta:onboarded', { participant });
  }

  private async sendWelcomeEmail(participant: BetaParticipant): Promise<void> {
    // TODO: Implement email sending
    logger.info('Sending welcome email', { id: participant.id });
  }

  private async scheduleOrientationCall(participant: BetaParticipant): Promise<void> {
    // TODO: Implement call scheduling
    logger.info('Scheduling orientation call', { id: participant.id });
  }

  private async createChurchAccount(participant: BetaParticipant): Promise<void> {
    // TODO: Implement account creation
    logger.info('Creating church account', { id: participant.id });
  }

  private async storeApplication(participant: BetaParticipant): Promise<void> {
    // TODO: Implement database storage
    this.cache.set(`beta:${participant.id}`, participant);
  }

  public async getApplication(id: string): Promise<BetaParticipant | null> {
    return this.cache.get(`beta:${id}`) || null;
  }

  private async findApplicationByEmail(email: string): Promise<BetaParticipant | null> {
    // TODO: Implement database query
    return null;
  }

  private async getApprovedCount(): Promise<number> {
    // TODO: Implement database query
    return 0;
  }

  private generateId(): string {
    return `beta-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public setCriteria(criteria: Partial<BetaCriteria>): void {
    this.criteria = { ...this.criteria, ...criteria };
  }

  public getCriteria(): BetaCriteria {
    return { ...this.criteria };
  }

  public on(event: string, callback: (data: any) => void): void {
    this.eventEmitter.on(event, callback);
  }

  public emit(event: string, data: any): void {
    this.eventEmitter.emit(event, data);
  }
} 