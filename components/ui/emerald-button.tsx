"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Loader2, LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ApiButtonProps {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  loadingText?: string
  children: React.ReactNode
  icon?: LucideIcon
  className?: string
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ApiButton({
  onClick,
  disabled = false,
  loading = false,
  loadingText = "Loading...",
  children,
  icon: Icon,
  className,
  variant = "default",
  size = "default",
  ...props
}: ApiButtonProps) {
  const baseClasses = variant === "default" 
    ? "bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white border-emerald-500 hover:border-emerald-600 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
    : ""

  return (
    <Button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(baseClasses, className)}
      variant={variant}
      size={size}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          {loadingText}
        </>
      ) : (
        <>
          {Icon && <Icon className="h-4 w-4 mr-2" />}
          {children}
        </>
      )}
    </Button>
  )
}
