import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';

export default function Home() {
  const { session, profile, loading } = useSession();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!session) {
      navigate('/login', { replace: true });
    } else if (!profile) {
      navigate('/onboarding', { replace: true });
    } else {
      navigate('/dashboard', { replace: true });
    }
  }, [session, profile, loading, navigate]);

  return (
    <main className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-12 text-foreground">
      <p className="text-sm text-muted-foreground">Redirecting to FoodPulse…</p>
    </main>
  );
}
