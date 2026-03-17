"use client";

import { useState } from "react";
import {
  ArrowRight,
  FileText,
  LoaderCircle,
  Moon,
  ShieldCheck,
  SunMedium,
  TimerReset,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { BrandMark } from "@/components/brand-mark";
import { useCrmTheme } from "@/components/crm/crm-theme-frame";
import type { SessionEnvelope } from "@/lib/auth";

export function CrmLoginForm() {
  const router = useRouter();
  const { theme, toggleTheme } = useCrmTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });
      const payload = (await response.json()) as SessionEnvelope;

      if (!response.ok || !payload.ok) {
        setError(
          payload.mensaje ??
            "No pudimos iniciar sesion. Verifica tus credenciales.",
        );
        return;
      }

      router.replace("/intranet");
      router.refresh();
    } catch {
      setError(
        "No fue posible contactar el servidor de autenticacion. Intenta nuevamente.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto mb-5 flex max-w-7xl justify-end">
        <button
          type="button"
          onClick={toggleTheme}
          className="crm-button-secondary inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors"
        >
          {theme === "dark" ? <SunMedium className="size-4" /> : <Moon className="size-4" />}
          {theme === "dark" ? "Modo claro" : "Modo oscuro"}
        </button>
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-7xl overflow-hidden rounded-[2rem] crm-card lg:grid-cols-[1.05fr_0.95fr]">
        <section className="crm-login-side relative overflow-hidden px-6 py-8 text-white sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="absolute inset-0 bg-linear-to-br from-transparent via-white/0 to-brand-green/10" />
          <div className="absolute -right-20 top-10 h-72 w-72 rounded-full bg-brand-copper/12 blur-3xl" />
          <div className="relative z-10 flex h-full flex-col">
            <BrandMark
              href={null}
              mode="light"
              subtitle="Area privada del estudio"
            />

            <div className="mt-12 space-y-6">
              <p className="site-kicker text-xs font-semibold text-brand-green">
                Acceso restringido
              </p>
              <h1 className="max-w-xl font-display text-5xl leading-none sm:text-6xl">
                Entorno interno para gestion legal, seguimiento y control documental.
              </h1>
              <p className="max-w-xl text-sm leading-8 text-white/72 sm:text-base">
                Este acceso privado esta reservado al equipo interno del
                estudio. La entrada se valida por rol, permisos y sesion
                segura antes de habilitar la operacion diaria.
              </p>
            </div>

            <div className="mt-10 grid gap-4">
              {[
                {
                  titulo: "Trazabilidad por usuario",
                  descripcion:
                    "La sesion identifica rol, permisos y contexto operativo antes de abrir la intranet legal.",
                  icono: ShieldCheck,
                },
                {
                  titulo: "Sesion renovable",
                  descripcion:
                    "La capa web mantiene la sesion con cookies seguras y renovacion controlada.",
                  icono: TimerReset,
                },
                {
                  titulo: "Operacion reservada",
                  descripcion:
                    "La experiencia interna funciona como un acceso diferenciado, reservado al trabajo operativo del equipo.",
                  icono: FileText,
                },
              ].map((item) => {
                const Icono = item.icono;

                return (
                  <article
                    key={item.titulo}
                    className="rounded-[1.5rem] border border-white/10 bg-white/6 px-5 py-4 backdrop-blur-sm"
                  >
                    <div className="inline-flex rounded-2xl bg-white/10 p-3 text-brand-green">
                      <Icono className="size-5" />
                    </div>
                    <h2 className="mt-4 text-base font-semibold">{item.titulo}</h2>
                    <p className="mt-2 text-sm leading-7 text-white/68">
                      {item.descripcion}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section className="flex items-center px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          <div className="mx-auto w-full max-w-md">
            <div className="crm-card rounded-[1.9rem] px-6 py-7 sm:px-8 sm:py-8">
              <p className="crm-soft text-xs font-semibold tracking-[0.28em] uppercase">
                Iniciar sesion
              </p>
              <h2 className="crm-heading mt-4 font-display text-4xl">
                Bienvenido al area privada
              </h2>
              <p className="crm-muted mt-3 text-sm leading-7">
                Usa las credenciales internas del estudio. Este acceso
                corresponde exclusivamente al equipo juridico autorizado.
              </p>

              <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="crm-soft mb-2 block text-xs font-semibold tracking-[0.16em] uppercase">
                    Correo institucional
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="admin@estudiolegal.local"
                    autoComplete="email"
                    required
                    className="crm-input w-full rounded-[1.1rem] px-4 py-3 text-sm outline-none transition-colors"
                  />
                </label>

                <label className="block">
                  <span className="crm-soft mb-2 block text-xs font-semibold tracking-[0.16em] uppercase">
                    Password
                  </span>
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Tu password seguro"
                    autoComplete="current-password"
                    required
                    className="crm-input w-full rounded-[1.1rem] px-4 py-3 text-sm outline-none transition-colors"
                  />
                </label>

                {error ? (
                  <div className="crm-alert rounded-[1.1rem] px-4 py-3 text-sm">
                    {error}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={submitting}
                  className="crm-button-primary inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Validando acceso...
                    </>
                  ) : (
                    <>
                      Entrar al area privada
                      <ArrowRight className="size-4" />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
