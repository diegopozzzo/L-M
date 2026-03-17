import type { Metadata } from "next";
import { SectionHeading } from "@/components/site/section-heading";
import {
  operatingHighlights,
  practiceAreas,
  processSteps,
} from "@/data/site-content";

export const metadata: Metadata = {
  title: "Areas de Practica",
};

export default function AreasPage() {
  return (
    <div className="px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="rounded-[2rem] bg-brand-navy px-6 py-10 text-white sm:px-8">
          <SectionHeading
            kicker="Areas de practica"
            titulo="Servicios construidos para sostener decisiones, no solo responder consultas."
            descripcion="La pagina institucional debe presentar experiencia, foco y rango de acompanamiento sin sonar generica. Aqui dejamos una base visual fuerte para esa narrativa."
            invertido
          />
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {practiceAreas.map((item) => {
            const Icono = item.icono;

            return (
              <article
                key={item.titulo}
                className="site-panel rounded-[1.9rem] p-6 transition-transform duration-300 hover:-translate-y-1"
              >
                <div className="inline-flex rounded-2xl bg-brand-blue-bg p-3 site-text-accent">
                  <Icono className="size-5" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold site-text-strong">
                  {item.titulo}
                </h2>
                <p className="mt-3 text-sm leading-7 site-text-muted">
                  {item.descripcion}
                </p>
              </article>
            );
          })}
        </section>

        <section className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <SectionHeading
            kicker="Modo de intervencion"
            titulo="Cada area puede traducirse en prevencion, acompanamiento y respuesta."
            descripcion="Cada materia exige una lectura distinta, pero todas comparten metodo, foco y una forma clara de acompanar decisiones."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {processSteps.map((step, index) => (
              <article
                key={step.titulo}
                className="site-panel rounded-[1.75rem] p-6"
              >
                <p className="font-mono text-sm site-text-kicker">
                  0{index + 1}
                </p>
                <h3 className="mt-5 text-xl font-semibold site-text-strong">
                  {step.titulo}
                </h3>
                <p className="mt-3 text-sm leading-7 site-text-muted">
                  {step.descripcion}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {operatingHighlights.map((item) => {
            const Icono = item.icono;

            return (
              <article
                key={item.titulo}
                className="rounded-[1.8rem] border border-brand-gold/18 bg-linear-to-br from-brand-navy to-brand-navy-light p-6 text-white"
              >
                <div className="inline-flex rounded-2xl bg-white/10 p-3 site-text-kicker-strong">
                  <Icono className="size-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold">{item.titulo}</h3>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  {item.descripcion}
                </p>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}

