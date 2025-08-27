import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/ui/language-switcher';

export const TranslationTest: React.FC = () => {
  const { t, i18n } = useTranslation(['common', 'auth', 'training']);

  const testKeys = [
    { key: 'common:buttons.save', expected: 'Save / Simpan' },
    { key: 'auth:titles.signIn', expected: 'Sign In / Masuk' },
    { key: 'training:titles.keyboardTrainer', expected: 'Keyboard Trainer / Pelatih Keyboard' },
    { key: 'common:hero.masterAlternative', expected: 'Master Alternative / Kuasai Layout' },
    { key: 'auth:errors.emailRequired', expected: 'Email is required / Email wajib diisi' },
  ];

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Translation Test</CardTitle>
          <div className="flex items-center gap-4">
            <span>Current Language: {i18n.language}</span>
            <LanguageSwitcher />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {testKeys.map(({ key, expected }) => (
            <div key={key} className="border p-3 rounded">
              <div className="font-mono text-sm text-muted-foreground">{key}</div>
              <div className="font-medium">{t(key)}</div>
              <div className="text-xs text-muted-foreground">Expected: {expected}</div>
            </div>
          ))}
          
          <div className="mt-6 space-y-2">
            <h3 className="font-semibold">Dynamic Content Test</h3>
            <p>{t('common:time.ago', 'ago')}</p>
            <p>{t('common:units.wpm', 'WPM')}</p>
            <p>{t('common:status.loading', 'Loading...')}</p>
          </div>
          
          <div className="mt-6">
            <Button onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'id' : 'en')}>
              Switch to {i18n.language === 'en' ? 'Indonesian' : 'English'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TranslationTest;
