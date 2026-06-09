'use client';

import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Database,
  FileQuestion,
  Home,
  LayoutDashboard,
  Menu,
  MessageCircle,
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
import { cn } from '@/lib/utils';

type NavigationProps = {
  className?: string;
};

type NavigationPage = {
  label: string;
  href?: string;
  icon: any;
  description: string;
  children?: NavigationPage[];
  defaultExpanded?: boolean;
};

export function Navigation({ className }: NavigationProps) {
  const router = useRouter();
  const pathname = usePathname();

  // State to track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    'Footballer Data': true, // Expanded by default
    'User Hub': true,
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
        {
          label: 'Favourites Analytics',
          href: '/user-hub/analytics',
          icon: BarChart3,
          description: 'Favourite-games adoption and popularity',
        },
      ],
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
              'flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-200',
              hasActiveChild
                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700/50',
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
            <div className="ml-3 mt-1 space-y-1 border-l-2 border-gray-300 pl-3 dark:border-gray-600">
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
                      'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-200',
                      isChildActive
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-medium'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-700/30 text-gray-700 dark:text-gray-300',
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
          'flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-200 mb-1',
          isActive
            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300',
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
      <div className="rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 shadow-lg backdrop-blur-sm">
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
                  className="max-h-[80vh] w-72 overflow-y-auto border border-gray-200 bg-white p-2 shadow-xl dark:border-gray-700 dark:bg-gray-800"
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
                <div className="[&>*]:border-white/20 [&>*]:bg-transparent [&>*]:text-white/90 [&>*]:transition-all [&>*]:duration-200 [&>*]:hover:border-white/30 [&>*]:hover:bg-white/10 [&>*]:hover:text-white">
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
        <div className="h-0.5 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            role="button"
            tabIndex={0}
            aria-label="Close menu"
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
            onClick={() => setMobileMenuOpen(false)}
            onKeyDown={onActivateKey(() => setMobileMenuOpen(false))}
          />

          {/* Mobile Menu Panel */}
          <div className="fixed inset-y-0 left-0 z-50 w-80 max-w-[85vw] overflow-y-auto bg-white shadow-2xl dark:bg-gray-900 sm:hidden">
            <div className="p-4">
              {/* Header */}
              <div className="mb-6 flex items-center justify-between border-b border-gray-200 pb-4 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="rounded-lg bg-emerald-100 p-2 dark:bg-emerald-900/30">
                    <Sparkles className="size-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">ExtraTime</h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Automation</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-gray-600 dark:text-gray-400"
                >
                  ✕
                </Button>
              </div>

              {/* Navigation Items */}
              <nav className="space-y-1">
                {navigationPages.map(page => renderNavigationItem(page))}
              </nav>

              {/* Theme Toggle in Mobile Menu */}
              <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Decorative glow effect */}
      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-emerald-600/20 via-green-600/20 to-emerald-700/20 blur-xl"></div>
    </div>
  );
}
