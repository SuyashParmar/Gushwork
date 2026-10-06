import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { z } from 'zod';

const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || 'dummy_key',
  baseURL: 'https://api.groq.com/openai/v1',
});

const extractedLeadSchema = z.object({
  customerName: z.string(),
  companyName: z.string(),
  phone: z.string(),
  email: z.string().optional().nullable(),
  serviceType: z.string(),
  issueDescription: z.string(),
  source: z.enum(['PHONE', 'WEBSITE', 'TEXT', 'REFERRAL', 'REPEAT_CUSTOMER', 'MANUAL']).default('MANUAL'),
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY']).default('MEDIUM'),
  estimatedValue: z.number().optional().nullable(),
  requestedTime: z.string().optional().nullable(),
  suggestedFollowUp: z.enum(['Today', 'Tomorrow', 'Next Week']).optional().nullable(),
  summary: z.string(),
});

export async function POST(request: Request) {
  try {
    const { input } = await request.json();

    if (!input) {
      return NextResponse.json({ success: false, error: 'Input is required' }, { status: 400 });
    }

    if (!process.env.GROQ_API_KEY) {
      // Fallback if no API key is provided
      return NextResponse.json({
        success: false,
        error: 'AI temporarily unavailable. You can still enter the job manually.'
      }, { status: 503 });
    }

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      messages: [
        {
          role: 'system',
          content: `You are an AI assistant for a commercial refrigeration repair company. 
Extract the job details from the following customer message/call notes and format it as JSON.
Follow this schema strictly:
- customerName: string
- companyName: string
- phone: string
- email: string (optional)
- serviceType: string (e.g., "Walk-in freezer repair", "Ice machine repair")
- issueDescription: string (the exact problem)
- source: enum ('PHONE', 'WEBSITE', 'TEXT', 'REFERRAL', 'REPEAT_CUSTOMER', 'MANUAL')
- urgency: enum ('LOW', 'MEDIUM', 'HIGH', 'EMERGENCY') (If food is at risk or it's a walk-in freezer failure, it's EMERGENCY or HIGH)
- estimatedValue: number (estimate based on typical repair costs if obvious, else null)
- requestedTime: string (e.g., "tomorrow morning")
- suggestedFollowUp: enum ('Today', 'Tomorrow', 'Next Week')
- summary: string (1-2 sentence summary of the issue)`
        },
        {
          role: 'user',
          content: input
        }
      ],
      response_format: { type: 'json_object' }
    });

    const resultText = completion.choices[0].message.content;
    if (!resultText) {
      throw new Error('No response from AI');
    }

    const jsonResult = JSON.parse(resultText);
    const parsedData = extractedLeadSchema.parse(jsonResult);

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error: any) {
    console.error('AI Extraction Error:', error);
    // If it's a validation error, return that
    if (error instanceof z.ZodError) {
      return NextResponse.json({ success: false, error: 'AI output validation failed: ' + error.message }, { status: 422 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
