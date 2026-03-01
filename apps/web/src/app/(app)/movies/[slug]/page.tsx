import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { FaPlay, FaUsers, FaStar, FaClock, FaCalendarAlt, FaEye } from 'react-icons/fa';
import { logger } from '@/lib/logger';
import type { ApiResponse, IMovie } from '@/types';

interface Props {
  params: { slug: string };
}

const BASE_URL = process.env.CONTENT_SERVICE_URL ?? 'http://localhost:3003/api/v1';

async function fetchMovie(slug: string): Promise<IMovie | null> {
  try {
    const res = await fetch(`${BASE_URL}/movies/slug/${slug}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return null;
    const json: ApiResponse<IMovie> = await res.json() as ApiResponse<IMovie>;
    return json.data;
  } catch (err) {
    logger.error('fetchMovie xatosi', err);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const movie = await fetchMovie(params.slug);
  if (!movie) return { title: 'Film topilmadi' };
  return {
    title: movie.title,
    description: movie.description.slice(0, 160),
    openGraph: {
      title: `${movie.title} | CineSync`,
      description: movie.description.slice(0, 160),
      images: [movie.backdrop ?? movie.poster],
      type: 'video.movie',
    },
    twitter: {
      card: 'summary_large_image',
      title: movie.title,
      images: [movie.backdrop ?? movie.poster],
    },
  };
}

export default async function MovieDetailPage({ params }: Props) {
  const movie = await fetchMovie(params.slug);
  if (!movie) notFound();

  const durationH = Math.floor(movie.duration / 60);
  const durationM = movie.duration % 60;

  return (
    <>
      {/* JSON-LD Movie schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Movie',
            name: movie.title,
            datePublished: String(movie.year),
            description: movie.description,
            director: movie.director ? { '@type': 'Person', name: movie.director } : undefined,
            genre: movie.genres,
            duration: `PT${durationH}H${durationM}M`,
            image: movie.poster,
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: movie.rating,
              bestRating: 10,
              ratingCount: movie.reviewCount,
            },
          }),
        }}
      />

      <div className="space-y-6">
        {/* Backdrop */}
        <div className="relative w-full h-64 md:h-96 rounded-2xl overflow-hidden">
          {movie.backdrop ?? movie.poster ? (
            <Image
              src={movie.backdrop ?? movie.poster}
              alt={movie.title}
              fill
              className="object-cover"
              priority
              sizes="100vw"
            />
          ) : (
            <div className="absolute inset-0 bg-bg-elevated" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-base-100 via-base-100/40 to-transparent" />
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row gap-6">
          {/* Poster */}
          <div className="shrink-0">
            <div className="relative w-36 md:w-48 aspect-[2/3] rounded-xl overflow-hidden">
              <Image
                src={movie.poster}
                alt={movie.title}
                fill
                className="object-cover"
                sizes="192px"
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-display">{movie.title.toUpperCase()}</h1>
              {movie.director && (
                <p className="text-base-content/50 text-sm mt-1">Rejissyor: {movie.director}</p>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap gap-4 text-sm text-base-content/60">
              <div className="flex items-center gap-1">
                <FaStar size={18} className="fill-accent text-accent" />
                <span className="text-accent font-medium">{movie.rating.toFixed(1)}</span>
                <span>/ 10 ({movie.reviewCount} ovoz)</span>
              </div>
              <div className="flex items-center gap-1">
                <FaClock size={18} />
                <span>{durationH > 0 ? `${durationH}s ${durationM}d` : `${durationM}d`}</span>
              </div>
              <div className="flex items-center gap-1">
                <FaCalendarAlt size={18} />
                <span>{movie.year}</span>
              </div>
              <div className="flex items-center gap-1">
                <FaEye size={18} />
                <span>{movie.viewCount.toLocaleString()} ko&apos;rishlar</span>
              </div>
            </div>

            {/* Genres */}
            <div className="flex gap-2 flex-wrap">
              {movie.genres.map((g) => (
                <Link
                  key={g}
                  href={`/movies?genre=${g}`}
                  className="badge badge-ghost hover:badge-primary transition-colors"
                >
                  {g}
                </Link>
              ))}
            </div>

            {/* Description */}
            <p className="text-base-content/70 text-sm leading-relaxed">{movie.description}</p>

            {/* Actions */}
            <div className="flex gap-3 flex-wrap">
              <Link href={`/watch/${movie._id}`} className="btn btn-primary gap-2">
                <FaPlay size={18} className="fill-current" />
                Ko&apos;rish
              </Link>
              <Link href={`/party/create?movieId=${movie._id}`} className="btn btn-outline gap-2">
                <FaUsers size={18} />
                Watch Party
              </Link>
            </div>

            {/* Cast */}
            {movie.cast && movie.cast.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Aktyorlar</p>
                <div className="flex flex-wrap gap-2">
                  {movie.cast.map((actor) => (
                    <span key={actor} className="badge badge-ghost text-xs">{actor}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
