import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { uploadImageToTempStorage } from '@/lib/image-upload';

export async function GET(request: Request) {
  const taskId = 'runway_16a1a54c7875'; // The task ID from your example
  const userId = '00000000-0000-0000-0000-000000000000'; // Using a proper UUID format for test user

  try {
    console.log(`Polling for task ${taskId}...`);
    
    const statusResponse = await fetch(`https://api.302.ai/runway/task/${taskId}/fetch`, {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${process.env.API_302_KEY}`
      }
    });

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error('Error checking task status:', errorText);
      return NextResponse.json({ error: 'Failed to check task status' }, { status: 500 });
    }

    const statusData = await statusResponse.json();
    console.log('Status response:', statusData);

    if (statusData.task?.status === 'SUCCEEDED') {
      const videoArtifact = statusData.task.artifacts?.[0];
      if (videoArtifact?.url) {
        // Download the video
        console.log('Downloading video from:', videoArtifact.url);
        const videoResponse = await fetch(videoArtifact.url);
        if (!videoResponse.ok) {
          throw new Error('Failed to download generated video');
        }

        // Store metadata in database
        const dbData = {
          id: crypto.randomUUID(),
          user_id: userId,
          prompt: statusData.task.options.text_prompt,
          model: 'runway',
          image_url: videoArtifact.url, // Store the URL directly
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
          return NextResponse.json({ 
            error: 'Failed to store video metadata',
            details: dbError,
            table: 'generated_images',
            data: dbData
          }, { status: 500 });
        }

        return NextResponse.json({
          status: 'completed',
          video_url: videoArtifact.url,
          metadata: {
            model: 'runway',
            task_id: taskId,
            prompt: statusData.task.options.text_prompt
          }
        });
      }
    }

    return NextResponse.json({
      status: statusData.task?.status || 'unknown',
      task: statusData.task
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
} 