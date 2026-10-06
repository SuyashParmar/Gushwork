import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  companyName: string;
  phone: string;
  email?: string;
  address?: string;
  customerType: 'RESTAURANT' | 'GROCERY_STORE' | 'WAREHOUSE' | 'OTHER';
  notes?: string;
  totalJobs: number;
  totalRevenue: number;
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    companyName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    customerType: {
      type: String,
      enum: ['RESTAURANT', 'GROCERY_STORE', 'WAREHOUSE', 'OTHER'],
      default: 'OTHER',
    },
    notes: { type: String },
    totalJobs: { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

export const Customer: Model<ICustomer> =
  mongoose.models.Customer || mongoose.model<ICustomer>('Customer', CustomerSchema);
