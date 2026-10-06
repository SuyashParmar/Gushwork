# ColdSync

**Lead & Follow-Up Dashboard for Refrigeration Service Businesses**

ColdSync is a focused operational tool built for Denise, the owner of a commercial refrigeration repair company. 

## The Problem
Denise relies on phone calls, website forms, texts, and a handwritten notebook. She loses track of who she needs to follow up with, valuable jobs slip through the cracks, and she struggles to keep track of her open pipeline. Her core question every morning is: **"Who do I need to call today?"**

## The Solution
ColdSync is a lightweight lead operations dashboard that answers that exact question. It surfaces overdue follow-ups, prioritizing them intelligently based on urgency, age, and value. It centralizes all leads into a clear Kanban pipeline.

### Why this product?
This product is intentionally focused around the customer's primary pain point. Instead of building a generic CRM or prioritizing complex technician scheduling (which Denise explicitly said can come later), this app is laser-focused on her daily operations. It gives her a single screen to open every morning to know exactly what needs attention.

## Features
- **Follow-Up Engine**: A centralized operational queue that tracks exactly when a lead needs contact and what the next action is. 
- **Intelligent Prioritization**: Leads are sorted using a canonical, central priority scoring system (`calculatePriority`). It scores jobs out of 100 based on urgency, value, overdue status, and specific job stage.
- **Morning Operations Dashboard**: Instant visibility into follow-ups today, overdue items, waiting customers, and pipeline value.
- **Kanban Pipeline**: Track leads from `NEW` to `COMPLETED`.
- **Automated Lifecycle Management**: When job statuses change, the system automatically schedules the default next follow-up and determines the next action (e.g. `NEW` -> Follow up today, `QUOTE_SENT` -> Follow up in 2 days).
- **Today's Task**: A succinct, AI-generated summary of the day's top priorities.
- **AI Lead Intake**: Turn messy texts, emails, and call notes into structured jobs in seconds.

## Architecture & Tech Stack
- **Frontend**: Next.js (App Router), React, Tailwind CSS v4, shadcn/ui, Lucide Icons.
- **Backend**: Next.js Route Handlers (API Routes).
- **Database**: MongoDB Atlas with Mongoose ODM (includes connection pooling for Next.js hot-reload).
- **AI**: OpenAI API with structured JSON output and Zod validation.

## Setup Instructions

1. **Install dependencies**
```bash
npm install
```

2. **Environment Variables**
Copy `.env.example` to `.env.local` and add your keys:
```bash
cp .env.example .env.local
```
**CRITICAL**: You MUST provide your `MONGODB_URI` and `OPENAI_API_KEY`. There is no in-memory fallback.

3. **Seed the Database**
Run the seed script to populate the application with realistic demo data (this will clear existing data).
```bash
npm run seed
```

4. **Run Locally**
```bash
npm run dev
```

## Demo Walkthrough
When seeded correctly, the application will highlight these core demo states:
- **Tony's Pizza**: Walk-in freezer, QUOTE_SENT, Emergency, $2,000, Due today
- **FreshMart**: Walk-in cooler, WAITING_ON_CUSTOMER, $1,250, Overdue
- **Joe's Grocery**: NEEDS_QUOTE, $1,500, Due today
- **ABC Warehouse**: APPROVED, $900, Needs scheduling
- **Metro Foods**: SCHEDULED
- **City Market**: COMPLETED
- **Old Restaurant**: LOST

**Workflow Steps:**
1. **Open the Dashboard**: Instantly see who needs attention, sorted rigorously by calculated priority.
2. **Review AI Brief ("Today's task")**: Notice the summary pointing out Tony's Pizza as a high-priority emergency.
3. **Follow-Up Action**: Go to the "Follow-Ups" queue. Click "Mark Contacted" on an overdue job, log a note, and schedule the next follow-up. The dashboard updates immediately.
4. **View Job Details**: View a job to see priority reasoning, contact history, and a full chronological activity timeline.
5. **AI Intake**: Go to "AI Intake" and paste: *"Hi, this is Mike from Tony's Pizza. Our walk-in freezer has been warm since last night and we're losing food. Can someone come tomorrow morning? You can reach me at 555-1234."*
6. **Review AI Output**: See the AI correctly parse the urgency as EMERGENCY and extract all relevant details, then create the job and assign a default follow-up action.
