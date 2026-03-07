export default function HomeLoading() {
  return (
    <div className="space-y-10 animate-pulse">
      {/* Hero banner skeleton */}
      <div className="skeleton h-80 w-full rounded-2xl" />

      {/* Sections */}
      {[1, 2, 3].map((s) => (
        <div key={s} className="space-y-4">
          <div className="skeleton h-6 w-40 rounded-lg" />
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton h-52 w-36 flex-shrink-0 rounded-xl" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
