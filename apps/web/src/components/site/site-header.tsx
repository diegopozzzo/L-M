"use client";

import type { MouseEvent } from "react";
import Link from "next/link";
import { Menu, MoonStar, SunMedium, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import type { SiteSectionId } from "@/data/site-content";
import { siteNavigation } from "@/data/site-content";
import { useSiteTheme } from "@/components/site/site-theme-frame";

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SiteSectionId>("inicio");
  const { theme, toggleTheme } = useSiteTheme();

  const sectionIds = useMemo(
    () => siteNavigation.map((item) => item.sectionId),
    [],
  );

  useEffect(() => {
    if (pathname !== "/") {
      return;
    }

    const updateFromHash = () => {
      const hash = window.location.hash.replace("#", "") as SiteSectionId;

      if (sectionIds.includes(hash)) {
        setActiveSection(hash);
        return;
      }

      setActiveSection("inicio");
    };

    updateFromHash();

    const sections = sectionIds
      .map((sectionId) => document.getElementById(sectionId))
      .filter((section): section is HTMLElement => Boolean(section));

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];

        if (visibleEntry) {
          setActiveSection(visibleEntry.target.id as SiteSectionId);
        }
      },
      {
        rootMargin: "-34% 0px -48% 0px",
        threshold: [0.15, 0.35, 0.55],
      },
    );

    sections.forEach((section) => observer.observe(section));
    window.addEventListener("hashchange", updateFromHash);

    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", updateFromHash);
    };
  }, [pathname, sectionIds]);

  const isActive = (sectionId: SiteSectionId) =>
    pathname === "/" && activeSection === sectionId;

  const handleSectionClick =
    (sectionId: SiteSectionId) =>
    (event: MouseEvent<HTMLAnchorElement>) => {
      setOpen(false);
      setActiveSection(sectionId);

      if (pathname !== "/") {
        return;
      }

      const target = document.getElementById(sectionId);

      if (!target) {
        return;
      }

      event.preventDefault();

      const offsetTop = target.getBoundingClientRect().top + window.scrollY - 104;
      window.history.replaceState(null, "", `/#${sectionId}`);
      window.scrollTo({ top: Math.max(offsetTop, 0), behavior: "smooth" });
    };

  return (
    <header className="site-header-shell fixed inset-x-0 top-0 z-50 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
        <BrandMark mode={theme === "dark" ? "light" : "dark"} variant="site" />

        <nav className="site-header-nav hidden items-center gap-2 rounded-full px-3 py-2 lg:flex">
          {siteNavigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleSectionClick(item.sectionId)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                isActive(item.sectionId)
                  ? "site-nav-item-active"
                  : "site-nav-item"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <button
            type="button"
            onClick={toggleTheme}
            className="site-theme-toggle inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
          >
            {theme === "dark" ? (
              <SunMedium className="size-4" />
            ) : (
              <MoonStar className="size-4" />
            )}
            {theme === "dark" ? "Modo claro" : "Modo oscuro"}
          </button>
          <Link
            href="/#contacto"
            onClick={handleSectionClick("contacto")}
            className="site-button-primary rounded-full px-4 py-2 text-sm font-medium transition-colors"
          >
            Agenda reunion
          </Link>
        </div>

        <button
          type="button"
          className="site-icon-button inline-flex rounded-full p-2 lg:hidden"
          onClick={() => setOpen((value) => !value)}
          aria-label="Abrir menu"
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open ? (
        <div className="site-mobile-sheet px-5 py-4 lg:hidden">
          <nav className="flex flex-col gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="site-theme-toggle inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-colors"
            >
              {theme === "dark" ? (
                <SunMedium className="size-4" />
              ) : (
                <MoonStar className="size-4" />
              )}
              {theme === "dark" ? "Modo claro" : "Modo oscuro"}
            </button>
            {siteNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleSectionClick(item.sectionId)}
                className={`rounded-2xl px-4 py-3 text-sm transition-colors ${
                  isActive(item.sectionId)
                    ? "site-nav-item-active"
                    : "site-nav-item"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/#contacto"
              onClick={handleSectionClick("contacto")}
              className="site-button-primary mt-2 inline-flex items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold"
            >
              Agenda reunion
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
