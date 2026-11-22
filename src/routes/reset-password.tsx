'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AuthCard from '@/components/AuthCard';
import FormField from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { resetPassword } from '@/api/mockAuthApi';
import { validatePassword } from '@/api/validation';

const MISSING_TOKEN_ERROR = 'This reset link is missing its token. Request a new password reset link.';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = (searchParams.get('token') ?? '').trim();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const shownError = apiError ?? (token ? null : MISSING_TOKEN_ERROR);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) {
      return;
    }

    if (!token) {
      return;
    }

    const nextPasswordError = validatePassword(newPassword);
    const nextConfirmPasswordError = confirmPassword === newPassword ? null : 'Passwords do not match.';
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);
    setApiError(null);
    if (nextPasswordError || nextConfirmPasswordError) {
      return;
    }

    setPending(true);
    const response = await resetPassword(token, newPassword);
    if (response.error) {
      setPending(false);
      setApiError(response.error.message);
      setNewPassword('');
      setConfirmPassword('');
      return;
    }
    navigate('/login');
  };

  return (
    <AuthCard title="Reset password" description="Choose a new password for your account.">
      <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
        <FormField
          label="New password"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          error={passwordError}
          hint="At least 8 characters, including a letter, a number and a special character."
          disabled={pending || !token}
          required
        />
        <FormField
          label="Confirm new password"
          name="confirmNewPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          error={confirmPasswordError}
          disabled={pending || !token}
          required
        />

        {shownError ? (
          <p role="alert" className="text-sm text-destructive">
            {shownError}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending || !token}>
          {pending ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
    </AuthCard>
  );
}
