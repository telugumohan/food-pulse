import { delay, fail, ok } from './mockDelay';
import { getStorageValue, removeStorageValue, setStorageValue } from './mockStorage';
import type { MockApiResponse, MockSession, MockUser } from './types';
import { validateEmail, validateFullName, validatePassword } from './validation';

const USERS_KEY = 'foodpulse_mock_users';
const SESSION_KEY = 'foodpulse_mock_session';
const PASSWORD_TOKENS_KEY = 'foodpulse_mock_password_tokens';
const CONFIRMATION_TOKENS_KEY = 'foodpulse_mock_email_confirmation_tokens';
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

interface MockAuthToken {
  token: string;
  userId: string;
  email: string;
  createdAt: string;
  used: boolean;
}

function createId(): string {
  const cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

function readUsers(): MockUser[] {
  return getStorageValue<MockUser[]>(USERS_KEY, []);
}

function writeUsers(users: MockUser[]): void {
  setStorageValue(USERS_KEY, users);
}

function readTokens(key: string): MockAuthToken[] {
  return getStorageValue<MockAuthToken[]>(key, []);
}

function findLatestUnusedToken(key: string): string | null {
  const tokens = readTokens(key);
  for (let index = tokens.length - 1; index >= 0; index -= 1) {
    if (!tokens[index].used) {
      return tokens[index].token;
    }
  }
  return null;
}

const RESET_NOT_FOUND = 'This reset link is invalid or has expired.';

export async function signUp(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<MockApiResponse<{ userId: string }>> {
  await delay();

  const fullName = input.fullName.trim();
  const fullNameError = validateFullName(fullName);
  if (fullNameError) {
    return fail('VALIDATION_ERROR', fullNameError, 'fullName');
  }

  const email = input.email.trim();
  const emailError = validateEmail(email);
  if (emailError) {
    return fail('VALIDATION_ERROR', emailError, 'email');
  }

  const passwordError = validatePassword(input.password);
  if (passwordError) {
    return fail('VALIDATION_ERROR', passwordError, 'password');
  }

  const users = readUsers();
  const normalizedEmail = email.toLowerCase();
  if (users.some((user) => user.email.toLowerCase() === normalizedEmail)) {
    return fail('CONFLICT', 'An account with this email already exists.', 'email');
  }

  const now = new Date().toISOString();
  const user: MockUser = {
    id: createId(),
    email,
    password: input.password,
    emailConfirmed: false,
    role: 'user',
    createdAt: now,
  };
  writeUsers([...users, user]);

  const confirmationTokens = readTokens(CONFIRMATION_TOKENS_KEY);
  setStorageValue(CONFIRMATION_TOKENS_KEY, [
    ...confirmationTokens,
    { token: createId(), userId: user.id, email, createdAt: now, used: false },
  ]);

  return ok({ userId: user.id });
}

export async function signIn(input: {
  email: string;
  password: string;
}): Promise<MockApiResponse<MockSession>> {
  await delay();

  const normalizedEmail = input.email.trim().toLowerCase();
  const user = readUsers().find((candidate) => candidate.email.toLowerCase() === normalizedEmail);
  if (!user || user.password !== input.password) {
    return fail('AUTH_ERROR', 'Invalid email or password');
  }
  if (!user.emailConfirmed) {
    return fail('AUTH_ERROR', 'Please confirm your email first.');
  }

  const session: MockSession = {
    userId: user.id,
    email: user.email,
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };
  setStorageValue(SESSION_KEY, session);
  return ok(session);
}

export async function signOut(): Promise<boolean> {
  await delay();
  removeStorageValue(SESSION_KEY);
  return true;
}

export async function getCurrentSession(): Promise<MockSession | null> {
  await delay();

  const session = getStorageValue<MockSession | null>(SESSION_KEY, null);
  if (!session) {
    return null;
  }

  const expired = Date.parse(session.expiresAt) <= Date.now();
  const userExists = readUsers().some((user) => user.id === session.userId);
  if (expired || !userExists) {
    removeStorageValue(SESSION_KEY);
    return null;
  }

  return session;
}

export async function sendPasswordResetEmail(email: string): Promise<MockApiResponse<{ sent: boolean }>> {
  await delay();

  const trimmedEmail = email.trim();
  const emailError = validateEmail(trimmedEmail);
  if (emailError) {
    return fail('VALIDATION_ERROR', emailError, 'email');
  }

  const normalizedEmail = trimmedEmail.toLowerCase();
  const user = readUsers().find((candidate) => candidate.email.toLowerCase() === normalizedEmail);
  if (user) {
    const tokens = readTokens(PASSWORD_TOKENS_KEY);
    setStorageValue(PASSWORD_TOKENS_KEY, [
      ...tokens,
      {
        token: createId(),
        userId: user.id,
        email: user.email,
        createdAt: new Date().toISOString(),
        used: false,
      },
    ]);
  }

  return ok({ sent: true });
}

export async function resetPassword(token: string, newPassword: string): Promise<MockApiResponse<boolean>> {
  await delay();

  const passwordError = validatePassword(newPassword);
  if (passwordError) {
    return fail('VALIDATION_ERROR', passwordError, 'password');
  }

  const tokens = readTokens(PASSWORD_TOKENS_KEY);
  const record = tokens.find((candidate) => candidate.token === token.trim() && !candidate.used);
  if (!record) {
    return fail('NOT_FOUND', RESET_NOT_FOUND);
  }

  const users = readUsers();
  const userIndex = users.findIndex((candidate) => candidate.id === record.userId);
  if (userIndex === -1) {
    return fail('NOT_FOUND', RESET_NOT_FOUND);
  }

  users[userIndex] = { ...users[userIndex], password: newPassword };
  writeUsers(users);
  setStorageValue(
    PASSWORD_TOKENS_KEY,
    tokens.map((candidate) => (candidate.token === record.token ? { ...candidate, used: true } : candidate)),
  );
  return ok(true);
}

export async function confirmEmail(token: string): Promise<MockApiResponse<boolean>> {
  await delay();

  const tokens = readTokens(CONFIRMATION_TOKENS_KEY);
  const record = tokens.find((candidate) => candidate.token === token.trim() && !candidate.used);
  if (!record) {
    return fail('NOT_FOUND', 'This confirmation link is invalid or has expired.');
  }

  const users = readUsers();
  const userIndex = users.findIndex((candidate) => candidate.id === record.userId);
  if (userIndex === -1) {
    return fail('NOT_FOUND', 'This confirmation link is invalid or has expired.');
  }

  users[userIndex] = { ...users[userIndex], emailConfirmed: true };
  writeUsers(users);
  setStorageValue(
    CONFIRMATION_TOKENS_KEY,
    tokens.map((candidate) => (candidate.token === record.token ? { ...candidate, used: true } : candidate)),
  );
  return ok(true);
}

export function getLatestConfirmationToken(): string | null {
  return findLatestUnusedToken(CONFIRMATION_TOKENS_KEY);
}

export function getLatestPasswordResetToken(): string | null {
  return findLatestUnusedToken(PASSWORD_TOKENS_KEY);
}
