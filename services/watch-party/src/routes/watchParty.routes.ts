import { Router } from 'express';
import Redis from 'ioredis';
import { Server as SocketServer } from 'socket.io';
import { WatchPartyController } from '../controllers/watchParty.controller';
import { WatchPartyService } from '../services/watchParty.service';
import { createDomainAdminController } from '../controllers/domain.admin.controller';
import { createTurnController } from '../controllers/turn.controller';
import { vbCaptureController } from '../controllers/vbCapture.controller';
import { vbMediaProxyController } from '../controllers/vbMediaProxy.controller';
import { verifyToken, requireNotBlocked } from '@shared/middleware/auth.middleware';
import { requireInternalSecret } from '@shared/utils/serviceClient';
import { createRoomLimiter, joinRoomLimiter, vbMediaProxyLimiter, vbCaptureLimiter } from '../middleware/rateLimiter';
import { validate, createRoomSchema, joinRoomSchema } from '../validators/watchParty.validator';

export const createWatchPartyRouter = (redis: Redis, io: SocketServer): Router => {
  const router = Router();
  const watchPartyService = new WatchPartyService(redis);
  const watchPartyController = new WatchPartyController(watchPartyService, io, redis);
  const domainAdminCtrl = createDomainAdminController(redis);
  const turnCtrl = createTurnController(redis);
  const notBlocked = requireNotBlocked(redis);
  const createLimiter = createRoomLimiter(redis);
  const joinLimiter = joinRoomLimiter(redis);
  const vbProxyLimiter = vbMediaProxyLimiter(redis);
  const vbCaptureLim = vbCaptureLimiter(redis);

  // Internal — force-disconnect blocked user from all sockets
  router.post('/internal/users/:userId/disconnect', requireInternalSecret, watchPartyController.disconnectUser);

  // Internal — cascade account deletion (GDPR/App Store compliance)
  router.delete('/internal/users/:userId', requireInternalSecret, watchPartyController.deleteUserData);

  // Internal — broadcast a new DM message to the receiver's open chat (realtime)
  router.post('/internal/dm/:userId/notify', requireInternalSecret, watchPartyController.notifyDmMessage);

  // Internal Admin: GET /watch-party/internal/admin/stats — today's stats (admin)
  router.get('/internal/admin/stats', requireInternalSecret, watchPartyController.adminGetStats);

  // Internal Admin: GET /watch-party/internal/admin/list — list all rooms (admin)
  router.get('/internal/admin/list', requireInternalSecret, watchPartyController.adminListRooms);

  // Internal Admin: GET /watch-party/internal/admin/:id/details — room details for moderation
  router.get('/internal/admin/:id/details', requireInternalSecret, watchPartyController.adminGetRoomDetails);

  // Internal Admin: DELETE /watch-party/internal/admin/:id — force close room (admin)
  router.delete('/internal/admin/:id', requireInternalSecret, watchPartyController.adminCloseRoom);

  // Internal Admin: POST /watch-party/internal/admin/:id/join — admin join any room
  router.post('/internal/admin/:id/join', requireInternalSecret, watchPartyController.adminJoinRoom);

  // Internal Admin: POST /watch-party/internal/admin/:id/control — admin video control
  router.post('/internal/admin/:id/control', requireInternalSecret, watchPartyController.adminControlRoom);

  // Internal Admin: DELETE /watch-party/internal/admin/:id/members/:userId — kick any member
  router.delete('/internal/admin/:id/members/:userId', requireInternalSecret, watchPartyController.adminKickMember);

  // Internal Admin: domain management
  router.get('/internal/admin/domains',                       requireInternalSecret, domainAdminCtrl.listDomains);
  router.post('/internal/admin/domains',                      requireInternalSecret, domainAdminCtrl.addDomain);
  router.patch('/internal/admin/domains/:domain/block',       requireInternalSecret, domainAdminCtrl.blockDomain);
  router.patch('/internal/admin/domains/:domain/unblock',     requireInternalSecret, domainAdminCtrl.unblockDomain);

  // GET /watch-party/turn/credentials — WebRTC ICE servers (mesh sync + voice)
  router.get('/turn/credentials', verifyToken, turnCtrl.getCredentials);

  // GET /watch-party/vb-capture/:roomId — serves the in-memory VB byte capture (categories B/C
  // of the extraction flow) as a normal Range-capable video resource. Deliberately public/no-auth,
  // same trust model as any external CDN URL we proxy — app-web's proxy-stream route fetches this
  // server-to-server with no credentials, same as it would fetch a real external .mp4 URL. roomId
  // itself is an unguessable Mongo ObjectId, same exposure as any other proxied stream URL. Takes
  // no attacker-supplied URL (lower risk than vb-media-proxy below) but still had no rate limiter
  // at all until GitHub issue #76 — vbCaptureLim closes that.
  router.get('/vb-capture/:roomId', vbCaptureLim, vbCaptureController.stream);

  // GET /watch-party/vb-media-proxy/stream.(m3u8|mp4)?url=... and .../seg?url=... — re-fetches a
  // media URL the VB network sniffer found (category A) through THIS service's own egress IP,
  // instead of handing the raw CDN URL to app-web's proxy-stream (a different Railway service/IP —
  // some CDNs 403 anything not coming from the IP that first requested it, see controller comment).
  // Route itself stays public/no-auth (same trust model as vb-capture above — no verifyToken), but
  // GitHub issue #76 found this was a wide-open bandwidth proxy + SSRF vector: anyone could pass
  // an arbitrary ?url= with no rate limit, and a redirect walked straight past the old guard. Fixed
  // via: (1) HMAC signature required in the URL (verifyProxyUrl in the controller — only URLs we
  // minted ourselves in vbSession.helper.ts pass), (2) the shared SSRF guard re-checked on every
  // redirect hop, (3) this per-IP rate limiter.
  router.get('/vb-media-proxy/stream.:ext(m3u8|mp4|mpd)', vbProxyLimiter, vbMediaProxyController.stream);
  router.get('/vb-media-proxy/seg', vbProxyLimiter, vbMediaProxyController.stream);

  // GET /watch-party/rooms/my/recent — user's last 10 rooms (T-S061)
  router.get('/rooms/my/recent', verifyToken, notBlocked, watchPartyController.getRecentRooms);

  // GET /watch-party/rooms/public/active — public rooms sorted by memberCount (T-S062)
  router.get('/rooms/public/active', verifyToken, notBlocked, watchPartyController.getPublicActiveRooms);

  // GET /watch-party/rooms — list all active rooms (sorted by member count)
  router.get('/rooms', verifyToken, notBlocked, watchPartyController.getRooms);

  // POST /watch-party/rooms — create room (max 5/min per IP)
  router.post('/rooms', verifyToken, notBlocked, createLimiter, validate(createRoomSchema), watchPartyController.createRoom);

  // GET /watch-party/rooms/:id — get room details
  router.get('/rooms/:id', verifyToken, notBlocked, watchPartyController.getRoom);

  // POST /watch-party/rooms/join/:inviteCode — join room (max 10/min per user)
  router.post('/rooms/join/:inviteCode', verifyToken, notBlocked, joinLimiter, validate(joinRoomSchema), watchPartyController.joinRoom);

  // DELETE /watch-party/rooms/:id — close room (owner only) (T-S028)
  router.delete('/rooms/:id', verifyToken, notBlocked, watchPartyController.closeRoom);

  // DELETE /watch-party/rooms/:id/leave — leave room
  router.delete('/rooms/:id/leave', verifyToken, notBlocked, watchPartyController.leaveRoom);

  // POST /watch-party/rooms/:id/playlist — add to queue (owner only, T-S060)
  router.post('/rooms/:id/playlist', verifyToken, notBlocked, watchPartyController.addToPlaylist);

  // DELETE /watch-party/rooms/:id/playlist/:index — remove by index (owner only, T-S060)
  router.delete('/rooms/:id/playlist/:index', verifyToken, notBlocked, watchPartyController.removeFromPlaylist);

  // POST /watch-party/rooms/:id/playlist/next — advance to next (owner only, T-S060)
  router.post('/rooms/:id/playlist/next', verifyToken, notBlocked, watchPartyController.playNextFromPlaylist);

  // POST /watch-party/rooms/:id/invite — send watch party invite notification to a friend
  router.post('/rooms/:id/invite', verifyToken, notBlocked, watchPartyController.inviteUser);

  // POST aliases — mobile uses POST instead of DELETE for leave, and /join without /rooms prefix
  router.post('/rooms/:id/leave', verifyToken, notBlocked, watchPartyController.leaveRoom);
  router.post('/join/:inviteCode', verifyToken, notBlocked, joinLimiter, validate(joinRoomSchema), watchPartyController.joinRoom);

  return router;
};
