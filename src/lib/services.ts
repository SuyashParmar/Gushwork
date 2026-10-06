import { differenceInDays, isToday, isPast, isTomorrow, startOfDay } from 'date-fns';
import { IJob, Job } from '../models/Job';
import { Activity } from '../models/Activity';
import connectToDatabase from './mongodb';

export function getFollowUpStatus(nextFollowUpAt?: Date | null): 'OVERDUE' | 'TODAY' | 'UPCOMING' | 'NO_FOLLOW_UP' {
  if (!nextFollowUpAt) return 'NO_FOLLOW_UP';
  
  const todayStart = startOfDay(new Date());
  const followUpDate = startOfDay(new Date(nextFollowUpAt));

  if (followUpDate < todayStart) return 'OVERDUE';
  if (followUpDate.getTime() === todayStart.getTime()) return 'TODAY';
  return 'UPCOMING';
}

export function calculatePriority(job: Partial<IJob>): { score: number, label: string, reason: string } {
  let score = 0;
  const reasons: string[] = [];

  // Urgency
  if (job.urgency === 'EMERGENCY') { score += 40; reasons.push('Emergency urgency'); }
  else if (job.urgency === 'HIGH') { score += 25; reasons.push('High urgency'); }
  else if (job.urgency === 'MEDIUM') { score += 10; }

  // Follow-up
  const followUpStatus = getFollowUpStatus(job.nextFollowUpAt);
  if (followUpStatus === 'OVERDUE') { score += 30; reasons.push('Follow-up is overdue'); }
  else if (followUpStatus === 'TODAY') { score += 20; reasons.push('Follow-up due today'); }
  else if (job.nextFollowUpAt && isTomorrow(new Date(job.nextFollowUpAt))) { score += 5; }

  // Days without contact
  if (job.lastContactedAt) {
    const daysSinceContact = differenceInDays(new Date(), new Date(job.lastContactedAt));
    if (daysSinceContact >= 3) { score += 20; reasons.push(`No contact for ${daysSinceContact} days`); }
    else if (daysSinceContact === 2) { score += 10; reasons.push('No contact for 2 days'); }
    else if (daysSinceContact === 1) { score += 5; }
  } else {
    score += 15; reasons.push('Never contacted');
  }

  // Estimated value
  if (job.estimatedValue && job.estimatedValue >= 2000) { score += 15; reasons.push('High value job (>= $2k)'); }
  else if (job.estimatedValue && job.estimatedValue >= 1000) { score += 10; }
  else { score += 5; }

  // Stage
  if (job.status === 'WAITING_ON_CUSTOMER') { score += 15; reasons.push('Waiting on customer'); }
  else if (job.status === 'QUOTE_SENT') { score += 10; reasons.push('Quote sent'); }
  else if (job.status === 'NEW') { score += 10; reasons.push('New lead'); }
  else if (job.status === 'APPROVED') { score += 5; }

  // Clamp score to 0-100
  score = Math.min(Math.max(score, 0), 100);

  let label = 'Low';
  if (score >= 80) label = 'Critical';
  else if (score >= 60) label = 'High';
  else if (score >= 40) label = 'Medium';

  return {
    score,
    label,
    reason: reasons.length > 0 ? reasons.join(', ') : 'Routine follow-up'
  };
}

export async function createActivity(jobId: string, type: 'CALL' | 'SMS' | 'EMAIL' | 'NOTE' | 'QUOTE_SENT' | 'STATUS_CHANGED' | 'FOLLOW_UP_COMPLETED', description: string, createdBy: string = 'System') {
  await connectToDatabase();
  return await Activity.create({
    jobId,
    type,
    description,
    createdBy
  });
}
