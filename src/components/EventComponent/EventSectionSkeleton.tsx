const SkeletonEventCard = () => (
  <div className="w-full max-w-sm animate-pulse rounded-lg border border-gray-200 bg-white shadow-md">
    <div className="flex flex-col space-y-4 p-6">
      <div className="h-8 w-3/4 rounded bg-gray-200" />
      <div className="space-y-3">
        <div className="h-4 w-5/6 rounded bg-gray-200" />
        <div className="h-4 w-4/6 rounded bg-gray-200" />
        <div className="h-4 w-5/6 rounded bg-gray-200" />
        <div className="h-4 w-4/6 rounded bg-gray-200" />
      </div>
      <div className="h-10 w-1/2 self-center rounded bg-gray-200" />
    </div>
  </div>
);

export default function SkeletonEventSection({ title }: { title: string }) {
  return (
    <section className="mb-12">
      <div className="mb-6 flex items-center justify-between">
        <div className="animate-pulse">
          <div className="mb-1 h-8 w-48 rounded bg-gray-200" />
          <div className="h-4 w-24 rounded bg-gray-200" />
        </div>
        <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <SkeletonEventCard key={i} />
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <div className="h-10 w-40 animate-pulse rounded bg-gray-200" />
      </div>
    </section>
  );
}
