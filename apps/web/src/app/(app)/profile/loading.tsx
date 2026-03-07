export default function ProfileLoading() {
  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-pulse">
      {/* Profile card */}
      <div className="skeleton h-48 w-full rounded-2xl" />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>

      {/* Achievements */}
      <div className="space-y-3">
        <div className="skeleton h-6 w-36 rounded-lg" />
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
