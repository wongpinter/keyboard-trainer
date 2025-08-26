import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Eye, Settings } from 'lucide-react';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { useAccessibility } from '@/hooks/useAccessibility';
import { cn } from '@/lib/utils';
import { KeyboardLayout } from '@/types/keyboard';

interface FocusModeProps {
  text: string;
  layout: KeyboardLayout;
  onComplete?: () => void;
  onKeyPress?: (expectedChar: string, isCorrect: boolean) => void;
  className?: string;
}

export const FocusMode: React.FC<FocusModeProps> = ({
  text,
  layout,
  onComplete,
  onKeyPress,
  className
}) => {
  const { isFocusMode, settings, exitFocusMode } = useFocusMode();
  const { preferences } = useAccessibility();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [errors, setErrors] = useState<boolean[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert QWERTY input to target layout (same as TypingArea)
  const convertKey = (qwertyKey: string): string => {
    const mapping = layout.keys.find(k => k.qwerty.toLowerCase() === qwertyKey.toLowerCase());
    return mapping?.target || qwertyKey;
  };

  // Focus input when focus mode is activated
  useEffect(() => {
    if (isFocusMode && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isFocusMode]);

  // Handle keyboard input
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isFocusMode) return;

    // Prevent default behavior for most keys
    if (e.key !== 'Tab' && e.key !== 'F5' && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
    }

    // Handle escape key
    if (e.key === 'Escape') {
      exitFocusMode();
      return;
    }

    // Handle backspace
    if (e.key === 'Backspace') {
      if (currentIndex > 0) {
        setCurrentIndex(prev => prev - 1);
        setTypedText(prev => prev.slice(0, -1));
        setErrors(prev => prev.slice(0, -1));
      }
      return;
    }

    // Only process printable characters
    if (e.key.length === 1) {
      const expectedChar = text[currentIndex];
      const typedChar = convertKey(e.key); // Convert QWERTY to target layout
      const isCorrect = typedChar === expectedChar;

      // Start timing on first keystroke
      if (startTime === null) {
        setStartTime(Date.now());
      }

      setTypedText(prev => prev + typedChar);
      setErrors(prev => [...prev, !isCorrect]);
      setCurrentIndex(prev => prev + 1);

      onKeyPress?.(expectedChar, isCorrect);

      // Check completion
      if (currentIndex + 1 >= text.length) {
        onComplete?.();
        
        // Announce completion to screen readers
        if (preferences.screenReader) {
          const accuracy = Math.round((errors.filter(e => !e).length / errors.length) * 100);
          const timeElapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
          const wpm = Math.round((text.length / 5) / (timeElapsed / 60));
          
          setTimeout(() => {
            const announcement = document.createElement('div');
            announcement.setAttribute('aria-live', 'assertive');
            announcement.className = 'sr-only';
            announcement.textContent = `Exercise completed! ${accuracy}% accuracy, ${wpm} words per minute. Press Escape to exit focus mode.`;
            document.body.appendChild(announcement);
            
            setTimeout(() => {
              document.body.removeChild(announcement);
            }, 3000);
          }, 500);
        }
      }
    }
  }, [isFocusMode, currentIndex, text, startTime, errors, onKeyPress, onComplete, exitFocusMode, preferences.screenReader]);

  // Render character with appropriate styling
  const renderCharacter = (char: string, index: number) => {
    let className = 'focus-char';

    if (index < currentIndex) {
      // Already typed
      className = cn(className, errors[index] ? 'focus-char-incorrect' : 'focus-char-correct');
    } else if (index === currentIndex) {
      // Current character - this is what user needs to type next
      className = cn(className, 'focus-char-current focus-cursor');
    } else {
      // Future characters
      className = cn(className, 'focus-char-pending');
    }

    const displayChar = char === ' ' ? '\u00A0' : char;

    return (
      <span key={index} className={className}>
        {displayChar}
      </span>
    );
  };

  // Calculate progress
  const progress = text.length > 0 ? (currentIndex / text.length) * 100 : 0;
  const accuracy = errors.length > 0 ? Math.round((errors.filter(e => !e).length / errors.length) * 100) : 100;
  const timeElapsed = startTime ? (Date.now() - startTime) / 1000 : 0;
  const wpm = timeElapsed > 0 ? Math.round((typedText.length / 5) / (timeElapsed / 60)) : 0;

  if (!isFocusMode) {
    return null;
  }

  return (
    <div className={cn('focus-mode-container focus-zen', className)}>
      {/* Exit Button */}
      <button
        className="focus-exit-button focus-smooth"
        onClick={exitFocusMode}
        aria-label="Exit focus mode (or press Escape)"
        title="Exit focus mode (or press Escape)"
      >
        <X />
      </button>

      {/* Hidden input for capturing keystrokes */}
      <input
        ref={inputRef}
        className="sr-only"
        onKeyDown={handleKeyDown}
        autoFocus
        aria-label="Focus mode typing input"
      />

      {/* Main typing area */}
      <div className="focus-typing-area">
        <div 
          className="focus-text"
          onClick={() => inputRef.current?.focus()}
          role="textbox"
          aria-label="Focus mode text display"
          aria-describedby="focus-instructions"
        >
          {text.split('').map((char, index) => renderCharacter(char, index))}
        </div>
      </div>

      {/* Progress indicator (if not hidden) */}
      {!settings.hideProgress && (
        <div className="focus-progress">
          <span>{Math.round(progress)}%</span>
          <div className="focus-progress-bar">
            <div 
              className="focus-progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span>{currentIndex}/{text.length}</span>
          {startTime && (
            <>
              <span>•</span>
              <span>{wpm} WPM</span>
              <span>•</span>
              <span>{accuracy}%</span>
            </>
          )}
        </div>
      )}

      {/* Screen reader instructions */}
      <div id="focus-instructions" className="sr-only">
        Focus mode is active. Type the text shown on screen. 
        Press Escape to exit focus mode. 
        Use Backspace to correct mistakes.
        Current progress: {Math.round(progress)}% complete.
      </div>

      {/* Live region for screen reader updates */}
      <div 
        aria-live="polite" 
        aria-atomic="false"
        className="sr-only"
      >
        {currentIndex > 0 && (
          <span>
            Character {currentIndex} of {text.length}. 
            {errors[currentIndex - 1] ? 'Incorrect' : 'Correct'}.
          </span>
        )}
      </div>
    </div>
  );
};

export default FocusMode;
