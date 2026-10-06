'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { addDays, startOfDay } from 'date-fns';

interface MarkContactedDialogProps {
  jobId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MarkContactedDialog({ jobId, isOpen, onClose, onSuccess }: MarkContactedDialogProps) {
  const [loading, setLoading] = useState(false);
  const [method, setMethod] = useState('Call');
  const [notes, setNotes] = useState('');
  const [nextFollowUp, setNextFollowUp] = useState('tomorrow');
  const [customDate, setCustomDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) return;
    
    setLoading(true);
    try {
      let finalDateStr = '';
      if (nextFollowUp === 'none') {
        finalDateStr = 'none';
      } else if (nextFollowUp === 'custom') {
        if (!customDate) throw new Error('Please select a custom date');
        finalDateStr = customDate;
      } else {
        const today = startOfDay(new Date());
        if (nextFollowUp === 'tomorrow') {
          finalDateStr = addDays(today, 1).toISOString();
        } else if (nextFollowUp === '2days') {
          finalDateStr = addDays(today, 2).toISOString();
        }
      }

      const res = await fetch(`/api/jobs/${jobId}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contactMethod: method,
          notes,
          nextFollowUp: finalDateStr
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success('Job marked as contacted');
      onSuccess();
      onClose();
      // Reset form
      setNotes('');
      setNextFollowUp('tomorrow');
      setCustomDate('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Mark Contacted</DialogTitle>
          <DialogDescription>Log a touchpoint with the customer and schedule the next follow-up.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Contact Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v || 'Call')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Call">Call</SelectItem>
                <SelectItem value="SMS">SMS</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Notes (Optional)</Label>
            <Textarea 
              placeholder="What was discussed?" 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Next Follow-up</Label>
            <Select value={nextFollowUp} onValueChange={(v) => setNextFollowUp(v || 'tomorrow')}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tomorrow">Tomorrow</SelectItem>
                <SelectItem value="2days">In 2 days</SelectItem>
                <SelectItem value="custom">Custom date</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {nextFollowUp === 'custom' && (
            <div className="space-y-2">
              <Label>Select Date</Label>
              <Input 
                type="date" 
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
          )}
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? 'Saving...' : 'Save & Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
