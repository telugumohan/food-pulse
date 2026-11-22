import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { signIn as mockSignIn } from '@/api/mockAuthApi';
import { getProfile } from '@/api/supabaseApi';
import { validateEmail } from '@/api/validation';
import AuthCard from '@/components/AuthCard';
import FormField from '@/components/FormField';
import { Button } from '@/components/ui/button';

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
    if (pending) return;

    const trimmedEmail = email.trim().toLowerCase();
    const nextEmailError = validateEmail(trimmedEmail);
    const nextPasswordError = password ? null : 'Password is required.';
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setApiError(null);
    if (nextEmailError || nextPasswordError) return;

    setPending(true);

    try {
      // 1. Attempt Supabase Auth signInWithPassword (PRD §4.2)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (!error && data?.user) {
        const pRes = await getProfile(data.user.id);
        navigate(pRes.data ? '/dashboard' : '/onboarding');
        return;
      }

      // If Supabase returned an auth or rate limit error
      if (error && error.message !== 'Failed to fetch') {
        setPending(false);
        setPassword('');
        if (error.status === 429 || error.message.toLowerCase().includes('rate')) {
          setApiError('Too many attempts. Try again later.');
        } else if (error.status === 400 || error.message.toLowerCase().includes('invalid')) {
          setApiError('Email or password is incorrect.');
        } else {
          setApiError(error.message);
        }
        return;
      }

      // 2. If Supabase is offline/unavailable, fallback to mock auth
      const mockRes = await mockSignIn({ email: trimmedEmail, password });
      if (mockRes.error || !mockRes.data) {
        setPending(false);
        setPassword('');
        setApiError(mockRes.error?.message ?? 'Email or password is incorrect.');
        return;
      }

      const pRes = await getProfile(mockRes.data.userId);
      navigate(pRes.data ? '/dashboard' : '/onboarding');
    } catch {
      setPending(false);
      setPassword('');
      setApiError('Unable to connect. Try again.');
    }
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

        {apiError && (
          <p role="alert" className="text-sm text-destructive">
            {apiError}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Signing in…' : 'Log in'}
        </Button>

        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
          <Link
            to="/forgot-password"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Forgot password?
          </Link>
          <p>
            Don&apos;t have an account?{' '}
            <Link
              to="/signup"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Sign up
            </Link>
          </p>
        </div>
      </form>
    </AuthCard>
  );
}
