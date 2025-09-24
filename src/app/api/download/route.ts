import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Books from '@/models/books';
import { unparse } from 'papaparse';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    // Get all books from the database
    const books = await Books.find({}, { _id: 0, __v: 0 }); // Exclude MongoDB specific fields

    // Convert the data to CSV format
    const csv = unparse(books, {
      header: true, // Include headers
      columns: ['Title', 'Author', 'Genre', 'PublishedYear', 'ISBN'] // Specify columns and their order
    });

    // Create response with CSV data
    const response = new NextResponse(csv);

    // Set headers for file download
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set('Content-Disposition', 'attachment; filename="books.csv"');

    return response;
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json({
      error: 'Failed to download CSV',
    }, {
      status: 500,
    });
  }
}