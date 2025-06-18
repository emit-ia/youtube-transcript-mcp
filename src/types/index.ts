export interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
  end: number;
}

export interface TranscriptResponse {
  videoId: string;
  title?: string;
  language: string;
  segments: TranscriptSegment[];
  totalDuration: number;
}

export interface SearchResult {
  segment: TranscriptSegment;
  context: {
    before: TranscriptSegment[];
    after: TranscriptSegment[];
  };
  matchIndex: number;
}

export interface TranscriptOptions {
  language?: string;
  includeTimestamps?: boolean;
  format?: 'text' | 'srt' | 'vtt' | 'json';
}

export interface SearchOptions {
  query: string;
  contextWindow?: number;
  caseSensitive?: boolean;
}

export interface ChannelVideo {
  id: string;
  title: string;
  url: string;
  description: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  channelTitle: string;
  channelUrl: string;
}

export interface PlaylistVideo {
  id: string;
  title: string;
  url: string;
  description: string;
  publishedAt: string;
  duration: string;
  viewCount: string;
  channelTitle: string;
  channelUrl: string;
  playlistPosition: number;
}

export interface PlaylistInfo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelUrl: string;
  videoCount: number;
  url: string;
}

