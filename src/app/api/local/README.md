# Local API Integration

This directory contains local API integrations for various generation services via ngrok tunnels.

## Logo Generation

**Endpoint:** `/api/local/logo-generation`

**Environment Variables Required:**
- `LOCAL_LOGO_GENERATION_KEY`: API key for authentication
- `LOCAL_LOGO_GENERATION_URL`: Base URL of the ngrok tunnel (e.g., `https://abc123.ngrok-free.app`)

**Expected Response Format:**
```json
{
  "success": true,
  "historyId": "unique_id",
  "images": [
    "https://ngrok-url/download/logo_123.png"
  ],
  "message": "Successfully generated 1 logo"
}
```

**Integration Flow:**
1. Receives generation request with prompt, model, and image count
2. Creates initial history entry with 'generating' status
3. Calls local Python API via ngrok tunnel
4. Downloads generated images from local API
5. Uploads images to Firebase Storage (`generated-logos/` folder)
6. Updates history entry with completed images
7. Returns success response with Firebase URLs

## Sticker Generation

**Endpoint:** `/api/local/sticker-generation`

**Environment Variables Required:**
- `LOCAL_STICKER_GENERATION_KEY`: API key for authentication
- `LOCAL_STICKER_GENERATION_URL`: Base URL of the ngrok tunnel (e.g., `https://abc123.ngrok-free.app`)

**Expected Response Format:**
```json
{
  "success": true,
  "historyId": "unique_id",
  "images": [
    "https://ngrok-url/download/sticker_123.png"
  ],
  "message": "Successfully generated 1 sticker"
}
```

**Integration Flow:**
1. Receives generation request with prompt, model, and image count
2. Creates initial history entry with 'generating' status
3. Calls local Python API via ngrok tunnel
4. Downloads generated images from local API
5. Uploads images to Firebase Storage (`generated-stickers/` folder)
6. Updates history entry with completed images
7. Returns success response with Firebase URLs

## Product Generation

**Endpoint:** `/api/local/product-generation`

**Environment Variables Required:**
- `LOCAL_PRODUCT_GENERATION_URL`: Base URL of the ngrok tunnel (e.g., `https://abc123.ngrok-free.app`)

**Request Body:**
```json
{
  "prompt": "Product description",
  "model": "flux-kontext-dev", // Local model - generates from description only
  "imageCount": 1
}
```

**For Flux Models (with product images):**
```json
{
  "prompt": "Product description",
  "model": "flux-kontext-pro",
  "imageCount": 1,
  "aspect_ratio": "16:9", // Aspect ratio between 21:9 and 9:21
  "productImage": "base64_or_url_string",
  "modelImage": "base64_or_url_string" // Optional - for product with model pose
}
```

**Expected Response Format:**
```json
{
  "success": true,
  "historyId": "unique_id",
  "images": [
    "https://ngrok-url/download/product_123.png"
  ],
  "message": "Successfully generated 1 product image"
}
```

**Three Generation Cases:**

1. **Local Model Generation (Description Only):**
   - Model: `flux-kontext-dev`
   - Requires: `prompt` only
   - Generates: Products from text description
   - Use case: Quick concept generation, no image upload needed
   - **Note**: Frame size, product image, and model image selection are disabled for this model

2. **Product-Only Generation (Flux Models):**
   - Models: `flux-kontext-pro`, `flux-kontext-max`, `flux-pro-1.1`
   - Requires: `prompt`, `productImage`
   - Generates: Professional product photos with high-quality lighting
   - Use case: E-commerce, marketing materials

3. **Product with Model Pose (Flux Models):**
   - Models: `flux-kontext-pro`, `flux-kontext-max`, `flux-pro-1.1`
   - Requires: `prompt`, `productImage`, `modelImage`
   - Generates: Product photos with model wearing/using the product
   - Use case: Fashion, lifestyle, product demonstrations

**Integration Flow:**
1. Receives generation request with prompt, product image, and optional model image
2. Creates initial history entry with 'generating' status
3. Calls local Python API via ngrok tunnel (`/generate-product`)
4. Downloads generated images from local API
5. Uploads images to Firebase Storage (`generated-products/` folder)
6. Updates history entry with completed images
7. Returns success response with Firebase URLs

## Common Features

All APIs provide:
- **Firebase Integration**: Automatic upload to dedicated folders
- **History Management**: Integration with existing history system
- **Error Handling**: Comprehensive error logging and user notifications
- **Image Processing**: Converts relative URLs to full URLs and downloads images
- **Authentication**: API key validation for security (where applicable)
- **Logging**: Extensive console logging for debugging

## Setup Instructions

1. Add the required environment variables to `.env.local`
2. Ensure your Python service is running and accessible via ngrok
3. The local API should respond with `image_urls` array containing relative paths
4. Images will be automatically downloaded and uploaded to Firebase Storage
5. History entries will be created and updated automatically

## Model Integration

All APIs work with the same model selection system:
- **Local Model**: Uses the local API endpoint
- **Flux Models**: Use the existing Flux API integration
- **Seamless Switching**: Users can choose between fast local generation or high-quality Flux generation

## UI Behavior

**Local Model (flux-kontext-dev):**
- Frame size selection: **Disabled** (not applicable)
- Product image upload: **Disabled** (not needed)
- Model image upload: **Disabled** (not needed)
- Only requires text prompt input

**Flux Models (flux-kontext-pro, flux-kontext-max, flux-pro-1.1):**
- Frame size selection: **Enabled** (maps to `aspect_ratio` parameter)
- Product image upload: **Required**
- Model image upload: **Optional** (for product with model pose)
- Requires prompt + product image + optional model image
