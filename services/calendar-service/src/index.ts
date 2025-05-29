import { google, calendar_v3 } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

interface TimeSlot {
  start: Date;
  end: Date;
}

interface Attendee {
  email: string;
  name?: string;
  role?: 'host' | 'participant' | 'presenter';
}

interface FindSlotOptions {
  duration: number; // in minutes
  attendees: string[];
  timeRange: {
    start: Date;
    end: Date;
  };
}

interface MeetingDetails {
  title: string;
  description: string;
  startTime: Date;
  duration: number;
  attendees: Attendee[];
  virtualMeeting: boolean;
}

export interface CalendarService {
  findNextAvailableSlot(options: FindSlotOptions): Promise<TimeSlot>;
  scheduleMeeting(details: MeetingDetails): Promise<{ id: string }>;
  sendInvites(meetingId: string): Promise<void>;
}

export class GoogleCalendarService implements CalendarService {
  private calendar: calendar_v3.Calendar;

  constructor(credentials: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    refreshToken: string;
  }) {
    const auth = new OAuth2Client(
      credentials.clientId,
      credentials.clientSecret,
      credentials.redirectUri
    );
    auth.setCredentials({ refresh_token: credentials.refreshToken });
    this.calendar = google.calendar({ version: 'v3', auth });
  }

  async findNextAvailableSlot(options: FindSlotOptions): Promise<TimeSlot> {
    try {
      const response = await this.calendar.freebusy.query({
        requestBody: {
          timeMin: options.timeRange.start.toISOString(),
          timeMax: options.timeRange.end.toISOString(),
          items: [
            { id: 'primary' },
            ...options.attendees.map(email => ({ id: email }))
          ],
        },
      });

      const busySlots = response.data.calendars || {};
      const availableSlot = this.findFirstAvailableSlot(
        options.timeRange.start,
        options.timeRange.end,
        options.duration,
        Object.values(busySlots).flatMap(cal => cal.busy || [])
      );

      if (!availableSlot) {
        throw new Error('No available time slots found');
      }

      return availableSlot;
    } catch (error) {
      console.error('Error finding available slot:', error);
      throw new Error('Failed to find available time slot');
    }
  }

  async scheduleMeeting(details: MeetingDetails): Promise<{ id: string }> {
    try {
      const endTime = new Date(details.startTime.getTime() + details.duration * 60000);

      const event = {
        summary: details.title,
        description: details.description,
        start: {
          dateTime: details.startTime.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: endTime.toISOString(),
          timeZone: 'UTC',
        },
        attendees: details.attendees.map(attendee => ({
          email: attendee.email,
          displayName: attendee.name,
        })),
        conferenceData: details.virtualMeeting ? {
          createRequest: {
            requestId: Math.random().toString(36).substring(7),
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        } : undefined,
      };

      const response = await this.calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
        conferenceDataVersion: details.virtualMeeting ? 1 : 0,
      });

      return { id: response.data.id! };
    } catch (error) {
      console.error('Error scheduling meeting:', error);
      throw new Error('Failed to schedule meeting');
    }
  }

  async sendInvites(meetingId: string): Promise<void> {
    try {
      await this.calendar.events.patch({
        calendarId: 'primary',
        eventId: meetingId,
        requestBody: {
          sendUpdates: 'all',
        },
      });
    } catch (error) {
      console.error('Error sending invites:', error);
      throw new Error('Failed to send calendar invites');
    }
  }

  private findFirstAvailableSlot(
    start: Date,
    end: Date,
    duration: number,
    busySlots: Array<{ start: string; end: string }>
  ): TimeSlot | null {
    const startTime = start.getTime();
    const endTime = end.getTime();
    const durationMs = duration * 60000;

    // Sort busy slots by start time
    const sortedBusySlots = busySlots
      .map(slot => ({
        start: new Date(slot.start).getTime(),
        end: new Date(slot.end).getTime(),
      }))
      .sort((a, b) => a.start - b.start);

    let currentTime = startTime;

    // Check each potential slot
    for (const busy of sortedBusySlots) {
      if (currentTime + durationMs <= busy.start) {
        return {
          start: new Date(currentTime),
          end: new Date(currentTime + durationMs),
        };
      }
      currentTime = Math.max(currentTime, busy.end);
    }

    // Check final slot after all busy periods
    if (currentTime + durationMs <= endTime) {
      return {
        start: new Date(currentTime),
        end: new Date(currentTime + durationMs),
      };
    }

    return null;
  }
} 