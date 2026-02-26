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
      const { bio } = req.body as { bio?: string };
      const user = await this.userService.updateProfile(userId, { bio });
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
}
