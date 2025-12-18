import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type FMCardProps = {
  children: ReactNode;
  className?: string;
};

type FMCardHeaderProps = {
  children: ReactNode;
  className?: string;
};

type FMCardBodyProps = {
  children: ReactNode;
  className?: string;
};

export function FMCard({ children, className }: FMCardProps) {
  return (
    <div className={cn('fm-card', className)}>
      {children}
    </div>
  );
}

export function FMCardHeader({ children, className }: FMCardHeaderProps) {
  return (
    <div className={cn('fm-card-header', className)}>
      {children}
    </div>
  );
}

export function FMCardBody({ children, className }: FMCardBodyProps) {
  return (
    <div className={cn('fm-card-body', className)}>
      {children}
    </div>
  );
}
