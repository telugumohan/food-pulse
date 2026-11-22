import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { resetPassword as mockResetPassword } from '@/api/mockAuthApi';
import { validatePassword } from '@/api/validation';
import AuthCard from '@/components/AuthCard';
import FormField from '@/components/FormField';
import { Button } from '@/components/ui/button';

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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    const nextPasswordError = validatePassword(newPassword);
    const nextConfirmPasswordError =
      confirmPassword === newPassword ? null : 'Passwords do not match.';
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);
    setApiError(null);
    if (nextPasswordError || nextConfirmPasswordError) return;

    setPending(true);

    try {
      // 1. Supabase updateUser (PRD §4.6)
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (!error) {
        await supabase.auth.signOut();
        navigate('/login');
        return;
      }

      if (token) {
        const mockRes = await mockResetPassword(token, newPassword);
        if (!mockRes.error) {
          navigate('/login');
          return;
        }
      }

      setPending(false);
      setApiError(error.message);
    } catch {
      setPending(false);
      setApiError('Unable to reset password. Please request a new reset link.');
    }
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
          disabled={pending}
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
          disabled={pending}
          required
        />

        {apiError && (
          <p role="alert" className="text-sm text-destructive">
            {apiError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Resetting…' : 'Reset password'}
        </Button>
      </form>
    </AuthCard>
  );
}
