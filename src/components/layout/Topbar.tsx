import { Bell, Search, UserCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function Topbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="flex items-center gap-4 flex-1">
        <div className="relative w-96 max-w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search customers, jobs, or phone numbers..." 
            className="pl-9 bg-slate-50 border-slate-200"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-slate-500">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <UserCircle className="h-8 w-8 text-slate-400" />
          <div className="text-sm">
            <p className="font-medium">Denise</p>
            <p className="text-xs text-slate-500">Office Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
}
