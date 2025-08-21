# MiniMax Integration

This application now supports MiniMax's image-01 model alongside the existing BFL.ai and Runway models.

## Models Available

### MiniMax Models
- **image-01**: High-quality text-to-image and image-to-image generation with character reference support

### Existing Models
- **BFL Models**: flux-kontext-pro, flux-kontext-max, flux-pro-1.1, flux-pro-1.1-ultra, flux-pro, flux-dev
- **Runway Models**: gen4_image, gen4_image_turbo

## Setup

### 1. Environment Variables
Add the following to your `.env.local` file:

```bash
# MiniMax API Key
MINIMAX_API_KEY=your_minimax_api_key_here

# Existing API Keys
BFL_API_KEY=your_bfl_api_key_here
RUNWAY_API_KEY=your_runway_api_key_here
```

### 2. Get MiniMax API Key
1. Visit [MiniMax's Developer Portal](https://api.minimax.io/)
2. Create an account and get your API key
3. Add it to your environment variables

## Features

### Image Generation Support
- **Text-to-Image**: Generate images from text prompts
- **Image-to-Image**: Generate images using character references (human faces)
- **Multiple Images**: Generate 1-9 images per request
- **Aspect Ratios**: Supports 1:1, 16:9, 4:3, 3:2, 2:3, 3:4, 9:16, 21:9
- **Custom Dimensions**: Width/height from 512-2048 pixels (multiples of 8)

### Character Reference Support
- **Single Image Only**: MiniMax supports only 1 reference image per request
- **Character Type**: Currently only supports "character" type (human faces)
- **Image Formats**: JPG, JPEG, PNG (under 10MB)
- **Input Methods**: Base64 data URLs or public URLs

### Automatic Model Switching
- When images are uploaded, MiniMax appears as an option
- Supports both single and multiple image generation
- Maintains compatibility with existing BFL and Runway models

## API Endpoints

### Generate Image
- **POST** `/api/minimax`
- Creates MiniMax image generation requests
- Handles both text-to-image and image-to-image

## Usage

### Text-to-Image
1. Select "MiniMax Image-01" from the Models dropdown
2. Enter your prompt (max 1500 characters)
3. Choose aspect ratio or custom dimensions
4. Set number of images (1-9)
5. Click Generate

### Image-to-Image (Character Reference)
1. Select "MiniMax Image-01" from the Models dropdown
2. Upload a reference image (human face recommended)
3. Enter your prompt describing the desired output
4. Choose aspect ratio or custom dimensions
5. Set number of images (1-9)
6. Click Generate

## Technical Details

### Request Payload
```json
{
  "model": "image-01",
  "prompt": "Your image description",
  "aspect_ratio": "16:9",
  "n": 3,
  "prompt_optimizer": true,
  "subject_reference": [
    {
      "type": "character",
      "image_file": "data:image/jpeg;base64,..."
    }
  ]
}
```

### Response Format
```json
{
  "id": "03ff3cd0820949eb8a410056b5f21d38",
  "data": {
    "image_urls": ["url1", "url2", "url3"]
  },
  "metadata": {
    "success_count": "3",
    "failed_count": "0"
  },
  "base_resp": {
    "status_code": 0,
    "status_msg": "success"
  }
}
```

### Error Handling
- **Missing API Key**: Shows "MiniMax API key not configured"
- **Invalid Prompt**: Shows "Prompt exceeds 1500 characters limit"
- **Invalid Image Count**: Shows "n must be between 1 and 9"
- **Invalid Dimensions**: Shows width/height validation errors
- **API Errors**: Shows specific MiniMax error messages

### Limitations
- **Reference Images**: Only 1 image supported per request
- **Image Type**: Only "character" type supported
- **Image Size**: Maximum 10MB per reference image
- **Formats**: JPG, JPEG, PNG only
- **Dimensions**: Must be multiples of 8 pixels

## Integration Notes

- Uses Redux async thunks for state management
- Maintains consistent history structure across all models
- Supports progress tracking during generation
- Handles both synchronous (BFL, MiniMax) and asynchronous (Runway) generation
- Automatic model filtering based on uploaded images
- Seamless integration with existing UI components

## Best Practices

1. **Reference Images**: Use front-facing person photos for best results
2. **Prompt Length**: Keep prompts under 1500 characters
3. **Image Quality**: Use high-quality reference images under 10MB
4. **Aspect Ratios**: Use standard ratios for better compatibility
5. **Batch Generation**: Use n=1-9 based on your needs
