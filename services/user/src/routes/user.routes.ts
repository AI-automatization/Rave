import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Redis from 'ioredis';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { DMController } from '../controllers/dm.controller';
import { DMService } from '../services/dm.service';
import { verifyToken, requireNotBlocked } from '@shared/middleware/auth.middleware';
import { apiRateLimiter } from '@shared/middleware/rateLimiter.middleware';
import { requireInternalSecret } from '@shared/utils/serviceClient';
import {
  validate,
  updateProfileSchema,
  updateSettingsSchema,
} from '../validators/user.validator';
import { config } from '../config/index';
import { LIMITS } from '@shared/constants';

// Multer config — avatar upload
const avatarStorage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(config.uploadPath, 'avatars');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits: { fileSize: LIMITS.AVATAR_MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG and WebP images are allowed'));
    }
  },
});

export const createUserRouter = (redis: Redis): Router => {
  const router = Router();
  const userService = new UserService(redis);
  const userController = new UserController(userService);
  const dmController = new DMController(new DMService());
  const notBlocked = requireNotBlocked(redis);

  // ── Profile ──────────────────────────────────────────────
  router.get('/me', verifyToken, notBlocked, userController.getProfile);
  router.patch('/me', verifyToken, notBlocked, validate(updateProfileSchema), userController.updateProfile);
  // PUT alias — mobile uses PUT
  router.put('/me', verifyToken, notBlocked, validate(updateProfileSchema), userController.updateProfile);

  // Stats
  router.get('/me/stats', verifyToken, notBlocked, userController.getMyStats);

  // Avatar upload
  router.patch('/me/avatar', verifyToken, notBlocked, avatarUpload.single('avatar'), userController.uploadAvatar);

  // Settings
  router.get('/me/settings', verifyToken, notBlocked, userController.getSettings);
  router.patch('/me/settings', verifyToken, notBlocked, validate(updateSettingsSchema), userController.updateSettings);

  // FCM tokens
  router.post('/me/fcm-token', verifyToken, notBlocked, userController.addFcmToken);
  router.delete('/me/fcm-token', verifyToken, notBlocked, userController.removeFcmToken);

  // Heartbeat
  router.post('/heartbeat', verifyToken, notBlocked, userController.heartbeat);

  // Delete account
  router.delete('/me', verifyToken, notBlocked, userController.deleteAccount);

  // ── Friends — all static routes BEFORE /:id ──────────────
  router.get('/me/friends', verifyToken, notBlocked, userController.getFriends);
  router.get('/me/friend-requests', verifyToken, notBlocked, userController.getPendingRequests);
  router.delete('/me/friends/:friendId', verifyToken, notBlocked, userController.removeFriend);

  router.get('/friends', verifyToken, notBlocked, userController.getFriends);
  router.get('/friends/requests', verifyToken, notBlocked, userController.getPendingRequests);
  router.post('/friends/request', verifyToken, notBlocked, userController.sendFriendRequestByBody);
  router.patch('/friends/accept/:friendshipId', verifyToken, notBlocked, userController.acceptFriendRequestById);
  router.post('/friends/:receiverId', verifyToken, notBlocked, userController.sendFriendRequest);
  router.patch('/friends/:requesterId/accept', verifyToken, notBlocked, userController.acceptFriendRequest);
  router.delete('/friends/:friendId', verifyToken, notBlocked, userController.removeFriend);

  // friend-requests by friendshipId (mobile uses these paths)
  router.put('/friend-requests/:friendshipId/accept', verifyToken, notBlocked, userController.acceptFriendRequestById);
  router.put('/friend-requests/:friendshipId/reject', verifyToken, notBlocked, userController.rejectFriendRequestById);
  router.patch('/friends/reject/:friendshipId', verifyToken, notBlocked, userController.rejectFriendRequestById);

  // Search — also before /:id
  router.get('/search', verifyToken, notBlocked, userController.searchUsers);

  // Stats for any user (before /:id catch-all)
  router.get('/:userId/stats', apiRateLimiter, userController.getUserStats);

  // Public profile alias — mobile calls /:id/public
  router.get('/:id/public', apiRateLimiter, userController.getPublicProfile);

  // /:userId/friend-request — mobile path for sending friend request
  router.post('/:userId/friend-request', verifyToken, notBlocked, userController.sendFriendRequestByPath);

  // Public profile — /:id must be LAST among GET routes
  router.get('/:id', apiRateLimiter, userController.getPublicProfile);

  // ── DM Chat ───────────────────────────────────────────────
  router.get('/dm/conversations', verifyToken, notBlocked, dmController.getConversations);
  router.get('/dm/:userId', verifyToken, notBlocked, dmController.getHistory);
  router.post('/dm/:userId', verifyToken, notBlocked, dmController.sendMessage);
  router.patch('/dm/:userId/read', verifyToken, notBlocked, dmController.markRead);

  // ── Internal (service-to-service) ────────────────────────
  // Notification service calls this to get FCM tokens for push delivery
  router.get('/internal/:userId/fcm-tokens', requireInternalSecret, userController.getFcmTokensInternal);

  // Notification service calls this to remove invalid/expired FCM tokens after failed push
  router.post('/internal/fcm-tokens/cleanup', requireInternalSecret, userController.removeBadFcmTokensInternal);

  // Notification broadcast — get all push tokens for all users
  router.get('/internal/admin/all-push-tokens', requireInternalSecret, userController.getAllPushTokensInternal);
  // Notification broadcast — get all user IDs (for in-app notification creation)
  router.get('/internal/admin/all-user-ids', requireInternalSecret, userController.getAllUserIdsInternal);

  // ── Admin Internal ────────────────────────────────────────
  router.patch('/internal/admin/users/:id/restrictions', requireInternalSecret, userController.adminSetRestrictions);
  router.get('/internal/users/:id/restrictions', requireInternalSecret, userController.internalGetRestrictions);
  router.get('/internal/admin/users/:id', requireInternalSecret, userController.adminGetUser);
  router.get('/internal/admin/users', requireInternalSecret, userController.adminListUsers);
  router.get('/internal/admin/stats', requireInternalSecret, userController.adminGetStats);
  router.post('/internal/admin/users/:id/block', requireInternalSecret, userController.adminBlockUser);
  router.post('/internal/admin/users/:id/unblock', requireInternalSecret, userController.adminUnblockUser);
  router.patch('/internal/admin/users/:id/role', requireInternalSecret, userController.adminChangeUserRole);
  router.delete('/internal/admin/users/:id', requireInternalSecret, userController.adminDeleteUser);

  return router;
};
