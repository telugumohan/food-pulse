'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthCard from '@/components/AuthCard';
import { Button } from '@/components/ui/button';
import { confirmEmail, getLatestConfirmationToken } from '@/api/mockAuthApi';

export default function EmailConfirmation() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenConfirmationLink = async () => {
    if (pending) {
      return;
    }

    const token = getLatestConfirmationToken();
    if (!token) {
      setError('No confirmation link is available right now. Sign up again to get a new link.');
      return;
    }

    setError(null);
    setPending(true);
    const response = await confirmEmail(token);
    if (response.error) {
      setPending(false);
      setError(response.error.message);
      return;
    }
    navigate('/login');
  };

  return (
    <AuthCard
      title="Check your email"
      description="We sent a confirmation link to your email address. Open the link to confirm your account, then sign in."
    >
      <div className="flex w-full flex-col gap-3">
        <Button
          type="button"
          className="w-full"
          onClick={handleOpenConfirmationLink}
          disabled={pending}
        >
          {pending ? 'Confirming…' : 'Open confirmation link'}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => navigate('/login')}
          disabled={pending}
        >
          Go to sign in
        </Button>
        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>
    </AuthCard>
  );
}
