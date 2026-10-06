import { NextResponse } from 'next/server';
import connectToDatabase from '@/lib/mongodb';
import { Activity } from '@/models/Activity';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;
    const activities = await Activity.find({ jobId: id }).sort({ createdAt: -1 });
    return NextResponse.json({ success: true, data: activities });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
