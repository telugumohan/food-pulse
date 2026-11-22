import { Link } from 'react-router-dom';

export interface SetupPromptListProps {
  hasDonorProfile?: boolean;
  hasReceiverProfile?: boolean;
  hasVolunteerProfile?: boolean;
}

type SetupKey = 'donor' | 'receiver' | 'volunteer';

interface SetupStep {
  key: SetupKey;
  title: string;
  description: string;
  to: string;
  cta: string;
}

const SETUP_STEPS: SetupStep[] = [
  {
    key: 'donor',
    title: 'Become a donor',
    description: 'Post surplus food with pickup windows and storage notes.',
    to: '/onboarding/donor',
    cta: 'Set up donor',
  },
  {
    key: 'receiver',
    title: 'Want to receive food?',
    description: 'Create a receiving profile for your shelter, pantry or kitchen.',
    to: '/onboarding/receiver',
    cta: 'Set up receiver',
  },
  {
    key: 'volunteer',
    title: 'Work as a volunteer',
    description: 'Pick up and drop off deliveries when your schedule is open.',
    to: '/onboarding/volunteer',
    cta: 'Set up volunteer',
  },
];

export function SetupPromptList(props: SetupPromptListProps) {
  const {
    hasDonorProfile = false,
    hasReceiverProfile = false,
    hasVolunteerProfile = false,
  } = props ?? {};

  const completed: Record<SetupKey, boolean> = {
    donor: hasDonorProfile,
    receiver: hasReceiverProfile,
    volunteer: hasVolunteerProfile,
  };

  const pendingSteps = SETUP_STEPS.filter((step) => !completed[step.key]);

  if (pendingSteps.length === 0) {
    return (
      <div
        data-nexen-component="SetupPromptList"
        className="w-full min-w-0 rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm"
      >
        <p className="text-sm text-muted-foreground" data-nexen-id="nx-c39e5f5e-0">
          You have completed all set-up steps.
        </p>
      </div>
    );
  }

  return (
    <ul
      data-nexen-component="SetupPromptList"
      className="grid w-full min-w-0 gap-4"
     data-nexen-id="nx-c39e5f5e-1">
      {pendingSteps.map((step) => (
        <li
          key={step.key}
          className="flex w-full min-w-0 flex-col gap-3 rounded-[var(--radius)] border border-border bg-card p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between"
         data-nexen-id="nx-c39e5f5e-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold tracking-tight text-foreground" data-nexen-id="nx-c39e5f5e-3">
              {step.title}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground" data-nexen-id="nx-c39e5f5e-4">
              {step.description}
            </p>
          </div>
          <Link
            to={step.to}
            className="inline-flex shrink-0 items-center justify-center rounded-[var(--radius)] border border-border bg-transparent px-4 py-2.5 text-sm font-semibold text-foreground"
           data-nexen-id="nx-c39e5f5e-5">
            {step.cta}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default SetupPromptList;