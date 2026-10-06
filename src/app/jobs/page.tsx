'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Clock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

const STAGES = [
  'NEW',
  'NEEDS_QUOTE',
  'QUOTE_SENT',
  'WAITING_ON_CUSTOMER',
  'APPROVED',
  'SCHEDULED',
];

const STAGE_LABELS: Record<string, string> = {
  NEW: 'NEW LEAD',
  NEEDS_QUOTE: 'NEEDS QUOTE',
  QUOTE_SENT: 'QUOTE SENT',
  WAITING_ON_CUSTOMER: 'WAITING ON CUSTOMER',
  APPROVED: 'APPROVED',
  SCHEDULED: 'SCHEDULED',
  COMPLETED: 'COMPLETED',
  LOST: 'LOST'
};

export default function JobsPipelinePage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      if (data.success) {
        setJobs(data.data.filter((j: any) => j.status !== 'COMPLETED' && j.status !== 'LOST'));
      }
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load pipeline');
      setLoading(false);
    }
  }

  async function moveJob(jobId: string, newStatus: string) {
    const originalJobs = [...jobs];
    // Optimistic update
    setJobs(jobs.map(j => j._id === jobId ? { ...j, status: newStatus } : j));
    
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) throw new Error();
      toast.success(`Job moved to ${STAGE_LABELS[newStatus]}`);
    } catch (error) {
      toast.error('Failed to move job');
      setJobs(originalJobs);
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="h-8 w-48 bg-slate-200 rounded animate-pulse mb-8"></div>
        <div className="flex gap-6 overflow-x-auto pb-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="min-w-[320px] h-[600px] bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Jobs Pipeline</h1>
          <p className="text-slate-500 mt-1">Manage active leads and scheduled work.</p>
        </div>
        <Link href="/jobs/new">
          <Button className="bg-blue-600 hover:bg-blue-700">Add New Job</Button>
        </Link>
      </div>

      <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4">
        <div className="flex gap-6 h-full min-w-max items-start">
          {STAGES.map(stage => {
            const stageJobs = jobs.filter(j => j.status === stage);
            
            return (
              <div key={stage} className="w-[340px] flex flex-col max-h-[calc(100vh-12rem)] bg-slate-100/50 rounded-xl border border-slate-200">
                <div className="p-4 border-b border-slate-200 bg-slate-100 rounded-t-xl flex justify-between items-center sticky top-0 z-10">
                  <h3 className="font-semibold text-slate-700 text-sm">{STAGE_LABELS[stage]}</h3>
                  <Badge variant="secondary" className="bg-white">{stageJobs.length}</Badge>
                </div>
                
                <div className="p-3 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
                  {stageJobs.map(job => (
                    <Card key={job._id} className="cursor-pointer hover:border-blue-300 transition-colors shadow-sm group">
                      <CardContent className="p-4">
                        <Link href={`/jobs/${job._id}`} className="block">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-slate-900 line-clamp-1">{job.companyName}</h4>
                            {job.estimatedValue && (
                              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full whitespace-nowrap">
                                ${job.estimatedValue.toLocaleString()}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-sm text-slate-600 mb-3 line-clamp-2">{job.issueDescription}</p>
                          
                          <div className="flex flex-wrap gap-y-2 justify-between items-center text-xs text-slate-500 mt-auto pt-3 border-t border-slate-100">
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              <span className="truncate max-w-[90px]">{job.phone}</span>
                            </div>
                            {job.urgency === 'EMERGENCY' || job.urgency === 'HIGH' ? (
                              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] px-1 py-0 h-5">
                                {job.urgency}
                              </Badge>
                            ) : null}
                          </div>
                        </Link>

                        <div className="mt-3 pt-3 flex gap-2 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-opacity">
                           {STAGES.indexOf(stage) < STAGES.length - 1 && (
                             <Button 
                               size="sm" 
                               variant="secondary" 
                               className="w-full text-xs h-8"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 moveJob(job._id, STAGES[STAGES.indexOf(stage) + 1]);
                               }}
                             >
                               Move to {STAGE_LABELS[STAGES[STAGES.indexOf(stage) + 1]]} <ArrowRight className="h-3 w-3 ml-1" />
                             </Button>
                           )}
                           {STAGES.indexOf(stage) > 0 && (
                             <Button 
                               size="sm" 
                               variant="outline" 
                               className="px-2 h-8"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 moveJob(job._id, STAGES[STAGES.indexOf(stage) - 1]);
                               }}
                             >
                               Back
                             </Button>
                           )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {stageJobs.length === 0 && (
                    <div className="p-8 text-center text-sm text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
                      No jobs in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
