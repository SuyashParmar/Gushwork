'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Clock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { MarkContactedDialog } from '@/components/jobs/MarkContactedDialog';

export default function FollowUpsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactJobId, setContactJobId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [todayRes, overdueRes, upcomingRes] = await Promise.all([
        fetch('/api/followups/today'),
        fetch('/api/followups/overdue'),
        fetch('/api/followups/upcoming')
      ]);
      
      const todayData = await todayRes.json();
      const overdueData = await overdueRes.json();
      const upcomingData = await upcomingRes.json();
      
      let combined = [];
      if (overdueData.success) combined.push(...overdueData.data.map((j:any) => ({...j, category: 'OVERDUE'})));
      if (todayData.success) combined.push(...todayData.data.map((j:any) => ({...j, category: 'TODAY'})));
      if (upcomingData.success) combined.push(...upcomingData.data.map((j:any) => ({...j, category: 'UPCOMING'})));
      
      setJobs(combined);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load follow-ups');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  const renderSection = (title: string, category: string, borderClass: string) => {
    const sectionJobs = jobs.filter(j => j.category === category);
    
    if (sectionJobs.length === 0 && category !== 'OVERDUE') return null; // Only overdue can be totally empty and hidden

    return (
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-slate-900 mb-4">{title} <Badge variant="secondary" className="ml-2">{sectionJobs.length}</Badge></h2>
        
        {sectionJobs.length === 0 ? (
          <div className="p-8 text-center text-slate-500 border rounded-lg bg-slate-50">
            No follow-ups in this section.
          </div>
        ) : (
          <div className="space-y-4">
            {sectionJobs.map(job => {
              const priorityClass = job.calculatedPriority >= 60 ? "bg-red-100 text-red-800 border-red-200" : "bg-orange-100 text-orange-800 border-orange-200";
              const priorityText = job.calculatedPriority >= 80 ? "CRITICAL" : job.calculatedPriority >= 60 ? "HIGH" : job.calculatedPriority >= 40 ? "MEDIUM" : "LOW";
              
              return (
                <Card key={job._id} className={`overflow-hidden transition-all hover:shadow-md border-l-4 ${borderClass}`}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row justify-between p-6 gap-4 items-center">
                      
                      <div className="flex-1 w-full space-y-3">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <Badge variant="outline" className={`${priorityClass} font-semibold text-xs px-2 py-0.5`}>
                            {priorityText} PRIORITY
                          </Badge>
                          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 rounded-full">{job.status.replace(/_/g, ' ')}</span>
                          <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 rounded-full">{job.urgency} Urgency</span>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <Link href={`/jobs/${job._id}`} className="hover:underline">{job.companyName}</Link>
                            {job.estimatedValue && (
                              <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                ${job.estimatedValue.toLocaleString()}
                              </span>
                            )}
                          </h3>
                          <p className="text-slate-600">{job.customerName} • {job.issueDescription}</p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-500 flex-wrap">
                          <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {job.phone}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" /> 
                            {job.lastContactedAt ? `Last contacted ${new Date(job.lastContactedAt).toLocaleDateString()}` : 'Never contacted'}
                          </span>
                        </div>

                        {job.nextAction && (
                          <div className="text-sm font-medium bg-blue-50 text-blue-800 px-3 py-1.5 rounded-md inline-block border border-blue-100">
                            Action: {job.nextAction}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        <Link href={`tel:${job.phone}`} className="w-full">
                          <Button variant="outline" className="w-full border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800">
                            Call
                          </Button>
                        </Link>
                        <Button variant="outline" className="w-full" onClick={() => setContactJobId(job._id)}>
                          Mark Contacted
                        </Button>
                        <Link href={`/jobs/${job._id}`} className="w-full">
                          <Button className="w-full bg-slate-900 hover:bg-slate-800 text-white">
                            View Job
                          </Button>
                        </Link>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Follow-Ups Queue</h1>
        <p className="text-slate-500 mt-2 text-lg">Your operational queue for today's active leads and pending quotes.</p>
      </div>
      
      {renderSection('Overdue', 'OVERDUE', 'border-l-red-500')}
      {renderSection('Due Today', 'TODAY', 'border-l-blue-500')}
      {renderSection('Upcoming', 'UPCOMING', 'border-l-slate-300')}

      <MarkContactedDialog 
        jobId={contactJobId} 
        isOpen={!!contactJobId} 
        onClose={() => setContactJobId(null)} 
        onSuccess={loadData}
      />
    </div>
  );
}
