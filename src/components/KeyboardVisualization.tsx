import { KeyboardLayout, KeyState } from '@/types/keyboard';
import { cn } from '@/lib/utils';

interface KeyboardVisualizationProps {
  layout: KeyboardLayout;
  keyStates: KeyState[];
  showFingerGuide?: boolean;
}

const FINGER_COLORS = [
  'bg-red-200',      // Left pinky
  'bg-orange-200',   // Left ring
  'bg-yellow-200',   // Left middle
  'bg-green-200',    // Left index
  'bg-blue-200',     // Left thumb
  'bg-blue-200',     // Right thumb
  'bg-green-200',    // Right index
  'bg-yellow-200',   // Right middle
  'bg-orange-200',   // Right ring
  'bg-red-200'       // Right pinky
];

const KeyboardVisualization = ({ 
  layout, 
  keyStates, 
  showFingerGuide = false 
}: KeyboardVisualizationProps) => {
  const getKeyState = (key: string): KeyState['state'] => {
    const keyState = keyStates.find(ks => ks.key === key);
    return keyState?.state || 'idle';
  };

  const getKeyClassName = (key: string, finger: number, state: KeyState['state']) => {
    const baseClasses = "relative w-10 h-10 rounded border border-key-border bg-key-base flex items-center justify-center text-xs font-mono font-medium transition-all duration-200";
    
    const stateClasses = {
      idle: showFingerGuide ? FINGER_COLORS[finger] : 'hover:bg-muted/50',
      next: 'bg-key-next text-white border-key-next ring-2 ring-key-next/30 animate-pulse',
      active: 'bg-key-active text-white border-key-active scale-95',
      correct: 'bg-key-correct text-white border-key-correct',
      incorrect: 'bg-key-incorrect text-white border-key-incorrect'
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
            className={getKeyClassName(keyMapping.target, keyMapping.finger, state)}
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