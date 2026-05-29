import mongoose, { Document, Schema } from 'mongoose';

export type CampaignStatus = 'draft' | 'active' | 'sent';

export interface ICampaign extends Document {
  name: string;
  slug: string;
  description: string;
  status: CampaignStatus;
  emailSubject: string;
  emailBody: string;
  subscriberCount: number;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CampaignSchema = new Schema<ICampaign>(
  {
    name:            { type: String, required: true, trim: true },
    slug:            { type: String, required: true, unique: true, lowercase: true, trim: true },
    description:     { type: String, default: '' },
    status:          { type: String, enum: ['draft', 'active', 'sent'], default: 'draft' },
    emailSubject:    { type: String, default: '' },
    emailBody:       { type: String, default: '' },
    subscriberCount: { type: Number, default: 0 },
    sentAt:          { type: Date },
  },
  { timestamps: true },
);

export const Campaign = mongoose.model<ICampaign>('Campaign', CampaignSchema);
