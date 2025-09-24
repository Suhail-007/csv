import { NextResponse } from 'next/server';
import dbConnect from '../../../lib/mongodb';
import books from '../../../models/books';

export const GET = async (req: Request) => {
  try {
    await dbConnect();
    const params = new URL(req.url).searchParams;
    const page = parseInt(params.get('page') || '1', 10);
    const limit = parseInt(params.get('limit') || '10', 10);
    const yearFilter = params.get('publishedyear') === 'asc' ? 1 : -1;
    const authorFilter = params.get('author') === 'asc' ? 1 : -1;

    const totalCount = await books.countDocuments();
    const totalPages = Math.ceil(totalCount / limit);

    const res = await books.find()
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ Author: authorFilter, PublishedYear: yearFilter });

    return NextResponse.json({
      data: res[0],
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
