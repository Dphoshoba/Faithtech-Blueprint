import axios from 'axios';

export class MediumClient {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.MEDIUM_API_KEY || '';
    this.baseUrl = 'https://api.medium.com/v1';
  }

  async publishPost(params: {
    title: string;
    content: string;
    tags: string[];
  }): Promise<{
    id: string;
    url: string;
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/users/me/posts`,
        {
          title: params.title,
          contentFormat: 'markdown',
          content: params.content,
          tags: params.tags,
          publishStatus: 'public',
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        id: response.data.data.id,
        url: response.data.data.url,
      };
    } catch (error) {
      console.error('Error publishing to Medium:', error);
      throw new Error('Failed to publish post to Medium');
    }
  }
} 