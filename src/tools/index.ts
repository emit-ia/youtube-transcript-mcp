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

export const GET_CHANNEL_VIDEOS_TOOL: Tool = {
  name: 'youtube_get_channel_videos',
  description: 'Get video list from a YouTube channel',
  inputSchema: {
    type: 'object',
    properties: {
      channelUrl: {
        type: 'string',
        description: 'YouTube channel URL (youtube.com/channel/..., youtube.com/@..., etc.)'
      },
      maxVideos: {
        type: 'number',
        description: 'Maximum number of videos to retrieve',
        default: 50,
        minimum: 1,
        maximum: 200
      }
    },
    required: ['channelUrl']
  }
};

export const GET_CHANNEL_VIDEO_URLS_TOOL: Tool = {
  name: 'youtube_get_channel_video_urls',
  description: 'Get video URLs from a YouTube channel',
  inputSchema: {
    type: 'object',
    properties: {
      channelUrl: {
        type: 'string',
        description: 'YouTube channel URL'
      },
      maxVideos: {
        type: 'number',
        description: 'Maximum number of video URLs to retrieve',
        default: 50,
        minimum: 1,
        maximum: 200
      }
    },
    required: ['channelUrl']
  }
};

export const GET_CHANNEL_TRANSCRIPTS_TOOL: Tool = {
  name: 'youtube_get_channel_transcripts',
  description: 'Get transcripts from multiple videos in a YouTube channel',
  inputSchema: {
    type: 'object',
    properties: {
      channelUrl: {
        type: 'string',
        description: 'YouTube channel URL'
      },
      maxVideos: {
        type: 'number',
        description: 'Maximum number of videos to process',
        default: 50,
        minimum: 1,
        maximum: 200
      },
      maxConcurrent: {
        type: 'number',
        description: 'Maximum number of concurrent transcript requests',
        default: 3,
        minimum: 1,
        maximum: 10
      }
    },
    required: ['channelUrl']
  }
};

export const GET_PLAYLIST_INFO_TOOL: Tool = {
  name: 'youtube_get_playlist_info',
  description: 'Get information about a YouTube playlist',
  inputSchema: {
    type: 'object',
    properties: {
      playlistUrl: {
        type: 'string',
        description: 'YouTube playlist URL (youtube.com/playlist?list=... or youtube.com/watch?v=...&list=...)'
      }
    },
    required: ['playlistUrl']
  }
};

export const GET_PLAYLIST_VIDEOS_TOOL: Tool = {
  name: 'youtube_get_playlist_videos',
  description: 'Get video list from a YouTube playlist',
  inputSchema: {
    type: 'object',
    properties: {
      playlistUrl: {
        type: 'string',
        description: 'YouTube playlist URL'
      },
      maxVideos: {
        type: 'number',
        description: 'Maximum number of videos to retrieve',
        default: 50,
        minimum: 1,
        maximum: 200
      }
    },
    required: ['playlistUrl']
  }
};

export const GET_PLAYLIST_VIDEO_URLS_TOOL: Tool = {
  name: 'youtube_get_playlist_video_urls',
  description: 'Get video URLs from a YouTube playlist',
  inputSchema: {
    type: 'object',
    properties: {
      playlistUrl: {
        type: 'string',
        description: 'YouTube playlist URL'
      },
      maxVideos: {
        type: 'number',
        description: 'Maximum number of video URLs to retrieve',
        default: 50,
        minimum: 1,
        maximum: 200
      }
    },
    required: ['playlistUrl']
  }
};

export const GET_PLAYLIST_TRANSCRIPTS_TOOL: Tool = {
  name: 'youtube_get_playlist_transcripts',
  description: 'Get transcripts from multiple videos in a YouTube playlist',
  inputSchema: {
    type: 'object',
    properties: {
      playlistUrl: {
        type: 'string',
        description: 'YouTube playlist URL'
      },
      maxVideos: {
        type: 'number',
        description: 'Maximum number of videos to process',
        default: 50,
        minimum: 1,
        maximum: 200
      },
      maxConcurrent: {
        type: 'number',
        description: 'Maximum number of concurrent transcript requests',
        default: 3,
        minimum: 1,
        maximum: 10
      }
    },
    required: ['playlistUrl']
  }
};


export const ALL_TOOLS = [
  GET_TRANSCRIPT_TOOL,
  SEARCH_TRANSCRIPT_TOOL,
  BATCH_TRANSCRIPTS_TOOL,
  TRANSCRIPT_SUMMARY_TOOL,
  GET_CHANNEL_VIDEOS_TOOL,
  GET_CHANNEL_VIDEO_URLS_TOOL,
  GET_CHANNEL_TRANSCRIPTS_TOOL,
  GET_PLAYLIST_INFO_TOOL,
  GET_PLAYLIST_VIDEOS_TOOL,
  GET_PLAYLIST_VIDEO_URLS_TOOL,
  GET_PLAYLIST_TRANSCRIPTS_TOOL
];