// leaving this here cuz I like how it looks... delete if you don't want it
const SkeletonEventCard2 = () => (
  <div className="w-full max-w-sm animate-pulse rounded-lg bg-gray-100 shadow-lg">
    <div className="h-48 w-full rounded-t-lg bg-gray-300" />
    <div className="space-y-4 p-6">
      <div className="h-6 w-3/4 rounded bg-gray-300" />
      <div className="space-y-2">
        <div className="h-4 w-full rounded bg-gray-300" />
        <div className="h-4 w-5/6 rounded bg-gray-300" />
        <div className="h-4 w-4/6 rounded bg-gray-300" />
        <div className="h-4 w-3/6 rounded bg-gray-300" />
      </div>
    </div>
  </div>
);

const SkeletonEventCard = () => (
  <div className="w-full max-w-sm animate-pulse rounded-lg bg-gray-100 shadow-lg">
    <div className="flex flex-col space-y-4 p-6">
      <div className="w-ful flex h-8 flex-col rounded bg-gray-300" />
      <div className="space-y-3">
        <div className="h-6 w-5/6 rounded bg-gray-300" />
        <div className="h-6 w-4/6 rounded bg-gray-300" />
        <div className="h-6 w-5/6 rounded bg-gray-300" />
        <div className="h-6 w-4/6 rounded bg-gray-300" />
      </div>
      <div className="h-8 w-5/6 self-center rounded bg-gray-300" />
    </div>
  </div>
);

export default function SkeletonEventSection() {
  return (
    <section className="p-3">
      <div className="mb-6 h-10 w-1/4 rounded bg-gray-200 md:mb-8 md:h-12" />
      <div className="grid grid-cols-1 justify-items-center gap-4 md:grid-cols-2 md:justify-items-start lg:grid-cols-3">
        {[...Array(3)].map((_, i) => (
          <SkeletonEventCard key={i} />
        ))}
      </div>
    </section>
  );
}
