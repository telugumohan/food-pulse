import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { confirmEmail as mockConfirmEmail } from '@/api/mockAuthApi';
import { getProfile } from '@/api/supabaseApi';
import AuthCard from '@/components/AuthCard';
import { Button } from '@/components/ui/button';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let mounted = true;

    async function handleAuthCallback() {
      try {
        // PRD §4.4: read session or hash from URL
        const { data, error } = await supabase.auth.getSession();

        if (data?.session?.user) {
          const pRes = await getProfile(data.session.user.id);
          if (mounted) {
            navigate(pRes.data ? '/dashboard' : '/onboarding', { replace: true });
          }
          return;
        }

        if (token) {
          const mockRes = await mockConfirmEmail(token);
          if (mockRes.error) {
            if (mounted) {
              setStatus('error');
              setErrorMsg(mockRes.error.message);
            }
          } else if (mounted) {
            setStatus('success');
          }
          return;
        }

        if (error) {
          if (mounted) {
            setStatus('error');
            setErrorMsg(error.message);
          }
        } else if (mounted) {
          setStatus('success');
        }
      } catch {
        if (mounted) {
          setStatus('error');
          setErrorMsg('Confirmation link is invalid or expired. Request a new sign-in or recovery email.');
        }
      }
    }

    void handleAuthCallback();

    return () => {
      mounted = false;
    };
  }, [token, navigate]);

  if (status === 'loading') {
    return (
      <AuthCard title="Verifying your account…" description="Please wait while we finalize authentication." />
    );
  }

  if (status === 'error') {
    return (
      <AuthCard title="Authentication Failed" description={errorMsg}>
        <Button className="w-full" onClick={() => navigate('/login')}>
          Go to sign in
        </Button>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Success!" description="Your account is confirmed. You can now sign in.">
      <Button className="w-full" onClick={() => navigate('/login')}>
        Sign in
      </Button>
    </AuthCard>
  );
}
