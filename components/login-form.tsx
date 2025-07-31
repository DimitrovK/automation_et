"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, LogIn, Loader2 } from "lucide-react"
import { useAuth } from "@/lib/auth"
import { LoadingSpinner } from "@/components/loading-spinner"
import type { LoginCredentials } from "@/types/auth"

export function LoginForm() {
  const { login, isLoading, error, clearError } = useAuth()
  const passwordInputRef = useRef<HTMLInputElement>(null)
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: "",
    password: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError() // Clear any previous errors
    setIsSubmitting(true)

    // Store current credentials before the login attempt
    const currentCredentials = { ...credentials }

    try {
      const result = await login(credentials)

      if (!result.success) {
        // Clear only the password field on failed login, keep username
        setCredentials({
          username: currentCredentials.username, // Explicitly preserve username
          password: "",
        })
        // Focus the password field for immediate re-entry
        setTimeout(() => {
          passwordInputRef.current?.focus()
        }, 100)
      }
    } catch (err) {
      // Network or other errors - keep both fields
      setCredentials({
        username: currentCredentials.username,
        password: currentCredentials.password,
      })
      console.error('Login error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof LoginCredentials) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setCredentials((prev) => ({
      ...prev,
      [field]: e.target.value,
    }))
    // Clear error when user starts typing
    if (error) {
      clearError()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      {isSubmitting && (
        <LoadingSpinner 
          message="Authenticating" 
          subtitle="Verifying staff credentials" 
          size="md"
          overlay={true}
        />
      )}
      
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <LogIn className="h-6 w-6" />
            Staff Login
          </CardTitle>
          <CardDescription>Sign in to access the Footballer Career Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                value={credentials.username}
                onChange={handleInputChange("username")}
                placeholder="Enter your username"
                required
                disabled={isSubmitting || isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                ref={passwordInputRef}
                id="password"
                type="password"
                value={credentials.password}
                onChange={handleInputChange("password")}
                placeholder="Enter your password"
                required
                disabled={isSubmitting || isLoading}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Login Failed:</strong> {error}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isLoading || !credentials.username || !credentials.password}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="h-4 w-4 mr-2" />
                  Sign In
                </>
              )}
            </Button>
          </form>

          {/* Help text for common issues */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">Having trouble logging in? Check your username and password.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
