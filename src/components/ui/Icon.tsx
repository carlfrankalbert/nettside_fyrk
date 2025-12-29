/**
 * Centralized icon system
 * Provides consistent icons across the application
 */

interface IconProps {
  className?: string;
  'aria-hidden'?: boolean;
}

/**
 * SVG path data for all icons
 */
const ICON_PATHS = {
  check: {
    viewBox: '0 0 20 20',
    fill: 'currentColor',
    d: 'M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z',
  },
  warning: {
    viewBox: '0 0 20 20',
    fill: 'currentColor',
    d: 'M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z',
  },
  lightbulb: {
    viewBox: '0 0 20 20',
    fill: 'currentColor',
    d: 'M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z',
  },
  error: {
    viewBox: '0 0 20 20',
    fill: 'currentColor',
    d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z',
  },
  chevronRight: {
    viewBox: '0 0 20 20',
    fill: 'currentColor',
    d: 'M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z',
  },
  hamburger: {
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 2,
    d: 'M4 6h16M4 12h16M4 18h16',
  },
  close: {
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 2,
    d: 'M6 18L18 6M6 6l12 12',
  },
} as const;

/**
 * Icon paths for stroke-based icons (like copy)
 */
const STROKE_ICON_PATHS = {
  copy: {
    viewBox: '0 0 24 24',
    d: 'M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z',
  },
  thumbsUp: {
    viewBox: '0 0 24 24',
    d: 'M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14zM7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3',
  },
  thumbsDown: {
    viewBox: '0 0 24 24',
    d: 'M10 15V19a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10zM17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17',
  },
} as const;

export type IconName = keyof typeof ICON_PATHS;
export type StrokeIconName = keyof typeof STROKE_ICON_PATHS;

/**
 * Generic Icon component for filled icons
 */
export function Icon({ name, className }: IconProps & { name: IconName }) {
  const icon = ICON_PATHS[name];
  const isStrokeIcon = 'stroke' in icon;

  return (
    <svg
      className={className}
      viewBox={icon.viewBox}
      fill={isStrokeIcon ? 'none' : icon.fill}
      stroke={isStrokeIcon ? icon.stroke : undefined}
      strokeWidth={isStrokeIcon ? icon.strokeWidth : undefined}
      aria-hidden="true"
    >
      <path
        fillRule={isStrokeIcon ? undefined : 'evenodd'}
        clipRule={isStrokeIcon ? undefined : 'evenodd'}
        strokeLinecap={isStrokeIcon ? 'round' : undefined}
        strokeLinejoin={isStrokeIcon ? 'round' : undefined}
        d={icon.d}
      />
    </svg>
  );
}

/**
 * Stroke-based Icon component
 */
export function StrokeIcon({ name, className }: IconProps & { name: StrokeIconName }) {
  const icon = STROKE_ICON_PATHS[name];

  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox={icon.viewBox}
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d={icon.d}
      />
    </svg>
  );
}

// Named exports for commonly used icons
export function CheckIcon({ className }: IconProps) {
  return <Icon name="check" className={className} />;
}

export function WarningIcon({ className }: IconProps) {
  return <Icon name="warning" className={className} />;
}

export function LightbulbIcon({ className }: IconProps) {
  return <Icon name="lightbulb" className={className} />;
}

export function ErrorIcon({ className }: IconProps) {
  return <Icon name="error" className={className} />;
}

export function CopyIcon({ className }: IconProps) {
  return <StrokeIcon name="copy" className={className} />;
}

export function ChevronRightIcon({ className }: IconProps) {
  return <Icon name="chevronRight" className={className} />;
}

export function ThumbsUpIcon({ className }: IconProps) {
  return <StrokeIcon name="thumbsUp" className={className} />;
}

export function ThumbsDownIcon({ className }: IconProps) {
  return <StrokeIcon name="thumbsDown" className={className} />;
}

/**
 * Spinner icon for loading states
 */
export function SpinnerIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
