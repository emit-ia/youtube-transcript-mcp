#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { YouTubeService } from './services/youtube.js';
import { ALL_TOOLS } from './tools/index.js';

const server = new Server(
  {
    name: 'youtube-transcript-mcp',
    version: '1.0.0',
  }
);

const youtubeService = new YouTubeService();

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: ALL_TOOLS,
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'youtube_get_transcript': {
        const { url, language, format = 'json' } = args as {
          url: string;
          language?: string;
          format?: 'json' | 'text' | 'srt' | 'vtt';
        };

        const transcript = await youtubeService.getTranscript(url, language);

        let content: string;
        switch (format) {
          case 'text':
            content = youtubeService.formatAsText(transcript);
            break;
          case 'srt':
            content = youtubeService.formatAsSRT(transcript);
            break;
          case 'vtt':
            content = youtubeService.formatAsSRT(transcript).replace(/,/g, '.');
            break;
          default:
            content = JSON.stringify(transcript, null, 2);
        }

        return {
          content: [
            {
              type: 'text',
              text: content,
            },
          ],
        };
      }

      case 'youtube_search_transcript': {
        const { url, query, contextWindow, caseSensitive, language } = args as {
          url: string;
          query: string;
          contextWindow?: number;
          caseSensitive?: boolean;
          language?: string;
        };

        const transcript = await youtubeService.getTranscript(url, language);
        const results = await youtubeService.searchTranscript(transcript, {
          query,
          contextWindow,
          caseSensitive,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                videoId: transcript.videoId,
                query,
                matchCount: results.length,
                results: results.map(result => ({
                  timestamp: result.segment.start,
                  text: result.segment.text,
                  context: {
                    before: result.context.before.map(s => s.text).join(' '),
                    after: result.context.after.map(s => s.text).join(' '),
                  },
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'youtube_batch_transcripts': {
        const { urls, language, maxConcurrent } = args as {
          urls: string[];
          language?: string;
          maxConcurrent?: number;
        };

        const transcripts = await youtubeService.batchTranscripts(urls, maxConcurrent);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                processed: transcripts.length,
                total: urls.length,
                transcripts: transcripts.map(t => ({
                  videoId: t.videoId,
                  language: t.language,
                  segmentCount: t.segments.length,
                  duration: t.totalDuration,
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'youtube_transcript_summary': {
        const { url, summaryType = 'brief', language } = args as {
          url: string;
          summaryType?: 'brief' | 'detailed' | 'topics' | 'timestamps';
          language?: string;
        };

        const transcript = await youtubeService.getTranscript(url, language);

        let summary: any;
        switch (summaryType) {
          case 'brief':
            summary = {
              videoId: transcript.videoId,
              duration: transcript.totalDuration,
              segmentCount: transcript.segments.length,
              language: transcript.language,
              preview: transcript.segments.slice(0, 3).map(s => s.text).join(' ') + '...',
            };
            break;
          case 'detailed':
            summary = {
              videoId: transcript.videoId,
              duration: transcript.totalDuration,
              segmentCount: transcript.segments.length,
              language: transcript.language,
              fullText: youtubeService.formatAsText(transcript),
            };
            break;
          case 'topics':
            const topics = transcript.segments
              .map(s => s.text)
              .join(' ')
              .split(/[.!?]+/)
              .filter(sentence => sentence.trim().length > 20)
              .slice(0, 10);
            summary = {
              videoId: transcript.videoId,
              keyTopics: topics,
            };
            break;
          case 'timestamps':
            summary = {
              videoId: transcript.videoId,
              timestampedContent: transcript.segments.map(s => ({
                time: s.start,
                text: s.text,
              })),
            };
            break;
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      }

      case 'youtube_get_channel_videos': {
        const { channelUrl, maxVideos = 50 } = args as {
          channelUrl: string;
          maxVideos?: number;
        };

        const videos = await youtubeService.getChannelVideos(channelUrl, maxVideos);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                channelUrl,
                totalVideos: videos.length,
                videos: videos.map(v => ({
                  id: v.id,
                  title: v.title,
                  url: v.url,
                  publishedAt: v.publishedAt,
                  duration: v.duration,
                  viewCount: v.viewCount,
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'youtube_get_channel_video_urls': {
        const { channelUrl, maxVideos = 50 } = args as {
          channelUrl: string;
          maxVideos?: number;
        };

        const urls = await youtubeService.getChannelVideoUrls(channelUrl, maxVideos);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                channelUrl,
                totalUrls: urls.length,
                videoUrls: urls,
              }, null, 2),
            },
          ],
        };
      }

      case 'youtube_get_channel_transcripts': {
        const { channelUrl, maxVideos = 50, maxConcurrent = 3 } = args as {
          channelUrl: string;
          maxVideos?: number;
          maxConcurrent?: number;
        };

        const transcripts = await youtubeService.getChannelTranscripts(channelUrl, maxVideos, maxConcurrent);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                channelUrl,
                processedVideos: transcripts.length,
                transcripts: transcripts.map(t => ({
                  videoId: t.videoId,
                  title: t.title,
                  language: t.language,
                  segmentCount: t.segments.length,
                  duration: t.totalDuration,
                  preview: t.segments.slice(0, 2).map(s => s.text).join(' '),
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'youtube_get_playlist_info': {
        const { playlistUrl } = args as {
          playlistUrl: string;
        };

        const playlistInfo = await youtubeService.getPlaylistInfo(playlistUrl);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(playlistInfo, null, 2),
            },
          ],
        };
      }

      case 'youtube_get_playlist_videos': {
        const { playlistUrl, maxVideos = 50 } = args as {
          playlistUrl: string;
          maxVideos?: number;
        };

        const videos = await youtubeService.getPlaylistVideos(playlistUrl, maxVideos);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                playlistUrl,
                totalVideos: videos.length,
                videos: videos.map(v => ({
                  id: v.id,
                  title: v.title,
                  url: v.url,
                  publishedAt: v.publishedAt,
                  duration: v.duration,
                  viewCount: v.viewCount,
                  playlistPosition: v.playlistPosition,
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'youtube_get_playlist_video_urls': {
        const { playlistUrl, maxVideos = 50 } = args as {
          playlistUrl: string;
          maxVideos?: number;
        };

        const urls = await youtubeService.getPlaylistVideoUrls(playlistUrl, maxVideos);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                playlistUrl,
                totalUrls: urls.length,
                videoUrls: urls,
              }, null, 2),
            },
          ],
        };
      }

      case 'youtube_get_playlist_transcripts': {
        const { playlistUrl, maxVideos = 50, maxConcurrent = 3 } = args as {
          playlistUrl: string;
          maxVideos?: number;
          maxConcurrent?: number;
        };

        const transcripts = await youtubeService.getPlaylistTranscripts(playlistUrl, maxVideos, maxConcurrent);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                playlistUrl,
                processedVideos: transcripts.length,
                transcripts: transcripts.map(t => ({
                  videoId: t.videoId,
                  title: t.title,
                  language: t.language,
                  segmentCount: t.segments.length,
                  duration: t.totalDuration,
                  preview: t.segments.slice(0, 2).map(s => s.text).join(' '),
                })),
              }, null, 2),
            },
          ],
        };
      }


      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        },
      ],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('YouTube Transcript MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});