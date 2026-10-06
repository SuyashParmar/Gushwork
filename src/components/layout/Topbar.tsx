'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search, UserCircle, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { SidebarContent } from './Sidebar';

export function Topbar() {
  const [query, setQuery] = useState('');
  const router = useRouter();

  const [sheetOpen, setSheetOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/customers?q=${encodeURIComponent(query)}`);
      setSheetOpen(false);
    }
  };
  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 md:px-6">
      <div className="flex items-center gap-3 md:gap-4 flex-1">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger render={
            <Button variant="ghost" size="icon" className="md:hidden text-slate-600">
              <Menu className="h-6 w-6" />
            </Button>
          } />
          <SheetContent side="left" className="p-0 w-64">
            <SheetTitle className="sr-only">Menu</SheetTitle>
            <SidebarContent onNavigate={() => setSheetOpen(false)} />
          </SheetContent>
        </Sheet>

        <form onSubmit={handleSearch} className="relative w-full max-w-sm md:w-96">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input 
            type="search" 
            placeholder="Search customers..." 
            className="pl-9 bg-slate-50 border-slate-200"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </form>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <Button variant="ghost" size="icon" className="text-slate-500 hidden sm:flex">
          <Bell className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <UserCircle className="h-8 w-8 text-slate-400" />
          <div className="hidden sm:block text-sm">
            <p className="font-medium">Denise</p>
            <p className="text-xs text-slate-500">Office Manager</p>
          </div>
        </div>
      </div>
    </header>
  );
}
