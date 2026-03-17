import type { Metadata } from "next";
import { SectionHeading } from "@/components/site/section-heading";
import { teamMembers, values } from "@/data/site-content";

export const metadata: Metadata = {
  title: "Equipo",
};

export default function EquipoPage() {
  return (
    <div className="px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[2rem] bg-brand-navy px-6 py-10 text-white sm:px-8">
            <SectionHeading
              kicker="Equipo"
              titulo="Perfiles con voz propia, organizados bajo una sola direccion de servicio."
              descripcion="En lugar de una pagina de retratos genericos, proponemos una puesta en escena sobria, ejecutiva y alineada con el resto del sistema."
              invertido
            />
          </article>
          <article className="site-panel rounded-[2rem] p-8">
            <p className="site-kicker text-xs font-semibold site-text-kicker">
              Estructura
            </p>
            <p className="mt-5 font-display text-4xl site-text-strong">
              Socios, lideres de practica y coordinacion operativa conectados en
              una misma capa de seguimiento.
            </p>
            <p className="mt-5 text-sm leading-8 site-text-muted">
              Esta organizacion muestra como articulamos socios, lideres de
              practica y coordinacion para responder con criterio en cada
              asunto relevante.
            </p>
          </article>
        </section>

        <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {teamMembers.map((member) => (
            <article
              key={member.nombre}
              className="site-panel rounded-[1.95rem] p-6"
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
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {values.map((value) => {
            const Icono = value.icono;

            return (
              <article
                key={value.titulo}
                className="site-soft-card rounded-[1.8rem] px-6 py-7"
              >
                <div className="site-chip inline-flex rounded-2xl p-3 site-text-accent">
                  <Icono className="size-5" />
                </div>
                <h3 className="mt-5 text-xl font-semibold site-text-strong">
                  {value.titulo}
                </h3>
                <p className="mt-3 text-sm leading-7 site-text-muted">
                  {value.descripcion}
                </p>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}

