"use client"

import React from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Search,
  Users,
  BarChart3,
  Settings,
  Database,
  FileText,
} from "lucide-react"

import { useAuth } from "@/lib/auth"
import { LoginForm } from "@/components/login-form"
import { LoadingSpinner } from "@/components/loading-spinner"
import { Navigation } from "@/components/navigation"

export default function DashboardPage() {
  const { user, isLoading, isAuthenticated } = useAuth()
  const router = useRouter()

  // Show loading spinner while checking authentication
  if (isLoading) {
    return <LoadingSpinner message="Authenticating" subtitle="Verifying staff access..." />
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />
  }

  const navigateToCareerLookup = () => {
    router.push('/career-lookup')
  }
  const navigateToFootballerManagement = () => {
    router.push('/footballer-management')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-slate-800 dark:to-emerald-900/30 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation */}
        <Navigation />
        
        {/* Header */}
        <div className="text-center space-y-2 relative">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">ExtraTime Automation</h1>
          <p className="text-gray-600 dark:text-gray-300">Football data management and automation tools</p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Career Lookup Card */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="h-5 w-5 text-emerald-600" />
                Career Lookup
              </CardTitle>
              <CardDescription>
                Search for detailed career information of football players from Wikipedia
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={navigateToCareerLookup}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-emerald-500 hover:border-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Search className="h-4 w-4 mr-2" />
                Search Players
              </Button>
            </CardContent>
          </Card>

          {/* Placeholder for future tools */}
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-blue-600" />
                Footballer Management
              </CardTitle>
              <CardDescription>
                Manage footballers and their teams using the Django API
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={navigateToFootballerManagement}
                className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-emerald-500 hover:border-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Database className="h-4 w-4 mr-2" />
               Check Footballers
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200 opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Analytics
              </CardTitle>
              <CardDescription>
                View statistics and analytics for football data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                disabled
                className="w-full"
                variant="outline"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200 opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-orange-600" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                disabled
                className="w-full"
                variant="outline"
              >
                <Users className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200 opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-red-600" />
                Reports
              </CardTitle>
              <CardDescription>
                Generate and view various reports and exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                disabled
                className="w-full"
                variant="outline"
              >
                <FileText className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200 opacity-60">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Settings
              </CardTitle>
              <CardDescription>
                Configure system settings and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                disabled
                className="w-full"
                variant="outline"
              >
                <Settings className="h-4 w-4 mr-2" />
                Coming Soon
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
