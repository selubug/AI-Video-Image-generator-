import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { checkAndResetDailyLimit, decrementDailyLimit } from '@/lib/daily-limit';

export async function POST(request: Request) {
  console.log('=== Starting Test Video Save ===');
  
  try {
    const { taskId, userId, prompt, negativePrompt } = await request.json();

    if (!taskId || !userId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: taskId, userId, and prompt are required' },
        { status: 400 }
      );
    }

    // Poll for the result
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes with 10-second intervals
    let result;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
      attempts++;

      console.log(`Polling attempt ${attempts}/${maxAttempts} for task ${taskId}`);

      try {
        const statusResponse = await fetch(`https://api.302.ai/minimaxi/v1/query/video_generation?task_id=${taskId}`, {
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
                task_id: taskId,
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
    console.error('Test video save error:', error);
    return NextResponse.json(
      { error: 'Failed to test video save: ' + (error as Error).message },
      { status: 500 }
    );
  }
} 