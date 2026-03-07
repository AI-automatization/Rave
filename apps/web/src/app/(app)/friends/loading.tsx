export default function FriendsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="skeleton h-8 w-36 rounded-lg" />

      {/* Tab bar skeleton */}
      <div className="skeleton h-10 w-72 rounded-xl" />

      {/* Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton h-20 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
