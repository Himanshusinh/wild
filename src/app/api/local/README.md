# Local API Integration

This directory contains API routes for local model integration via ngrok tunnels.

## Logo Generation

### Environment Variables Required

Add these to your `.env.local` file:

```bash
# Local Logo Generation API (via ngrok)
LOCAL_LOGO_GENERATION_KEY=your_api_key_here
LOCAL_LOGO_GENERATION_URL=http://localhost:8000  # or your ngrok URL
```

### API Endpoint

- **Route**: `/api/local/logo-generation`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "prompt": "Sleek lettermark A, minimal, sharp edges, grayscale",
    "num_images": 1,
    "model": "local-logo-model",
    "generationType": "logo-generation"
  }
  ```

### Expected Response Format

The local API should return:
```json
{
  "image_urls": [
    "/path/to/generated/image1.png",
    "/path/to/generated/image2.png"
  ]
}
```

### Flow

1. **Create History Entry**: Saves initial entry with 'generating' status
2. **Call Local API**: Sends request to local model via ngrok
3. **Download Images**: Fetches generated images from local API
4. **Upload to Firebase**: Stores images in Firebase Storage
5. **Update History**: Updates entry with completed status and Firebase URLs
6. **Return Result**: Sends success response with image data

### Error Handling

- API key validation
- Network timeouts
- Invalid response format
- Firebase upload failures
- Automatic history entry updates on failure

### Integration Points

- **History System**: Uses existing Firestore history collection
- **Firebase Storage**: Stores generated images in 'generated-logos' folder
- **UI Components**: Integrates with existing logo generation InputBox
- **Preview Modal**: Uses custom LogoImagePreview component
- **Notifications**: Shows success/error messages via Redux
