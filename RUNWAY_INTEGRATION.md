# Runway Integration

This application now supports Runway's Gen4 image generation models alongside the existing BFL.ai models.

## Models Available

### Runway Models
- **gen4_image**: Text-to-image generation with optional reference images
- **gen4_image_turbo**: Text-to-image generation with required reference images (at least one)

### BFL Models (Existing)
- **flux-kontext-pro**: Supports image inputs
- **flux-kontext-max**: Supports image inputs  
- **flux-pro-1.1**: Text-only
- **flux-pro-1.1-ultra**: Text-only
- **flux-pro**: Text-only
- **flux-dev**: Text-only (default)

## Setup

### 1. Environment Variables
Add the following to your `.env.local` file:

```bash
# Runway API Key
RUNWAY_API_KEY=your_runway_api_key_here

# Existing BFL API Key
BFL_API_KEY=your_bfl_api_key_here
```

### 2. Get Runway API Key
1. Visit [Runway's Developer Portal](https://developers.runwayml.com/)
2. Create an account and get your API key
3. Add it to your environment variables

## Features

### Image Upload Support
- **gen4_image**: Can work with or without reference images
- **gen4_image_turbo**: Requires at least one reference image
- **flux-kontext-***: Support multiple image inputs

### Automatic Model Switching
- When images are uploaded, only models that support image inputs are shown
- Default model switches to `flux-kontext-pro` when first image is uploaded
- Validation prevents using `gen4_image_turbo` without reference images

### Frame Size Conversion
The app automatically converts internal frame sizes to Runway-compatible ratios:

| Internal | Runway |
|----------|---------|
| 1:1      | 1024:1024 |
| 16:9     | 1920:1080 |
| 9:16     | 1080:1920 |
| 4:3      | 1360:768  |
| 3:4      | 768:1360  |
| 3:2      | 1440:1080 |
| 2:3      | 1080:1440 |
| 21:9     | 1808:768  |
| 9:21     | 768:1808  |
| 16:10    | 1680:720  |
| 10:16    | 720:1680  |

## API Endpoints

### Generate Image
- **POST** `/api/runway`
- Creates a new Runway generation task

### Check Task Status  
- **GET** `/api/runway/status/[taskId]`
- Polls Runway API for task completion

## Usage

1. Select a Runway model from the Models dropdown
2. Enter your prompt
3. Optionally upload reference images (required for turbo)
4. Click Generate
5. The app will poll Runway's API and update progress
6. Generated images appear in history when complete

## Error Handling

- **Missing API Key**: Shows "Runway API key not configured"
- **Invalid Model**: Shows "Invalid model" error
- **Missing Reference Images**: Shows "gen4_image_turbo requires at least one reference image"
- **Task Failure**: Shows specific failure reason from Runway API
- **Timeout**: Shows "Task polling timeout exceeded" after 5 minutes

## Technical Details

- Uses Redux async thunks for state management
- Implements exponential backoff for API polling
- Handles both synchronous (BFL) and asynchronous (Runway) generation
- Maintains consistent history structure across all models
- Supports progress tracking for long-running tasks
