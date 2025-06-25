import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';
import { Configuration, OpenAIApi } from 'openai';
import axios from 'axios';
import { MediumClient } from './clients/MediumClient';
import { YouTubeClient } from './clients/YouTubeClient';
import { PodcastClient } from './clients/PodcastClient';
import { AnalyticsService } from '../analytics/services/AnalyticsService';

const prisma = new PrismaClient();
const openai = new OpenAIApi(new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
}));

export class ContentMarketingService {
  private youtube;
  private medium: MediumClient;
  private podcast: PodcastClient;
  private analytics: AnalyticsService;

  constructor() {
    this.youtube = google.youtube({
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    });
    this.medium = new MediumClient();
    this.podcast = new PodcastClient();
    this.analytics = new AnalyticsService();
  }

  async createBlogPost(title: string, content: string, tags: string[] = []) {
    try {
      // Generate SEO-optimized content using OpenAI
      const enhancedContent = await this.enhanceContent(content);
      
      // Publish to Medium
      const mediumResponse = await axios.post(
        'https://api.medium.com/v1/users/me/posts',
        {
          title,
          contentFormat: 'markdown',
          content: enhancedContent,
          tags,
          publishStatus: 'draft',
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.MEDIUM_API_KEY}`,
          },
        }
      );

      // Store in database
      const post = await prisma.post.create({
        data: {
          title,
          content: enhancedContent,
          platform: 'medium',
          status: 'published',
          metrics: {
            views: 0,
            claps: 0,
          },
        },
      });

      return post;
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw error;
    }
  }

  async createVideo(title: string, description: string, videoFile: Buffer) {
    try {
      // Upload to YouTube
      const response = await this.youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
          snippet: {
            title,
            description,
          },
          status: {
            privacyStatus: 'private',
          },
        },
        media: {
          body: videoFile,
        },
      });

      // Store in database
      const post = await prisma.post.create({
        data: {
          title,
          content: description,
          platform: 'youtube',
          status: 'published',
          metrics: {
            views: 0,
            likes: 0,
          },
        },
      });

      return post;
    } catch (error) {
      console.error('Error creating video:', error);
      throw error;
    }
  }

  private async enhanceContent(content: string): Promise<string> {
    try {
      const response = await openai.createCompletion({
        model: 'text-davinci-003',
        prompt: `Enhance this content for SEO and readability while maintaining the original message:\n\n${content}`,
        max_tokens: 1000,
        temperature: 0.7,
      });

      return response.data.choices[0].text || content;
    } catch (error) {
      console.error('Error enhancing content:', error);
      return content;
    }
  }

  async createPodcastEpisode(params: {
    title: string;
    topic: string;
    guests?: Array<{
      name: string;
      role: string;
      church: string;
    }>;
  }): Promise<{
    episodeId: string;
    url: string;
    status: 'draft' | 'published';
  }> {
    const { title, topic, guests } = params;

    // Generate show notes using AI
    const showNotes = await this.generateShowNotes({
      title,
      topic,
      guests,
    });

    // Record and publish episode
    const episode = await this.podcast.createEpisode({
      title,
      showNotes,
      guests,
    });

    // Log episode
    await prisma.podcastEpisode.create({
      data: {
        title,
        showNotes,
        url: episode.url,
        platform: 'spotify',
        status: 'published',
        metrics: {
          listens: 0,
          downloads: 0,
          reviews: 0,
        },
      },
    });

    return {
      episodeId: episode.id,
      url: episode.url,
      status: 'published',
    };
  }

  async generateContentCalendar(params: {
    startDate: Date;
    endDate: Date;
    topics: string[];
    targetAudience: string[];
  }): Promise<{
    calendar: Array<{
      date: Date;
      type: 'blog' | 'video' | 'podcast';
      topic: string;
      title: string;
    }>;
  }> {
    const { startDate, endDate, topics, targetAudience } = params;

    // Generate calendar using AI
    const prompt = `Generate a content calendar for FaithTech Blueprint with the following details:
      Start Date: ${startDate}
      End Date: ${endDate}
      Topics: ${topics.join(', ')}
      Target Audience: ${targetAudience.join(', ')}`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at creating content calendars for technology companies.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
    });

    const calendar = this.parseContentCalendar(completion.data.choices[0].message.content);

    // Save calendar
    await prisma.contentCalendar.create({
      data: {
        startDate,
        endDate,
        calendar: calendar as any,
      },
    });

    return { calendar };
  }

  private async generateShowNotes(params: {
    title: string;
    topic: string;
    guests?: Array<{
      name: string;
      role: string;
      church: string;
    }>;
  }): Promise<string> {
    const { title, topic, guests } = params;

    const prompt = `Write show notes for a FaithTech Blueprint podcast episode with the following details:
      Title: ${title}
      Topic: ${topic}
      Guests: ${guests?.map(g => `${g.name} (${g.role} at ${g.church})`).join(', ')}`;

    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are an expert at writing podcast show notes about church technology.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2000,
    });

    return completion.data.choices[0].message.content;
  }

  private parseContentCalendar(content: string): Array<{
    date: Date;
    type: 'blog' | 'video' | 'podcast';
    topic: string;
    title: string;
  }> {
    // Parse the AI-generated calendar into structured data
    const lines = content.split('\n');
    const calendar = [];

    for (const line of lines) {
      if (line.includes('|')) {
        const [date, type, topic, title] = line.split('|').map(s => s.trim());
        calendar.push({
          date: new Date(date),
          type: type.toLowerCase() as 'blog' | 'video' | 'podcast',
          topic,
          title,
        });
      }
    }

    return calendar;
  }
} 