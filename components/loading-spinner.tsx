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
      {/* Football spinner - rotating ball with pentagon pattern */}
      <div className="relative">
        <div className={`${sizeClasses[size]} relative animate-spin`} style={{ animationDuration: '2s' }}>
          {/* Outer circle - the ball */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-700 shadow-lg"></div>
          
          {/* Pentagon patterns to mimic soccer ball */}
          <div className="absolute inset-0 rounded-full overflow-hidden">
            {/* Center pentagon */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/3 h-1/3 bg-gray-800 dark:bg-gray-900 rounded-sm rotate-12 opacity-80"></div>
            
            {/* Top left pattern */}
            <div className="absolute top-1/4 left-1/4 w-1/4 h-1/4 bg-gray-800 dark:bg-gray-900 rounded-sm -rotate-45 opacity-70"></div>
            
            {/* Top right pattern */}
            <div className="absolute top-1/4 right-1/4 w-1/4 h-1/4 bg-gray-800 dark:bg-gray-900 rounded-sm rotate-45 opacity-70"></div>
            
            {/* Bottom pattern */}
            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-1/4 h-1/4 bg-gray-800 dark:bg-gray-900 rounded-sm opacity-70"></div>
          </div>
        </div>
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
      
      {/* Progress bar - clean without shimmer */}
      <div className={`${size === 'sm' ? 'w-48' : size === 'md' ? 'w-64' : 'w-80'} h-1.5 bg-muted rounded-full overflow-hidden relative`}>
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-green-600 rounded-full animate-pulse"></div>
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
