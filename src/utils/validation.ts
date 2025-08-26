import { ValidationError } from '@/types/errors';

// Validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  field?: string;
}

// Base validation function type
export type ValidationFunction<T> = (value: T) => ValidationResult;

// Email validation
export const validateEmail = (email: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!email || !email.trim()) {
    errors.push('Email is required');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Please enter a valid email address');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    field: 'email'
  };
};

// Password validation
export const validatePassword = (password: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!password || !password.trim()) {
    errors.push('Password is required');
  } else {
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/(?=.*\d)/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      errors.push('Password should contain at least one special character');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    field: 'password'
  };
};

// Username validation
export const validateUsername = (username: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!username || !username.trim()) {
    errors.push('Username is required');
  } else {
    const trimmed = username.trim();
    
    if (trimmed.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    
    if (trimmed.length > 30) {
      errors.push('Username must be less than 30 characters');
    }
    
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      errors.push('Username can only contain letters, numbers, underscores, and hyphens');
    }
    
    if (/^[_-]/.test(trimmed) || /[_-]$/.test(trimmed)) {
      errors.push('Username cannot start or end with underscore or hyphen');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    field: 'username'
  };
};

// Required field validation
export const validateRequired = (value: any, fieldName: string): ValidationResult => {
  const errors: string[] = [];
  
  if (value === null || value === undefined || 
      (typeof value === 'string' && !value.trim()) ||
      (Array.isArray(value) && value.length === 0)) {
    errors.push(`${fieldName} is required`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    field: fieldName.toLowerCase()
  };
};

// String length validation
export const validateLength = (
  value: string, 
  min: number, 
  max: number, 
  fieldName: string
): ValidationResult => {
  const errors: string[] = [];
  
  if (value && value.length < min) {
    errors.push(`${fieldName} must be at least ${min} characters long`);
  }
  
  if (value && value.length > max) {
    errors.push(`${fieldName} must be less than ${max} characters long`);
  }

  return {
    isValid: errors.length === 0,
    errors,
    field: fieldName.toLowerCase()
  };
};

// Number validation
export const validateNumber = (
  value: any, 
  min?: number, 
  max?: number, 
  fieldName: string = 'Value'
): ValidationResult => {
  const errors: string[] = [];
  
  const num = Number(value);
  
  if (isNaN(num)) {
    errors.push(`${fieldName} must be a valid number`);
  } else {
    if (min !== undefined && num < min) {
      errors.push(`${fieldName} must be at least ${min}`);
    }
    
    if (max !== undefined && num > max) {
      errors.push(`${fieldName} must be at most ${max}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    field: fieldName.toLowerCase()
  };
};

// URL validation
export const validateURL = (url: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!url || !url.trim()) {
    errors.push('URL is required');
  } else {
    try {
      new URL(url);
    } catch {
      errors.push('Please enter a valid URL');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    field: 'url'
  };
};

// JSON validation
export const validateJSON = (jsonString: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!jsonString || !jsonString.trim()) {
    errors.push('JSON is required');
  } else {
    try {
      JSON.parse(jsonString);
    } catch (error) {
      errors.push('Please enter valid JSON format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    field: 'json'
  };
};

// Keyboard layout validation
export const validateKeyboardLayout = (layoutData: any): ValidationResult => {
  const errors: string[] = [];
  
  if (!layoutData) {
    errors.push('Keyboard layout data is required');
    return { isValid: false, errors, field: 'layout' };
  }

  // Check required properties
  if (!layoutData.name || typeof layoutData.name !== 'string') {
    errors.push('Layout must have a valid name');
  }

  if (!Array.isArray(layoutData.keys)) {
    errors.push('Layout must have a keys array');
  } else {
    // Validate each key mapping
    layoutData.keys.forEach((key: any, index: number) => {
      if (!key.qwerty || typeof key.qwerty !== 'string') {
        errors.push(`Key ${index + 1}: qwerty property is required`);
      }
      
      if (!key.target || typeof key.target !== 'string') {
        errors.push(`Key ${index + 1}: target property is required`);
      }
      
      if (typeof key.finger !== 'number' || key.finger < 0 || key.finger > 9) {
        errors.push(`Key ${index + 1}: finger must be a number between 0 and 9`);
      }
      
      if (typeof key.row !== 'number' || key.row < 0 || key.row > 3) {
        errors.push(`Key ${index + 1}: row must be a number between 0 and 3`);
      }
    });
  }

  if (!Array.isArray(layoutData.homeRow)) {
    errors.push('Layout must have a homeRow array');
  }

  if (!Array.isArray(layoutData.learningOrder)) {
    errors.push('Layout must have a learningOrder array');
  }

  return {
    isValid: errors.length === 0,
    errors,
    field: 'keyboardLayout'
  };
};

// Typing text validation
export const validateTypingText = (text: string): ValidationResult => {
  const errors: string[] = [];
  
  if (!text || !text.trim()) {
    errors.push('Practice text is required');
  } else {
    if (text.length < 10) {
      errors.push('Practice text must be at least 10 characters long');
    }
    
    if (text.length > 1000) {
      errors.push('Practice text must be less than 1000 characters');
    }
    
    // Check for only printable characters
    if (!/^[\x20-\x7E\s]*$/.test(text)) {
      errors.push('Practice text can only contain printable ASCII characters');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    field: 'practiceText'
  };
};

// Form validation utility
export const validateForm = (
  data: Record<string, any>, 
  validators: Record<string, ValidationFunction<any>>
): { isValid: boolean; errors: Record<string, string[]> } => {
  const errors: Record<string, string[]> = {};
  let isValid = true;

  Object.entries(validators).forEach(([field, validator]) => {
    const result = validator(data[field]);
    if (!result.isValid) {
      errors[field] = result.errors;
      isValid = false;
    }
  });

  return { isValid, errors };
};

// Validation hook for React components
export const useValidation = () => {
  const validate = (value: any, validator: ValidationFunction<any>): ValidationResult => {
    return validator(value);
  };

  const validateAndThrow = (value: any, validator: ValidationFunction<any>, field?: string): void => {
    const result = validator(value);
    if (!result.isValid) {
      throw new ValidationError(result.errors[0], field || result.field);
    }
  };

  return {
    validate,
    validateAndThrow,
    validateEmail,
    validatePassword,
    validateUsername,
    validateRequired,
    validateLength,
    validateNumber,
    validateURL,
    validateJSON,
    validateKeyboardLayout,
    validateTypingText,
    validateForm,
  };
};
