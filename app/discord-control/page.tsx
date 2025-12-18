'use client';

import { MessageCircle } from 'lucide-react';
import React from 'react';
import { DiscordControlPage } from '@/components/discord-control/ControlPage';
import { LoadingSpinner } from '@/components/loading-spinner';
import { LoginForm } from '@/components/login-form';
import { Navigation } from '@/components/navigation';
import { useAuth } from '@/lib/auth';

export default function DiscordControlPageWrapper() {
  const { user, isLoading, isAuthenticated } = useAuth();

  // Authentication check
  if (isLoading) {
    return <LoadingSpinner message="Authenticating" subtitle="Verifying staff access..." />;
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 dark:from-slate-800 dark:to-emerald-900/30">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Navigation */}
        <Navigation />

        {/* Header */}
        <div className="space-y-2 text-center">
          <h1 className="flex items-center justify-center gap-3 text-4xl font-bold text-gray-900 dark:text-white">
            <MessageCircle className="size-8 text-indigo-600" />
            Discord Control
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Send messages to Discord channels using the ExtraTime bot
          </p>
        </div>

        {/* Main Control Component */}
        <DiscordControlPage />
      </div>
    </div>
  );
}
