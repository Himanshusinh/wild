import { NextRequest, NextResponse } from 'next/server';
import { uploadGeneratedImages } from '@/lib/imageUpload';

function getEnv(name: string, fallback?: string) {
  const val = process.env[name];
  if (!val && !fallback) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return val || fallback!;
}

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    // Debug environment variables
    console.log('🔍 Environment variables check:');
    console.log('LOCAL_MOCKUP_GENERATION_URL:', process.env.LOCAL_MOCKUP_GENERATION_URL);
    
    const localBaseUrl = getEnv('LOCAL_MOCKUP_GENERATION_URL', 'http://localhost:8000');

    console.log('🚀 Mockup generation started');
    console.log('📍 Local API URL:', localBaseUrl);

    // Expect multipart/form-data
    const formData = await req.formData();
    const logoFile = formData.get('logo_file') as File | null;
    const businessName = (formData.get('business_name') as string) || '';
    const businessTagline = (formData.get('business_tagline') as string) || '';

    if (!logoFile) {
      return NextResponse.json({ error: 'logo_file is required' }, { status: 400 });
    }

    console.log('📁 Logo file received:', logoFile.name, 'Size:', logoFile.size);
    console.log('🏢 Business name:', businessName);
    console.log('💬 Business tagline:', businessTagline);

    const forwardForm = new FormData();
    forwardForm.append('logo_file', logoFile, (logoFile as any).name || 'logo.png');
    forwardForm.append('business_name', businessName);
    forwardForm.append('business_tagline', businessTagline);

    const headers: Record<string, string> = {};
    // if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

    console.log('🔄 Forwarding request to local API...');
    const response = await fetch(`${localBaseUrl}/generate-mockup`, {
      method: 'POST',
      // @ts-ignore - Node fetch supports FormData
      body: forwardForm,
      headers,
    });

    if (!response.ok) {
      throw new Error(`Local API responded with status: ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    console.log('📡 Response content-type:', contentType);

    // Create a ReadableStream to forward SSE to the client
    const stream = new ReadableStream({
      async start(controller) {
        try {
          console.log('🚀 Stream controller started');
          
          if (contentType.includes('text/event-stream')) {
            console.log('🔄 Processing SSE stream from local API...');
            
            if (!response.body) {
              throw new Error('Empty SSE body from local API');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';
            let imageCount = 0;

            console.log('📖 Starting to read SSE stream...');

            while (true) {
              const { value, done } = await reader.read();
              if (done) {
                console.log('📖 SSE stream reading completed');
                break;
              }

              const chunk = decoder.decode(value, { stream: true });
              console.log('📦 Received chunk:', chunk.length, 'bytes');
              
              buffer += chunk;
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              console.log('📝 Processing lines:', lines.length, 'lines, buffer remaining:', buffer.length);

              for (const raw of lines) {
                const line = raw.trim();
                if (!line.startsWith('data:')) {
                  console.log('⚠️ Skipping non-data line:', line);
                  continue;
                }

                const jsonPart = line.replace(/^data:\s*/, '');
                console.log('🔍 Processing JSON part:', jsonPart);
                
                try {
                  const payload = JSON.parse(jsonPart);
                  console.log('📡 SSE payload parsed:', payload);

                  if (payload && payload.image_url) {
                    const url = payload.image_url as string;
                    const fullUrl = url.startsWith('http') ? url : `${localBaseUrl}${url}`;
                    imageCount++;

                    console.log(`🖼️ Image ${imageCount}: ${fullUrl}`);

                    // Send progress update to client
                    const progressData = {
                      type: 'progress',
                      imageUrl: fullUrl,
                      item: payload.item || `Item ${imageCount}`,
                      count: imageCount,
                      total: payload.total || 'unknown'
                    };

                    console.log('📤 Sending progress to client:', progressData);
                    const progressMessage = `data: ${JSON.stringify(progressData)}\n\n`;
                    controller.enqueue(new TextEncoder().encode(progressMessage));
                    console.log('✅ Progress message enqueued');
                  }
                } catch (e) {
                  console.log('⚠️ Failed to parse SSE line:', jsonPart, 'Error:', e);
                }
              }
            }

            // Send completion signal
            console.log('✅ SSE stream completed, sending final signal');
            const completionMessage = `data: ${JSON.stringify({ type: 'complete', count: imageCount })}\n\n`;
            controller.enqueue(new TextEncoder().encode(completionMessage));
            console.log('✅ Completion message enqueued');

          } else {
            console.log('📄 Processing JSON response (non-SSE)...');
            const data = await response.json();
            console.log('📄 JSON response data:', data);
            
            const imageUrls = (data.image_urls || data.images || [])
              .map((u: string) => (u.startsWith('http') ? u : `${localBaseUrl}${u}`));
            
            console.log('🖼️ Image URLs from JSON:', imageUrls);

            // Send all images as progress updates
            imageUrls.forEach((url: string, index: number) => {
              const progressData = {
                type: 'progress',
                imageUrl: url,
                item: `Item ${index + 1}`,
                count: index + 1,
                total: imageUrls.length
              };
              console.log('📤 Sending JSON progress to client:', progressData);
              controller.enqueue(
                new TextEncoder().encode(`data: ${JSON.stringify(progressData)}\n\n`)
              );
            });

            // Send completion signal
            console.log('✅ JSON processing completed, sending final signal');
            controller.enqueue(
              new TextEncoder().encode(`data: ${JSON.stringify({ type: 'complete', count: imageUrls.length })}\n\n`)
            );
          }
        } catch (error) {
          console.error('❌ Error in stream processing:', error);
          let errorMessage = 'Unknown error';
          if (error instanceof Error) {
            errorMessage = error.message;
          } else if (typeof error === 'object' && error !== null && 'message' in error) {
            errorMessage = (error as any).message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }
          
          const errorMessageData = `data: ${JSON.stringify({ type: 'error', error: errorMessage })}\n\n`;
          console.log('📤 Sending error to client:', errorMessageData);
          controller.enqueue(new TextEncoder().encode(errorMessageData));
        } finally {
          console.log('🔚 Stream controller closing');
          controller.close();
        }
      }
    });

    // Return streaming response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error: any) {
    console.error('❌ Local mockup generation failed:', error);
    return NextResponse.json({ 
      error: error?.message || 'Local mockup generation failed',
      details: error?.stack || 'No stack trace'
    }, { status: 500 });
  }
}


