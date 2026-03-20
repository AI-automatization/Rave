import { Schema, model, Document } from 'mongoose';

export interface IAuditLogDocument extends Document {
  adminId: string;
  adminEmail: string;
  action: string;
  targetId?: string;
  targetType?: string;
  details: Record<string, unknown>;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLogDocument>(
  {
    adminId:    { type: String, required: true },
    adminEmail: { type: String, required: true },
    action:     { type: String, required: true },
    targetId:   { type: String, default: null },
    targetType: { type: String, default: null },
    details:    { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; },
    },
  },
);

auditLogSchema.index({ adminId: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ targetId: 1 });
auditLogSchema.index({ createdAt: -1 });
// 90 kun TTL
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

export const AuditLog = model<IAuditLogDocument>('AuditLog', auditLogSchema);
