import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { signUp as mockSignUp } from '@/api/mockAuthApi';
import { validateEmail, validateFullName, validatePassword } from '@/api/validation';
import AuthCard from '@/components/AuthCard';
import FormField from '@/components/FormField';
import { Button } from '@/components/ui/button';

export default function Signup() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (pending) return;

    const trimmedFullName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();

    const nextFullNameError = validateFullName(trimmedFullName);
    const nextEmailError = validateEmail(trimmedEmail);
    const nextPasswordError = validatePassword(password);
    const nextConfirmPasswordError =
      confirmPassword === password ? null : 'Passwords do not match.';

    setFullNameError(nextFullNameError);
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    setConfirmPasswordError(nextConfirmPasswordError);
    setApiError(null);

    if (nextFullNameError || nextEmailError || nextPasswordError || nextConfirmPasswordError) {
      return;
    }

    setPending(true);

    try {
      // 1. Supabase signUp (PRD §4.3)
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: { full_name: trimmedFullName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/onboarding`,
        },
      });

      if (!error && data?.user) {
        navigate('/email-confirmation');
        return;
      }

      if (error && error.message !== 'Failed to fetch') {
        setPending(false);
        setPassword('');
        setConfirmPassword('');
        setApiError(error.message);
        return;
      }

      // 2. Fallback to mock signUp if offline
      const mockRes = await mockSignUp({
        fullName: trimmedFullName,
        email: trimmedEmail,
        password,
      });

      if (mockRes.error) {
        setPending(false);
        setPassword('');
        setConfirmPassword('');
        setApiError(mockRes.error.message);
        return;
      }

      navigate('/email-confirmation');
    } catch {
      setPending(false);
      setPassword('');
      setConfirmPassword('');
      setApiError('Unable to connect. Try again.');
    }
  };

  return (
    <AuthCard title="Create account" description="Sign up to start donating or receiving food.">
      <form noValidate onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
        <FormField
          label="Full name"
          name="fullName"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          error={fullNameError}
          disabled={pending}
          required
        />
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
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          error={passwordError}
          hint="At least 8 characters, including a letter, a number and a special character."
          disabled={pending}
          required
        />
        <FormField
          label="Confirm password"
          name="confirmPassword"
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
          {pending ? 'Signing up…' : 'Sign up'}
        </Button>

        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </AuthCard>
  );
}
