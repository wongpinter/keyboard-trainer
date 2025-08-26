import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccessibility } from './useAccessibility';

// Animation configuration interface
interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
  fillMode?: 'forwards' | 'backwards' | 'both' | 'none';
}

// Default animation configurations
export const ANIMATION_CONFIGS = {
  fast: { duration: 150, easing: 'ease-out' },
  normal: { duration: 300, easing: 'ease-in-out' },
  slow: { duration: 500, easing: 'ease-in-out' },
  bounce: { duration: 400, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' },
  elastic: { duration: 600, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)' },
  smooth: { duration: 250, easing: 'cubic-bezier(0.4, 0, 0.2, 1)' },
} as const;

// Animation state interface
interface AnimationState {
  isAnimating: boolean;
  progress: number;
  direction: 'forward' | 'reverse';
}

// Custom hook for managing animations with accessibility support
export const useAnimations = () => {
  const { preferences } = useAccessibility();
  const [animationState, setAnimationState] = useState<AnimationState>({
    isAnimating: false,
    progress: 0,
    direction: 'forward',
  });

  // Get animation duration based on accessibility preferences
  const getAnimationDuration = useCallback((baseDuration: number): number => {
    if (preferences.reducedMotion) {
      return 1; // Minimal duration for reduced motion
    }
    return baseDuration;
  }, [preferences.reducedMotion]);

  // Get animation easing based on accessibility preferences
  const getAnimationEasing = useCallback((baseEasing: string): string => {
    if (preferences.reducedMotion) {
      return 'linear'; // Simple easing for reduced motion
    }
    return baseEasing;
  }, [preferences.reducedMotion]);

  // Create animation configuration with accessibility support
  const createAnimationConfig = useCallback((config: AnimationConfig): AnimationConfig => {
    return {
      ...config,
      duration: getAnimationDuration(config.duration),
      easing: getAnimationEasing(config.easing),
    };
  }, [getAnimationDuration, getAnimationEasing]);

  // Animate element with Web Animations API
  const animateElement = useCallback((
    element: HTMLElement,
    keyframes: Keyframe[],
    config: AnimationConfig
  ): Animation => {
    const finalConfig = createAnimationConfig(config);
    
    const animation = element.animate(keyframes, {
      duration: finalConfig.duration,
      easing: finalConfig.easing,
      delay: finalConfig.delay || 0,
      fill: finalConfig.fillMode || 'forwards',
    });

    setAnimationState(prev => ({ ...prev, isAnimating: true }));

    animation.addEventListener('finish', () => {
      setAnimationState(prev => ({ ...prev, isAnimating: false, progress: 1 }));
    });

    return animation;
  }, [createAnimationConfig]);

  return {
    animationState,
    animateElement,
    createAnimationConfig,
    getAnimationDuration,
    getAnimationEasing,
    isReducedMotion: preferences.reducedMotion,
  };
};

// Hook for typing animations
export const useTypingAnimation = (text: string, speed: number = 50) => {
  const [displayText, setDisplayText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const { isReducedMotion } = useAnimations();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const startTyping = useCallback(() => {
    if (isReducedMotion) {
      // Show all text immediately for reduced motion
      setDisplayText(text);
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setDisplayText('');
    
    let currentIndex = 0;
    
    const typeNextCharacter = () => {
      if (currentIndex < text.length) {
        setDisplayText(text.slice(0, currentIndex + 1));
        currentIndex++;
        timeoutRef.current = setTimeout(typeNextCharacter, speed);
      } else {
        setIsTyping(false);
      }
    };

    typeNextCharacter();
  }, [text, speed, isReducedMotion]);

  const stopTyping = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsTyping(false);
    setDisplayText(text);
  }, [text]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    displayText,
    isTyping,
    startTyping,
    stopTyping,
  };
};

// Hook for progress animations
export const useProgressAnimation = (targetValue: number, duration: number = 1000) => {
  const [currentValue, setCurrentValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const { getAnimationDuration } = useAnimations();
  const animationRef = useRef<number>();

  const animateToTarget = useCallback(() => {
    const finalDuration = getAnimationDuration(duration);
    const startTime = Date.now();
    const startValue = currentValue;
    const difference = targetValue - startValue;

    setIsAnimating(true);

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / finalDuration, 1);
      
      // Easing function (ease-out)
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const newValue = startValue + (difference * easedProgress);
      
      setCurrentValue(newValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        setCurrentValue(targetValue);
        setIsAnimating(false);
      }
    };

    animationRef.current = requestAnimationFrame(animate);
  }, [currentValue, targetValue, duration, getAnimationDuration]);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return {
    currentValue,
    isAnimating,
    animateToTarget,
  };
};

// Hook for stagger animations
export const useStaggerAnimation = (itemCount: number, staggerDelay: number = 100) => {
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const { isReducedMotion, getAnimationDuration } = useAnimations();

  const startStaggerAnimation = useCallback(() => {
    if (isReducedMotion) {
      // Show all items immediately for reduced motion
      setVisibleItems(new Set(Array.from({ length: itemCount }, (_, i) => i)));
      return;
    }

    setVisibleItems(new Set());
    
    for (let i = 0; i < itemCount; i++) {
      setTimeout(() => {
        setVisibleItems(prev => new Set([...prev, i]));
      }, i * getAnimationDuration(staggerDelay));
    }
  }, [itemCount, staggerDelay, isReducedMotion, getAnimationDuration]);

  const resetAnimation = useCallback(() => {
    setVisibleItems(new Set());
  }, []);

  return {
    visibleItems,
    startStaggerAnimation,
    resetAnimation,
    isItemVisible: (index: number) => visibleItems.has(index),
  };
};

// Utility functions for common animations
export const fadeIn = (element: HTMLElement, duration: number = 300) => {
  return element.animate([
    { opacity: 0, transform: 'translateY(10px)' },
    { opacity: 1, transform: 'translateY(0)' }
  ], {
    duration,
    easing: 'ease-out',
    fill: 'forwards'
  });
};

export const slideIn = (element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'up', duration: number = 300) => {
  const transforms = {
    left: 'translateX(-20px)',
    right: 'translateX(20px)',
    up: 'translateY(20px)',
    down: 'translateY(-20px)',
  };

  return element.animate([
    { opacity: 0, transform: transforms[direction] },
    { opacity: 1, transform: 'translate(0)' }
  ], {
    duration,
    easing: 'ease-out',
    fill: 'forwards'
  });
};

export const scaleIn = (element: HTMLElement, duration: number = 300) => {
  return element.animate([
    { opacity: 0, transform: 'scale(0.8)' },
    { opacity: 1, transform: 'scale(1)' }
  ], {
    duration,
    easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
    fill: 'forwards'
  });
};

export const pulse = (element: HTMLElement, duration: number = 600) => {
  return element.animate([
    { transform: 'scale(1)' },
    { transform: 'scale(1.05)' },
    { transform: 'scale(1)' }
  ], {
    duration,
    easing: 'ease-in-out',
    iterations: 1
  });
};
