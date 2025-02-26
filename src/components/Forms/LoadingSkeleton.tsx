const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-6 p-4">
    <div className="mx-auto max-w-2xl rounded-lg bg-white p-4 shadow-lg sm:p-6">
      <div className="space-y-6">
        {/* Event Details Section */}
        <div>
          <div className="mb-3 h-6 w-1/3 rounded bg-gray-300"></div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-10 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
            <div className="h-16 rounded bg-gray-200 md:col-span-2"></div>
          </div>
        </div>

        {/* Date & Time Section */}
        <div>
          <div className="mb-3 h-6 w-1/3 rounded bg-gray-300"></div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="h-10 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200"></div>
            <div className="h-10 rounded bg-gray-200 md:col-span-2"></div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <div className="h-10 w-24 rounded bg-gray-300"></div>
          <div className="h-10 w-32 rounded bg-gray-400"></div>
        </div>
      </div>
    </div>
  </div>
);

export default LoadingSkeleton;
