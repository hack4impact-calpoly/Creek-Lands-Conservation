const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-4 p-4">
    <div className="mx-auto h-8 w-1/2 rounded bg-gray-200"></div>
    <div className="space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-10 rounded bg-gray-100"></div>
      ))}
    </div>
  </div>
);

export default LoadingSkeleton;
