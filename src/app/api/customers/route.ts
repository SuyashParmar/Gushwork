import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Customer } from '@/models/Customer';

export async function GET() {
  try {
    await connectToDatabase();
    
    const customers = await Customer.find({}).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: customers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await connectToDatabase();
    
    const body = await request.json();
    const newCustomer = await Customer.create(body);
    
    return NextResponse.json({ success: true, data: newCustomer });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
