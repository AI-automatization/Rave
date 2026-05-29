import mongoose, { Schema } from 'mongoose';

// Read-only reference to appsettings collection (owned by admin service)
const AppSettingRefSchema = new Schema(
  { key: String, value: Schema.Types.Mixed },
  { collection: 'appsettings', strict: false },
);

// Avoid model re-registration in watch-party (Socket.io reloads)
const AppSettingRef =
  (mongoose.models['_AppSettingRef'] as mongoose.Model<{ key: string; value: unknown }>) ??
  mongoose.model<{ key: string; value: unknown }>('_AppSettingRef', AppSettingRefSchema);

const DEFAULTS: Record<string, unknown> = {
  maintenanceMode:      false,
  registrationEnabled:  true,
  watchPartiesEnabled:  true,
  battlesEnabled:       true,
  minAppVersionIos:     '1.0.0',
  minAppVersionAndroid: '1.0.0',
  contactEmail:         'support@wewatch.uz',
  maxRoomSize:          10,
  maxRoomDurationHours: 4,
};

export async function getAppSetting<T = unknown>(key: string): Promise<T> {
  try {
    const doc = await AppSettingRef.findOne({ key }).lean();
    return ((doc?.value ?? DEFAULTS[key]) as T);
  } catch {
    return DEFAULTS[key] as T;
  }
}
