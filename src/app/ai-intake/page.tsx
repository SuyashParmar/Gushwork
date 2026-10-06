'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BrainCircuit, Loader2, FileText, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function AIIntakePage() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  async function handleExtract() {
    if (!input.trim()) {
      toast.error('Please enter some notes to extract');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch('/api/ai/extract-lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input })
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      setExtractedData(data.data);
      toast.success('Successfully extracted details');
    } catch (error: any) {
      toast.error(error.message || 'Failed to extract details from AI');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateJob() {
    setLoading(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(extractedData)
      });
      
      const data = await res.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      toast.success('Job created successfully');
      router.push(`/jobs/${data.data._id}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create job');
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <BrainCircuit className="h-8 w-8 text-blue-600" /> AI Lead Intake
        </h1>
        <p className="text-slate-500 mt-2 text-lg">Turn a messy call, text, or email into a structured job in seconds.</p>
      </div>

      {!extractedData ? (
        <Card className="border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 border-b border-blue-100">
            <h3 className="font-medium text-blue-900 mb-2">Paste raw notes below</h3>
            <p className="text-sm text-blue-700/80">Example: "Hi, this is Mike from Tony's Pizza. Our walk-in freezer has been warm since last night and we're losing food. Can someone come tomorrow morning? You can reach me at 555-1234."</p>
          </div>
          <CardContent className="p-6">
            <Textarea
              placeholder="Paste a customer message, email, or call notes here..."
              className="min-h-[200px] text-base resize-y"
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
          </CardContent>
          <CardFooter className="bg-slate-50 p-6 flex justify-end">
            <Button 
              onClick={handleExtract} 
              disabled={loading || !input.trim()}
              className="bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {loading ? <Loader2 className="h-5 w-5 mr-2 animate-spin" /> : <BrainCircuit className="h-5 w-5 mr-2" />}
              Extract Job Details
            </Button>
          </CardFooter>
        </Card>
      ) : (
        <Card className="border-slate-200 shadow-sm border-t-4 border-t-blue-500">
          <CardHeader className="bg-slate-50 border-b pb-4">
            <CardTitle className="text-blue-900 flex items-center gap-2">
              <Check className="h-5 w-5 text-blue-600" /> AI EXTRACTED
            </CardTitle>
            <CardDescription>Review the details before creating the job.</CardDescription>
          </CardHeader>
          
          <CardContent className="p-6">
            {!isEditing ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <Label className="text-slate-500">Customer Name</Label>
                  <p className="font-medium text-lg">{extractedData.customerName || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Company</Label>
                  <p className="font-medium text-lg">{extractedData.companyName || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Phone</Label>
                  <p className="font-medium text-lg">{extractedData.phone || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Service Type</Label>
                  <p className="font-medium text-lg">{extractedData.serviceType || 'N/A'}</p>
                </div>
                <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border">
                  <Label className="text-slate-500 mb-1 block">Issue Summary</Label>
                  <p className="text-slate-900 font-medium">{extractedData.summary || extractedData.issueDescription}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Urgency</Label>
                  <p className="font-medium text-lg">{extractedData.urgency || 'MEDIUM'}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Estimated Value</Label>
                  <p className="font-medium text-lg">{extractedData.estimatedValue ? `$${extractedData.estimatedValue}` : 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Source</Label>
                  <p className="font-medium text-lg">{extractedData.source || 'MANUAL'}</p>
                </div>
                <div>
                  <Label className="text-slate-500">Suggested Follow-up</Label>
                  <p className="font-medium text-lg">{extractedData.suggestedFollowUp || 'Today'}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer Name</Label>
                  <Input value={extractedData.customerName || ''} onChange={e => setExtractedData({...extractedData, customerName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Company</Label>
                  <Input value={extractedData.companyName || ''} onChange={e => setExtractedData({...extractedData, companyName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input value={extractedData.phone || ''} onChange={e => setExtractedData({...extractedData, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Service Type</Label>
                  <Input value={extractedData.serviceType || ''} onChange={e => setExtractedData({...extractedData, serviceType: e.target.value})} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Issue Description</Label>
                  <Textarea value={extractedData.issueDescription || ''} onChange={e => setExtractedData({...extractedData, issueDescription: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Estimated Value ($)</Label>
                  <Input type="number" value={extractedData.estimatedValue || ''} onChange={e => setExtractedData({...extractedData, estimatedValue: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <Label>Urgency</Label>
                  <Select value={extractedData.urgency} onValueChange={v => setExtractedData({...extractedData, urgency: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="EMERGENCY">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-slate-50 p-6 flex flex-wrap gap-3 justify-end border-t border-slate-200">
            <Button variant="outline" onClick={() => setExtractedData(null)} disabled={loading}>
              Discard
            </Button>
            <Button variant="secondary" onClick={() => setIsEditing(!isEditing)} disabled={loading}>
              {isEditing ? 'Save Edits' : 'Edit Details'}
            </Button>
            <Button onClick={handleCreateJob} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Job
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
