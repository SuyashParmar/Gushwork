'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const jobSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  companyName: z.string().min(1, 'Company name is required'),
  phone: z.string().min(1, 'Phone is required'),
  email: z.string().optional(),
  serviceType: z.string().min(1, 'Service type is required'),
  issueDescription: z.string().min(1, 'Issue description is required'),
  source: z.string().optional().default('MANUAL'),
  urgency: z.string().optional().default('MEDIUM'),
  estimatedValue: z.number().optional(),
  status: z.string().optional().default('NEW'),
  suggestedFollowUp: z.string().optional(),
});

export default function NewJobPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(jobSchema),
    defaultValues: {
      customerName: '',
      companyName: '',
      phone: '',
      email: '',
      serviceType: '',
      issueDescription: '',
      source: 'MANUAL',
      urgency: 'MEDIUM',
      status: 'NEW',
      suggestedFollowUp: undefined,
    },
  });

  async function onSubmit(values: any) {
    setLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      
      if (!data.success) throw new Error(data.error);
      
      toast.success('Job created successfully');
      router.push(`/jobs/${data.data._id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create job');
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-6">Create New Job</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="job-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700 border-b pb-2">Customer Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name *</Label>
                  <Input {...form.register('customerName')} />
                  {form.formState.errors.customerName && (
                    <p className="text-sm text-red-500">{form.formState.errors.customerName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Company Name *</Label>
                  <Input {...form.register('companyName')} />
                  {form.formState.errors.companyName && (
                    <p className="text-sm text-red-500">{form.formState.errors.companyName.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Phone *</Label>
                  <Input {...form.register('phone')} />
                  {form.formState.errors.phone && (
                    <p className="text-sm text-red-500">{form.formState.errors.phone.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input {...form.register('email')} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-slate-700 border-b pb-2">Service Details</h3>
              <div className="space-y-2">
                <Label>Service Type *</Label>
                <Input placeholder="e.g. Walk-in Cooler Repair" {...form.register('serviceType')} />
                {form.formState.errors.serviceType && (
                  <p className="text-sm text-red-500">{form.formState.errors.serviceType.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Issue Description *</Label>
                <Textarea placeholder="Describe the problem..." {...form.register('issueDescription')} />
                {form.formState.errors.issueDescription && (
                  <p className="text-sm text-red-500">{form.formState.errors.issueDescription.message}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select onValueChange={v => form.setValue('urgency', (v as string) || 'MEDIUM')} defaultValue={form.getValues('urgency')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="EMERGENCY">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select onValueChange={v => form.setValue('source', (v as string) || 'MANUAL')} defaultValue={form.getValues('source')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PHONE">Phone</SelectItem>
                      <SelectItem value="WEBSITE">Website</SelectItem>
                      <SelectItem value="TEXT">Text</SelectItem>
                      <SelectItem value="REFERRAL">Referral</SelectItem>
                      <SelectItem value="MANUAL">Manual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estimated Value ($)</Label>
                  <Input 
                    type="number" 
                    onChange={e => {
                      const val = e.target.value;
                      form.setValue('estimatedValue', val ? parseFloat(val) : undefined);
                    }} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Initial Status</Label>
                  <Select onValueChange={v => form.setValue('status', (v as string) || 'NEW')} defaultValue={form.getValues('status')}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New Lead</SelectItem>
                      <SelectItem value="NEEDS_QUOTE">Needs Quote</SelectItem>
                      <SelectItem value="QUOTE_SENT">Quote Sent</SelectItem>
                      <SelectItem value="WAITING_ON_CUSTOMER">Waiting on Customer</SelectItem>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Next Follow-Up</Label>
                  <Select onValueChange={v => form.setValue('suggestedFollowUp', (v as string) || undefined)}>
                    <SelectTrigger><SelectValue placeholder="Auto-calculate" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="tomorrow">Tomorrow</SelectItem>
                      <SelectItem value="2 days">In 2 days</SelectItem>
                      <SelectItem value="week">In 1 week</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-slate-500">Leave empty to use status defaults</p>
                </div>
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between border-t p-6">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button form="job-form" type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            {loading ? 'Creating...' : 'Create Job'}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
