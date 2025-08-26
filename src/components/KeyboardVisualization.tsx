import { KeyboardLayout, KeyState } from '@/types/keyboard';
import { cn } from '@/lib/utils';
import { useTheme, getThemeColors } from '@/contexts/ThemeContext';
import { useAccessibility, announceToScreenReader } from '@/hooks/useAccessibility';
import { useAnimations, pulse } from '@/hooks/useAnimations';
import { useEffect, useRef } from 'react';

interface KeyboardVisualizationProps {
  layout: KeyboardLayout;
  keyStates: KeyState[];
  showFingerGuide?: boolean;
}

const KeyboardVisualization = ({
  layout,
  keyStates,
  showFingerGuide = false
}: KeyboardVisualizationProps) => {
  const { resolvedTheme } = useTheme();
  const themeColors = getThemeColors(resolvedTheme);
  const { preferences } = useAccessibility();
  const { createAnimationConfig } = useAnimations();
  const keyboardRef = useRef<HTMLDivElement>(null);
  const keyRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Get finger colors based on current theme
  const fingerColors = themeColors.fingerColors;

  // Announce key state changes to screen readers and animate keys
  useEffect(() => {
    if (!preferences.screenReader) return;

    const activeKey = keyStates.find(ks => ks.state === 'next');
    if (activeKey) {
      const keyMapping = layout.keys.find(k => k.target === activeKey.key);
      if (keyMapping) {
        announceToScreenReader(
          `Next key: ${keyMapping.target.toUpperCase()}, finger ${keyMapping.finger + 1}`,
          'polite'
        );
      }
    }
  }, [keyStates, layout.keys, preferences.screenReader]);

  // Animate key state changes
  useEffect(() => {
    keyStates.forEach(keyState => {
      const keyElement = keyRefs.current.get(keyState.key);
      if (keyElement) {
        const config = createAnimationConfig({ duration: 200, easing: 'ease-out' });

        switch (keyState.state) {
          case 'correct':
            // Pulse animation for correct keys
            pulse(keyElement, config.duration);
            break;
          case 'incorrect':
            // Shake animation for incorrect keys
            keyElement.classList.add('animate-shake');
            setTimeout(() => {
              keyElement.classList.remove('animate-shake');
            }, 500);
            break;
          case 'next':
            // Gentle pulse for next key
            keyElement.classList.add('animate-pulse-once');
            setTimeout(() => {
              keyElement.classList.remove('animate-pulse-once');
            }, 600);
            break;
        }
      }
    });
  }, [keyStates, createAnimationConfig]);
  const getKeyState = (key: string): KeyState['state'] => {
    const keyState = keyStates.find(ks => ks.key === key);
    return keyState?.state || 'idle';
  };

  const getKeyClassName = (finger: number, state: KeyState['state']) => {
    const baseClasses = "relative w-10 h-10 rounded border transition-all duration-200 flex items-center justify-center text-xs font-mono font-medium";

    // Use theme-aware colors
    const keyStateColors = themeColors.keyStates;

    const stateClasses = {
      idle: showFingerGuide ? fingerColors[finger] : keyStateColors.idle,
      next: keyStateColors.next,
      active: keyStateColors.active,
      correct: keyStateColors.correct,
      incorrect: keyStateColors.incorrect
    };

    return cn(baseClasses, stateClasses[state]);
  };

  const renderKeyRow = (rowKeys: typeof layout.keys, rowClass: string, rowName: string) => (
    <div
      className={cn("flex gap-1 justify-center", rowClass)}
      role="row"
      aria-label={`${rowName} row`}
    >
      {rowKeys.map((keyMapping) => {
        const state = getKeyState(keyMapping.target);
        const fingerName = ['left pinky', 'left ring', 'left middle', 'left index', 'left thumb', 'right thumb', 'right index', 'right middle', 'right ring', 'right pinky'][keyMapping.finger];

        return (
          <div
            key={keyMapping.qwerty}
            ref={(el) => {
              if (el) {
                keyRefs.current.set(keyMapping.target, el);
              }
            }}
            className={cn(
              getKeyClassName(keyMapping.finger, state),
              'transition-all duration-200 ease-out',
              state === 'next' && 'animate-pulse',
              state === 'active' && 'scale-95'
            )}
            role="gridcell"
            aria-label={`Key ${keyMapping.target.toUpperCase()}, ${fingerName}, ${state === 'next' ? 'next to type' : state}`}
            aria-pressed={state === 'active'}
            tabIndex={state === 'next' ? 0 : -1}
          >
            <div className="font-semibold">
              {keyMapping.target.toUpperCase()}
            </div>
            {preferences.screenReader && state === 'next' && (
              <span className="sr-only">
                Next key to type: {keyMapping.target.toUpperCase()}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );

  const topRow = layout.keys.filter(k => k.row === 2);
  const homeRow = layout.keys.filter(k => k.row === 1);
  const bottomRow = layout.keys.filter(k => k.row === 0);

  return (
    <div
      ref={keyboardRef}
      className="bg-card/50 p-4 rounded-lg border"
      role="application"
      aria-label={`${layout.name} keyboard layout visualization`}
      aria-describedby="keyboard-instructions"
    >
      <div
        className="space-y-1"
        role="grid"
        aria-label="Virtual keyboard"
      >
        {renderKeyRow(topRow, "", "Top")}
        {renderKeyRow(homeRow, "", "Home")}
        {renderKeyRow(bottomRow, "", "Bottom")}
      </div>

      {/* Hidden instructions for screen readers */}
      <div id="keyboard-instructions" className="sr-only">
        Virtual keyboard showing {layout.name} layout.
        {showFingerGuide ? 'Keys are colored by finger assignment. ' : ''}
        Use Tab to navigate between keys.
        The next key to type is highlighted and announced.
      </div>
      
      <div className="mt-3 text-center">
        <p className="text-xs text-muted-foreground">
          {layout.name} Layout • Yellow = Next Key
        </p>
      </div>
    </div>
  );
};

export default KeyboardVisualization;