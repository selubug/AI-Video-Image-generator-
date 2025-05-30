import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkAndResetDailyLimit, decrementDailyLimit } from '@/lib/daily-limit';
import { uploadImageToTempStorage } from '@/lib/image-upload';
import { generateVideo } from '@/utils/piapi';

// Configuration constants
const PIAPI_BASE_URL = 'https://api.piapi.ai/api/v1';

// Check for Runway API key
const runwayApiKey = process.env.RUNWAY_ML_API_SECRET;
if (!runwayApiKey) {
  console.error('Runway API key is missing. Please check your .env.local file.');
}

interface VideoOptions {
  duration?: 5 | 10;
  aspect_ratio?: '16:9' | '9:16' | '1:1';
  fastMode?: boolean;
  imageMode?: 'concat' | 'replace';
  directorMode?: boolean;
  liveMode?: boolean;
  subjectMode?: boolean;
  expandPrompt?: boolean;
}

interface VideoGenerationRequest {
  prompt: string;
  model: string;
  negativePrompt?: string;
  userId: string;
  options?: VideoOptions;
  image?: File;
}

interface RunwayTaskOutput {
  video_url: string;
  thumbnail_url: string;
  duration: number;
  width: number;
  height: number;
  fps: number;
}

interface RunwayTaskResponse {
  id: string;
  status: 'SUCCEEDED' | 'RUNNING' | 'PENDING' | 'CANCELLED' | 'THROTTLED' | 'FAILED';
  output?: RunwayTaskOutput;
  error?: string;
}

// Helper function to safely parse JSON
function safeJSONParse<T>(str: string | null | undefined, defaultValue: T): T {
  if (!str) return defaultValue;
  try {
    return JSON.parse(str) as T;
  } catch (error) {
    console.error('Failed to parse JSON:', error);
    return defaultValue;
  }
}

// Helper function to validate form data
function validateFormData(formData: FormData): { 
  isValid: boolean; 
  data?: VideoGenerationRequest; 
  error?: string 
} {
    const prompt = formData.get('prompt') as string;
    const model = formData.get('model') as string;
    const negativePrompt = formData.get('negativePrompt') as string;
    const userId = formData.get('userId') as string;
    const image = formData.get('image') as File;
  const optionsRaw = formData.get('options');
  const options = safeJSONParse<VideoOptions>(optionsRaw as string | null, {});

  console.log('Validating form data:', {
    prompt: prompt ? 'present' : 'missing',
    model: model ? 'present' : 'missing',
    userId: userId ? 'present' : 'missing',
    image: image ? 'present' : 'missing',
    options
  });

    if (!prompt || !model || !userId) {
    return {
      isValid: false,
      error: 'Missing required fields: prompt, model, and userId are required'
    };
  }

  return {
    isValid: true,
    data: {
      prompt,
      model,
      negativePrompt,
      userId,
      options,
      image
    }
  };
}

// Helper function to poll Runway task status
async function pollRunwayTask(taskId: string, isTurbo = false): Promise<string> {
  const base = isTurbo ? 'runway_turbo' : 'runway';
  const url = `https://api.302.ai/${base}/task/${taskId}/fetch`;
  
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
    attempts++;

    console.log(`Polling attempt ${attempts}/${maxAttempts} for task ${taskId}`);

    try {
      const statusResponse = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${process.env.API_302_KEY}`
        }
      });

      if (!statusResponse.ok) {
        const errorText = await statusResponse.text();
        console.error('Error checking task status:', errorText);
        continue;
      }

      const statusData = await statusResponse.json();
      console.log('Status response:', statusData);

      const task = statusData.task;
      const artifact = task?.artifacts?.[0];

      if (task?.status === 'SUCCEEDED' && artifact?.url) {
        return artifact.url;
      }

      if (task?.status === 'FAILED') {
        throw new Error(`Task failed: ${task.error || 'Runway task failed'}`);
      }
    } catch (error) {
      console.error('Error during status check:', error);
      continue;
    }
  }

  throw new Error('Video generation timed out or failed');
}

export async function POST(request: Request) {
  console.log('=== Starting Video Generation Request ===');
  
  try {
    // Check for PIAPI API key first
    if (!process.env.PIAPI_API_KEY) {
      console.error('PIAPI API key is missing');
      return NextResponse.json(
        { error: 'Video generation service is not configured' },
        { status: 500 }
      );
    }

    // Safely parse form data
    let formData: FormData;
    try {
      formData = await request.formData();
      console.log('Form data parsed successfully');
    } catch (error) {
      console.error('Failed to parse form data:', error);
      return NextResponse.json(
        { error: 'Invalid form data' },
        { status: 400 }
      );
    }

    // Validate form data
    const validation = validateFormData(formData);
    if (!validation.isValid || !validation.data) {
      console.error('Form data validation failed:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    const { prompt, model, negativePrompt, userId, options, image } = validation.data;

    // Check daily limit
    console.log('Checking daily limit for user:', userId);
    const remaining = await checkAndResetDailyLimit(userId);
    if (remaining <= 0) {
      console.log('Daily limit reached for user:', userId);
      return NextResponse.json(
        { error: 'Daily generation limit reached' },
        { status: 429 }
      );
    }

    // Decrement daily limit
    await decrementDailyLimit(userId);
    console.log('Daily limit decremented for user:', userId);

    // Handle different models
    switch (model) {
      case 'kling': {
        console.log('=== Starting Kling Video Generation ===');
        
        // If there's a reference image, upload it to a temporary URL first
        let imageUrl: string | undefined = undefined;
        if (image) {
          console.log('Processing reference image...');
          try {
            // Upload the image to temporary storage
            console.log('Uploading image to temporary storage...');
            const uploadedUrl = await uploadImageToTempStorage(image);
            if (!uploadedUrl) {
              throw new Error('Failed to upload image to temporary storage');
            }
            imageUrl = uploadedUrl;
            console.log('Image uploaded successfully:', imageUrl);

            // Verify the image URL is accessible
            console.log('Verifying image URL accessibility...');
            const response = await fetch(imageUrl);
            if (!response.ok) {
              throw new Error(`Uploaded image is not accessible: ${response.status} ${response.statusText}`);
            }
            console.log('Image URL verified as accessible');
          } catch (error) {
            console.error('Failed to process image:', error);
            if (error instanceof Error) {
              console.error('Error stack:', error.stack);
            }
        return NextResponse.json(
              { error: 'Failed to process reference image: ' + (error as Error).message },
              { status: 500 }
            );
          }
        }

        console.log('Calling Kling API with parameters:', {
        prompt,
        negativePrompt,
          duration: options?.duration || 5,
          aspect_ratio: options?.aspect_ratio || '16:9',
          has_image: !!imageUrl,
          image_url: imageUrl ? 'present' : 'not present',
          version: imageUrl ? '2.0' : '1.0'
        });

        try {
          const klingResponse = await generateVideo(prompt, 'kling', {
            negative_prompt: negativePrompt,
            duration: (options?.duration || 5) as 5 | 10,
            aspect_ratio: (options?.aspect_ratio || '16:9') as '16:9' | '9:16' | '1:1',
            image_url: imageUrl,
            version: imageUrl ? '2.0' : '1.0'
          });

          if (!klingResponse.success) {
            console.error('Kling generation failed:', klingResponse.error);
            return NextResponse.json(
              { 
                error: klingResponse.error || 'Failed to generate video',
                details: 'Kling API returned an error response'
              },
              { status: 500 }
            );
          }

          console.log('Kling generation successful:', klingResponse.data);
          return NextResponse.json({
            ...klingResponse.data,
        model: 'kling',
            has_image: !!imageUrl
          });
        } catch (error) {
          console.error('Unexpected error during Kling generation:', error);
          if (error instanceof Error) {
            console.error('Error stack:', error.stack);
          }
          return NextResponse.json(
            { 
              error: 'Failed to generate video with Kling',
              details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
          );
        }
      }

      case 'hunyuan': {
        if (!process.env.PIAPI_API_KEY) {
          console.error('PIAPI API key is missing');
          return NextResponse.json(
            { error: 'PIAPI API key is missing' },
            { status: 500 }
          );
        }

        try {
          console.log('Calling Hunyuan API with prompt:', prompt);
          
          // Get aspect ratio from form data or default to 16:9
          const aspectRatio = formData.get('aspect_ratio') as string || '16:9';
          
          // Make the initial request to start video generation
          const requestBody = {
            model: "Qubico/hunyuan",
            task_type: "fast-txt2video", // Using fast mode for quicker generation
        input: {
          prompt: prompt,
              aspect_ratio: aspectRatio
            }
          };
          console.log('Request body:', requestBody);

          const response = await fetch('https://api.piapi.ai/api/v1/task', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-KEY': process.env.PIAPI_API_KEY
            },
            body: JSON.stringify(requestBody)
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Hunyuan API error:', errorText);
            throw new Error(`Hunyuan API error: ${errorText}`);
          }

          const data = await response.json();
          console.log('[PIAPI-Hunyuan] raw response:', data);

          if (data.code !== 200 || !data.data?.task_id) {
            throw new Error('No task ID returned from Hunyuan API');
          }

          // Poll for the result
          let attempts = 0;
          const maxAttempts = 60; // 10 minutes with 10-second intervals
          let result;

          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
            attempts++;

            console.log(`Polling attempt ${attempts}/${maxAttempts} for task ${data.data.task_id}`);

            try {
              const statusResponse = await fetch(`https://api.piapi.ai/api/v1/task/${data.data.task_id}`, {
                headers: {
                  'Content-Type': 'application/json',
                  'X-API-KEY': process.env.PIAPI_API_KEY
                }
              });

              if (!statusResponse.ok) {
                const errorText = await statusResponse.text();
                console.error('Error checking task status:', errorText);
                continue;
              }

              const statusData = await statusResponse.json();
              console.log('Status response:', statusData);

              // Check for completed status and video URL
              if (statusData.code === 200 && 
                  statusData.data?.status === 'completed' && 
                  statusData.data?.output?.video_url) {
                result = statusData.data;
                break;
              }

              if (statusData.data?.status === 'failed') {
                throw new Error(`Task failed: ${statusData.data.error?.message || 'Unknown error'}`);
              }
            } catch (error) {
              console.error('Error during status check:', error);
              continue;
            }
          }

          if (!result?.output?.video_url) {
            throw new Error('Video generation timed out or failed');
          }

          const videoUrl = result.output.video_url;

          // Store metadata in database
          const { error: dbError } = await supabase
            .from('generated_images')
            .insert({
              id: crypto.randomUUID(),
              user_id: userId,
          prompt: prompt,
              negative_prompt: negativePrompt || null,
              model: 'hunyuan',
              image_url: videoUrl,
              created_at: new Date().toISOString(),
              type: 'video',
              duration: 5, // Default duration for fast mode
              resolution: '480x848', // Default resolution for fast mode
              fps: 85 // Default FPS for fast mode
            });

          if (dbError) {
            console.error('Error storing in database:', dbError);
            throw new Error(`Failed to store video metadata: ${dbError.message}`);
          }

          console.log('Successfully generated and stored video with Hunyuan');
          return NextResponse.json({
            status: 'completed',
            video_url: videoUrl,
            metadata: {
              model: 'hunyuan-fast',
              task_id: data.data.task_id,
              duration: 5,
              resolution: '480x848',
              fps: 85
            }
          });
        } catch (error) {
          console.error('Hunyuan API error:', error);
          return NextResponse.json(
            { error: 'Failed to generate video with Hunyuan: ' + (error as Error).message },
            { status: 500 }
          );
        }
      }

      case 'heygen': {
        console.log('Starting HeyGen video generation');
        const heygenResponse = await generateVideo(prompt, 'heygen', {
          negative_prompt: negativePrompt,
          duration: (options?.duration || 5) as 5 | 10,
          aspect_ratio: (options?.aspect_ratio || '16:9') as '16:9' | '9:16' | '1:1'
        });

        if (!heygenResponse.success) {
          console.error('HeyGen generation failed:', heygenResponse.error);
      return NextResponse.json(
            { error: heygenResponse.error || 'Failed to generate video' },
            { status: 500 }
          );
        }

        return NextResponse.json(heygenResponse.data);
      }

      case 'veo2': {
        if (!process.env.API_302_KEY) {
          console.error('302 API key is missing');
          return NextResponse.json(
            { error: '302 API key is missing' },
            { status: 500 }
          );
        }

        try {
          console.log('Calling Google Veo2 API with prompt:', prompt);
          
          // Get aspect ratio and duration from form data
          const aspectRatio = formData.get('aspectRatio') as string || '16:9';
          const duration = formData.get('duration') as string || '5s';
          
          // Validate aspect ratio
          const validAspectRatios = ['16:9', '9:16'];
          if (!validAspectRatios.includes(aspectRatio)) {
            return NextResponse.json(
              { error: 'Invalid aspect ratio. Must be one of: 16:9, 9:16' },
        { status: 400 }
      );
    }

          // Validate duration
          const validDurations = ['5s', '6s', '7s', '8s'];
          if (!validDurations.includes(duration)) {
      return NextResponse.json(
              { error: 'Invalid duration. Must be one of: 5s, 6s, 7s, 8s' },
        { status: 400 }
      );
    }

          // Make the request
          const requestBody = {
            prompt: prompt,
            aspect_ratio: aspectRatio,
            duration: duration
          };
          console.log('Request body:', requestBody);

          const response = await fetch('https://api.302.ai/302/submit/veo2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${process.env.API_302_KEY}`
            },
            body: JSON.stringify(requestBody)
          });

          console.log('Response status:', response.status);
          console.log('Response status text:', response.statusText);
          
          const data = await response.json();
          console.log('[302-Veo2] raw response:', data);

          if (data.error) {
            throw new Error(`302/Veo2 error: ${data.error}`);
          }

          if (!data.request_id) {
            throw new Error('No request ID returned from Veo2 API');
          }

          // Poll for the result
    let attempts = 0;
          const maxAttempts = 60; // 10 minutes with 10-second intervals
          let result;

          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
            attempts++;

            console.log(`Polling attempt ${attempts}/${maxAttempts} for request ${data.request_id}`);

            try {
              const statusResponse = await fetch(`https://api.302.ai/302/submit/veo2?request_id=${data.request_id}`, {
        headers: {
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${process.env.API_302_KEY}`
                }
      });

      if (!statusResponse.ok) {
                const errorText = await statusResponse.text();
                console.error('Error checking task status:', errorText);
                
                try {
                  const errorData = JSON.parse(errorText);
                  if (errorData.error?.err_code === -10006) {
                    throw new Error('API quota limit reached. Please try again later or contact support.');
                  }
                } catch (parseError) {
                  // If we can't parse the error JSON, continue with the original error
                  continue;
                }
                continue;
      }

      const statusData = await statusResponse.json();
              console.log('Status response:', statusData);

              if (statusData.status === 'COMPLETED' && statusData.video?.url) {
                result = statusData;
                break;
              }

              if (statusData.status === 'FAILED') {
                throw new Error(`Task failed: ${statusData.error || 'Unknown error'}`);
              }
            } catch (error) {
              console.error('Error during status check:', error);
              continue;
            }
          }

          if (!result?.video?.url) {
            throw new Error('Video generation timed out or failed');
          }

          // Download the video
          console.log('Downloading video from:', result.video.url);
          const videoResponse = await fetch(result.video.url);
          if (!videoResponse.ok) {
            throw new Error('Failed to download generated video');
          }

          const videoBuffer = await videoResponse.arrayBuffer();
          const videoBlob = new Blob([videoBuffer], { type: 'video/mp4' });
          const videoFile = new File([videoBlob], `veo2-${Date.now()}.mp4`, { type: 'video/mp4' });

          // Upload using the same method as other models
          const videoUrl = await uploadImageToTempStorage(videoFile);
          if (!videoUrl) {
            throw new Error('Failed to upload video to storage');
          }

          // Store metadata in database
          const { error: dbError } = await supabase
            .from('generations')
            .insert({
              user_id: userId,
              prompt: prompt,
              model: 'veo2',
              type: 'video',
              url: videoUrl,
              metadata: {
                aspect_ratio: result.video.aspect_ratio,
                duration: result.video.duration,
                file_size: result.video.file_size,
                content_type: result.video.content_type,
                seed: result.seed
              }
            });

          if (dbError) {
            console.error('Error storing in database:', dbError);
            throw new Error('Failed to store video metadata');
          }
          
          console.log('Successfully generated and stored video with Google Veo2');
          return NextResponse.json({
            status: 'completed',
            video_url: videoUrl,
            metadata: {
              aspect_ratio: result.video.aspect_ratio,
              duration: result.video.duration,
              file_size: result.video.file_size,
              content_type: result.video.content_type,
              seed: result.seed
            }
          });
        } catch (error) {
          console.error('Google Veo2 API error:', error);
          return NextResponse.json(
            { error: 'Failed to generate video with Google Veo2: ' + (error as Error).message },
            { status: 500 }
          );
        }
      }

      case 'minimax': {
        if (!process.env.API_302_KEY) {
          console.error('302 API key is missing');
          return NextResponse.json(
            { error: '302 API key is missing' },
            { status: 500 }
          );
        }

        try {
          console.log('Calling Minimax API with prompt:', prompt);
          
          // Make the initial request to start video generation
          const requestBody = {
            model: 'T2V-01', // Using the standard model
            prompt: prompt,
            prompt_optimizer: true // Enable automatic prompt optimization
          };
          console.log('Request body:', requestBody);

          const response = await fetch('https://api.302.ai/minimaxi/v1/video_generation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json',
              'Authorization': `Bearer ${process.env.API_302_KEY}`
            },
            body: JSON.stringify(requestBody)
          });

          console.log('Response status:', response.status);
          console.log('Response status text:', response.statusText);
          
          const data = await response.json();
          console.log('[302-Minimax] raw response:', data);

          if (data.base_resp?.status_code !== 0) {
            throw new Error(`Minimax API error: ${data.base_resp?.status_msg || 'Unknown error'}`);
          }

          if (!data.task_id) {
            throw new Error('No task ID returned from Minimax API');
          }

          // Poll for the result
          let attempts = 0;
          const maxAttempts = 60; // 10 minutes with 10-second intervals
          let result;

          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
      attempts++;

            console.log(`Polling attempt ${attempts}/${maxAttempts} for task ${data.task_id}`);

            try {
              const statusResponse = await fetch(`https://api.302.ai/minimaxi/v1/query/video_generation?task_id=${data.task_id}`, {
                headers: {
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${process.env.API_302_KEY}`
                }
              });

              if (!statusResponse.ok) {
                const errorText = await statusResponse.text();
                console.error('Error checking task status:', errorText);
                
                try {
                  const errorData = JSON.parse(errorText);
                  if (errorData.error?.err_code === -10006) {
                    throw new Error('API quota limit reached. Please try again later or contact support.');
                  }
                } catch (parseError) {
                  // If we can't parse the error JSON, continue with the original error
                  continue;
                }
                continue;
              }

              const statusData = await statusResponse.json();
              console.log('Status response:', statusData);

              // Check for quota limit in the response
              if (statusData.error?.err_code === -10006) {
                throw new Error('API quota limit reached. Please try again later or contact support.');
              }

              // Check for successful completion using base_resp.status_code
              if (statusData.base_resp?.status_code === 0 && statusData.file_id) {
                console.log('Video generation completed successfully, retrieving video...');
                
                // Get the video file
                const fileResponse = await fetch(`https://api.302.ai/minimaxi/v1/files/retrieve?file_id=${statusData.file_id}`, {
                  headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${process.env.API_302_KEY}`
                  }
                });

                if (!fileResponse.ok) {
                  throw new Error('Failed to retrieve video file');
                }

                const fileData = await fileResponse.json();
                console.log('File data response:', fileData);

                if (fileData.base_resp?.status_code === 0 && fileData.file?.download_url) {
                  // Get the video URL directly from the API response
                  const videoUrl = fileData.file.download_url;
                  console.log('Video URL from API:', videoUrl);

    // Generate a proper UUID for the video ID
    const videoId = crypto.randomUUID();

                  // Store metadata in database
    const { error: dbError } = await supabase
      .from('generated_images')
      .insert({
        id: videoId,
        user_id: userId,
        prompt: prompt,
                      negative_prompt: negativePrompt || null,
                      model: 'minimax',
        image_url: videoUrl,
        created_at: new Date().toISOString(),
        type: 'video',
                      duration: 5,
                      resolution: `${statusData.video_width}x${statusData.video_height}`,
                      fps: 30
      });

    if (dbError) {
                    console.error('Error storing in database:', dbError);
                    console.error('Database insert data:', {
                      id: videoId,
                      user_id: userId,
                      prompt: prompt,
                      negative_prompt: negativePrompt || null,
                      model: 'minimax',
                      image_url: videoUrl,
                      created_at: new Date().toISOString(),
                      type: 'video',
                      duration: 5,
                      resolution: `${statusData.video_width}x${statusData.video_height}`,
                      fps: 30
                    });
                    throw new Error(`Failed to store video metadata: ${dbError.message}`);
                  }
                  
                  console.log('Successfully generated and stored video with Minimax');
                  return NextResponse.json({
                    status: 'completed',
                    video_url: videoUrl,
                    metadata: {
                      model: 'T2V-01',
                      task_id: data.task_id,
                      file_id: statusData.file_id,
                      video_width: statusData.video_width,
                      video_height: statusData.video_height
                    }
                  });
                }
              }

              if (statusData.base_resp?.status_code === 1027) {
                throw new Error('Generated video contains sensitive content');
              }
            } catch (error) {
              console.error('Error during status check:', error);
              continue;
            }
          }

          throw new Error('Video generation timed out or failed');
        } catch (error) {
          console.error('Minimax API error:', error);
          return NextResponse.json(
            { error: 'Failed to generate video with Minimax: ' + (error as Error).message },
            { status: 500 }
          );
        }
      }

      case 'pika': {
        if (!process.env.API_302_KEY) {
          console.error('302 API key is missing');
          return NextResponse.json(
            { error: '302 API key is missing' },
            { status: 500 }
          );
        }

        try {
          console.log('Calling Pika API');
          
          // Check if we have an image for image-to-video generation
          const inputImage = formData.get('image') as File;
          
          if (inputImage) {
            console.log('Processing image-to-video generation');
            
            // Create form data for the API request
            const apiFormData = new FormData();
            apiFormData.append('image', inputImage);
            if (prompt) {
              apiFormData.append('promptText', prompt);
            }
            if (negativePrompt) {
              apiFormData.append('negativePrompt', negativePrompt);
            }
            // Use cheapest option: 720p-5s
            apiFormData.append('resolution', '720p');
            apiFormData.append('duration', '5');

            console.log('Making request to Pika image-to-video API...');
            const response = await fetch('https://api.302.ai/pika/generate/2.2/i2v', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.API_302_KEY}`
              },
              body: apiFormData
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('Pika API error:', errorText);
              throw new Error(`Pika API error: ${errorText}`);
            }

            const data = await response.json();
            console.log('[302-Pika] raw response:', data);

            if (!data.video_id) {
              throw new Error('No video ID returned from Pika API');
            }

            // Poll for the result
            let attempts = 0;
            const maxAttempts = 60; // 10 minutes with 10-second intervals
            let result;

            while (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
              attempts++;

              console.log(`Polling attempt ${attempts}/${maxAttempts} for video ${data.video_id}`);

              try {
                const statusResponse = await fetch(`https://api.302.ai/pika/task/${data.video_id}/fetch`, {
                  headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${process.env.API_302_KEY}`
                  }
                });

                if (!statusResponse.ok) {
                  const errorText = await statusResponse.text();
                  console.error('Error checking task status:', errorText);
                  continue;
                }

                const statusData = await statusResponse.json();
                console.log('Status response:', statusData);

                if (statusData.status === 'finished' && statusData.url) {
                  result = statusData;
                  break;
                }

                if (statusData.status === 'failed') {
                  throw new Error(`Task failed: ${statusData.error || 'Unknown error'}`);
                }
              } catch (error) {
                console.error('Error during status check:', error);
                continue;
              }
            }

            if (!result?.url) {
              throw new Error('Video generation timed out or failed');
            }

            // Download the video
            console.log('Downloading video from:', result.url);
            const videoResponse = await fetch(result.url);
            if (!videoResponse.ok) {
              throw new Error('Failed to download generated video');
            }

            const videoBuffer = await videoResponse.arrayBuffer();
            const base64Video = Buffer.from(videoBuffer).toString('base64');
            const videoUrl = `data:video/mp4;base64,${base64Video}`;

            // Store metadata in database
            const { error: dbError } = await supabase
              .from('generated_images')
              .insert({
                id: crypto.randomUUID(),
                user_id: userId,
                prompt: prompt || 'Image-to-video generation',
                negative_prompt: negativePrompt || null,
                model: 'pika',
                image_url: videoUrl,
                created_at: new Date().toISOString(),
                type: 'video',
                duration: 5,
                resolution: '1280x720',
                fps: 30
              });

            if (dbError) {
              console.error('Error storing in database:', dbError);
              throw new Error(`Failed to store video metadata: ${dbError.message}`);
            }

            console.log('Successfully generated and stored video with Pika image-to-video');
            return NextResponse.json({
              status: 'completed',
              video_url: videoUrl,
              metadata: {
                model: 'pika-i2v',
                video_id: data.video_id,
                resolution: '720p',
                duration: 5
              }
            });
          } else {
            // Existing text-to-video code remains unchanged
            console.log('Calling Pika text-to-video API with prompt:', prompt);
            
            const requestBody = {
              promptText: prompt,
              negativePrompt: negativePrompt || "blurry, low quality",
              seed: Math.floor(Math.random() * 1000000) // Random seed
            };
            console.log('Request body:', requestBody);

            const response = await fetch('https://api.302.ai/pika/generate/turbo/t2v', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.API_302_KEY}`
              },
              body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('Pika API error:', errorText);
              throw new Error(`Pika API error: ${errorText}`);
            }

            const data = await response.json();
            console.log('[302-Pika] raw response:', data);

            if (!data.video_id) {
              throw new Error('No video ID returned from Pika API');
            }

            // Poll for the result
            let attempts = 0;
            const maxAttempts = 60; // 10 minutes with 10-second intervals
            let result;

            while (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
              attempts++;

              console.log(`Polling attempt ${attempts}/${maxAttempts} for video ${data.video_id}`);

              try {
                const statusResponse = await fetch(`https://api.302.ai/pika/task/${data.video_id}/fetch`, {
                  headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${process.env.API_302_KEY}`
                  }
                });

                if (!statusResponse.ok) {
                  const errorText = await statusResponse.text();
                  console.error('Error checking task status:', errorText);
                  continue;
                }

                const statusData = await statusResponse.json();
                console.log('Status response:', statusData);

                if (statusData.status === 'finished' && statusData.url) {
                  result = statusData;
                  break;
                }

                if (statusData.status === 'failed') {
                  throw new Error(`Task failed: ${statusData.error || 'Unknown error'}`);
                }
              } catch (error) {
                console.error('Error during status check:', error);
                continue;
              }
            }

            if (!result?.url) {
              throw new Error('Video generation timed out or failed');
            }

            // Download the video
            console.log('Downloading video from:', result.url);
            const videoResponse = await fetch(result.url);
            if (!videoResponse.ok) {
              throw new Error('Failed to download generated video');
            }

            const videoBuffer = await videoResponse.arrayBuffer();
            const base64Video = Buffer.from(videoBuffer).toString('base64');
            const videoUrl = `data:video/mp4;base64,${base64Video}`;

            // Store metadata in database
            const { error: dbError } = await supabase
              .from('generated_images')
              .insert({
                id: crypto.randomUUID(),
                user_id: userId,
                prompt: prompt,
                negative_prompt: negativePrompt || null,
                model: 'pika',
                image_url: videoUrl,
                created_at: new Date().toISOString(),
                type: 'video',
                duration: 5,
                resolution: '1024x576',
                fps: 30
              });

            if (dbError) {
              console.error('Error storing in database:', dbError);
              throw new Error(`Failed to store video metadata: ${dbError.message}`);
            }

            console.log('Successfully generated and stored video with Pika');
            return NextResponse.json({
              status: 'completed',
              video_url: videoUrl,
              metadata: {
                model: 'turbo',
                video_id: data.video_id,
                seed: requestBody.seed
              }
            });
          }
        } catch (error) {
          console.error('Pika API error:', error);
          return NextResponse.json(
            { error: 'Failed to generate video with Pika: ' + (error as Error).message },
            { status: 500 }
          );
        }
      }

      case 'stability': {
        if (!process.env.API_302_KEY) {
          console.error('302 API key is missing');
          return NextResponse.json(
            { error: '302 API key is missing' },
            { status: 500 }
          );
        }

        try {
          console.log('Calling Stability AI API');
          
          // Get input image from form data
          const inputImage = formData.get('input_image') as File;
          if (!inputImage) {
            return NextResponse.json(
              { error: 'Input image is required for Stability AI' },
              { status: 400 }
            );
          }

          // Get motion parameters from form data
          const cfgScale = parseFloat(formData.get('cfg_scale') as string) || 1.8;
          const motionBucketId = parseInt(formData.get('motion_bucket_id') as string) || 127;

          // Resize image to required dimensions (1024x576)
          const imageBuffer = await inputImage.arrayBuffer();
          const sharp = require('sharp');
          const resizedImageBuffer = await sharp(Buffer.from(imageBuffer))
            .resize(1024, 576, {
              fit: 'cover',
              position: 'center'
            })
            .toBuffer();

          // Create form data for the API request
          const apiFormData = new FormData();
          apiFormData.append('image', new Blob([resizedImageBuffer], { type: inputImage.type }));
          apiFormData.append('cfg_scale', cfgScale.toString());
          apiFormData.append('motion_bucket_id', motionBucketId.toString());

          console.log('Making request to Stability AI API...');
          const response = await fetch('https://api.302.ai/sd/v2beta/image-to-video', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.API_302_KEY}`
            },
            body: apiFormData
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Stability AI API error:', errorText);
            throw new Error(`Stability AI API error: ${errorText}`);
          }

          const data = await response.json();
          console.log('[302-Stability] raw response:', data);

          if (!data.id) {
            throw new Error('No generation ID returned from Stability AI API');
          }

          // Poll for the result
          let attempts = 0;
          const maxAttempts = 60; // 10 minutes with 10-second intervals
          let result;

          while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
            attempts++;

            console.log(`Polling attempt ${attempts}/${maxAttempts} for generation ${data.id}`);

            try {
              const statusResponse = await fetch(`https://api.302.ai/sd/v2beta/image-to-video/result/${data.id}`, {
                headers: {
                  'Accept': 'application/json',
                  'Authorization': `Bearer ${process.env.API_302_KEY}`
                }
              });

              if (!statusResponse.ok) {
                const errorText = await statusResponse.text();
                console.error('Error checking generation status:', errorText);
                continue;
              }

              const statusData = await statusResponse.json();
              console.log('Status response:', statusData);

              if (statusData.video) {
                // We got the video data directly, process it
                const videoBuffer = Buffer.from(statusData.video, 'base64');
                const base64Video = videoBuffer.toString('base64');
                const videoUrl = `data:video/mp4;base64,${base64Video}`;

                // Store metadata in database
                const { error: dbError } = await supabase
                  .from('generated_images')
                  .insert({
                    id: crypto.randomUUID(),
                    user_id: userId,
                    prompt: prompt,
                    negative_prompt: negativePrompt || null,
                    model: 'stability',
                    image_url: videoUrl,
                    created_at: new Date().toISOString(),
                    type: 'video',
                    duration: 5,
                    resolution: '1024x576',
                    fps: 30
                  });

                if (dbError) {
                  console.error('Error storing in database:', dbError);
                  console.error('Database insert data:', {
                    id: crypto.randomUUID(),
                    user_id: userId,
                    prompt: prompt,
                    negative_prompt: negativePrompt || null,
                    model: 'stability',
                    image_url: videoUrl,
                    created_at: new Date().toISOString(),
                    type: 'video',
                    duration: 5,
                    resolution: '1024x576',
                    fps: 30
                  });
                  throw new Error(`Failed to store video metadata: ${dbError.message}`);
                }

                console.log('Successfully generated and stored video with Stability AI');
                return NextResponse.json({
                  status: 'completed',
                  video_url: videoUrl,
                  metadata: {
                    model: 'stability',
                    generation_id: data.id,
                    cfg_scale: cfgScale,
                    motion_bucket_id: motionBucketId,
                    seed: statusData.seed
                  }
                });
              }

              if (statusData.status === 'failed') {
                throw new Error(`Video generation failed: ${statusData.error || 'Unknown error'}`);
              }
  } catch (error) {
              console.error('Error during status check:', error);
              continue;
            }
          }

          throw new Error('Video generation timed out or failed');
        } catch (error) {
          console.error('Stability AI API error:', error);
          return NextResponse.json(
            { error: 'Failed to generate video with Stability AI: ' + (error as Error).message },
            { status: 500 }
          );
        }
      }

      case 'runway': {
        if (!process.env.API_302_KEY) {
          console.error('302 API key is missing');
          return NextResponse.json(
            { error: '302 API key is missing' },
            { status: 500 }
          );
        }

        try {
          console.log('Calling Runway Gen4 Turbo API');
          
          // Get duration from form data (default to 5 seconds)
          const duration = parseInt(formData.get('duration') as string) || 5;
          
          // Check if we have an image for image-to-video generation
          const image = formData.get('image') as File;
          
          if (!image) {
            return NextResponse.json(
              { error: 'Image is required for Runway Gen4 Turbo' },
              { status: 400 }
            );
          }

          console.log('Processing image for Runway Gen4 Turbo...');
          
          // Resize image to required dimensions (1280x768 for 16:9)
          console.log('Resizing image to 1280x768...');
          const imageBuffer = await image.arrayBuffer();
          const sharp = require('sharp');
          const resizedImageBuffer = await sharp(Buffer.from(imageBuffer))
            .resize(1280, 768, {
              fit: 'cover',
              position: 'center'
            })
            .toBuffer();
          
          // Create form data for the request
          const apiFormData = new FormData();
          apiFormData.append('init_image', new Blob([resizedImageBuffer], { type: image.type }));
          apiFormData.append('text_prompt', prompt);
          apiFormData.append('seconds', duration.toString());
          apiFormData.append('seed', Math.floor(Math.random() * 1000000).toString());

          console.log('Making request to Runway Gen4 Turbo API...');
          const response = await fetch('https://api.302.ai/runway_gen4_turbo/submit', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.API_302_KEY}`
            },
            body: apiFormData
          });

          // Log the full response for debugging
          const responseText = await response.text();
          console.log('Full API Response:', responseText);

          if (!response.ok) {
            console.error('API request failed:', {
              status: response.status,
              statusText: response.statusText,
              responseBody: responseText
            });
            throw new Error(`API request failed with status ${response.status}: ${responseText}`);
          }

          // Parse the response if it was successful
          const data = JSON.parse(responseText);
          console.log('[302-Runway-Gen4-Turbo] parsed response:', data);

          if (!data.task?.id) {
            throw new Error('No task ID returned from Runway Gen4 Turbo API');
          }

          // Poll for the result using the helper function
          const videoUrl = await pollRunwayTask(data.task.id, true);

          // Store metadata in database
          const dbData = {
            id: crypto.randomUUID(),
            user_id: userId,
            prompt: prompt,
            negative_prompt: negativePrompt || null,
            model: 'runway_gen4_turbo',
            image_url: videoUrl,
            created_at: new Date().toISOString(),
            type: 'video',
            duration: duration,
            resolution: '1280x768',
            fps: 30
          };

          console.log('Attempting to insert into database:', dbData);

          const { error: dbError } = await supabase
            .from('generated_images')
            .insert(dbData);

          if (dbError) {
            console.error('Database error details:', {
              error: dbError,
              code: dbError.code,
              message: dbError.message,
              details: dbError.details,
              hint: dbError.hint,
              table: 'generated_images',
              data: dbData
            });
            throw new Error(`Failed to store video metadata: ${dbError.message}`);
          }

          console.log('Successfully generated and stored video with Runway Gen4 Turbo');
          return NextResponse.json({
            status: 'completed',
            video_url: videoUrl,
            metadata: {
              model: 'runway_gen4_turbo',
              task_id: data.task.id,
              duration: duration,
              seed: apiFormData.get('seed')
            }
          });
        } catch (error) {
          console.error('Runway Gen4 Turbo API error:', error);
          return NextResponse.json(
            { error: 'Failed to generate video with Runway Gen4 Turbo: ' + (error as Error).message },
            { status: 500 }
          );
        }
        break;
      }

      case 'luma': {
        if (!process.env.API_302_KEY) {
          console.error('302 API key is missing');
          return NextResponse.json(
            { error: '302 API key is missing' },
            { status: 500 }
          );
        }

        try {
          console.log('Calling Luma AI API');
          
          // Check if we have an image for image-to-video generation
          const inputImage = formData.get('image') as File;
          
          if (inputImage) {
            console.log('Processing image-to-video generation with Luma');
            
            // Create form data for the API request
            const apiFormData = new FormData();
            apiFormData.append('user_prompt', prompt);
            apiFormData.append('image_url', inputImage);
            apiFormData.append('loop', 'false');

            console.log('Making request to Luma image-to-video API...');
            const response = await fetch('https://api.302.ai/luma/submit', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.API_302_KEY}`
              },
              body: apiFormData
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('Luma API error:', errorText);
              throw new Error(`Luma API error: ${errorText}`);
            }

            const data = await response.json();
            console.log('[302-Luma] raw response:', data);

            if (!data.id) {
              throw new Error('No task ID returned from Luma API');
            }

            // Poll for the result
            let attempts = 0;
            const maxAttempts = 60; // 10 minutes with 10-second intervals
            let result;

            while (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
              attempts++;

              console.log(`Polling attempt ${attempts}/${maxAttempts} for task ${data.id}`);

              try {
                const statusResponse = await fetch(`https://api.302.ai/luma/task/${data.id}/fetch`, {
                  headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${process.env.API_302_KEY}`
                  }
                });

                if (!statusResponse.ok) {
                  const errorText = await statusResponse.text();
                  console.error('Error checking task status:', errorText);
                  continue;
                }

                const statusData = await statusResponse.json();
                console.log('Status response:', statusData);

                if (statusData.state === 'completed' && statusData.video) {
                  result = statusData;
                  break;
                }

                if (statusData.state === 'failed') {
                  throw new Error(`Task failed: ${statusData.error || 'Unknown error'}`);
                }
              } catch (error) {
                console.error('Error during status check:', error);
                continue;
              }
            }

            if (!result?.video) {
              throw new Error('Video generation timed out or failed');
            }

            // Store metadata in database
            const dbData = {
              id: crypto.randomUUID(),
              user_id: userId,
              prompt: prompt,
              negative_prompt: negativePrompt || null,
              model: 'luma',
              image_url: result.video,
              created_at: new Date().toISOString(),
              type: 'video',
              duration: 5,
              resolution: '1024x576',
              fps: 30
            };

            console.log('Attempting to insert into database:', dbData);

            const { error: dbError } = await supabase
              .from('generated_images')
              .insert(dbData);

            if (dbError) {
              console.error('Database error details:', {
                error: dbError,
                code: dbError.code,
                message: dbError.message,
                details: dbError.details,
                hint: dbError.hint,
                table: 'generated_images',
                data: dbData
              });
              throw new Error(`Failed to store video metadata: ${dbError.message}`);
            }

            console.log('Successfully generated and stored video with Luma image-to-video');
            return NextResponse.json({
              status: 'completed',
              video_url: result.video,
              metadata: {
                model: 'luma',
                task_id: data.id,
                prompt: data.prompt,
                has_image: true
              }
            });
          } else {
            // Existing text-to-video code remains unchanged
            console.log('Calling Luma text-to-video API with prompt:', prompt);
            
            // Create form data for the request
            const apiFormData = new FormData();
            apiFormData.append('user_prompt', prompt);
            apiFormData.append('loop', 'false');

            console.log('Making request to Luma AI API...');
            const response = await fetch('https://api.302.ai/luma/submit', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${process.env.API_302_KEY}`
              },
              body: apiFormData
            });

            if (!response.ok) {
              const errorText = await response.text();
              console.error('Luma API error:', errorText);
              throw new Error(`Luma API error: ${errorText}`);
            }

            const data = await response.json();
            console.log('[302-Luma] raw response:', data);

            if (!data.id) {
              throw new Error('No task ID returned from Luma API');
            }

            // Poll for the result
            let attempts = 0;
            const maxAttempts = 60; // 10 minutes with 10-second intervals
            let result;

            while (attempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
              attempts++;

              console.log(`Polling attempt ${attempts}/${maxAttempts} for task ${data.id}`);

              try {
                const statusResponse = await fetch(`https://api.302.ai/luma/task/${data.id}/fetch`, {
                  headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${process.env.API_302_KEY}`
                  }
                });

                if (!statusResponse.ok) {
                  const errorText = await statusResponse.text();
                  console.error('Error checking task status:', errorText);
                  continue;
                }

                const statusData = await statusResponse.json();
                console.log('Status response:', statusData);

                if (statusData.state === 'completed' && statusData.video) {
                  result = statusData;
                  break;
                }

                if (statusData.state === 'failed') {
                  throw new Error(`Task failed: ${statusData.error || 'Unknown error'}`);
                }
              } catch (error) {
                console.error('Error during status check:', error);
                continue;
              }
            }

            if (!result?.video) {
              throw new Error('Video generation timed out or failed');
            }

            // Store metadata in database
            const dbData = {
              id: crypto.randomUUID(),
              user_id: userId,
              prompt: prompt,
              negative_prompt: negativePrompt || null,
              model: 'luma',
              image_url: result.video,
              created_at: new Date().toISOString(),
              type: 'video',
              duration: 5,
              resolution: '1024x576',
              fps: 30
            };

            console.log('Attempting to insert into database:', dbData);

            const { error: dbError } = await supabase
              .from('generated_images')
              .insert(dbData);

            if (dbError) {
              console.error('Database error details:', {
                error: dbError,
                code: dbError.code,
                message: dbError.message,
                details: dbError.details,
                hint: dbError.hint,
                table: 'generated_images',
                data: dbData
              });
              throw new Error(`Failed to store video metadata: ${dbError.message}`);
            }

            console.log('Successfully generated and stored video with Luma');
            return NextResponse.json({
              status: 'completed',
              video_url: result.video,
              metadata: {
                model: 'luma',
                task_id: data.id,
                prompt: data.prompt,
                has_image: false
              }
            });
          }
        } catch (error) {
          console.error('Luma API error:', error);
          return NextResponse.json(
            { error: 'Failed to generate video with Luma: ' + (error as Error).message },
            { status: 500 }
          );
        }
      }

      default:
        console.error('Unsupported model requested:', model);
        return NextResponse.json(
          { error: 'Unsupported model' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Unhandled error in video generation:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate video' },
      { status: 500 }
    );
  } finally {
    console.log('=== Video Generation Request Completed ===');
  }
} 