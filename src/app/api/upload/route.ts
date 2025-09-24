import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Books from '@/models/books';

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    // Get the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read the chunk content
    const chunkContent = await file.text();
    const chunkData = JSON.parse(chunkContent);

    if (!Array.isArray(chunkData) || chunkData.length === 0) {
      return NextResponse.json(
        { error: 'Invalid chunk data or empty chunk' },
        { status: 400 }
      );
    }
    
    // Create new documents in MongoDB for this chunk
    const csvDoc = await Books.insertMany(chunkData);

    return NextResponse.json({
      message: 'File uploaded successfully',
      data: csvDoc,
      success: true,
    }, {
      status: 200,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({
      error: 'Failed to upload file',
    }, {
      status: 500,
    });
  }
}
