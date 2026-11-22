import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { sendPasswordResetEmail as mockReset } from '@/api/mockAuthApi';
import { validateEmail } from '@/api/validation';
import AuthCard from '@/components/AuthCard';
import FormField from '@/components/FormField';
import { Button } from '@/components/ui/button';

export default function ForgotPasswordRoute() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    const trimmedEmail = email.trim().toLowerCase();
    const nextEmailError = validateEmail(trimmedEmail);
    setEmailError(nextEmailError);
    setApiError(null);
    if (nextEmailError) return;

    setPending(true);

    try {
      // PRD §4.5: resetPasswordForEmail
      await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      // Always show success screen to prevent account enumeration
      navigate('/password-reset-sent');
    } catch {
      try {
        await mockReset(trimmedEmail);
        navigate('/password-reset-sent');
      } catch {
        setPending(false);
        setApiError('Unable to connect. Try again.');
      }
    }
  };

  return (
    <AuthCard
      title="Forgot password"
      description="Enter your email and we will send you a password recovery link."
    >
      <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
        <FormField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          error={emailError}
          disabled={pending}
          required
        />

        {apiError && (
          <p role="alert" className="text-sm text-destructive">
            {apiError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Sending…' : 'Submit'}
        </Button>

        <p className="text-sm text-muted-foreground">
          Remembered your password?{' '}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
