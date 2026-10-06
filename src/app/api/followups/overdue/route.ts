import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Job } from '@/models/Job';
import { startOfDay } from 'date-fns';

export async function GET() {
  try {
    await connectToDatabase();
    
    const todayStart = startOfDay(new Date());
    
    const jobs = await Job.find({
      status: { $nin: ['COMPLETED', 'LOST'] },
      nextFollowUpAt: { $lt: todayStart }
    }).populate('customerId', 'name companyName phone email');
    
    return NextResponse.json({ success: true, data: jobs });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
