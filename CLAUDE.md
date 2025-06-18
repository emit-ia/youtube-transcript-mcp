# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a YouTube Transcript MCP (Model Context Protocol) server that provides tools for extracting and processing YouTube video transcripts. The server implements the MCP specification to expose YouTube transcript functionality to Claude and other MCP-compatible clients.

## Development Commands

### Core Development
```bash
# Install dependencies
npm install

# Build the project
npm run build

# Development with watch mode
npm run dev

# Run production server
npm start

# Clean build artifacts
npm run clean

# Prepare for publishing
npm run prepublishOnly
```

### Installation Methods
```bash
# Install via NPX (recommended for users)
npx @emit-ia/youtube-transcript-mcp

# Global installation
npm install -g @emit-ia/youtube-transcript-mcp

# Test MCP connection locally
node build/index.js
```

### Claude Desktop Integration
Add to Claude Desktop configuration:
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

## Architecture

### MCP Server Pattern
The codebase follows the standard MCP server architecture:

- **`src/index.ts`**: Main MCP server entry point with tool registration and request handling
- **`src/services/youtube.ts`**: Core YouTube service with transcript extraction and channel operations
- **`src/tools/index.ts`**: MCP tool definitions and schemas
- **`src/types/index.ts`**: TypeScript type definitions

### Service Layer Architecture
The `YouTubeService` class encapsulates all YouTube operations:

- **Transcript Operations**: Single video transcript extraction with multiple format support (JSON, text, SRT, VTT)
- **Search Functionality**: Content search within transcripts with context windows
- **Batch Processing**: Concurrent processing of multiple videos with configurable limits
- **Channel Operations**: Video discovery and bulk transcript extraction from channels

### Channel URL Handling
The service supports multiple YouTube channel URL formats with intelligent fallback strategies:
- **Working**: `/channel/UCxxxxx` format (full channel IDs) - uses direct channel API
- **Working**: `/@username` format (channel handles) - uses search-based resolution with name mapping
- **Working**: `/c/channelname` format - attempts direct access with fallbacks
- **Fallback Strategy**: For handles, searches by actual channel name when handle resolution fails

### Error Handling Strategy
- Input validation using Zod schemas for URL format verification
- Graceful error handling with descriptive error messages
- Batch operations continue processing on individual failures
- Service initialization is lazy-loaded for better performance

### Channel Resolution Strategy
For channel handle URLs (`/@username`), the service employs a multi-tier approach:
1. **Direct Channel Access**: Attempts to access channel using the handle directly
2. **Search-Based Resolution**: When direct access fails, searches for videos by the handle
3. **Name Mapping**: Uses known mappings (e.g., `@blankensmithing` → "Torin Blankensmith")
4. **Flexible Matching**: Matches videos by exact channel name, partial name, or first name
5. **Fallback Variations**: Tries multiple search query formats and channel ID variations

## Tool Implementation

### Tool Categories
1. **Single Video Tools**: `youtube_get_transcript`, `youtube_search_transcript`, `youtube_transcript_summary`
2. **Batch Processing Tools**: `youtube_batch_transcripts`
3. **Channel Tools**: `youtube_get_channel_videos`, `youtube_get_channel_video_urls`, `youtube_get_channel_transcripts`

### Concurrency Control
- Default concurrency limits: 3 concurrent requests for batch operations
- Configurable via `maxConcurrent` parameter (1-10 range)
- Channel transcript processing respects both video count and concurrency limits

## Dependencies

### Core Dependencies
- **`@modelcontextprotocol/sdk`**: MCP protocol implementation
- **`youtube-transcript-api`**: YouTube transcript extraction (no types available)
- **`youtubei.js`**: YouTube channel and video metadata access
- **`zod`**: Runtime type validation and schema definition

### Development Dependencies
- **TypeScript 5.0+**: For type safety and modern ES features
- **Node.js 18+**: Required for ES modules and modern JavaScript features

## Configuration

### TypeScript Configuration
- **Target**: ES2022 with ESNext modules for modern JavaScript features
- **Module Resolution**: Node.js style with ES module interop
- **Build Output**: `./build` directory with source maps and declarations
- **Strict Mode**: Enabled for enhanced type safety

### Package Configuration
- **Type**: ES module (`"type": "module"`)
- **Entry Points**: Binary script via `build/index.js`
- **Exports**: Main entry point for programmatic usage

## Known Limitations

### YouTube API Constraints
- Only works with videos that have public transcripts available
- Channel handle resolution uses search-based fallback when direct access fails
- Rate limiting may apply for high-volume usage
- Transcript availability depends on YouTube's service availability

### Technical Limitations
- No API key required (uses public transcript data)
- Channel processing limited to 200 videos maximum
- Batch processing limited to 50 videos for channel transcripts
- Concurrent request limits prevent overwhelming YouTube services

## Error Scenarios

### Common Error Patterns
- **Invalid URL Format**: Zod validation catches malformed YouTube URLs
- **Missing Transcripts**: YouTube videos without available transcripts return descriptive errors
- **Channel Access Issues**: Handle-based channels use search fallback when direct access fails
- **Network Issues**: Timeout and connection errors are caught and reported

### Debugging
- Server logs errors to stderr for MCP debugging
- Use MCP Inspector for protocol-level debugging
- Error responses include original error messages when available

## Recent Fixes (v1.4.0)

### Channel Video Discovery Improvements
- **Fixed Early Return Issue**: Search strategy now collects videos from ALL search queries instead of stopping after first successful query
- **Enhanced Search Strategy**: Improved deduplication and comprehensive result collection
- **Dynamic Name Variations**: Automatic generation of channel name variations instead of hardcoded mappings
- **Direct/Search Fallback**: Tries direct channel access first, falls back to search-based approach

### Testing and Debugging
- Local testing environment can be created for debugging channel access issues
- Debug services available for detailed analysis of search strategies
- Comprehensive logging for troubleshooting channel resolution problems

## Development Patterns

When working with this codebase:

1. **URL Validation**: Always use Zod schemas for URL validation before processing
2. **Error Handling**: Implement graceful degradation for YouTube API limitations
3. **Concurrency**: Respect rate limits and use configurable concurrency controls
4. **Type Safety**: Leverage TypeScript interfaces for all data structures
5. **Testing**: Use local testing scripts for debugging complex channel resolution issues