import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import React from 'react';
import { useDocumentListFilters } from '../useDocumentListFilters';
import { DEFAULTS } from '../defaults';

function wrapper(initialEntries: string[] = ['/']) {
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(MemoryRouter, { initialEntries }, children);
}

describe('useDocumentListFilters (integration)', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns defaults when URL has no params', () => {
    const { result } = renderHook(() => useDocumentListFilters(), { wrapper: wrapper() });
    expect(result.current.filters).toEqual(DEFAULTS);
  });

  it('parses initial URL params', () => {
    const { result } = renderHook(() => useDocumentListFilters(), {
      wrapper: wrapper(['/?risk=high&sort=date&page=3']),
    });
    expect(result.current.filters.risk).toBe('high');
    expect(result.current.filters.sort).toBe('date');
    expect(result.current.filters.page).toBe(3);
  });

  it('setFilters updates the URL and resets page to 1', () => {
    const { result } = renderHook(() => useDocumentListFilters(), {
      wrapper: wrapper(['/?page=5']),
    });
    act(() => { result.current.setFilters({ risk: 'high' }); });
    expect(result.current.filters.risk).toBe('high');
    expect(result.current.filters.page).toBe(1);
  });

  it('setFilters preserves explicit page when included in patch', () => {
    const { result } = renderHook(() => useDocumentListFilters(), { wrapper: wrapper() });
    act(() => { result.current.setFilters({ page: 4 }); });
    expect(result.current.filters.page).toBe(4);
  });

  it('setQueryText debounces q update by 250 ms', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useDocumentListFilters(), { wrapper: wrapper() });

    act(() => { result.current.setQueryText('ac'); });
    expect(result.current.filters.q).toBe('');

    act(() => { vi.advanceTimersByTime(249); });
    expect(result.current.filters.q).toBe('');

    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current.filters.q).toBe('ac');
  });

  it('setQueryText resets page to 1 after debounce fires', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useDocumentListFilters(), {
      wrapper: wrapper(['/?page=3']),
    });

    act(() => { result.current.setQueryText('search'); });
    act(() => { vi.advanceTimersByTime(250); });

    expect(result.current.filters.q).toBe('search');
    expect(result.current.filters.page).toBe(1);
  });
});
