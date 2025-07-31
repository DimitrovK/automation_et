interface LoadingSpinnerProps {
  message?: string
  subtitle?: string
  size?: "sm" | "md" | "lg"
  overlay?: boolean
}

export function LoadingSpinner({ 
  message = "Loading", 
  subtitle = "Please wait", 
  size = "md",
  overlay = false 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-12 h-12",
    md: "w-16 h-16", 
    lg: "w-20 h-20"
  }
  
  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl"
  }

  const content = (
    <div className="flex flex-col items-center space-y-6">
      {/* Multi-ring spinner */}
      <div className="relative animate-float">
        <div className={`${sizeClasses[size]} border-4 border-primary/20 border-t-primary rounded-full animate-spin`}></div>
        <div className={`absolute inset-2 ${size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-16 h-16'} border-4 border-transparent border-r-primary/40 rounded-full animate-spin animate-reverse`}></div>
        <div className={`absolute inset-4 ${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-8 h-8' : 'w-12 h-12'} border-2 border-transparent border-b-primary/60 rounded-full animate-spin`} style={{ animationDelay: '-0.3s' }}></div>
      </div>
      
      {/* Loading text with animated dots */}
      <div className="text-center space-y-2">
        <h3 className={`${textSizeClasses[size]} font-semibold text-foreground`}>
          {message}
          <span className="inline-block animate-pulse">.</span>
          <span className="inline-block animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
          <span className="inline-block animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
        </h3>
        <p className="text-muted-foreground text-sm">
          {subtitle}
        </p>
      </div>
      
      {/* Progress bar */}
      <div className={`${size === 'sm' ? 'w-48' : size === 'md' ? 'w-64' : 'w-80'} h-1.5 bg-muted rounded-full overflow-hidden`}>
        <div className="h-full bg-gradient-to-r from-primary to-primary/60 rounded-full animate-pulse"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-1/3 animate-shimmer rounded-full"></div>
      </div>
      
      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary/20 rounded-full animate-bounce opacity-60" style={{ animationDelay: '0s', animationDuration: '2s' }}></div>
        <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-primary/30 rounded-full animate-bounce opacity-40" style={{ animationDelay: '1s', animationDuration: '2.5s' }}></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-primary/25 rounded-full animate-bounce opacity-50" style={{ animationDelay: '2s', animationDuration: '3s' }}></div>
        <div className="absolute bottom-1/4 right-1/3 w-2.5 h-2.5 bg-primary/15 rounded-full animate-bounce opacity-30" style={{ animationDelay: '1.5s', animationDuration: '2.2s' }}></div>
      </div>
    </div>
  )

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-green-50/95 via-blue-50/90 to-green-50/80 dark:from-gray-900/95 dark:via-gray-800/90 dark:to-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="p-8 rounded-xl bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border shadow-2xl">
          {content}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      {content}
    </div>
  )
}
