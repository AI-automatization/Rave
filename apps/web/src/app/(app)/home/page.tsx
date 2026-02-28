import type { Metadata } from 'next';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { HeroBanner } from '@/components/movie/HeroBanner';
import { MovieCard } from '@/components/movie/MovieCard';
import { logger } from '@/lib/logger';
import type { ApiResponse, IMovie } from '@/types';

export const metadata: Metadata = { title: 'Bosh sahifa' };

// ISR — har 10 daqiqada yangilash
export const revalidate = 600;

async function fetchMovies(path: string): Promise<IMovie[]> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost';
  try {
    const res = await fetch(`${base}${path}`, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const json: ApiResponse<{ movies: IMovie[] }> = await res.json() as ApiResponse<{ movies: IMovie[] }>;
    return json.data?.movies ?? [];
  } catch (err) {
    logger.error(`fetchMovies xatosi: ${path}`, err);
    return [];
  }
}

export default async function HomePage() {
  const [trending, topRated, recent] = await Promise.all([
    fetchMovies('/movies?sort=viewCount&limit=10'),
    fetchMovies('/movies?sort=rating&limit=10'),
    fetchMovies('/movies?sort=createdAt&limit=10'),
  ]);

  const hero = trending[0] ?? topRated[0];

  return (
    <div className="space-y-10">
      {/* Hero Banner */}
      {hero && <HeroBanner movie={hero} />}

      {/* Trending */}
      <Section title="Trendda" href="/movies?sort=trending" movies={trending} />

      {/* Top Rated */}
      <Section title="Eng yuqori reyting" href="/movies?sort=rating" movies={topRated} />

      {/* Recent */}
      <Section title="Yangi qo'shilganlar" href="/movies?sort=new" movies={recent} />
    </div>
  );
}

function Section({ title, href, movies }: { title: string; href: string; movies: IMovie[] }) {
  if (movies.length === 0) return null;
  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-display">{title.toUpperCase()}</h2>
        <Link href={href} className="flex items-center gap-1 text-sm text-primary hover:underline">
          Hammasi <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {movies.slice(0, 10).map((movie) => (
          <MovieCard key={movie._id} movie={movie} />
        ))}
      </div>
    </section>
  );
}
