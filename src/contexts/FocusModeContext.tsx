import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface FocusModeSettings {
  hideKeyboard: boolean;
  hideStats: boolean;
  hideProgress: boolean;
  hideNavigation: boolean;
  disableAnimations: boolean;
  minimalistUI: boolean;
  darkBackground: boolean;
  largeText: boolean;
}

interface FocusModeContextType {
  isFocusMode: boolean;
  settings: FocusModeSettings;
  enterFocusMode: (customSettings?: Partial<FocusModeSettings>) => void;
  exitFocusMode: () => void;
  updateSettings: (newSettings: Partial<FocusModeSettings>) => void;
  toggleFocusMode: () => void;
}

const defaultSettings: FocusModeSettings = {
  hideKeyboard: true,
  hideStats: true,
  hideProgress: false,
  hideNavigation: true,
  disableAnimations: true,
  minimalistUI: true,
  darkBackground: false,
  largeText: true,
};

const FocusModeContext = createContext<FocusModeContextType | undefined>(undefined);

export const useFocusMode = () => {
  const context = useContext(FocusModeContext);
  if (context === undefined) {
    throw new Error('useFocusMode must be used within a FocusModeProvider');
  }
  return context;
};

interface FocusModeProviderProps {
  children: React.ReactNode;
}

export const FocusModeProvider: React.FC<FocusModeProviderProps> = ({ children }) => {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [settings, setSettings] = useState<FocusModeSettings>(() => {
    // Load settings from localStorage
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('keyboard-trainer-focus-mode-settings');
      if (stored) {
        try {
          return { ...defaultSettings, ...JSON.parse(stored) };
        } catch {
          return defaultSettings;
        }
      }
    }
    return defaultSettings;
  });

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('keyboard-trainer-focus-mode-settings', JSON.stringify(settings));
    }
  }, [settings]);

  // Apply focus mode styles to document
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const root = document.documentElement;
    
    if (isFocusMode) {
      root.classList.add('focus-mode');
      
      // Apply specific settings
      if (settings.disableAnimations) {
        root.classList.add('focus-mode-no-animations');
      }
      
      if (settings.darkBackground) {
        root.classList.add('focus-mode-dark');
      }
      
      if (settings.largeText) {
        root.classList.add('focus-mode-large-text');
      }
      
      if (settings.minimalistUI) {
        root.classList.add('focus-mode-minimal');
      }

      // Hide scrollbars in focus mode
      document.body.style.overflow = 'hidden';
      
      // Prevent context menu and text selection
      document.addEventListener('contextmenu', preventContextMenu);
      document.addEventListener('selectstart', preventSelection);
      
    } else {
      root.classList.remove(
        'focus-mode',
        'focus-mode-no-animations',
        'focus-mode-dark',
        'focus-mode-large-text',
        'focus-mode-minimal'
      );
      
      // Restore normal behavior
      document.body.style.overflow = '';
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('selectstart', preventSelection);
    }

    return () => {
      // Cleanup on unmount
      root.classList.remove(
        'focus-mode',
        'focus-mode-no-animations',
        'focus-mode-dark',
        'focus-mode-large-text',
        'focus-mode-minimal'
      );
      document.body.style.overflow = '';
      document.removeEventListener('contextmenu', preventContextMenu);
      document.removeEventListener('selectstart', preventSelection);
    };
  }, [isFocusMode, settings]);

  // Handle escape key to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFocusMode) {
        exitFocusMode();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode]);

  const preventContextMenu = (e: Event) => {
    e.preventDefault();
  };

  const preventSelection = (e: Event) => {
    e.preventDefault();
  };

  const enterFocusMode = useCallback((customSettings?: Partial<FocusModeSettings>) => {
    if (customSettings) {
      setSettings(prev => ({ ...prev, ...customSettings }));
    }
    setIsFocusMode(true);
    
    // Announce to screen readers
    if (typeof window !== 'undefined') {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'assertive');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = 'Focus mode activated. Press Escape to exit.';
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }, []);

  const exitFocusMode = useCallback(() => {
    setIsFocusMode(false);
    
    // Announce to screen readers
    if (typeof window !== 'undefined') {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'assertive');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = 'Focus mode deactivated.';
      document.body.appendChild(announcement);
      
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }
  }, []);

  const updateSettings = useCallback((newSettings: Partial<FocusModeSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const toggleFocusMode = useCallback(() => {
    if (isFocusMode) {
      exitFocusMode();
    } else {
      enterFocusMode();
    }
  }, [isFocusMode, enterFocusMode, exitFocusMode]);

  const value: FocusModeContextType = {
    isFocusMode,
    settings,
    enterFocusMode,
    exitFocusMode,
    updateSettings,
    toggleFocusMode,
  };

  return (
    <FocusModeContext.Provider value={value}>
      {children}
    </FocusModeContext.Provider>
  );
};

export default FocusModeProvider;
