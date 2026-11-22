'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthCard from '@/components/AuthCard';
import FormField from '@/components/FormField';
import { Button } from '@/components/ui/button';
import { signIn } from '@/api/mockAuthApi';
import { getProfile } from '@/api/mockProfileApi';
import { validateEmail } from '@/api/validation';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) {
      return;
    }

    const nextEmailError = validateEmail(email);
    const nextPasswordError = password ? null : 'Password is required.';
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setApiError(null);
    if (nextEmailError || nextPasswordError) {
      return;
    }

    setPending(true);
    const signInResponse = await signIn({ email: email.trim(), password });
    if (signInResponse.error || !signInResponse.data) {
      setPending(false);
      setApiError(signInResponse.error?.message ?? 'Could not sign in. Please try again.');
      if (signInResponse.error?.code === 'AUTH_ERROR') {
        setPassword('');
      }
      return;
    }

    const profileResponse = await getProfile(signInResponse.data.userId);
    if (profileResponse.error) {
      setPending(false);
      setApiError(profileResponse.error.message);
      return;
    }
    navigate(profileResponse.data ? '/dashboard' : '/onboarding');
  };

  return (
    <AuthCard title="Log in" description="Sign in to continue to FoodPulse.">
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
        <FormField
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={passwordError}
          disabled={pending}
          required
        />

        {apiError ? (
          <p role="alert" className="text-sm text-destructive">
            {apiError}
          </p>
        ) : null}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Signing in…' : 'Log in'}
        </Button>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <Link to="/forgot-password" className="font-medium text-primary underline-offset-4 hover:underline">
            Forgot password?
          </Link>
          <p>
            Don&apos;t have an account?{' '}
            <Link to="/signup" className="font-medium text-primary underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </AuthCard>
  );
}
