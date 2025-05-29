import { EmailService } from '../../email-service';
import { CalendarService } from '../../calendar-service';
import { BetaParticipant } from '../models/beta-participant';
import { BETA_COHORTS, BETA_SELECTION_CRITERIA } from '../../../config/beta-program';

interface OnboardingConfig {
  welcomeEmailTemplate: string;
  assessmentDueDate: Date;
  kickoffMeetingDuration: number; // in minutes
}

const DEFAULT_CONFIG: OnboardingConfig = {
  welcomeEmailTemplate: 'beta-welcome',
  assessmentDueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
  kickoffMeetingDuration: 150, // 2.5 hours
};

export class BetaOnboardingService {
  private emailService: EmailService;
  private calendarService: CalendarService;
  private config: OnboardingConfig;

  constructor(
    emailService: EmailService,
    calendarService: CalendarService,
    config: Partial<OnboardingConfig> = {}
  ) {
    this.emailService = emailService;
    this.calendarService = calendarService;
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async startOnboarding(participant: BetaParticipant): Promise<void> {
    try {
      // Find matching cohort
      const cohort = BETA_COHORTS.find(c => 
        c.criteria.churchSize === participant.churchSize ||
        (Array.isArray(c.criteria.churchSize) && c.criteria.churchSize.includes(participant.churchSize))
      );

      if (!cohort) {
        throw new Error('No matching cohort found for participant');
      }

      // Send welcome email
      await this.sendWelcomeEmail(participant, cohort);

      // Schedule kickoff meeting
      const kickoffDate = await this.scheduleKickoffMeeting(participant, cohort);

      // Update participant record with onboarding details
      await this.updateParticipantOnboarding(participant.id, {
        cohortId: cohort.id,
        assessmentDueDate: this.config.assessmentDueDate,
        kickoffMeetingDate: kickoffDate,
        onboardingStatus: 'in_progress',
        startDate: new Date(),
      });

      // Create onboarding tasks
      await this.createOnboardingTasks(participant.id);

    } catch (error) {
      console.error('Error during onboarding:', error);
      throw new Error('Failed to complete onboarding process');
    }
  }

  private async sendWelcomeEmail(participant: BetaParticipant, cohort: typeof BETA_COHORTS[number]): Promise<void> {
    const templateData = {
      churchName: participant.churchName,
      cohortName: cohort.name,
      contactName: participant.primaryContact.name,
      programDuration: cohort.criteria.commitmentLevel === 'enhanced' 
        ? BETA_SELECTION_CRITERIA.commitment.enhanced.minDurationMonths
        : BETA_SELECTION_CRITERIA.commitment.standard.minDurationMonths,
      startDate: new Date().toLocaleDateString(),
      weeklyCommitment: cohort.criteria.commitmentLevel === 'enhanced'
        ? BETA_SELECTION_CRITERIA.commitment.enhanced.weeklyTimeCommitment
        : BETA_SELECTION_CRITERIA.commitment.standard.weeklyTimeCommitment,
      dashboardUrl: `https://faithtech-blueprint.com/beta/dashboard/${participant.id}`,
      kickoffDate: 'TBD', // Will be updated after scheduling
      assessmentDueDate: this.config.assessmentDueDate.toLocaleDateString(),
      feedbackDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString(), // 2 weeks from now
      supportPhone: process.env.SUPPORT_PHONE || '1-800-FAITHTECH',
      email: participant.primaryContact.email,
    };

    await this.emailService.sendTemplateEmail(
      this.config.welcomeEmailTemplate,
      participant.primaryContact.email,
      templateData
    );
  }

  private async scheduleKickoffMeeting(
    participant: BetaParticipant,
    cohort: typeof BETA_COHORTS[number]
  ): Promise<Date> {
    // Find next available slot for kickoff meeting
    const availableSlot = await this.calendarService.findNextAvailableSlot({
      duration: this.config.kickoffMeetingDuration,
      attendees: [
        participant.primaryContact.email,
        'beta-manager@faithtech.com',
        'tech-lead@faithtech.com',
      ],
      timeRange: {
        start: new Date(),
        end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Within next 2 weeks
      },
    });

    // Schedule the meeting
    const meetingDetails = await this.calendarService.scheduleMeeting({
      title: `FaithTech Blueprint Beta Kickoff - ${participant.churchName}`,
      description: `Beta Program Kickoff Meeting for ${cohort.name} cohort`,
      startTime: availableSlot.start,
      duration: this.config.kickoffMeetingDuration,
      attendees: [
        {
          email: participant.primaryContact.email,
          name: participant.primaryContact.name,
          role: 'participant',
        },
        {
          email: 'beta-manager@faithtech.com',
          name: 'Beta Program Manager',
          role: 'host',
        },
        {
          email: 'tech-lead@faithtech.com',
          name: 'Technical Lead',
          role: 'presenter',
        },
      ],
      virtualMeeting: true,
    });

    // Send calendar invites
    await this.calendarService.sendInvites(meetingDetails.id);

    return availableSlot.start;
  }

  private async updateParticipantOnboarding(
    participantId: string,
    onboardingDetails: {
      cohortId: string;
      assessmentDueDate: Date;
      kickoffMeetingDate: Date;
      onboardingStatus: 'pending' | 'in_progress' | 'completed';
      startDate: Date;
    }
  ): Promise<void> {
    // Update participant record in database
    await BetaParticipant.findByIdAndUpdate(participantId, {
      $set: {
        onboarding: onboardingDetails,
      },
    });
  }

  private async createOnboardingTasks(participantId: string): Promise<void> {
    const tasks = [
      {
        title: 'Complete Church Profile',
        description: 'Fill in all required information about your church',
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        type: 'setup',
      },
      {
        title: 'Technical Assessment',
        description: 'Complete the initial technical capabilities assessment',
        dueDate: this.config.assessmentDueDate,
        type: 'assessment',
      },
      {
        title: 'Kickoff Meeting',
        description: 'Attend the program kickoff meeting',
        dueDate: null, // Will be updated after scheduling
        type: 'meeting',
      },
      {
        title: 'Team Setup',
        description: 'Invite and set up access for your team members',
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        type: 'setup',
      },
    ];

    // Create tasks in database
    await Promise.all(tasks.map(task => 
      this.createTask(participantId, task)
    ));
  }

  private async createTask(participantId: string, task: any): Promise<void> {
    // Implementation would depend on your task management system
    // This is a placeholder for the actual implementation
    console.log('Creating task:', task, 'for participant:', participantId);
  }
} 