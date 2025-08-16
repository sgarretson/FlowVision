'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { advancedLogger, LogContext } from '@/lib/advanced-logger';

interface TouchEvent {
  x: number;
  y: number;
  timestamp: number;
  target?: HTMLElement;
}

interface SwipeEvent {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
}

interface MobileTouchHandlerProps {
  children: React.ReactNode;
  onSwipe?: (event: SwipeEvent) => void;
  onTap?: (event: TouchEvent) => void;
  onLongPress?: (event: TouchEvent) => void;
  onDoubleTap?: (event: TouchEvent) => void;
  swipeThreshold?: number; // Minimum distance for swipe
  longPressDelay?: number; // Time for long press
  doubleTapDelay?: number; // Time between taps for double tap
  preventScrollOnSwipe?: boolean;
  className?: string;
  'data-testid'?: string;
}

const MobileTouchHandler: React.FC<MobileTouchHandlerProps> = ({
  children,
  onSwipe,
  onTap,
  onLongPress,
  onDoubleTap,
  swipeThreshold = 50,
  longPressDelay = 500,
  doubleTapDelay = 300,
  preventScrollOnSwipe = false,
  className = '',
  'data-testid': testId,
}) => {
  const [touchStart, setTouchStart] = useState<TouchEvent | null>(null);
  const [touchEnd, setTouchEnd] = useState<TouchEvent | null>(null);
  const [lastTap, setLastTap] = useState<TouchEvent | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const elementRef = useRef<HTMLDivElement>(null);

  // Enhanced touch target size validation
  useEffect(() => {
    if (elementRef.current && process.env.NODE_ENV === 'development') {
      const rect = elementRef.current.getBoundingClientRect();
      const minTouchTarget = 44; // 44px minimum for accessibility

      if (rect.width < minTouchTarget || rect.height < minTouchTarget) {
        advancedLogger.warn(LogContext.PERFORMANCE, 'Touch target too small', {
          width: rect.width,
          height: rect.height,
          minRequired: minTouchTarget,
          element: elementRef.current.tagName,
        });
      }
    }
  }, []);

  const clearLongPressTimer = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      const touchEvent: TouchEvent = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
        target: e.target as HTMLElement,
      };

      setTouchStart(touchEvent);
      setTouchEnd(null);

      // Start long press timer
      if (onLongPress) {
        longPressTimer.current = setTimeout(() => {
          onLongPress(touchEvent);
          advancedLogger.debug(LogContext.PERFORMANCE, 'Long press triggered', {
            x: touchEvent.x,
            y: touchEvent.y,
            delay: longPressDelay,
          });
        }, longPressDelay);
      }

      // Prevent scroll if configured
      if (preventScrollOnSwipe) {
        e.preventDefault();
      }
    },
    [onLongPress, longPressDelay, preventScrollOnSwipe]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      clearLongPressTimer(); // Cancel long press on move

      if (!touchStart) return;

      const touch = e.touches[0];
      const currentTouch: TouchEvent = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
      };

      // Calculate distance moved
      const deltaX = Math.abs(currentTouch.x - touchStart.x);
      const deltaY = Math.abs(currentTouch.y - touchStart.y);

      // Prevent scroll if we're potentially swiping
      if (preventScrollOnSwipe && (deltaX > 10 || deltaY > 10)) {
        e.preventDefault();
      }
    },
    [touchStart, clearLongPressTimer, preventScrollOnSwipe]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      clearLongPressTimer();

      if (!touchStart) return;

      const touch = e.changedTouches[0];
      const touchEndEvent: TouchEvent = {
        x: touch.clientX,
        y: touch.clientY,
        timestamp: Date.now(),
        target: e.target as HTMLElement,
      };

      setTouchEnd(touchEndEvent);

      const deltaX = touchEndEvent.x - touchStart.x;
      const deltaY = touchEndEvent.y - touchStart.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const duration = touchEndEvent.timestamp - touchStart.timestamp;
      const velocity = distance / duration;

      // Handle swipe
      if (distance >= swipeThreshold && onSwipe) {
        const absDeltaX = Math.abs(deltaX);
        const absDeltaY = Math.abs(deltaY);

        let direction: SwipeEvent['direction'];
        if (absDeltaX > absDeltaY) {
          direction = deltaX > 0 ? 'right' : 'left';
        } else {
          direction = deltaY > 0 ? 'down' : 'up';
        }

        const swipeEvent: SwipeEvent = {
          direction,
          distance,
          velocity,
          startPosition: { x: touchStart.x, y: touchStart.y },
          endPosition: { x: touchEndEvent.x, y: touchEndEvent.y },
        };

        onSwipe(swipeEvent);

        advancedLogger.debug(LogContext.PERFORMANCE, 'Swipe gesture detected', {
          direction,
          distance: Math.round(distance),
          velocity: Math.round(velocity * 1000), // Convert to px/s
          duration,
        });

        return; // Don't process as tap if it's a swipe
      }

      // Handle tap (if no significant movement)
      if (distance < 10) {
        // Check for double tap
        if (
          onDoubleTap &&
          lastTap &&
          touchEndEvent.timestamp - lastTap.timestamp < doubleTapDelay
        ) {
          onDoubleTap(touchEndEvent);
          setLastTap(null); // Clear to prevent triple tap

          advancedLogger.debug(LogContext.PERFORMANCE, 'Double tap detected', {
            x: touchEndEvent.x,
            y: touchEndEvent.y,
            timeBetweenTaps: touchEndEvent.timestamp - lastTap.timestamp,
          });
        } else {
          // Single tap
          if (onTap) {
            onTap(touchEndEvent);
          }
          setLastTap(touchEndEvent);

          advancedLogger.debug(LogContext.PERFORMANCE, 'Tap detected', {
            x: touchEndEvent.x,
            y: touchEndEvent.y,
            duration,
          });
        }
      }
    },
    [
      touchStart,
      onSwipe,
      onTap,
      onDoubleTap,
      lastTap,
      swipeThreshold,
      doubleTapDelay,
      clearLongPressTimer,
    ]
  );

  // Enhanced touch feedback
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStartWithFeedback = useCallback(
    (e: React.TouchEvent) => {
      setIsPressed(true);
      handleTouchStart(e);
    },
    [handleTouchStart]
  );

  const handleTouchEndWithFeedback = useCallback(
    (e: React.TouchEvent) => {
      setIsPressed(false);
      handleTouchEnd(e);
    },
    [handleTouchEnd]
  );

  const handleTouchCancel = useCallback(() => {
    setIsPressed(false);
    clearLongPressTimer();
    setTouchStart(null);
    setTouchEnd(null);
  }, [clearLongPressTimer]);

  return (
    <div
      ref={elementRef}
      className={`touch-manipulation select-none ${isPressed ? 'touch-pressed' : ''} ${className}`}
      onTouchStart={handleTouchStartWithFeedback}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEndWithFeedback}
      onTouchCancel={handleTouchCancel}
      data-testid={testId}
      style={{
        // Ensure proper touch target size
        minWidth: '44px',
        minHeight: '44px',
        // Improve touch responsiveness
        touchAction: preventScrollOnSwipe ? 'none' : 'manipulation',
        // Add visual feedback for pressed state
        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
        transition: 'transform 0.1s ease-out',
      }}
    >
      {children}
    </div>
  );
};

// Hook for touch gesture detection
export const useTouchGestures = (options: {
  onSwipe?: (event: SwipeEvent) => void;
  onTap?: (event: TouchEvent) => void;
  onLongPress?: (event: TouchEvent) => void;
  onDoubleTap?: (event: TouchEvent) => void;
}) => {
  const [gestureState, setGestureState] = useState<{
    isTracking: boolean;
    lastGesture: string | null;
  }>({
    isTracking: false,
    lastGesture: null,
  });

  const handleGesture = useCallback(
    (gestureType: string, event?: any) => {
      setGestureState({
        isTracking: false,
        lastGesture: gestureType,
      });

      switch (gestureType) {
        case 'swipe':
          options.onSwipe?.(event);
          break;
        case 'tap':
          options.onTap?.(event);
          break;
        case 'longPress':
          options.onLongPress?.(event);
          break;
        case 'doubleTap':
          options.onDoubleTap?.(event);
          break;
      }
    },
    [options]
  );

  return {
    gestureState,
    handleGesture,
  };
};

// Mobile-optimized button component
export const MobileButton: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}> = ({
  children,
  onClick,
  onLongPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
}) => {
  const baseClasses =
    'font-medium rounded-lg transition-all duration-200 touch-manipulation focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 active:bg-blue-800',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500 active:bg-gray-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 active:bg-red-800',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[36px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-4 text-lg min-h-[52px]',
  };

  const disabledClasses = 'opacity-50 cursor-not-allowed pointer-events-none';

  return (
    <MobileTouchHandler
      onTap={onClick ? () => onClick() : undefined}
      onLongPress={onLongPress ? () => onLongPress() : undefined}
      className={`
        ${baseClasses}
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${disabled ? disabledClasses : ''}
        ${className}
      `}
    >
      <div className="flex items-center justify-center">{children}</div>
    </MobileTouchHandler>
  );
};

export default MobileTouchHandler;
