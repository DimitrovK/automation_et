'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

type OperationNavigationProps = {
  activeTab: string;
  onTabChange: (value: string) => void;
};

export function OperationNavigation({ activeTab, onTabChange }: OperationNavigationProps) {
  return (
    <div className="mb-4 w-full">
      {/* Desktop tabs - hidden on mobile */}
      <div className="hidden md:block">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-4 border border-border bg-gradient-to-r from-slate-100 to-emerald-50 dark:from-slate-800 dark:to-emerald-900/30">
            <TabsTrigger value="read" className="duration-400 text-sm transition-all hover:bg-muted data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Read
            </TabsTrigger>
            <TabsTrigger value="create" className="duration-400 text-sm transition-all hover:bg-muted data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Create
            </TabsTrigger>
            <TabsTrigger value="update" className="duration-400 text-sm transition-all hover:bg-muted data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Update
            </TabsTrigger>
            <TabsTrigger value="career-path" className="duration-400 text-sm transition-all hover:bg-muted data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-sm">
              Career Path
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Mobile dropdown menu */}
      <div className="block md:hidden">
        <Select value={activeTab} onValueChange={onTabChange}>
          <SelectTrigger className="w-full border-border bg-gradient-to-r from-slate-100 to-emerald-50 dark:from-slate-800 dark:to-emerald-900/30">
            <SelectValue placeholder="Select operation type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="read">📖 Read Operations</SelectItem>
            <SelectItem value="create">➕ Create Operations</SelectItem>
            <SelectItem value="update">✏️ Update Operations</SelectItem>
            <SelectItem value="career-path">📈 Career Path Record</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
