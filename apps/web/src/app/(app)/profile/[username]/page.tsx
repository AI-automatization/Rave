import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { FaFilm, FaTrophy, FaStar, FaUsers, FaCalendarAlt } from 'react-icons/fa';
import { logger } from '@/lib/logger';
import type { ApiResponse, IUser, IAchievement } from '@/types';

interface Props {
  params: { username: string };
}

const BASE = process.env.USER_SERVICE_URL ?? 'http://localhost:3002/api/v1';

async function fetchProfile(username: string): Promise<IUser | null> {
  try {
    const res = await fetch(`${BASE}/users/${username}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json: ApiResponse<IUser> = await res.json() as ApiResponse<IUser>;
    return json.data;
  } catch (err) {
    logger.error('Profil yuklashda xato', err);
    return null;
  }
}

async function fetchAchievements(userId: string): Promise<IAchievement[]> {
  try {
    const res = await fetch(`${BASE}/users/${userId}/achievements`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    const json: ApiResponse<IAchievement[]> = await res.json() as ApiResponse<IAchievement[]>;
    return json.data ?? [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = await fetchProfile(params.username);
  if (!user) return { title: 'Profil topilmadi' };
  return {
    title: `${user.username} profili`,
    description: user.bio ?? `${user.username} — CineSync foydalanuvchisi. Rank: ${user.rank}`,
    openGraph: {
      title: `${user.username} | CineSync`,
      description: user.bio ?? `Rank: ${user.rank} | Points: ${user.totalPoints}`,
      images: user.avatar ? [user.avatar] : [],
      type: 'profile',
    },
  };
}

export default async function ProfilePage({ params }: Props) {
  const user = await fetchProfile(params.username);
  if (!user) notFound();

  const achievements = await fetchAchievements(user._id);

  const RANK_COLORS: Record<string, string> = {
    bronze:  'text-orange-400 border-orange-400/30 bg-orange-400/10',
    silver:  'text-base-content/70 border-base-content/20 bg-base-content/10',
    gold:    'text-gold border-gold/30 bg-gold/10',
    diamond: 'text-diamond border-diamond/30 bg-diamond/10',
    legend:  'text-primary border-primary/30 bg-primary/10',
  };

  const RARITY_COLORS: Record<string, string> = {
    common:    'border-base-content/20',
    rare:      'border-info',
    epic:      'border-secondary',
    legendary: 'border-accent',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Person',
            name: user.username,
            description: user.bio,
            image: user.avatar,
          }),
        }}
      />
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* Profile card */}
        <div className="card bg-base-200">
          <div className="card-body p-6 flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              {user.avatar ? (
                <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-primary ring-offset-2 ring-offset-base-200">
                  <Image src={user.avatar} alt={user.username} width={80} height={80} className="object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full bg-primary text-primary-content flex items-center justify-center text-2xl font-display">
                  {user.username[0].toUpperCase()}
                </div>
              )}
              {user.isOnline && (
                <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-success border-2 border-base-200" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <div>
                <h1 className="text-2xl font-display">{user.username.toUpperCase()}</h1>
                {user.bio && <p className="text-base-content/60 text-sm mt-1">{user.bio}</p>}
              </div>

              {/* Rank badge */}
              <div className={`badge border text-xs capitalize px-3 py-2 ${RANK_COLORS[user.rank] ?? ''}`}>
                {user.rank}
              </div>

              {/* Stats */}
              <div className="flex gap-4 flex-wrap">
                <div className="flex items-center gap-1 text-sm text-base-content/60">
                  <FaStar size={18} className="text-accent" />
                  <span className="font-medium text-base-content">{user.totalPoints.toLocaleString()}</span>
                  <span>points</span>
                </div>
                {user.lastSeenAt && !user.isOnline && (
                  <div className="flex items-center gap-1 text-sm text-base-content/50">
                    <FaCalendarAlt size={14} />
                    <span>Oxirgi: {new Date(user.lastSeenAt).toLocaleDateString('uz')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Achievements */}
        {achievements.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <FaTrophy size={23} className="text-accent" />
              <h2 className="text-xl font-display">YUTUQLAR ({achievements.length})</h2>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {achievements.map((ach) => (
                <div
                  key={ach._id}
                  className={`card bg-base-200 border ${RARITY_COLORS[ach.rarity] ?? 'border-base-300'} cursor-pointer hover:scale-105 transition-transform`}
                  title={`${ach.title} — ${ach.description}`}
                >
                  <div className="card-body p-3 items-center text-center gap-1">
                    <span className="text-2xl">{ach.icon}</span>
                    <p className="text-xs font-medium line-clamp-2 leading-tight">{ach.title}</p>
                    <span className={`text-xs opacity-60 capitalize ${ach.rarity === 'legendary' ? 'text-accent' : ''}`}>
                      {ach.rarity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Stats placeholders */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: FaFilm,   label: 'Filmlar',   val: '—' },
            { icon: FaTrophy, label: 'Yutuqlar',  val: achievements.length },
            { icon: FaUsers,  label: "Do'stlar",  val: '—' },
            { icon: FaStar,   label: 'Points',    val: user.totalPoints.toLocaleString() },
          ].map(({ icon: Icon, label, val }) => (
            <div key={label} className="card bg-base-200">
              <div className="card-body p-4 items-center text-center gap-1">
                <Icon size={23} className="text-primary" />
                <p className="text-xl font-display">{val}</p>
                <p className="text-xs text-base-content/50">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
