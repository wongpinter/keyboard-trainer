import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { useAnimations, fadeIn, slideIn, scaleIn, pulse } from '@/hooks/useAnimations';

// Animated container that fades in children
interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  animation?: 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale';
  duration?: number;
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({
  children,
  className,
  delay = 0,
  animation = 'fade',
  duration = 300,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { createAnimationConfig, isReducedMotion } = useAnimations();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const config = createAnimationConfig({ duration, easing: 'ease-out', delay });

    const timer = setTimeout(() => {
      if (isReducedMotion) {
        setIsVisible(true);
        return;
      }

      setIsVisible(true);

      switch (animation) {
        case 'fade':
          fadeIn(element, config.duration);
          break;
        case 'slide-up':
          slideIn(element, 'up', config.duration);
          break;
        case 'slide-down':
          slideIn(element, 'down', config.duration);
          break;
        case 'slide-left':
          slideIn(element, 'left', config.duration);
          break;
        case 'slide-right':
          slideIn(element, 'right', config.duration);
          break;
        case 'scale':
          scaleIn(element, config.duration);
          break;
      }
    }, config.delay);

    return () => clearTimeout(timer);
  }, [animation, duration, delay, createAnimationConfig, isReducedMotion]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'transition-opacity',
        !isVisible && !isReducedMotion && 'opacity-0',
        className
      )}
    >
      {children}
    </div>
  );
};

// Animated progress bar
interface AnimatedProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedProgressBar: React.FC<AnimatedProgressBarProps> = ({
  value,
  max = 100,
  className,
  showLabel = false,
  color = 'primary',
  size = 'md',
}) => {
  const progressRef = useRef<HTMLDivElement>(null);
  const { createAnimationConfig } = useAnimations();
  const [animatedValue, setAnimatedValue] = useState(0);

  const percentage = Math.min((value / max) * 100, 100);

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colorClasses = {
    primary: 'bg-primary',
    success: 'bg-green-500',
    warning: 'bg-yellow-500',
    destructive: 'bg-red-500',
  };

  useEffect(() => {
    const config = createAnimationConfig({ duration: 800, easing: 'ease-out' });
    
    const startTime = Date.now();
    const startValue = animatedValue;
    const difference = percentage - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / config.duration, 1);
      
      // Ease-out animation
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const newValue = startValue + (difference * easedProgress);
      
      setAnimatedValue(newValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [percentage, animatedValue, createAnimationConfig]);

  return (
    <div className={cn('relative', className)}>
      <div className={cn(
        'w-full bg-muted rounded-full overflow-hidden',
        sizeClasses[size]
      )}>
        <div
          ref={progressRef}
          className={cn(
            'h-full transition-all duration-300 ease-out rounded-full',
            colorClasses[color]
          )}
          style={{ width: `${animatedValue}%` }}
        />
      </div>
      {showLabel && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-medium text-foreground">
            {Math.round(animatedValue)}%
          </span>
        </div>
      )}
    </div>
  );
};

// Animated counter
interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 1000,
  className,
  prefix = '',
  suffix = '',
  decimals = 0,
}) => {
  const [displayValue, setDisplayValue] = useState(0);
  const { createAnimationConfig } = useAnimations();

  useEffect(() => {
    const config = createAnimationConfig({ duration, easing: 'ease-out' });
    
    const startTime = Date.now();
    const startValue = displayValue;
    const difference = value - startValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / config.duration, 1);
      
      // Ease-out animation
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const newValue = startValue + (difference * easedProgress);
      
      setDisplayValue(newValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(value);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, displayValue, createAnimationConfig]);

  return (
    <span className={className}>
      {prefix}{displayValue.toFixed(decimals)}{suffix}
    </span>
  );
};

// Animated button with micro-interactions
interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  success?: boolean;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  children,
  className,
  variant = 'default',
  size = 'default',
  loading = false,
  success = false,
  onClick,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { animateElement, createAnimationConfig } = useAnimations();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const button = buttonRef.current;
    if (button && !loading) {
      // Pulse animation on click
      const config = createAnimationConfig({ duration: 200, easing: 'ease-out' });
      pulse(button, config.duration);
    }
    
    onClick?.(e);
  };

  const baseClasses = "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";
  
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 active:scale-95",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground active:scale-95",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 active:scale-95",
    ghost: "hover:bg-accent hover:text-accent-foreground active:scale-95",
    link: "text-primary underline-offset-4 hover:underline",
  };

  const sizeClasses = {
    default: "h-10 px-4 py-2",
    sm: "h-9 rounded-md px-3",
    lg: "h-11 rounded-md px-8",
    icon: "h-10 w-10",
  };

  return (
    <button
      ref={buttonRef}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        loading && "cursor-not-allowed",
        success && "bg-green-500 text-white",
        className
      )}
      onClick={handleClick}
      disabled={loading}
      {...props}
    >
      {loading && (
        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {success && !loading && (
        <div className="mr-2 h-4 w-4 text-white">
          <svg viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
      {children}
    </button>
  );
};

// Floating action button with animations
interface FloatingActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon,
  label,
  position = 'bottom-right',
  className,
}) => {
  const fabRef = useRef<HTMLButtonElement>(null);
  const { animateElement, createAnimationConfig } = useAnimations();

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6',
  };

  const handleClick = () => {
    const button = fabRef.current;
    if (button) {
      const config = createAnimationConfig({ duration: 150, easing: 'ease-out' });
      pulse(button, config.duration);
    }
    onClick();
  };

  return (
    <button
      ref={fabRef}
      onClick={handleClick}
      className={cn(
        'fixed z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:scale-110 hover:shadow-xl active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        positionClasses[position],
        className
      )}
      aria-label={label}
    >
      <div className="flex items-center justify-center">
        {icon}
      </div>
    </button>
  );
};
