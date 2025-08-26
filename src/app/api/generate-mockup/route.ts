import { NextResponse } from 'next/server';

async function pollForResults(pollingUrl: string, apiKey: string) {
  for (let i = 0; i < 120; i++) { // Poll for up to 60 seconds
    await new Promise(resolve => setTimeout(resolve, 500)); // Wait 500ms between polls
    
    const pollResponse = await fetch(pollingUrl, {
      headers: {
        'accept': 'application/json',
        'x-key': apiKey
      }
    });
    
    const result = await pollResponse.json();
    
    if (result.status === 'Ready') {
      return result.result.sample;
    } else if (result.status === 'Error' || result.status === 'Failed') {
      throw new Error(`Generation failed: ${JSON.stringify(result)}`);
    }
  }
  throw new Error('Timeout waiting for image generation');
}

export async function POST(request: Request) {
  try {
    // Handle FormData instead of JSON
    const formData = await request.formData();
    const prompt = formData.get('prompt') as string;
    const model = formData.get('model') as string;
    const n = parseInt(formData.get('n') as string) || 1;
    const frameSize = formData.get('frameSize') as string || '1:1';
    const logoImage = formData.get('logoImage') as File;
    const productImage = formData.get('productImage') as File;
    const businessName = formData.get('businessName') as string;
    const tagLine = formData.get('tagLine') as string || '';
    
    const apiKey = process.env.BFL_API_KEY;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!logoImage) {
      return NextResponse.json({ error: 'Logo image is required' }, { status: 400 });
    }

    if (!productImage) {
      return NextResponse.json({ error: 'Product image is required' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    // Convert images to base64 using Node.js compatible methods
    const logoBase64 = await fileToBase64(logoImage);
    const productBase64 = await fileToBase64(productImage);

    // Debug logging for logo processing
    console.log('Logo image size:', logoImage.size, 'bytes');
    console.log('Logo base64 length:', logoBase64.length);
    console.log('Product image size:', productImage.size, 'bytes');
    console.log('Product base64 length:', productBase64.length);

    // Build the prompt for mockup generation
    const mockupPrompt = buildMockupPrompt(prompt, businessName, tagLine);
    
    console.log('Generated prompt:', mockupPrompt);

    // Try to create a composite reference image for better logo integration
    const compositePrompt = `Create a professional mockup where the uploaded logo is clearly visible and prominently displayed on the product. The logo must be the main focal point and appear exactly as provided.`;

    // Generate multiple images if requested
    const imagePromises = Array.from({ length: n }, async () => {
      // Strategy 1: Try with style_image for logo integration
      let response = await fetch('https://api.bfl.ai/v1/flux-kontext-pro', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'x-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: mockupPrompt,
          input_image: productBase64,
          style_image: logoBase64, // Use logo as style reference
          aspect_ratio: frameSize,
          output_format: 'jpeg',
          guidance_scale: 8.5, // Higher guidance for better prompt adherence
          num_inference_steps: 75, // More steps for better quality and logo preservation
          negative_prompt: "blurry, low quality, distorted logo, poorly positioned logo, logo too small, logo too large, logo cut off, logo overlapping, logo misplaced, different logo, wrong logo, logo not matching uploaded image, logo replacement, logo modification, logo redesign, logo recreation, logo missing, no logo, logo invisible",
          seed: Math.floor(Math.random() * 1000000), // Random seed for variety
          scheduler: "DPM++ 2M Karras", // Better scheduler for detail preservation
        }),
      });

      // If first attempt fails, try alternative approach
      if (!response.ok) {
        console.log('First approach failed, trying alternative method...');
        
        // Strategy 2: Try with different parameters
        response = await fetch('https://api.bfl.ai/v1/flux-kontext-pro', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'x-key': apiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: compositePrompt + ' ' + mockupPrompt, // Combine prompts
            input_image: productBase64,
            aspect_ratio: frameSize,
            output_format: 'jpeg',
            guidance_scale: 9.0, // Even higher guidance
            num_inference_steps: 100, // Maximum steps for quality
            negative_prompt: "blurry, low quality, distorted logo, poorly positioned logo, logo too small, logo too large, logo cut off, logo overlapping, logo misplaced, different logo, wrong logo, logo not matching uploaded image, logo replacement, logo modification, logo redesign, logo recreation, logo missing, no logo, logo invisible, logo not visible, logo hidden",
            seed: Math.floor(Math.random() * 1000000),
            scheduler: "DPM++ 2M Karras",
          }),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to initiate image generation: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();

      if (!data.polling_url) {
        throw new Error('No polling URL received');
      }

      // Poll for results
      const imageUrl = await pollForResults(data.polling_url, apiKey);

      return {
        url: imageUrl,
        originalUrl: imageUrl,
        id: data.id
      };
    });

    // Wait for all images to be generated
    const images = await Promise.all(imagePromises);

    return NextResponse.json({
      images: images,
      historyId: `mockup_${Date.now()}`, // Simple local ID
      message: 'Mockup generated successfully'
    });

  } catch (error) {
    console.error('Mockup generation error:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate mockup' },
      { status: 500 }
    );
  }
}

// Helper function to convert file to base64 using Node.js compatible methods
async function fileToBase64(file: File): Promise<string> {
  try {
    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    
    // Convert ArrayBuffer to Buffer (Node.js)
    const buffer = Buffer.from(arrayBuffer);
    
    // Convert to base64
    const base64 = buffer.toString('base64');
    
    return base64;
  } catch (error) {
    throw new Error(`Failed to convert file to base64: ${error}`);
  }
}

// Helper function to build mockup prompt
function buildMockupPrompt(basePrompt: string, businessName: string, tagLine?: string): string {
  let prompt = basePrompt;
  
  // Analyze the base prompt to provide context-aware instructions
  const lowerPrompt = basePrompt.toLowerCase();
  
  // Add specific logo placement instructions based on product type
  prompt += ` Create a professional product mockup with the following requirements:`;
  
  // CRITICAL: Ensure the exact uploaded logo is used and detected
  prompt += ` CRITICAL INSTRUCTIONS: The uploaded logo image MUST be clearly visible and recognizable in the final mockup.`;
  prompt += ` Do NOT create, generate, or replace the logo - use ONLY the provided logo image.`;
  prompt += ` The logo should appear exactly as uploaded with identical colors, design, and proportions.`;
  prompt += ` Make the logo the main focal point of the mockup.`;
  
  // Product-specific logo placement with clear detection instructions
  if (lowerPrompt.includes('t-shirt') || lowerPrompt.includes('shirt') || lowerPrompt.includes('clothing')) {
    prompt += ` Place the uploaded logo prominently on the front center of the garment. The logo must be clearly visible, properly sized, and look professionally printed.`;
  } else if (lowerPrompt.includes('bottle') || lowerPrompt.includes('drink') || lowerPrompt.includes('beverage')) {
    prompt += ` Position the uploaded logo centrally on the bottle label area. The logo must be clearly visible, properly scaled, and maintain its original appearance.`;
  } else if (lowerPrompt.includes('box') || lowerPrompt.includes('package') || lowerPrompt.includes('packaging')) {
    prompt += ` Display the uploaded logo prominently on the front face of the package. The logo should be the main visual element and clearly recognizable.`;
  } else if (lowerPrompt.includes('card') || lowerPrompt.includes('business card')) {
    prompt += ` Place the uploaded logo in the top-left or center-top area. The logo must be clearly visible and maintain its design quality.`;
  } else if (lowerPrompt.includes('mug') || lowerPrompt.includes('cup')) {
    prompt += ` Position the uploaded logo centrally on the side of the mug. The logo must be clearly visible when the mug is held and properly scaled.`;
  } else {
    // Generic but detailed logo placement
    prompt += ` Position the uploaded logo prominently and centrally on the product surface. The logo must be clearly visible and the main focal point.`;
  }
  
  // Universal logo requirements with emphasis on detection
  prompt += ` The logo must be clearly visible and readable at all viewing distances.`;
  prompt += ` Scale the logo appropriately - not too small to be invisible, not too large to be overwhelming.`;
  prompt += ` Integrate the logo naturally with proper lighting, shadows, and surface textures.`;
  prompt += ` Ensure the logo appears as if it was professionally applied using high-quality methods.`;
  prompt += ` The logo should be the most prominent element in the mockup.`;
  
  if (businessName) {
    prompt += ` Include the business name "${businessName}" prominently positioned near the logo, ensuring it's clearly readable and complements the logo.`;
  }
  
  if (tagLine) {
    prompt += ` Include the tagline "${tagLine}" in a readable font size, positioned to complement the logo and business name without cluttering the design.`;
  }
  
  prompt += ` FINAL REQUIREMENT: The uploaded logo must be clearly visible, recognizable, and the main focal point of the mockup.`;
  prompt += ` This should look like a professional product mockup with perfect logo integration suitable for commercial use.`;
  
  return prompt;
}
