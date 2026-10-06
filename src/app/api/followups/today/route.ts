import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Job } from '@/models/Job';
import { startOfDay, endOfDay } from 'date-fns';

export async function GET() {
  try {
    await connectToDatabase();
    
    const today = new Date();
    const start = startOfDay(today);
    const end = endOfDay(today);
    
    const jobs = await Job.find({
      status: { $nin: ['COMPLETED', 'LOST'] },
      nextFollowUpAt: { $gte: start, $lte: end }
    }).populate('customerId', 'name companyName phone email');
    
    return NextResponse.json({ success: true, data: jobs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
