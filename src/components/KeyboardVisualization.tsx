import { KeyboardLayout, KeyState } from '@/types/keyboard';
import { cn } from '@/lib/utils';
import { useTheme, getThemeColors } from '@/contexts/ThemeContext';

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

  // Get finger colors based on current theme
  const fingerColors = themeColors.fingerColors;
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

  const renderKeyRow = (rowKeys: typeof layout.keys, rowClass: string) => (
    <div className={cn("flex gap-1 justify-center", rowClass)}>
      {rowKeys.map((keyMapping) => {
        const state = getKeyState(keyMapping.target);
        return (
          <div
            key={keyMapping.qwerty}
            className={getKeyClassName(keyMapping.finger, state)}
          >
            <div className="font-semibold">
              {keyMapping.target.toUpperCase()}
            </div>
          </div>
        );
      })}
    </div>
  );

  const topRow = layout.keys.filter(k => k.row === 2);
  const homeRow = layout.keys.filter(k => k.row === 1);
  const bottomRow = layout.keys.filter(k => k.row === 0);

  return (
    <div className="bg-card/50 p-4 rounded-lg border">
      <div className="space-y-1">
        {renderKeyRow(topRow, "")}
        {renderKeyRow(homeRow, "")}
        {renderKeyRow(bottomRow, "")}
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