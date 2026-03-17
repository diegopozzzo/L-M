import type { Metadata } from "next";
import { SectionHeading } from "@/components/site/section-heading";
import { SiteContactForm } from "@/components/site/site-contact-form";
import { contactChannels, officeCards } from "@/data/site-content";

export const metadata: Metadata = {
  title: "Contacto",
};

export default function ContactoPage() {
  return (
    <div className="px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-10">
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-[2rem] bg-brand-navy px-6 py-10 text-white sm:px-8">
            <SectionHeading
              kicker="Contacto"
              titulo="Conversemos sobre el frente legal que hoy necesita mas claridad."
              descripcion="Abrimos un canal claro para captar consultas, ordenar el contexto inicial y responder con criterio desde la primera interaccion."
              invertido
            />
          </article>

          <div className="grid gap-4 md:grid-cols-2">
            {contactChannels.map((channel) => {
              const Icono = channel.icono;

              return (
                <article
                  key={channel.titulo}
                  className="site-panel rounded-[1.75rem] p-6"
                >
                  <div className="inline-flex rounded-2xl site-soft-surface p-3 site-text-accent">
                    <Icono className="size-5" />
                  </div>
                  <h2 className="mt-5 text-lg font-semibold site-text-strong">
                    {channel.titulo}
                  </h2>
                  <p className="mt-3 text-sm leading-7 site-text-muted">
                    {channel.detalle}
                  </p>
                  <p className="mt-4 text-sm font-semibold site-text-accent">
                    {channel.valor}
                  </p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <SiteContactForm />

          <article className="rounded-[2rem] border border-brand-gold/18 bg-linear-to-br from-brand-navy to-brand-navy-light px-6 py-8 text-white shadow-xl shadow-brand-navy/16 sm:px-8">
            <p className="site-kicker text-xs font-semibold site-text-kicker-strong">
              Presencia
            </p>
            <h2 className="mt-5 font-display text-4xl leading-tight">
              Oficinas, coordinacion remota y una misma experiencia de servicio.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {officeCards.map((office) => (
                <article
                  key={office.ciudad}
                  className="rounded-[1.5rem] border border-white/10 bg-white/6 p-5 backdrop-blur-sm"
                >
                  <p className="font-display text-3xl site-text-kicker-strong">
                    {office.ciudad}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/70">
                    {office.detalle}
                  </p>
                </article>
              ))}
            </div>
          </article>
        </section>
      </div>
    </div>
  );
}

