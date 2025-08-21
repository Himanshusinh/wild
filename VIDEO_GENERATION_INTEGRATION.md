# Video Generation Integration

This document outlines the implementation of the Runway video generation feature, which supports both Image-to-Video and Video-to-Video generation modes.

## Overview

The video generation feature integrates with Runway's AI models to create videos from images or transform existing videos with style guidance. It provides a unified interface for both generation modes with comprehensive validation and error handling.

## Features

### 🎬 Generation Modes

1. **Image-to-Video**: Generate videos from static images
   - Supports `gen4_turbo` and `gen3a_turbo` models
   - Configurable duration (5 or 10 seconds)
   - Multiple aspect ratios per model

2. **Video-to-Video**: Transform existing videos with style guidance
   - Uses `gen4_aleph` model exclusively
   - Style reference images support
   - Maintains original video motion

### 🎨 Models & Capabilities

#### Gen-4 Turbo (Image-to-Video)
- **Ratios**: 1280:720, 720:1280, 1104:832, 832:1104, 960:960, 1584:672
- **Features**: High-quality, fast generation
- **Input**: Single image or array of images with positions

#### Gen-3a Turbo (Image-to-Video)
- **Ratios**: 1280:768, 768:1280
- **Features**: Advanced features, supports "last" position
- **Input**: Single image or array of images with positions

#### Gen-4 Aleph (Video-to-Video)
- **Ratios**: 1280:720, 720:1280, 1104:832, 832:1104, 960:960, 1584:672
- **Features**: Style transfer and enhancement
- **Input**: Video + optional reference images

## Architecture

### File Structure

```
src/
├── types/
│   └── videoGeneration.ts          # TypeScript interfaces and types
├── lib/
│   ├── videoGenerationBuilders.ts  # Request body builders
│   ├── runwayVideoService.ts       # API interaction utilities
│   └── __tests__/
│       └── videoGenerationBuilders.test.ts  # Unit tests
├── app/
│   ├── api/
│   │   └── runway/
│   │       └── video/
│   │           ├── route.ts        # Main video generation endpoint
│   │           └── status/[id]/
│   │               └── route.ts    # Status polling endpoint
│   └── view/
│       └── Generation/
│           └── VideoGeneration/
│               └── TextToVideo/
│                   ├── TextToVideo.tsx           # Main page
│                   └── compo/
│                       └── VideoGenerationInputBox.tsx  # Input component
```

### Key Components

#### 1. VideoGenerationInputBox
- **Purpose**: Main input interface for video generation
- **Features**:
  - Mode switching (Image-to-Video ↔ Video-to-Video)
  - Dynamic model selection based on mode
  - Aspect ratio filtering per model
  - File upload handling (images/videos)
  - Reference image management
  - Advanced settings (content moderation)
  - Real-time validation
  - Progress tracking

#### 2. API Routes
- **`/api/runway/video`**: Initiates video generation
- **`/api/runway/video/status/[id]`**: Polls generation status

#### 3. Utility Functions
- **`buildImageToVideoBody`**: Constructs API request for image-to-video
- **`buildVideoToVideoBody`**: Constructs API request for video-to-video
- **`waitForRunwayVideoCompletion`**: Handles async generation completion

## API Integration

### Runway API Endpoints

#### Image-to-Video
```
POST /v1/image_to_video
```

**Required Fields:**
- `promptImage`: Image URI or array of objects with position
- `model`: "gen4_turbo" or "gen3a_turbo"
- `ratio`: Aspect ratio (filtered by model)

**Optional Fields:**
- `promptText`: Description (≤1000 chars)
- `seed`: Random seed (0-4294967295)
- `duration`: 5 or 10 seconds (default: 10)
- `contentModeration`: Public figure threshold

#### Video-to-Video
```
POST /v1/video_to_video
```

**Required Fields:**
- `videoUri`: Video file URI
- `promptText`: Description (≤1000 chars)
- `model`: Must be "gen4_aleph"
- `ratio`: Aspect ratio

**Optional Fields:**
- `seed`: Random seed (0-4294967295)
- `references`: Array of style reference images
- `contentModeration`: Public figure threshold

### Request Flow

1. **User Input**: User configures generation parameters
2. **Validation**: Client-side validation of all inputs
3. **API Call**: POST to `/api/runway/video`
4. **Task Creation**: Runway returns task ID
5. **Status Polling**: Poll `/api/runway/video/status/[id]`
6. **Completion**: Download generated video(s)
7. **History Update**: Save to Firebase with metadata

## Validation Rules

### Image-to-Video
- ✅ `promptImage` required (URI or array)
- ✅ Model must be `gen4_turbo` or `gen3a_turbo`
- ✅ Ratio must be valid for selected model
- ✅ Duration must be 5 or 10 seconds
- ✅ "last" position only allowed with `gen3a_turbo`

### Video-to-Video
- ✅ `videoUri` required (≤16MB, supported formats)
- ✅ `promptText` required (≤1000 chars)
- ✅ Model must be `gen4_aleph`
- ✅ Ratio must be valid for `gen4_aleph`
- ✅ Video format validation (mp4, webm, mov, ogg, h264)

### General
- ✅ Seed must be integer 0-4294967295
- ✅ Prompt text ≤1000 UTF-16 characters
- ✅ File size limits enforced
- ✅ MIME type validation

## UI/UX Features

### Mode Switching
- **Auto-detection**: Mode switches based on uploaded content
- **Manual Override**: Users can manually select mode
- **Visual Feedback**: Clear indication of current mode

### Dynamic Controls
- **Model Selection**: Filtered by generation mode
- **Aspect Ratio**: Dynamically filtered by selected model
- **Duration**: Only visible for Image-to-Video mode
- **References**: Only visible for Video-to-Video mode

### File Management
- **Image Upload**: Drag & drop or click to upload
- **Video Upload**: Format and size validation
- **Reference Images**: Add/remove/reorder with thumbnails
- **Preview**: Visual confirmation of uploaded files

### Progress Tracking
- **Real-time Updates**: Progress bar with percentage
- **Status Messages**: Clear indication of current step
- **Error Handling**: User-friendly error messages

## Error Handling

### Client-Side Validation
- Input validation before API calls
- File type and size checks
- Model-ratio compatibility validation
- Position restrictions enforcement

### API Error Handling
- Network error handling
- Runway API error parsing
- User-friendly error messages
- Retry mechanisms for transient failures

### Fallback Strategies
- Default values for optional parameters
- Graceful degradation for unsupported features
- Clear error messages with resolution steps

## Testing

### Unit Tests
- **Builder Functions**: Request body construction
- **Validation Logic**: Input validation rules
- **Helper Functions**: Utility function behavior

### Integration Tests
- **API Endpoints**: Request/response handling
- **File Uploads**: Image and video processing
- **Error Scenarios**: Various failure modes

## Security Considerations

### File Validation
- MIME type verification
- File size limits
- Content type restrictions
- Malicious file prevention

### API Security
- Environment variable usage for API keys
- Input sanitization
- Rate limiting considerations
- Error message sanitization

## Performance Optimizations

### File Processing
- Efficient file reading
- Base64 encoding optimization
- Memory management for large files
- Async processing for better UX

### API Calls
- Debounced status polling
- Efficient error handling
- Connection pooling
- Timeout management

## Future Enhancements

### Planned Features
- **Batch Processing**: Multiple video generation
- **Template System**: Predefined generation presets
- **Advanced Controls**: More granular parameter control
- **Export Options**: Multiple output formats

### Technical Improvements
- **WebSocket Integration**: Real-time progress updates
- **Caching Layer**: Result caching for repeated requests
- **Queue Management**: Better handling of concurrent requests
- **Analytics**: Usage tracking and optimization

## Troubleshooting

### Common Issues

1. **"position: 'last' is only supported by gen3a_turbo"**
   - Solution: Switch to Gen-3a Turbo model or use "first" position

2. **"Upload a video to use Gen-4 Aleph"**
   - Solution: Upload a video file for video-to-video mode

3. **"Video file too large"**
   - Solution: Compress video or use smaller file (≤16MB)

4. **"Invalid video type"**
   - Solution: Use supported formats: mp4, webm, mov, ogg, h264

### Debug Information
- Console logging for API requests/responses
- Detailed error messages with context
- Network request inspection
- File validation feedback

## Configuration

### Environment Variables
```bash
RUNWAY_API_KEY=your_runway_api_key_here
```

### API Configuration
- Base URL: `https://api.dev.runwayml.com`
- Version Header: `X-Runway-Version: 2024-11-06`
- Timeout: 5 minutes (configurable)
- Poll Interval: 2 seconds

## Support

For technical support or feature requests:
1. Check console logs for detailed error information
2. Verify API key configuration
3. Ensure file format and size compliance
4. Review validation error messages

---

*This integration provides a robust, user-friendly interface for AI-powered video generation with comprehensive error handling and validation.*
