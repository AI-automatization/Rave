import { Router } from 'express';
import Redis from 'ioredis';
import { UserController } from '../controllers/user.controller';
import { UserService } from '../services/user.service';
import { verifyToken } from '@shared/middleware/auth.middleware';
import { apiRateLimiter } from '@shared/middleware/rateLimiter.middleware';

export const createUserRouter = (redis: Redis): Router => {
  const router = Router();
  const userService = new UserService(redis);
  const userController = new UserController(userService);

  // GET /users/me — authenticated user profile
  router.get('/me', verifyToken, userController.getProfile);

  // PATCH /users/me — update profile
  router.patch('/me', verifyToken, userController.updateProfile);

  // POST /users/heartbeat — online status
  router.post('/heartbeat', verifyToken, userController.heartbeat);

  // GET /users/:id — public profile
  router.get('/:id', apiRateLimiter, userController.getPublicProfile);

  // Friends
  router.get('/me/friends', verifyToken, userController.getFriends);
  router.post('/friends/:receiverId', verifyToken, userController.sendFriendRequest);
  router.patch('/friends/:requesterId/accept', verifyToken, userController.acceptFriendRequest);
  router.delete('/friends/:friendId', verifyToken, userController.removeFriend);

  return router;
};
