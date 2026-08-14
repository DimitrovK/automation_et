'use client';

import { ArrowRight, ShieldCheck, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserHubShell } from '@/components/user-hub/UserHubShell';

type HubOption = {
  title: string;
  description: string;
  icon: React.ReactNode;
  href?: string;
  cta: string;
  disabled?: boolean;
};

const OPTIONS: HubOption[] = [
  {
    title: 'Users',
    description: 'Search and filter users; open a profile to view favourites and status. Read-only.',
    icon: <Users className="size-5 text-emerald-600" />,
    href: '/user-hub/users',
    cta: 'Browse users',
  },
  {
    title: 'Audit & moderation',
    description: 'Suspension history and a “who changed what” audit trail.',
    icon: <ShieldCheck className="size-5 text-muted-foreground/70" />,
    cta: 'Coming soon (Phase 2)',
    disabled: true,
  },
];

export default function UserHubLandingPage() {
  const router = useRouter();

  return (
    <UserHubShell
      title="User Hub"
      description="Who the players are, one at a time — profiles, favourites and status. Platform-wide numbers live in Reports."
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {OPTIONS.map(o => (
          <Card
            key={o.title}
            className={o.disabled ? 'opacity-60' : 'transition-shadow duration-200 hover:shadow-lg'}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {o.icon}
                {o.title}
              </CardTitle>
              <CardDescription>{o.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant={o.disabled ? 'outline' : 'default'}
                disabled={o.disabled}
                onClick={() => o.href && router.push(o.href)}
                className={o.disabled
                  ? 'w-full'
                  : 'w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700'}
              >
                {o.cta}
                {!o.disabled && <ArrowRight className="ml-2 size-4" />}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </UserHubShell>
  );
}
