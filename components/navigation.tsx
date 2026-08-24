'use client';

import type { NavigationPage } from '@/lib/global-nav';
import {
  ChevronDown,
  ChevronUp,
  Database,
  FileQuestion,
  Globe2,
  Home,
  LayoutDashboard,
  LineChart,
  Menu,
  MessageCircle,
  Microscope,
  Search,
  Sparkles,
  UserCog,
  Users,
  Users2,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserMenu } from '@/components/user-menu';
import { ANALYTICS_CHILDREN, REPORTS_CHILDREN } from '@/lib/global-nav';
import { cn } from '@/lib/utils';

type NavigationProps = {
  className?: string;
};

export function Navigation({ className }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  // State to track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    'Footballer Data': true, // Expanded by default
    'User Hub': true,
    'Reports': true,
    'Analytics': true,
  });

  // State for mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Define all available pages/tools with nested structure
  const navigationPages: NavigationPage[] = [
    {
      label: 'Dashboard',
      href: '/',
      icon: Home,
      description: 'Main overview and tools',
    },
    {
      label: 'Footballer Data',
      icon: Database,
      description: 'Manage footballer information',
      children: [
        {
          label: 'Career Lookup',
          href: '/career-lookup',
          icon: Search,
          description: 'Single player career search',
        },
        {
          label: 'Bulk Career Lookup',
          href: '/bulk-career-lookup',
          icon: Users,
          description: 'Bulk player career validation',
        },
        {
          label: 'Footballer Management',
          href: '/footballer-management',
          icon: Sparkles,
          description: 'Test footballer API endpoints',
        },
        {
          label: 'Team Players',
          href: '/team-players',
          icon: Users2,
          description: 'Browse the squad assigned to a team',
        },
        {
          label: 'Nation Players',
          href: '/nation-players',
          icon: Globe2,
          description: 'Everyone who played for a club in a country',
        },
      ],
    },
    {
      label: 'User Hub',
      icon: UserCog,
      description: 'User analytics and management',
      children: [
        {
          label: 'Overview',
          href: '/user-hub',
          icon: LayoutDashboard,
          description: 'All User Hub tools',
        },
        {
          label: 'Users',
          href: '/user-hub/users',
          icon: Users,
          description: 'Search users and view profiles',
        },
      ],
    },
    {
      label: 'Reports',
      icon: LineChart,
      description: 'Platform activity and multiplayer reporting',
      children: REPORTS_CHILDREN,
    },
    {
      // Analytics is not Reports: reports answer "how are players behaving",
      // analytics answer "is the material any good". Different question,
      // different reader — so it gets its own section rather than a fifth
      // entry under Reports.
      label: 'Analytics',
      icon: Microscope,
      description: 'Whether the content and the data behind it are any good',
      children: ANALYTICS_CHILDREN,
    },
    {
      label: 'Discord Control',
      href: '/discord-control',
      icon: MessageCircle,
      description: 'Send messages to Discord channels',
    },
    {
      label: 'Questions CSV Uploader',
      href: '/questions-uploader',
      icon: FileQuestion,
      description: 'Upload Questions to Backend',
    },
    // Easy to add more pages here in the future
  ];

  // Find current page (check both parent and child pages)
  const findCurrentPage = (pages: NavigationPage[]): NavigationPage | undefined => {
    for (const page of pages) {
      if (page.href === pathname) {
        return page;
      }
      if (page.children) {
        const found = findCurrentPage(page.children);
        if (found) {
          return found;
        }
      }
    }
    return undefined;
  };

  const currentPage = findCurrentPage(navigationPages);

  // Fire a click-style handler from keyboard activation (Enter / Space) so
  // the clickable nav rows are operable without a mouse.
  const onActivateKey = (handler: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handler();
    }
  };

  // Toggle category expansion
  const toggleCategory = (label: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [label]: !prev[label],
    }));
  };

  // Render navigation item (with or without children)
  const renderNavigationItem = (page: NavigationPage) => {
    const Icon = page.icon;
    const isActive = page.href === pathname;
    const hasActiveChild = page.children?.some(child => child.href === pathname);
    const isExpanded = expandedCategories[page.label];

    // If page has children, render as expandable category
    if (page.children && page.children.length > 0) {
      return (
        <div key={page.label} className="mb-1">
          {/* Parent category header */}
          <div
            role="button"
            tabIndex={0}
            aria-expanded={isExpanded}
            onClick={(e) => {
              e.stopPropagation();
              toggleCategory(page.label);
            }}
            onKeyDown={onActivateKey(() => toggleCategory(page.label))}
            className={cn(
              'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-all duration-200',
              hasActiveChild
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted',
            )}
          >
            <Icon className="size-4 shrink-0" />
            <div className="flex-1">
              <span className="text-sm font-semibold">{page.label}</span>
            </div>
            {isExpanded
              ? (
                  <ChevronUp className="size-4 shrink-0 transition-transform" />
                )
              : (
                  <ChevronDown className="size-4 shrink-0 transition-transform" />
                )}
          </div>

          {/* Children items (shown when expanded) */}
          {isExpanded && (
            <div className="mt-1 ml-3 space-y-1 border-l-2 border-border pl-3">
              {page.children.map((child) => {
                const ChildIcon = child.icon;
                const isChildActive = child.href === pathname;
                return (
                  <div
                    key={child.href}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      child.href && router.push(child.href);
                      setMobileMenuOpen(false);
                    }}
                    onKeyDown={onActivateKey(() => {
                      if (child.href) {
                        router.push(child.href);
                      }
                      setMobileMenuOpen(false);
                    })}
                    className={cn(
                      'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 transition-all duration-200',
                      isChildActive
                        ? 'bg-emerald-50 font-medium text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                        : 'text-foreground/80 hover:bg-muted/50',
                    )}
                  >
                    <ChildIcon className="size-3.5 shrink-0" />
                    <span className="text-sm">{child.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    // Regular menu item without children
    return (
      <div
        key={page.href}
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          page.href && router.push(page.href);
          setMobileMenuOpen(false);
        }}
        onKeyDown={onActivateKey(() => {
          if (page.href) {
            router.push(page.href);
          }
          setMobileMenuOpen(false);
        })}
        className={cn(
          'mb-1 flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-all duration-200',
          isActive
            ? 'bg-primary/10 font-medium text-primary'
            : 'text-foreground/80 hover:bg-muted',
        )}
      >
        <Icon className="size-4 shrink-0" />
        <span className="text-sm font-medium">{page.label}</span>
      </div>
    );
  };

  return (
    <div className={cn('relative', className)}>
      {/* Main Navigation Bar */}
      <div className="rounded-xl border border-emerald-500/30 bg-linear-to-r from-emerald-600 via-green-600 to-emerald-700 shadow-lg backdrop-blur-xs">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            {/* Left side - Navigation Menu */}
            <div className="flex items-center gap-3">
              {/* Desktop Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden items-center gap-2 border border-white/20 font-medium text-white/90 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white sm:flex"
                  >
                    <Menu className="size-4" />
                    <span className="hidden md:inline">
                      {currentPage?.label || 'Pages'}
                    </span>
                    <ChevronDown className="size-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="max-h-[80vh] w-72 overflow-y-auto p-2 shadow-xl"
                >
                  {navigationPages.map(page => renderNavigationItem(page))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Burger Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="flex items-center gap-2 border border-white/20 font-medium text-white/90 transition-all duration-300 hover:border-white/30 hover:bg-white/10 hover:text-white sm:hidden"
              >
                <Menu className="size-5" />
              </Button>
            </div>

            {/* Center - Brand */}
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-white/15 p-1.5">
                <Sparkles className="size-4 text-white" />
              </div>
              <div className="hidden md:block">
                <h2 className="text-sm font-semibold text-white">ExtraTime</h2>
                <p className="text-xs leading-none text-emerald-100">Automation</p>
              </div>
            </div>

            {/* Right side - Theme toggle and User menu */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle - Hidden on mobile */}
              <div className="ml-2 hidden sm:block">
                <div className="*:border-white/20 *:bg-transparent *:text-white/90 *:transition-all *:duration-200 *:hover:border-white/30 *:hover:bg-white/10 *:hover:text-white">
                  <ThemeToggle />
                </div>
              </div>

              {/* User Menu */}
              <div className="ml-1">
                <UserMenu />
              </div>
            </div>
          </div>
        </div>

        {/* Subtle bottom border gradient */}
        <div className="h-0.5 bg-linear-to-r from-transparent via-white/30 to-transparent"></div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs sm:hidden"
            onClick={() => setMobileMenuOpen(false)}
            onKeyDown={onActivateKey(() => setMobileMenuOpen(false))}
          />

          {/* Mobile Menu Panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] overflow-y-auto bg-card shadow-2xl sm:hidden">
            <div className="p-4">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <Sparkles className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-foreground">ExtraTime</h2>
                    <p className="text-xs text-muted-foreground">Automation</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-muted-foreground"
                >
                  ✕
                </Button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                {navigationPages.map(page => renderNavigationItem(page))}
              </nav>

              {/* Theme Toggle in Mobile Menu */}
              <div className="mt-6 border-t border-border pt-6">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm font-medium text-foreground/80">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Decorative glow effect */}
      <div className="absolute inset-0 -z-10 rounded-xl bg-linear-to-r from-emerald-600/20 via-green-600/20 to-emerald-700/20 blur-xl"></div>
    </div>
  );
}
