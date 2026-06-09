'use client';

import type { HubUser } from '@/types/user-hub';
import { ExternalLink, History, ShieldBan } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import config from '@/lib/config';
import { prettySlug, suspensionLabel } from '@/lib/user-hub-format';
import { BetaBadges, OnlineDot, UserAvatar } from './user-badges';

type Props = {
  /** The row's user (list payload); null when the sheet is closed. */
  user: HubUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-gray-100 py-1.5 text-sm dark:border-gray-800">
      <span className="text-gray-500">{label}</span>
      <span className="text-right font-medium">{value ?? '—'}</span>
    </div>
  );
}

export function UserDetailSheet({ user, open, onOpenChange }: Props) {
  if (!user) {
    return null;
  }

  // Django admin URL — the app label is `Accounts` (capitalised), matching
  // /admin/Accounts/user/<id>/change/.
  const adminUrl = config.getAdminUrl(`Accounts/user/${user.id}/change/`);
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(' ') || '—';

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <UserAvatar user={user} className="size-9" />
            {user.username}
            {user.is_superuser && <Badge variant="secondary" className="bg-amber-100 text-amber-900">superuser</Badge>}
            {!user.is_superuser && user.is_staff && <Badge variant="secondary">staff</Badge>}
          </SheetTitle>
          <SheetDescription>
            User #
            {user.id}
            {' '}
            ·
            {' '}
            <OnlineDot user={user} />
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4">
          <Button asChild variant="outline" className="w-full">
            <a href={adminUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 size-4" />
              Manage in Django Admin
            </a>
          </Button>
        </div>

        <Tabs defaultValue="profile" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="favourites">Favourites</TabsTrigger>
            <TabsTrigger value="audit">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-3">
            <Field label="Username" value={user.username} />
            <Field label="Email" value={user.email || '—'} />
            <Field label="Full name" value={fullName} />
            <Field label="Active" value={user.is_active ? 'Yes' : 'No'} />
            <Field label="Beta" value={user.is_beta_tester ? <BetaBadges user={user} max={4} /> : 'No'} />
            <Field
              label="Suspension"
              value={user.suspension_scope
                ? <Badge variant="destructive">{suspensionLabel(user.suspension_scope)}</Badge>
                : 'None'}
            />
            {user.suspended_until && <Field label="Suspended until" value={user.suspended_until} />}
            {user.date_joined && <Field label="Joined" value={new Date(user.date_joined).toLocaleDateString()} />}
            {user.last_login && <Field label="Last login" value={new Date(user.last_login).toLocaleString()} />}
          </TabsContent>

          <TabsContent value="favourites" className="mt-3">
            {user.favourite_games.length === 0
              ? (
                  <p className="py-6 text-center text-sm text-gray-500">No favourite games.</p>
                )
              : (
                  <ol className="space-y-1">
                    {user.favourite_games.map((g, i) => (
                      <li key={g} className="flex items-center gap-2 text-sm">
                        <span className="w-5 font-mono text-xs text-gray-400">
                          {i + 1}
                          .
                        </span>
                        <Badge variant="outline">{prettySlug(g)}</Badge>
                      </li>
                    ))}
                  </ol>
                )}
          </TabsContent>

          <TabsContent value="audit" className="mt-3">
            <div className="space-y-3 py-4 text-center">
              <ShieldBan className="mx-auto size-8 text-gray-300" />
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Suspension history & audit trail
              </p>
              <p className="mx-auto max-w-xs text-xs text-gray-500">
                <History className="mr-1 inline size-3" />
                Coming in Phase 2 — per-user suspension history and a "who changed what"
                audit log (see backend issue #1246). For now, changes are made and tracked
                via Django Admin.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
