"use client"

import React, { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Home,
  Search,
  Sparkles,
  Menu,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Users,
  MessageCircle,
  FileQuestion,
  Database,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { UserMenu } from "@/components/user-menu"
import { ThemeToggle } from "@/components/theme-toggle"

interface NavigationProps {
  className?: string
}

interface NavigationPage {
  label: string
  href?: string
  icon: any
  description: string
  children?: NavigationPage[]
  defaultExpanded?: boolean
}

export function Navigation({ className }: NavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  
  // State to track which categories are expanded
  const [expandedCategories, setExpandedCategories] = useState<{ [key: string]: boolean }>({
    "Footballer Data": true, // Expanded by default
  })
  
  // State for mobile menu
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Define all available pages/tools with nested structure
  const navigationPages: NavigationPage[] = [
    {
      label: "Dashboard",
      href: "/",
      icon: Home,
      description: "Main overview and tools",
    },
    {
      label: "Footballer Data",
      icon: Database,
      description: "Manage footballer information",
      children: [
        {
          label: "Career Lookup",
          href: "/career-lookup",
          icon: Search,
          description: "Single player career search",
        },
        {
          label: "Bulk Career Lookup",
          href: "/bulk-career-lookup",
          icon: Users,
          description: "Bulk player career validation",
        },
        {
          label: "Footballer Management",
          href: "/footballer-management",
          icon: Sparkles,
          description: "Test footballer API endpoints",
        },
      ],
    },
    {
      label: "Discord Control",
      href: "/discord-control",
      icon: MessageCircle,
      description: "Send messages to Discord channels",
    },
    {
      label: "Questions CSV Uploader",
      href: "/questions-uploader",
      icon: FileQuestion,
      description: "Upload Questions to Backend",
    },
    // Easy to add more pages here in the future
  ]

  // Find current page (check both parent and child pages)
  const findCurrentPage = (pages: NavigationPage[]): NavigationPage | undefined => {
    for (const page of pages) {
      if (page.href === pathname) return page
      if (page.children) {
        const found = findCurrentPage(page.children)
        if (found) return found
      }
    }
    return undefined
  }

  const currentPage = findCurrentPage(navigationPages)

  const goHome = () => {
    router.push("/")
  }

  // Toggle category expansion
  const toggleCategory = (label: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [label]: !prev[label]
    }))
  }

  // Render navigation item (with or without children)
  const renderNavigationItem = (page: NavigationPage) => {
    const Icon = page.icon
    const isActive = page.href === pathname
    const hasActiveChild = page.children?.some(child => child.href === pathname)
    const isExpanded = expandedCategories[page.label]

    // If page has children, render as expandable category
    if (page.children && page.children.length > 0) {
      return (
        <div key={page.label} className="mb-1">
          {/* Parent category header */}
          <div
            onClick={(e) => {
              e.stopPropagation()
              toggleCategory(page.label)
            }}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-200",
              hasActiveChild
                ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <div className="flex-1">
              <span className="font-semibold text-sm">{page.label}</span>
            </div>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 flex-shrink-0 transition-transform" />
            ) : (
              <ChevronDown className="h-4 w-4 flex-shrink-0 transition-transform" />
            )}
          </div>
          
          {/* Children items (shown when expanded) */}
          {isExpanded && (
            <div className="mt-1 ml-3 pl-3 border-l-2 border-gray-300 dark:border-gray-600 space-y-1">
              {page.children.map((child) => {
                const ChildIcon = child.icon
                const isChildActive = child.href === pathname
                return (
                  <div
                    key={child.href}
                    onClick={(e) => {
                      e.stopPropagation()
                      child.href && router.push(child.href)
                      setMobileMenuOpen(false)
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-all duration-200",
                      isChildActive
                        ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-medium"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/30 text-gray-700 dark:text-gray-300"
                    )}
                  >
                    <ChildIcon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="text-sm">{child.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )
    }

    // Regular menu item without children
    return (
      <div
        key={page.href}
        onClick={(e) => {
          e.stopPropagation()
          page.href && router.push(page.href)
          setMobileMenuOpen(false)
        }}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-200 mb-1",
          isActive
            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium"
            : "hover:bg-gray-100 dark:hover:bg-gray-700/50 text-gray-700 dark:text-gray-300"
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <span className="text-sm font-medium">{page.label}</span>
      </div>
    )
  }

  return (
    <div className={cn("relative", className)}>
      {/* Main Navigation Bar */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 rounded-xl shadow-lg border border-emerald-500/30 backdrop-blur-sm">
        <div className="px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Navigation Menu */}
            <div className="flex items-center gap-3">
              {/* Desktop Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hidden sm:flex items-center gap-2 transition-all duration-300 font-medium text-white/90 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/30"
                  >
                    <Menu className="h-4 w-4" />
                    <span className="hidden md:inline">
                      {currentPage?.label || "Pages"}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  className="w-72 max-h-[80vh] overflow-y-auto bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl p-2"
                >
                  {navigationPages.map((page) => renderNavigationItem(page))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Mobile Burger Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden flex items-center gap-2 transition-all duration-300 font-medium text-white/90 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/30"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>

            {/* Center - Brand */}
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-white/15 rounded-lg">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div className="hidden md:block">
                <h2 className="text-white font-semibold text-sm">ExtraTime</h2>
                <p className="text-emerald-100 text-xs leading-none">Automation</p>
              </div>
            </div>

            {/* Right side - Theme toggle and User menu */}
            <div className="flex items-center gap-2">
              {/* Theme Toggle - Hidden on mobile */}
              <div className="ml-2 hidden sm:block">
                <div className="[&>*]:bg-transparent [&>*]:border-white/20 [&>*]:text-white/90 [&>*]:hover:bg-white/10 [&>*]:hover:border-white/30 [&>*]:hover:text-white [&>*]:transition-all [&>*]:duration-200">
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
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 sm:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu Panel */}
          <div className="fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-white dark:bg-gray-900 shadow-2xl z-50 sm:hidden overflow-y-auto">
            <div className="p-4">
              {/* Header */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Sparkles className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-gray-900 dark:text-white font-bold text-base">ExtraTime</h2>
                    <p className="text-gray-600 dark:text-gray-400 text-xs">Automation</p>
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
                {navigationPages.map((page) => renderNavigationItem(page))}
              </nav>
              
              {/* Theme Toggle in Mobile Menu */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
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
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-green-600/20 to-emerald-700/20 rounded-xl blur-xl -z-10"></div>
    </div>
  )
}