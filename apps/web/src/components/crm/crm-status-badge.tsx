import type { ExpedienteEstadoVista } from "@/lib/crm-expedientes";

const statusClassMap: Record<ExpedienteEstadoVista, string> = {
  ACTIVO: "bg-brand-green-bg text-brand-green",
  PENDIENTE: "bg-brand-amber-bg text-brand-amber",
  URGENTE: "bg-brand-red-bg text-brand-red",
  CERRADO:
    "border border-[var(--crm-divider)] bg-[var(--crm-tag-bg)] text-[var(--crm-tag-text)]",
};

export function CrmStatusBadge({ estado }: { estado: ExpedienteEstadoVista }) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[0.7rem] font-semibold tracking-[0.06em] ${statusClassMap[estado]}`}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {estado}
    </span>
  );
}
