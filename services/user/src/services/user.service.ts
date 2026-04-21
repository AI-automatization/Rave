import Redis from 'ioredis';
import { ProfileService } from './profile.service';
import { FriendshipService } from './friendship.service';

export { ProfileService } from './profile.service';
export { FriendshipService } from './friendship.service';

export class UserService {
  private profile: ProfileService;
  private friendship: FriendshipService;

  constructor(redis: Redis) {
    this.profile = new ProfileService(redis);
    this.friendship = new FriendshipService();
  }

  // Delegate ALL methods — backward compatible
  getProfile = (userId: string) => this.profile.getProfile(userId);
  getPublicProfile = (userId: string) => this.profile.getPublicProfile(userId);
  updateProfile = (...args: Parameters<ProfileService['updateProfile']>) => this.profile.updateProfile(...args);
  heartbeat = (userId: string) => this.profile.heartbeat(userId);
  isUserOnline = (userId: string) => this.profile.isUserOnline(userId);
  updateAvatar = (userId: string, path: string) => this.profile.updateAvatar(userId, path);
  getSettings = (userId: string) => this.profile.getSettings(userId);
  updateSettings = (...args: Parameters<ProfileService['updateSettings']>) => this.profile.updateSettings(...args);
  createProfile = (authId: string, email: string, username: string) => this.profile.createProfile(authId, email, username);
  addFcmToken = (userId: string, token: string) => this.profile.addFcmToken(userId, token);
  removeFcmToken = (userId: string, token: string) => this.profile.removeFcmToken(userId, token);
  getFcmTokens = (userId: string) => this.profile.getFcmTokens(userId);
  getAllPushTokens = () => this.profile.getAllPushTokens();
  searchUsers = (query: string, requesterId: string) => this.profile.searchUsers(query, requesterId);
  addPoints = (userId: string, points: number) => this.profile.addPoints(userId, points);
  getUserStats = (userId: string) => this.profile.getUserStats(userId);
  adminListUsers = (filters: Parameters<ProfileService['adminListUsers']>[0]) => this.profile.adminListUsers(filters);
  adminBlockUser = (userId: string, reason?: string) => this.profile.adminBlockUser(userId, reason);
  adminUnblockUser = (userId: string) => this.profile.adminUnblockUser(userId);
  syncAdminProfile = (authId: string, email: string, username: string, role: string) => this.profile.syncAdminProfile(authId, email, username, role);
  adminChangeUserRole = (userId: string, role: string) => this.profile.adminChangeUserRole(userId, role);
  adminDeleteUser = (userId: string) => this.profile.adminDeleteUser(userId);
  adminGetStats = () => this.profile.adminGetStats();
  deleteAccount = (userId: string) => this.profile.deleteAccount(userId);
  sendFriendRequestByProfileId = (requesterId: string, profileId: string) => this.friendship.sendFriendRequestByProfileId(requesterId, profileId);
  sendFriendRequest = (requesterId: string, receiverId: string) => this.friendship.sendFriendRequest(requesterId, receiverId);
  acceptFriendRequest = (userId: string, requesterId: string) => this.friendship.acceptFriendRequest(userId, requesterId);
  acceptFriendRequestById = (userId: string, friendshipId: string) => this.friendship.acceptFriendRequestById(userId, friendshipId);
  rejectFriendRequestById = (userId: string, friendshipId: string) => this.friendship.rejectFriendRequestById(userId, friendshipId);
  removeFriend = (userId: string, friendId: string) => this.friendship.removeFriend(userId, friendId);
  getPendingRequests = (userId: string) => this.friendship.getPendingRequests(userId);
  getFriends = (userId: string) => this.friendship.getFriends(userId);
}
