import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service';
import { apiResponse } from '@shared/utils/apiResponse';
import { AuthenticatedRequest } from '@shared/types';

export class UserController {
  constructor(private userService: UserService) {}

  getProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const user = await this.userService.getProfile(userId);
      res.json(apiResponse.success(user));
    } catch (error) {
      next(error);
    }
  };

  searchUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const q = (req.query['q'] as string) ?? '';
      const users = await this.userService.searchUsers(q, userId);
      res.json(apiResponse.success(users));
    } catch (error) {
      next(error);
    }
  };

  getPublicProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const user = await this.userService.getPublicProfile(id);
      res.json(apiResponse.success(user));
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { username, bio } = req.body as { username?: string; bio?: string };
      const user = await this.userService.updateProfile(userId, { username, bio });
      res.json(apiResponse.success(user, 'Profile updated'));
    } catch (error) {
      next(error);
    }
  };

  heartbeat = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      await this.userService.heartbeat(userId);
      res.json(apiResponse.success(null, 'Heartbeat received'));
    } catch (error) {
      next(error);
    }
  };

  getPendingRequests = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const requests = await this.userService.getPendingRequests(userId);
      res.json(apiResponse.success(requests));
    } catch (error) {
      next(error);
    }
  };

  sendFriendRequestByBody = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { userId: receiverId } = req.body as { userId: string };
      if (!receiverId) { res.status(400).json(apiResponse.error('userId required')); return; }
      await this.userService.sendFriendRequestByProfileId(userId, receiverId);
      res.status(201).json(apiResponse.success(null, 'Friend request sent'));
    } catch (error) {
      next(error);
    }
  };

  acceptFriendRequestById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { friendshipId } = req.params;
      await this.userService.acceptFriendRequestById(userId, friendshipId);
      res.json(apiResponse.success(null, 'Friend request accepted'));
    } catch (error) {
      next(error);
    }
  };

  sendFriendRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { receiverId } = req.params;
      await this.userService.sendFriendRequest(userId, receiverId);
      res.status(201).json(apiResponse.success(null, 'Friend request sent'));
    } catch (error) {
      next(error);
    }
  };

  acceptFriendRequest = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { requesterId } = req.params;
      await this.userService.acceptFriendRequest(userId, requesterId);
      res.json(apiResponse.success(null, 'Friend request accepted'));
    } catch (error) {
      next(error);
    }
  };

  removeFriend = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { friendId } = req.params;
      await this.userService.removeFriend(userId, friendId);
      res.json(apiResponse.success(null, 'Friend removed'));
    } catch (error) {
      next(error);
    }
  };

  getFriends = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const friends = await this.userService.getFriends(userId);
      res.json(apiResponse.success(friends));
    } catch (error) {
      next(error);
    }
  };

  uploadAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      if (!req.file) {
        res.status(400).json(apiResponse.error('No file uploaded'));
        return;
      }
      const avatarPath = `/uploads/avatars/${req.file.filename}`;
      const user = await this.userService.updateAvatar(userId, avatarPath);
      res.json(apiResponse.success({ avatarUrl: user.avatar }, 'Avatar updated'));
    } catch (error) {
      next(error);
    }
  };

  getSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const settings = await this.userService.getSettings(userId);
      res.json(apiResponse.success(settings));
    } catch (error) {
      next(error);
    }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { notifications, privacy } = req.body as {
        notifications?: Record<string, boolean>;
        privacy?: Record<string, boolean>;
      };
      const settings = await this.userService.updateSettings(userId, { notifications, privacy });
      res.json(apiResponse.success(settings, 'Settings updated'));
    } catch (error) {
      next(error);
    }
  };

  rejectFriendRequestById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      await this.userService.rejectFriendRequestById(userId, req.params.friendshipId);
      res.json(apiResponse.success(null, 'Friend request rejected'));
    } catch (error) {
      next(error);
    }
  };

  deleteAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      await this.userService.deleteAccount(userId);
      res.json(apiResponse.success(null, 'Account deleted'));
    } catch (error) {
      next(error);
    }
  };

  getMyStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const stats = await this.userService.getUserStats(userId);
      res.json(apiResponse.success(stats));
    } catch (error) {
      next(error);
    }
  };

  getUserStats = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.userService.getUserStats(req.params.userId);
      res.json(apiResponse.success(stats));
    } catch (error) {
      next(error);
    }
  };

  sendFriendRequestByPath = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const { userId: receiverId } = req.params;
      await this.userService.sendFriendRequest(userId, receiverId);
      res.status(201).json(apiResponse.success(null, 'Friend request sent'));
    } catch (error) {
      next(error);
    }
  };

  addFcmToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      // Mobile sends 'fcmToken', some clients send 'token'
      const body = req.body as { token?: string; fcmToken?: string };
      const token = body.token ?? body.fcmToken ?? '';
      if (!token) { res.status(400).json(apiResponse.error('token is required')); return; }
      await this.userService.addFcmToken(userId, token);
      res.json(apiResponse.success(null, 'FCM token registered'));
    } catch (error) {
      next(error);
    }
  };

  removeFcmToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = (req as AuthenticatedRequest).user;
      const body = req.body as { token?: string; fcmToken?: string };
      const token = body.token ?? body.fcmToken ?? '';
      if (!token) {
        // No specific token → logout scenario: remove all tokens for this user
        await this.userService.removeAllFcmTokens(userId);
        res.json(apiResponse.success(null, 'FCM tokens cleared'));
        return;
      }
      await this.userService.removeFcmToken(userId, token);
      res.json(apiResponse.success(null, 'FCM token removed'));
    } catch (error) {
      next(error);
    }
  };

  // Internal — called by notification service to remove stale/invalid FCM tokens
  removeBadFcmTokensInternal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { tokens } = req.body as { tokens?: string[] };
      if (!Array.isArray(tokens) || tokens.length === 0) {
        res.status(400).json(apiResponse.error('tokens array is required'));
        return;
      }
      await this.userService.removeBadFcmTokens(tokens);
      res.json(apiResponse.success(null, `${tokens.length} bad tokens removed`));
    } catch (error) {
      next(error);
    }
  };

  // Internal — called by notification service to get FCM tokens
  getFcmTokensInternal = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { userId } = req.params;
      const tokens = await this.userService.getFcmTokens(userId);
      res.json(apiResponse.success({ tokens }));
    } catch (error) {
      next(error);
    }
  };

  // ── Admin Internal Controllers ────────────────────────────────

  adminListUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = Math.max(1, parseInt(req.query.page as string ?? '1', 10) || 1);
      const limit = Math.min(Math.max(1, parseInt(req.query.limit as string ?? '20', 10) || 20), 100);
      const role = req.query.role as string | undefined;
      const search = req.query.search as string | undefined;
      const isBlockedParam = req.query.isBlocked as string | undefined;
      const isBlocked = isBlockedParam !== undefined ? isBlockedParam === 'true' : undefined;
      const result = await this.userService.adminListUsers({ page, limit, role, isBlocked, search });
      res.json(apiResponse.success(result));
    } catch (error) {
      next(error);
    }
  };

  adminBlockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reason } = req.body as { reason?: string };
      await this.userService.adminBlockUser(req.params.id, reason);
      res.json(apiResponse.success(null, 'User blocked'));
    } catch (error) {
      next(error);
    }
  };

  adminUnblockUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.userService.adminUnblockUser(req.params.id);
      res.json(apiResponse.success(null, 'User unblocked'));
    } catch (error) {
      next(error);
    }
  };

  adminChangeUserRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { role } = req.body as { role: string };
      await this.userService.adminChangeUserRole(req.params.id, role);
      res.json(apiResponse.success(null, 'Role updated'));
    } catch (error) {
      next(error);
    }
  };

  adminGetUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.adminGetUser(req.params.id);
      if (!user) { res.status(404).json(apiResponse.error('User not found')); return; }
      res.json(apiResponse.success(user));
    } catch (error) { next(error); }
  };

  adminSetRestrictions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { restrictions } = req.body as { restrictions: string[] };
      await this.userService.adminSetRestrictions(req.params.id, Array.isArray(restrictions) ? restrictions : []);
      res.json(apiResponse.success(null, 'Restrictions updated'));
    } catch (error) { next(error); }
  };

  internalGetRestrictions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.userService.getProfile(req.params.id);
      res.json(apiResponse.success({ restrictions: user.restrictions ?? [] }));
    } catch (error) { next(error); }
  };

  adminDeleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.userService.adminDeleteUser(req.params.id);
      res.json(apiResponse.success(null, 'User deleted'));
    } catch (error) {
      next(error);
    }
  };

  adminGetStats = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.userService.adminGetStats();
      res.json(apiResponse.success(stats));
    } catch (error) {
      next(error);
    }
  };

  getAllPushTokensInternal = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tokens = await this.userService.getAllPushTokens();
      res.json(apiResponse.success({ tokens }));
    } catch (error) {
      next(error);
    }
  };

  getAllUserIdsInternal = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userIds = await this.userService.getAllUserIds();
      res.json(apiResponse.success({ userIds }));
    } catch (error) {
      next(error);
    }
  };
}
