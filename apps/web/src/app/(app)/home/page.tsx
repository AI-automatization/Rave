import type { Metadata } from 'next';
import { HeroBanner } from '@/components/movie/HeroBanner';
import { HomeSection } from '@/components/home/HomeSection';
import { logger } from '@/lib/logger';
import type { ApiResponse, IMovie } from '@/types';

export const metadata: Metadata = { title: 'Bosh sahifa' };

export const revalidate = 600;

async function fetchMovies(path: string): Promise<IMovie[]> {
  const base = process.env.CONTENT_SERVICE_URL ?? 'http://localhost:3003/api/v1';
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
      {hero && <HeroBanner movie={hero} />}
      <HomeSection sectionKey="trending" href="/movies?sort=trending" movies={trending} />
      <HomeSection sectionKey="topRated" href="/movies?sort=rating" movies={topRated} />
      <HomeSection sectionKey="recent" href="/movies?sort=new" movies={recent} />
    </div>
  );
}
