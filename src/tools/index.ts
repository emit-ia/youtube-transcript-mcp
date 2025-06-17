import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

export const GET_TRANSCRIPT_TOOL: Tool = {
  name: 'youtube_get_transcript',
  description: 'Extract transcript from a YouTube video URL',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'YouTube video URL (youtube.com/watch?v=... or youtu.be/...)'
      },
      language: {
        type: 'string',
        description: 'Language code for transcript (e.g., "en", "es", "fr")',
        default: 'en'
      },
      format: {
        type: 'string',
        enum: ['json', 'text', 'srt', 'vtt'],
        description: 'Output format for the transcript',
        default: 'json'
      }
    },
    required: ['url']
  }
};

export const SEARCH_TRANSCRIPT_TOOL: Tool = {
  name: 'youtube_search_transcript',
  description: 'Search for specific text within a YouTube video transcript',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'YouTube video URL'
      },
      query: {
        type: 'string',
        description: 'Text to search for in the transcript'
      },
      contextWindow: {
        type: 'number',
        description: 'Seconds of context to include before/after matches',
        default: 30
      },
      caseSensitive: {
        type: 'boolean',
        description: 'Whether search should be case sensitive',
        default: false
      },
      language: {
        type: 'string',
        description: 'Language code for transcript',
        default: 'en'
      }
    },
    required: ['url', 'query']
  }
};

export const BATCH_TRANSCRIPTS_TOOL: Tool = {
  name: 'youtube_batch_transcripts',
  description: 'Extract transcripts from multiple YouTube videos',
  inputSchema: {
    type: 'object',
    properties: {
      urls: {
        type: 'array',
        items: {
          type: 'string'
        },
        description: 'Array of YouTube video URLs'
      },
      language: {
        type: 'string',
        description: 'Language code for transcripts',
        default: 'en'
      },
      maxConcurrent: {
        type: 'number',
        description: 'Maximum number of concurrent requests',
        default: 3,
        minimum: 1,
        maximum: 10
      }
    },
    required: ['urls']
  }
};

export const TRANSCRIPT_SUMMARY_TOOL: Tool = {
  name: 'youtube_transcript_summary',
  description: 'Get a formatted summary of transcript content',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'YouTube video URL'
      },
      summaryType: {
        type: 'string',
        enum: ['brief', 'detailed', 'topics', 'timestamps'],
        description: 'Type of summary to generate',
        default: 'brief'
      },
      language: {
        type: 'string',
        description: 'Language code for transcript',
        default: 'en'
      }
    },
    required: ['url']
  }
};

export const ALL_TOOLS = [
  GET_TRANSCRIPT_TOOL,
  SEARCH_TRANSCRIPT_TOOL,
  BATCH_TRANSCRIPTS_TOOL,
  TRANSCRIPT_SUMMARY_TOOL
];