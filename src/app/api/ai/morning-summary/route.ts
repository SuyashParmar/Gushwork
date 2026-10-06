import { NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import connectToDatabase from '@/lib/mongodb';
import { Job } from '@/models/Job';
import { getFollowUpStatus } from '@/lib/services';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || 'dummy_key',
  baseURL: 'https://api.groq.com/openai/v1',
});

export async function GET() {
  try {
    await connectToDatabase();

    const activeJobs = await Job.find({ status: { $nin: ['COMPLETED', 'LOST'] } });
    
    let followUpsToday = 0;
    let overdueFollowUps = 0;
    let waitingOnCustomer = 0;
    let approvedJobs = 0;
    let openPipelineValue = 0;
    
    // Sort jobs by priority-like logic to find highest value/priority
    const prioritizedJobs = activeJobs.map(job => {
      const followUpStatus = getFollowUpStatus(job.nextFollowUpAt);
      if (followUpStatus === 'TODAY') followUpsToday++;
      if (followUpStatus === 'OVERDUE') overdueFollowUps++;
      
      if (job.status === 'WAITING_ON_CUSTOMER') waitingOnCustomer++;
      if (job.status === 'APPROVED') approvedJobs++;
      
      openPipelineValue += (job.estimatedValue || 0);
      
      let priority = 0;
      if (job.urgency === 'EMERGENCY') priority += 40;
      if (followUpStatus === 'OVERDUE') priority += 30;
      if (job.estimatedValue) priority += (job.estimatedValue / 100);
      
      return { ...job.toObject(), calculatedPriority: priority };
    }).sort((a, b) => b.calculatedPriority - a.calculatedPriority);

    const highestPriorityLead = prioritizedJobs[0];

    const fallbackSummary = `You have ${followUpsToday} follow-ups today, including ${overdueFollowUps} overdue items. Your highest-value follow-up is ${highestPriorityLead?.companyName || 'none'} at $${highestPriorityLead?.estimatedValue || 0}.`;

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ success: true, data: { summary: fallbackSummary } });
    }

    const dataContext = {
      followUpsToday,
      overdueFollowUps,
      waitingOnCustomer,
      approvedJobs,
      openPipelineValue,
      highestPriorityLead: highestPriorityLead ? {
        company: highestPriorityLead.companyName,
        issue: highestPriorityLead.issueDescription,
        urgency: highestPriorityLead.urgency,
        value: highestPriorityLead.estimatedValue
      } : null
    };

    const hour = new Date().getHours();
    let timeOfDay = 'morning';
    if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17) timeOfDay = 'evening';

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant generating a short briefing for Denise, the owner of a commercial refrigeration repair business. It is currently the ${timeOfDay}. Write exactly one short, conversational paragraph (max 3 sentences) greeting her properly based on the time of day. Do NOT use markdown lists, bullet points, bold text, or long formatting. Be punchy and actionable.`
        },
        {
          role: 'user',
          content: `Write a short 2-3 sentence conversational paragraph summarizing today's situation based on this data: ${JSON.stringify(dataContext)}`
        }
      ]
    });

    const aiSummary = completion.choices[0].message.content;

    return NextResponse.json({ success: true, data: { summary: aiSummary } });
  } catch (error: any) {
    console.error('Morning Brief Error:', error);
    return NextResponse.json({ 
      success: true, 
      data: { summary: 'Good morning! (AI service temporarily unavailable). Please review your dashboard for today\'s tasks.' } 
    });
  }
}
