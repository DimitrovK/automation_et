type LoadingSpinnerProps = {
  message?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg';
  overlay?: boolean;
};

export function LoadingSpinner({
  message = 'Loading',
  subtitle = 'Please wait',
  size = 'md',
  overlay = false,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  };

  const textSizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const content = (
    <div className="flex flex-col items-center space-y-6">
      {/* Football spinner - rotating ball with pentagon pattern */}
      <div className="relative">
        <div className={`${sizeClasses[size]} relative animate-spin`} style={{ animationDuration: '2s' }}>
          {/* Outer circle - the ball */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-lg dark:from-emerald-600 dark:to-emerald-700"></div>

          {/* Pentagon patterns to mimic soccer ball */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            {/* Center pentagon */}
            <div className="absolute left-1/2 top-1/2 size-1/3 -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-sm bg-gray-800 opacity-80 dark:bg-gray-900"></div>

            {/* Top left pattern */}
            <div className="absolute left-1/4 top-1/4 size-1/4 -rotate-45 rounded-sm bg-gray-800 opacity-70 dark:bg-gray-900"></div>

            {/* Top right pattern */}
            <div className="absolute right-1/4 top-1/4 size-1/4 rotate-45 rounded-sm bg-gray-800 opacity-70 dark:bg-gray-900"></div>

            {/* Bottom pattern */}
            <div className="absolute bottom-1/4 left-1/2 size-1/4 -translate-x-1/2 rounded-sm bg-gray-800 opacity-70 dark:bg-gray-900"></div>
          </div>
        </div>
      </div>

      {/* Loading text with animated dots */}
      <div className="space-y-2 text-center">
        <h3 className={`${textSizeClasses[size]} font-semibold text-foreground`}>
          {message}
          <span className="inline-block animate-pulse">.</span>
          <span className="inline-block animate-pulse" style={{ animationDelay: '0.2s' }}>.</span>
          <span className="inline-block animate-pulse" style={{ animationDelay: '0.4s' }}>.</span>
        </h3>
        <p className="text-sm text-muted-foreground">
          {subtitle}
        </p>
      </div>

      {/* Progress bar - clean without shimmer */}
      <div className={`${size === 'sm' ? 'w-48' : size === 'md' ? 'w-64' : 'w-80'} relative h-1.5 overflow-hidden rounded-full bg-muted`}>
        <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-emerald-500 to-green-600"></div>
      </div>
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-green-50/95 via-blue-50/90 to-green-50/80 backdrop-blur-sm dark:from-gray-900/95 dark:via-gray-800/90 dark:to-gray-900/80">
        <div className="rounded-xl border bg-white/90 p-8 shadow-2xl backdrop-blur-sm dark:bg-gray-800/90">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {content}
    </div>
  );
}
