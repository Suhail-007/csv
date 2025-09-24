import { Book } from "../../../../app/page";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookData:Book;
  onSave: (updatedBook: Book) => Promise<void>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
}

export default function EditModal({ isOpen, onClose, bookData, onSave, setIsLoading, isLoading }: EditModalProps) {
  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    setIsLoading(true);
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const updatedBook: Book = {
      _id: bookData._id,
      Title: formData.get('Title') as string,
      Author: formData.get('Author') as string,
      Genre: formData.get('Genre') as string,
      PublishedYear: parseInt(formData.get('PublishedYear') as string, 10),
      ISBN: formData.get('ISBN') as string,
    };

    await onSave(updatedBook);
    onClose();

  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Edit Book</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="Title" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Title
            </label>
            <input
              type="text"
              name="Title"
              id="Title"
              defaultValue={bookData.Title}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label htmlFor="Author" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Author
            </label>
            <input
              type="text"
              name="Author"
              id="Author"
              defaultValue={bookData.Author}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label htmlFor="Genre" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Genre
            </label>
            <input
              type="text"
              name="Genre"
              id="Genre"
              defaultValue={bookData.Genre}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label htmlFor="PublishedYear" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              Published Year
            </label>
            <input
              type="number"
              name="PublishedYear"
              id="PublishedYear"
              defaultValue={bookData.PublishedYear}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div>
            <label htmlFor="ISBN" className="block text-sm font-medium text-gray-700 dark:text-gray-200">
              ISBN
            </label>
            <input
              type="text"
              name="ISBN"
              id="ISBN"
              defaultValue={bookData.ISBN}
              required
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 dark:bg-gray-700 dark:border-gray-600"
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
             {!isLoading ? 'Save Changes' :'Saving...'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}