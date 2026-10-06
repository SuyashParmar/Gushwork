import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Job } from '@/models/Job';
import { getFollowUpStatus } from '@/lib/services';

export async function GET() {
  try {
    await connectToDatabase();
    
    const activeJobs = await Job.find({ status: { $nin: ['COMPLETED', 'LOST'] } });
    
    let followUpsToday = 0;
    let overdueFollowUps = 0;
    let waitingOnCustomer = 0;
    let quotesPending = 0;
    let approvedJobs = 0;
    let openPipelineValue = 0;
    
    activeJobs.forEach(job => {
      const followUpStatus = getFollowUpStatus(job.nextFollowUpAt);
      if (followUpStatus === 'TODAY') followUpsToday++;
      if (followUpStatus === 'OVERDUE') overdueFollowUps++;
      
      if (job.status === 'WAITING_ON_CUSTOMER') waitingOnCustomer++;
      if (job.status === 'NEEDS_QUOTE') quotesPending++;
      if (job.status === 'APPROVED') approvedJobs++;
      
      openPipelineValue += (job.estimatedValue || 0);
    });
    
    const completedJobs = await Job.countDocuments({ status: 'COMPLETED' });
    const lostJobs = await Job.countDocuments({ status: 'LOST' });
    
    const wonJobs = await Job.find({ status: 'COMPLETED' });
    const wonValue = wonJobs.reduce((sum, job) => sum + (job.estimatedValue || 0), 0);
    
    return NextResponse.json({
      success: true,
      data: {
        totalOpenJobs: activeJobs.length,
        followUpsToday,
        overdueFollowUps,
        waitingOnCustomer,
        quotesPending,
        approvedJobs,
        completedJobs,
        lostJobs,
        openPipelineValue,
        wonValue
      }
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
