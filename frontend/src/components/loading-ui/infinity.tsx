import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InfinityLoopProps extends React.SVGProps<SVGSVGElement> {
  /**
   * Animation cycle duration (e.g. "2s", "1.6s", "1.8s")
   * @default "2s"
   */
  duration?: string;
  /**
   * SVG path stroke width (scaled to viewBox 187.3 x 93.7)
   * @default 6
   */
  strokeWidth?: number | string;
  /**
   * Track opacity for background static loop path (0 to 1)
   * @default 0.15
   */
  trackOpacity?: number;
  /**
   * Animation style variant:
   * - 'loop': Authentic Loading UI draw-undraw fluid pulse (default)
   * - 'dash': Continuous orbiting dash comet
   * @default "loop"
   */
  variant?: 'loop' | 'dash';
}

/**
 * InfinityLoop component from Loading UI (@loading-ui/infinity).
 * SVG-based continuous loading animation tracking an infinity figure-eight path.
 */
export function InfinityLoop({
  className,
  duration = '2s',
  strokeWidth = 6,
  trackOpacity = 0.15,
  variant = 'loop',
  style,
  ...props
}: InfinityLoopProps) {
  const isDash = variant === 'dash';

  return (
    <svg
      viewBox="0 0 187.3 93.7"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('inline-block text-current shrink-0', className)}
      style={{
        ...style,
        ['--duration' as string]: duration,
      }}
      role="status"
      aria-label="Loading..."
      {...props}
    >
      {/* Background static guide track */}
      {trackOpacity > 0 && (
        <path
          d="M93.9,46.4c9.3,9.5,13.8,17.9,23.5,17.9s17.5-7.8,17.5-17.5s-7.8-17.6-17.5-17.5c-9.7,0.1-13.3,7.2-22.1,17.1c-8.9,8.8-15.7,17.9-25.4,17.9s-17.5-7.8-17.5-17.5s7.8-17.5,17.5-17.5S86.2,38.6,93.9,46.4z"
          stroke="currentColor"
          strokeOpacity={trackOpacity}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {/* Animated dash loop path */}
      <path
        pathLength={280}
        strokeDasharray={isDash ? '70 210' : '280'}
        strokeDashoffset={280}
        className={isDash ? 'animate-infinity-dash' : 'animate-infinity-loop'}
        d="M93.9,46.4c9.3,9.5,13.8,17.9,23.5,17.9s17.5-7.8,17.5-17.5s-7.8-17.6-17.5-17.5c-9.7,0.1-13.3,7.2-22.1,17.1c-8.9,8.8-15.7,17.9-25.4,17.9s-17.5-7.8-17.5-17.5s7.8-17.5,17.5-17.5S86.2,38.6,93.9,46.4z"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export const Infinity = InfinityLoop;
export default InfinityLoop;
