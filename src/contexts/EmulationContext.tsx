import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Keyboard Layout Emulation Context
 *
 * This context manages keyboard layout emulation - the software remapping of physical keys
 * to match the target layout being learned.
 *
 * **Emulation ON (Default)** - For users with QWERTY physical keyboards:
 * - Software remaps QWERTY key positions to target layout (e.g., Colemak)
 * - When user presses 'Q' physically, it registers as 'Q' in Colemak position
 * - Necessary for learning new layouts on standard keyboards
 *
 * **Emulation OFF** - For users with physical keyboards matching the target layout:
 * - No key remapping - direct key input
 * - User presses Colemak 'Q' and it registers as Colemak 'Q'
 * - For users who already have the physical layout they're training on
 *
 * This is separate from visual aids and affects actual key input processing.
 */

interface EmulationContextType {
  isEmulationEnabled: boolean;
  toggleEmulation: (layoutId?: string) => void;
  setEmulationEnabled: (enabled: boolean, layoutId?: string) => void;
  isLayoutEmulationEnabled: (layoutId: string) => boolean;
  getPhysicalKeyboardType: () => 'qwerty' | 'colemak' | 'dvorak' | 'custom';
  setPhysicalKeyboardType: (type: 'qwerty' | 'colemak' | 'dvorak' | 'custom') => void;
  resetEmulationSettings: () => void;
  getDebugInfo: () => any;
}

const EmulationContext = createContext<EmulationContextType | undefined>(undefined);

interface EmulationProviderProps {
  children: React.ReactNode;
}

export const EmulationProvider: React.FC<EmulationProviderProps> = ({ children }) => {
  // Physical keyboard type - what the user actually has
  const [physicalKeyboardType, setPhysicalKeyboardTypeState] = useState<'qwerty' | 'colemak' | 'dvorak' | 'custom'>(() => {
    const saved = localStorage.getItem('physical-keyboard-type');
    return (saved as any) || 'qwerty'; // Most users have QWERTY
  });

  // Layout-specific emulation settings
  const [layoutEmulationSettings, setLayoutEmulationSettings] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('layout-emulation-settings');
    return saved ? JSON.parse(saved) : {};
  });

  // Global emulation enabled state (for backward compatibility)
  const [isEmulationEnabled, setIsEmulationEnabled] = useState(() => {
    const saved = localStorage.getItem('keyboard-emulation-enabled');
    return saved !== null ? JSON.parse(saved) : true;
  });

  // Save physical keyboard type
  useEffect(() => {
    localStorage.setItem('physical-keyboard-type', physicalKeyboardType);
  }, [physicalKeyboardType]);

  // Save layout-specific settings
  useEffect(() => {
    localStorage.setItem('layout-emulation-settings', JSON.stringify(layoutEmulationSettings));
  }, [layoutEmulationSettings]);

  // Save global emulation state
  useEffect(() => {
    localStorage.setItem('keyboard-emulation-enabled', JSON.stringify(isEmulationEnabled));
  }, [isEmulationEnabled]);

  const isLayoutEmulationEnabled = (layoutId: string): boolean => {
    // If user has the physical keyboard matching the target layout, default to no emulation
    if (physicalKeyboardType === layoutId.toLowerCase()) {
      return layoutEmulationSettings[layoutId] ?? false;
    }
    // If user has different physical keyboard, default to emulation on
    return layoutEmulationSettings[layoutId] ?? true;
  };

  const toggleEmulation = (layoutId?: string) => {
    if (layoutId) {
      const currentState = isLayoutEmulationEnabled(layoutId);
      const newState = !currentState;

      setLayoutEmulationSettings(prev => ({
        ...prev,
        [layoutId]: newState
      }));
    } else {
      setIsEmulationEnabled(prev => !prev);
    }
  };

  const setEmulationEnabled = (enabled: boolean, layoutId?: string) => {
    if (layoutId) {
      setLayoutEmulationSettings(prev => ({
        ...prev,
        [layoutId]: enabled
      }));
    } else {
      setIsEmulationEnabled(enabled);
    }
  };

  const getPhysicalKeyboardType = () => physicalKeyboardType;

  const setPhysicalKeyboardType = (type: 'qwerty' | 'colemak' | 'dvorak' | 'custom') => {
    setPhysicalKeyboardTypeState(type);
  };

  const resetEmulationSettings = () => {
    setPhysicalKeyboardTypeState('qwerty');
    setLayoutEmulationSettings({});
    setIsEmulationEnabled(true);
    localStorage.removeItem('physical-keyboard-type');
    localStorage.removeItem('layout-emulation-settings');
    localStorage.removeItem('keyboard-emulation-enabled');
  };

  const getDebugInfo = () => {
    return {
      physicalKeyboardType,
      layoutEmulationSettings,
      isEmulationEnabled,
      colemakEmulationEnabled: isLayoutEmulationEnabled('colemak')
    };
  };

  return (
    <EmulationContext.Provider value={{
      isEmulationEnabled,
      toggleEmulation,
      setEmulationEnabled,
      isLayoutEmulationEnabled,
      getPhysicalKeyboardType,
      setPhysicalKeyboardType,
      resetEmulationSettings,
      getDebugInfo
    }}>
      {children}
    </EmulationContext.Provider>
  );
};

export const useEmulation = () => {
  const context = useContext(EmulationContext);
  if (context === undefined) {
    throw new Error('useEmulation must be used within an EmulationProvider');
  }
  return context;
};
