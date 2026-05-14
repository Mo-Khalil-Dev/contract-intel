import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { LogoutButton } from './LogoutButton';
import * as authHooks from '@/hooks/useAuth';

const mockLogout = jest.fn();

jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

describe('LogoutButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (authHooks.useAuth as jest.Mock).mockReturnValue({
      logout: mockLogout,
      logoutIsLoading: false,
    });
  });

  it('renders logout button', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LogoutButton />
      </QueryClientProvider>,
    );
    const button = screen.getByRole('button', { name: /log out/i });
    expect(button).toBeInTheDocument();
  });

  it('calls logout when clicked', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LogoutButton />
      </QueryClientProvider>,
    );
    const button = screen.getByRole('button', { name: /log out/i });
    fireEvent.click(button);
    expect(mockLogout).toHaveBeenCalled();
  });

  it('shows loading state while logging out', () => {
    (authHooks.useAuth as jest.Mock).mockReturnValue({
      logout: mockLogout,
      logoutIsLoading: true,
    });

    render(
      <QueryClientProvider client={new QueryClient()}>
        <LogoutButton />
      </QueryClientProvider>,
    );
    const button = screen.getByRole('button', { name: /logging out/i });
    expect(button).toBeDisabled();
  });

  it('has proper ARIA label', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LogoutButton />
      </QueryClientProvider>,
    );
    const button = screen.getByRole('button', { name: /log out/i });
    expect(button).toHaveAttribute('aria-label', 'Log out');
  });

  it('has touch target ≥44px', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LogoutButton />
      </QueryClientProvider>,
    );
    const button = screen.getByRole('button');
    const styles = window.getComputedStyle(button);
    const minHeight = styles.minHeight;
    const minWidth = styles.minWidth;
    expect(minHeight).toBe('44px');
    expect(minWidth).toBe('44px');
  });
});
