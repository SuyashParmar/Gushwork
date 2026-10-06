'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface ScheduleDialogProps {
  jobId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ScheduleDialog({ jobId, isOpen, onClose, onSuccess }: ScheduleDialogProps) {
  const [loading, setLoading] = useState(false);
  const [scheduleTime, setScheduleTime] = useState('');
  const [techName, setTechName] = useState('');
  const [techPhone, setTechPhone] = useState('');

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobId) return;

    if (!scheduleTime || !techName) {
      toast.error('Please provide a time and a technician name');
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'SCHEDULED',
          scheduledAt: new Date(scheduleTime).toISOString(),
          assignedTechnician: techName,
          assignedTechnicianPhone: techPhone || undefined
        })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      toast.success('Job scheduled successfully');
      onSuccess();
      onClose();
      // Reset form
      setScheduleTime('');
      setTechName('');
      setTechPhone('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to schedule job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Job</DialogTitle>
          <DialogDescription>
            Book a time and assign a technician for this repair.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSchedule} className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Scheduled Date & Time *</label>
            <Input 
              type="datetime-local" 
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Technician Name *</label>
            <Input 
              placeholder="e.g. Alex" 
              value={techName}
              onChange={(e) => setTechName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Technician Phone Number</label>
            <Input 
              placeholder="e.g. 555-1234" 
              value={techPhone}
              onChange={(e) => setTechPhone(e.target.value)}
            />
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? 'Saving...' : 'Confirm Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
