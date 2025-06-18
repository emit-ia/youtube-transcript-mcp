// @ts-ignore - no types available for youtube-transcript-api
import TranscriptClient from 'youtube-transcript-api';
import { Innertube } from 'youtubei.js';
import { z } from 'zod';
import type { TranscriptResponse, TranscriptSegment, SearchResult, SearchOptions, ChannelVideo, PlaylistVideo, PlaylistInfo } from '../types/index.js';

const VideoUrlSchema = z.string().refine(
  (url) => /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/.test(url),
  "Invalid YouTube URL format"
);

const ChannelUrlSchema = z.string().refine(
  (url) => /^(https?:\/\/)?(www\.)?youtube\.com\/(channel\/|c\/|@|user\/)[\w-]+/.test(url),
  "Invalid YouTube channel URL format"
);

const PlaylistUrlSchema = z.string().refine(
  (url) => /^(https?:\/\/)?(www\.)?youtube\.com\/(playlist\?list=|watch\?v=[\w-]+&list=)[\w-]+/.test(url),
  "Invalid YouTube playlist URL format"
);

export class YouTubeService {
  private client: TranscriptClient;
  private yt: Innertube | null = null;

  constructor() {
    this.client = new TranscriptClient();
  }

  private async getYouTubeClient(): Promise<Innertube> {
    if (!this.yt) {
      this.yt = await Innertube.create();
    }
    return this.yt;
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
    const errors: Array<{url: string, error: string}> = [];
    
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      const batch = urls.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(async (url): Promise<{success: true, data: TranscriptResponse} | {success: false, url: string, error: string}> => {
        try {
          const transcript = await this.getTranscript(url);
          return { success: true, data: transcript };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push({ url, error: errorMessage });
          return { success: false, url, error: errorMessage };
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      
      // Add successful transcripts to results
      for (const result of batchResults) {
        if (result.success) {
          results.push(result.data);
        }
      }
      
      // Add a small delay between batches to avoid rate limiting
      if (i + maxConcurrent < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Log errors but don't fail the entire operation
    if (errors.length > 0) {
      console.error(`Failed to get transcripts for ${errors.length} videos:`, errors);
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

  async getChannelVideos(channelUrl: string, maxVideos = 50): Promise<ChannelVideo[]> {
    ChannelUrlSchema.parse(channelUrl);
    
    try {
      const yt = await this.getYouTubeClient();
      
      // Extract channel identifier from URL
      const channelId = this.extractChannelId(channelUrl);
      
      // For handle-based URLs, try direct access first, then fall back to search
      if (channelId.startsWith('@')) {
        try {
          // First try direct channel access
          return await this.getChannelVideosByChannelId(channelUrl, channelId, maxVideos);
        } catch (directError) {
          // Fall back to search-based approach
          console.error(`Direct channel access failed for ${channelId}, falling back to search:`, directError);
          return await this.getChannelVideosBySearch(channelUrl, channelId, maxVideos);
        }
      }
      
      // For channel IDs, use traditional approach
      return await this.getChannelVideosByChannelId(channelUrl, channelId, maxVideos);
    } catch (error) {
      throw new Error(`Failed to fetch channel videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getChannelVideosBySearch(channelUrl: string, channelId: string, maxVideos: number): Promise<ChannelVideo[]> {
    const yt = await this.getYouTubeClient();
    const handleName = channelId.substring(1); // Remove @
    
    // First, try to find the actual channel name from a channel search
    let actualChannelName = '';
    try {
      const channelSearch = await yt.search(handleName, { type: 'channel' });
      if (channelSearch.results && channelSearch.results.length > 0) {
        const firstChannel = channelSearch.results[0] as any;
        actualChannelName = firstChannel.title?.text || firstChannel.name?.text || '';
      }
    } catch (e) {
      // Continue with handle-based search
    }
    
    // Try multiple search strategies including known name patterns
    const searchQueries = [
      handleName,
      `"${handleName}"`,
      `${handleName} channel`
    ];
    
    // Add common name variations for known handles
    const nameVariations = this.getChannelNameVariations(handleName);
    if (nameVariations.length > 0) {
      searchQueries.unshift(...nameVariations);
    }
    
    // If we found an actual channel name, add it to search queries
    if (actualChannelName && actualChannelName !== handleName) {
      searchQueries.unshift(
        actualChannelName,
        `"${actualChannelName}"`
      );
    }
    
    // Collect videos from ALL search queries to get comprehensive results
    const allTargetVideos: ChannelVideo[] = [];
    const seenVideoIds = new Set<string>();
    
    for (const query of searchQueries) {
      try {
        const searchResults = await yt.search(query, { 
          type: 'video',
          sort_by: 'upload_date' 
        });
        
        if (searchResults.results && searchResults.results.length > 0) {
          for (const video of searchResults.results) {
            if (allTargetVideos.length >= maxVideos) break;
            
            const videoData = video as any;
            const authorName = videoData.author?.name?.text || videoData.author?.name || 
                             videoData.channel?.name?.text || videoData.channel?.name || '';
            const channelHandle = videoData.author?.handle || '';
            const videoId = videoData.video_id || videoData.id || '';
            
            // Skip duplicates
            if (!videoId || seenVideoIds.has(videoId)) continue;
            
            // More flexible channel matching - try different approaches
            const authorNameLower = authorName.toLowerCase();
            const handleNameLower = handleName.toLowerCase();
            
            // Generate possible name variations dynamically
            const spacedHandle = handleName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ').toLowerCase();
            
            const isMatchingChannel = 
              channelHandle === channelId ||
              channelHandle === `@${handleName}` ||
              authorNameLower === handleNameLower ||
              authorNameLower === spacedHandle ||
              authorNameLower.includes(handleNameLower) ||
              handleNameLower.includes(authorNameLower.split(' ')[0]) || // Match first name
              (authorNameLower.split(' ').some((word: string) => word.includes(handleNameLower))) ||
              (spacedHandle.split(' ').every((word: string) => word.length > 1 && authorNameLower.includes(word))) || // All words from spaced handle appear in author name
              (actualChannelName && authorNameLower === actualChannelName.toLowerCase()) || // Exact match with found channel name
              (actualChannelName && authorNameLower.includes(actualChannelName.toLowerCase()))
            
            if (isMatchingChannel) {
              seenVideoIds.add(videoId);
              allTargetVideos.push({
                id: videoId,
                title: videoData.title?.text || videoData.title || '',
                url: `https://www.youtube.com/watch?v=${videoId}`,
                description: videoData.description?.text || videoData.description || '',
                publishedAt: videoData.published?.text || videoData.published || '',
                duration: videoData.length_text?.text || videoData.duration?.text || videoData.duration || '',
                viewCount: videoData.view_count?.text || videoData.view_count || '',
                channelTitle: authorName,
                channelUrl: channelUrl
              });
            }
          }
        }
      } catch (searchError) {
        continue; // Try next search query
      }
    }
    
    // Return all videos found across all search queries
    if (allTargetVideos.length > 0) {
      return allTargetVideos;
    }
    
    throw new Error(`Could not find videos for channel handle: ${channelId}`);
  }

  private getChannelNameVariations(handleName: string): string[] {
    // Generate dynamic variations instead of hardcoding
    const variations: string[] = [];
    
    // Add the handle name in different formats
    variations.push(handleName);
    variations.push(`"${handleName}"`);
    
    // Try splitting camelCase or underscores and adding spaces
    const spacedName = handleName.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_-]/g, ' ');
    if (spacedName !== handleName) {
      variations.push(spacedName);
      variations.push(`"${spacedName}"`);
    }
    
    // Try capitalizing first letters
    const capitalizedName = spacedName.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
    if (capitalizedName !== spacedName) {
      variations.push(capitalizedName);
      variations.push(`"${capitalizedName}"`);
    }
    
    return variations;
  }

  private async getChannelVideosByChannelId(channelUrl: string, channelId: string, maxVideos: number): Promise<ChannelVideo[]> {
    const yt = await this.getYouTubeClient();
    
    // Try direct channel access with fallback strategies
    let channel;
    let lastError;
    
    try {
      channel = await yt.getChannel(channelId);
    } catch (error) {
      lastError = error;
      
      // Try with different format variations for channel IDs
      const variations = [
        `@${channelId}`,
        `UC${channelId}`,
        channelId.replace(/^UC/, '')
      ];
      
      for (const variation of variations) {
        try {
          channel = await yt.getChannel(variation);
          break;
        } catch (e) {
          continue;
        }
      }
      
      if (!channel) {
        throw lastError;
      }
    }
    
    const videos = channel.videos;
    const channelVideos: ChannelVideo[] = [];
    let count = 0;
    
    for (const video of videos) {
      if (count >= maxVideos) break;
      
      // Type guard and safe property access
      const videoId = (video as any).id || '';
      const title = (video as any).title?.text || (video as any).title || '';
      const description = (video as any).description?.text || (video as any).description || '';
      const publishedAt = (video as any).published?.text || (video as any).published || '';
      const duration = (video as any).duration?.text || (video as any).duration || '';
      const viewCount = (video as any).view_count?.text || (video as any).view_count || '';
      
      if (videoId) {
        channelVideos.push({
          id: videoId,
          title,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          description,
          publishedAt,
          duration,
          viewCount,
          channelTitle: (channel.header as any)?.title?.text || (channel as any).metadata?.title || '',
          channelUrl: channelUrl
        });
      }
      
      count++;
    }
    
    return channelVideos;
  }

  async getChannelVideoUrls(channelUrl: string, maxVideos = 50): Promise<string[]> {
    const videos = await this.getChannelVideos(channelUrl, maxVideos);
    return videos.map(video => video.url);
  }

  async getChannelTranscripts(channelUrl: string, maxVideos = 50, maxConcurrent = 3): Promise<TranscriptResponse[]> {
    const videoUrls = await this.getChannelVideoUrls(channelUrl, maxVideos);
    return this.batchTranscripts(videoUrls, maxConcurrent);
  }

  private extractChannelId(url: string): string {
    // Handle different channel URL formats
    if (url.includes('/channel/')) {
      const match = url.match(/\/channel\/([^/?]+)/);
      return match ? match[1] : '';
    }
    
    if (url.includes('/@')) {
      const match = url.match(/\/@([^/?]+)/);
      return match ? `@${match[1]}` : '';
    }
    
    if (url.includes('/c/')) {
      const match = url.match(/\/c\/([^/?]+)/);
      return match ? match[1] : '';
    }
    
    if (url.includes('/user/')) {
      const match = url.match(/\/user\/([^/?]+)/);
      return match ? match[1] : '';
    }
    
    throw new Error('Could not extract channel identifier from URL');
  }

  private extractPlaylistId(url: string): string {
    const match = url.match(/[?&]list=([^&]+)/);
    if (!match || !match[1]) {
      throw new Error('Could not extract playlist ID from URL');
    }
    return match[1];
  }

  async getPlaylistInfo(playlistUrl: string): Promise<PlaylistInfo> {
    PlaylistUrlSchema.parse(playlistUrl);
    
    try {
      const yt = await this.getYouTubeClient();
      const playlistId = this.extractPlaylistId(playlistUrl);
      
      const playlist = await yt.getPlaylist(playlistId);
      
      // Get video count from the videos iterator
      let videoCount = 0;
      try {
        const videos = playlist.videos;
        for (const _ of videos) {
          videoCount++;
          // Count up to 200 max to avoid long iteration
          if (videoCount >= 200) break;
        }
      } catch (e) {
        // If we can't count videos, try to get from metadata
        videoCount = (playlist as any).video_count || 
                    (playlist as any).estimatedVideoCount || 
                    (playlist as any).sidebar?.stats?.runs?.[0]?.text?.replace(/[^\d]/g, '') || 0;
      }
      
      // Extract better metadata from playlist object
      const metadata = (playlist as any).metadata || (playlist as any).header || playlist;
      const sidebar = (playlist as any).sidebar || {};
      const owner = sidebar.owner || sidebar.videoOwner || {};
      
      return {
        id: playlistId,
        title: metadata.title?.text || metadata.title || '',
        description: metadata.description?.text || metadata.description || '',
        channelTitle: owner.name?.text || owner.title?.text || 
                     metadata.author?.name?.text || metadata.channelTitle || '',
        channelUrl: owner.url || owner.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url || 
                   metadata.author?.url || '',
        videoCount: typeof videoCount === 'string' ? parseInt(videoCount) : videoCount,
        url: playlistUrl
      };
    } catch (error) {
      throw new Error(`Failed to fetch playlist info: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPlaylistVideos(playlistUrl: string, maxVideos = 50): Promise<PlaylistVideo[]> {
    PlaylistUrlSchema.parse(playlistUrl);
    
    try {
      const yt = await this.getYouTubeClient();
      const playlistId = this.extractPlaylistId(playlistUrl);
      
      const playlist = await yt.getPlaylist(playlistId);
      const videos = playlist.videos;
      
      const playlistVideos: PlaylistVideo[] = [];
      let count = 0;
      let position = 1;
      
      for (const video of videos) {
        if (count >= maxVideos) break;
        
        const videoId = (video as any).id || '';
        const title = (video as any).title?.text || (video as any).title || '';
        const description = (video as any).description?.text || (video as any).description || '';
        const publishedAt = (video as any).published?.text || (video as any).published || '';
        const duration = (video as any).duration?.text || (video as any).duration || '';
        const viewCount = (video as any).view_count?.text || (video as any).view_count || '';
        const channelTitle = (video as any).author?.name?.text || (video as any).author?.name || '';
        const channelUrl = (video as any).author?.url || '';
        
        if (videoId) {
          playlistVideos.push({
            id: videoId,
            title,
            url: `https://www.youtube.com/watch?v=${videoId}`,
            description,
            publishedAt,
            duration,
            viewCount,
            channelTitle,
            channelUrl,
            playlistPosition: position
          });
          position++;
        }
        
        count++;
      }
      
      return playlistVideos;
    } catch (error) {
      throw new Error(`Failed to fetch playlist videos: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPlaylistVideoUrls(playlistUrl: string, maxVideos = 50): Promise<string[]> {
    const videos = await this.getPlaylistVideos(playlistUrl, maxVideos);
    return videos.map(video => video.url);
  }

  async getPlaylistTranscripts(playlistUrl: string, maxVideos = 50, maxConcurrent = 3): Promise<TranscriptResponse[]> {
    const videoUrls = await this.getPlaylistVideoUrls(playlistUrl, maxVideos);
    return this.batchTranscripts(videoUrls, maxConcurrent);
  }

}