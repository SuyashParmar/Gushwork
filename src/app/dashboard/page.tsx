'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Briefcase, Clock, FileText, CheckCircle2, AlertCircle, Phone, ArrowRight, BrainCircuit } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [aiLoading, setAiLoading] = useState(true);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  useEffect(() => {
    async function loadData() {
      try {
        const [statsRes, followUpsRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/followups/today')
        ]);
        
        const statsData = await statsRes.json();
        const followUpsData = await followUpsRes.json();
        
        if (statsData.success) setStats(statsData.data);
        
        // Also fetch overdue and combine for priority view
        const overdueRes = await fetch('/api/followups/overdue');
        const overdueData = await overdueRes.json();
        
        let combined = [];
        if (followUpsData.success) combined.push(...followUpsData.data);
        if (overdueData.success) combined.push(...overdueData.data);
        
        // Remove duplicates if any (shouldn't be, but just in case)
        const unique = Array.from(new Map(combined.map(item => [item._id, item])).values());
        
        // Calculate priority locally or server side? 
        // We'll just map urgency and status to basic priority for the dashboard
        const prioritized = unique.map(job => {
          let score = 0;
          if (job.urgency === 'EMERGENCY') score += 40;
          if (job.urgency === 'HIGH') score += 25;
          if (job.estimatedValue >= 2000) score += 15;
          // if overdue
          const followUpDate = new Date(job.nextFollowUpAt);
          if (followUpDate < new Date(new Date().setHours(0,0,0,0))) score += 30;
          
          return { ...job, calculatedPriority: score };
        }).sort((a, b) => b.calculatedPriority - a.calculatedPriority);
        
        setFollowUps(prioritized);
        setLoading(false);
        
        // Fetch AI Summary asynchronously
        fetch('/api/ai/morning-summary')
          .then(res => res.json())
          .then(data => {
            if (data.success && data.data.summary) {
              setAiSummary(data.data.summary);
            }
            setAiLoading(false);
          })
          .catch(() => setAiLoading(false));
          
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setLoading(false);
        setAiLoading(false);
      }
    }
    
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="h-4 bg-slate-200 rounded w-1/3"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-100 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">{getGreeting()}, Denise 👋</h1>
          <p className="text-slate-500 mt-2">Here's what needs your attention today.</p>
        </div>
        <Link href="/jobs/new">
          <Button className="bg-blue-600 hover:bg-blue-700">Add New Job</Button>
        </Link>
      </div>

      {!aiLoading && aiSummary && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-blue-800 text-lg">
              <BrainCircuit className="h-5 w-5 text-blue-600" />
              Today's Task
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-blue-900/80 leading-relaxed">{aiSummary}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-600">Follow-ups Today</p>
              <Phone className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats?.followUpsToday || 0}</div>
          </CardContent>
        </Card>
        
        <Card className={stats?.overdueFollowUps > 0 ? "border-red-200 bg-red-50 shadow-sm" : "border-slate-200 shadow-sm"}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className={`text-sm font-medium ${stats?.overdueFollowUps > 0 ? 'text-red-600' : 'text-slate-600'}`}>Overdue</p>
              <AlertCircle className={`h-4 w-4 ${stats?.overdueFollowUps > 0 ? 'text-red-600' : 'text-slate-400'}`} />
            </div>
            <div className={`text-3xl font-bold ${stats?.overdueFollowUps > 0 ? 'text-red-700' : 'text-slate-900'}`}>{stats?.overdueFollowUps || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-600">Waiting on Customer</p>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-3xl font-bold text-slate-900">{stats?.waitingOnCustomer || 0}</div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <p className="text-sm font-medium text-slate-600">Open Pipeline</p>
              <Briefcase className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-bold text-slate-900">${(stats?.openPipelineValue || 0).toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Today's Follow-Ups</h2>
          <Link href="/follow-ups" className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {followUps.length === 0 ? (
          <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
            <CardContent className="flex flex-col items-center justify-center p-12 text-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-1">You're all caught up 🎉</h3>
              <p className="text-slate-500 max-w-sm">No follow-ups are due today. Take a break or check the pipeline for other opportunities.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {followUps.map(job => {
              const followUpDate = new Date(job.nextFollowUpAt);
              const isOverdue = followUpDate < new Date(new Date().setHours(0,0,0,0));
              const priorityClass = job.calculatedPriority >= 60 ? "bg-red-100 text-red-800 border-red-200" : "bg-orange-100 text-orange-800 border-orange-200";
              const priorityText = job.calculatedPriority >= 80 ? "CRITICAL" : job.calculatedPriority >= 60 ? "HIGH PRIORITY" : isOverdue ? "OVERDUE" : "FOLLOW UP";
              
              return (
                <Card key={job._id} className={`overflow-hidden transition-all hover:shadow-md ${isOverdue ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500'}`}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 gap-4">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={`${priorityClass} font-semibold text-xs px-2 py-0.5`}>
                            {priorityText}
                          </Badge>
                          <span className="text-sm text-slate-500 font-medium">{job.status.replace(/_/g, ' ')}</span>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                            {job.companyName}
                            {job.estimatedValue && (
                              <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                ${job.estimatedValue.toLocaleString()}
                              </span>
                            )}
                          </h3>
                          <p className="text-slate-600 mt-1">{job.serviceType} • {job.issueDescription}</p>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5" /> {job.phone}</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> 
                            {job.lastContactedAt ? `Last contacted ${new Date(job.lastContactedAt).toLocaleDateString()}` : 'Never contacted'}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                        <Link href={`/jobs/${job._id}`} className="flex-1 md:w-40">
                          <Button className="w-full bg-blue-600 hover:bg-blue-700">
                            View Job
                          </Button>
                        </Link>
                        <Link href={`/jobs/${job._id}?action=contact`} className="flex-1 md:w-40">
                          <Button variant="outline" className="w-full">
                            Mark Contacted
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
    </div>
  );
}
