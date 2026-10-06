import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IActivity extends Document {
  jobId: mongoose.Types.ObjectId;
  type: 'CALL' | 'SMS' | 'EMAIL' | 'NOTE' | 'QUOTE_SENT' | 'STATUS_CHANGED' | 'FOLLOW_UP_COMPLETED' | 'JOB_CREATED';
  description: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema: Schema = new Schema(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    type: {
      type: String,
      enum: ['CALL', 'SMS', 'EMAIL', 'NOTE', 'QUOTE_SENT', 'STATUS_CHANGED', 'FOLLOW_UP_COMPLETED', 'JOB_CREATED'],
      required: true,
    },
    description: { type: String, required: true },
    createdBy: { type: String, default: 'System' },
  },
  {
    timestamps: true,
  }
);

ActivitySchema.index({ jobId: 1, createdAt: -1 });

export const Activity: Model<IActivity> =
  mongoose.models.Activity || mongoose.model<IActivity>('Activity', ActivitySchema);
