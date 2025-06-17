// @ts-ignore - no types available for youtube-transcript-api
import TranscriptClient from 'youtube-transcript-api';
import { z } from 'zod';
import type { TranscriptResponse, TranscriptSegment, SearchResult, SearchOptions } from '../types/index.js';

const VideoUrlSchema = z.string().refine(
  (url) => /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(url),
  "Invalid YouTube URL format"
);

export class YouTubeService {
  private client: TranscriptClient;

  constructor() {
    this.client = new TranscriptClient();
  }
  private extractVideoId(url: string): string {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    if (!match || !match[1]) {
      throw new Error('Could not extract video ID from URL');
    }
    return match[1];
  }

  async getTranscript(url: string, language?: string): Promise<TranscriptResponse> {
    VideoUrlSchema.parse(url);
    
    try {
      const videoId = this.extractVideoId(url);
      
      await this.client.ready; // Wait for client initialization
      const result = await this.client.getTranscript(videoId);

      // Extract transcript array from the result object
      const transcriptArray = result.tracks?.[0]?.transcript || [];
      
      const segments: TranscriptSegment[] = transcriptArray.map((item: any) => ({
        text: item.text,
        start: parseFloat(item.start),
        duration: parseFloat(item.dur),
        end: parseFloat(item.start) + parseFloat(item.dur)
      }));

      const totalDuration = segments.length > 0 
        ? Math.max(...segments.map(s => s.end))
        : 0;

      return {
        videoId,
        title: result.title || '',
        language: language || 'en',
        segments,
        totalDuration
      };
    } catch (error) {
      throw new Error(`Failed to fetch transcript: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async searchTranscript(
    transcript: TranscriptResponse, 
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const { query, contextWindow = 30, caseSensitive = false } = options;
    const searchTerm = caseSensitive ? query : query.toLowerCase();
    const results: SearchResult[] = [];

    transcript.segments.forEach((segment, index) => {
      const text = caseSensitive ? segment.text : segment.text.toLowerCase();
      
      if (text.includes(searchTerm)) {
        const contextStart = Math.max(0, index - 2);
        const contextEnd = Math.min(transcript.segments.length, index + 3);
        
        const before = transcript.segments.slice(contextStart, index);
        const after = transcript.segments.slice(index + 1, contextEnd);

        results.push({
          segment,
          context: { before, after },
          matchIndex: index
        });
      }
    });

    return results;
  }

  async batchTranscripts(urls: string[], maxConcurrent = 3): Promise<TranscriptResponse[]> {
    const results: TranscriptResponse[] = [];
    
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      const batch = urls.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(url => 
        this.getTranscript(url).catch(error => ({
          error: error.message,
          url
        }))
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults.filter(result => !('error' in result)) as TranscriptResponse[]);
    }

    return results;
  }

  formatAsText(transcript: TranscriptResponse): string {
    return transcript.segments.map(segment => segment.text).join(' ');
  }

  formatAsSRT(transcript: TranscriptResponse): string {
    return transcript.segments.map((segment, index) => {
      const startTime = this.formatTime(segment.start);
      const endTime = this.formatTime(segment.end);
      
      return `${index + 1}\n${startTime} --> ${endTime}\n${segment.text}\n`;
    }).join('\n');
  }

  private formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
  }
}