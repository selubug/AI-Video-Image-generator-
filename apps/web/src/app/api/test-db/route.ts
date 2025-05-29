import { NextResponse } from 'next/server';
import { supabase } from '@/utils/supabase';
import { setupGeneratedImagesTable } from '@/utils/supabase-migrations';

export async function GET(req: Request) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client not initialized' },
        { status: 500 }
      );
    }

    // Run the setup function
    await setupGeneratedImagesTable();

    // Test a simple query
    const { data, error } = await supabase
      .from('generated_images')
      .select('*')
      .limit(1);

    if (error) {
      return NextResponse.json(
        { 
          error: 'Database test failed',
          details: error
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      status: 'success',
      message: 'Database connection and table setup verified',
      sampleData: data
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