import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Job } from '@/models/Job';
import { Customer } from '@/models/Customer';
import { ensureActiveJobHasFollowUp, createActivity, calculatePriority } from '@/lib/services';

export async function GET() {
  try {
    await connectToDatabase();
    
    const jobs = await Job.find({}).sort({ createdAt: -1 });
    const jobsWithPriority = jobs.map(job => {
      const obj = job.toObject();
      return { ...obj, calculatedPriority: calculatePriority(obj).score };
    });
    return NextResponse.json({ success: true, data: jobsWithPriority });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    let customerId = body.customerId;
    
    // If no customerId is provided but customerName and phone are, we try to find or create
    if (!customerId) {
      if (!body.customerName || !body.companyName || !body.phone) {
        return NextResponse.json({ success: false, error: 'Missing customer information' }, { status: 400 });
      }
      
      let customer = await Customer.findOne({ 
        companyName: body.companyName, 
        phone: body.phone 
      });
      
      if (!customer) {
        customer = await Customer.create({
          name: body.customerName,
          companyName: body.companyName,
          phone: body.phone,
          email: body.email,
        });
      }
      customerId = customer._id;
    }
    
    const newJob = new Job({
      ...body,
      customerId,
      status: body.status || 'NEW',
    });
    
    ensureActiveJobHasFollowUp(newJob, new Date(), body.suggestedFollowUp);
    await newJob.save();

    await createActivity(newJob._id.toString(), 'JOB_CREATED', 'New job created');
    
    return NextResponse.json({ success: true, data: newJob });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
