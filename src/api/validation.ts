const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LETTER_PATTERN = /[A-Za-z]/;
const NUMBER_PATTERN = /[0-9]/;
const SPECIAL_PATTERN = /[^A-Za-z0-9\s]/;

function trimmed(value: string): string {
  return (value ?? '').trim();
}

function lengthError(value: string, min: number, max: number, label: string): string | null {
  const text = trimmed(value);
  if (text.length < min || text.length > max) {
    return `${label} must be between ${min} and ${max} characters.`;
  }
  return null;
}

export function isValidDateString(value: string): boolean {
  const text = trimmed(value);
  if (!text) {
    return false;
  }
  return !Number.isNaN(new Date(text).getTime());
}

export function validateFullName(value: string): string | null {
  if (!trimmed(value)) {
    return 'Full name is required.';
  }
  return lengthError(value, 2, 120, 'Full name');
}

export function validatePhone(value: string): string | null {
  if (!trimmed(value)) {
    return 'Phone number is required.';
  }
  return lengthError(value, 7, 20, 'Phone number');
}

export function validateCity(value: string): string | null {
  if (!trimmed(value)) {
    return 'City is required.';
  }
  return lengthError(value, 2, 100, 'City');
}

export function validateEmail(value: string): string | null {
  const text = trimmed(value);
  if (!text) {
    return 'Email is required.';
  }
  if (!EMAIL_PATTERN.test(text)) {
    return 'Email must be a valid email address.';
  }
  return null;
}

export function validatePassword(value: string): string | null {
  const text = trimmed(value);
  if (text.length < 8) {
    return 'Password must be at least 8 characters.';
  }
  if (!LETTER_PATTERN.test(text)) {
    return 'Password must include at least one letter.';
  }
  if (!NUMBER_PATTERN.test(text)) {
    return 'Password must include at least one number.';
  }
  if (!SPECIAL_PATTERN.test(text)) {
    return 'Password must include at least one special character.';
  }
  return null;
}

export function validateOrganizationName(value: string): string | null {
  if (!trimmed(value)) {
    return 'Organization name is required.';
  }
  return lengthError(value, 2, 160, 'Organization name');
}

export function validateAddress(value: string): string | null {
  if (!trimmed(value)) {
    return 'Address is required.';
  }
  return lengthError(value, 3, 240, 'Address');
}

export function validateFoodDescription(value: string): string | null {
  if (!trimmed(value)) {
    return 'Food description is required.';
  }
  return lengthError(value, 3, 500, 'Food description');
}

export function validateHandlingInformation(value: string): string | null {
  if (!trimmed(value)) {
    return 'Handling information is required.';
  }
  return lengthError(value, 3, 1000, 'Handling information');
}

export function validateAllergenInformation(value: string): string | null {
  const text = trimmed(value);
  if (text.length > 1000) {
    return 'Allergen information must be at most 1000 characters.';
  }
  return null;
}

export function validateLatitude(value: string | number): string | null {
  const num = typeof value === 'number' ? value : Number(trimmed(value));
  if (trimmed(String(value)) === '' || !Number.isFinite(num)) {
    return 'Latitude must be a number.';
  }
  if (num < -90 || num > 90) {
    return 'Latitude must be between -90 and 90.';
  }
  return null;
}

export function validateLongitude(value: string | number): string | null {
  const num = typeof value === 'number' ? value : Number(trimmed(value));
  if (trimmed(String(value)) === '' || !Number.isFinite(num)) {
    return 'Longitude must be a number.';
  }
  if (num < -180 || num > 180) {
    return 'Longitude must be between -180 and 180.';
  }
  return null;
}

export function validateMealQuantity(value: string | number, label = 'Meal quantity'): string | null {
  const text = trimmed(String(value));
  const num = Number(text);
  if (!text || !Number.isInteger(num) || num < 0) {
    return `${label} must be a non-negative whole number.`;
  }
  return null;
}

export function validateTotalMeals(value: string | number, label = 'Total meals'): string | null {
  const text = trimmed(String(value));
  const num = Number(text);
  if (!text || !Number.isInteger(num) || num <= 0) {
    return `${label} must be a whole number greater than 0.`;
  }
  return null;
}

export function validatePureVegMeals(value: string | number, total: number): string | null {
  const text = trimmed(String(value));
  const num = Number(text);
  if (!text || !Number.isInteger(num) || num < 0 || num > total) {
    return `Pure veg meals must be a whole number between 0 and ${total}.`;
  }
  return null;
}

export function validateDeadline(value: string, now: Date = new Date()): string | null {
  if (!isValidDateString(value)) {
    return 'Deadline must be a valid date.';
  }
  if (new Date(trimmed(value)).getTime() <= now.getTime()) {
    return 'Deadline must be later than now.';
  }
  return null;
}
