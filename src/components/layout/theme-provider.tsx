'use client';

import * as React from 'react';

type Theme = 'light' | 'dark';

type ThemeContextValue = { theme: Theme; setTheme: (theme: Theme) => void; toggle: () => void };

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: 'light',
  setTheme: () => {},
  toggle: () => {},
});

const STORAGE_KEY = 'flow360.theme';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // `ThemeScript` has already applied the class before paint, so the initial
  // value is read back off the document rather than resolved a second time.
  const [theme, setThemeState] = React.useState<Theme>(() =>
    typeof document !== 'undefined' &&
    document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light',
  );

  const setTheme = React.useCallback((next: Theme) => {
    setThemeState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable in private browsing — the choice just won't persist.
    }
  }, []);

  /**
   * Owns the classes on `<html>`, and keeps them alive across a server
   * re-render.
   *
   * `ThemeScript` writes `js` and `dark` before paint, but the server's markup
   * for `<html>` carries no className at all. Anything that re-renders the root
   * layout on the client — `router.refresh()`, which runs right after sign-in —
   * makes React reconcile that element and reset the attribute to the server
   * value, silently dropping both classes. A dark-mode user landed on a light
   * dashboard.
   *
   * Re-asserting here is the repair. It watches the attribute rather than
   * polling, and writes only when the value is actually wrong, so it cannot
   * loop.
   */
  React.useEffect(() => {
    const root = document.documentElement;
    const wantsDark = theme === 'dark';

    const apply = () => {
      root.classList.add('js');
      root.classList.toggle('dark', wantsDark);
    };

    apply();

    const observer = new MutationObserver(() => {
      if (root.classList.contains('dark') !== wantsDark || !root.classList.contains('js')) {
        apply();
      }
    });
    observer.observe(root, { attributes: true, attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, [theme]);

  const value = React.useMemo(
    () => ({ theme, setTheme, toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark') }),
    [theme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => React.useContext(ThemeContext);

/** Applies the stored theme before paint so there is no flash of the wrong palette. */
export function ThemeScript() {
  // Also marks the document as scripted, before paint. Scroll reveals hide
  // their content only under that flag, so with JavaScript disabled the page
  // renders fully visible instead of blank.
  const script = `(function(){var d=document.documentElement;d.classList.add('js');try{var t=localStorage.getItem('${STORAGE_KEY}');if(!t){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}if(t==='dark'){d.classList.add('dark')}}catch(e){}})();`;
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
