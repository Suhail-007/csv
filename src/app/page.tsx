'use client';

import { useState, useRef, useEffect } from 'react';
import ProgressBar from '../components/ui/progress-bar';
import EditModal from '../components/pages/home/components/edit-modal';
import { SortConfig, createQueryFilter } from '@/lib/getData';
import { parse } from 'papaparse';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Conditional from '../components/ui/conditional';

type Pagination = {
  limit: number;
  page: number;
  totalItems: number;
  totalPages: number;
};

type UploadProgress = {
  processed: number;
  total: number;
};

export type Book = {
  _id: string;
  Title: string;
  Author: string;
  Genre: string;
  PublishedYear: number;
  ISBN: string;
};

type Data = {
  data: Book[];
  status: number;
  pagination: Pagination;
  message: string;
};

const fetchData = async (page: number, limit: number, sort: SortConfig) => {
  try {
    const params = createQueryFilter({ page: page, limit, ...sort });
    const url = `/api/data${params ? params : ''}`;
    const res = await fetch(url);
    const data: Promise<Data> = await res.json();

    return data;
  } catch (err: unknown) {
    console.error(err);
  }
};

const headers = ['Title', 'Author', 'Genre', 'PublishedYear', 'ISBN', 'Action'];

export default function Home() {
  const [isUpdating, setIsUpdating] = useState(false);
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress>({ processed: 0, total: 0 });
  const inputRef = useRef<null | HTMLInputElement>(null);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState({
    id: '',
    isLoading: false,
  });

  const [pagination, setPagination] = useState<Pagination>({
    limit: 10,
    page: 1,
    totalItems: 0,
    totalPages: 0,
  });
  const [sort, setSort] = useState<SortConfig>({
    publishedyear: 'asc',
    // author: 'asc',
  });
  const [error, setError] = useState('');

  const {
    isLoading: loading,
    error: fetchError,
    data: booksData,
  } = useQuery({
    queryKey: ['books', pagination.page, pagination.limit, sort],
    queryFn: () => fetchData(pagination.page, pagination.limit, sort),
  });

  useEffect(() => {
    if (booksData?.pagination) {
      setPagination(booksData.pagination);
    }
  }, [booksData?.pagination]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const response = await fetch('/api/download');

      if (!response.ok) {
        throw new Error('Failed to download CSV');
      }

      // Create a blob from the response
      const blob = await response.blob();

      // Create a temporary URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link element
      const link = document.createElement('a');
      link.href = url;
      link.download = `books_${new Date().toISOString().split('T')[0]}.csv`;

      // Append link to body, click it, and remove it
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up the temporary URL
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download CSV');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSaveBook = async (updatedBook: Book) => {
    try {
      const response = await fetch(`/api/data?id=${updatedBook._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedBook),
      });

      if (!response.ok) {
        throw new Error('Failed to update book');
      }

      // Invalidate and refetch the books query
      await queryClient.invalidateQueries({ queryKey: ['books', pagination.page, pagination.limit, sort] });
    } catch (error) {
      console.error('Error updating book:', error);
      setError('Failed to update book');
    } finally {
      setEditingBook(null);
      setIsUpdating(false);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    setUploading(true);
    setError('');
    setUploadProgress({ processed: 0, total: 0 });

    // First, parse the file locally to get the total count and validate
    const reader = new FileReader();
    reader.onload = async event => {
      try {
        parse(event.target?.result as string, {
          header: true,
          skipEmptyLines: true,
          complete: async results => {
            const total = results.data.length;
            setUploadProgress(prev => ({ ...prev, total }));

            // Now upload in chunks
            const CHUNK_SIZE = 1000;
            const chunks = [];

            for (let i = 0; i < results.data.length; i += CHUNK_SIZE) {
              chunks.push(results.data.slice(i, i + CHUNK_SIZE));
            }

            for (let i = 0; i < chunks.length; i++) {
              const formData = new FormData();
              const blob = new Blob([JSON.stringify(chunks[i])], {
                type: 'application/json',
              });
              formData.append('file', blob, 'chunk.json');
              // formData.append('chunkIndex', i.toString());
              // formData.append('totalChunks', chunks.length.toString());

              const response = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
              });

              if (!response.ok) throw new Error('Upload failed');

              setUploadProgress(prev => ({
                ...prev,
                processed: Math.min((i + 1) * CHUNK_SIZE, total),
              }));
            }

            if (inputRef.current) {
              inputRef.current.value = '';
            }

            setFile(null);
            setUploading(false);
            queryClient.invalidateQueries({ queryKey: ['books', pagination.page, pagination.limit, sort] });
          },
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process file');
        setUploading(false);
      }
    };

    reader.readAsText(file);
  };

  const handleDelete = async (id: string) => {
    try {
      setIsDeleteLoading({
        id,
        isLoading: true,
      });
      const res = await fetch(`/api/data?id=${id}`, {
        method: 'DELETE',
      });

      if (res.status === 200) {
        alert('Book deleted successfully');
      } else {
        alert('Failed to delete book');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsDeleteLoading({
        id: '',
        isLoading: false,
      });
    }
  };

  return (
    <main className='min-h-screen p-8'>
      <div className='max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold mb-8'>CSV File Upload and Display</h1>

        {/* Upload and Download Section */}
        <div className='mb-8 p-4 border rounded-lg'>
          <div className='flex flex-wrap items-center gap-4 mb-4'>
            <div className='flex-1'>
              <input ref={inputRef} type='file' accept='.csv' onChange={handleFileChange} className='max-w-full' />
            </div>
            <div className='flex gap-2'>
              <button
                onClick={handleUpload}
                disabled={uploading || !file}
                className='px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-400 hover:bg-blue-600'>
                {uploading ? 'Uploading...' : 'Upload CSV'}
              </button>
              <button
                onClick={handleDownload}
                disabled={isDownloading || !booksData?.data?.length}
                className='px-4 py-2 bg-green-500 text-white rounded disabled:bg-gray-400 hover:bg-green-600'>
                {isDownloading ? 'Downloading...' : 'Download CSV'}
              </button>
            </div>
          </div>
          {error && <p className='text-red-500 mt-2'>{error}</p>}
          {uploading && uploadProgress.total > 0 && (
            <ProgressBar progress={uploadProgress.processed} total={uploadProgress.total} />
          )}
        </div>

        {/* Data Table */}
        <div className='overflow-x-auto'>
          {!!fetchError && (
            <p className='text-red-500 mt-2'>
              {fetchError instanceof Error ? fetchError.message : 'Failed to fetch data'}
            </p>
          )}

          <table className='min-w-full border rounded-lg'>
            <thead className='bg-blue-500'>
              <tr>
                {headers.map((header, index) => (
                  <th
                    key={index}
                    className='px-4 py-2 border cursor-pointer hover:bg-blue-600'
                    onClick={() => {
                      if (header.toLowerCase() !== 'publishedyear') return;

                      setSort(prev => {
                        return {
                          ...prev,
                          [header.toLowerCase()]: prev[header.toLowerCase()] === 'asc' ? 'desc' : 'asc',
                        };
                      });
                    }}>
                    <div className='flex items-center text-white justify-between'>
                      <span>{header}</span>
                      <Conditional condition={header.toLowerCase() === 'publishedyear'}>
                        <span className='ml-2 text-red'>{sort.publishedyear === 'asc' ? '↑' : '↓'}</span>
                      </Conditional>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <Conditional condition={loading}>
                {Array.from({ length: 5 }).map((_, rowIndex) => (
                  <tr key={rowIndex} className='hover:bg-gray-50'>
                    {Array.from({ length: 5 }).map((_, colIndex) => (
                      <td key={colIndex} className='px-4 py-4 border animate-pulse'>
                        <div className='h-4 bg-gray-200 rounded-full animate-pulse'></div>
                      </td>
                    ))}
                  </tr>
                ))}
              </Conditional>
              <Conditional condition={!loading && (booksData?.data?.length === 0 || !booksData)}>
                <tr>
                  <td colSpan={headers.length} className='px-4 py-2 border text-white'>
                    No data found
                  </td>
                </tr>
              </Conditional>
              <Conditional condition={(booksData && booksData?.data?.length > 0 ? true : false) && !loading}>
                {booksData?.data?.map((row, rowIndex) => (
                  <tr key={rowIndex} className='hover:bg-[#eee] dark:hover:bg-gray-600'>
                    {headers.map((header, colIndex) => (
                      <td key={colIndex} className='px-4 py-2 border'>
                        {header === 'Action' ? (
                          <div className='flex gap-2'>
                            <button
                              onClick={() => setEditingBook(row)}
                              className='px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600'>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(row._id)}
                              className='px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600'>
                              <Conditional condition={isDeleteLoading.id === row._id && isDeleteLoading.isLoading}>
                                Deleting...
                              </Conditional>
                              <Conditional condition={isDeleteLoading.id !== row._id}>Delete</Conditional>
                            </button>
                          </div>
                        ) : (
                          row[header as keyof Book]
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </Conditional>
            </tbody>
          </table>

          {/* Pagination */}
          <Conditional condition={!!booksData?.data?.length}>
            <div className='mt-4 flex justify-center gap-2'>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                disabled={pagination?.page === 1}
                className='px-3 py-1 border bg-blue-900 text-white rounded dark:disabled:bg-gray-400 disabled:bg-gray-900'>
                Previous
              </button>
              <span className='px-3 py-1'>
                Page {pagination?.page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                disabled={pagination?.page === pagination.totalPages}
                className='px-3 py-1 border bg-blue-900 text-white rounded dark:disabled:bg-gray-400 disabled:bg-gray-900'>
                Next
              </button>
            </div>
          </Conditional>
        </div>
      </div>

      {/* Edit Modal */}
      {editingBook && (
        <EditModal
          setIsLoading={setIsUpdating}
          isLoading={isUpdating}
          isOpen={!!editingBook}
          onClose={() => setEditingBook(null)}
          bookData={editingBook}
          onSave={handleSaveBook}
        />
      )}
    </main>
  );
}
