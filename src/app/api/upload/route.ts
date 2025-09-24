import { NextRequest, NextResponse } from 'next/server';
import { parse,  } from 'papaparse';
import dbConnect from '@/lib/mongodb';
import Books from '@/models/books';
import { Schema } from 'mongoose';

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

    // Read the file content
    const fileContent = await file.text();

    // Parse CSV content
    const parseFile = parse(fileContent, {
      header: true,
      skipEmptyLines: true
    });

    console.log("CSV Headers:", parseFile.meta.fields);
    console.log("First row of data:", parseFile.data[0]);

    if (!parseFile.data || parseFile.data.length === 0) {
      return NextResponse.json(
        { error: 'Invalid CSV file or empty data' },
        { status: 400 }
      );
    }
    
    // Create new CSV document in MongoDB
    const csvDoc = await Books.insertMany(parseFile.data);

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
