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
  showFingerGuide = true 
}: KeyboardVisualizationProps) => {
  const getKeyState = (key: string): KeyState['state'] => {
    const keyState = keyStates.find(ks => ks.key === key);
    return keyState?.state || 'idle';
  };

  const getKeyClassName = (key: string, finger: number, state: KeyState['state']) => {
    const baseClasses = "relative w-12 h-12 rounded-md border-2 border-key-border bg-key-base flex items-center justify-center text-sm font-medium transition-all duration-150";
    
    const stateClasses = {
      idle: showFingerGuide ? FINGER_COLORS[finger] : '',
      next: 'bg-key-next text-key-next border-key-next animate-pulse-glow',
      active: 'bg-key-active text-white border-key-active animate-key-press',
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
            <div className="text-center">
              <div className="text-xs text-muted-foreground">
                {keyMapping.qwerty}
              </div>
              <div className="font-bold">
                {keyMapping.target}
              </div>
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
    <div className="bg-card p-6 rounded-lg border shadow-sm">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold">{layout.name} Layout</h3>
        <p className="text-sm text-muted-foreground">
          QWERTY keys shown above, {layout.name} keys shown below
        </p>
      </div>

      <div className="space-y-2">
        {renderKeyRow(topRow, "mb-1")}
        {renderKeyRow(homeRow, "mb-1")}
        {renderKeyRow(bottomRow, "")}
      </div>

      {showFingerGuide && (
        <div className="mt-4 grid grid-cols-5 gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-200"></div>
            <span>Pinkies</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-200"></div>
            <span>Ring</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-yellow-200"></div>
            <span>Middle</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-200"></div>
            <span>Index</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-200"></div>
            <span>Thumbs</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default KeyboardVisualization;