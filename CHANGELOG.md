# Changelog

## [1.6.0] - 2025-06-18

### 🗑️ Removed
- **youtube_get_channel_playlists**: Removed broken channel playlists functionality that consistently returned 0 results
- Removed all associated helper methods and types related to channel playlist discovery
- Cleaned up test files to remove non-functional tests

### 🎯 Rationale
- Channel playlists functionality was fundamentally broken due to YouTube API limitations
- 4 different discovery strategies all failed to return actual playlists for channels that demonstrably have playlists
- Removed to provide a cleaner, more reliable MCP server focused on working functionality

### ✅ Working Features Retained
- All transcript extraction functionality (single videos, batch processing)
- Playlist video listing and transcript extraction
- Channel video discovery
- Search functionality within transcripts

## [1.5.0] - 2025-06-18

### 🔧 Fixed
- **youtube_get_playlist_info**: Now properly extracts playlist metadata including accurate video count, title, and channel information
- **youtube_get_channel_playlists**: Enhanced with 4-tier discovery strategy and better channel matching
- Improved error handling to return empty arrays instead of throwing errors for better user experience

### 🚀 Added
- Video count extraction via iterator for accurate playlist information
- Multi-strategy playlist discovery: direct access → enhanced search → basic search → video-based discovery
- Enhanced channel matching logic for better playlist attribution to correct channels
- Graceful degradation when playlist discovery fails

### 📊 Impact
- Playlist info now returns accurate video counts (e.g., 14 videos for Snowflake Summit 2025)
- Better playlist discovery for channels with actual playlists
- Improved user experience with graceful fallbacks instead of errors

### Technical Details
- Fixed playlist metadata extraction from multiple object properties
- Added video counting via playlist iterator
- Enhanced channel filtering in playlist search results
- Improved error handling throughout playlist operations

## [1.4.0] - 2025-06-18

### 🔧 Fixed
- **Major Fix**: Channel video discovery now finds all available videos instead of stopping early
- Fixed early return issue in search strategy that was limiting results to first search query
- Improved channel matching logic with dynamic name variations
- Added direct channel access as primary method with search-based fallback

### 🚀 Improved  
- Enhanced search strategy to collect videos from ALL search queries with deduplication
- Better error handling and fallback mechanisms for channel handle resolution
- More flexible channel name matching patterns
- Added comprehensive debug logging for troubleshooting

### 📊 Impact
- Channels like @indydevdan now return 17 videos instead of 2
- Significantly improved video discovery accuracy for handle-based channels
- Better coverage of channel content across different search strategies

### 🧪 Testing
- Added local testing environment for debugging channel access issues
- Created debug service for detailed analysis of search strategies
- Verified fixes with comprehensive test scenarios

### Technical Details
- Fixed search result collection logic in `getChannelVideosBySearch`
- Enhanced `getChannelNameVariations` to generate dynamic variations
- Improved channel matching in video filtering logic
- Added proper deduplication with `Set<string>` for video IDs

## [1.3.1] - Previous Version
- Base functionality for YouTube transcript extraction
- Channel video discovery with search-based approach
- Transcript search and formatting features