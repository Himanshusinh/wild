# Mockup Generation Setup Guide

## Overview
The Mockup Generation feature uses the Flux Kontext API to create professional mockups by integrating logos into product images with custom business names and taglines.

## API Setup

### 1. Get Flux Kontext API Key
- Visit [https://api.bfl.ai/](https://api.bfl.ai/)
- Sign up and get your API key
- The API key should be added to your `.env.local` file

### 2. Environment Variables
Create a `.env.local` file in your project root with:
```bash
BFL_API_KEY=your_actual_api_key_here
```

## How It Works

### 1. Input Requirements
- **Logo Image**: Upload your business logo (supports up to 20MB)
- **Product Image**: Upload or select a product image to place the logo on
- **Business Name**: Enter your business name (required)
- **Tag Line**: Optional tagline for your business
- **Prompt**: Describe how you want the logo integrated
- **Frame Size**: Choose aspect ratio (1:1, 16:9, etc.)
- **Number of Images**: Generate multiple variations

### 2. API Process
1. Images are converted to base64 format
2. A comprehensive prompt is built combining all inputs
3. Request is sent to Flux Kontext API
4. API processes the image with logo integration
5. Results are polled until completion
6. Generated images are saved to history

### 3. API Limitations
- **Image Size**: Up to 20MB or 20 megapixels
- **Aspect Ratios**: 3:7 to 7:3 range
- **Output Format**: JPEG or PNG
- **Polling Timeout**: 60 seconds maximum
- **Safety Tolerance**: 0-6 (moderation levels)

## Usage Flow

1. **Upload Logo**: Click "Upload Logo" and select your logo file
2. **Select Product**: Choose "Product Image" to upload or select from presets
3. **Enter Details**: Fill in business name and optional tagline
4. **Describe Integration**: Write a prompt explaining how the logo should be integrated
5. **Choose Settings**: Select frame size and number of images
6. **Generate**: Click "Generate Mockup" to start the process
7. **Wait**: The API will process your request (usually takes 10-30 seconds)
8. **View Results**: Generated mockups appear in your history

## Error Handling

- **Missing Fields**: Form validation ensures all required fields are filled
- **API Errors**: Network and API errors are displayed to the user
- **Timeout**: If generation takes too long, an error is shown
- **File Issues**: Invalid image formats or sizes are caught early

## Technical Details

### API Endpoint
```
POST https://api.bfl.ai/v1/flux-kontext-pro
```

### Request Body
```json
{
  "prompt": "Your custom prompt with business details",
  "input_image": "base64_encoded_product_image",
  "aspect_ratio": "1:1",
  "output_format": "jpeg"
}
```

### Response
```json
{
  "id": "request_id",
  "polling_url": "https://api.bfl.ai/v1/poll/request_id"
}
```

## Troubleshooting

### Common Issues
1. **API Key Invalid**: Check your `.env.local` file
2. **Image Too Large**: Ensure images are under 20MB
3. **Generation Fails**: Check the prompt clarity and image quality
4. **Timeout Errors**: Try again with a simpler prompt

### Debug Steps
1. Check browser console for errors
2. Verify API key is loaded correctly
3. Ensure all required fields are filled
4. Check image file formats and sizes

## Cost Considerations

- The Flux Kontext API has usage-based pricing
- Each mockup generation counts as one API call
- Monitor your usage through the BFL dashboard
- Consider implementing rate limiting for production use
