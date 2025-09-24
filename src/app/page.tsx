'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Conditional from '../components/ui/conditional';
import { SortConfig, createQueryFilter } from '@/lib/getData';

interface BooksData {
  books: any[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
  };
}

type Pagination = {
  limit: number;
  page: number;
  totalItems: number;
  totalPages: number;
};

const headers = ['Title', 'Author', 'Genre', 'PublishedYear', 'ISBN'];

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<null | HTMLInputElement>(null);

  const [booksData, setBooksData] = useState<BooksData | null>(null);
  const [pagination, setPagination] = useState<Pagination>({
    limit: 10,
    page: 0,
    totalItems: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState<SortConfig>({
    publishedyear: 'asc',
    author: 'asc',
  });

  const fetchData = useCallback(
    async (page: number) => {
      try {
        setLoading(true);
        const params = createQueryFilter({ page: page, limit: pagination.limit, ...sort });
        const url = `/api/data${params ? params : ''}`;
        const res = await fetch(url);
        const data = await res.json();
        setBooksData(data?.data);
        // setPagination({ ...data?.pagination, page });
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, sort]
  );

  useEffect(() => {
    fetchData(1);
  }, [fetchData]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setError('');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      if (inputRef.current) {
        inputRef.current.value = ''
      };

      await fetchData(1);
      setFile(null);
    } catch (err) {
      setError('Failed to upload file');
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const logger = (data: any) => {
    console.log(data);

    return null;
  };

  return (
    <main className='min-h-screen p-8'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold mb-8'>CSV File Upload and Display</h1>

        {/* Upload Section */}
        <div className='mb-8 p-4 border rounded-lg'>
          <input ref={inputRef} type='file' accept='.csv' onChange={handleFileChange} className='mb-4' />
          <button
            onClick={handleUpload}
            disabled={uploading || !file}
            className='px-4 py-2 bg-blue-500 rounded disabled:bg-gray-400'>
            {uploading ? 'Uploading...' : 'Upload CSV'}
          </button>
          {error && <p className='text-red-500 mt-2'>{error}</p>}
        </div>

        {/* Data Table */}
        <div className='overflow-x-auto'>
          <table className='min-w-full border rounded-lg'>
            <thead className='bg-blue-500'>
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className='px-4 py-2 border cursor-pointer hover:bg-blue-600'
                    onClick={() => {
                      if (header.toLowerCase() !== 'publishedyear' && header.toLowerCase() !== 'author') return;
                      setSort(prev => ({
                        ...prev,
                        [header.toLowerCase()]: prev[header.toLowerCase()] === 'asc' ? 'desc' : 'asc',
                      }));
                    }}>
                    <div className='flex items-center justify-between'>
                      <span>{header}</span>
                      {/* {logger(sort[header.toLowerCase()])} */}
                      {logger(header.toLowerCase())}
                      <Conditional condition={sort[header.toLowerCase()] === header.toLowerCase()}>
                        <span className='ml-2'>{sort[header.toLowerCase()] === 'asc' ? '↑' : '↓'}</span>
                      </Conditional>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <Conditional condition={loading}>
                {Array.from({ length: 10 }).map((_, rowIndex) => (
                  <tr key={rowIndex} className='hover:bg-gray-50'>
                    {Array.from({ length: 5 }).map((_, colIndex) => (
                      <td key={colIndex} className='px-4 py-4 border animate-pulse'></td>
                    ))}
                  </tr>
                ))}
              </Conditional>
              <Conditional condition={!loading && booksData?.books.length === 0}>
                <tr>
                  <td colSpan={headers.length} className='px-4 py-2 border text-white'>
                    No data found
                  </td>
                </tr>
              </Conditional>
              <Conditional condition={(booksData && booksData.books.length > 0 ? true : false) && !loading}>
                {booksData?.books.map((row, rowIndex) => (
                  <tr key={rowIndex} className='hover:bg-gray-700'>
                    {headers.map((header, colIndex) => (
                      <td key={colIndex} className='px-4 py-2 border'>
                        {row[header]}
                      </td>
                    ))}
                  </tr>
                ))}
              </Conditional>
            </tbody>
          </table>

          {/* Pagination */}
          <Conditional condition={pagination?.totalPages > 1}>
            <div className='mt-4 flex justify-center gap-2'>
              <button
                onClick={() => fetchData(pagination?.page - 1)}
                disabled={pagination?.page === 1}
                className='px-3 py-1 border bg-blue-900 text-white rounded disabled:bg-gray-900'>
                Previous
              </button>
              <span className='px-3 py-1'>
                Page {pagination?.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => fetchData(pagination?.page + 1)}
                disabled={pagination?.page === pagination.totalPages}
                className='px-3 py-1 border bg-blue-900 text-white rounded disabled:bg-gray-900'>
                Next
              </button>
            </div>
          </Conditional>
        </div>
      </div>
    </main>
  );
}
