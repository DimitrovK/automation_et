"use client"

import React from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface OperationNavigationProps {
  activeTab: string
  onTabChange: (value: string) => void
}

export function OperationNavigation({ activeTab, onTabChange }: OperationNavigationProps) {
  return (
    <div className="w-full mb-4">
      {/* Desktop tabs - hidden on mobile */}
      <div className="hidden md:block">
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-5 bg-gradient-to-r from-slate-100 to-emerald-50 dark:from-slate-800 dark:to-emerald-900/30 border border-slate-200 dark:border-slate-700">
            <TabsTrigger value="overview" className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-300/60 data-[state=active]:to-emerald-400/70 data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md data-[state=active]:border data-[state=active]:border-emerald-200/50 hover:bg-white/30 dark:hover:bg-slate-600/30 dark:data-[state=active]:text-white dark:data-[state=active]:from-emerald-400/70 dark:data-[state=active]:to-emerald-500/80 transition-all duration-400">
              Overview
            </TabsTrigger>
            <TabsTrigger value="read" className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-300/60 data-[state=active]:to-emerald-400/70 data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md data-[state=active]:border data-[state=active]:border-emerald-200/50 hover:bg-white/30 dark:hover:bg-slate-600/30 dark:data-[state=active]:text-white dark:data-[state=active]:from-emerald-400/70 dark:data-[state=active]:to-emerald-500/80 transition-all duration-400">
              Read
            </TabsTrigger>
            <TabsTrigger value="create" className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-300/60 data-[state=active]:to-emerald-400/70 data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md data-[state=active]:border data-[state=active]:border-emerald-200/50 hover:bg-white/30 dark:hover:bg-slate-600/30 dark:data-[state=active]:text-white dark:data-[state=active]:from-emerald-400/70 dark:data-[state=active]:to-emerald-500/80 transition-all duration-400">
              Create
            </TabsTrigger>
            <TabsTrigger value="update" className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-300/60 data-[state=active]:to-emerald-400/70 data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md data-[state=active]:border data-[state=active]:border-emerald-200/50 hover:bg-white/30 dark:hover:bg-slate-600/30 dark:data-[state=active]:text-white dark:data-[state=active]:from-emerald-400/70 dark:data-[state=active]:to-emerald-500/80 transition-all duration-400">
              Update
            </TabsTrigger>
            <TabsTrigger value="delete" className="text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-300/60 data-[state=active]:to-emerald-400/70 data-[state=active]:text-emerald-900 data-[state=active]:shadow-sm data-[state=active]:backdrop-blur-md data-[state=active]:border data-[state=active]:border-emerald-200/50 hover:bg-white/30 dark:hover:bg-slate-600/30 dark:data-[state=active]:text-white dark:data-[state=active]:from-emerald-400/70 dark:data-[state=active]:to-emerald-500/80 transition-all duration-400">
              Delete
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Mobile dropdown menu */}
      <div className="block md:hidden">
        <Select value={activeTab} onValueChange={onTabChange}>
          <SelectTrigger className="w-full bg-gradient-to-r from-slate-100 to-emerald-50 dark:from-slate-800 dark:to-emerald-900/30 border-slate-200 dark:border-slate-700">
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
  )
}
