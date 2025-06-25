import { Person, Group, Event, Contribution } from '../types';
import { ValidationError } from '../errors';

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validatePerson(person: Person): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!person.id) errors.push('Missing person ID');
  if (!person.firstName) errors.push('Missing first name');
  if (!person.lastName) errors.push('Missing last name');

  // Email validation
  if (person.email && !isValidEmail(person.email)) {
    errors.push('Invalid email format');
  }

  // Phone validation
  if (person.phone && !isValidPhone(person.phone)) {
    errors.push('Invalid phone format');
  }

  // Address validation
  if (person.address) {
    if (person.address.zip && !isValidZipCode(person.address.zip)) {
      errors.push('Invalid ZIP code format');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateGroup(group: Group): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!group.id) errors.push('Missing group ID');
  if (!group.name) errors.push('Missing group name');

  // Members validation
  if (group.members && !Array.isArray(group.members)) {
    errors.push('Members must be an array');
  }

  // Leaders validation
  if (group.leaders && !Array.isArray(group.leaders)) {
    errors.push('Leaders must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateEvent(event: Event): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!event.id) errors.push('Missing event ID');
  if (!event.title) errors.push('Missing event title');
  if (!event.startDate) errors.push('Missing start date');
  if (!event.endDate) errors.push('Missing end date');

  // Date validation
  if (event.startDate && event.endDate && event.startDate > event.endDate) {
    errors.push('Start date must be before end date');
  }

  // Attendees validation
  if (event.attendees && !Array.isArray(event.attendees)) {
    errors.push('Attendees must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validateContribution(contribution: Contribution): ValidationResult {
  const errors: string[] = [];

  // Required fields
  if (!contribution.id) errors.push('Missing contribution ID');
  if (!contribution.personId) errors.push('Missing person ID');
  if (contribution.amount === undefined) errors.push('Missing amount');
  if (!contribution.date) errors.push('Missing date');

  // Amount validation
  if (contribution.amount !== undefined && contribution.amount <= 0) {
    errors.push('Amount must be greater than 0');
  }

  // Date validation
  if (contribution.date && contribution.date > new Date()) {
    errors.push('Contribution date cannot be in the future');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Helper validation functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s-()]{10,}$/;
  return phoneRegex.test(phone);
}

function isValidZipCode(zip: string): boolean {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
}

// Data transformation utilities
export function transformPerson(data: any): Person {
  return {
    id: String(data.id),
    firstName: String(data.first_name || data.firstName || ''),
    lastName: String(data.last_name || data.lastName || ''),
    email: data.email ? String(data.email) : undefined,
    phone: data.phone ? String(data.phone) : undefined,
    address: data.address ? {
      street: data.address.street || data.address.address || undefined,
      city: data.address.city || undefined,
      state: data.address.state || undefined,
      zip: data.address.zip || data.address.postal_code || undefined,
    } : undefined,
    groups: Array.isArray(data.groups) ? data.groups.map(String) : [],
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
  };
}

export function transformGroup(data: any): Group {
  return {
    id: String(data.id),
    name: String(data.name),
    description: data.description ? String(data.description) : undefined,
    members: Array.isArray(data.members) ? data.members.map(String) : [],
    leaders: Array.isArray(data.leaders) ? data.leaders.map(String) : [],
  };
}

export function transformEvent(data: any): Event {
  return {
    id: String(data.id),
    title: String(data.title),
    description: data.description ? String(data.description) : undefined,
    startDate: new Date(data.start_date || data.startDate || data.starts_at),
    endDate: new Date(data.end_date || data.endDate || data.ends_at),
    location: data.location ? String(data.location) : undefined,
    attendees: Array.isArray(data.attendees) ? data.attendees.map(String) : [],
  };
}

export function transformContribution(data: any): Contribution {
  return {
    id: String(data.id),
    personId: String(data.person_id || data.personId),
    amount: Number(data.amount),
    date: new Date(data.date || data.received_at || data.created_at),
    fund: data.fund ? String(data.fund) : undefined,
    paymentMethod: data.payment_method ? String(data.payment_method) : undefined,
  };
} 