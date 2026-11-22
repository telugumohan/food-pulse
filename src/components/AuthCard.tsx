import type { ReactNode } from 'react';

interface AuthCardProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export default function AuthCard(props: AuthCardProps) {
  const { title, description, children } = props;

  return (
    <div
      data-nexen-component="AuthCard"
      className="flex min-h-screen w-full items-center justify-center bg-background px-4 py-10 font-sans text-foreground"
      style={{
        backgroundImage:
          'radial-gradient(60rem 32rem at 8% -8%, hsl(var(--primary) / 0.2), transparent 60%), radial-gradient(48rem 28rem at 100% 12%, hsl(var(--accent) / 0.55), transparent 62%)',
      }}
    >
      <div className="w-full max-w-md min-w-0">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius)] bg-primary text-sm font-bold text-primary-foreground shadow-sm"
           data-nexen-id="nx-10c31eb0-0">
            F
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground" data-nexen-id="nx-10c31eb0-1">FoodPulse</span>
        </div>

        <section className="rounded-[var(--radius)] border border-border bg-card/60 p-6 shadow-lg backdrop-blur-md sm:p-8" data-nexen-id="nx-10c31eb0-2">
          <header className="mb-6 min-w-0" data-nexen-id="nx-10c31eb0-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground break-words" data-nexen-id="nx-10c31eb0-4">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 text-sm text-muted-foreground break-words" data-nexen-id="nx-10c31eb0-5">{description}</p>
            ) : null}
          </header>

          <div className="min-w-0">{children}</div>
        </section>
      </div>
    </div>
  );
}