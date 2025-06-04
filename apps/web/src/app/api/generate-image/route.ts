import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/utils/supabase';
import { Model } from '@/types/models';

interface TextPrompt {
  text: string;
  weight?: number;
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    // Parse form data instead of JSON
    const formData = await req.formData();
    const prompt = formData.get('prompt') as string;
    const model = formData.get('model') as Model;
    const negativePrompt = formData.get('negativePrompt') as string;
    const userId = formData.get('userId') as string;
    const image = formData.get('image') as File | null;

    console.log('Received request:', { model, prompt, negativePrompt, hasImage: !!image });

    if (!prompt || !model) {
      return NextResponse.json(
        { error: 'Prompt and model are required' },
        { status: 400 }
      );
    }

    // Validate model type
    const isValidModel = (m: string): m is Model => {
      return ['dall-e-3', 'stable-diffusion-xl', 'gpt4o', 'ideogram', 'recraft', 'flux', 'imagen-4', 'midjourney', 'veo2', 'hidream'].includes(m as Model);
    };

    if (!isValidModel(model)) {
      return NextResponse.json(
        { error: 'Invalid model type' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Generate a unique ID for the image
    const imageId = uuidv4();
    let imageUrl: string | undefined;
    let base64Images: string[] | undefined;

    if (model === 'dall-e-3') {
      if (!process.env.OPENAI_API_KEY) {
        console.error('OpenAI API key is missing');
        return NextResponse.json(
          { error: 'OpenAI API key is missing' },
          { status: 500 }
        );
      }

      try {
        console.log('Calling DALL-E 3 API with prompt:', prompt);
        
        // Get aspect ratio from form data or default to 1:1
        const aspectRatio = formData.get('aspect_ratio') as string || '1:1';
        
        // Map aspect ratio to DALL-E 3 size
        let size: '1024x1024' | '1024x1792' | '1792x1024';
        switch (aspectRatio) {
          case '1:1':
            size = '1024x1024';
            break;
          case '9:16':
            size = '1024x1792';
            break;
          case '16:9':
            size = '1792x1024';
            break;
          default:
            size = '1024x1024';
        }
        
        const response = await openai.images.generate({
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: size,
          quality: 'standard',
          style: 'natural'
        });

        console.log('DALL-E 3 API response:', response);
        
        // Verify the response has a valid URL
        if (!response.data?.[0]?.url) {
          throw new Error('No image URL returned from DALL-E 3');
        }

        // Download the image from DALL-E
        const imageResponse = await fetch(response.data[0].url);
        if (!imageResponse.ok) {
          throw new Error('Failed to download image from DALL-E');
        }

        // Convert the image to base64
        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        imageUrl = `data:image/png;base64,${base64Image}`;
        
        console.log('Successfully downloaded and converted DALL-E image');
      } catch (error) {
        console.error('DALL-E 3 API error:', error);
        return NextResponse.json(
          { error: 'Failed to generate image with DALL-E 3: ' + (error as Error).message },
          { status: 500 }
        );
      }
    } else if (model === 'stable-diffusion-xl') {
      if (!process.env.API_302_KEY) {
        console.error('302 API key is missing');
        return NextResponse.json(
          { error: '302 API key is missing' },
          { status: 500 }
        );
      }

      try {
        console.log('Calling Stable Diffusion XL API with prompt:', prompt);
        
        // Get aspect ratio from form data or default to 1:1
        const aspectRatio = formData.get('aspect_ratio') as string || '1:1';
        
        // Map aspect ratio to dimensions
        let width = 1024;
        let height = 1024;
        switch (aspectRatio) {
          case '16:9':
            width = 1344;
            height = 768;
            break;
          case '9:16':
            width = 768;
            height = 1344;
            break;
          default: // 1:1
            width = 1024;
            height = 1024;
        }
        
        console.log('Using dimensions:', { width, height, aspectRatio });
        
        const requestBody = {
          text_prompts: [
            {
              text: prompt,
              weight: 1
            },
            {
              text: negativePrompt || "blurry, low quality, distorted, ugly, bad anatomy, disfigured, poorly drawn face, mutation, mutated, extra limb, poorly drawn hands, missing limb, floating limbs, disconnected limbs, malformed hands, blur, out of focus, long neck, long body",
              weight: -1
            }
          ],
          height: height,
          width: width
        };

        console.log('Sending request to 302.ai Stable Diffusion API:', requestBody);

        const response = await fetch('https://api.302.ai/sd/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'image/png',
            'Authorization': `Bearer ${process.env.API_302_KEY}`
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Stable Diffusion API error:', errorText);
          throw new Error(`Stable Diffusion API error: ${errorText}`);
        }

        // The response is an image buffer
        const imageBuffer = await response.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        imageUrl = `data:image/png;base64,${base64Image}`;
        
        console.log('Successfully generated image with Stable Diffusion XL');

        // Store metadata in database
        const { error: dbError } = await supabase
          .from('generated_images')
          .insert({
            id: crypto.randomUUID(),
            user_id: userId,
            prompt: prompt,
            negative_prompt: negativePrompt || null,
            model: 'stable-diffusion-xl',
            image_url: imageUrl,
            created_at: new Date().toISOString(),
            type: 'image',
            resolution: `${width}x${height}`
          });

        if (dbError) {
          console.error('Error storing in database:', dbError);
          throw new Error(`Failed to store image metadata: ${dbError.message}`);
        }

        return NextResponse.json({
          imageUrl,
          imageId: crypto.randomUUID(),
          prompt,
          negativePrompt,
          model: 'stable-diffusion-xl'
        });
      } catch (error) {
        console.error('Stable Diffusion API error:', error);
        return NextResponse.json(
          { error: 'Failed to generate image with Stable Diffusion XL: ' + (error as Error).message },
          { status: 500 }
        );
      }
    } else if (model === 'gpt4o') {
      if (!process.env.OPENAI_API_KEY) {
        console.error('OpenAI API key is missing');
        return NextResponse.json(
          { error: 'OpenAI API key is missing' },
          { status: 500 }
        );
      }

      try {
        console.log('Calling GPT Image 1 API with prompt:', prompt);
        
        // GPT4O only supports square images, so we'll use 1024x1024
        const size = '1024x1024';
        console.log('Using size for GPT4O:', { size });
        
        let response;
        if (image) {
          // If there's a reference image, use the edits endpoint
          const imageBuffer = await image.arrayBuffer();
          
          console.log('Using image reference with edits endpoint');
          response = await openai.images.edit({
            model: 'gpt-image-1',
            prompt: prompt,
            image: new File([imageBuffer], 'image.png', { type: 'image/png' }),
            size: size,
            n: 1
          });

          console.log('GPT Image 1 edits API response:', response);
        
          // Get the base64 image data directly from the response
          const base64ImageData = response.data?.[0]?.b64_json;
          if (!base64ImageData) {
            console.error('No base64 image data in response:', response);
            throw new Error('No image data returned from GPT Image 1');
          }

          // Convert to data URL
          imageUrl = `data:image/png;base64,${base64ImageData}`;
        } else {
          // For text-to-image, use the generate endpoint
          console.log('Using text-to-image generation');
          response = await openai.images.generate({
          model: 'gpt-image-1',
          prompt: prompt,
          n: 1,
            size: size
        });

          console.log('GPT Image 1 generate API response:', response);
        
          // Get the base64 image data directly from the response
          const base64ImageData = response.data?.[0]?.b64_json;
          if (!base64ImageData) {
            console.error('No base64 image data in response:', response);
            throw new Error('No image data returned from GPT Image 1');
        }

          // Convert to data URL
          imageUrl = `data:image/png;base64,${base64ImageData}`;
        }
        
        console.log('Successfully processed GPT Image 1 image');

        // Store metadata in database
        const { error: dbError } = await supabase
          .from('generated_images')
          .insert({
            id: crypto.randomUUID(),
            user_id: userId,
            prompt: prompt,
            negative_prompt: negativePrompt || null,
            model: 'gpt4o',
            image_url: imageUrl,
            created_at: new Date().toISOString(),
            type: 'image',
            resolution: size
          });

        if (dbError) {
          console.error('Error storing in database:', dbError);
          throw new Error(`Failed to store image metadata: ${dbError.message}`);
        }

        return NextResponse.json({
          imageUrl,
          imageId: crypto.randomUUID(),
          prompt,
          negativePrompt,
          model: 'gpt4o'
        });
      } catch (error) {
        console.error('GPT Image 1 API error:', error);
        const errorMessage = (error as Error).message;
        if (errorMessage.includes('organization verification')) {
          return NextResponse.json(
            { 
              error: 'GPT Image 1 requires organization verification. Please use DALL-E 3 or Stable Diffusion instead.',
              details: 'To use GPT Image 1, your OpenAI organization needs to complete verification. Visit: https://help.openai.com/en/articles/10910291-api-organization-verification'
            },
            { status: 403 }
          );
        }
        return NextResponse.json(
          { error: 'Failed to generate image with GPT Image 1: ' + errorMessage },
          { status: 500 }
        );
      }
    } else if (model === 'midjourney') {
      if (!process.env.PIAPI_API_KEY) {
        console.error('PiAPI API key is missing');
        return NextResponse.json(
          { error: 'PiAPI API key is missing' },
          { status: 500 }
        );
      }

      try {
        console.log('Calling Midjourney API with prompt:', prompt);
        
        // Get aspect ratio from form data or default to 1:1
        const aspectRatio = formData.get('aspect_ratio') as string || '1:1';
        
        // Validate aspect ratio
        const validAspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
        if (!validAspectRatios.includes(aspectRatio)) {
          return NextResponse.json(
            { error: 'Invalid aspect ratio. Must be one of: 1:1, 16:9, 9:16, 4:3, 3:4' },
            { status: 400 }
          );
        }
        
        const requestBody = {
          model: 'midjourney',
          task_type: 'imagine',
          input: {
            prompt: prompt,
            aspect_ratio: aspectRatio,
            process_mode: 'turbo',
            skip_prompt_check: false
          },
          config: {
            service_mode: 'public',
            webhook_config: {
              endpoint: '',
              secret: ''
            }
          }
        };

        console.log('Sending request to Midjourney API:', JSON.stringify(requestBody, null, 2));

        const response = await fetch('https://api.piapi.ai/api/v1/task', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': process.env.PIAPI_API_KEY
          },
          body: JSON.stringify(requestBody)
        });

        console.log('Midjourney API Response Status:', response.status);
        console.log('Midjourney API Response Headers:', response.headers);

        if (!response.ok) {
          const error = await response.json();
          console.error('Midjourney API Error Response:', error);
          return NextResponse.json(
            { error: error.message || 'Failed to generate image' },
            { status: response.status }
          );
        }

        const data = await response.json();
        console.log('Midjourney API Success Response:', JSON.stringify(data, null, 2));

        if (data.code !== 200) {
          console.error('Midjourney API Error Code:', data.code);
          return NextResponse.json(
            { error: data.message || 'Failed to generate image' },
            { status: 500 }
          );
        }

        const taskId = data.data.task_id;
        let isCompleted = false;
        let attempts = 0;
        const maxAttempts = 30; // 5 minutes with 10-second intervals

        // Poll for task completion
        while (attempts < maxAttempts) {
          console.log(`\n=== Polling Attempt ${attempts + 1}/${maxAttempts} ===`);
          await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
          attempts++;

          const statusResponse = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
            headers: {
              'X-API-KEY': process.env.PIAPI_API_KEY
            }
          });

          if (!statusResponse.ok) {
            console.error('Error checking task status:', await statusResponse.text());
            continue;
          }

          const statusData = await statusResponse.json();
          console.log('\n=== Task Status Check ===');
          console.log('Status:', statusData.data?.status);
          console.log('Progress:', statusData.data?.output?.progress + '%');
          console.log('Main Image URL:', statusData.data?.output?.image_url);
          console.log('Temporary Image URLs:', JSON.stringify(statusData.data?.output?.temporary_image_urls, null, 2));

          // Check for completed status (case insensitive)
          if (statusData.data?.status?.toLowerCase() === 'completed' && statusData.data?.output?.progress === 100) {
            console.log('\n=== TASK COMPLETED - Processing Images ===');
            
            // Get all image URLs
            const temporaryImageUrls = statusData.data.output?.temporary_image_urls || [];
            const mainImageUrl = statusData.data.output?.image_url;
            
            console.log('\nFound URLs:');
            console.log('Main URL:', mainImageUrl);
            console.log('Temporary URLs:', temporaryImageUrls);
            
            if (temporaryImageUrls.length > 0) {
              console.log('\n=== Downloading Temporary Images ===');
              
              // Download all images
              const imagePromises = temporaryImageUrls.map(async (url: string, index: number) => {
                console.log(`\nDownloading image ${index + 1} from:`, url);
                const imageResponse = await fetch(url);
                if (!imageResponse.ok) {
                  throw new Error(`Failed to download image from ${url}`);
                }
                const imageBuffer = await imageResponse.arrayBuffer();
                const base64Image = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;
                console.log(`Successfully downloaded image ${index + 1}`);
                return base64Image;
              });

              try {
                base64Images = await Promise.all(imagePromises);
                imageUrl = base64Images[0]; // Use first image as main image
                console.log('\n=== Successfully Downloaded All Images ===');

                // Save all images to database
                if (supabase) {
                  console.log('\n=== Saving Images to Database ===');
                  const savePromises = base64Images.map(async (base64Image, index) => {
                    const imageId = uuidv4();
                    console.log(`\nSaving image ${index + 1} to database with ID:`, imageId);
                    const imageData = {
                      id: imageId,
                      user_id: userId,
                      prompt: `${prompt} (Midjourney variation ${index + 1})`,
                      negative_prompt: negativePrompt || null,
                      model: model,
                      image_url: base64Image,
                      created_at: new Date().toISOString(),
                    };

                    try {
                      const { data: savedData, error: dbError } = await supabase
                        .from('generated_images')
                        .insert(imageData)
                        .select()
                        .single();

                      if (dbError) {
                        console.error(`Database insert error for image ${index + 1}:`, dbError);
                        return null;
                      }

                      console.log(`Successfully saved image ${index + 1} to database`);
                      return savedData;
                    } catch (error) {
                      console.error(`Failed to save image ${index + 1}:`, error);
                      return null;
                    }
                  });

                  await Promise.all(savePromises);
                  console.log('\n=== Successfully Saved All Images to Database ===');
                }

                console.log('\n=== Returning Response with All Images ===');
        return NextResponse.json({
                  imageUrl,
                  imageId,
                  prompt,
                  negativePrompt,
                  model,
                  base64Images,
                  isMidjourney: true,
                  totalImages: base64Images.length
                });
              } catch (error) {
                console.error('\n=== Error Processing Temporary Images ===', error);
                // Fall back to main image URL if temporary URLs fail
                if (!mainImageUrl) {
                  throw new Error('No image URLs available');
                }
                console.log('\nFalling back to main image URL:', mainImageUrl);
                const imageResponse = await fetch(mainImageUrl);
                if (!imageResponse.ok) {
                  throw new Error('Failed to download main image');
                }
                const imageBuffer = await imageResponse.arrayBuffer();
                imageUrl = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;
                
                // Save main image to database
                if (supabase) {
                  console.log('\n=== Saving Main Image to Database ===');
                  const imageData = {
                    id: imageId,
                    user_id: userId,
                    prompt: prompt,
                    negative_prompt: negativePrompt || null,
                    model: model,
                    image_url: imageUrl,
                    created_at: new Date().toISOString(),
                  };

                  await supabase
                    .from('generated_images')
                    .insert(imageData)
                    .select()
                    .single();
                  console.log('Successfully saved main image to database');
                }

                console.log('\n=== Returning Response with Main Image ===');
        return NextResponse.json({
                  imageUrl,
                  imageId,
                  prompt,
                  negativePrompt,
                  model
                });
              }
            } else if (mainImageUrl) {
              // Fall back to main image URL if no temporary URLs
              console.log('\n=== Using Main Image URL ===');
              console.log('Main URL:', mainImageUrl);
              const imageResponse = await fetch(mainImageUrl);
              if (!imageResponse.ok) {
                throw new Error('Failed to download main image');
              }
              const imageBuffer = await imageResponse.arrayBuffer();
              imageUrl = `data:image/png;base64,${Buffer.from(imageBuffer).toString('base64')}`;
              
              // Save main image to database
              if (supabase) {
                console.log('\n=== Saving Main Image to Database ===');
                const imageData = {
                  id: imageId,
                  user_id: userId,
                  prompt: prompt,
                  negative_prompt: negativePrompt || null,
                  model: model,
                  image_url: imageUrl,
                  created_at: new Date().toISOString(),
                };

                await supabase
                  .from('generated_images')
                  .insert(imageData)
                  .select()
                  .single();
                console.log('Successfully saved main image to database');
              }

              console.log('\n=== Returning Response with Main Image ===');
              return NextResponse.json({ 
                imageUrl,
                imageId,
                prompt,
                negativePrompt,
                model
              });
            } else {
              throw new Error('No image URLs available');
            }
          } else if (statusData.data?.status?.toLowerCase() === 'failed') {
            console.log('\n=== Task Failed ===');
            throw new Error(`Task failed: ${statusData.data?.error?.message || 'Unknown error'}`);
          } else {
            console.log('\n=== Task Still Processing ===');
            console.log(`Status: ${statusData.data?.status}, Progress: ${statusData.data?.output?.progress}%`);
          }
        }

        console.log('\n=== Task Timed Out ===');
        throw new Error('Task timed out after 5 minutes');

      } catch (error) {
        console.error('Midjourney API error:', error);
        return NextResponse.json(
          { error: 'Failed to generate image with Midjourney: ' + (error as Error).message },
          { status: 500 }
        );
      }
    } else if (model === 'ideogram') {
      if (!process.env.API_302_KEY) {
        console.error('302 API key is missing');
        return NextResponse.json(
          { error: '302 API key is missing' },
          { status: 500 }
        );
      }

      try {
        console.log('Calling Ideogram API with prompt:', prompt);
        
        // Get aspect ratio from form data or default to 1:1
        const rawAspectRatio = formData.get('aspect_ratio') as string || '1:1';
        
        // Validate aspect ratio
        const validAspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
        if (!validAspectRatios.includes(rawAspectRatio)) {
          return NextResponse.json(
            { error: 'Invalid aspect ratio. Must be one of: 1:1, 16:9, 9:16, 4:3, 3:4' },
            { status: 400 }
          );
        }
        
        // Convert from frontend format to Ideogram API format
        const aspectRatio = `ASPECT_${rawAspectRatio.replace(':', '_')}`;
        
        // Make the request
        const requestBody = {
          image_request: {
            prompt: prompt,
            negative_prompt: negativePrompt || "blurry, low quality, distorted, ugly, bad anatomy, disfigured, poorly drawn face, mutation, mutated, extra limb, poorly drawn hands, missing limb, floating limbs, disconnected limbs, malformed hands, blur, out of focus, long neck, long body",
            aspect_ratio: aspectRatio,
            style: "cinematic",
            cfg_scale: 7.5,
            steps: 30,
            seed: Math.floor(Math.random() * 1000000) // Random seed
          }
        };
        console.log('Request body:', requestBody);

        const response = await fetch('https://api.302.ai/ideogram/generate', {
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
          console.error('Ideogram API error:', errorText);
          throw new Error(`Ideogram API error: ${errorText}`);
        }

        const data = await response.json();
        console.log('[302-Ideogram] raw response:', data);

        if (!data.data?.[0]?.url) {
          throw new Error('No image URL returned from Ideogram API');
        }

        const imageUrl = data.data[0].url;
        const resolution = data.data[0].resolution;

        // Store metadata in database
        const { error: dbError } = await supabase
          .from('generated_images')
          .insert({
            id: crypto.randomUUID(),
            user_id: userId,
            prompt: prompt,
            negative_prompt: negativePrompt || null,
            model: 'ideogram',
            image_url: imageUrl,
            created_at: new Date().toISOString(),
            type: 'image',
            resolution: resolution || '1024x1024'
          });

        if (dbError) {
          console.error('Error storing in database:', dbError);
          throw new Error(`Failed to store image metadata: ${dbError.message}`);
        }
        
        console.log('Successfully generated and stored image with Ideogram');
        return NextResponse.json({
          imageUrl,
          imageId: crypto.randomUUID(),
          prompt,
          negativePrompt,
          model: 'ideogram'
        });
      } catch (error) {
        console.error('Ideogram API error:', error);
        return NextResponse.json(
          { error: 'Failed to generate image with Ideogram: ' + (error as Error).message },
          { status: 500 }
        );
      }
    } else if (model === 'recraft') {
      if (!process.env.RECRAFT_API_KEY) {
        console.error('Recraft API key is missing');
        return NextResponse.json(
          { error: 'Recraft API key is missing' },
          { status: 500 }
        );
      }

      try {
        console.log('Calling Recraft API with prompt:', prompt);
        
        // Get aspect ratio from form data or default to 1:1
        const aspectRatio = formData.get('aspect_ratio') as string || '1:1';
        
        // Validate aspect ratio
        const validAspectRatios = ['1:1', '16:9', '9:16'];
        if (!validAspectRatios.includes(aspectRatio)) {
          return NextResponse.json(
            { error: 'Invalid aspect ratio. Must be one of: 1:1, 16:9, 9:16' },
            { status: 400 }
          );
        }
        
        // Map aspect ratio to dimensions
        // Recraft works best with multiples of 64
        let width = 1024;
        let height = 1024;
        switch (aspectRatio) {
          case '16:9':
            width = 1024;
            height = 576;  // 1024 * 9/16 = 576
            break;
          case '9:16':
            width = 576;   // 1024 * 9/16 = 576
            height = 1024;
            break;
          default: // 1:1
            width = 1024;
            height = 1024;
        }
        
        console.log('Using dimensions for Recraft:', { width, height, aspectRatio });
        
        // If there's a reference image, use the imageToImage endpoint
        if (image) {
          // Convert image to File with proper name and type
          const array = await image.arrayBuffer();
          const file = new File([array], 'reference.png', { type: image.type || 'image/png' });
          
          // Create form data for image-to-image
          const formData = new FormData();
          formData.append('prompt', prompt);
          formData.append('image', file);
          formData.append('style', 'realistic_image');
          formData.append('strength', '0.6');
          formData.append('width', width.toString());
          formData.append('height', height.toString());

          console.log('Sending request to Recraft imageToImage API with dimensions:', { width, height });

          const response = await fetch('https://external.api.recraft.ai/v1/images/imageToImage', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${process.env.RECRAFT_API_KEY}`
            },
            body: formData
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error('Recraft API error:', errorData);
            throw new Error(`Recraft API error: ${errorData.error || 'Unknown error'}`);
          }

          const data = await response.json();
          console.log('Recraft API response:', data);

          if (!data.data || data.data.length === 0) {
            throw new Error('No images returned from Recraft API');
          }

          // Download the image from the URL
          const imageResponse = await fetch(data.data[0].url);
          if (!imageResponse.ok) {
            throw new Error('Failed to download image from Recraft');
          }

          const imageBuffer = await imageResponse.arrayBuffer();
          const base64Image = Buffer.from(imageBuffer).toString('base64');
          imageUrl = `data:image/png;base64,${base64Image}`;
        } else {
          // For text-to-image, use the generations endpoint
          console.log('Sending request to Recraft generations API with dimensions:', { width, height });

        const response = await fetch('https://external.api.recraft.ai/v1/images/generations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RECRAFT_API_KEY}`
          },
            body: JSON.stringify({
              prompt: prompt,
              style: 'realistic_image',
              width: width,
              height: height,
              num_images: 1,
              cfg_scale: 7.5,
              steps: 30
            })
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Recraft API error:', errorData);
          throw new Error(`Recraft API error: ${errorData.error || 'Unknown error'}`);
        }

        const data = await response.json();
        console.log('Recraft API response:', data);

        if (!data.data || data.data.length === 0) {
          throw new Error('No images returned from Recraft API');
        }

        // Download the image from the URL
        const imageResponse = await fetch(data.data[0].url);
        if (!imageResponse.ok) {
          throw new Error('Failed to download image from Recraft');
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        imageUrl = `data:image/png;base64,${base64Image}`;
        }
        
        console.log('Successfully generated image with Recraft');
      } catch (error) {
        console.error('Recraft API error:', error);
        return NextResponse.json(
          { error: 'Failed to generate image with Recraft: ' + (error as Error).message },
          { status: 500 }
        );
      }
    } else if (model === 'flux') {
      if (!process.env.HUGGINGFACE_API_KEY) {
        console.error('Hugging Face API key is missing');
        return NextResponse.json(
          { error: 'Hugging Face API key is missing. Please check your .env.local file.' },
          { status: 500 }
        );
      }

      try {
        console.log('Calling FLUX.1-dev API');
        
        // Create the request body according to the FLUX.1-dev API spec
        const requestBody = {
          inputs: prompt,
          parameters: {
            height: 1024,
            width: 1024,
            guidance_scale: 3.5,
            num_inference_steps: 50,
            max_sequence_length: 512,
            seed: Math.floor(Math.random() * 1000000)
          }
        };

        console.log('Request body:', JSON.stringify(requestBody, null, 2));

        const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-dev', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        });

        const responseText = await response.text();
        let data;
        try {
          data = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse response:', responseText);
          throw new Error('Invalid response from FLUX API');
        }

        if (!response.ok || data.error) {
          throw new Error(`FLUX API error: ${data.error || 'Unknown error'}`);
        }

        console.log('[FLUX.1-dev] raw response:', data);

        if (!data[0]?.image) {
          throw new Error('No image data returned from FLUX API');
        }

        const imageData = data[0].image;
        const imageUrl = `data:image/jpeg;base64,${imageData}`;

        // Store metadata in database
        const dbData = {
          id: crypto.randomUUID(),
          user_id: userId,
          prompt: prompt,
          negative_prompt: negativePrompt || null,
          model: 'flux-1-dev',
          image_url: imageUrl,
          created_at: new Date().toISOString(),
          type: 'image',
          resolution: '1024x1024'
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
          throw new Error(`Failed to store image metadata: ${dbError.message}`);
        }

        console.log('Successfully generated and stored image with FLUX.1-dev');
        return NextResponse.json({
          status: 'completed',
          image_url: imageUrl,
          metadata: {
            model: 'flux-1-dev',
            height: 1024,
            width: 1024,
            guidance_scale: 3.5,
            num_inference_steps: 50,
            max_sequence_length: 512
          }
        });
      } catch (error) {
        console.error('FLUX API error:', error);
        
        // Check if it's a rate limit or service unavailable error
        if (error instanceof Error && 
            (error.message.includes('429') || error.message.includes('503'))) {
          return NextResponse.json(
            { 
              error: 'FLUX service is currently at capacity. Please try again in a few minutes.',
              details: 'The service is experiencing high demand. Your request will be processed when capacity becomes available.'
            },
            { status: 503 }
          );
        }
        
        return NextResponse.json(
          { error: 'Failed to generate image with FLUX: ' + (error as Error).message },
          { status: 500 }
        );
      }
    } else if (model === 'imagen-4') {
      if (!process.env.API_302_KEY) {
        console.error('302 API key is missing');
        return NextResponse.json(
          { error: '302 API key is missing' },
          { status: 500 }
        );
      }

      try {
        console.log('Calling Google Imagen 4 API with prompt:', prompt);
        
        // Get aspect ratio from form data, default to 1:1 if not provided
        const aspectRatio = formData.get('aspectRatio') as string || '1:1';
        
        // Validate aspect ratio
        const validAspectRatios = ['1:1', '9:16', '16:9', '3:4', '4:3'];
        if (!validAspectRatios.includes(aspectRatio)) {
          return NextResponse.json(
            { error: 'Invalid aspect ratio. Must be one of: 1:1, 9:16, 16:9, 3:4, 4:3' },
            { status: 400 }
          );
        }

        // Make the initial request to start image generation
        console.log('Making request to:', 'https://api.302.ai/302/submit/google-imagen-3');
        console.log('With headers:', {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer [REDACTED]',
          'User-Agent': '302-client/1.0'  // Add User-Agent to avoid rate limiting
        });

        try {
          // First verify the API key is present
          if (!process.env.API_302_KEY) {
            throw new Error('API_302_KEY is not set in environment variables');
          }

          // Log the request details (excluding sensitive data)
          const requestBody = {
            prompt: prompt,
            aspect_ratio: aspectRatio
          };
          console.log('Request body:', requestBody);

          // Make the request with a longer timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            console.error('Request timed out after 60 seconds');
          }, 60000); // 60 second timeout

          console.log('Making request to:', 'https://api.302.ai/302/submit/google-imagen-3');
          console.log('With headers:', {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer [REDACTED]'
          });

          try {
            const response = await fetch('https://api.302.ai/302/submit/google-imagen-3', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.API_302_KEY}`
              },
              body: JSON.stringify(requestBody),
              signal: controller.signal
            });

            console.log('Response status:', response.status);
            console.log('Response status text:', response.statusText);
            console.log('Response headers:', Object.fromEntries(response.headers.entries()));
            
            // Let fetch parse JSON for us
            const data = await response.json();
            console.log('[302-Imagen-3] raw response:', data);

            // Check for error response first
            if (data.error) {
              if (data.error === "Balance insufficient") {
                throw new Error('Insufficient balance in 302 AI wallet. Please top up credits or raise the daily limit.');
              } else if (data.error === "You don't have permission to access this model") {
                throw new Error('No permission to access Imagen-3. Please check your API key permissions in the 302 dashboard.');
    } else {
                throw new Error(`302/Imagen-3 error: ${data.error}`);
              }
            }

            // Then check for task ID
            if (!data.id) {
              throw new Error('No task ID returned – check balance and model access in the 302 dashboard.');
            }

            let result = data;
            let imageGenerated = false;

            // Only poll if the status isn't already succeeded
            if (data.status !== 'succeeded') {
              // Poll for the result
              let attempts = 0;
              const maxAttempts = 30; // 5 minutes with 10-second intervals

              while (attempts < maxAttempts && !imageGenerated) {
                await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
                attempts++;

                console.log(`Polling attempt ${attempts}/${maxAttempts} for task ${data.id}`);

                try {
                  const statusResponse = await fetch(`https://api.302.ai/302/status/${data.id}`, {
                    headers: {
                      'Accept': 'application/json',
                      'Authorization': `Bearer ${process.env.API_302_KEY}`
                    }
                  });

                  if (!statusResponse.ok) {
                    console.error('Error checking task status:', await statusResponse.text());
                    continue;
                  }

                  const statusData = await statusResponse.json();
                  console.log('Status response:', statusData);

                  if (statusData.status === 'succeeded' && statusData.output) {
                    result = statusData;
                    break;
                  }

                  if (statusData.status === 'failed') {
                    throw new Error(`Task failed: ${statusData.error || 'Unknown error'}`);
                  }
                } catch (error) {
                  console.error('Error during status check:', error);
                  // Continue polling even if there's an error
                  continue;
                }
              }

              if (!result?.output) {
                throw new Error('Image generation timed out or failed');
              }
            }

            // Download the image from the output URL
            console.log('Downloading image from:', result.output);
            const imageResponse = await fetch(result.output);
            if (!imageResponse.ok) {
              throw new Error('Failed to download generated image');
            }

            const imageBuffer = await imageResponse.arrayBuffer();
            const base64Image = Buffer.from(imageBuffer).toString('base64');
            imageUrl = `data:image/png;base64,${base64Image}`;
            imageGenerated = true;
            
            console.log('Successfully generated image with Google Imagen 3');
          } catch (error: any) {
            if (error.name === 'AbortError') {
              throw new Error('Request timed out after 60 seconds. The API might be slow to respond.');
            }
            throw error;
          } finally {
            clearTimeout(timeoutId);
          }
        } catch (error) {
          console.error('Google Imagen 4 API error:', error);
      return NextResponse.json(
            { error: 'Failed to generate image with Google Imagen 4: ' + (error as Error).message },
            { status: 500 }
          );
        }
      } catch (error) {
        console.error('Google Imagen 4 API error:', error);
        return NextResponse.json(
          { error: 'Failed to generate image with Google Imagen 4: ' + (error as Error).message },
          { status: 500 }
        );
      }
    } else if (model === 'veo2') {
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
              console.error('Error checking task status:', await statusResponse.text());
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
        const base64Video = Buffer.from(videoBuffer).toString('base64');
        imageUrl = `data:video/mp4;base64,${base64Video}`;
        
        console.log('Successfully generated video with Google Veo2');
      } catch (error) {
        console.error('Google Veo2 API error:', error);
        return NextResponse.json(
          { error: 'Failed to generate video with Google Veo2: ' + (error as Error).message },
          { status: 500 }
        );
      }
    } else if (model === 'hidream') {
      if (!process.env.API_302_KEY) {
        console.error('302 API key is missing');
        return NextResponse.json(
          { error: '302 API key is missing' },
        { status: 500 }
      );
    }

      try {
        console.log('Calling HiDream API with prompt:', prompt);
        
        // Get aspect ratio from form data or default to 1:1
        const aspectRatio = formData.get('aspect_ratio') as string || '1:1';
        
        // Validate aspect ratio
        const validAspectRatios = ['1:1', '16:9', '9:16', '4:3', '3:4'];
        if (!validAspectRatios.includes(aspectRatio)) {
          return NextResponse.json(
            { error: 'Invalid aspect ratio. Must be one of: 1:1, 16:9, 9:16, 4:3, 3:4' },
            { status: 400 }
          );
        }
        
        // Map aspect ratio to dimensions
        let width = 1024;
        let height = 1024;
        switch (aspectRatio) {
          case '16:9':
            width = 1024;
            height = 576;
            break;
          case '9:16':
            width = 576;
            height = 1024;
            break;
          case '4:3':
            width = 1024;
            height = 768;
            break;
          case '3:4':
            width = 768;
            height = 1024;
            break;
          default: // 1:1
            width = 1024;
            height = 1024;
        }
        
        console.log('Using dimensions for HiDream:', { width, height, aspectRatio });
        
        // Make the request
        const requestBody = {
          prompt: prompt,
          image_size: {
            width: width,
            height: height
          }
        };
        console.log('Request body:', requestBody);

        const response = await fetch('https://api.302.ai/302/submit/hidream-i1-full', {
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
          console.error('HiDream API error:', errorText);
          throw new Error(`HiDream API error: ${errorText}`);
        }

        const data = await response.json();
        console.log('[302-HiDream] raw response:', data);

        if (!data.images?.[0]?.url) {
          throw new Error('No image URL returned from HiDream API');
        }

        // Download the image from the URL
        console.log('Downloading image from:', data.images[0].url);
        const imageResponse = await fetch(data.images[0].url);
        if (!imageResponse.ok) {
          throw new Error('Failed to download generated image');
        }

        const imageBuffer = await imageResponse.arrayBuffer();
        const base64Image = Buffer.from(imageBuffer).toString('base64');
        imageUrl = `data:image/png;base64,${base64Image}`;

        // Store metadata in database
        const { error: dbError } = await supabase
          .from('generated_images')
          .insert({
            id: crypto.randomUUID(),
        user_id: userId,
        prompt: prompt,
        negative_prompt: negativePrompt || null,
            model: 'hidream',
        image_url: imageUrl,
        created_at: new Date().toISOString(),
            type: 'image',
            resolution: `${width}x${height}`
          });

        if (dbError) {
          console.error('Error storing in database:', dbError);
          throw new Error(`Failed to store image metadata: ${dbError.message}`);
        }

        console.log('Successfully generated and stored image with HiDream');
        return NextResponse.json({
          imageUrl,
          imageId: crypto.randomUUID(),
          prompt,
          negativePrompt,
          model: 'hidream'
        });
      } catch (error) {
        console.error('HiDream API error:', error);
        return NextResponse.json(
          { error: 'Failed to generate image with HiDream: ' + (error as Error).message },
          { status: 500 }
        );
      }
    } else if (model === 'kling') {
      if (!process.env.PIAPI_API_KEY) {
        console.error('PiAPI API key is missing');
        return NextResponse.json(
          { error: 'PiAPI API key is missing' },
          { status: 500 }
        );
      }

      try {
        console.log('Calling Kling API with prompt:', prompt);
        
        // Get aspect ratio from form data or default to 16:9
        const aspectRatio = formData.get('aspect_ratio') as string || '16:9';
        
        // Validate aspect ratio
        const validAspectRatios = ['16:9', '9:16', '1:1'];
        if (!validAspectRatios.includes(aspectRatio)) {
          return NextResponse.json(
            { error: 'Invalid aspect ratio. Must be one of: 16:9, 9:16, 1:1' },
            { status: 400 }
          );
        }

        // If there's a reference image, upload it first
        let imageUrl = null;
        if (image) {
          // Convert image to base64
          const imageBuffer = await image.arrayBuffer();
          const base64Image = Buffer.from(imageBuffer).toString('base64');
          imageUrl = `data:${image.type};base64,${base64Image}`;
        }

        // Make the request
        const requestBody = {
          model: "Kling",
          task_type: "fast-txt2video",
          input: {
            prompt: prompt,
            negative_prompt: negativePrompt || "blurry, low quality, distorted, ugly, bad anatomy, disfigured, poorly drawn face, mutation, mutated, extra limb, poorly drawn hands, missing limb, floating limbs, disconnected limbs, malformed hands, blur, out of focus, long neck, long body",
            aspect_ratio: aspectRatio,
            image_url: imageUrl
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
          console.error('Kling API error:', errorText);
          throw new Error(`Kling API error: ${errorText}`);
        }

        const data = await response.json();
        console.log('[PIAPI-Kling] raw response:', data);

        if (data.code !== 200 || !data.data?.task_id) {
          throw new Error('No task ID returned from Kling API');
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
            model: 'kling',
            image_url: videoUrl,
            created_at: new Date().toISOString(),
            type: 'video',
            duration: 5, // Default duration for fast mode
            resolution: aspectRatio === '16:9' ? '1024x576' : 
                       aspectRatio === '9:16' ? '576x1024' : 
                       '1024x1024', // 1:1
            fps: 30
          });

        if (dbError) {
          console.error('Error storing in database:', dbError);
          throw new Error(`Failed to store video metadata: ${dbError.message}`);
        }

        console.log('Successfully generated and stored video with Kling');
        return NextResponse.json({
          status: 'completed',
          video_url: videoUrl,
          metadata: {
            model: 'kling',
            task_id: data.data.task_id,
            aspect_ratio: aspectRatio,
            duration: 5,
            resolution: aspectRatio === '16:9' ? '1024x576' : 
                       aspectRatio === '9:16' ? '576x1024' : 
                       '1024x1024' // 1:1
          }
        });
      } catch (error) {
        console.error('Kling API error:', error);
        return NextResponse.json(
          { error: 'Failed to generate video with Kling: ' + (error as Error).message },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported model' },
        { status: 400 }
      );
    }

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Failed to generate image: No image URL returned' },
        { status: 500 }
      );
    }

    // Only try to save to Supabase if it's configured
    if (supabase) {
      console.log('Starting database save operation...');
      
      // If it's Midjourney with multiple images, save each one separately
      if (model === 'midjourney' && base64Images && base64Images.length > 0) {
        const savePromises = base64Images.map(async (base64Image, index) => {
      const imageData = {
            id: uuidv4(),
        user_id: userId,
            prompt: `${prompt} (Midjourney variation ${index + 1})`,
        negative_prompt: negativePrompt || null,
        model: model,
            image_url: base64Image,
        created_at: new Date().toISOString(),
      };

          try {
        const { data: savedData, error: dbError } = await supabase
          .from('generated_images')
          .insert(imageData)
          .select()
          .single();

        if (dbError) {
              console.error(`Database insert error for image ${index + 1}:`, dbError);
              return null;
            }

            return savedData;
          } catch (error) {
            console.error(`Failed to save image ${index + 1}:`, error);
            return null;
          }
        });

        const savedImages = await Promise.all(savePromises);
        const successfulSaves = savedImages.filter(img => img !== null);

        if (successfulSaves.length === 0) {
          console.error('Failed to save any Midjourney images');
        } else {
          console.log(`Successfully saved ${successfulSaves.length} Midjourney images`);
        }
      } else {
        // Handle single image save as before
      const imageData = {
        id: imageId,
        user_id: userId,
        prompt: prompt,
        negative_prompt: negativePrompt || null,
        model: model,
        image_url: imageUrl,
        created_at: new Date().toISOString(),
      };

        try {
        const { data: savedData, error: dbError } = await supabase
          .from('generated_images')
          .insert(imageData)
          .select()
          .single();

        if (dbError) {
          console.error('Database insert error:', {
            code: dbError.code,
            message: dbError.message,
            details: dbError.details,
            hint: dbError.hint
          });
        } else {
        console.log('Database insert successful:', {
          savedId: savedData?.id,
          savedUserId: savedData?.user_id,
          savedAt: savedData?.created_at
          });
        }
      } catch (error) {
        console.error('Database operation failed:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        });
        }
      }
    } else {
      console.warn('Supabase client not initialized. Check environment variables: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }

    // For Midjourney, return the first image as the main response
    // The other images will be saved separately in the database
    return NextResponse.json({ 
      imageUrl,
      imageId,
      prompt,
      negativePrompt,
      model
    });
  } catch (error) {
    console.error('Error in generate-image API:', error);
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    return NextResponse.json(
      { error: 'Failed to generate image: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 