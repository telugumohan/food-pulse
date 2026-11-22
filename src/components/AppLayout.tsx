import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useSession } from '@/hooks/useSession';

interface TabItem {
  label: string;
  to: string;
}

const TABS: readonly TabItem[] = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Donate', to: '/donate' },
  { label: 'Receive', to: '/receive' },
  { label: 'Volunteer', to: '/volunteer' },
  { label: 'More', to: '/more' },
];

export default function AppLayout() {
  const { logout } = useSession();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div data-nexen-component="AppLayout" className="flex min-h-screen w-full flex-col bg-background text-foreground">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <span className="text-lg font-bold tracking-tight">FoodPulse</span>
        <Button type="button" variant="outline" size="sm" onClick={() => void handleLogout()}>
          Log out
        </Button>
      </header>

      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-6 pb-24">
        <Outlet />
      </main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-background/95 backdrop-blur"
      >
        <ul className="mx-auto grid max-w-xl grid-cols-5">
          {TABS.map((tab) => (
            <li key={tab.to}>
              <NavLink
                to={tab.to}
                className={({ isActive }) =>
                  `flex h-14 items-center justify-center text-xs font-semibold ${
                    isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                {tab.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
