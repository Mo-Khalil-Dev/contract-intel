import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LogoutIcon } from '@/components/core/icons';
import { useTopNav, type UseTopNavProps } from './useTopNav';

export function TopNav(props: UseTopNavProps) {
  const { links, user, onSignOut } = props;
  const { initials } = useTopNav(props);

  return (
    <nav className="bg-nav text-surface border-nav-border w-full border-b" aria-label="Primary">
      <div className="mx-auto flex max-w-[1120px] items-center gap-md px-md py-sm md:px-lg">
        <a href="/" className="font-extrabold tracking-tight text-base">
          ContractIntel
        </a>

        <ul className="hidden md:flex items-center gap-md ml-md">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                aria-current={link.current ? 'page' : undefined}
                className={
                  link.current
                    ? 'text-surface text-sm font-semibold'
                    : 'text-ink-mute text-sm hover:text-surface'
                }
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {user && (
          <div className="ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label="User menu"
                className="focus-visible:ring-blue-mid rounded-full focus-visible:ring-2 focus-visible:outline-none"
              >
                <Avatar className="h-8 w-8">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="text-ink text-sm font-semibold">{user.name}</div>
                  <div className="text-ink-soft text-xs">{user.email}</div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onSignOut}>
                  <LogoutIcon className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </nav>
  );
}
