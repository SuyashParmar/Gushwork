'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { MarkContactedDialog } from '@/components/jobs/MarkContactedDialog';
import { User, Phone, Mail, History } from 'lucide-react';

export default function JobDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const showContactDialogInit = searchParams.get('action') === 'contact';
  const [job, setJob] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [contactDialogOpen, setContactDialogOpen] = useState(showContactDialogInit);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  async function fetchJobDetails() {
    try {
      const [jobRes, actRes] = await Promise.all([
        fetch(`/api/jobs/${id}`),
        fetch(`/api/jobs/${id}/activities`)
      ]);
      const jobData = await jobRes.json();
      const actData = await actRes.json();
      
      if (jobData.success) setJob(jobData.data);
      if (actData.success) setActivities(actData.data);
      setLoading(false);
    } catch (error) {
      toast.error('Failed to load job details');
      setLoading(false);
    }
  }
  const handleContactSuccess = () => {
    fetchJobDetails();
  };

  async function updateStatus(newStatus: string) {
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Status updated');
        fetchJobDetails();
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  }

  if (loading || !job) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{job.companyName}</h1>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-sm px-2 py-1">
              {job.status.replace(/_/g, ' ')}
            </Badge>
            {job.priorityInfo && (
              <Badge variant="outline" className={`text-sm px-2 py-1 font-semibold ${
                job.calculatedPriority >= 80 ? 'bg-red-100 text-red-800 border-red-200' :
                job.calculatedPriority >= 60 ? 'bg-orange-100 text-orange-800 border-orange-200' :
                job.calculatedPriority >= 40 ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                'bg-slate-100 text-slate-800 border-slate-200'
              }`}>
                {job.priorityInfo.label} PRIORITY
              </Badge>
            )}
          </div>
          <p className="text-xl text-slate-600">{job.serviceType}</p>
          {job.priorityInfo && (
            <p className="text-sm text-slate-500 mt-1">Priority reasoning: {job.priorityInfo.reason}</p>
          )}
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <a href={`tel:${job.phone}`}>
            <Button variant="outline" className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800">
              Call
            </Button>
          </a>
          <Button onClick={() => setContactDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
             Mark Contacted
          </Button>
          <Select value={job.status} onValueChange={updateStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Change Stage" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="NEW">New Lead</SelectItem>
              <SelectItem value="NEEDS_QUOTE">Needs Quote</SelectItem>
              <SelectItem value="QUOTE_SENT">Quote Sent</SelectItem>
              <SelectItem value="WAITING_ON_CUSTOMER">Waiting on Customer</SelectItem>
              <SelectItem value="APPROVED">Approved</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="LOST">Lost</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Job Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {job.nextAction && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-2">
                  <h4 className="text-xs font-bold text-blue-600 tracking-wider uppercase mb-1">Next Action</h4>
                  <p className="text-blue-900 font-semibold text-lg">{job.nextAction}</p>
                  {job.nextFollowUpAt && (
                    <p className="text-blue-800/80 text-sm mt-1 flex items-center gap-1">
                      Due: {format(new Date(job.nextFollowUpAt), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              )}
              
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Issue Description</h4>
                <p className="text-slate-900">{job.issueDescription}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Estimated Value</h4>
                  <p className="text-slate-900">{job.estimatedValue ? `$${job.estimatedValue.toLocaleString()}` : 'Not estimated'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Urgency</h4>
                  <p className="text-slate-900">{job.urgency}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Source</h4>
                  <p className="text-slate-900">{job.source.replace(/_/g, ' ')}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-500 mb-1">Assigned Technician</h4>
                  <p className="text-slate-900">{job.assignedTechnician || 'Unassigned'}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-slate-500" /> Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6 pl-4 border-l-2 border-slate-100 ml-2">
                {activities.map((activity: any) => (
                  <div key={activity._id} className="relative">
                    <div className="absolute -left-[25px] mt-1 h-3 w-3 rounded-full bg-blue-500 ring-4 ring-white"></div>
                    <div>
                      <p className="text-sm text-slate-500 font-medium mb-1">
                        {format(new Date(activity.createdAt), 'MMM d, h:mm a')} • {activity.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-slate-900">{activity.description}</p>
                    </div>
                  </div>
                ))}
                {activities.length === 0 && (
                  <p className="text-slate-500 text-sm">No activity recorded yet.</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-slate-400" />
                <div>
                  <p className="text-sm font-medium text-slate-900">{job.customerName}</p>
                  <p className="text-xs text-slate-500">Contact Person</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-slate-400" />
                <div>
                  <a href={`tel:${job.phone}`} className="text-sm font-medium text-blue-600 hover:underline">{job.phone}</a>
                </div>
              </div>
              {job.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <div>
                    <a href={`mailto:${job.email}`} className="text-sm font-medium text-blue-600 hover:underline">{job.email}</a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow-Up Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Next Follow-Up</h4>
                <p className="text-slate-900 font-medium">
                  {job.nextFollowUpAt ? format(new Date(job.nextFollowUpAt), 'MMM d, yyyy') : 'None scheduled'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-slate-500 mb-1">Last Contacted</h4>
                <p className="text-slate-900">
                  {job.lastContactedAt ? format(new Date(job.lastContactedAt), 'MMM d, yyyy') : 'Never'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <MarkContactedDialog 
        jobId={id} 
        isOpen={contactDialogOpen} 
        onClose={() => setContactDialogOpen(false)} 
        onSuccess={handleContactSuccess}
      />
    </div>
  );
}
