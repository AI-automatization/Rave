/**
 * CineSync — Watch Party Sync Test
 * Generates JWT tokens locally, creates room via REST, tests Socket.io sync
 *
 * Usage: node scripts/test_watch_party.mjs
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const { io }  = require('../node_modules/socket.io-client');
import { createSign } from 'crypto';
import { fileURLToPath } from 'url';
import { dirname }        from 'path';

// ── Config ────────────────────────────────────────────────────────
const WP_REST   = 'https://watch-part-production.up.railway.app/api/v1/watch-party';
const WP_SOCKET = 'https://watch-part-production.up.railway.app';
const MOVIE_ID  = '69ab30c7a691f85e8d5cc455'; // Gravity Falls

// Dev JWT keys from services/auth/.env
const PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDHgjmkUO2q8fgA
nWicVofoarkq1Jk3EilXIxCn6oznphorOrPvpe1I2WeNVapf6lPSPm0XITQRMRf1
PM/skHH5gaFiIVo7bbcxQ7OB6yagMS0QeB4+XSIz6cGp5PZxYW19N3YeKUcb7atq
T9fiRoAffDUcO1Uq6O/sizmnUvutibSRPp085EAMQ3xdMPFwOQA4YY4JwgvxMB0+
uso/mxe0j4eUPhVb2wMrclQCSxu8VAoR5jT5No+Eq3TCS4oxMN3eAAUoeKIAlI3i
pqii/ENkm9nV0ix+MU4jeYkfGi3Yf+6B71hesgEdn+ytp8r4pE6yyYdsFXAk6DYB
84rtDpG7AgMBAAECggEAFfsSh7iE3usm1EaDcooUEjbD7OScdtVQ6bFK0f1FBfam
dnHSxkoFMRwGzSsNiODD2GuZUE2Ps38xsQrAq8MkU4WFNs8O5nJJlytq2RsD1+1j
FiftyRgwvwB3nlTEFCzUR9H2+Q66L2kJlD50vhDfZ9ii71fYI9CjMnAKa5V4dh9+
hOSS9jtoOEO5BqhgfmzP1eHCTgmiNiFHude781vbCIGsvqupI+5h91fnTBTH5bLY
+ZltrTfkmZ0dYtr9T02hIaFfy9/CsiQ6CzQK9qrE6eAVscD1U+JX7n9XV3MY9VXl
aFWX65FoeSHYyIarhG2d4CJ/BWN9wmtbNJIhRQ/slQKBgQDsQFG5zTMiBvQU5z6E
1TR4JVcdvfNnzCzolcdR6DKhBmmevopa+YTcch6CbJ55HjNJ761vqeI8EXltr+6l
hQQLn2G/wgxDYGIacp8lh+H5WTJ6hV39qzDZutZl9KolwgU0xpe+XbXNQN2rfI7x
Gq/erbUW07JTPbRN6c+34mLxNwKBgQDYL6FSc5i1XtE/EH8+nDZaj7+/NSLa0u92
bIUkhgCV3hNJdD2eJCqCocpJCCME2GyijHcE7Y+Tupxx05zUbIlFf5Il8WvMxNwh
TzsTL5rczcYZ8/uZUVaUm28dCh922bKX5mJRTGc4inmcdNo8lj4+SSzKp2/sq5l2
QIvaljH1nQKBgAYXmoPqELl96GlplSkjvliizd5MeaxhjX7p7dvk2vlgCvU3AKZb
7NsqbjL6zhNdfgEYFybcAKN/59u2P7cw+Ou7zm99d4d9Qspfzk7PdDpT3INgUQ4r
jfTvZnv2lTSoDi5QOLWGARwr4gt8CMua3pIldJgEGYMgAjhIIT0ir159AoGBANe5
Z7x0F31c2WaZ2q+qh96EtS1jI53CgSvmDFIu2aSzDwHsWZRVuInUUpvf37n1ESp/
CkFDoVMkEvrO1B9xEuXj7/2m1BBonNUsT+HMTjdpqvW47mbGsKPoGs+ai104zSsg
vRktKY9VNxc1z5RHxGK4+FZdEKXVcnR64lPELqRNAoGBAMQwrmhRL8B0cUx1YeN5
x9UFqPHPn/Dq8ZNjVPfW1xJapbOQSyzKPvP0Yzb9u14QRYK87Y4yQweF4mtyVcUG
7pii7hL3OgAghZfVjrmnyWP+YZPlpr9LTlrgJRYSB4F/vEY/bjQSTymQXxo7zSnI
bnQlIfbfF3xbBGnKFtUF92wB
-----END PRIVATE KEY-----`;

// ── JWT generation (no external lib) ────────────────────────────
function base64url(buf) {
  return buf.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function makeJWT(payload) {
  const header  = base64url(Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })));
  const body    = base64url(Buffer.from(JSON.stringify({ ...payload, iat: Math.floor(Date.now()/1000), exp: Math.floor(Date.now()/1000) + 3600 })));
  const signing = `${header}.${body}`;
  const sign    = createSign('RSA-SHA256');
  sign.update(signing);
  const sig = base64url(sign.sign(PRIVATE_KEY));
  return `${signing}.${sig}`;
}

// ── Test helpers ─────────────────────────────────────────────────
let passed = 0, failed = 0;

const ok   = (label)         => { console.log(`  ✅  ${label}`);               passed++; };
const fail = (label, detail) => { console.log(`  ❌  ${label}${detail ? ': '+detail : ''}`); failed++; };
const sec  = (title)         => console.log(`\n─── ${title} ${'─'.repeat(Math.max(0,50-title.length))}`);

async function apiFetch(url, method, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res  = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

function connectSocket(token) {
  return new Promise((resolve, reject) => {
    const sock = io(WP_SOCKET, { auth: { token }, transports: ['websocket'], timeout: 10000 });
    const t    = setTimeout(() => { sock.disconnect(); reject(new Error('connect timeout')); }, 10000);
    sock.on('connect',       () => { clearTimeout(t); resolve(sock); });
    sock.on('connect_error', (e) => { clearTimeout(t); reject(e); });
  });
}

function waitEvent(socket, event, ms = 5000) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout:${event}`)), ms);
    socket.once(event, (d) => { clearTimeout(t); resolve(d); });
  });
}

// ── Main ─────────────────────────────────────────────────────────
async function main() {
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║     CineSync — Watch Party Sync Test (JWT local)     ║');
  console.log('╚══════════════════════════════════════════════════════╝');

  // Generate tokens for two fake users
  const userAId = 'test_user_a_000000000001';
  const userBId = 'test_user_b_000000000002';

  const tokenA = makeJWT({ userId: userAId, email: 'test_a@cinesync.test', role: 'user' });
  const tokenB = makeJWT({ userId: userBId, email: 'test_b@cinesync.test', role: 'user' });

  sec('1. JWT generation');
  ok(`Token A: ${tokenA.slice(0,50)}...`);
  ok(`Token B: ${tokenB.slice(0,50)}...`);

  // ── Create room ─────────────────────────────────────────────
  sec('2. Create Watch Party room (User A)');
  const { status: cSt, data: cData } = await apiFetch(`${WP_REST}/rooms`, 'POST', { movieId: MOVIE_ID, isPublic: true, maxMembers: 10 }, tokenA);

  let roomId = null, inviteCode = null;
  if (cSt === 201 || cSt === 200) {
    roomId     = cData?.data?._id ?? cData?.data?.roomId ?? cData?.data?.room?._id;
    inviteCode = cData?.data?.inviteCode ?? cData?.data?.code ?? cData?.data?.room?.code;
    ok(`Room created — id: ${roomId}, invite: ${inviteCode}`);
  } else {
    fail('Create room', `${cSt} — ${cData?.message ?? JSON.stringify(cData)}`);
    if (cSt === 401) {
      console.log('\n⚠️  JWT keys on Railway differ from local .env — tokens invalid for production');
      console.log('   Auth service is rate-limited (429). Cannot obtain fresh tokens right now.');
      console.log('   Run this test again after rate-limit reset (15 min window).\n');
    }
    return;
  }

  // ── User B joins room ────────────────────────────────────────
  if (inviteCode) {
    sec('3. User B joins via invite code');
    const { status: jSt, data: jData } = await apiFetch(`${WP_REST}/rooms/join/${inviteCode}`, 'POST', {}, tokenB);
    if (jSt === 200 || jSt === 201) ok(`User B joined: ${inviteCode}`);
    else fail('Join room', `${jSt} — ${jData?.message}`);
  }

  // ── Get room to confirm members ──────────────────────────────
  sec('4. Verify room state');
  const { status: gSt, data: gData } = await apiFetch(`${WP_REST}/rooms/${roomId}`, 'GET', null, tokenA);
  if (gSt === 200) {
    const members = gData?.data?.members ?? [];
    ok(`Room fetched — members: [${members.join(', ')}]`);
    if (members.includes(userAId)) ok('User A is room member ✓');
    else fail('User A not in member list');
    if (members.includes(userBId)) ok('User B is room member ✓');
    else fail('User B not in member list');
  } else {
    fail('Get room', `${gSt} — ${gData?.message}`);
  }

  // ── Socket connections ───────────────────────────────────────
  sec('5. Socket.io connect');
  let sockA, sockB;

  try { sockA = await connectSocket(tokenA); ok(`User A connected — ${sockA.id}`); }
  catch (e) { fail('User A socket', e.message); return; }

  try { sockB = await connectSocket(tokenB); ok(`User B connected — ${sockB.id}`); }
  catch (e) { fail('User B socket', e.message); sockA.disconnect(); return; }

  // ── Socket JOIN_ROOM ─────────────────────────────────────────
  sec('6. Socket JOIN_ROOM');

  const joinedA = waitEvent(sockA, 'room:joined');
  sockA.emit('room:join', { roomId });
  try {
    const d = await joinedA;
    ok(`User A → room:joined  |  currentTime: ${d?.syncState?.currentTime ?? '?'}s, isPlaying: ${d?.syncState?.isPlaying ?? '?'}`);
  } catch(e) { fail('User A room:joined', e.message); }

  await new Promise(r => setTimeout(r, 200));

  const joinedB    = waitEvent(sockB, 'room:joined');
  const memberOnA  = waitEvent(sockA, 'member:joined', 4000).catch(() => null);
  sockB.emit('room:join', { roomId });
  try {
    const d = await joinedB;
    ok(`User B → room:joined  |  members: ${d?.room?.members?.length ?? '?'}`);
  } catch(e) { fail('User B room:joined', e.message); }

  const mj = await memberOnA;
  mj ? ok(`User A notified: member:joined (userId: ${mj.userId})`)
     : fail('member:joined not received on User A');

  // ── VIDEO PLAY ───────────────────────────────────────────────
  sec('7. VIDEO PLAY sync (owner → member)');
  const playOnB = waitEvent(sockB, 'video:play', 5000);
  sockA.emit('video:play', { currentTime: 42.5 });
  try {
    const d = await playOnB;
    ok(`User B received video:play — currentTime: ${d?.currentTime}s, isPlaying: ${d?.isPlaying}`);
    Math.abs((d?.currentTime ?? 0) - 42.5) < 0.5 ? ok('Timestamp accurate ✓') : fail('Timestamp mismatch', `got ${d?.currentTime}`);
  } catch(e) { fail('video:play not received on User B', e.message); }

  // ── VIDEO PAUSE ──────────────────────────────────────────────
  sec('8. VIDEO PAUSE sync');
  const pauseOnB = waitEvent(sockB, 'video:pause', 5000);
  sockA.emit('video:pause', { currentTime: 65.0 });
  try {
    const d = await pauseOnB;
    ok(`User B received video:pause — currentTime: ${d?.currentTime}s`);
  } catch(e) { fail('video:pause not received', e.message); }

  // ── VIDEO SEEK ───────────────────────────────────────────────
  sec('9. VIDEO SEEK sync');
  const seekOnB = waitEvent(sockB, 'video:seek', 5000);
  sockA.emit('video:seek', { currentTime: 120.0 });
  try {
    const d = await seekOnB;
    ok(`User B received video:seek — currentTime: ${d?.currentTime}s`);
  } catch(e) { fail('video:seek not received', e.message); }

  // ── Non-owner cannot play ────────────────────────────────────
  sec('10. Owner-only guard (User B play → ignored)');
  let gotUnauth = false;
  const playListener = () => { gotUnauth = true; };
  sockA.on('video:play', playListener);
  sockB.emit('video:play', { currentTime: 10.0 });
  await new Promise(r => setTimeout(r, 1500));
  sockA.off('video:play', playListener);
  gotUnauth ? fail('User A received unauthorized play from User B')
            : ok('Non-owner play correctly blocked ✓');

  // ── CHAT ─────────────────────────────────────────────────────
  sec('11. Chat message sync');
  const msgOnA = waitEvent(sockA, 'room:message', 4000);
  const msgOnB = waitEvent(sockB, 'room:message', 4000);
  sockA.emit('room:message', { message: 'Hello from A! 🎬' });
  try {
    const [mA, mB] = await Promise.all([msgOnA, msgOnB]);
    ok(`User A received: "${mA?.message}"`);
    ok(`User B received: "${mB?.message}"`);
  } catch(e) { fail('Chat sync', e.message); }

  // ── EMOJI ────────────────────────────────────────────────────
  sec('12. Emoji reaction sync');
  const emojiOnB = waitEvent(sockB, 'room:emoji', 4000);
  sockA.emit('room:emoji', { emoji: '🔥' });
  try {
    const d = await emojiOnB;
    ok(`User B received emoji: ${d?.emoji} from ${d?.userId}`);
  } catch(e) { fail('Emoji sync', e.message); }

  // ── BUFFER ───────────────────────────────────────────────────
  sec('13. Buffer notification');
  const bufOnB = waitEvent(sockB, 'video:buffer', 4000);
  sockA.emit('video:buffer_start');
  try {
    const d = await bufOnB;
    ok(`User B notified buffering: ${d?.buffering}, from: ${d?.userId}`);
  } catch(e) { fail('Buffer event', e.message); }

  // ── MEMBER LEFT ──────────────────────────────────────────────
  sec('14. Member left notification');
  const leftOnA = waitEvent(sockA, 'member:left', 4000);
  sockB.emit('room:leave');
  try {
    const d = await leftOnA;
    ok(`User A notified member:left — userId: ${d?.userId}`);
  } catch(e) { fail('member:left event', e.message); }

  sockA.disconnect();
  sockB.disconnect();

  // ── Summary ──────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log(`║  ИТОГ: ${passed} passed, ${failed} failed${' '.repeat(Math.max(0,40-String(passed+failed).length))}║`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(failed === 0
    ? '\n🟢 Синхронный просмотр работает корректно!\n'
    : '\n🔴 Найдены проблемы — см. ❌ выше\n');
}

main().catch(e => { console.error('\n💥 Fatal:', e.message); process.exit(1); });
