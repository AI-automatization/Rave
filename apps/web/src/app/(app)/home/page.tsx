import type { Metadata } from 'next';
import { HeroBanner } from '@/components/movie/HeroBanner';
import { HomeSection } from '@/components/home/HomeSection';
import { WatchPartyBar } from '@/components/home/WatchPartyBar';
import { logger } from '@/lib/logger';
import type { ApiResponse, IMovie } from '@/types';

export const metadata: Metadata = { title: 'Bosh sahifa' };

export const revalidate = 600;

async function fetchMovies(path: string): Promise<IMovie[]> {
  const base = process.env.CONTENT_SERVICE_URL ?? 'https://content-production-4e08.up.railway.app/api/v1';
  try {
    const res = await fetch(`${base}${path}`, { next: { revalidate: 600 } });
    if (!res.ok) return [];
    const json: ApiResponse<IMovie[]> = await res.json() as ApiResponse<IMovie[]>;
    return json.data ?? [];
  } catch (err) {
    logger.error(`fetchMovies xatosi: ${path}`, err);
    return [];
  }
}

export default async function HomePage() {
  const [trending, topRated, recent] = await Promise.all([
    fetchMovies('/content/movies?sort=viewCount&limit=10'),
    fetchMovies('/content/movies?sort=rating&limit=10'),
    fetchMovies('/content/movies?sort=createdAt&limit=10'),
  ]);

  const hero = trending[0] ?? topRated[0];

  return (
    <div className="space-y-10">
      {hero && <HeroBanner movie={hero} />}
      <WatchPartyBar />
      <HomeSection sectionKey="trending" href="/movies?sort=trending" movies={trending} />
      <HomeSection sectionKey="topRated" href="/movies?sort=rating" movies={topRated} />
      <HomeSection sectionKey="recent" href="/movies?sort=new" movies={recent} />
    </div>
  );
}
