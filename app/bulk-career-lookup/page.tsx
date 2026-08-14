'use client';

import { BulkCareerLookupHub } from '@/components/bulk-career-lookup/BulkCareerLookupHub';
import { LoadingSpinner } from '@/components/loading-spinner';
import { LoginForm } from '@/components/login-form';
import { Navigation } from '@/components/navigation';
import { useAuth } from '@/lib/auth';

export default function BulkCareerLookupPage() {
  const { user: _user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mx-auto max-w-7xl space-y-6">
        <Navigation />

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Bulk Career Lookup</h1>
            <p className="mt-1 text-muted-foreground">
              Check multiple players for career data discrepancies
            </p>
          </div>
        </div>

        <BulkCareerLookupHub isAuthenticated={isAuthenticated} />
      </div>
    </div>
  );
}
