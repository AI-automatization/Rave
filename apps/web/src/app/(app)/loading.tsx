// Umumiy (app) loading — Next.js avtomatik ko'rsatadi navigatsiya paytida
export default function AppLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="skeleton h-8 w-48 rounded-lg" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="skeleton h-32 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
