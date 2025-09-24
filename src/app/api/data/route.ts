import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import books from '../../../models/books';

export const GET = async (req: Request) => {
  try {
    await dbConnect();
    const params = new URL(req.url).searchParams;
    const page = parseInt(params.get('page') || '1', 10);
    const limit = parseInt(params.get('limit') || '10', 10);
    const yearFilter = params.get('publishedyear') as 'asc' | 'desc';
    // const authorFilter = params.get('author') as 'asc' | 'desc';

    const totalCount = await books.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    const res = await books.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({  PublishedYear: yearFilter });

    return NextResponse.json({
      data: res,
      status: 200,
      pagination: {
        page,
        limit,
        totalItems: totalCount,
        totalPages: totalPages,
      },
      message: 'Data fetched successfully',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
};


export async function PUT(req: NextRequest) {
  try {
    await dbConnect();

    const data = await req.json();
    const { _id, ...updateData } = data;

    const updatedBook = await books.findByIdAndUpdate(
      _id,
      updateData,
      { new: true }
    );

    if (!updatedBook) {
      return NextResponse.json(
        { error: 'Book not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Book updated successfully',
      data: updatedBook,
      success: true,
    });
  } catch (error) {
    console.error('Update error:', error);
    return NextResponse.json({
      error: 'Failed to update book',
    }, {
      status: 500,
    });
  }
}

export const DELETE = async (req: Request) => {
  try {
    await dbConnect();

    const id = new URL(req.url).searchParams.get('id');

    await books.deleteOne({ _id: id })
    return NextResponse.json({ message: 'Delete the book successfully', status: 200 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete books' }, { status: 500 });
  }
};