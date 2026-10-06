import { addDays, differenceInDays, isTomorrow, startOfDay } from 'date-fns';
import { IJob, Job } from '../models/Job';
import { Activity } from '../models/Activity';
import connectToDatabase from './mongodb';

export function getDefaultNextAction(status: string): string | null {
  switch (status) {
    case 'NEW': return 'Contact customer';
    case 'NEEDS_QUOTE': return 'Prepare / send quote';
    case 'QUOTE_SENT': return 'Follow up on quote';
    case 'WAITING_ON_CUSTOMER': return 'Follow up with customer';
    case 'APPROVED': return 'Schedule technician';
    case 'SCHEDULED': return 'Service scheduled';
    case 'COMPLETED':
    case 'LOST':
    default:
      return null;
  }
}

export function getDefaultNextFollowUp(status: string, now: Date = new Date()): Date | null {
  const today = startOfDay(now);
  switch (status) {
    case 'NEW':
    case 'NEEDS_QUOTE':
    case 'APPROVED':
      return today;
    case 'QUOTE_SENT':
    case 'WAITING_ON_CUSTOMER':
      return addDays(today, 2);
    case 'SCHEDULED':
    case 'COMPLETED':
    case 'LOST':
    default:
      return null;
  }
}

export function getFollowUpStatus(job: Partial<IJob>, now: Date = new Date()) {
  if (job.status === 'COMPLETED' || job.status === 'LOST') {
    return { status: 'NONE', daysOverdue: 0, daysUntilDue: 0, label: 'No follow-up needed' };
  }
  
  if (!job.nextFollowUpAt) {
    return { status: 'NEEDS_ACTION', daysOverdue: 0, daysUntilDue: 0, label: 'Needs Action' };
  }

  const todayStart = startOfDay(now);
  const followUpDate = startOfDay(new Date(job.nextFollowUpAt));
  
  const diffDays = differenceInDays(followUpDate, todayStart);

  if (diffDays < 0) return { status: 'OVERDUE', daysOverdue: Math.abs(diffDays), daysUntilDue: 0, label: 'Overdue' };
  if (diffDays === 0) return { status: 'TODAY', daysOverdue: 0, daysUntilDue: 0, label: 'Today' };
  return { status: 'UPCOMING', daysOverdue: 0, daysUntilDue: diffDays, label: 'Upcoming' };
}

export function calculatePriority(job: Partial<IJob>, now: Date = new Date()): { score: number, label: string, reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Urgency
  if (job.urgency === 'EMERGENCY') { score += 40; reasons.push('Emergency urgency'); }
  else if (job.urgency === 'HIGH') { score += 25; reasons.push('High urgency'); }
  else if (job.urgency === 'MEDIUM') { score += 10; }

  // Follow-up
  const followUp = getFollowUpStatus(job, now);
  if (followUp.status === 'OVERDUE') { score += 30; reasons.push('Follow-up is overdue'); }
  else if (followUp.status === 'TODAY') { score += 20; reasons.push('Follow-up due today'); }
  else if (followUp.status === 'UPCOMING' && followUp.daysUntilDue === 1) { score += 5; }

  // Days without contact
  if (job.lastContactedAt) {
    const daysSinceContact = differenceInDays(now, new Date(job.lastContactedAt));
    if (daysSinceContact >= 3) { score += 20; reasons.push(`No contact for ${daysSinceContact} days`); }
    else if (daysSinceContact === 2) { score += 10; reasons.push('No contact for 2 days'); }
    else if (daysSinceContact === 1) { score += 5; }
  } else {
    score += 15; reasons.push('Never contacted');
  }

  // Estimated value
  if (job.estimatedValue) {
    if (job.estimatedValue >= 2000) { score += 15; reasons.push('High value job (>= $2k)'); }
    else if (job.estimatedValue >= 1000) { score += 10; }
    else { score += 5; }
  }

  // Stage
  if (job.status === 'WAITING_ON_CUSTOMER') { score += 15; reasons.push('Waiting on customer'); }
  else if (job.status === 'QUOTE_SENT') { score += 10; reasons.push('Quote sent'); }
  else if (job.status === 'NEW' || job.status === 'NEEDS_QUOTE') { score += 10; reasons.push('New lead/Needs quote'); }
  else if (job.status === 'APPROVED') { score += 5; }

  // Normalize
  score = Math.min(Math.max(score, 0), 100);

  let label = 'LOW';
  if (score >= 80) label = 'CRITICAL';
  else if (score >= 60) label = 'HIGH';
  else if (score >= 40) label = 'MEDIUM';

  return {
    score,
    label,
    reason: reasons.length > 0 ? reasons.join(', ') : 'Routine follow-up'
  };
}

export function ensureActiveJobHasFollowUp(job: any, now: Date = new Date(), suggestedFollowUp?: string) {
  if (job.status === 'COMPLETED' || job.status === 'LOST') {
    job.nextFollowUpAt = undefined;
    job.nextAction = undefined;
    return;
  }

  if (!job.nextAction) {
    job.nextAction = getDefaultNextAction(job.status) || undefined;
  }

  if (suggestedFollowUp && !job.nextFollowUpAt) {
    const today = startOfDay(now);
    const sf = suggestedFollowUp.toLowerCase();
    if (sf === 'today') job.nextFollowUpAt = today;
    else if (sf === 'tomorrow') job.nextFollowUpAt = addDays(today, 1);
    else if (sf.includes('2 days')) job.nextFollowUpAt = addDays(today, 2);
    else if (sf.includes('week')) job.nextFollowUpAt = addDays(today, 7);
  }

  if (job.nextFollowUpAt === undefined || job.nextFollowUpAt === null) {
    job.nextFollowUpAt = getDefaultNextFollowUp(job.status, now) || undefined;
  }
}

export async function transitionJobStatus(job: IJob, newStatus: string, now: Date = new Date()) {
  const oldStatus = job.status;
  if (oldStatus === newStatus) return;

  job.status = newStatus as any;
  job.nextAction = getDefaultNextAction(newStatus) || undefined;
  
  const defaultFollowUp = getDefaultNextFollowUp(newStatus, now);
  job.nextFollowUpAt = defaultFollowUp ? defaultFollowUp : undefined;

  if (newStatus === 'QUOTE_SENT') job.quoteSentAt = now;
  else if (newStatus === 'APPROVED') job.approvedAt = now;
  else if (newStatus === 'SCHEDULED') job.scheduledAt = now;
  else if (newStatus === 'COMPLETED') job.completedAt = now;
  
  if (newStatus === 'COMPLETED' || newStatus === 'LOST') {
      job.nextFollowUpAt = undefined;
      job.nextAction = undefined;
  }

  await job.save();

  await createActivity(
    job._id as string,
    'STATUS_CHANGED',
    `Status changed from ${oldStatus} to ${newStatus}`
  );
}

export async function createActivity(jobId: string, type: 'CALL' | 'SMS' | 'EMAIL' | 'NOTE' | 'QUOTE_SENT' | 'STATUS_CHANGED' | 'FOLLOW_UP_COMPLETED' | 'JOB_CREATED', description: string, createdBy: string = 'System') {
  await connectToDatabase();
  return await Activity.create({
    jobId,
    type,
    description,
    createdBy
  });
}
