import type { ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';

import { ensureSeedData } from './api/mockSeed';
import AppLayout from './components/AppLayout';
import { Button } from './components/ui/button';
import { useSession } from './hooks/useSession';
import HomePage from './routes/home';
import DashboardPage from './routes/dashboard';
import DonatePage from './routes/donate';
import CreateDonationPage from './routes/donate-create';
import DonorOnboardingPage from './routes/donate-onboarding';
import EmailConfirmationSentPage from './routes/email-confirmation';
import AuthCallbackPage from './routes/auth-callback';
import ForgotPasswordPage from './routes/forgot-password';
import LoginPage from './routes/login';
import MorePage from './routes/more';
import OnboardingPage from './routes/onboarding';
import PasswordResetSentPage from './routes/password-reset-sent';
import ProfilePage from './routes/profile';
import ReceivePage from './routes/receive';
import CreateFoodRequestPage from './routes/receive-create';
import ReceiverOnboardingPage from './routes/receive-onboarding';
import ResetPasswordPage from './routes/reset-password';
import SignUpPage from './routes/signup';
import VolunteerPage from './routes/volunteer';
import VolunteerOnboardingPage from './routes/volunteer-onboarding';

ensureSeedData();

function StatusMessage({ text, isError = false }: { text: string; isError?: boolean }) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center justify-center px-4 py-8 text-foreground">
      <p
        role={isError ? 'alert' : 'status'}
        className={isError ? 'text-sm text-destructive' : 'text-sm text-muted-foreground'}
      >
        {text}
      </p>
    </main>
  );
}

function ProtectedRoute({
  allowWithoutProfile = false,
  children,
}: {
  allowWithoutProfile?: boolean;
  children: ReactNode;
}) {
  const { session, profile, loading, error } = useSession();

  if (loading) {
    return <StatusMessage text="Loading your session…" />;
  }
  if (error) {
    return <StatusMessage text={error} isError />;
  }
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  if (!profile && !allowWithoutProfile) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
}

function NotFoundPage() {
  const { session, loading } = useSession();
  const navigate = useNavigate();

  if (loading) {
    return <StatusMessage text="Loading…" />;
  }

  const target = session ? '/dashboard' : '/login';
  const label = session ? 'Go to dashboard' : 'Go to sign in';

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-8 text-center text-foreground">
      <h1 className="text-2xl font-bold tracking-tight">Page not found</h1>
      <p className="text-sm text-muted-foreground">The page you are looking for does not exist.</p>
      <Button type="button" onClick={() => navigate(target)}>
        {label}
      </Button>
    </main>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div data-nexen-component="AppShell" className="min-h-screen bg-background text-foreground">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />
          <Route path="/email-confirmation" element={<EmailConfirmationSentPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute allowWithoutProfile>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />
          <Route path="/password-reset-sent" element={<PasswordResetSentPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/donate" element={<DonatePage />} />
            <Route path="/donate/create" element={<CreateDonationPage />} />
            <Route path="/donate/onboarding" element={<DonorOnboardingPage />} />
            <Route path="/more" element={<MorePage />} />
            <Route path="/receive" element={<ReceivePage />} />
            <Route path="/receive/create" element={<CreateFoodRequestPage />} />
            <Route path="/receive/onboarding" element={<ReceiverOnboardingPage />} />
            <Route path="/volunteer" element={<VolunteerPage />} />
            <Route path="/volunteer/onboarding" element={<VolunteerOnboardingPage />} />
          </Route>

          <Route path="/*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
