/**
 * migrate-to-single-db.ts
 *
 * Merges cinesync_auth.users + cinesync_user.users → cinesync.users
 *
 * Usage:
 *   npx ts-node scripts/migrate-to-single-db.ts            # dry-run (no writes)
 *   npx ts-node scripts/migrate-to-single-db.ts --execute  # write to cinesync
 *
 * Safe to run multiple times — uses upsert by _id.
 */

import mongoose, { Document, Schema } from 'mongoose';

const DRY_RUN = !process.argv.includes('--execute');

const MONGO_AUTH = process.env.MONGO_AUTH ?? 'mongodb://localhost:27017/cinesync_auth';
const MONGO_USER = process.env.MONGO_USER ?? 'mongodb://localhost:27017/cinesync_user';
const MONGO_TARGET = process.env.MONGO_TARGET ?? 'mongodb://localhost:27017/cinesync';

// Minimal schemas — just enough to read the raw documents
const rawSchema = new Schema({}, { strict: false });

interface RawDoc extends Document {
  [key: string]: unknown;
}

async function main(): Promise<void> {
  console.log(`\n=== Migration: Единая БД ===`);
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'EXECUTE'}\n`);

  const authConn = await mongoose.createConnection(MONGO_AUTH).asPromise();
  const userConn = await mongoose.createConnection(MONGO_USER).asPromise();
  const targetConn = DRY_RUN ? null : await mongoose.createConnection(MONGO_TARGET).asPromise();

  const AuthUser = authConn.model<RawDoc>('User', rawSchema, 'users');
  const UserUser = userConn.model<RawDoc>('User', rawSchema, 'users');
  const TargetUser = targetConn
    ? targetConn.model<RawDoc>('User', rawSchema, 'users')
    : null;

  const authUsers = await AuthUser.find({}).lean();
  const userUsers = await UserUser.find({}).lean();

  console.log(`Auth users:   ${authUsers.length}`);
  console.log(`User profiles: ${userUsers.length}`);

  // Index user profiles by authId for fast lookup
  const profileByAuthId = new Map<string, Record<string, unknown>>();
  for (const u of userUsers) {
    const authId = u['authId'] as string | undefined;
    if (authId) profileByAuthId.set(authId, u as Record<string, unknown>);
  }

  let merged = 0;
  let noProfile = 0;

  for (const authUser of authUsers) {
    const id = String(authUser['_id']);
    const profile = profileByAuthId.get(id) ?? {};

    const merged_doc: Record<string, unknown> = {
      _id: authUser['_id'],
      // Identity from auth
      email: authUser['email'],
      username: authUser['username'] ?? profile['username'],
      passwordHash: authUser['passwordHash'],
      avatar: profile['avatar'] ?? authUser['avatar'] ?? null,
      role: authUser['role'] ?? profile['role'] ?? 'user',
      isEmailVerified: authUser['isEmailVerified'] ?? false,
      isBlocked: authUser['isBlocked'] ?? profile['isBlocked'] ?? false,
      blockReason: authUser['blockReason'] ?? profile['blockReason'] ?? null,
      blockedAt: authUser['blockedAt'] ?? profile['blockedAt'] ?? null,
      lastDevice: authUser['lastDevice'] ?? profile['lastDevice'] ?? null,
      googleId: authUser['googleId'] ?? null,
      telegramId: authUser['telegramId'] ?? null,
      appleId: authUser['appleId'] ?? null,
      lastLoginAt: authUser['lastLoginAt'] ?? null,
      // Profile from user service
      bio: (profile['bio'] as string) ?? '',
      rank: profile['rank'] ?? 'Bronze',
      totalPoints: profile['totalPoints'] ?? 0,
      fcmTokens: profile['fcmTokens'] ?? [],
      lastSeenAt: profile['lastSeenAt'] ?? null,
      restrictions: profile['restrictions'] ?? [],
      // DM inbox prefs — added to the user model after this script was first written. Without
      // them the migrated documents come out missing the fields entirely; app code mostly guards
      // with `?? []`, but a one-time migration should still produce complete documents.
      mutedPeerIds: profile['mutedPeerIds'] ?? [],
      pinnedPeerIds: profile['pinnedPeerIds'] ?? [],
      settings: profile['settings'] ?? { notifications: {} },
      createdAt: authUser['createdAt'],
      updatedAt: new Date(),
    };

    if (!profileByAuthId.has(id)) noProfile++;

    if (DRY_RUN) {
      console.log(`[DRY] Would upsert _id=${id} (${authUser['email']})`);
    } else if (TargetUser) {
      await TargetUser.updateOne(
        { _id: merged_doc['_id'] },
        { $set: merged_doc },
        { upsert: true },
      );
    }
    merged++;
  }

  console.log(`\nSummary:`);
  console.log(`  Total processed: ${merged}`);
  console.log(`  Missing profile:  ${noProfile} (defaults used)`);

  if (DRY_RUN) {
    console.log(`\n✅ Dry run complete. Run with --execute to apply.`);
  } else {
    console.log(`\n✅ Migration complete → cinesync.users (${merged} documents)`);
  }

  await authConn.close();
  await userConn.close();
  if (targetConn) await targetConn.close();
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
