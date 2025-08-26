import React, { useState } from 'react';
import { Eye, EyeOff, Settings, Monitor, Type, Keyboard, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { cn } from '@/lib/utils';

interface FocusModeToggleProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showSettings?: boolean;
}

export const FocusModeToggle: React.FC<FocusModeToggleProps> = ({
  variant = 'ghost',
  size = 'icon',
  className,
  showSettings = true
}) => {
  const { isFocusMode, settings, enterFocusMode, exitFocusMode, updateSettings, toggleFocusMode } = useFocusMode();
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);

  const handleQuickFocus = () => {
    enterFocusMode();
  };

  const handleCustomFocus = (customSettings: Partial<typeof settings>) => {
    enterFocusMode(customSettings);
  };

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    updateSettings({ [key]: value });
  };

  if (isFocusMode) {
    return null; // Hide toggle when in focus mode
  }

  return (
    <div className="flex items-center gap-2">
      {/* Quick Focus Button */}
      <Button
        variant={variant}
        size={size}
        onClick={handleQuickFocus}
        className={cn(
          "relative transition-colors",
          className
        )}
        aria-label="Enter focus mode"
        title="Enter focus mode (distraction-free typing)"
      >
        <Eye className="h-4 w-4" />
        <span className="sr-only">Focus Mode</span>
      </Button>

      {/* Settings Dropdown */}
      {showSettings && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Focus mode options"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Focus Mode</DropdownMenuLabel>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem onClick={handleQuickFocus}>
              <Eye className="mr-2 h-4 w-4" />
              Quick Focus
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleCustomFocus({ darkBackground: true })}>
              <Monitor className="mr-2 h-4 w-4" />
              Dark Focus
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleCustomFocus({ largeText: true, minimalistUI: true })}>
              <Type className="mr-2 h-4 w-4" />
              Large Text Focus
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => handleCustomFocus({ hideKeyboard: false, hideStats: false })}>
              <BarChart3 className="mr-2 h-4 w-4" />
              Focus with Stats
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
              <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Settings className="mr-2 h-4 w-4" />
                  Customize Settings
                </DropdownMenuItem>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Focus Mode Settings</DialogTitle>
                  <DialogDescription>
                    Customize your distraction-free typing experience
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Hide Elements</h4>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hide-keyboard" className="text-sm">
                        Hide Keyboard Visualization
                      </Label>
                      <Switch
                        id="hide-keyboard"
                        checked={settings.hideKeyboard}
                        onCheckedChange={(checked) => handleSettingChange('hideKeyboard', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hide-stats" className="text-sm">
                        Hide Statistics
                      </Label>
                      <Switch
                        id="hide-stats"
                        checked={settings.hideStats}
                        onCheckedChange={(checked) => handleSettingChange('hideStats', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hide-progress" className="text-sm">
                        Hide Progress Bar
                      </Label>
                      <Switch
                        id="hide-progress"
                        checked={settings.hideProgress}
                        onCheckedChange={(checked) => handleSettingChange('hideProgress', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="hide-navigation" className="text-sm">
                        Hide Navigation
                      </Label>
                      <Switch
                        id="hide-navigation"
                        checked={settings.hideNavigation}
                        onCheckedChange={(checked) => handleSettingChange('hideNavigation', checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium">Visual Settings</h4>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="disable-animations" className="text-sm">
                        Disable Animations
                      </Label>
                      <Switch
                        id="disable-animations"
                        checked={settings.disableAnimations}
                        onCheckedChange={(checked) => handleSettingChange('disableAnimations', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="minimalist-ui" className="text-sm">
                        Minimalist UI
                      </Label>
                      <Switch
                        id="minimalist-ui"
                        checked={settings.minimalistUI}
                        onCheckedChange={(checked) => handleSettingChange('minimalistUI', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="dark-background" className="text-sm">
                        Dark Background
                      </Label>
                      <Switch
                        id="dark-background"
                        checked={settings.darkBackground}
                        onCheckedChange={(checked) => handleSettingChange('darkBackground', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <Label htmlFor="large-text" className="text-sm">
                        Large Text
                      </Label>
                      <Switch
                        id="large-text"
                        checked={settings.largeText}
                        onCheckedChange={(checked) => handleSettingChange('largeText', checked)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        enterFocusMode();
                        setShowSettingsDialog(false);
                      }}
                      className="flex-1"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Enter Focus Mode
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowSettingsDialog(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default FocusModeToggle;
