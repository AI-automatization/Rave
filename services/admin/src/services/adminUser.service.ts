import Redis from 'ioredis';
import { logger } from '@shared/utils/logger';
import { REDIS_KEYS } from '@shared/constants';
import { SupportConversation } from '../models/supportConversation.model';
import { SupportMessage } from '../models/supportMessage.model';
import { Appeal } from '../models/appeal.model';
import { Feedback } from '../models/feedback.model';
import { AuditLog } from '../models/auditLog.model';
import {
  adminListUsers,
  adminBlockUser,
  adminUnblockUser,
  adminChangeUserRole,
  adminDeleteUser,
  deleteAuthUser,
  revokeUserSessions,
  createStaffAccount,
  syncAdminProfile,
} from '@shared/utils/serviceClient';
import { adminSetUserRestrictions } from '@shared/utils/adminServiceClient';

export class AdminUserService {
  constructor(private redis: Redis) {}

  private async logAudit(
    adminId: string,
    adminEmail: string,
    action: string,
    details: Record<string, unknown>,
    targetId?: string,
    targetType?: string,
  ): Promise<void> {
    try {
      await AuditLog.create({ adminId, adminEmail, action, targetId, targetType, details });
    } catch (err) {
      logger.warn('Audit log write failed', { error: (err as Error).message, action, adminId });
    }
  }

  async listUsers(filters: {
    page: number;
    limit: number;
    role?: string;
    isBlocked?: boolean;
    search?: string;
  }): Promise<{ users: unknown[]; total: number }> {
    return adminListUsers(filters);
  }

  async blockUser(userId: string, adminId: string, adminEmail: string, reason?: string): Promise<void> {
    await adminBlockUser(userId, reason);
    await this.redis.del(REDIS_KEYS.userSession(userId));
    await this.redis.set(REDIS_KEYS.blockedUser(userId), '1');
    logger.info('User blocked by admin', { userId, adminId, reason });
    await this.logAudit(adminId, adminEmail, 'block_user', { reason: reason ?? null }, userId, 'user');
  }

  async unblockUser(userId: string, adminId: string, adminEmail: string): Promise<void> {
    await adminUnblockUser(userId);
    await this.redis.del(REDIS_KEYS.blockedUser(userId));
    logger.info('User unblocked by admin', { userId, adminId });
    await this.logAudit(adminId, adminEmail, 'unblock_user', {}, userId, 'user');
  }

  async changeUserRole(userId: string, newRole: string, adminId: string, adminEmail: string): Promise<void> {
    await adminChangeUserRole(userId, newRole);
    logger.info('User role changed by admin', { userId, newRole, adminId });
    await this.logAudit(adminId, adminEmail, 'change_role', { newRole }, userId, 'user');
  }

  async deleteUser(userId: string, adminId: string, adminEmail: string): Promise<void> {
    await adminDeleteUser(userId);
    await deleteAuthUser(userId);
    await revokeUserSessions(userId);
    await this.redis.del(REDIS_KEYS.blockedUser(userId));
    await this.redis.del(REDIS_KEYS.userSession(userId));
    logger.warn('User fully deleted by admin (user + auth DB)', { userId, adminId });
    await this.logAudit(adminId, adminEmail, 'delete_user', {}, userId, 'user');
  }

  async createStaff(
    email: string,
    username: string,
    password: string,
    role: 'admin' | 'operator' | 'moderator',
    createdByAdminId: string,
    createdByAdminEmail: string,
  ): Promise<{ authId: string }> {
    const result = await createStaffAccount(email, username, password, role);
    void syncAdminProfile(result.authId, email, username, role);
    await AuditLog.create({
      adminId: createdByAdminId,
      adminEmail: createdByAdminEmail,
      action: 'create_staff',
      targetId: result.authId,
      details: { email, username, role },
    });
    logger.info('Staff account created by admin', { email, role, createdByAdminId });
    return result;
  }

  async listStaff(page: number, limit: number): Promise<{ users: unknown[]; total: number }> {
    return adminListUsers({ page, limit, role: 'admin,operator,moderator,superadmin' });
  }

  async deleteStaff(targetAuthId: string, adminId: string, adminEmail: string): Promise<void> {
    await adminDeleteUser(targetAuthId);
    await deleteAuthUser(targetAuthId);
    await revokeUserSessions(targetAuthId);
    await AuditLog.create({
      adminId,
      adminEmail,
      action: 'delete_staff',
      targetId: targetAuthId,
      details: {},
    });
    logger.warn('Staff account fully deleted by superadmin', { targetAuthId, adminId });
  }

  async setUserRestrictions(userId: string, restrictions: string[]): Promise<void> {
    await adminSetUserRestrictions(userId, restrictions);
  }

  async deleteUserData(userId: string): Promise<void> {
    const convIds = await SupportConversation.find({ userId }).distinct('_id');
    await Promise.all([
      SupportMessage.deleteMany({ conversationId: { $in: convIds } }),
      SupportConversation.deleteMany({ userId }),
      Appeal.deleteMany({ userId }),
      Feedback.deleteMany({ userId }),
    ]);
    logger.info('AdminService: deleted user data', { userId });
  }
}
