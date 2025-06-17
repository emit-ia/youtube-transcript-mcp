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