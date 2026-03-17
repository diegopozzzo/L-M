import type { ReactNode } from "react";
import { SiteThemeFrame } from "@/components/site/site-theme-frame";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return <SiteThemeFrame>{children}</SiteThemeFrame>;
}

