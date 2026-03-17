import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";
import { officeCards, siteNavigation } from "@/data/site-content";

export function SiteFooter() {
  return (
    <footer className="site-footer-shell">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_0.9fr_0.8fr] lg:px-10">
        <div className="space-y-5">
          <BrandMark
            href="/"
            mode="light"
            subtitle="Firma juridica corporativa"
            variant="site"
          />
          <p className="site-footer-muted max-w-md text-sm leading-7">
            Asesoria juridica para empresas, socios y equipos directivos con
            una presencia institucional clara, sobria y confiable.
          </p>
        </div>

        <div>
          <p className="site-footer-faint mb-4 text-xs font-semibold tracking-[0.28em] uppercase">
            Navegacion
          </p>
          <div className="site-footer-muted grid gap-3 text-sm">
            {siteNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="transition-colors hover:text-[color:var(--site-text-kicker-strong)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <p className="site-footer-faint mb-4 text-xs font-semibold tracking-[0.28em] uppercase">
            Cobertura
          </p>
          <div className="site-footer-muted space-y-3 text-sm">
            {officeCards.map((office) => (
              <div key={office.ciudad}>
                <p className="font-medium text-white">{office.ciudad}</p>
                <p>{office.detalle}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
