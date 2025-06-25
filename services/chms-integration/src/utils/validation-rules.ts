import { ValidationResult } from './validation';

// Person validation rules
export const personValidationRules = {
  requiredFields: ['id', 'firstName', 'lastName'],
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Invalid email format',
  },
  phone: {
    pattern: /^\+?[\d\s-()]{10,}$/,
    message: 'Invalid phone format',
  },
  zipCode: {
    pattern: /^\d{5}(-\d{4})?$/,
    message: 'Invalid ZIP code format',
  },
  nameLength: {
    min: 1,
    max: 100,
    message: 'Name must be between 1 and 100 characters',
  },
  emailLength: {
    max: 254,
    message: 'Email must not exceed 254 characters',
  },
  phoneLength: {
    min: 10,
    max: 15,
    message: 'Phone number must be between 10 and 15 digits',
  },
};

// Group validation rules
export const groupValidationRules = {
  requiredFields: ['id', 'name'],
  nameLength: {
    min: 1,
    max: 100,
    message: 'Group name must be between 1 and 100 characters',
  },
  descriptionLength: {
    max: 1000,
    message: 'Description must not exceed 1000 characters',
  },
  memberLimit: {
    max: 1000,
    message: 'Group cannot have more than 1000 members',
  },
  leaderLimit: {
    max: 10,
    message: 'Group cannot have more than 10 leaders',
  },
};

// Event validation rules
export const eventValidationRules = {
  requiredFields: ['id', 'title', 'startDate', 'endDate'],
  titleLength: {
    min: 1,
    max: 200,
    message: 'Event title must be between 1 and 200 characters',
  },
  descriptionLength: {
    max: 2000,
    message: 'Description must not exceed 2000 characters',
  },
  dateRange: {
    maxDays: 365,
    message: 'Event cannot span more than 365 days',
  },
  attendeeLimit: {
    max: 10000,
    message: 'Event cannot have more than 10000 attendees',
  },
  locationLength: {
    max: 500,
    message: 'Location must not exceed 500 characters',
  },
};

// Contribution validation rules
export const contributionValidationRules = {
  requiredFields: ['id', 'personId', 'amount', 'date'],
  amountRange: {
    min: 0.01,
    max: 1000000,
    message: 'Amount must be between $0.01 and $1,000,000',
  },
  dateRange: {
    maxDays: 365,
    message: 'Contribution date cannot be more than 365 days in the past',
  },
  fundLength: {
    max: 100,
    message: 'Fund name must not exceed 100 characters',
  },
  paymentMethodLength: {
    max: 50,
    message: 'Payment method must not exceed 50 characters',
  },
};

// Additional validation rules for person data
export const extendedPersonValidationRules = {
  ...personValidationRules,
  birthDate: {
    minAge: 0,
    maxAge: 120,
    message: 'Invalid birth date',
  },
  gender: {
    allowedValues: ['male', 'female', 'other', 'prefer_not_to_say'],
    message: 'Invalid gender value',
  },
  maritalStatus: {
    allowedValues: ['single', 'married', 'divorced', 'widowed', 'separated'],
    message: 'Invalid marital status',
  },
  household: {
    maxMembers: 10,
    message: 'Household cannot have more than 10 members',
  },
  customFields: {
    maxFields: 20,
    maxFieldLength: 100,
    message: 'Invalid custom field configuration',
  },
};

// Additional validation rules for group data
export const extendedGroupValidationRules = {
  ...groupValidationRules,
  meetingSchedule: {
    maxOccurrences: 365,
    message: 'Group cannot have more than 365 scheduled meetings',
  },
  ageRestrictions: {
    minAge: 0,
    maxAge: 120,
    message: 'Invalid age restrictions',
  },
  capacity: {
    min: 1,
    max: 1000,
    message: 'Invalid group capacity',
  },
  registration: {
    maxWaitlist: 100,
    message: 'Waitlist cannot exceed 100 people',
  },
  categories: {
    maxCategories: 10,
    maxCategoryLength: 50,
    message: 'Invalid category configuration',
  },
};

// Additional validation rules for event data
export const extendedEventValidationRules = {
  ...eventValidationRules,
  registration: {
    maxCapacity: 10000,
    maxWaitlist: 1000,
    message: 'Invalid registration configuration',
  },
  pricing: {
    maxPrice: 10000,
    message: 'Event price cannot exceed $10,000',
  },
  resources: {
    maxResources: 50,
    message: 'Event cannot have more than 50 resources',
  },
  checkIn: {
    maxCheckIns: 10000,
    message: 'Event cannot have more than 10,000 check-ins',
  },
  customFields: {
    maxFields: 30,
    maxFieldLength: 200,
    message: 'Invalid custom field configuration',
  },
};

// Additional validation rules for contribution data
export const extendedContributionValidationRules = {
  ...contributionValidationRules,
  recurring: {
    maxFrequency: 52, // Weekly
    message: 'Invalid recurring contribution frequency',
  },
  taxDeduction: {
    maxAmount: 1000000,
    message: 'Tax deduction amount cannot exceed $1,000,000',
  },
  paymentSchedule: {
    maxScheduleLength: 365,
    message: 'Payment schedule cannot exceed 365 days',
  },
  customFields: {
    maxFields: 15,
    maxFieldLength: 100,
    message: 'Invalid custom field configuration',
  },
};

// Custom validation functions
export function validateRequiredFields(data: any, requiredFields: string[]): ValidationResult {
  const errors: string[] = [];
  for (const field of requiredFields) {
    if (!data[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateStringLength(
  value: string | undefined,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  if (!value) return { isValid: true, errors: [] };
  
  const errors: string[] = [];
  if (value.length < min) {
    errors.push(`${fieldName} must be at least ${min} characters`);
  }
  if (value.length > max) {
    errors.push(`${fieldName} must not exceed ${max} characters`);
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateDateRange(
  startDate: Date,
  endDate: Date,
  maxDays: number,
  minDays: number = 0
): ValidationResult {
  const errors: string[] = [];
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < minDays) {
    errors.push(`Date range must be at least ${minDays} days`);
  }
  if (diffDays > maxDays) {
    errors.push(`Date range cannot exceed ${maxDays} days`);
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateNumericRange(
  value: number,
  min: number,
  max: number,
  fieldName: string
): ValidationResult {
  const errors: string[] = [];
  if (value < min) {
    errors.push(`${fieldName} must be at least ${min}`);
  }
  if (value > max) {
    errors.push(`${fieldName} must not exceed ${max}`);
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateArrayLength(
  array: any[] | undefined,
  max: number,
  fieldName: string
): ValidationResult {
  if (!array) return { isValid: true, errors: [] };
  
  const errors: string[] = [];
  if (array.length > max) {
    errors.push(`${fieldName} cannot have more than ${max} items`);
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validatePattern(
  value: string | undefined,
  pattern: RegExp,
  message: string
): ValidationResult {
  if (!value) return { isValid: true, errors: [] };
  
  const errors: string[] = [];
  if (!pattern.test(value)) {
    errors.push(message);
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateEnumValue(
  value: string | undefined,
  allowedValues: string[],
  fieldName: string
): ValidationResult {
  if (!value) return { isValid: true, errors: [] };
  
  const errors: string[] = [];
  if (!allowedValues.includes(value)) {
    errors.push(`${fieldName} must be one of: ${allowedValues.join(', ')}`);
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateCustomFields(
  fields: Record<string, any> | undefined,
  maxFields: number,
  maxFieldLength: number
): ValidationResult {
  if (!fields) return { isValid: true, errors: [] };
  
  const errors: string[] = [];
  if (Object.keys(fields).length > maxFields) {
    errors.push(`Cannot have more than ${maxFields} custom fields`);
  }
  
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value === 'string' && value.length > maxFieldLength) {
      errors.push(`Custom field '${key}' must not exceed ${maxFieldLength} characters`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateArrayItems(
  array: any[] | undefined,
  validator: (item: any) => ValidationResult,
  fieldName: string
): ValidationResult {
  if (!array) return { isValid: true, errors: [] };
  
  const errors: string[] = [];
  for (let i = 0; i < array.length; i++) {
    const validation = validator(array[i]);
    if (!validation.isValid) {
      errors.push(`${fieldName}[${i}]: ${validation.errors.join(', ')}`);
    }
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateObjectProperties(
  obj: Record<string, any> | undefined,
  validators: Record<string, (value: any) => ValidationResult>
): ValidationResult {
  if (!obj) return { isValid: true, errors: [] };
  
  const errors: string[] = [];
  for (const [key, validator] of Object.entries(validators)) {
    const validation = validator(obj[key]);
    if (!validation.isValid) {
      errors.push(`${key}: ${validation.errors.join(', ')}`);
    }
  }
  return {
    isValid: errors.length === 0,
    errors,
  };
} 