import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Redis from 'ioredis';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { verifyToken } from '@shared/middleware/auth.middleware';
import { apiRateLimiter } from '@shared/middleware/rateLimiter.middleware';
import {
  validate,
  updateProfileSchema,
  updateSettingsSchema,
  createProfileSchema,
  fcmTokenSchema,
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

  // ── Profile ──────────────────────────────────────────────
  router.get('/me', verifyToken, userController.getProfile);
  router.patch('/me', verifyToken, validate(updateProfileSchema), userController.updateProfile);

  // Avatar upload
  router.patch('/me/avatar', verifyToken, avatarUpload.single('avatar'), userController.uploadAvatar);

  // Settings
  router.get('/me/settings', verifyToken, userController.getSettings);
  router.patch('/me/settings', verifyToken, validate(updateSettingsSchema), userController.updateSettings);

  // FCM tokens
  router.post('/me/fcm-token', verifyToken, validate(fcmTokenSchema), userController.addFcmToken);
  router.delete('/me/fcm-token', verifyToken, validate(fcmTokenSchema), userController.removeFcmToken);

  // Heartbeat
  router.post('/heartbeat', verifyToken, userController.heartbeat);

  // ── Friends — all static routes BEFORE /:id ──────────────
  router.get('/me/friends', verifyToken, userController.getFriends);
  router.get('/friends', verifyToken, userController.getFriends);
  router.get('/friends/requests', verifyToken, userController.getPendingRequests);
  router.post('/friends/request', verifyToken, userController.sendFriendRequestByBody);
  router.patch('/friends/accept/:friendshipId', verifyToken, userController.acceptFriendRequestById);
  router.post('/friends/:receiverId', verifyToken, userController.sendFriendRequest);
  router.patch('/friends/:requesterId/accept', verifyToken, userController.acceptFriendRequest);
  router.delete('/friends/:friendId', verifyToken, userController.removeFriend);

  // Search — also before /:id
  router.get('/search', verifyToken, userController.searchUsers);

  // Public profile — /:id must be LAST among GET routes
  router.get('/:id', apiRateLimiter, userController.getPublicProfile);

  // ── Internal (service-to-service) ────────────────────────
  // Auth service calls this after user registration
  router.post('/internal/profile', validate(createProfileSchema), userController.createProfile);

  // Battle/other services call this to award points
  router.post('/internal/add-points', userController.addPoints);

  return router;
};
