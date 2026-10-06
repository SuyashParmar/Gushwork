import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Job } from '@/models/Job';
import { startOfDay } from 'date-fns';
import { calculatePriority } from '@/lib/services';

export async function GET() {
  try {
    await connectToDatabase();
    
    const todayStart = startOfDay(new Date());
    
    const jobs = await Job.find({
      status: { $nin: ['COMPLETED', 'LOST'] },
      nextFollowUpAt: { $lt: todayStart }
    }).populate('customerId', 'name companyName phone email');
    
    const jobsWithPriority = jobs.map(job => {
      const obj = job.toObject();
      return { ...obj, calculatedPriority: calculatePriority(obj).score };
    }).sort((a, b) => b.calculatedPriority - a.calculatedPriority);
    
    return NextResponse.json({ success: true, data: jobsWithPriority });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
