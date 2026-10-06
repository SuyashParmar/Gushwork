import { CheckCircle2, Circle } from 'lucide-react';
import { format } from 'date-fns';

const STAGES = [
  { id: 'created', label: 'Lead Created', dateField: 'createdAt' },
  { id: 'quote', label: 'Quote Sent', dateField: 'quoteSentAt' },
  { id: 'approved', label: 'Approved', dateField: 'approvedAt' },
  { id: 'scheduled', label: 'Scheduled', dateField: 'scheduledAt' },
  { id: 'completed', label: 'Completed', dateField: 'completedAt' },
];

export function JobProgressChain({ job }: { job: any }) {
  if (job.status === 'LOST') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 font-medium">This job was marked as LOST.</p>
        {job.lostReason && <p className="text-red-600 text-sm mt-1">{job.lostReason}</p>}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 overflow-x-auto">
      <div className="min-w-[600px] flex items-start justify-between relative px-4">
        {/* Connecting Line */}
        <div className="absolute top-4 left-8 right-8 h-[2px] bg-slate-100 z-0"></div>
        
        {STAGES.map((stage, index) => {
          const date = job[stage.dateField];
          const isCompleted = !!date;
          
          return (
            <div key={stage.id} className="relative z-10 flex flex-col items-center flex-1">
              <div className="bg-white px-2">
                {isCompleted ? (
                  <CheckCircle2 className="w-8 h-8 text-blue-600" />
                ) : (
                  <Circle className="w-8 h-8 text-slate-200" />
                )}
              </div>
              <div className="text-center mt-3">
                <p className={`text-sm font-semibold ${isCompleted ? 'text-slate-900' : 'text-slate-400'}`}>
                  {stage.label}
                </p>
                {isCompleted ? (
                  <p className="text-xs text-slate-500 mt-1">
                    {format(new Date(date), 'MMM d')}
                    <br />
                    {format(new Date(date), 'h:mm a')}
                  </p>
                ) : (
                  <p className="text-xs text-slate-300 mt-1">Pending</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
