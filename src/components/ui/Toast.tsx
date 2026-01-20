import { cn } from '../../utils/classes';

interface ToastProps {
  message: string;
  isVisible: boolean;
}

/**
 * Toast notification component for brief feedback messages.
 * Appears fixed at bottom on mobile, top-right on desktop.
 */
export function Toast({ message, isVisible }: ToastProps) {
  return (
    <div
      className={cn(
        'fixed z-50 px-4 py-2 bg-neutral-800 text-white text-sm rounded-lg shadow-lg transition-all duration-300',
        'md:top-4 md:right-4 bottom-20 md:bottom-auto left-1/2 md:left-auto -translate-x-1/2 md:translate-x-0',
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      )}
      role="status"
      aria-live="assertive"
    >
      {message}
    </div>
  );
}
