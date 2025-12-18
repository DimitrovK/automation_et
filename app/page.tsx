'use client';

import {
  BarChart3,
  Database,
  FileQuestion,
  FileText,
  MessageCircle,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React from 'react';
import { LoadingSpinner } from '@/components/loading-spinner';
import { LoginForm } from '@/components/login-form';

import { Navigation } from '@/components/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner message="Authenticating" subtitle="Verifying staff access..." />;
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  const navigateToCareerLookup = () => {
    router.push('/career-lookup');
  };
  const navigateToFootballerManagement = () => {
    router.push('/footballer-management');
  };
  const navigateToBulkCareerLookup = () => {
    router.push('/bulk-career-lookup');
  };
  const navigateToDiscordControl = () => {
    router.push('/discord-control');
  };
  const navigateToQuestionsHub = () => {
    router.push('/questions-uploader');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4 dark:from-slate-800 dark:to-emerald-900/30">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Navigation */}
        <Navigation />

        {/* Header */}
        <div className="relative space-y-2 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">ExtraTime Automation</h1>
          <p className="text-gray-600 dark:text-gray-300">Football data management and automation tools</p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Career Lookup Card */}
          <Card className="transition-shadow duration-200 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="size-5 text-emerald-600" />
                Career Lookup
              </CardTitle>
              <CardDescription>
                Search for detailed career information of football players from Wikipedia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={navigateToCareerLookup}
                className="w-full border-emerald-500 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg transition-all duration-200 hover:border-emerald-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-xl"
              >
                <Search className="mr-2 size-4" />
                Search Players
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow duration-200 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="size-5 text-purple-600" />
                Bulk Career Lookup
              </CardTitle>
              <CardDescription>
                Do a Bulk career validation for multiple players using their Wikipedia URLs or names.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={navigateToBulkCareerLookup}
                className="w-full border-emerald-500 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg transition-all duration-200 hover:border-emerald-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-xl"
              >
                <BarChart3 className="mr-2 size-4" />
                Bulk Check Players
              </Button>
            </CardContent>
          </Card>

          {/* Placeholder for future tools */}
          <Card className="transition-shadow duration-200 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="size-5 text-blue-600" />
                Footballer Management
              </CardTitle>
              <CardDescription>
                Manage footballers and their teams using the Django API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={navigateToFootballerManagement}
                className="w-full border-emerald-500 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg transition-all duration-200 hover:border-emerald-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-xl"
              >
                <Database className="mr-2 size-4" />
                Check Footballers
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow duration-200 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="size-5 text-indigo-600" />
                Discord Control
              </CardTitle>
              <CardDescription>
                Send messages to Discord channels using the ExtraTime bot
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={navigateToDiscordControl}
                className="w-full border-emerald-500 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg transition-all duration-200 hover:border-emerald-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-xl"
              >
                <MessageCircle className="mr-2 size-4" />
                Send Discord Messages
              </Button>
            </CardContent>
          </Card>

          <Card className="transition-shadow duration-200 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileQuestion className="size-5 text-indigo-600" />
                Questions CSV Uploader
              </CardTitle>
              <CardDescription>
                Upload questions via CSV files. Get detailed feedback and error reporting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={navigateToQuestionsHub}
                className="w-full border-emerald-500 bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg transition-all duration-200 hover:border-emerald-600 hover:from-emerald-600 hover:to-green-700 hover:shadow-xl"
              >
                <FileQuestion className="mr-2 size-4" />
                Upload Questions
              </Button>
            </CardContent>
          </Card>

          <Card className="opacity-60 transition-shadow duration-200 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5 text-orange-600" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                disabled
                className="w-full"
                variant="outline"
              >
                <Users className="mr-2 size-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="opacity-60 transition-shadow duration-200 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-5 text-red-600" />
                Reports
              </CardTitle>
              <CardDescription>
                Generate and view various reports and exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                disabled
                className="w-full"
                variant="outline"
              >
                <FileText className="mr-2 size-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="opacity-60 transition-shadow duration-200 hover:shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="size-5 text-gray-600" />
                Settings
              </CardTitle>
              <CardDescription>
                Configure system settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                disabled
                className="w-full"
                variant="outline"
              >
                <Settings className="mr-2 size-4" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
