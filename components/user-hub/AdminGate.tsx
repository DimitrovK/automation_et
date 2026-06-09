'use client';

import { ShieldAlert } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Phase-1 client gate for the User Hub. The user is already authenticated
 * (staff) by the time this renders — this only blocks the hub's private
 * user-data surfaces to superusers. It is NOT the security boundary: every
 * underlying endpoint is `IsAdminUser` server-side; this is a friendlier
 * "you don't have access" than silently hitting 403s.
 */
export function AdminGate() {
  return (
    <div className="mx-auto max-w-md py-16">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="size-5 text-orange-600" />
            Superuser access required
          </CardTitle>
          <CardDescription>
            The User Hub surfaces private user data, so it's limited to superusers.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            You're signed in, but your account isn't a superuser. Ask an administrator
            to grant access if you need it.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
