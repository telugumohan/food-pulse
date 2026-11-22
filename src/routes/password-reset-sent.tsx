'use client';

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthCard from '@/components/AuthCard';
import { Button } from '@/components/ui/button';
import { getLatestPasswordResetToken } from '@/api/mockAuthApi';

export default function PasswordResetSent() {
  const navigate = useNavigate();
  const [linkError, setLinkError] = useState<string | null>(null);

  const handleOpenResetLink = () => {
    const token = getLatestPasswordResetToken();
    if (!token) {
      setLinkError('No reset link is available right now. Request a new password reset link.');
      return;
    }
    setLinkError(null);
    navigate(`/reset-password?token=${encodeURIComponent(token)}`);
  };

  const handleBackToSignIn = () => {
    navigate('/login');
  };

  return (
    <div data-nexen-component="PasswordResetSent" className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto w-full max-w-md min-w-0">
        <AuthCard
          title="Password reset link sent"
          description="If an account exists for this email, a password reset link has been sent."
        >
          <div className="flex w-full flex-col gap-3">
            <Button type="button" className="w-full" onClick={handleOpenResetLink} data-nexen-id="nx-8de218c6-0">
              Open reset link
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleBackToSignIn}
             data-nexen-id="nx-8de218c6-1">
              Back to sign in
            </Button>
            {linkError && (
              <p role="alert" className="text-sm text-destructive" data-nexen-id="nx-8de218c6-2">
                {linkError}
              </p>
            )}
          </div>
        </AuthCard>
      </div>
    </div>
  );
}