import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Compass,
  Handshake,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteContactForm } from "@/components/site/site-contact-form";
import {
  contactChannels,
  heroMetrics,
  insightCards,
  officeCards,
  operatingHighlights,
  practiceAreas,
  processSteps,
  teamMembers,
  values,
} from "@/data/site-content";

export const metadata: Metadata = {
  title: "Inicio",
  description:
    "Firma juridica con presencia corporativa, enfoque ejecutivo y acompanamiento legal para empresas y directorios.",
};

const heroBadges = [
  "Respuesta inicial clara en 24 horas",
  "Seguimiento ejecutivo sin perder detalle tecnico",
  "Cobertura coordinada para asuntos multisede",
];

export default function HomePage() {
  return (
    <div className="pb-24">
      <section
        id="inicio"
        className="scroll-mt-32 px-5 py-8 sm:px-8 lg:px-10"
      >
        <div className="site-hero-frame hero-grid site-hero-stage relative overflow-hidden rounded-[2.35rem]">
          <div className="site-hero-orb-left animate-float-soft" />
          <div
            className="site-hero-orb-right animate-float-soft"
            style={{ animationDelay: "1.2s" }}
          />
          <div className="site-hero-mesh" />

          <div className="mx-auto grid max-w-7xl gap-12 px-6 py-14 lg:grid-cols-[1.08fr_0.92fr] lg:px-10 lg:py-20">
            <div className="relative z-10 space-y-8">
              <div
                className="animate-fade-up space-y-5"
                style={{ animationDelay: "80ms" }}
              >
                <p className="site-kicker text-xs font-semibold site-text-kicker-strong">
                  Estudio juridico corporativo y litigios
                </p>
                <div className="space-y-4">
                  <h1 className="site-text-strong max-w-4xl font-display text-5xl leading-none sm:text-6xl lg:text-7xl">
                    Estrategia legal con presencia ejecutiva y control fino de
                    cada frente activo.
                  </h1>
                  <p className="site-hero-muted max-w-2xl text-base leading-8 sm:text-lg">
                    La pagina ahora funciona como una sola narrativa continua:
                    permite entender a la firma, recorrer sus capacidades y
                    llegar al contacto sin perder el hilo ni abandonar la
                    lectura.
                  </p>
                </div>
              </div>

              <div
                className="flex flex-col gap-3 sm:flex-row animate-fade-up"
                style={{ animationDelay: "160ms" }}
              >
                <Link
                  href="/#contacto"
                  className="site-button-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
                >
                  Solicitar reunion
                  <ArrowRight className="site-button-arrow size-4" />
                </Link>
                <Link
                  href="/#areas"
                  className="site-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
                >
                  Ver areas de practica
                  <ArrowUpRight className="site-button-arrow size-4" />
                </Link>
              </div>

              <div
                className="grid gap-3 sm:grid-cols-3 animate-fade-up"
                style={{ animationDelay: "240ms" }}
              >
                {heroBadges.map((badge) => (
                  <div
                    key={badge}
                    className="site-chip inline-flex items-center gap-3 rounded-2xl px-4 py-3 text-sm"
                  >
                    <span className="inline-flex size-8 items-center justify-center rounded-full bg-brand-green/12 text-brand-green">
                      <BadgeCheck className="size-4" />
                    </span>
                    <span className="leading-6">{badge}</span>
                  </div>
                ))}
              </div>

              <div
                className="site-kpi-strip animate-fade-up grid gap-4 rounded-[1.7rem] px-5 py-4 sm:grid-cols-3"
                style={{ animationDelay: "320ms" }}
              >
                {heroMetrics.map((item) => (
                  <div
                    key={item.etiqueta}
                    className="site-kpi-item px-1 py-1 sm:px-3"
                  >
                    <p className="font-display text-4xl text-brand-green">
                      {item.valor}
                    </p>
                    <p className="mt-2 text-xs leading-6 text-white/72">
                      {item.etiqueta}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative z-10 grid gap-4 lg:pt-8">
              <article
                className="site-hero-card site-hover-lift animate-fade-in-scale rounded-[1.85rem] p-7"
                style={{ animationDelay: "180ms" }}
              >
                <div className="mb-5 inline-flex rounded-2xl bg-brand-blue-bg p-3 site-text-accent">
                  <Compass className="size-5" />
                </div>
                <p className="site-hero-card-kicker text-xs font-semibold tracking-[0.24em] uppercase">
                  Cobertura integrada
                </p>
                <h2 className="site-hero-card-heading mt-3 font-display text-3xl leading-tight">
                  Una sola narrativa para web, clientes y operacion interna.
                </h2>
                <p className="site-hero-card-muted mt-4 text-sm leading-7">
                  El cliente no deberia sentirse empujado entre paginas
                  desconectadas. Ahora la experiencia es mas natural, continua y
                  facil de recorrer desde el primer scroll.
                </p>
              </article>

              <div className="grid gap-4 sm:grid-cols-2">
                <article
                  className="site-hero-soft-card site-hover-lift animate-fade-up rounded-[1.65rem] p-5"
                  style={{ animationDelay: "260ms" }}
                >
                  <Building2 className="size-5 site-text-kicker-strong" />
                  <p className="mt-4 text-sm font-semibold">
                    Cobertura legal
                  </p>
                  <p className="site-hero-soft-muted mt-2 text-sm leading-7">
                    Firma pensada para empresas, socios y gerencias con agenda
                    juridica activa.
                  </p>
                </article>
                <article
                  className="site-hero-soft-card site-hover-lift animate-fade-up rounded-[1.65rem] p-5"
                  style={{ animationDelay: "340ms" }}
                >
                  <ShieldCheck className="size-5 site-text-kicker-strong" />
                  <p className="mt-4 text-sm font-semibold">Control seguro</p>
                  <p className="site-hero-soft-muted mt-2 text-sm leading-7">
                    Metodologia clara para custodiar informacion sensible y
                    sostener decisiones con orden.
                  </p>
                </article>
              </div>

              <article
                className="site-panel site-hover-lift animate-fade-up rounded-[1.7rem] p-6"
                style={{ animationDelay: "420ms" }}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-lg">
                    <p className="site-kicker text-xs font-semibold site-text-kicker">
                      Experiencia de navegacion
                    </p>
                    <h2 className="mt-3 font-display text-3xl site-text-strong">
                      El header ahora acompana el recorrido.
                    </h2>
                    <p className="mt-3 text-sm leading-7 site-text-muted">
                      Cada enlace del header desplaza a la seccion
                      correspondiente sin vaciar el contenido. Se siente mas
                      editorial, mas intuitivo y mucho mas amable para el
                      usuario.
                    </p>
                  </div>
                  <span className="site-chip rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em]">
                    Scroll continuo
                  </span>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section
        id="firma"
        className="scroll-mt-32 px-5 py-12 sm:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="space-y-6">
              <SectionHeading
                kicker="Quienes somos"
                titulo="Una firma pensada para responder con criterio, ritmo y lenguaje directivo."
                descripcion="La portada deja de sentirse fragmentada y pasa a contar una historia clara: quienes somos, como pensamos, que areas cubrimos y como se inicia una relacion con la firma."
              />
              <div className="grid gap-4 sm:grid-cols-2">
                {values.slice(0, 2).map((value, index) => {
                  const Icono = value.icono;

                  return (
                    <article
                      key={value.titulo}
                      className="site-panel site-hover-lift animate-fade-up rounded-[1.55rem] p-5"
                      style={{ animationDelay: `${120 + index * 80}ms` }}
                    >
                      <div className="inline-flex rounded-2xl site-soft-surface p-3 site-text-accent">
                        <Icono className="size-5" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold site-text-strong">
                        {value.titulo}
                      </h3>
                      <p className="mt-3 text-sm leading-7 site-text-muted">
                        {value.descripcion}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {operatingHighlights.map((item, index) => {
                const Icono = item.icono;

                return (
                  <article
                    key={item.titulo}
                    className="site-panel site-hover-lift animate-fade-up rounded-[1.75rem] p-6"
                    style={{ animationDelay: `${160 + index * 100}ms` }}
                  >
                    <div className="inline-flex rounded-2xl site-soft-surface p-3 site-text-accent">
                      <Icono className="size-5" />
                    </div>
                    <h3 className="mt-5 text-lg font-semibold site-text-strong">
                      {item.titulo}
                    </h3>
                    <p className="mt-3 text-sm leading-7 site-text-muted">
                      {item.descripcion}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {processSteps.map((step, index) => (
              <article
                key={step.titulo}
                className="site-panel site-hover-lift animate-fade-up rounded-[1.85rem] p-6"
                style={{ animationDelay: `${220 + index * 100}ms` }}
              >
                <p className="font-mono text-sm site-text-kicker">
                  0{index + 1}
                </p>
                <h3 className="mt-5 text-2xl font-semibold site-text-strong">
                  {step.titulo}
                </h3>
                <p className="mt-3 text-sm leading-7 site-text-muted">
                  {step.descripcion}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="areas"
        className="scroll-mt-32 px-5 py-12 sm:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <SectionHeading
              kicker="Areas de practica"
              titulo="Servicios con lectura ejecutiva, profundidad juridica y una puesta en escena mas clara."
              descripcion="Refinamos color, contraste y microinteracciones para que la web se vea solida tanto en modo claro como en modo oscuro."
            />
            <Link
              href="/#contacto"
              className="site-link-accent inline-flex items-center gap-2 text-sm font-semibold transition-colors"
            >
              Conversar sobre un caso
              <ArrowRight className="site-button-arrow size-4" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {practiceAreas.map((item, index) => {
              const Icono = item.icono;

              return (
                <article
                  key={item.titulo}
                  className="site-panel site-hover-lift animate-fade-up rounded-[1.9rem] p-6"
                  style={{ animationDelay: `${100 + index * 70}ms` }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="inline-flex rounded-2xl bg-brand-blue-bg p-3 site-text-accent">
                      <Icono className="size-5" />
                    </div>
                    <Sparkles className="mt-1 size-4 text-brand-copper" />
                  </div>
                  <h3 className="mt-6 text-xl font-semibold site-text-strong">
                    {item.titulo}
                  </h3>
                  <p className="mt-3 text-sm leading-7 site-text-muted">
                    {item.descripcion}
                  </p>
                </article>
              );
            })}
          </div>

          <article className="site-inverse-panel animate-fade-up rounded-[2rem] px-6 py-8 shadow-xl shadow-brand-navy/15 sm:px-8">
            <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr] xl:items-end">
              <SectionHeading
                kicker="Cobertura y ritmo"
                titulo="La misma pagina debe inspirar criterio afuera y orden adentro."
                descripcion="Sumamos una banda oscura de apoyo para equilibrar la composicion y mostrar cobertura sin perder sobriedad."
                invertido
              />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {officeCards.map((office, index) => (
                  <article
                    key={office.ciudad}
                    className="site-inverse-card animate-fade-up rounded-[1.45rem] p-5"
                    style={{ animationDelay: `${150 + index * 80}ms` }}
                  >
                    <p className="font-display text-3xl site-text-kicker-strong">
                      {office.ciudad}
                    </p>
                    <p className="mt-3 text-sm leading-7 text-white/72">
                      {office.detalle}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>

      <section
        id="equipo"
        className="scroll-mt-32 px-5 py-12 sm:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="grid gap-8 xl:grid-cols-[0.92fr_1.08fr] xl:items-end">
            <SectionHeading
              kicker="Equipo"
              titulo="Perfiles con voz propia, ordenados bajo una misma direccion de servicio."
              descripcion="La pagina publica ya no solo enumera perfiles: tambien comunica tono, estructura y capacidad de coordinacion."
            />
            <article className="site-panel site-hover-lift animate-fade-up rounded-[1.8rem] p-6">
              <div className="flex flex-wrap items-center gap-3">
                <span className="site-chip rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]">
                  Direccion estrategica
                </span>
                <span className="site-chip rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]">
                  Litigio y prevencion
                </span>
                <span className="site-chip rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em]">
                  Reporte ejecutivo
                </span>
              </div>
              <p className="mt-5 text-sm leading-7 site-text-muted">
                Tambien aprovechamos esta seccion para dar respiro visual: los
                bloques tienen mejor contraste, hover mas amable y una entrada
                animada que hace la lectura menos estatica.
              </p>
            </article>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {teamMembers.map((member, index) => (
              <article
                key={member.nombre}
                className="site-panel site-hover-lift animate-fade-up rounded-[1.95rem] p-6"
                style={{ animationDelay: `${110 + index * 90}ms` }}
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.22em] site-text-kicker uppercase">
                      {member.cargo}
                    </p>
                    <h2 className="mt-4 font-display text-3xl site-text-strong">
                      {member.nombre}
                    </h2>
                  </div>
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl site-soft-surface text-sm font-semibold site-text-strong">
                    {member.nombre
                      .split(" ")
                      .map((part) => part[0])
                      .join("")
                      .slice(0, 2)}
                  </span>
                </div>
                <p className="mt-5 text-sm leading-7 site-text-muted">
                  {member.bio}
                </p>
              </article>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {insightCards.map((card, index) => (
              <article
                key={card.titulo}
                className="site-soft-card site-hover-lift animate-fade-up rounded-[1.8rem] px-6 py-7"
                style={{ animationDelay: `${180 + index * 100}ms` }}
              >
                <div className="site-chip inline-flex rounded-2xl p-3 site-text-accent">
                  {index === 0 ? (
                    <Handshake className="size-5" />
                  ) : index === 1 ? (
                    <ShieldCheck className="size-5" />
                  ) : (
                    <Sparkles className="size-5" />
                  )}
                </div>
                <h3 className="mt-5 text-xl font-semibold site-text-strong">
                  {card.titulo}
                </h3>
                <p className="mt-3 text-sm leading-7 site-text-muted">
                  {card.resumen}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        id="contacto"
        className="scroll-mt-32 px-5 py-12 sm:px-8 lg:px-10"
      >
        <div className="mx-auto max-w-7xl space-y-8">
          <div className="grid gap-6 lg:grid-cols-[0.92fr_1.08fr]">
            <article className="site-inverse-panel animate-fade-up rounded-[2rem] px-6 py-10 shadow-xl shadow-brand-navy/16 sm:px-8">
              <SectionHeading
                kicker="Contacto"
                titulo="Conversemos sin perder contexto ni salir del recorrido."
                descripcion="El cierre de la landing se integra a la narrativa general: el usuario puede revisar capacidades, equipo y contacto dentro de una sola experiencia."
                invertido
              />

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {contactChannels.map((channel, index) => {
                  const Icono = channel.icono;

                  return (
                    <article
                      key={channel.titulo}
                      className="site-inverse-card animate-fade-up rounded-[1.45rem] p-5"
                      style={{ animationDelay: `${120 + index * 70}ms` }}
                    >
                      <div className="inline-flex rounded-2xl bg-white/10 p-3 site-text-kicker-strong">
                        <Icono className="size-5" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold">
                        {channel.titulo}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-white/72">
                        {channel.detalle}
                      </p>
                      <p className="mt-4 text-sm font-semibold site-text-kicker-strong">
                        {channel.valor}
                      </p>
                    </article>
                  );
                })}
              </div>
            </article>

            <div className="animate-fade-up" style={{ animationDelay: "180ms" }}>
              <SiteContactForm />
            </div>
          </div>

          <article className="site-panel animate-fade-up rounded-[2rem] p-8">
            <div className="grid gap-8 xl:grid-cols-[1fr_0.92fr] xl:items-center">
              <div>
                <p className="site-kicker text-xs font-semibold site-text-kicker">
                  Presencia
                </p>
                <h2 className="mt-5 font-display text-4xl leading-tight site-text-strong sm:text-5xl">
                  Oficinas, coordinacion remota y botones mas claros en ambos
                  modos visuales.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 site-text-muted sm:text-base">
                  Ajustamos contraste, profundidad y estados hover para que la
                  experiencia no tenga zonas lavadas ni acciones que se
                  pierdan. El resultado es una landing mas viva, mas legible y
                  mucho mas confiable.
                </p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/#inicio"
                    className="site-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
                  >
                    Volver arriba
                    <ArrowUpRight className="site-button-arrow size-4" />
                  </Link>
                  <Link
                    href="/#firma"
                    className="site-button-primary inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold"
                  >
                    Recorrer la firma
                    <ArrowRight className="site-button-arrow size-4" />
                  </Link>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {officeCards.map((office, index) => (
                  <article
                    key={office.ciudad}
                    className="site-soft-card site-hover-lift animate-fade-up rounded-[1.45rem] px-5 py-5"
                    style={{ animationDelay: `${160 + index * 80}ms` }}
                  >
                    <p className="font-display text-3xl site-text-strong">
                      {office.ciudad}
                    </p>
                    <p className="mt-3 text-sm leading-7 site-text-muted">
                      {office.detalle}
                    </p>
                  </article>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
