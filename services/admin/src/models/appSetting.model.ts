import { Schema, Document } from 'mongoose';
import { dbConnection } from '../db';

export interface IAppSettingDocument extends Document {
  key: string;
  value: unknown;
  updatedAt: Date;
}

const schema = new Schema<IAppSettingDocument>(
  {
    key:   { type: String, required: true, unique: true },
    value: { type: Schema.Types.Mixed, required: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true, transform: (_d, ret) => { Reflect.deleteProperty(ret, '__v'); return ret; } },
  },
);

export const AppSetting = dbConnection.model<IAppSettingDocument>('AppSetting', schema);
