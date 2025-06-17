# YouTube Transcript MCP Server

An MCP (Model Context Protocol) server for extracting and processing YouTube video transcripts.

## Features

- **Extract transcripts** from YouTube videos
- **Search within transcripts** for specific content
- **Batch processing** of multiple videos
- **Multiple output formats** (JSON, text, SRT, VTT)
- **Context-aware search** with configurable windows

## Installation

### Via NPX (Recommended)
```bash
npx youtube-transcript-mcp
```

### Local Development
```bash
git clone <repository-url>
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
      "args": ["youtube-transcript-mcp"]
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