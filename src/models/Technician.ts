import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITechnician extends Document {
  name: string;
  activeJobs: number;
  createdAt: Date;
  updatedAt: Date;
}

const TechnicianSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    activeJobs: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const Technician: Model<ITechnician> =
  mongoose.models.Technician || mongoose.model<ITechnician>('Technician', TechnicianSchema);
