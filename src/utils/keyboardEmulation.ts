/**
 * Keyboard Layout Emulation Utilities
 * 
 * This module handles the remapping of physical keyboard inputs to target layout positions.
 * When emulation is enabled, it translates key presses from the user's physical keyboard
 * to the corresponding positions in the target layout they're learning.
 */

// Layout mappings - maps physical key positions to layout characters
export const LAYOUT_MAPPINGS = {
  qwerty: {
    // Top row
    'q': 'q', 'w': 'w', 'e': 'e', 'r': 'r', 't': 't', 'y': 'y', 'u': 'u', 'i': 'i', 'o': 'o', 'p': 'p',
    // Home row  
    'a': 'a', 's': 's', 'd': 'd', 'f': 'f', 'g': 'g', 'h': 'h', 'j': 'j', 'k': 'k', 'l': 'l', ';': ';',
    // Bottom row
    'z': 'z', 'x': 'x', 'c': 'c', 'v': 'v', 'b': 'b', 'n': 'n', 'm': 'm', ',': ',', '.': '.', '/': '/'
  },
  colemak: {
    // Top row
    'q': 'q', 'w': 'w', 'e': 'f', 'r': 'p', 't': 'g', 'y': 'j', 'u': 'l', 'i': 'u', 'o': 'y', 'p': ';',
    // Home row
    'a': 'a', 's': 'r', 'd': 's', 'f': 't', 'g': 'd', 'h': 'h', 'j': 'n', 'k': 'e', 'l': 'i', ';': 'o',
    // Bottom row
    'z': 'z', 'x': 'x', 'c': 'c', 'v': 'v', 'b': 'b', 'n': 'k', 'm': 'm', ',': ',', '.': '.', '/': '/'
  },
  dvorak: {
    // Top row
    'q': "'", 'w': ',', 'e': '.', 'r': 'p', 't': 'y', 'y': 'f', 'u': 'g', 'i': 'c', 'o': 'r', 'p': 'l',
    // Home row
    'a': 'a', 's': 'o', 'd': 'e', 'f': 'u', 'g': 'i', 'h': 'd', 'j': 'h', 'k': 't', 'l': 'n', ';': 's',
    // Bottom row
    'z': ';', 'x': 'q', 'c': 'j', 'v': 'k', 'b': 'x', 'n': 'b', 'm': 'm', ',': 'w', '.': 'v', '/': 'z'
  }
};

// Reverse mappings for when user has target layout physically
export const REVERSE_MAPPINGS = {
  qwerty: LAYOUT_MAPPINGS.qwerty, // Identity mapping
  colemak: Object.fromEntries(
    Object.entries(LAYOUT_MAPPINGS.colemak).map(([qwerty, colemak]) => [colemak, qwerty])
  ),
  dvorak: Object.fromEntries(
    Object.entries(LAYOUT_MAPPINGS.dvorak).map(([qwerty, dvorak]) => [dvorak, qwerty])
  )
};

export interface EmulationConfig {
  physicalLayout: 'qwerty' | 'colemak' | 'dvorak' | 'custom';
  targetLayout: 'qwerty' | 'colemak' | 'dvorak' | 'custom';
  emulationEnabled: boolean;
}

/**
 * Remaps a key press from physical keyboard to target layout
 */
export function remapKey(
  physicalKey: string, 
  config: EmulationConfig
): string {
  // If emulation is disabled, return the key as-is
  if (!config.emulationEnabled) {
    return physicalKey;
  }

  // If physical and target layouts are the same, no remapping needed
  if (config.physicalLayout === config.targetLayout) {
    return physicalKey;
  }

  const key = physicalKey.toLowerCase();

  // Handle special cases
  if (key === ' ' || key === 'space') return ' ';
  if (key.length > 1) return physicalKey; // Don't remap special keys

  try {
    // Get the mapping for the target layout
    const targetMapping = LAYOUT_MAPPINGS[config.targetLayout as keyof typeof LAYOUT_MAPPINGS];
    
    if (config.physicalLayout === 'qwerty') {
      // User has QWERTY, wants to type in target layout
      return targetMapping?.[key] || physicalKey;
    } else {
      // User has target layout physically, reverse map to QWERTY first, then to target
      const reverseMapping = REVERSE_MAPPINGS[config.physicalLayout as keyof typeof REVERSE_MAPPINGS];
      const qwertyKey = reverseMapping?.[key] || key;
      return targetMapping?.[qwertyKey] || physicalKey;
    }
  } catch (error) {
    console.warn('Key remapping error:', error);
    return physicalKey;
  }
}

/**
 * Creates an emulation configuration from context values
 */
export function createEmulationConfig(
  physicalLayout: 'qwerty' | 'colemak' | 'dvorak' | 'custom',
  targetLayout: string,
  emulationEnabled: boolean
): EmulationConfig {
  return {
    physicalLayout,
    targetLayout: targetLayout.toLowerCase() as 'qwerty' | 'colemak' | 'dvorak' | 'custom',
    emulationEnabled
  };
}

/**
 * Gets a human-readable description of the current emulation setup
 */
export function getEmulationDescription(config: EmulationConfig): string {
  if (!config.emulationEnabled) {
    return `Direct ${config.targetLayout.toUpperCase()} input (no remapping)`;
  }

  if (config.physicalLayout === config.targetLayout) {
    return `Native ${config.targetLayout.toUpperCase()} keyboard`;
  }

  return `${config.physicalLayout.toUpperCase()} → ${config.targetLayout.toUpperCase()} emulation`;
}

/**
 * Determines if emulation is recommended based on physical and target layouts
 */
export function isEmulationRecommended(
  physicalLayout: string, 
  targetLayout: string
): boolean {
  return physicalLayout.toLowerCase() !== targetLayout.toLowerCase();
}

/**
 * Hook for keyboard event handling with emulation
 */
export function useKeyboardEmulation(config: EmulationConfig) {
  const handleKeyPress = (event: KeyboardEvent): string => {
    const physicalKey = event.key;
    const remappedKey = remapKey(physicalKey, config);
    
    // Log for debugging (remove in production)
    if (config.emulationEnabled && physicalKey !== remappedKey) {
      console.debug(`Key emulation: ${physicalKey} → ${remappedKey}`);
    }
    
    return remappedKey;
  };

  return { handleKeyPress };
}
