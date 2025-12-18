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
          <TabsList className="grid w-full grid-cols-5 border border-slate-200 bg-gradient-to-r from-slate-100 to-emerald-50 dark:border-slate-700 dark:from-slate-800 dark:to-emerald-900/30">
            <TabsTrigger value="overview" className="duration-400 text-sm transition-all hover:bg-white/30 data-[state=active]:border data-[state=active]:border-emerald-200/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-300/60 data-[state=active]:to-emerald-400/70 data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md dark:hover:bg-slate-600/30 dark:data-[state=active]:from-emerald-400/70 dark:data-[state=active]:to-emerald-500/80 dark:data-[state=active]:text-white">
              Overview
            </TabsTrigger>
            <TabsTrigger value="read" className="duration-400 text-sm transition-all hover:bg-white/30 data-[state=active]:border data-[state=active]:border-emerald-200/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-300/60 data-[state=active]:to-emerald-400/70 data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md dark:hover:bg-slate-600/30 dark:data-[state=active]:from-emerald-400/70 dark:data-[state=active]:to-emerald-500/80 dark:data-[state=active]:text-white">
              Read
            </TabsTrigger>
            <TabsTrigger value="create" className="duration-400 text-sm transition-all hover:bg-white/30 data-[state=active]:border data-[state=active]:border-emerald-200/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-300/60 data-[state=active]:to-emerald-400/70 data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md dark:hover:bg-slate-600/30 dark:data-[state=active]:from-emerald-400/70 dark:data-[state=active]:to-emerald-500/80 dark:data-[state=active]:text-white">
              Create
            </TabsTrigger>
            <TabsTrigger value="update" className="duration-400 text-sm transition-all hover:bg-white/30 data-[state=active]:border data-[state=active]:border-emerald-200/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-300/60 data-[state=active]:to-emerald-400/70 data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md dark:hover:bg-slate-600/30 dark:data-[state=active]:from-emerald-400/70 dark:data-[state=active]:to-emerald-500/80 dark:data-[state=active]:text-white">
              Update
            </TabsTrigger>
            <TabsTrigger value="delete" className="duration-400 text-sm transition-all hover:bg-white/30 data-[state=active]:border data-[state=active]:border-emerald-200/50 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-300/60 data-[state=active]:to-emerald-400/70 data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md dark:hover:bg-slate-600/30 dark:data-[state=active]:from-emerald-400/70 dark:data-[state=active]:to-emerald-500/80 dark:data-[state=active]:text-white">
              Delete
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Mobile dropdown menu */}
      <div className="block md:hidden">
        <Select value={activeTab} onValueChange={onTabChange}>
          <SelectTrigger className="w-full border-slate-200 bg-gradient-to-r from-slate-100 to-emerald-50 dark:border-slate-700 dark:from-slate-800 dark:to-emerald-900/30">
            <SelectValue placeholder="Select operation type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="overview">📋 Overview</SelectItem>
            <SelectItem value="read">📖 Read Operations</SelectItem>
            <SelectItem value="create">➕ Create Operations</SelectItem>
            <SelectItem value="update">✏️ Update Operations</SelectItem>
            <SelectItem value="delete">🗑️ Delete Operations</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
