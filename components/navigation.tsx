"use client"

import React from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Home,
  Search,
  Sparkles,
  Menu,
  ChevronDown,
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

export function Navigation({ className }: NavigationProps) {
  const router = useRouter()
  const pathname = usePathname()

  // Define all available pages/tools
  const navigationPages = [
    {
      label: "Dashboard",
      href: "/",
      icon: Home,
      description: "Main overview and tools",
    },
    {
      label: "Career Lookup",
      href: "/career-lookup",
      icon: Search,
      description: "Football player career search",
    },
    // Easy to add more pages here in the future
    // {
    //   label: "Player Stats",
    //   href: "/player-stats",
    //   icon: BarChart,
    //   description: "Statistical analysis tools",
    // },
  ]

  const currentPage = navigationPages.find(page => page.href === pathname)

  const goHome = () => {
    router.push("/")
  }

  return (
    <div className={cn("relative", className)}>
      {/* Main Navigation Bar */}
      <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 rounded-xl shadow-lg border border-emerald-500/30 backdrop-blur-sm">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* Left side - Navigation Menu */}
            <div className="flex items-center gap-3">
              {/* Pages Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-2 transition-all duration-300 font-medium text-white/90 hover:text-white hover:bg-white/10 border border-white/20 hover:border-white/30"
                  >
                    <Menu className="h-4 w-4" />
                    <span className="hidden sm:inline">
                      {currentPage?.label || "Pages"}
                    </span>
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="start" 
                  className="w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-lg"
                >
                  {navigationPages.map((page) => {
                    const Icon = page.icon
                    return (
                      <DropdownMenuItem
                        key={page.href}
                        onClick={() => router.push(page.href)}
                        className={cn(
                          "flex items-start gap-3 p-3 cursor-pointer transition-colors",
                          pathname === page.href 
                            ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300" 
                            : "hover:bg-gray-50 dark:hover:bg-gray-700"
                        )}
                      >
                        <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">{page.label}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{page.description}</span>
                        </div>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
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
              {/* Theme Toggle */}
              <div className="ml-2">
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
      
      {/* Decorative glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 via-green-600/20 to-emerald-700/20 rounded-xl blur-xl -z-10"></div>
    </div>
  )
}
