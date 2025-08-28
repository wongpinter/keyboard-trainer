import { KeyboardLayout, KeyState } from '@/types/keyboard';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation(['training', 'common']);
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
      aria-label={t('training:keyboard.rowLabel', { rowName })}
    >
      {rowKeys.map((keyMapping) => {
        const state = getKeyState(keyMapping.target);
        const fingerNames = [
          t('training:keyboard.leftPinky'),
          t('training:keyboard.leftRing'),
          t('training:keyboard.leftMiddle'),
          t('training:keyboard.leftIndex'),
          t('training:keyboard.leftThumb'),
          t('training:keyboard.rightThumb'),
          t('training:keyboard.rightIndex'),
          t('training:keyboard.rightMiddle'),
          t('training:keyboard.rightRing'),
          t('training:keyboard.rightPinky')
        ];
        const fingerName = fingerNames[keyMapping.finger];

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
            aria-label={t('training:keyboard.keyLabel', {
              key: keyMapping.target.toUpperCase(),
              finger: fingerName,
              state: state === 'next' ? t('training:keyboard.nextToType') : t(`training:keyboard.${state}`)
            })}
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
      aria-label={t('training:keyboard.layoutVisualization', { layoutName: layout.name })}
      aria-describedby="keyboard-instructions"
    >
      <div
        className="space-y-1"
        role="grid"
        aria-label={t('training:keyboard.virtualKeyboard')}
      >
        {renderKeyRow(topRow, "", t('training:keyboard.topRow'))}
        {renderKeyRow(homeRow, "", t('training:keyboard.homeRow'))}
        {renderKeyRow(bottomRow, "", t('training:keyboard.bottomRow'))}
      </div>

      {/* Hidden instructions for screen readers */}
      <div id="keyboard-instructions" className="sr-only">
        Virtual keyboard showing {layout.name} layout.
        {showFingerGuide ? t('training:keyboard.fingerGuideDescription') + ' ' : ''}
        {t('training:keyboard.navigationInstructions')}
        {t('training:keyboard.nextKeyDescription')}
      </div>
      
      <div className="mt-3 text-center">
        <p className="text-xs text-muted-foreground">
          {t('training:keyboard.layoutInfo', { layoutName: layout.name })}
        </p>
      </div>
    </div>
  );
};

export default KeyboardVisualization;