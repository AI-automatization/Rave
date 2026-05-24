import { Request, Response, NextFunction } from 'express';
import { AppSetting } from '../models/appSetting.model';
import { apiResponse } from '@shared/utils/apiResponse';

const DEFAULTS: Record<string, unknown> = {
  maintenanceMode:       false,
  registrationEnabled:   true,
  watchPartiesEnabled:   true,
  battlesEnabled:        true,
  minAppVersionIos:      '1.0.0',
  minAppVersionAndroid:  '1.0.0',
  contactEmail:          'support@wewatch.uz',
  maxRoomSize:           10,
  maxRoomDurationHours:  4,
};

export class SettingsController {
  getAll = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const docs = await AppSetting.find().lean();
      const saved = Object.fromEntries(docs.map((d) => [d.key, d.value]));
      const settings = { ...DEFAULTS, ...saved };
      res.json(apiResponse.success(settings));
    } catch (err) {
      next(err);
    }
  };

  set = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { key } = req.params;
      if (!(key in DEFAULTS)) {
        res.status(400).json(apiResponse.error('Unknown setting key'));
        return;
      }
      const { value } = req.body;
      await AppSetting.findOneAndUpdate({ key }, { value }, { upsert: true, new: true });
      res.json(apiResponse.success({ key, value }));
    } catch (err) {
      next(err);
    }
  };

  reset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { key } = req.params;
      await AppSetting.deleteOne({ key });
      res.json(apiResponse.success({ key, value: DEFAULTS[key] ?? null }));
    } catch (err) {
      next(err);
    }
  };
}
