import type { ReactNode } from 'react';

export interface UsePageShellProps {
  children: ReactNode;
  header?: ReactNode;
  maxWidth?: 'md' | 'lg' | 'xl' | 'full';
}

const maxWidthClasses: Record<NonNullable<UsePageShellProps['maxWidth']>, string> = {
  md: 'max-w-3xl',
  lg: 'max-w-5xl',
  xl: 'max-w-[1120px]',
  full: 'max-w-none',
};

export interface UsePageShellResult {
  containerClass: string;
  contentClass: string;
}

export function usePageShell({ maxWidth = 'xl' }: UsePageShellProps): UsePageShellResult {
  return {
    containerClass: 'bg-bg min-h-screen flex flex-col',
    contentClass: `${maxWidthClasses[maxWidth]} mx-auto w-full px-md md:px-lg lg:px-xl py-lg flex-1`,
  };
}
