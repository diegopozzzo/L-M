import type { Metadata } from "next";
import { SectionHeading } from "@/components/site/section-heading";
import {
  officeCards,
  processSteps,
  teamMembers,
  values,
} from "@/data/site-content";

export const metadata: Metadata = {
  title: "Quienes Somos",
};

export default function QuienesSomosPage() {
  return (
    <div className="px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[2rem] bg-brand-navy px-6 py-10 text-white sm:px-8">
            <p className="site-kicker text-xs font-semibold site-text-kicker-strong">
              Quienes somos
            </p>
            <h1 className="mt-5 max-w-3xl font-display text-5xl leading-none sm:text-6xl">
              Rigor juridico, presencia ejecutiva y una operacion que no deja
              cabos sueltos.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-8 text-white/72 sm:text-base">
              La firma se plantea como un socio de criterio: interviene cuando
              hace falta litigar, ordenar riesgos, acompanar juntas o traducir
              complejidad legal en decisiones claras.
            </p>
          </article>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Metodo", "Unimos lectura juridica, sensibilidad de negocio y orden operativo."],
              ["Cobertura", "Atencion coordinada para clientes empresariales, socios y frentes multiarea."],
              ["Estilo", "Comunicar menos ruido y mas claridad, sin perder profundidad tecnica."],
              ["Operacion", "Una forma de trabajo ordenada, trazable y consistente en cada asunto relevante."],
            ].map(([titulo, detalle]) => (
              <article key={titulo} className="site-panel rounded-[1.75rem] p-6">
                <p className="text-xs font-semibold tracking-[0.22em] site-text-kicker uppercase">
                  {titulo}
                </p>
                <p className="mt-4 text-sm leading-7 site-text-muted">
                  {detalle}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <SectionHeading
            kicker="Valores"
            titulo="La firma se mueve con criterio, tiempos claros y lenguaje directivo."
            descripcion="La presencia institucional debe reflejar sobriedad, cuidado documental y capacidad de respuesta sin caer en lugares comunes."
          />
          <div className="grid gap-4 md:grid-cols-3">
            {values.map((value) => {
              const Icono = value.icono;

              return (
                <article key={value.titulo} className="site-panel rounded-[1.75rem] p-6">
                  <div className="inline-flex rounded-2xl site-soft-surface p-3 site-text-accent">
                    <Icono className="size-5" />
                  </div>
                  <h2 className="mt-5 text-lg font-semibold site-text-strong">
                    {value.titulo}
                  </h2>
                  <p className="mt-3 text-sm leading-7 site-text-muted">
                    {value.descripcion}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="space-y-8">
          <SectionHeading
            kicker="Como operamos"
            titulo="Tres capas simples para que el trabajo legal se sienta ordenado."
            descripcion="Este marco ordena la forma de intervenir en asuntos sensibles: diagnostico, estrategia y ejecucion trazable."
          />
          <div className="grid gap-5 lg:grid-cols-3">
            {processSteps.map((step, index) => (
              <article
                key={step.titulo}
                className="site-panel rounded-[1.85rem] p-6"
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
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {teamMembers.map((member) => (
            <article
              key={member.nombre}
              className="rounded-[1.9rem] border border-brand-navy/8 bg-brand-navy px-6 py-7 text-white shadow-xl shadow-brand-navy/10"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-sm font-semibold site-text-kicker-strong">
                {member.nombre
                  .split(" ")
                  .map((part) => part[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <h3 className="mt-5 font-display text-3xl">{member.nombre}</h3>
              <p className="mt-2 text-sm font-medium site-text-kicker-strong">
                {member.cargo}
              </p>
              <p className="mt-4 text-sm leading-7 text-white/70">{member.bio}</p>
            </article>
          ))}
        </section>

        <section className="site-panel rounded-[2rem] p-8">
          <SectionHeading
            kicker="Cobertura"
            titulo="Presencia fisica y coordinacion remota con una sola narrativa de servicio."
            descripcion="La experiencia institucional tambien debe transmitir disponibilidad, cercania y estructura."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {officeCards.map((office) => (
              <article
                key={office.ciudad}
                className="rounded-[1.4rem] site-soft-surface px-5 py-5"
              >
                <p className="font-display text-3xl site-text-strong">{office.ciudad}</p>
                <p className="mt-3 text-sm leading-7 site-text-muted">
                  {office.detalle}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

