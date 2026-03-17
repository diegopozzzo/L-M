"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";

type SiteTheme = "light" | "dark";

type SiteThemeContextValue = {
  theme: SiteTheme;
  hydrated: boolean;
  toggleTheme: () => void;
  setTheme: (theme: SiteTheme) => void;
};

const SITE_THEME_STORAGE_KEY = "lex-site-theme";

const SiteThemeContext = createContext<SiteThemeContextValue | null>(null);

export function useSiteTheme() {
  const context = useContext(SiteThemeContext);

  if (!context) {
    throw new Error("useSiteTheme debe usarse dentro de SiteThemeFrame.");
  }

  return context;
}

export function SiteThemeFrame({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<SiteTheme>("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedTheme = window.localStorage.getItem(
        SITE_THEME_STORAGE_KEY,
      ) as SiteTheme | null;

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

    window.localStorage.setItem(SITE_THEME_STORAGE_KEY, theme);
  }, [hydrated, theme]);

  const value = useMemo<SiteThemeContextValue>(
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
    <SiteThemeContext.Provider value={value}>
      <div
        suppressHydrationWarning
        className={`site-shell min-h-screen ${
          theme === "dark" ? "site-theme-dark" : "site-theme-light"
        }`}
        data-site-theme={theme}
      >
        <SiteHeader />
        <main className="pt-[5.25rem]">{children}</main>
        <SiteFooter />
      </div>
    </SiteThemeContext.Provider>
  );
}
