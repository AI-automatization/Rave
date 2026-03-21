/**
 * reset-admin.ts — superadmin credentials yangilash (auth DB + user DB)
 *
 * Usage:
 *   AUTH_MONGO_URI="mongodb+srv://..." USER_MONGO_URI="mongodb+srv://..." npx ts-node scripts/reset-admin.ts
 *
 * Agar bitta MongoDB (shared) bo'lsa:
 *   MONGO_URI="..." npx ts-node scripts/reset-admin.ts
 *
 * Railway da:
 *   auth service → Variables → MONGO_URI   (AUTH_MONGO_URI)
 *   user service → Variables → MONGO_URI   (USER_MONGO_URI)
 */

import mongoose, { Connection } from 'mongoose';
import bcrypt from 'bcrypt';

const AUTH_MONGO_URI = process.env.AUTH_MONGO_URI ?? process.env.MONGO_URI;
const USER_MONGO_URI = process.env.USER_MONGO_URI ?? process.env.MONGO_URI;

if (!AUTH_MONGO_URI) {
  console.error('❌  AUTH_MONGO_URI (yoki MONGO_URI) kerak');
  process.exit(1);
}
if (!USER_MONGO_URI) {
  console.error('❌  USER_MONGO_URI (yoki MONGO_URI) kerak');
  process.exit(1);
}

const NEW_EMAIL    = 'saidazim186@gmail.com';
const NEW_PASSWORD = 'pokemonforger123';
const NEW_USERNAME = 'saidazim';

const AuthUserSchema = new mongoose.Schema({
  email: String, username: String, passwordHash: String,
  role: String, isEmailVerified: Boolean,
}, { strict: false, collection: 'users' });

const UserProfileSchema = new mongoose.Schema({
  authId: String, email: String, username: String,
  role: String, isEmailVerified: Boolean,
}, { strict: false, collection: 'users' });

async function main() {
  const hash = await bcrypt.hash(NEW_PASSWORD, 12);

  // ── 1. Auth DB ──────────────────────────────────────────────────────────────
  const authConn: Connection = mongoose.createConnection(AUTH_MONGO_URI as string);
  await new Promise<void>((res, rej) => {
    authConn.once('open', res);
    authConn.once('error', rej);
  });
  console.log('✅  Auth DB connected');

  const AuthUser = authConn.model('AuthUser', AuthUserSchema);

  // Remove conflicting non-superadmin with same email
  const conflictAuth = await AuthUser.findOne({ email: NEW_EMAIL, role: { $ne: 'superadmin' } });
  if (conflictAuth) {
    await AuthUser.deleteOne({ _id: conflictAuth._id });
    console.log(`⚠️  Auth DB: conflicting user deleted [${conflictAuth.role}]`);
  }

  const authResult = await AuthUser.findOneAndUpdate(
    { role: 'superadmin' },
    { $set: { email: NEW_EMAIL, username: NEW_USERNAME, passwordHash: hash, isEmailVerified: true } },
    { upsert: true, new: true },
  );
  const authId = (authResult?._id as object)?.toString() ?? '';
  console.log(`✅  Auth DB: superadmin → ${authResult?.email} (authId: ${authId})`);

  await authConn.close();

  // ── 2. User DB ──────────────────────────────────────────────────────────────
  const userConn: Connection = mongoose.createConnection(USER_MONGO_URI as string);
  await new Promise<void>((res, rej) => {
    userConn.once('open', res);
    userConn.once('error', rej);
  });
  console.log('✅  User DB connected');

  const UserProfile = userConn.model('UserProfile', UserProfileSchema);

  // Remove any user profile with same email that is NOT the superadmin
  const conflictUser = await UserProfile.findOne({ email: NEW_EMAIL, authId: { $ne: authId } });
  if (conflictUser) {
    await UserProfile.deleteOne({ _id: conflictUser._id });
    console.log(`⚠️  User DB: conflicting profile deleted [${conflictUser.role}]`);
  }

  // Upsert admin profile in user DB with correct role
  const userResult = await UserProfile.findOneAndUpdate(
    { authId },
    { $set: { authId, email: NEW_EMAIL, username: NEW_USERNAME, role: 'superadmin', isEmailVerified: true } },
    { upsert: true, new: true },
  );
  console.log(`✅  User DB: profile → ${userResult?.email} [role: ${userResult?.role}]`);

  await userConn.close();

  console.log('\n🎉  Done! Now run: POST /auth/upsertAdmin in Railway to confirm.');
}

main().catch((err) => { console.error('❌', err); process.exit(1); });
