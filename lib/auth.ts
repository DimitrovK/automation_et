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
      setIsLoading(true)
      setError(null) // Clear any previous errors

      const response = await apiFetcher("auth/login/", {
        method: "POST",
        body: JSON.stringify(credentials),
      })

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
    } finally {
      setIsLoading(false)
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
    try {
      setIsLoading(true)

      // Check localStorage for persisted user and tokens
      const storedUser = localStorage.getItem("user")
      const token = localStorage.getItem("token")
      
      if (storedUser && token) {
        try {
          const userData = JSON.parse(storedUser)
          setUser(userData)
          // For JWT tokens, we trust the stored data until an API call fails
          // The apiFetcher will handle token refresh automatically when needed
        } catch (error) {
          // Clear invalid stored data
          localStorage.removeItem("user")
          localStorage.removeItem("token")
          localStorage.removeItem("refresh_token")
          setUser(null)
        }
      } else {
        // No token or user data, user is not authenticated
        setUser(null)
      }
    } catch (error) {
      // Keep existing user state if there's an error
    } finally {
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
