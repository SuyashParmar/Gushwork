import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Job } from '@/models/Job';
import { Customer } from '@/models/Customer';

export async function GET() {
  try {
    await connectToDatabase();
    
    const jobs = await Job.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: jobs });
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
    
    const newJob = await Job.create({
      ...body,
      customerId,
      status: body.status || 'NEW',
    });
    
    return NextResponse.json({ success: true, data: newJob });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
