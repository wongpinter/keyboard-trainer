import { useState, useEffect, useRef, useCallback } from 'react';
import { KeyboardLayout, TypingStats } from '@/types/keyboard';
import { cn } from '@/lib/utils';
import { useAccessibility, announceToScreenReader } from '@/hooks/useAccessibility';
import { useAnimations, scaleIn } from '@/hooks/useAnimations';
import { useStatistics } from '@/hooks/useStatistics';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { useEmulation } from '@/contexts/EmulationContext';
import { remapKey, createEmulationConfig } from '@/utils/keyboardEmulation';
import FocusMode from '@/components/focus/FocusMode';
// import { validateTypingText } from '@/utils/validation';
// import { handleValidationError } from '@/utils/errorHandler';

interface TypingAreaProps {
  text: string;
  layout: KeyboardLayout;
  onStatsUpdate: (stats: TypingStats) => void;
  onKeyPress: (key: string, isCorrect: boolean) => void;
  onComplete: () => void;
  layoutId?: string; // For emulation purposes
}

const TypingArea = ({
  text,
  layout,
  onStatsUpdate,
  onKeyPress,
  onComplete,
  layoutId = 'colemak'
}: TypingAreaProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [errors, setErrors] = useState<boolean[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMountedRef = useRef(true);
  const { preferences } = useAccessibility();
  const { createAnimationConfig } = useAnimations();
  const {
    startSession,
    recordKeystroke,
    recordMistake,
    endSession,
    isSessionActive
  } = useStatistics();
  const { isFocusMode } = useFocusMode();
  const { isLayoutEmulationEnabled, getPhysicalKeyboardType } = useEmulation();
  const isEmulationEnabled = isLayoutEmulationEnabled(layoutId);
  const physicalKeyboardType = getPhysicalKeyboardType();

  // Create emulation configuration
  const emulationConfig = createEmulationConfig(
    physicalKeyboardType,
    layoutId,
    isEmulationEnabled
  );
  const completionRef = useRef<HTMLDivElement>(null);
  const lastKeystrokeTime = useRef<number>(Date.now());

  // Validate practice text on mount and when text changes
  // useEffect(() => {
  //   if (text) {
  //     const validation = validateTypingText(text);
  //     if (!validation.isValid) {
  //       handleValidationError(new Error(validation.errors[0]), 'practiceText');
  //     }
  //   }
  // }, [text]);

  // Convert QWERTY input to target layout
  const convertKey = (qwertyKey: string): string => {
    const mapping = layout.keys.find(k => k.qwerty.toLowerCase() === qwertyKey.toLowerCase());
    return mapping?.target || qwertyKey;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        reset();
        return;
      }

      if (currentIndex >= text.length) return;

      // Handle backspace
      if (e.key === 'Backspace') {
        if (currentIndex > 0) {
          setCurrentIndex(prev => prev - 1);
          setTypedText(prev => prev.slice(0, -1));
          setErrors(prev => prev.slice(0, -1));
        }
        return;
      }

      // Start timing on first keystroke
      if (startTime === null) {
        setStartTime(Date.now());
        // Start statistics session if not already active
        if (!isSessionActive) {
          startSession(layout.name);
        }
      }

      const expectedChar = text[currentIndex];

      // Apply keyboard emulation first
      const emulatedKey = remapKey(e.key, emulationConfig);
      const typedChar = convertKey(emulatedKey);

      // Only process printable characters
      if (e.key.length === 1) {
        const isCorrect = typedChar === expectedChar;
        const currentTime = Date.now();
        const timeSinceLastKey = currentTime - lastKeystrokeTime.current;

        // Record keystroke for statistics
        const keyMapping = layout.keys.find(k => k.target === expectedChar);
        if (keyMapping) {
          recordKeystroke({
            key: expectedChar,
            isCorrect,
            timeSinceLastKey,
            expectedKey: expectedChar,
            finger: keyMapping.finger
          });

          // Record mistake if incorrect
          if (!isCorrect) {
            recordMistake({
              expectedKey: expectedChar,
              actualKey: typedChar,
              position: currentIndex,
              finger: keyMapping.finger
            });
          }
        }

        lastKeystrokeTime.current = currentTime;

        setTypedText(prev => prev + typedChar);
        setErrors(prev => [...prev, !isCorrect]);
        setCurrentIndex(prev => prev + 1);

        onKeyPress(expectedChar, isCorrect);

        // Update stats
        const newStats = calculateStats(typedText + typedChar, errors.concat(!isCorrect));
        onStatsUpdate(newStats);

        // Check completion
        if (currentIndex + 1 >= text.length) {
          onComplete();

          // End statistics session
          if (isSessionActive) {
            endSession();
          }

          // Animate completion
          if (completionRef.current) {
            const config = createAnimationConfig({ duration: 500, easing: 'ease-out' });
            scaleIn(completionRef.current, config.duration);
          }

          // Announce completion to screen readers
          if (preferences.screenReader) {
            const finalStats = calculateStats(typedText + typedChar, errors.concat(!isCorrect));
            announceToScreenReader(
              `Typing exercise completed! ${finalStats.wpm} words per minute, ${finalStats.accuracy}% accuracy`,
              'assertive'
            );
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      isMountedRef.current = false;
    };
  }, [currentIndex, text, typedText, errors, startTime, layout, onKeyPress, onStatsUpdate, onComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const calculateStats = (typed: string, errorList: boolean[]): TypingStats => {
    const totalChars = typed.length;
    const correctChars = errorList.filter(e => !e).length;
    const incorrectChars = errorList.filter(e => e).length;
    const accuracy = totalChars > 0 ? (correctChars / totalChars) * 100 : 0;
    
    let wpm = 0;
    if (startTime) {
      const timeElapsed = (Date.now() - startTime) / 1000 / 60; // minutes
      wpm = timeElapsed > 0 ? (correctChars / 5) / timeElapsed : 0; // standard WPM calculation
    }

    return {
      wpm: Math.round(wpm),
      accuracy: Math.round(accuracy),
      totalCharacters: totalChars,
      correctCharacters: correctChars,
      incorrectCharacters: incorrectChars,
      startTime,
      endTime: currentIndex >= text.length ? Date.now() : undefined
    };
  };

  const reset = () => {
    setCurrentIndex(0);
    setTypedText('');
    setErrors([]);
    setStartTime(null);
  };

  // Safe focus handler that checks if component is still mounted
  const handleInputBlur = useCallback(() => {
    if (isMountedRef.current && inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const renderCharacter = (char: string, index: number) => {
    let className = "font-typing text-lg transition-all duration-200 ease-out";

    if (index < currentIndex) {
      // Already typed - animate in with scale
      const isError = errors[index];
      if (isEmulationEnabled) {
        // Full visual feedback in emulation mode
        className = cn(
          className,
          isError
            ? "bg-destructive/20 text-destructive animate-shake"
            : "bg-success/20 text-success animate-scale-in",
          "transform"
        );
      } else {
        // Minimal feedback in expert mode
        className = cn(
          className,
          isError
            ? "text-destructive"
            : "text-foreground",
          "opacity-80"
        );
      }
    } else if (index === currentIndex) {
      // Current character - pulse and highlight
      if (isEmulationEnabled) {
        // Full cursor highlighting in emulation mode
        className = cn(
          className,
          "bg-primary/20 animate-typing-cursor border-l-2 border-primary",
          "transform scale-110"
        );
      } else {
        // Subtle cursor in expert mode
        className = cn(
          className,
          "border-l-2 border-primary/60",
          "text-foreground"
        );
      }
    } else {
      // Future characters - subtle fade
      className = cn(
        className,
        isEmulationEnabled
          ? "text-muted-foreground opacity-60"
          : "text-muted-foreground opacity-40"
      );
    }

    return (
      <span
        key={index}
        className={className}
        style={{
          animationDelay: index < currentIndex ? `${index * 50}ms` : '0ms'
        }}
      >
        {char}
      </span>
    );
  };

  return (
    <>
      {/* Focus Mode Overlay */}
      {isFocusMode && (
        <FocusMode
          text={text}
          layout={layout}
          onComplete={onComplete}
          onKeyPress={onKeyPress}
        />
      )}

      {/* Regular Typing Area */}
      <div className="space-y-4">
      <div
        className={cn(
          "p-6 bg-card rounded-lg min-h-[100px] flex items-center cursor-text transition-colors",
          isEmulationEnabled
            ? "border-2 border-dashed border-muted-foreground/20 focus-within:border-primary/50"
            : "border border-muted-foreground/10 focus-within:border-primary/30"
        )}
        onClick={() => inputRef.current?.focus()}
        role="textbox"
        aria-label="Typing practice area"
        aria-describedby="typing-instructions typing-progress"
        tabIndex={0}
        onKeyDown={(e) => {
          // Ensure focus is on the hidden input for proper key handling
          if (e.target !== inputRef.current) {
            inputRef.current?.focus();
          }
        }}
      >
        <div className="w-full leading-relaxed text-lg">
          {text.split('').map((char, index) => renderCharacter(char, index))}
        </div>
      </div>

      {/* Hidden input for focus management */}
      <input
        ref={inputRef}
        className="sr-only"
        autoFocus
        onBlur={handleInputBlur}
        aria-label="Typing input (hidden)"
        aria-describedby="typing-instructions"
      />

      {/* Screen reader instructions */}
      <div id="typing-instructions" className="sr-only">
        Type the text shown above. Correct characters are highlighted in green,
        incorrect characters in red. Your current position is marked with a cursor.
        Press any key to start typing.
      </div>

      <div
        id="typing-progress"
        className="flex justify-between items-center text-sm text-muted-foreground"
        aria-live="polite"
        aria-atomic="true"
      >
        <div>
          {currentIndex}/{text.length} characters
          <span className="sr-only">
            , {Math.round((currentIndex / text.length) * 100)}% complete
          </span>
        </div>
        <div>
          Press ESC to reset
        </div>
      </div>
    </div>
    </>
  );
};

export default TypingArea;