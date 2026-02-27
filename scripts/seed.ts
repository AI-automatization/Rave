/**
 * CineSync Seed Script
 * Usage: npx ts-node scripts/seed.ts
 *
 * Bu script quyidagilarni yaratadi:
 *  — Auth DB: superadmin user, 3 ta test user
 *  — User DB: tegishli profil yozuvlari
 *  — Content DB: 12 ta demo movie
 *  — User DB: 25 ta achievement ta'rifi
 */

import mongoose from 'mongoose';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.dev.example') });

// ─────────────────────────────────────────────
// Connection helpers
// ─────────────────────────────────────────────

const AUTH_MONGO    = process.env.AUTH_MONGO_URI    ?? 'mongodb://localhost:27017/cinesync_auth';
const USER_MONGO    = process.env.USER_MONGO_URI    ?? 'mongodb://localhost:27017/cinesync_user';
const CONTENT_MONGO = process.env.CONTENT_MONGO_URI ?? 'mongodb://localhost:27017/cinesync_content';

// ─────────────────────────────────────────────
// Schemas (standalone — shared import yo'q)
// ─────────────────────────────────────────────

const authUserSchema = new mongoose.Schema({
  email:                   String,
  username:                String,
  passwordHash:            String,
  role:                    { type: String, default: 'user' },
  isEmailVerified:         { type: Boolean, default: false },
  isBlocked:               { type: Boolean, default: false },
  fcmTokens:               [String],
  emailVerifyToken:        { type: String, default: null },
  emailVerifyTokenExpiry:  { type: Date, default: null },
  passwordResetToken:      { type: String, default: null },
  passwordResetTokenExpiry:{ type: Date, default: null },
  googleId:                { type: String, default: null },
  avatar:                  { type: String, default: null },
  lastLoginAt:             { type: Date, default: null },
}, { timestamps: true, collection: 'users' });

const userProfileSchema = new mongoose.Schema({
  authId:      { type: String, required: true, unique: true },
  email:       String,
  username:    String,
  avatar:      { type: String, default: null },
  bio:         { type: String, default: '' },
  role:        { type: String, default: 'user' },
  rank:        { type: String, default: 'Bronze' },
  totalPoints: { type: Number, default: 0 },
  isBlocked:   { type: Boolean, default: false },
  fcmTokens:   [String],
  lastSeenAt:  { type: Date, default: null },
  settings: {
    notifications: {
      friendRequest:       { type: Boolean, default: true },
      friendAccepted:      { type: Boolean, default: true },
      watchPartyInvite:    { type: Boolean, default: true },
      battleInvite:        { type: Boolean, default: true },
      battleResult:        { type: Boolean, default: true },
      achievementUnlocked: { type: Boolean, default: true },
      friendOnline:        { type: Boolean, default: false },
      emailDigest:         { type: Boolean, default: true },
    },
  },
}, { timestamps: true, collection: 'users' });

const movieSchema = new mongoose.Schema({
  title:         { type: String, required: true },
  originalTitle: { type: String, default: '' },
  description:   { type: String, required: true },
  type:          { type: String, default: 'movie' },
  genre:         [String],
  year:          Number,
  duration:      Number,
  rating:        { type: Number, default: 0 },
  posterUrl:     { type: String, default: '' },
  backdropUrl:   { type: String, default: '' },
  videoUrl:      { type: String, default: '' },
  trailerUrl:    { type: String, default: '' },
  isPublished:   { type: Boolean, default: true },
  viewCount:     { type: Number, default: 0 },
  addedBy:       String,
  elasticId:     { type: String, default: null },
}, { timestamps: true, collection: 'movies' });

const achievementSchema = new mongoose.Schema({
  key:         { type: String, required: true, unique: true },
  title:       String,
  description: String,
  iconUrl:     { type: String, default: '' },
  rarity:      String,
  points:      Number,
  condition:   mongoose.Schema.Types.Mixed,
  isSecret:    { type: Boolean, default: false },
}, { timestamps: true, collection: 'achievements' });

// ─────────────────────────────────────────────
// Seed data
// ─────────────────────────────────────────────

const BCRYPT_ROUNDS = 12;
const ADMIN_ID = new mongoose.Types.ObjectId();

const USERS = [
  { id: ADMIN_ID, email: 'admin@cinesync.app', username: 'admin', password: 'Admin123!', role: 'superadmin', verified: true },
  { id: new mongoose.Types.ObjectId(), email: 'test1@cinesync.app', username: 'testuser1', password: 'Test123!', role: 'user', verified: true },
  { id: new mongoose.Types.ObjectId(), email: 'test2@cinesync.app', username: 'testuser2', password: 'Test123!', role: 'user', verified: true },
  { id: new mongoose.Types.ObjectId(), email: 'operator@cinesync.app', username: 'operator1', password: 'Operator123!', role: 'operator', verified: true },
];

const MOVIES = [
  { title: 'The Shawshank Redemption', originalTitle: 'The Shawshank Redemption', genre: ['drama'], year: 1994, duration: 142, rating: 9.3, description: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.' },
  { title: 'The Godfather', originalTitle: 'The Godfather', genre: ['drama', 'thriller'], year: 1972, duration: 175, rating: 9.2, description: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.' },
  { title: 'The Dark Knight', originalTitle: 'The Dark Knight', genre: ['action', 'thriller'], year: 2008, duration: 152, rating: 9.0, description: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, Batman must accept one of the greatest psychological and physical tests of his ability to fight injustice.' },
  { title: 'Pulp Fiction', originalTitle: 'Pulp Fiction', genre: ['drama', 'thriller'], year: 1994, duration: 154, rating: 8.9, description: 'The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption.' },
  { title: 'Inception', originalTitle: 'Inception', genre: ['action', 'sci-fi'], year: 2010, duration: 148, rating: 8.8, description: 'A thief who steals corporate secrets through the use of dream-sharing technology is given the inverse task of planting an idea into the mind of a C.E.O.' },
  { title: 'Interstellar', originalTitle: 'Interstellar', genre: ['sci-fi', 'drama'], year: 2014, duration: 169, rating: 8.7, description: 'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival.' },
  { title: 'The Matrix', originalTitle: 'The Matrix', genre: ['action', 'sci-fi'], year: 1999, duration: 136, rating: 8.7, description: 'A computer hacker learns from mysterious rebels about the true nature of his reality and his role in the war against its controllers.' },
  { title: 'Parasite', originalTitle: 'Gisaengchung', genre: ['drama', 'thriller'], year: 2019, duration: 132, rating: 8.5, description: 'Greed and class discrimination threaten the newly formed symbiotic relationship between the wealthy Park family and the destitute Kim clan.' },
  { title: 'Spider-Man: Into the Spider-Verse', originalTitle: 'Spider-Man: Into the Spider-Verse', genre: ['animation', 'action'], year: 2018, duration: 117, rating: 8.4, description: 'Teen Miles Morales becomes the Spider-Man of his universe and must join with five spider-powered individuals from other dimensions to stop a threat for all realities.' },
  { title: 'Forrest Gump', originalTitle: 'Forrest Gump', genre: ['drama', 'romance'], year: 1994, duration: 142, rating: 8.8, description: 'The presidencies of Kennedy and Johnson, the Vietnam War, the Watergate scandal and other historical events unfold from the perspective of an Alabama man with an IQ of 75.' },
  { title: 'Joker', originalTitle: 'Joker', genre: ['drama', 'thriller'], year: 2019, duration: 122, rating: 8.4, description: 'In Gotham City, mentally troubled comedian Arthur Fleck is disregarded and mistreated by society. He then embarks on a downward spiral of revolution and bloody crime.' },
  { title: 'Dune', originalTitle: 'Dune: Part One', genre: ['sci-fi', 'action', 'drama'], year: 2021, duration: 155, rating: 8.0, description: 'A noble family becomes embroiled in a war for control over the galaxy\'s most valuable asset while its heir becomes troubled by visions of a dark future.' },
];

const ACHIEVEMENTS = [
  // Film ko'rish
  { key: 'movies_1',        title: 'Birinchi film',     description: 'Birinchi filmni ko\'ring',            rarity: 'common',    points: 10,  condition: { type: 'movies_watched', count: 1 } },
  { key: 'movies_10',       title: 'Film tomoshabini',  description: '10 ta film ko\'ring',                 rarity: 'common',    points: 20,  condition: { type: 'movies_watched', count: 10 } },
  { key: 'movies_50',       title: 'Sinefil',           description: '50 ta film ko\'ring',                 rarity: 'rare',      points: 50,  condition: { type: 'movies_watched', count: 50 } },
  { key: 'movies_100',      title: 'Kino ustasi',       description: '100 ta film ko\'ring',                rarity: 'epic',      points: 100, condition: { type: 'movies_watched', count: 100 } },
  { key: 'movies_500',      title: 'Kinoning afsonasi', description: '500 ta film ko\'ring',                rarity: 'legendary', points: 500, condition: { type: 'movies_watched', count: 500 } },
  // Watch Party
  { key: 'watch_party_1',   title: 'Jamoa tomoshasi',   description: 'Birinchi Watch Party ga qo\'shiling', rarity: 'common',    points: 15,  condition: { type: 'watch_party_joined', count: 1 } },
  { key: 'watch_party_host',title: 'Xona egasi',        description: 'Watch Party yarating',                rarity: 'common',    points: 20,  condition: { type: 'watch_party_hosted', count: 1 } },
  { key: 'watch_party_10',  title: 'Jamoa yulduz',      description: '10 ta Watch Party',                  rarity: 'rare',      points: 50,  condition: { type: 'watch_party_joined', count: 10 } },
  // Battle
  { key: 'battle_first',    title: 'Birinchi jang',     description: 'Battle ga qatnashing',               rarity: 'common',    points: 10,  condition: { type: 'battle_participated', count: 1 } },
  { key: 'battle_winner',   title: 'G\'olib',           description: 'Battle g\'alib chiqing',             rarity: 'rare',      points: 50,  condition: { type: 'battle_won', count: 1 } },
  { key: 'battle_3wins',    title: 'Jangovar',          description: '3 ta battle g\'alaba',                rarity: 'epic',      points: 100, condition: { type: 'battle_won', count: 3 } },
  { key: 'battle_10wins',   title: 'Chempion',          description: '10 ta battle g\'alaba',               rarity: 'legendary', points: 300, condition: { type: 'battle_won', count: 10 } },
  // Do'stlar
  { key: 'friend_1',        title: 'Do\'st',            description: 'Birinchi do\'stingizni qo\'shing',   rarity: 'common',    points: 5,   condition: { type: 'friends_count', count: 1 } },
  { key: 'friend_10',       title: 'Mashhur',           description: '10 ta do\'st',                       rarity: 'rare',      points: 30,  condition: { type: 'friends_count', count: 10 } },
  { key: 'friend_50',       title: 'Ijtimoiy yulduz',  description: '50 ta do\'st',                       rarity: 'epic',      points: 100, condition: { type: 'friends_count', count: 50 } },
  // Streak
  { key: 'streak_3',        title: '3 kunlik seriya',   description: '3 kun ketma-ket kino ko\'ring',      rarity: 'common',    points: 15,  condition: { type: 'daily_streak', count: 3 } },
  { key: 'streak_7',        title: 'Haftalik seriya',   description: '7 kun ketma-ket kino ko\'ring',      rarity: 'rare',      points: 35,  condition: { type: 'daily_streak', count: 7 } },
  { key: 'streak_30',       title: 'Oylik seriya',      description: '30 kun ketma-ket kino ko\'ring',     rarity: 'epic',      points: 150, condition: { type: 'daily_streak', count: 30 } },
  // Maxfiy
  { key: 'night_owl',       title: '🦉 Tun bayqushi',  description: 'Yarim tunda film ko\'ring',           rarity: 'secret',    points: 25,  condition: { type: 'watch_time', hour_min: 0, hour_max: 4 }, isSecret: true },
  { key: 'binge_watch',     title: '🍿 Binge tomoshin', description: 'Bir kunda 5 soat film ko\'ring',      rarity: 'secret',    points: 40,  condition: { type: 'daily_watch_minutes', min: 300 }, isSecret: true },
  { key: 'genre_master',    title: '🎭 Janr ustasi',   description: 'Barcha janrlardan film ko\'ring',     rarity: 'secret',    points: 75,  condition: { type: 'genres_watched', all: true }, isSecret: true },
  // Reyting
  { key: 'reviewer_1',      title: 'Tanqidchi',        description: 'Birinchi reyting qo\'ying',          rarity: 'common',    points: 8,   condition: { type: 'reviews_written', count: 1 } },
  { key: 'reviewer_10',     title: 'Film tanqidchisi', description: '10 ta reyting qo\'ying',             rarity: 'rare',      points: 40,  condition: { type: 'reviews_written', count: 10 } },
  // Rank
  { key: 'rank_silver',     title: '🥈 Kumush',        description: 'Silver darajasiga ering',            rarity: 'common',    points: 0,   condition: { type: 'rank_reached', rank: 'Silver' } },
  { key: 'rank_gold',       title: '🥇 Oltin',         description: 'Gold darajasiga ering',              rarity: 'rare',      points: 0,   condition: { type: 'rank_reached', rank: 'Gold' } },
  { key: 'rank_diamond',    title: '💎 Brilliant',     description: 'Diamond darajasiga ering',           rarity: 'legendary', points: 0,   condition: { type: 'rank_reached', rank: 'Diamond' } },
];

// ─────────────────────────────────────────────
// Main seed function
// ─────────────────────────────────────────────

async function seed(): Promise<void> {
  console.log('🌱 CineSync seed boshlandi...\n');

  // ── Auth DB ──────────────────────────────────
  console.log('🔐 Auth DB ga ulanmoqda...');
  const authConn = await mongoose.createConnection(AUTH_MONGO).asPromise();
  const AuthUser = authConn.model('User', authUserSchema);

  for (const u of USERS) {
    const exists = await AuthUser.findOne({ email: u.email });
    if (exists) {
      console.log(`   ⏭  Auth user mavjud: ${u.email}`);
      continue;
    }
    const passwordHash = await bcrypt.hash(u.password, BCRYPT_ROUNDS);
    await AuthUser.create({
      _id: u.id,
      email: u.email,
      username: u.username,
      passwordHash,
      role: u.role,
      isEmailVerified: u.verified,
    });
    console.log(`   ✅ Auth user yaratildi: ${u.email} (${u.role})`);
  }

  await authConn.close();

  // ── User DB ──────────────────────────────────
  console.log('\n👤 User DB ga ulanmoqda...');
  const userConn = await mongoose.createConnection(USER_MONGO).asPromise();
  const UserProfile = userConn.model('User', userProfileSchema);
  const Achievement  = userConn.model('Achievement', achievementSchema);

  for (const u of USERS) {
    const exists = await UserProfile.findOne({ authId: u.id.toString() });
    if (exists) {
      console.log(`   ⏭  User profil mavjud: ${u.username}`);
      continue;
    }
    await UserProfile.create({
      authId: u.id.toString(),
      email: u.email,
      username: u.username,
      role: u.role,
      totalPoints: u.role === 'superadmin' ? 10000 : 0,
      rank: u.role === 'superadmin' ? 'Diamond' : 'Bronze',
    });
    console.log(`   ✅ User profil yaratildi: ${u.username}`);
  }

  // Achievements
  let achCreated = 0;
  for (const ach of ACHIEVEMENTS) {
    const exists = await Achievement.findOne({ key: ach.key });
    if (exists) continue;
    await Achievement.create(ach);
    achCreated++;
  }
  console.log(`   ✅ ${achCreated} ta achievement yaratildi (${ACHIEVEMENTS.length - achCreated} ta mavjud edi)`);

  await userConn.close();

  // ── Content DB ────────────────────────────────
  console.log('\n🎬 Content DB ga ulanmoqda...');
  const contentConn = await mongoose.createConnection(CONTENT_MONGO).asPromise();
  const Movie = contentConn.model('Movie', movieSchema);

  let movCreated = 0;
  for (const m of MOVIES) {
    const exists = await Movie.findOne({ title: m.title });
    if (exists) {
      console.log(`   ⏭  Film mavjud: ${m.title}`);
      continue;
    }
    await Movie.create({
      ...m,
      addedBy: ADMIN_ID.toString(),
      isPublished: true,
      posterUrl:   `https://picsum.photos/seed/${crypto.createHash('md5').update(m.title).digest('hex').slice(0, 6)}/300/450`,
      backdropUrl: `https://picsum.photos/seed/${crypto.createHash('md5').update(m.title + 'bg').digest('hex').slice(0, 6)}/1280/720`,
    });
    console.log(`   ✅ Film yaratildi: ${m.title} (${m.year})`);
    movCreated++;
  }
  console.log(`   📊 Jami: ${movCreated} ta yangi film`);

  await contentConn.close();

  console.log('\n✨ Seed muvaffaqiyatli tugadi!\n');
  console.log('📋 Kirish ma\'lumotlari:');
  console.log('   admin@cinesync.app     : Admin123!  (superadmin)');
  console.log('   operator@cinesync.app  : Operator123! (operator)');
  console.log('   test1@cinesync.app     : Test123!   (user)');
  console.log('   test2@cinesync.app     : Test123!   (user)');
}

seed().catch((error) => {
  console.error('\n❌ Seed xatosi:', error);
  process.exit(1);
});
