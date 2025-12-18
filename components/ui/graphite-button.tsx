'use client';

import type { LucideIcon } from 'lucide-react';
import { Loader2 } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type GraphiteButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  icon?: LucideIcon;
  className?: string;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
};

export function GraphiteButton({
  onClick,
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  children,
  icon: Icon,
  className,
  variant = 'default',
  size = 'default',
  ...props
}: GraphiteButtonProps) {
  const baseClasses = variant === 'default'
    ? 'bg-gradient-to-r from-slate-600 to-gray-700 hover:from-slate-700 hover:to-gray-800 text-white border-slate-600 hover:border-slate-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed'
    : '';

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(baseClasses, className)}
      variant={variant}
      size={size}
      {...props}
    >
      {loading
        ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              {loadingText}
            </>
          )
        : (
            <>
              {Icon && <Icon className="mr-2 size-4" />}
              {children}
            </>
          )}
    </Button>
  );
}
