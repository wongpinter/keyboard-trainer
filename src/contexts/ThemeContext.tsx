import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'system' 
}) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Get theme from localStorage or use default
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('keyboard-trainer-theme') as Theme;
      return stored || defaultTheme;
    }
    return defaultTheme;
  });

  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Function to get system theme preference
  const getSystemTheme = (): ResolvedTheme => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  };

  // Resolve the actual theme to apply
  const resolveTheme = (currentTheme: Theme): ResolvedTheme => {
    if (currentTheme === 'system') {
      return getSystemTheme();
    }
    return currentTheme;
  };

  // Update resolved theme when theme changes
  useEffect(() => {
    const resolved = resolveTheme(theme);
    setResolvedTheme(resolved);

    // Apply theme to document
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolved);

    // Save to localStorage
    localStorage.setItem('keyboard-trainer-theme', theme);
  }, [theme]);

  // Listen for system theme changes when using system theme
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const resolved = resolveTheme(theme);
      setResolvedTheme(resolved);
      
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(resolved);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const value: ThemeContextType = {
    theme,
    resolvedTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Theme-aware color utilities
export const getThemeColors = (resolvedTheme: ResolvedTheme) => ({
  // Finger colors for keyboard visualization
  fingerColors: {
    light: [
      'bg-red-200 hover:bg-red-300',      // Left pinky
      'bg-orange-200 hover:bg-orange-300', // Left ring
      'bg-yellow-200 hover:bg-yellow-300', // Left middle
      'bg-green-200 hover:bg-green-300',   // Left index
      'bg-blue-200 hover:bg-blue-300',     // Left thumb
      'bg-blue-200 hover:bg-blue-300',     // Right thumb
      'bg-green-200 hover:bg-green-300',   // Right index
      'bg-yellow-200 hover:bg-yellow-300', // Right middle
      'bg-orange-200 hover:bg-orange-300', // Right ring
      'bg-red-200 hover:bg-red-300'       // Right pinky
    ],
    dark: [
      'bg-red-800 hover:bg-red-700',      // Left pinky
      'bg-orange-800 hover:bg-orange-700', // Left ring
      'bg-yellow-800 hover:bg-yellow-700', // Left middle
      'bg-green-800 hover:bg-green-700',   // Left index
      'bg-blue-800 hover:bg-blue-700',     // Left thumb
      'bg-blue-800 hover:bg-blue-700',     // Right thumb
      'bg-green-800 hover:bg-green-700',   // Right index
      'bg-yellow-800 hover:bg-yellow-700', // Right middle
      'bg-orange-800 hover:bg-orange-700', // Right ring
      'bg-red-800 hover:bg-red-700'       // Right pinky
    ]
  }[resolvedTheme],

  // Key state colors
  keyStates: {
    light: {
      idle: 'bg-slate-100 hover:bg-slate-200 text-slate-700',
      next: 'bg-blue-500 text-white border-blue-500 ring-2 ring-blue-500/30',
      active: 'bg-green-500 text-white border-green-500 scale-95',
      correct: 'bg-emerald-500 text-white border-emerald-500',
      incorrect: 'bg-red-500 text-white border-red-500'
    },
    dark: {
      idle: 'bg-slate-800 hover:bg-slate-700 text-slate-200',
      next: 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-600/30',
      active: 'bg-green-600 text-white border-green-600 scale-95',
      correct: 'bg-emerald-600 text-white border-emerald-600',
      incorrect: 'bg-red-600 text-white border-red-600'
    }
  }[resolvedTheme],

  // Background gradients
  backgrounds: {
    light: 'bg-gradient-to-br from-background via-background to-muted/20',
    dark: 'bg-gradient-to-br from-background via-background to-muted/10'
  }[resolvedTheme]
});

export default ThemeProvider;
