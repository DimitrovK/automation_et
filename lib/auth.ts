"use client"

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import type { User, LoginCredentials, AuthResponse } from "@/types/auth"
import { apiFetcher } from "@/lib/api-fetcher"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isAuthenticated = !!user

  const clearError = () => {
    setError(null)
  }

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null) // Clear any previous errors

      const response = await apiFetcher("auth/login/", {
        method: "POST",
        body: JSON.stringify(credentials),
      })

      // Check if user is staff before allowing login
      if (response.user && !response.user.is_staff) {
        const errorMessage = "Only staff users are allowed to access this application."
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      // Store JWT tokens
      localStorage.setItem("token", response.access)
      localStorage.setItem("refresh_token", response.refresh)

      // Set user data
      if (response.user) {
        setUser(response.user)
        localStorage.setItem("user", JSON.stringify(response.user))
      }

      return { success: true }
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        const errorMessage = "Network error. Please check your connection and try again."
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      // Handle API errors
      if (error instanceof Error) {
        let errorMessage = error.message
        
        // Make some error messages more user-friendly
        if (errorMessage.toLowerCase().includes("unable to log in with provided credentials")) {
          errorMessage = "Invalid username or password. Please try again."
        } else if (errorMessage.toLowerCase().includes("invalid credentials")) {
          errorMessage = "Invalid username or password. Please try again."
        }
        
        setError(errorMessage)
        return { success: false, error: errorMessage }
      }

      const genericError = "An unexpected error occurred"
      setError(genericError)
      return { success: false, error: genericError }
    }
  }

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true)

      // Call logout endpoint if available
      try {
        await apiFetcher("auth/logout/", {
          method: "POST",
        })
      } catch (error) {
        // If logout endpoint fails, we still clear local state
        // Silent fail - no need to alert user about logout endpoint issues
      }
    } catch (error) {
      // Silent error handling for logout
    } finally {
      // Clear local state regardless of API call success
      setUser(null)
      localStorage.removeItem("user")
      localStorage.removeItem("token")
      localStorage.removeItem("refresh_token")
      setIsLoading(false)
    }
  }

  const checkAuth = async (): Promise<void> => {
    console.log("checkAuth: Starting...")
    
    try {
      // Check if we're in the browser environment
      if (typeof window === 'undefined') {
        console.log("checkAuth: Not in browser environment")
        setIsLoading(false)
        return
      }

      // Check localStorage for persisted user and tokens
      const storedUser = localStorage.getItem("user")
      const token = localStorage.getItem("token")
      
      console.log("checkAuth: storedUser exists:", !!storedUser, "token exists:", !!token)
      
      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser)
          console.log("checkAuth: parsed user data, is_staff:", userData.is_staff)
          
          // Check if stored user is staff
          if (userData.is_staff) {
            console.log("checkAuth: User is staff, setting user data")
            setUser(userData)
          } else {
            console.log("checkAuth: User is not staff, clearing session")
            localStorage.removeItem("user")
            localStorage.removeItem("token")
            localStorage.removeItem("refresh_token")
            setUser(null)
            setError("Only staff users are allowed to access this application.")
          }
        } catch (parseError) {
          console.log("checkAuth: Error parsing stored data:", parseError)
          // Clear invalid stored data
          localStorage.removeItem("user")
          localStorage.removeItem("token")
          localStorage.removeItem("refresh_token")
          setUser(null)
        }
      } else {
        console.log("checkAuth: No stored credentials, user not authenticated")
        setUser(null)
      }
    } catch (error) {
      console.log("checkAuth: Unexpected error:", error)
      setUser(null)
    } finally {
      // Always set loading to false, regardless of what happened above
      console.log("checkAuth: Setting isLoading to false")
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        isLoading,
        isAuthenticated,
        error,
        login,
        logout,
        checkAuth,
        clearError,
      },
    },
    children,
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
