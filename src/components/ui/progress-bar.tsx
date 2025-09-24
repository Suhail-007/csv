interface ProgressBarProps {
  progress: number;
  total: number;
}

export default function ProgressBar({ progress, total }: ProgressBarProps) {
  const percentage = Math.round((progress / total) * 100);

  return (
    <div className="w-full mt-4">
      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
      <div className="text-sm text-gray-500 mt-1">
        {percentage}% - {progress} of {total} records processed
      </div>
    </div>
  );
}