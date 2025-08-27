import React from 'react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useEmulation } from '@/contexts/EmulationContext';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { Keyboard, Eye, EyeOff, Zap, BookOpen, Settings, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmulationToggleProps {
  className?: string;
  variant?: 'default' | 'compact' | 'floating' | 'keyboard-setup';
  layoutId?: string; // The target layout being learned (e.g., 'colemak')
}

export const EmulationToggle: React.FC<EmulationToggleProps> = ({
  className,
  variant = 'default',
  layoutId = 'colemak'
}) => {
  const {
    isEmulationEnabled,
    toggleEmulation,
    isLayoutEmulationEnabled,
    getPhysicalKeyboardType,
    setPhysicalKeyboardType
  } = useEmulation();
  const { isFocusMode } = useFocusMode();

  // Use layout-specific emulation if layoutId is provided
  const currentEmulationState = layoutId ? isLayoutEmulationEnabled(layoutId) : isEmulationEnabled;
  const physicalKeyboard = getPhysicalKeyboardType();

  // Don't show in focus mode unless it's the floating variant
  if (isFocusMode && variant !== 'floating') {
    return null;
  }

  const handleToggle = () => {
    if (layoutId) {
      toggleEmulation(layoutId);
    } else {
      toggleEmulation();
    }
  };

  if (variant === 'compact') {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Keyboard className="h-4 w-4" />
          <span>Emulation</span>
        </div>
        <Switch
          checked={currentEmulationState}
          onCheckedChange={handleToggle}
          className="data-[state=checked]:bg-primary"
        />
      </div>
    );
  }

  if (variant === 'keyboard-setup') {
    return (
      <Card className={cn("border-2", className)}>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Monitor className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-semibold">Physical Keyboard Setup</h3>
                <p className="text-sm text-muted-foreground">
                  What type of physical keyboard do you have?
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {(['qwerty', 'colemak', 'dvorak', 'custom'] as const).map((type) => (
                <Button
                  key={type}
                  variant={physicalKeyboard === type ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPhysicalKeyboardType(type)}
                  className="justify-start"
                >
                  <Keyboard className="h-4 w-4 mr-2" />
                  {type.toUpperCase()}
                </Button>
              ))}
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-sm">
                    Layout Emulation for {layoutId.toUpperCase()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentEmulationState
                      ? `Remapping ${physicalKeyboard.toUpperCase()} → ${layoutId.toUpperCase()}`
                      : `Direct ${layoutId.toUpperCase()} input (no remapping)`
                    }
                  </div>
                </div>
                <Switch
                  checked={currentEmulationState}
                  onCheckedChange={handleToggle}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'floating') {
    return (
      <div className={cn(
        "fixed top-20 right-4 z-40 transition-all duration-300",
        "sm:top-24 md:top-20", // Responsive positioning
        isFocusMode ? "opacity-60 hover:opacity-100" : "",
        className
      )}>
        <Card className="border-2 shadow-lg hover:shadow-xl transition-all duration-200">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-2 rounded-full transition-colors",
                  currentEmulationState
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                )}>
                  {currentEmulationState ? (
                    <Settings className="h-4 w-4" />
                  ) : (
                    <Keyboard className="h-4 w-4" />
                  )}
                </div>
                <div className="text-sm">
                  <div className="font-medium">
                    {currentEmulationState ? 'Emulation ON' : 'Direct Input'}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {currentEmulationState
                      ? `${physicalKeyboard.toUpperCase()} → ${layoutId.toUpperCase()}`
                      : `Native ${layoutId.toUpperCase()}`
                    }
                  </div>
                </div>
              </div>
              <Switch
                checked={currentEmulationState}
                onCheckedChange={handleToggle}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Default variant
  return (
    <Card className={cn("border-2 hover:shadow-md transition-all duration-200", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-3 rounded-full transition-colors",
              currentEmulationState
                ? "bg-primary/10 text-primary"
                : "bg-muted text-muted-foreground"
            )}>
              {currentEmulationState ? (
                <Settings className="h-5 w-5" />
              ) : (
                <Keyboard className="h-5 w-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  Keyboard Layout Emulation
                </h3>
                <Badge variant={currentEmulationState ? "default" : "secondary"}>
                  {currentEmulationState ? (
                    <><Settings className="h-3 w-3 mr-1" />Emulation ON</>
                  ) : (
                    <><Keyboard className="h-3 w-3 mr-1" />Direct Input</>
                  )}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {currentEmulationState
                  ? `Software remaps your ${physicalKeyboard.toUpperCase()} keyboard to ${layoutId.toUpperCase()} layout`
                  : `Direct input - no key remapping (you have a physical ${layoutId.toUpperCase()} keyboard)`
                }
              </p>
              <div className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                <Monitor className="h-3 w-3" />
                Physical keyboard: {physicalKeyboard.toUpperCase()}
              </div>
            </div>
          </div>
          <Switch
            checked={currentEmulationState}
            onCheckedChange={handleToggle}
            className="data-[state=checked]:bg-primary scale-125"
          />
        </div>
      </CardContent>
    </Card>
  );
};
