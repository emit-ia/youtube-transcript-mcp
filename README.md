# YouTube Transcript MCP Server

An MCP (Model Context Protocol) server for extracting and processing YouTube video transcripts.

## Features

- **Extract transcripts** from YouTube videos
- **Channel processing** - Get all videos from a YouTube channel  
- **Playlist processing** - Get all videos from a YouTube playlist
- **Bulk transcripts** - Extract transcripts from all channel or playlist videos
- **Search within transcripts** for specific content
- **Batch processing** of multiple videos
- **Multiple output formats** (JSON, text, SRT, VTT)
- **Context-aware search** with configurable windows

## Installation

### Via NPX (Recommended)
```bash
npx @emit-ia/youtube-transcript-mcp
```

### Local Development
```bash
git clone https://github.com/emit-ia/youtube-transcript-mcp.git
cd youtube-transcript-mcp
npm install
npm run build
```

## Usage

### As MCP Server

#### Option 1: Via NPX
Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "command": "npx",
      "args": ["@emit-ia/youtube-transcript-mcp"]
    }
  }
}
```

#### Option 2: Local Installation
Add to your Claude Desktop configuration:

```json
{
  "mcpServers": {
    "youtube-transcript": {
      "command": "node",
      "args": ["/path/to/youtube-transcript-mcp/build/index.js"]
    }
  }
}
```

### Available Tools

#### `youtube_get_transcript`
Extract transcript from a YouTube video.

**Parameters:**
- `url` (required): YouTube video URL
- `language` (optional): Language code (default: "en")
- `format` (optional): Output format - "json", "text", "srt", "vtt" (default: "json")

#### `youtube_search_transcript`
Search for specific text within a transcript.

**Parameters:**
- `url` (required): YouTube video URL
- `query` (required): Text to search for
- `contextWindow` (optional): Seconds of context (default: 30)
- `caseSensitive` (optional): Case sensitive search (default: false)
- `language` (optional): Language code (default: "en")

#### `youtube_batch_transcripts`
Process multiple videos simultaneously.

**Parameters:**
- `urls` (required): Array of YouTube video URLs
- `language` (optional): Language code (default: "en")
- `maxConcurrent` (optional): Max concurrent requests (default: 3)

#### `youtube_transcript_summary`
Get formatted summary of transcript content.

**Parameters:**
- `url` (required): YouTube video URL
- `summaryType` (optional): "brief", "detailed", "topics", "timestamps" (default: "brief")
- `language` (optional): Language code (default: "en")

#### `youtube_get_channel_videos`
Get detailed video information from a YouTube channel.

**Parameters:**
- `channelUrl` (required): YouTube channel URL (supports @username, /c/, /channel/, /user/ formats)
- `maxVideos` (optional): Maximum number of videos to retrieve (default: 50, max: 200)

#### `youtube_get_channel_video_urls`
Get just the video URLs from a YouTube channel.

**Parameters:**
- `channelUrl` (required): YouTube channel URL
- `maxVideos` (optional): Maximum number of video URLs to retrieve (default: 50, max: 200)

#### `youtube_get_channel_transcripts`
Extract transcripts from multiple videos in a YouTube channel.

**Parameters:**
- `channelUrl` (required): YouTube channel URL
- `maxVideos` (optional): Maximum number of videos to process (default: 10, max: 50)
- `maxConcurrent` (optional): Max concurrent transcript requests (default: 3, max: 10)

#### `youtube_get_playlist_info`
Get information about a YouTube playlist.

**Parameters:**
- `playlistUrl` (required): YouTube playlist URL (supports playlist?list= and watch?v=...&list= formats)

#### `youtube_get_playlist_videos`
Get detailed video information from a YouTube playlist.

**Parameters:**
- `playlistUrl` (required): YouTube playlist URL
- `maxVideos` (optional): Maximum number of videos to retrieve (default: 50, max: 200)

#### `youtube_get_playlist_video_urls`
Get just the video URLs from a YouTube playlist.

**Parameters:**
- `playlistUrl` (required): YouTube playlist URL
- `maxVideos` (optional): Maximum number of video URLs to retrieve (default: 50, max: 200)

#### `youtube_get_playlist_transcripts`
Extract transcripts from multiple videos in a YouTube playlist.

**Parameters:**
- `playlistUrl` (required): YouTube playlist URL
- `maxVideos` (optional): Maximum number of videos to process (default: 50, max: 200)
- `maxConcurrent` (optional): Max concurrent transcript requests (default: 3, max: 10)


## Example Usage

```typescript
// Get basic transcript
const transcript = await youtube_get_transcript({
  url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
  format: "json"
});

// Search within transcript
const searchResults = await youtube_search_transcript({
  url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
  query: "important topic",
  contextWindow: 30
});

// Get all videos from a channel
const channelVideos = await youtube_get_channel_videos({
  channelUrl: "https://youtube.com/@channelname",
  maxVideos: 25
});

// Get just the video URLs
const videoUrls = await youtube_get_channel_video_urls({
  channelUrl: "https://youtube.com/c/ChannelName",
  maxVideos: 50
});

// Get transcripts from channel videos
const channelTranscripts = await youtube_get_channel_transcripts({
  channelUrl: "https://youtube.com/@channelname",
  maxVideos: 10,
  maxConcurrent: 3
});

// Get playlist information
const playlistInfo = await youtube_get_playlist_info({
  playlistUrl: "https://youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMHjMZOz59Mgq_SUoL"
});

// Get all videos from a playlist
const playlistVideos = await youtube_get_playlist_videos({
  playlistUrl: "https://youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMHjMZOz59Mgq_SUoL",
  maxVideos: 50
});

// Get transcripts from playlist videos
const playlistTranscripts = await youtube_get_playlist_transcripts({
  playlistUrl: "https://youtube.com/playlist?list=PLrAXtmRdnEQy6nuLMHjMZOz59Mgq_SUoL",
  maxVideos: 25,
  maxConcurrent: 3
});

```

## Requirements

- Node.js 18+
- No API keys required (uses public transcript data)

## Limitations

- Only works with videos that have public transcripts
- Rate limiting may apply for high-volume usage
- Transcript availability depends on YouTube's availability

## License

MIT