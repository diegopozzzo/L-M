"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, LoaderCircle, Plus, RefreshCcw, Search, UserPlus } from "lucide-react";
import type { SessionUser } from "@/lib/auth";
import type { ExpedienteCatalogo } from "@/lib/crm-expedientes";
import type {
  ClienteCreatePayload,
  ClienteItemEnvelope,
  ClientesListEnvelope,
  ClientesListResult,
  LeadCreatePayload,
  LeadItemEnvelope,
  LeadUpdatePayload,
  LeadsListEnvelope,
  LeadsListResult,
} from "@/lib/crm-ops";

const tipoPersonaLabel = {
  NATURAL: "Natural",
  JURIDICA: "Juridica",
} as const;

const estadoLeadLabel = {
  NUEVO: "Nuevo",
  EN_REVISION: "En revision",
  CONTACTADO: "Contactado",
  CONVERTIDO: "Convertido",
  DESCARTADO: "Descartado",
} as const;

function formatDate(value: string | null) {
  if (!value) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function SummaryChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="crm-card rounded-2xl px-4 py-3 shadow-sm">
      <p className="crm-soft text-[0.7rem] font-semibold tracking-[0.16em] uppercase">
        {label}
      </p>
      <p className="crm-heading mt-2 font-display text-3xl">{value}</p>
    </div>
  );
}

type CrmClientsPanelProps = {
  usuario: SessionUser;
  catalogo: ExpedienteCatalogo | null;
};

export function CrmClientsPanel({ usuario, catalogo }: CrmClientsPanelProps) {
  const canCreateClient = usuario.permisos.includes("clientes.write");
  const canCreateLead = usuario.permisos.includes("leads.write");
  const canManageLeads = usuario.permisos.includes("leads.write");
  const [search, setSearch] = useState("");
  const [clientsState, setClientsState] = useState<{
    loading: boolean;
    error: string | null;
    items: ClientesListResult["items"];
    summary: ClientesListResult["summary"];
  }>({
    loading: true,
    error: null,
    items: [],
    summary: { total: 0, activos: 0, potenciales: 0, archivados: 0 },
  });
  const [leadsState, setLeadsState] = useState<{
    loading: boolean;
    error: string | null;
    items: LeadsListResult["items"];
    summary: LeadsListResult["summary"];
  }>({
    loading: true,
    error: null,
    items: [],
    summary: { total: 0, nuevos: 0, enRevision: 0, contactados: 0, convertidos: 0 },
  });
  const [formOpen, setFormOpen] = useState(false);
  const [leadFormOpen, setLeadFormOpen] = useState(false);
  const [formState, setFormState] = useState<ClienteCreatePayload>({
    tipoPersona: "JURIDICA",
    nombresORazonSocial: "",
    esCompartido: false,
    tipoDocumento: "",
    numeroDocumento: "",
    email: "",
    telefono: "",
    direccion: "",
    observaciones: "",
  });
  const [leadFormState, setLeadFormState] = useState<LeadCreatePayload>({
    nombre: "",
    email: "",
    telefono: "",
    empresa: "",
    mensaje: "",
    areaPracticaId: "",
    asignadoAId: usuario.id,
    estado: "NUEVO",
    esCompartido: false,
    origenUrl: "/intranet",
  });
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const loadClients = useCallback(async () => {
    setClientsState((current) => ({ ...current, loading: true, error: null }));

    try {
      const response = await fetch("/api/clientes", { method: "GET", cache: "no-store" });
      const payload = (await response.json()) as ClientesListEnvelope;

      if (!response.ok || !payload.ok || !payload.data) {
        setClientsState({
          loading: false,
          error: payload.mensaje ?? "No pudimos cargar los clientes.",
          items: [],
          summary: { total: 0, activos: 0, potenciales: 0, archivados: 0 },
        });
        return;
      }

      setClientsState({
        loading: false,
        error: null,
        items: payload.data.items,
        summary: payload.data.summary,
      });
    } catch {
      setClientsState({
        loading: false,
        error: "No pudimos cargar los clientes.",
        items: [],
        summary: { total: 0, activos: 0, potenciales: 0, archivados: 0 },
      });
    }
  }, []);

  const loadLeads = useCallback(async () => {
    setLeadsState((current) => ({ ...current, loading: true, error: null }));

    try {
      const response = await fetch("/api/leads", { method: "GET", cache: "no-store" });
      const payload = (await response.json()) as LeadsListEnvelope;

      if (!response.ok || !payload.ok || !payload.data) {
        setLeadsState({
          loading: false,
          error: payload.mensaje ?? "No pudimos cargar los leads.",
          items: [],
          summary: { total: 0, nuevos: 0, enRevision: 0, contactados: 0, convertidos: 0 },
        });
        return;
      }

      setLeadsState({
        loading: false,
        error: null,
        items: payload.data.items,
        summary: payload.data.summary,
      });
    } catch {
      setLeadsState({
        loading: false,
        error: "No pudimos cargar los leads.",
        items: [],
        summary: { total: 0, nuevos: 0, enRevision: 0, contactados: 0, convertidos: 0 },
      });
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadClients();
      void loadLeads();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadClients, loadLeads]);

  const filteredClients = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return clientsState.items;
    }

    return clientsState.items.filter((client) =>
      [
        client.nombre,
        client.email ?? "",
        client.numeroDocumento ?? "",
        client.contactoPrincipal?.nombre ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalized),
    );
  }, [clientsState.items, search]);

  async function handleCreateClient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyKey("create-client");
    setFeedback(null);

    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formState),
      });
      const payload = (await response.json()) as ClienteItemEnvelope;

      if (!response.ok || !payload.ok) {
        setFeedback(payload.mensaje ?? "No pudimos registrar el cliente.");
        setBusyKey(null);
        return;
      }

      setFormState({
        tipoPersona: "JURIDICA",
        nombresORazonSocial: "",
        esCompartido: false,
        tipoDocumento: "",
        numeroDocumento: "",
        email: "",
        telefono: "",
        direccion: "",
        observaciones: "",
      });
      setFormOpen(false);
      setBusyKey(null);
      setFeedback(payload.mensaje ?? "Cliente registrado correctamente.");
      await loadClients();
    } catch {
      setBusyKey(null);
      setFeedback("No pudimos registrar el cliente.");
    }
  }

  async function handleCreateLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusyKey("create-lead");
    setFeedback(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(leadFormState),
      });
      const payload = (await response.json()) as LeadItemEnvelope;

      if (!response.ok || !payload.ok) {
        setFeedback(payload.mensaje ?? "No pudimos registrar el lead.");
        setBusyKey(null);
        return;
      }

      setLeadFormState({
        nombre: "",
        email: "",
        telefono: "",
        empresa: "",
        mensaje: "",
        areaPracticaId: "",
        asignadoAId: usuario.id,
        estado: "NUEVO",
        esCompartido: false,
        origenUrl: "/intranet",
      });
      setLeadFormOpen(false);
      setBusyKey(null);
      setFeedback(payload.mensaje ?? "Lead registrado correctamente.");
      await loadLeads();
    } catch {
      setBusyKey(null);
      setFeedback("No pudimos registrar el lead.");
    }
  }

  async function handleLeadUpdate(leadId: string, payload: LeadUpdatePayload) {
    setBusyKey(`lead-${leadId}`);
    setFeedback(null);

    try {
      const response = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as LeadItemEnvelope;

      if (!response.ok || !result.ok) {
        setFeedback(result.mensaje ?? "No pudimos actualizar el lead.");
        setBusyKey(null);
        return;
      }

      setBusyKey(null);
      setFeedback(result.mensaje ?? "Lead actualizado correctamente.");
      await loadLeads();
    } catch {
      setBusyKey(null);
      setFeedback("No pudimos actualizar el lead.");
    }
  }

  async function handleLeadConvert(leadId: string) {
    setBusyKey(`lead-convert-${leadId}`);
    setFeedback(null);

    try {
      const response = await fetch(`/api/leads/${leadId}/convert`, {
        method: "POST",
      });
      const result = (await response.json()) as LeadItemEnvelope;

      if (!response.ok || !result.ok) {
        setFeedback(result.mensaje ?? "No pudimos convertir el lead.");
        setBusyKey(null);
        return;
      }

      setBusyKey(null);
      setFeedback(result.mensaje ?? "Lead convertido correctamente.");
      await Promise.all([loadLeads(), loadClients()]);
    } catch {
      setBusyKey(null);
      setFeedback("No pudimos convertir el lead.");
    }
  }

  return (
    <section className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryChip label="Clientes totales" value={clientsState.summary.total} />
        <SummaryChip label="Activos" value={clientsState.summary.activos} />
        <SummaryChip label="Potenciales" value={clientsState.summary.potenciales} />
        <SummaryChip label="Leads nuevos" value={leadsState.summary.nuevos} />
      </div>

      <article id="crm-tour-clients-workspace" className="crm-card rounded-[1.8rem] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="crm-heading text-lg font-semibold">Clientes y captacion</p>
            <p className="crm-muted mt-1 text-sm">
              Consolida cartera activa, leads web y conversion comercial en un mismo espacio.
            </p>
          </div>

          <div id="crm-tour-client-actions" className="flex flex-col gap-3 sm:flex-row">
            <label className="crm-input flex min-w-[18rem] items-center gap-2 rounded-full px-4 py-3 text-sm">
              <Search className="size-4" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar cliente, correo o documento"
                className="w-full bg-transparent outline-none"
              />
            </label>
            <button
              type="button"
              onClick={() => {
                void loadClients();
                void loadLeads();
              }}
              className="crm-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium transition-colors"
            >
              <RefreshCcw className="size-4" />
              Recargar
            </button>
            {canCreateLead ? (
              <button
                type="button"
                onClick={() => setLeadFormOpen((current) => !current)}
                className="crm-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors"
              >
                <Plus className="size-4" />
                {leadFormOpen ? "Cerrar lead" : "Nuevo lead"}
              </button>
            ) : null}
            {canCreateClient ? (
              <button
                type="button"
                onClick={() => setFormOpen((current) => !current)}
                className="crm-button-primary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors"
              >
                <Plus className="size-4" />
                {formOpen ? "Cerrar formulario" : "Nuevo cliente"}
              </button>
            ) : null}
          </div>
        </div>

        {feedback ? (
          <div className="crm-card-soft crm-muted mt-5 rounded-[1.2rem] px-4 py-3 text-sm">
            {feedback}
          </div>
        ) : null}

        {leadFormOpen ? (
          <form
            className="mt-6 grid gap-4 rounded-[1.6rem] border border-[var(--crm-divider)] p-5 md:grid-cols-2 xl:grid-cols-4"
            onSubmit={handleCreateLead}
          >
            <input
              required
              value={leadFormState.nombre}
              onChange={(event) => setLeadFormState((current) => ({ ...current, nombre: event.target.value }))}
              className="crm-input rounded-2xl px-4 py-3 text-sm outline-none"
              placeholder="Nombre del contacto"
            />
            <input
              required
              type="email"
              value={leadFormState.email}
              onChange={(event) => setLeadFormState((current) => ({ ...current, email: event.target.value }))}
              className="crm-input rounded-2xl px-4 py-3 text-sm outline-none"
              placeholder="Correo del lead"
            />
            <input
              value={leadFormState.telefono}
              onChange={(event) => setLeadFormState((current) => ({ ...current, telefono: event.target.value }))}
              className="crm-input rounded-2xl px-4 py-3 text-sm outline-none"
              placeholder="Telefono"
            />
            <input
              value={leadFormState.empresa}
              onChange={(event) => setLeadFormState((current) => ({ ...current, empresa: event.target.value }))}
              className="crm-input rounded-2xl px-4 py-3 text-sm outline-none"
              placeholder="Empresa"
            />
            <select
              value={leadFormState.areaPracticaId ?? ""}
              onChange={(event) => setLeadFormState((current) => ({ ...current, areaPracticaId: event.target.value }))}
              className="crm-select rounded-2xl px-4 py-3 text-sm outline-none"
            >
              <option value="">Area de practica</option>
              {catalogo?.areasPractica.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.nombre}
                </option>
              ))}
            </select>
            <select
              value={leadFormState.estado ?? "NUEVO"}
              onChange={(event) =>
                setLeadFormState((current) => ({
                  ...current,
                  estado: event.target.value as LeadCreatePayload["estado"],
                }))
              }
              className="crm-select rounded-2xl px-4 py-3 text-sm outline-none"
            >
              {Object.entries(estadoLeadLabel).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={leadFormState.asignadoAId ?? ""}
              onChange={(event) => setLeadFormState((current) => ({ ...current, asignadoAId: event.target.value || null }))}
              className="crm-select rounded-2xl px-4 py-3 text-sm outline-none"
            >
              <option value="">Asignado a</option>
              {catalogo?.responsables.map((responsable) => (
                <option key={responsable.id} value={responsable.id}>
                  {responsable.nombreCompleto}
                </option>
              ))}
            </select>
            <label className="crm-card-soft flex items-center gap-3 rounded-2xl px-4 py-3 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={leadFormState.esCompartido ?? false}
                onChange={(event) =>
                  setLeadFormState((current) => ({
                    ...current,
                    esCompartido: event.target.checked,
                  }))
                }
                className="size-4 accent-brand-green"
              />
              Compartir lead con el resto del estudio
            </label>
            <textarea
              required
              value={leadFormState.mensaje}
              onChange={(event) => setLeadFormState((current) => ({ ...current, mensaje: event.target.value }))}
              className="crm-textarea rounded-[1.3rem] px-4 py-3 text-sm outline-none md:col-span-2 xl:col-span-4"
              rows={3}
              placeholder="Resumen comercial o juridico inicial"
            />
            <div className="flex justify-end md:col-span-2 xl:col-span-4">
              <button
                type="submit"
                disabled={busyKey === "create-lead"}
                className="crm-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-70"
              >
                {busyKey === "create-lead" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <UserPlus className="size-4" />
                )}
                Registrar lead
              </button>
            </div>
          </form>
        ) : null}

        {formOpen ? (
          <form className="mt-6 grid gap-4 rounded-[1.6rem] border border-[var(--crm-divider)] p-5 md:grid-cols-2 xl:grid-cols-4" onSubmit={handleCreateClient}>
            <select
              value={formState.tipoPersona}
              onChange={(event) => setFormState((current) => ({ ...current, tipoPersona: event.target.value as ClienteCreatePayload["tipoPersona"] }))}
              className="crm-select rounded-2xl px-4 py-3 text-sm outline-none"
            >
              <option value="JURIDICA">Persona juridica</option>
              <option value="NATURAL">Persona natural</option>
            </select>
            <input
              required
              value={formState.nombresORazonSocial}
              onChange={(event) => setFormState((current) => ({ ...current, nombresORazonSocial: event.target.value }))}
              className="crm-input rounded-2xl px-4 py-3 text-sm outline-none xl:col-span-2"
              placeholder="Nombre o razon social"
            />
            <input
              value={formState.tipoDocumento}
              onChange={(event) => setFormState((current) => ({ ...current, tipoDocumento: event.target.value }))}
              className="crm-input rounded-2xl px-4 py-3 text-sm outline-none"
              placeholder="Tipo de documento"
            />
            <input
              value={formState.numeroDocumento}
              onChange={(event) => setFormState((current) => ({ ...current, numeroDocumento: event.target.value }))}
              className="crm-input rounded-2xl px-4 py-3 text-sm outline-none"
              placeholder="Numero de documento"
            />
            <input
              value={formState.email}
              onChange={(event) => setFormState((current) => ({ ...current, email: event.target.value }))}
              className="crm-input rounded-2xl px-4 py-3 text-sm outline-none"
              placeholder="Correo"
            />
            <input
              value={formState.telefono}
              onChange={(event) => setFormState((current) => ({ ...current, telefono: event.target.value }))}
              className="crm-input rounded-2xl px-4 py-3 text-sm outline-none"
              placeholder="Telefono"
            />
            <input
              value={formState.direccion}
              onChange={(event) => setFormState((current) => ({ ...current, direccion: event.target.value }))}
              className="crm-input rounded-2xl px-4 py-3 text-sm outline-none md:col-span-2"
              placeholder="Direccion"
            />
            <textarea
              value={formState.observaciones}
              onChange={(event) => setFormState((current) => ({ ...current, observaciones: event.target.value }))}
              className="crm-textarea rounded-[1.3rem] px-4 py-3 text-sm outline-none md:col-span-2 xl:col-span-4"
              rows={3}
              placeholder="Observaciones comerciales o legales"
            />
            <label className="crm-card-soft flex items-center gap-3 rounded-2xl px-4 py-3 text-sm md:col-span-2 xl:col-span-2">
              <input
                type="checkbox"
                checked={formState.esCompartido ?? false}
                onChange={(event) =>
                  setFormState((current) => ({
                    ...current,
                    esCompartido: event.target.checked,
                  }))
                }
                className="size-4 accent-brand-green"
              />
              Compartir cliente con el resto del estudio
            </label>
            <div className="md:col-span-2 xl:col-span-4 flex justify-end">
              <button type="submit" disabled={busyKey === "create-client"} className="crm-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold disabled:opacity-70">
                {busyKey === "create-client" ? <LoaderCircle className="size-4 animate-spin" /> : <UserPlus className="size-4" />}
                Registrar cliente
              </button>
            </div>
          </form>
        ) : null}
      </article>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_0.9fr]">
        <article id="crm-tour-leads-bandeja" className="crm-card overflow-hidden rounded-[1.8rem]">
          <div className="border-b border-[var(--crm-divider)] px-5 py-4">
            <p className="crm-heading text-lg font-semibold">Directorio de clientes</p>
            <p className="crm-muted text-sm">{filteredClients.length} cliente(s) en la vista actual</p>
          </div>
          {clientsState.loading ? (
            <div className="flex items-center justify-center px-6 py-16 text-brand-slate">
              <LoaderCircle className="mr-3 size-5 animate-spin" />
              Cargando clientes...
            </div>
          ) : clientsState.error ? (
            <div className="px-6 py-12 text-center text-sm text-brand-red">{clientsState.error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="crm-table-head">
                    {["Cliente", "Documento", "Contacto", "Visibilidad", "Estado", "Expedientes", "Alta"].map((header) => (
                      <th key={header} className="px-4 py-3 text-left text-[0.64rem] font-semibold tracking-[0.16em] uppercase">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="crm-table-row border-t border-[var(--crm-divider)] align-top">
                      <td className="px-4 py-4">
                        <p className="crm-heading text-sm font-semibold">{client.nombre}</p>
                        <p className="crm-muted mt-1 text-xs">{tipoPersonaLabel[client.tipoPersona]} · {client.email ?? "Sin correo"}</p>
                      </td>
                      <td className="px-4 py-4 text-sm crm-muted">{client.tipoDocumento ?? "-"} {client.numeroDocumento ?? ""}</td>
                      <td className="px-4 py-4 text-sm crm-muted">
                        {client.contactoPrincipal ? `${client.contactoPrincipal.nombre} · ${client.contactoPrincipal.cargo ?? "Contacto"}` : "Sin contacto principal"}
                      </td>
                      <td className="px-4 py-4 text-sm crm-muted">
                        <div className="space-y-1">
                          <p>{client.esCompartido ? "Compartido" : "Privado"}</p>
                          <p className="text-xs crm-soft">
                            {client.creadoPorNombre ?? "Sin responsable"}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-sm">
                        <span className="crm-tag inline-flex rounded-full px-3 py-1 text-xs font-semibold">{client.estado}</span>
                      </td>
                      <td className="px-4 py-4 text-sm crm-muted">{client.expedientesActivos}/{client.expedientesTotales}</td>
                      <td className="px-4 py-4 text-sm crm-muted">{formatDate(client.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </article>

        <article className="crm-card overflow-hidden rounded-[1.8rem]">
          <div className="border-b border-[var(--crm-divider)] px-5 py-4">
            <p className="crm-heading text-lg font-semibold">Bandeja de leads</p>
            <p className="crm-muted text-sm">Formularios web y conversion comercial</p>
          </div>
          <div className="space-y-4 px-5 py-5">
            {leadsState.loading ? (
              <div className="flex items-center justify-center py-12 text-brand-slate">
                <LoaderCircle className="mr-3 size-5 animate-spin" />
                Cargando leads...
              </div>
            ) : leadsState.error ? (
              <div className="text-sm text-brand-red">{leadsState.error}</div>
            ) : leadsState.items.length === 0 ? (
              <div className="text-sm crm-muted">Aun no hay formularios registrados.</div>
            ) : (
              leadsState.items.map((lead) => (
                <article key={lead.id} className="crm-card-soft rounded-[1.4rem] p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="crm-heading text-sm font-semibold">{lead.empresa ?? lead.nombre}</p>
                    <span className="crm-tag inline-flex rounded-full px-2 py-1 text-[0.68rem] font-semibold">{estadoLeadLabel[lead.estado]}</span>
                    {lead.cliente ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-brand-green-bg px-2 py-1 text-[0.68rem] font-semibold text-brand-green">
                        <CheckCircle2 className="size-3" />
                        Cliente creado
                      </span>
                    ) : null}
                  </div>
                  <p className="crm-muted mt-2 text-sm leading-7">{lead.mensaje}</p>
                  <p className="crm-soft mt-3 text-xs">
                    {lead.nombre} · {lead.email} · {lead.areaPractica?.nombre ?? "Sin area"}
                  </p>
                  <p className="crm-soft mt-1 text-xs">
                    {lead.esCompartido ? "Compartido con el estudio" : "Privado"} ·{" "}
                    {lead.creadoPor?.nombreCompleto ?? "Creado desde web"}
                  </p>
                  <div className="mt-4 grid gap-2">
                    <select
                      value={lead.estado}
                      disabled={!canManageLeads || busyKey === `lead-${lead.id}`}
                      onChange={(event) =>
                        void handleLeadUpdate(lead.id, {
                          estado: event.target.value as LeadUpdatePayload["estado"],
                        })
                      }
                      className="crm-select rounded-full px-3 py-2 text-xs outline-none"
                    >
                      {Object.entries(estadoLeadLabel).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <select
                      value={lead.asignadoA?.id ?? ""}
                      disabled={!canManageLeads || busyKey === `lead-${lead.id}`}
                      onChange={(event) => void handleLeadUpdate(lead.id, { asignadoAId: event.target.value || null })}
                      className="crm-select rounded-full px-3 py-2 text-xs outline-none"
                    >
                      <option value="">Sin asignar</option>
                      {catalogo?.responsables.map((responsable) => (
                        <option key={responsable.id} value={responsable.id}>{responsable.nombreCompleto}</option>
                      ))}
                    </select>
                    <label className="crm-card-soft flex items-center gap-2 rounded-full px-3 py-2 text-xs">
                      <input
                        type="checkbox"
                        checked={lead.esCompartido}
                        disabled={!canManageLeads || busyKey === `lead-${lead.id}`}
                        onChange={(event) =>
                          void handleLeadUpdate(lead.id, {
                            esCompartido: event.target.checked,
                          })
                        }
                        className="size-4 accent-brand-green"
                      />
                      Compartir con el estudio
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!canManageLeads || !!lead.cliente || busyKey === `lead-convert-${lead.id}`}
                        onClick={() => void handleLeadConvert(lead.id)}
                        className="crm-button-primary rounded-full px-3 py-2 text-xs font-semibold disabled:opacity-60"
                      >
                        {busyKey === `lead-convert-${lead.id}` ? "Convirtiendo..." : "Convertir a cliente"}
                      </button>
                      <span className="crm-soft self-center text-xs">{formatDate(lead.createdAt)}</span>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </article>
      </div>
    </section>
  );
}

