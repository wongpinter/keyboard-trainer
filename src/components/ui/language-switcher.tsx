import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe, Check } from 'lucide-react';
import { LANGUAGES, changeLanguage, type SupportedLanguages } from '@/i18n/config';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = 'ghost',
  size = 'default',
  showText = true,
  className,
}) => {
  const { i18n, t } = useTranslation('common');
  const currentLanguage = i18n.language as SupportedLanguages;
  const currentLangInfo = LANGUAGES[currentLanguage] || LANGUAGES.en;

  const handleLanguageChange = async (language: SupportedLanguages) => {
    if (language !== currentLanguage) {
      const success = await changeLanguage(language);
      if (!success) {
        console.error('Failed to change language to:', language);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={cn(
            'flex items-center gap-2',
            size === 'icon' && 'w-10 h-10',
            className
          )}
          aria-label={t('labels.language')}
        >
          <Globe className="w-4 h-4" />
          {showText && size !== 'icon' && (
            <>
              <span className="hidden sm:inline">{currentLangInfo.flag}</span>
              <span className="hidden md:inline">{currentLangInfo.nativeName}</span>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {Object.entries(LANGUAGES).map(([code, langInfo]) => (
          <DropdownMenuItem
            key={code}
            onClick={() => handleLanguageChange(code as SupportedLanguages)}
            className={cn(
              'flex items-center justify-between cursor-pointer',
              currentLanguage === code && 'bg-accent'
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{langInfo.flag}</span>
              <div className="flex flex-col">
                <span className="font-medium">{langInfo.nativeName}</span>
                <span className="text-xs text-muted-foreground">{langInfo.name}</span>
              </div>
            </div>
            {currentLanguage === code && (
              <Check className="w-4 h-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

// Compact version for mobile/small spaces
export const CompactLanguageSwitcher: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <LanguageSwitcher
      variant="ghost"
      size="icon"
      showText={false}
      className={className}
    />
  );
};

// Text-only version for settings pages
export const TextLanguageSwitcher: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { i18n, t } = useTranslation('common');
  const currentLanguage = i18n.language as SupportedLanguages;

  const handleLanguageChange = async (language: SupportedLanguages) => {
    if (language !== currentLanguage) {
      const success = await changeLanguage(language);
      if (!success) {
        console.error('Failed to change language to:', language);
      }
    }
  };

  return (
    <div className={cn('space-y-2', className)}>
      <label className="text-sm font-medium">{t('labels.language')}</label>
      <div className="flex gap-2">
        {Object.entries(LANGUAGES).map(([code, langInfo]) => (
          <Button
            key={code}
            variant={currentLanguage === code ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleLanguageChange(code as SupportedLanguages)}
            className="flex items-center gap-2"
          >
            <span>{langInfo.flag}</span>
            <span>{langInfo.nativeName}</span>
          </Button>
        ))}
      </div>
    </div>
  );
};

export default LanguageSwitcher;
