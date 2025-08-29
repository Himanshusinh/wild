# FAL AI Veo3 Integration Setup

This document explains how to set up and use the FAL AI Veo3 API for video ad generation in the WildMind AI application.

## 🚀 Overview

The ad generation system now uses **FAL AI Veo3 Fast** model to convert product images into engaging video ads. This provides:

- **High-quality video generation** from static images
- **Natural motion and realistic animations**
- **16:9 aspect ratio output** (720p or 1080p)
- **8-second video duration**
- **Optional audio generation** (33% more credits if enabled)

## 🔑 Setup Requirements

### 1. Environment Variables

Add your FAL AI API key to your `.env.local` file:

```bash
FAL_KEY=your_fal_api_key_here
```

### 2. Get FAL AI API Key

1. Visit [FAL AI Console](https://fal.ai/console)
2. Create an account or sign in
3. Navigate to API Keys section
4. Generate a new API key
5. Copy the key to your environment variables

## 📡 API Endpoints

### Generate Video

**POST** `/api/ad-gen/generate-video`

**Request Body:**
```json
{
  "prompt": "Describe how the image should be animated...",
  "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQ...",
  "duration": "8s",
  "generate_audio": true,
  "resolution": "720p"
}
```

**Response:**
```json
{
  "video": {
    "url": "https://storage.googleapis.com/falserverless/...",
    "content_type": "video/mp4",
    "file_name": "generated_video.mp4",
    "file_size": 1234567
  },
  "requestId": "abc-123-def",
  "status": "completed"
}
```

## 🎯 Usage in Frontend

### InputBox Component

The `AdGenerationInputBox` component handles:

1. **Image Upload**: Accepts product images (up to 8MB)
2. **Prompt Input**: Text description of desired animation
3. **Settings**: Resolution (720p/1080p) and audio generation
4. **API Integration**: Calls FAL AI Veo3 API
5. **Progress Tracking**: Shows generation status
6. **Result Display**: Video preview and download

### Key Features

- **Base64 Conversion**: Automatically converts uploaded images to data URIs
- **Error Handling**: Comprehensive error handling for API failures
- **Loading States**: Visual feedback during generation
- **History Integration**: Saves all generations to Firebase
- **Responsive Design**: Matches other generation components

## 🔧 Technical Implementation

### Image Processing

```typescript
// Convert File to Base64 Data URI
const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
```

### API Call

```typescript
const falResponse = await fetch('/api/ad-gen/generate-video', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    prompt: prompt.trim(),
    image_data: imageDataUri,
    duration: '8s',
    generate_audio: generateAudio,
    resolution: resolution,
  }),
});
```

## 📊 Supported Parameters

| Parameter | Values | Default | Notes |
|-----------|--------|---------|-------|
| **Duration** | `8s` | `8s` | Fixed for Veo3 Fast |
| **Resolution** | `720p`, `1080p` | `720p` | Higher quality = more credits |
| **Audio** | `true`, `false` | `true` | 33% more credits if enabled |
| **Image Size** | Up to 8MB | - | Larger files may be slower |

## 🎨 Prompt Guidelines

For best results, include in your prompt:

1. **Action**: How the image should be animated
   - "The product gently rotates 360 degrees"
   - "The model waves and smiles at the camera"

2. **Style**: Desired animation style
   - "Smooth, cinematic movement"
   - "Playful, energetic animation"

3. **Camera Motion** (optional)
   - "Camera slowly zooms in"
   - "Gentle pan from left to right"

4. **Ambiance** (optional)
   - "Warm, inviting atmosphere"
   - "Professional, corporate feel"

### Example Prompts

```
✅ Good: "The smartphone gently floats up while rotating slowly, with a subtle glow effect and smooth camera movement"

❌ Avoid: "Make it move" (too vague)
❌ Avoid: "Add explosions and fireworks" (may violate safety filters)
```

## 🚨 Safety & Limitations

### Safety Filters
- FAL AI applies safety filters to both input images and generated content
- Inappropriate or harmful content will be rejected
- Follow community guidelines for best results

### Technical Limitations
- **Input**: Images up to 8MB, 16:9 aspect ratio recommended
- **Output**: MP4 format, 8-second duration
- **Processing**: May take 1-5 minutes depending on complexity
- **Credits**: Audio generation uses 33% more credits

## 🔍 Troubleshooting

### Common Issues

1. **API Key Error**
   ```
   Error: FAL AI API key not configured
   ```
   - Check `FAL_KEY` environment variable
   - Restart development server

2. **Image Size Error**
   ```
   Error: Image too large
   ```
   - Compress image to under 8MB
   - Use image optimization tools

3. **Generation Failed**
   ```
   Error: FAL AI API error: 400
   ```
   - Check prompt content
   - Verify image format (JPEG/PNG)
   - Review API response details

### Debug Mode

Enable detailed logging by checking browser console and server logs:

```typescript
console.log('FAL AI API response:', falResult);
console.log('Generated video URL:', falResult.video?.url);
```

## 📈 Performance Optimization

### Best Practices

1. **Image Optimization**
   - Use compressed JPEG images
   - Maintain 16:9 aspect ratio
   - Keep file size under 5MB for faster processing

2. **Prompt Optimization**
   - Be specific but concise
   - Use clear, descriptive language
   - Avoid overly complex animations

3. **Batch Processing**
   - Process multiple images sequentially
   - Implement proper error handling
   - Use loading states for better UX

## 🔮 Future Enhancements

Potential improvements:

- **Multiple Duration Options**: Support for different video lengths
- **Batch Generation**: Process multiple images simultaneously
- **Advanced Controls**: More granular animation parameters
- **Template System**: Pre-built animation templates
- **Real-time Preview**: Live preview during generation

## 📚 Resources

- [FAL AI Documentation](https://fal.ai/docs)
- [Veo3 Model Details](https://fal.ai/models/fal-ai/veo3)
- [Prompting Guide](https://fal.ai/docs/prompting)
- [API Reference](https://fal.ai/docs/api)

## 🤝 Support

For technical issues:

1. Check this documentation
2. Review browser console logs
3. Check server-side logs
4. Verify environment variables
5. Test with simple prompts first

---

**Note**: This integration uses the FAL AI Veo3 Fast model for optimal performance and cost-effectiveness. For production use, ensure proper error handling and user feedback mechanisms are in place.
