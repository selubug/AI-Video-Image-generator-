import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';

export async function GET(req: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not initialized' },
        { status: 500 }
      );
    }

    // Test table access
    const { data: testData, error: testError } = await supabase
      .from('generated_images')
      .select('id')
      .limit(1);

    if (testError) {
      return NextResponse.json(
        { 
          error: 'Table access failed',
          details: {
            code: testError.code,
            message: testError.message,
            details: testError.details
          }
        },
        { status: 500 }
      );
    }

    // Test insert permissions
    const testId = 'test-' + Date.now();
    const { error: insertError } = await supabase
      .from('generated_images')
      .insert({
        id: testId,
        user_id: 'test-user',
        prompt: 'test prompt',
        model: 'test-model',
        image_url: 'test-url',
        created_at: new Date().toISOString()
      });

    if (insertError) {
      return NextResponse.json(
        { 
          error: 'Insert test failed',
          details: {
            code: insertError.code,
            message: insertError.message,
            details: insertError.details
          }
        },
        { status: 500 }
      );
    }

    // Clean up test data
    await supabase
      .from('generated_images')
      .delete()
      .eq('id', testId);

    return NextResponse.json({
      status: 'success',
      message: 'Database connection and permissions verified',
      tableAccess: 'success',
      insertPermissions: 'success'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json(
      { 
        error: 'Database test failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 