export interface NavLink {
  href: string;
  label: string;
  current?: boolean;
}

export interface UseTopNavProps {
  links: NavLink[];
  user?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
  onSignOut?: () => void;
}

export interface UseTopNavResult {
  initials: string;
}

function computeInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

export function useTopNav({ user }: UseTopNavProps): UseTopNavResult {
  return {
    initials: user ? computeInitials(user.name) : '',
  };
}
