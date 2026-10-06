import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Job } from '@/models/Job';
import { Activity } from '@/models/Activity';
import { createActivity } from '@/lib/services';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const { contactMethod, notes, nextFollowUp } = body;
    
    if (!contactMethod) {
      return NextResponse.json({ success: false, error: 'Missing contact method' }, { status: 400 });
    }
    
    const job = await Job.findById(id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    
    job.lastContactedAt = new Date();
    
    if (nextFollowUp === 'none' || !nextFollowUp) {
      job.nextFollowUpAt = undefined;
    } else {
      job.nextFollowUpAt = new Date(nextFollowUp);
    }
    
    // Add activity
    const activityDesc = notes ? `Contacted via ${contactMethod}. Notes: ${notes}` : `Contacted via ${contactMethod}.`;
    await createActivity(id, contactMethod.toUpperCase(), activityDesc);
    
    await job.save();
    
    return NextResponse.json({ success: true, data: job });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
