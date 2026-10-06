import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Job } from '@/models/Job';
import { Activity } from '@/models/Activity';
import { calculatePriority, transitionJobStatus } from '@/lib/services';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    const jobObj = job.toObject();
    const priorityInfo = calculatePriority(jobObj);
    return NextResponse.json({ success: true, data: { ...jobObj, calculatedPriority: priorityInfo.score, priorityInfo } });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const body = await request.json();
    
    let job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    
    if (Object.keys(body).length > 0) {
      const oldStatus = job.status;
      
      // If status is changing, do the transition logic
      if (body.status && body.status !== oldStatus) {
        // Assign other fields first (like assignedTechnician)
        const { status, ...rest } = body;
        Object.assign(job, rest);
        
        await transitionJobStatus(job, body.status);
      } else {
        Object.assign(job, body);
        await job.save();
      }
    }
    
    return NextResponse.json({ success: true, data: job });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
