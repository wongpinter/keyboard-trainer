import React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, Eye, Type, Keyboard, Volume2, Contrast } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAccessibility, announceToScreenReader } from '@/hooks/useAccessibility';
import { cn } from '@/lib/utils';

interface AccessibilitySettingsProps {
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  className,
  variant = 'ghost',
  size = 'icon'
}) => {
  const { t } = useTranslation(['common', 'settings']);
  const { preferences, updatePreference, resetPreferences } = useAccessibility();

  const handlePreferenceChange = (key: keyof typeof preferences, value: boolean) => {
    updatePreference(key, value);
    
    // Announce changes to screen readers
    const settingName = key.replace(/([A-Z])/g, ' $1').toLowerCase();
    announceToScreenReader(
      `${settingName} ${value ? t('common:ui.enable') : t('common:ui.disable')}`,
      'polite'
    );
  };

  const handleReset = () => {
    resetPreferences();
    announceToScreenReader(t('common:settings.resetToDefaults'), 'polite');
  };

  const accessibilityOptions = [
    {
      key: 'reducedMotion' as const,
      title: 'Reduced Motion',
      description: 'Minimize animations and transitions for better focus',
      icon: Eye,
      category: 'Visual'
    },
    {
      key: 'highContrast' as const,
      title: 'High Contrast',
      description: 'Increase contrast for better visibility',
      icon: Contrast,
      category: 'Visual'
    },
    {
      key: 'largeText' as const,
      title: 'Large Text',
      description: 'Increase text size throughout the application',
      icon: Type,
      category: 'Visual'
    },
    {
      key: 'focusVisible' as const,
      title: 'Enhanced Focus',
      description: 'Show clear focus indicators for keyboard navigation',
      icon: Keyboard,
      category: 'Navigation'
    },
    {
      key: 'screenReader' as const,
      title: 'Screen Reader Support',
      description: 'Optimize for screen reader compatibility',
      icon: Volume2,
      category: 'Assistive Technology'
    }
  ];

  const groupedOptions = accessibilityOptions.reduce((acc, option) => {
    if (!acc[option.category]) {
      acc[option.category] = [];
    }
    acc[option.category].push(option);
    return acc;
  }, {} as Record<string, typeof accessibilityOptions>);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            "relative transition-colors",
            className
          )}
          aria-label={t('common:settings.accessibilitySettings')}
        >
          <Settings className="h-4 w-4" />
          <span className="sr-only">{t('common:settings.accessibilitySettings')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        aria-describedby="accessibility-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            {t('common:settings.accessibilitySettings')}
          </DialogTitle>
          <DialogDescription id="accessibility-description">
            {t('common:settings.customizeAccessibility')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {Object.entries(groupedOptions).map(([category, options]) => (
            <Card key={category}>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">{category}</CardTitle>
                <CardDescription>
                  {category === 'Visual' && 'Settings that affect how content is displayed'}
                  {category === 'Navigation' && 'Settings for keyboard and focus navigation'}
                  {category === 'Assistive Technology' && 'Settings for screen readers and other assistive tools'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {options.map((option) => {
                  const Icon = option.icon;
                  const isEnabled = preferences[option.key];
                  
                  return (
                    <div
                      key={option.key}
                      className="flex items-center justify-between space-x-4 p-3 rounded-lg border bg-card/50"
                    >
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="mt-0.5">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <Label 
                            htmlFor={option.key}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            {option.title}
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            {option.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id={option.key}
                        checked={isEnabled}
                        onCheckedChange={(checked) => handlePreferenceChange(option.key, checked)}
                        aria-describedby={`${option.key}-description`}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Reset Settings</h3>
              <p className="text-xs text-muted-foreground">
                Restore all accessibility settings to their default values
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              aria-label="Reset all accessibility settings to defaults"
            >
              Reset to Defaults
            </Button>
          </div>

          <div className="text-xs text-muted-foreground space-y-2">
            <p>
              <strong>Note:</strong> Some settings may require a page refresh to take full effect.
            </p>
            <p>
              These settings are automatically detected from your system preferences when possible.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AccessibilitySettings;
