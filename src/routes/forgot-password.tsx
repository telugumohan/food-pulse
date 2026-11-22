'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '@/components/AuthCard';
import FormField from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { sendPasswordResetEmail } from '@/api/mockAuthApi';
import { validateEmail } from '@/api/validation';

export default function ForgotPasswordRoute() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) {
      return;
    }

    const nextEmailError = validateEmail(email);
    setEmailError(nextEmailError);
    setApiError(null);
    if (nextEmailError) {
      return;
    }

    setPending(true);
    const response = await sendPasswordResetEmail(email.trim());
    if (response.error) {
      setPending(false);
      setApiError(response.error.message);
      return;
    }
    navigate('/password-reset-sent');
  };

  return (
    <AuthCard title="Forgot password" description="Enter your email and we will send you a reset link.">
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

        {apiError ? (
          <p role="alert" className="text-sm text-destructive">
            {apiError}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Sending…' : 'Submit'}
        </Button>

        <p className="text-sm text-muted-foreground">
          Remembered it?{' '}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Back to sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
