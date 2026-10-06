import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IJob extends Document {
  customerId: mongoose.Types.ObjectId;
  companyName: string;
  customerName: string;
  phone: string;
  email?: string;
  serviceType: string;
  issueDescription: string;
  source: 'PHONE' | 'WEBSITE' | 'TEXT' | 'REFERRAL' | 'REPEAT_CUSTOMER' | 'MANUAL';
  status: 'NEW' | 'NEEDS_QUOTE' | 'QUOTE_SENT' | 'WAITING_ON_CUSTOMER' | 'APPROVED' | 'SCHEDULED' | 'COMPLETED' | 'LOST';
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  estimatedValue?: number;
  assignedTechnician?: string;
  assignedTechnicianPhone?: string;
  lastContactedAt?: Date;
  nextFollowUpAt?: Date;
  nextAction?: string;
  quoteSentAt?: Date;
  approvedAt?: Date;
  scheduledAt?: Date;
  completedAt?: Date;
  notes?: string;
  tags?: string[];
  lostReason?: string;
  aiSummary?: string;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    companyName: { type: String, required: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    serviceType: { type: String, required: true },
    issueDescription: { type: String, required: true },
    source: {
      type: String,
      enum: ['PHONE', 'WEBSITE', 'TEXT', 'REFERRAL', 'REPEAT_CUSTOMER', 'MANUAL'],
      default: 'MANUAL',
    },
    status: {
      type: String,
      enum: ['NEW', 'NEEDS_QUOTE', 'QUOTE_SENT', 'WAITING_ON_CUSTOMER', 'APPROVED', 'SCHEDULED', 'COMPLETED', 'LOST'],
      default: 'NEW',
    },
    urgency: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'],
      default: 'MEDIUM',
    },
    estimatedValue: { type: Number },
    assignedTechnician: { type: String },
    assignedTechnicianPhone: { type: String },
    lastContactedAt: { type: Date },
    nextFollowUpAt: { type: Date },
    nextAction: { type: String },
    quoteSentAt: { type: Date },
    approvedAt: { type: Date },
    scheduledAt: { type: Date },
    completedAt: { type: Date },
    notes: { type: String },
    tags: [{ type: String }],
    lostReason: { type: String },
    aiSummary: { type: String },
  },
  {
    timestamps: true,
  }
);

// Add indexes for common queries
JobSchema.index({ status: 1 });
JobSchema.index({ nextFollowUpAt: 1 });
JobSchema.index({ createdAt: -1 });
JobSchema.index({ customerId: 1 });
JobSchema.index({ companyName: 1 });

export const Job: Model<IJob> = mongoose.models.Job || mongoose.model<IJob>('Job', JobSchema);
