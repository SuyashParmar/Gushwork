'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, Clock } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function FollowUpsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
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
    }
    
    loadData();
  }, []);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">Follow-Ups Queue</h1>
      
      <div className="space-y-4">
        {jobs.length === 0 && (
          <div className="p-8 text-center text-slate-500 border rounded-lg bg-slate-50">
            No follow-ups scheduled.
          </div>
        )}
        
        {jobs.map(job => (
          <Card key={job._id} className={
            job.category === 'OVERDUE' ? 'border-l-4 border-l-red-500' :
            job.category === 'TODAY' ? 'border-l-4 border-l-blue-500' :
            'border-l-4 border-l-slate-300'
          }>
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row justify-between p-4 px-6 gap-4 items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    {job.category === 'OVERDUE' && <Badge variant="destructive" className="px-1.5 py-0">OVERDUE</Badge>}
                    {job.category === 'TODAY' && <Badge variant="secondary" className="bg-blue-100 text-blue-800 px-1.5 py-0">TODAY</Badge>}
                    <span className="text-sm font-medium text-slate-500">{job.status.replace(/_/g, ' ')}</span>
                  </div>
                  <h3 className="text-lg font-semibold">
                    <Link href={`/jobs/${job._id}`} className="hover:underline">{job.companyName}</Link>
                  </h3>
                  <p className="text-sm text-slate-600">{job.issueDescription}</p>
                </div>
                <div className="text-sm text-slate-500 space-y-1 w-full md:w-auto text-left md:text-right">
                  <div className="flex items-center md:justify-end gap-1"><Phone className="h-4 w-4" /> {job.phone}</div>
                  <div className="flex items-center md:justify-end gap-1">
                    <Clock className="h-4 w-4" /> 
                    {new Date(job.nextFollowUpAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
