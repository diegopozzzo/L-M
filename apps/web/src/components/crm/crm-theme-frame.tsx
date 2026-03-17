"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type CrmTheme = "light" | "dark";

type CrmThemeContextValue = {
  theme: CrmTheme;
  hydrated: boolean;
  toggleTheme: () => void;
  setTheme: (theme: CrmTheme) => void;
};

const CRM_THEME_STORAGE_KEY = "lex-crm-theme";

const CrmThemeContext = createContext<CrmThemeContextValue | null>(null);

export function useCrmTheme() {
  const context = useContext(CrmThemeContext);

  if (!context) {
    throw new Error("useCrmTheme debe usarse dentro de CrmThemeFrame.");
  }

  return context;
}

export function CrmThemeFrame({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<CrmTheme>("dark");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedTheme = window.localStorage.getItem(
        CRM_THEME_STORAGE_KEY,
      ) as CrmTheme | null;

      if (storedTheme === "light" || storedTheme === "dark") {
        setTheme(storedTheme);
        setHydrated(true);
        return;
      }

      setTheme(
        window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light",
      );
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    window.localStorage.setItem(CRM_THEME_STORAGE_KEY, theme);
  }, [hydrated, theme]);

  const value = useMemo<CrmThemeContextValue>(
    () => ({
      theme,
      hydrated,
      toggleTheme: () =>
        setTheme((currentTheme) =>
          currentTheme === "light" ? "dark" : "light",
        ),
      setTheme,
    }),
    [hydrated, theme],
  );

  return (
    <CrmThemeContext.Provider value={value}>
      <div
        suppressHydrationWarning
        className={`crm-shell min-h-screen ${
          theme === "dark" ? "crm-theme-dark" : "crm-theme-light"
        }`}
        data-crm-theme={theme}
      >
        {children}
      </div>
    </CrmThemeContext.Provider>
  );
}
