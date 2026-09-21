/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * React 19-compatible Theme Provider
 * Replaces next-themes client-side <script> injection to eliminate:
 * "Encountered a script tag while rendering React component. Scripts inside React components are never executed when rendering on the client."
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';

export interface ThemeProviderProps {
  children?: React.ReactNode;
  attribute?: string;
  defaultTheme?: string;
  enableSystem?: boolean;
  storageKey?: string;
  themes?: string[];
  forcedTheme?: string;
  disableTransitionOnChange?: boolean;
}

export interface UseThemeProps {
  theme?: string;
  setTheme: (theme: string) => void;
  resolvedTheme?: string;
  themes: string[];
  systemTheme?: 'light' | 'dark';
  forcedTheme?: string;
}

const ThemeContext = createContext<UseThemeProps>({
  theme: 'light',
  setTheme: () => {},
  resolvedTheme: 'light',
  themes: ['light', 'dark'],
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  attribute = 'class',
  defaultTheme = 'light',
  enableSystem = false,
  storageKey = 'theme',
  themes = ['light', 'dark'],
  forcedTheme,
}) => {
  const [theme, setThemeState] = useState<string>(() => {
    if (typeof window === 'undefined') return defaultTheme;
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return stored;
    } catch {
      /* ignore */
    }
    return defaultTheme;
  });

  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (!enableSystem || typeof window === 'undefined') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystemTheme(mq.matches ? 'dark' : 'light');
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [enableSystem]);

  const resolvedTheme = useMemo(() => {
    if (forcedTheme) return forcedTheme;
    if (theme === 'system') return systemTheme;
    return theme || defaultTheme;
  }, [forcedTheme, theme, systemTheme, defaultTheme]);

  const applyTheme = useCallback(
    (targetTheme: string) => {
      if (typeof window === 'undefined') return;
      const root = document.documentElement;
      if (attribute === 'class') {
        themes.forEach((t) => root.classList.remove(t));
        if (targetTheme) root.classList.add(targetTheme);
      } else if (attribute.startsWith('data-')) {
        if (targetTheme) root.setAttribute(attribute, targetTheme);
        else root.removeAttribute(attribute);
      }
    },
    [attribute, themes],
  );

  useEffect(() => {
    applyTheme(resolvedTheme);
  }, [resolvedTheme, applyTheme]);

  const setTheme = useCallback(
    (newTheme: string) => {
      setThemeState(newTheme);
      try {
        localStorage.setItem(storageKey, newTheme);
      } catch {
        /* ignore */
      }
    },
    [storageKey],
  );

  const contextValue = useMemo(
    () => ({
      theme,
      setTheme,
      resolvedTheme,
      themes: enableSystem ? [...themes, 'system'] : themes,
      systemTheme: enableSystem ? systemTheme : undefined,
      forcedTheme,
    }),
    [theme, setTheme, resolvedTheme, themes, enableSystem, systemTheme, forcedTheme],
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};
