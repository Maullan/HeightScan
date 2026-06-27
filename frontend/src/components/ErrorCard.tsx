interface ErrorCardProps {
  message: string;
  onRetry?: () => void;
}

export default function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <div
      className="flex flex-col items-center gap-4 text-center animate-fade-in"
      role="alert"
      aria-live="assertive"
      id="error-card"
    >
      {/* Error icon */}
      <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-400/50 flex items-center justify-center">
        <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
        </svg>
      </div>

      {/* Message */}
      <div>
        <h3 className="text-lg font-semibold text-red-300 mb-1">Something went wrong</h3>
        <p className="text-sm text-white/50 leading-relaxed max-w-xs">{message}</p>
      </div>

      {/* Retry button */}
      {onRetry && (
        <button
          id="retry-button"
          onClick={onRetry}
          className="btn-secondary text-sm"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
          Try Again
        </button>
      )}
    </div>
  );
}
