import { google } from 'googleapis';

export class YouTubeClient {
  private youtube: any;

  constructor() {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/youtube.upload'],
    });

    this.youtube = google.youtube({
      version: 'v3',
      auth,
    });
  }

  async createVideo(params: {
    title: string;
    script: string;
    keywords: string[];
  }): Promise<{
    id: string;
    url: string;
  }> {
    try {
      // Create video metadata
      const videoMetadata = {
        snippet: {
          title: params.title,
          description: params.script,
          tags: params.keywords,
          categoryId: '28', // Science & Technology
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
        },
      };

      // Upload video
      const response = await this.youtube.videos.insert({
        part: 'snippet,status',
        requestBody: videoMetadata,
        media: {
          body: params.script, // This should be the actual video file
        },
      });

      return {
        id: response.data.id,
        url: `https://www.youtube.com/watch?v=${response.data.id}`,
      };
    } catch (error) {
      console.error('Error creating YouTube video:', error);
      throw new Error('Failed to create YouTube video');
    }
  }
} 