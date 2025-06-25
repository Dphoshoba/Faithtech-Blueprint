import { google } from 'googleapis';

export class PodcastClient {
  private spotify: any;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/youtube.upload'],
    });

    this.spotify = google.youtube({
      version: 'v3',
      auth,
    });
  }

  async createEpisode(params: {
    title: string;
    showNotes: string;
    guests?: Array<{
      name: string;
      role: string;
      church: string;
    }>;
  }): Promise<{
    id: string;
    url: string;
  }> {
    try {
      // Create episode metadata
      const episodeMetadata = {
        snippet: {
          title: params.title,
          description: this.formatShowNotes(params.showNotes, params.guests),
          categoryId: '28', // Science & Technology
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
        },
      };

      // Upload episode
      const response = await this.spotify.videos.insert({
        part: 'snippet,status',
        requestBody: episodeMetadata,
        media: {
          body: params.showNotes, // This should be the actual audio file
        },
      });

      return {
        id: response.data.id,
        url: `https://open.spotify.com/episode/${response.data.id}`,
      };
    } catch (error) {
      console.error('Error creating podcast episode:', error);
      throw new Error('Failed to create podcast episode');
    }
  }

  private formatShowNotes(
    showNotes: string,
    guests?: Array<{
      name: string;
      role: string;
      church: string;
    }>
  ): string {
    let formattedNotes = showNotes;

    if (guests && guests.length > 0) {
      formattedNotes += '\n\nGuests:\n';
      guests.forEach(guest => {
        formattedNotes += `- ${guest.name} (${guest.role} at ${guest.church})\n`;
      });
    }

    return formattedNotes;
  }
} 