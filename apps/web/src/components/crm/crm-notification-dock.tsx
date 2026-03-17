"use client";

import { BellRing, ChevronDown, ChevronUp, Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DashboardOverview } from "@/lib/crm-ops";

type CrmNotificationDockProps = {
  deadlines: DashboardOverview["deadlines"];
};

function formatDueDate(value: string) {
  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function CrmNotificationDock({
  deadlines,
}: CrmNotificationDockProps) {
  const [open, setOpen] = useState(true);
  const notifications = useMemo(
    () =>
      [...deadlines]
        .sort(
          (left, right) =>
            left.diasRestantes - right.diasRestantes ||
            new Date(left.fechaVencimiento).getTime() -
              new Date(right.fechaVencimiento).getTime(),
        )
        .slice(0, 4),
    [deadlines],
  );
  const urgentCount = notifications.filter((item) => item.diasRestantes <= 3).length;

  useEffect(() => {
    if (notifications.length > 0) {
      const timer = window.setTimeout(() => {
        setOpen(true);
      }, 0);

      return () => window.clearTimeout(timer);
    }
  }, [notifications.length, urgentCount]);

  if (notifications.length === 0) {
    return null;
  }

  return (
    <aside className="pointer-events-none fixed right-4 bottom-4 z-50 w-[22rem] max-w-[calc(100vw-2rem)]">
      <div className="pointer-events-auto crm-card overflow-hidden rounded-[1.6rem] border shadow-2xl">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex w-full items-center gap-3 px-4 py-4 text-left"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-green-bg text-brand-green">
            <BellRing className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="crm-heading text-sm font-semibold">
              Centro de notificaciones
            </p>
            <p className="crm-muted text-xs">
              {urgentCount > 0
                ? `${urgentCount} alerta(s) urgente(s) en tu bandeja`
                : `${notifications.length} recordatorio(s) operativo(s)`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-brand-red px-2 py-1 text-[0.68rem] font-semibold text-white">
              {notifications.length}
            </span>
            {open ? (
              <ChevronDown className="size-4 text-brand-slate" />
            ) : (
              <ChevronUp className="size-4 text-brand-slate" />
            )}
          </div>
        </button>

        {open ? (
          <div className="border-t border-[var(--crm-divider)] bg-[var(--crm-panel-bg-soft)] px-4 py-3">
            <div className="space-y-3">
              {notifications.map((item) => (
                <article
                  key={item.id}
                  className="crm-card-soft rounded-[1.2rem] px-4 py-3"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                        item.diasRestantes <= 3
                          ? "bg-brand-red-bg text-brand-red"
                          : item.diasRestantes <= 7
                            ? "bg-brand-amber-bg text-brand-amber"
                            : "bg-brand-green-bg text-brand-green"
                      }`}
                    >
                      <Clock3 className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="crm-heading text-sm font-semibold">
                        {item.titulo}
                      </p>
                      <p className="crm-muted mt-1 text-xs">
                        {item.expedienteNumero} - {item.cliente}
                      </p>
                      <p className="crm-soft mt-2 text-xs">
                        {item.diasRestantes <= 0
                          ? "Vence hoy o esta vencido"
                          : `Faltan ${item.diasRestantes} dia(s)`}{" "}
                        - {formatDueDate(item.fechaVencimiento)}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </aside>
  );
}
