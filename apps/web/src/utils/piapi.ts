import { NextResponse } from 'next/server';

if (!process.env.PIAPI_API_KEY) {
  throw new Error('Missing PIAPI_API_KEY environment variable');
}

const PIAPI_BASE_URL = 'https://api.piapi.ai/api/v1';

export interface PiapiResponse {
  success: boolean;
  data?: any;
  error?: string;
}

interface KlingInput {
  prompt: string;
  negative_prompt?: string;
  cfg_scale?: number;
  duration?: 5 | 10;
  aspect_ratio?: '16:9' | '9:16' | '1:1';
  camera_control?: {
    type: string;
    config: {
      horizontal: number;
      vertical: number;
      pan: number;
      tilt: number;
      roll: number;
      zoom: number;
    };
  };
  mode?: 'std' | 'pro';
  version?: '1.0' | '1.5' | '1.6' | '2.0';
  image_url?: string;
  image_tail_url?: string;
}

export async function generateVideo(
  prompt: string,
  model: string = 'kling',
  options: Partial<KlingInput> = {}
): Promise<PiapiResponse> {
  console.log('=== Starting Video Generation ===');
  console.log('Input parameters:', { prompt, model, options });
  
  try {
    const requestBody = {
      model: model,
      task_type: 'video_generation',
      input: {
        prompt,
        negative_prompt: options.negative_prompt || '',
        cfg_scale: options.cfg_scale || 0.5,
        duration: options.duration || 5,
        aspect_ratio: options.aspect_ratio || '16:9',
        camera_control: options.camera_control,
        mode: options.mode || 'std',
        version: options.version || '1.0',
        image_url: options.image_url,
        image_tail_url: options.image_tail_url
      },
      config: {
        service_mode: 'public',
        webhook_config: {
          endpoint: '',
          secret: ''
        }
      }
    };

    console.log('Sending request to PIAPI:', JSON.stringify(requestBody, null, 2));

    const response = await fetch(`${PIAPI_BASE_URL}/task`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.PIAPI_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('PIAPI Response Status:', response.status);
    console.log('PIAPI Response Headers:', response.headers);

    if (!response.ok) {
      const error = await response.json();
      console.error('PIAPI Error Response:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate video',
      };
    }

    const data = await response.json();
    console.log('PIAPI Success Response:', JSON.stringify(data, null, 2));

    if (data.code !== 200) {
      console.error('PIAPI Error Code:', data.code);
      return {
        success: false,
        error: data.message || 'Failed to generate video',
      };
    }

    console.log('=== Video Generation Started Successfully ===');
    console.log('Task ID:', data.data.task_id);
    console.log('Initial Status:', data.data.status);

    return {
      success: true,
      data: {
        taskId: data.data.task_id,
        status: data.data.status
      },
    };
  } catch (error) {
    console.error('=== Video Generation Error ===');
    console.error('Error details:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

export async function getVideoStatus(taskId: string): Promise<PiapiResponse> {
  console.log('=== Checking Video Status ===');
  console.log('Task ID:', taskId);
  
  try {
    const response = await fetch(`${PIAPI_BASE_URL}/task/${taskId}`, {
      headers: {
        'X-API-KEY': process.env.PIAPI_API_KEY,
      },
    });

    console.log('Status Check Response Status:', response.status);
    console.log('Status Check Response Headers:', response.headers);

    if (!response.ok) {
      const error = await response.json();
      console.error('Status Check Error Response:', error);
      return {
        success: false,
        error: error.message || 'Failed to get video status',
      };
    }

    const data = await response.json();
    console.log('Status Check Response:', JSON.stringify(data, null, 2));

    if (data.code !== 200) {
      console.error('Status Check Error Code:', data.code);
      return {
        success: false,
        error: data.message || 'Failed to get video status',
      };
    }

    const videoData = data.data;
    const videoUrl = videoData.output?.works?.[0]?.video?.resource_without_watermark;

    console.log('=== Video Status Details ===');
    console.log('Current Status:', videoData.status);
    console.log('Video URL:', videoUrl);
    console.log('Duration:', videoData.output?.works?.[0]?.video?.duration);
    console.log('Resolution:', {
      width: videoData.output?.works?.[0]?.video?.width,
      height: videoData.output?.works?.[0]?.video?.height,
    });

    return {
      success: true,
      data: {
        status: videoData.status,
        videoUrl,
        duration: videoData.output?.works?.[0]?.video?.duration,
        resolution: {
          width: videoData.output?.works?.[0]?.video?.width,
          height: videoData.output?.works?.[0]?.video?.height,
        },
        fps: 30,
      },
    };
  } catch (error) {
    console.error('=== Status Check Error ===');
    console.error('Error details:', error);
    if (error instanceof Error) {
      console.error('Error stack:', error.stack);
    }
    return {
      success: false,
      error: 'An unexpected error occurred',
    };
  }
}

export async function downloadVideo(taskId: string): Promise<PiapiResponse> {
  console.log('=== Starting Video Download ===');
  console.log('Task ID:', taskId);
  
  const statusResponse = await getVideoStatus(taskId);
  
  if (!statusResponse.success) {
    console.error('Download failed - Status check failed:', statusResponse.error);
    return statusResponse;
  }

  console.log('=== Video Download Complete ===');
  console.log('Video URL:', statusResponse.data.videoUrl);

  return {
    success: true,
    data: {
      url: statusResponse.data.videoUrl
    }
  };
} 