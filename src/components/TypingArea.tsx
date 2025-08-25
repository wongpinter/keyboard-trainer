import { useState, useEffect, useRef } from 'react';
import { KeyboardLayout, TypingStats } from '@/types/keyboard';
import { cn } from '@/lib/utils';

interface TypingAreaProps {
  text: string;
  layout: KeyboardLayout;
  onStatsUpdate: (stats: TypingStats) => void;
  onKeyPress: (key: string, isCorrect: boolean) => void;
  onComplete: () => void;
}

const TypingArea = ({ 
  text, 
  layout, 
  onStatsUpdate, 
  onKeyPress, 
  onComplete 
}: TypingAreaProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [errors, setErrors] = useState<boolean[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      }

      const expectedChar = text[currentIndex];
      const typedChar = convertKey(e.key);

      // Only process printable characters
      if (e.key.length === 1) {
        const isCorrect = typedChar === expectedChar;
        
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
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, text, typedText, errors, startTime, layout, onKeyPress, onStatsUpdate, onComplete]);

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

  const renderCharacter = (char: string, index: number) => {
    let className = "font-typing text-lg";
    
    if (index < currentIndex) {
      // Already typed
      className = cn(className, errors[index] ? "bg-destructive/20 text-destructive" : "bg-success/20 text-success");
    } else if (index === currentIndex) {
      // Current character
      className = cn(className, "bg-primary/20 animate-pulse");
    } else {
      // Future characters
      className = cn(className, "text-muted-foreground");
    }

    return (
      <span key={index} className={className}>
        {char}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div 
        className="p-6 bg-card rounded-lg border-2 border-dashed border-muted-foreground/20 min-h-[100px] flex items-center cursor-text focus-within:border-primary/50 transition-colors"
        onClick={() => inputRef.current?.focus()}
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
        onBlur={() => inputRef.current?.focus()}
      />

      <div className="flex justify-between items-center text-sm text-muted-foreground">
        <div>
          {currentIndex}/{text.length} characters
        </div>
        <div>
          Press ESC to reset
        </div>
      </div>
    </div>
  );
};

export default TypingArea;