import mongoose, { Document, Schema } from 'mongoose';

export interface ICampaignSubscriber extends Document {
  campaignId: mongoose.Types.ObjectId;
  campaignSlug: string;
  email: string;
  locale: string;
  ip?: string;
  notifiedAt?: Date;
  createdAt: Date;
}

const CampaignSubscriberSchema = new Schema<ICampaignSubscriber>(
  {
    campaignId:  { type: Schema.Types.ObjectId, ref: 'Campaign', required: true },
    campaignSlug:{ type: String, required: true },
    email:       { type: String, required: true, lowercase: true, trim: true },
    locale:      { type: String, default: 'ru' },
    ip:          { type: String },
    notifiedAt:  { type: Date },
  },
  { timestamps: true },
);

// One email per campaign
CampaignSubscriberSchema.index({ campaignSlug: 1, email: 1 }, { unique: true });

export const CampaignSubscriber = mongoose.model<ICampaignSubscriber>('CampaignSubscriber', CampaignSubscriberSchema);
