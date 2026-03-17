"use client";

import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock3,
  Download,
  FileUp,
  LoaderCircle,
  NotebookPen,
  Save,
  TriangleAlert,
} from "lucide-react";
import { CrmStatusBadge } from "@/components/crm/crm-status-badge";
import type {
  DocumentoEstadoRevision,
  ExpedienteCatalogo,
  ExpedienteDetalle,
  NotaExpedienteTipo,
  NotaExpedienteVisibilidad,
} from "@/lib/crm-expedientes";

type ActionResult = {
  ok: boolean;
  mensaje?: string;
};

type CrmExpedienteDetailPanelProps = {
  detail: ExpedienteDetalle | null;
  catalogo: ExpedienteCatalogo | null;
  loading: boolean;
  error: string | null;
  onReload: () => void;
  onSaveWorkspace: (payload: {
    resumenEjecutivo?: string;
    siguientePaso?: string;
  }) => Promise<ActionResult>;
  onCreateNote: (payload: {
    titulo?: string;
    tipo: NotaExpedienteTipo;
    contenido: string;
    destacado?: boolean;
    visibilidad?: NotaExpedienteVisibilidad;
  }) => Promise<ActionResult>;
  onUploadDocument: (payload: FormData) => Promise<ActionResult>;
  onUpdateDocument: (
    documentoId: string,
    payload: {
      estadoRevision?: DocumentoEstadoRevision;
      descripcionInterna?: string;
    },
  ) => Promise<ActionResult>;
};

const notaLabels: Record<NotaExpedienteTipo, string> = {
  RESUMEN: "Resumenes",
  CONCLUSION: "Conclusiones",
  AVANCE: "Avances",
  PENDIENTE: "Pendientes",
  CONTEXTO: "Contexto",
  OTRO: "Notas varias",
};

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

function formatBytes(value: number | null) {
  if (!value || value <= 0) {
    return "Sin tamano";
  }

  const units = ["B", "KB", "MB", "GB"];
  let amount = value;
  let unitIndex = 0;

  while (amount >= 1024 && unitIndex < units.length - 1) {
    amount /= 1024;
    unitIndex += 1;
  }

  return `${amount.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function DetailMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "green" | "amber" | "red" | "blue";
}) {
  const toneMap = {
    green: "bg-brand-green-bg text-brand-green",
    amber: "bg-brand-amber-bg text-brand-amber",
    red: "bg-brand-red-bg text-brand-red",
    blue: "bg-brand-blue-bg text-brand-blue",
  } as const;

  return (
    <div className="crm-card-soft rounded-[1.4rem] p-4">
      <div
        className={`inline-flex rounded-full px-3 py-1 text-[0.68rem] font-semibold tracking-[0.14em] uppercase ${toneMap[tone]}`}
      >
        {label}
      </div>
      <p className="crm-heading mt-4 font-display text-4xl">{value}</p>
    </div>
  );
}

export function CrmExpedienteDetailPanel({
  detail,
  catalogo,
  loading,
  error,
  onReload,
  onSaveWorkspace,
  onCreateNote,
  onUploadDocument,
  onUpdateDocument,
}: CrmExpedienteDetailPanelProps) {
  const [workspaceDraft, setWorkspaceDraft] = useState({
    resumenEjecutivo: detail?.expediente.resumenEjecutivo ?? "",
    siguientePaso: detail?.expediente.siguientePaso ?? "",
  });
  const [noteDraft, setNoteDraft] = useState<{
    titulo: string;
    tipo: NotaExpedienteTipo;
    contenido: string;
    destacado: boolean;
    visibilidad: NotaExpedienteVisibilidad;
  }>({
    titulo: "",
    tipo: "AVANCE",
    contenido: "",
    destacado: false,
    visibilidad: "PRIVADA",
  });
  const [documentDraft, setDocumentDraft] = useState<{
    tipoDocumentoId: string;
    estadoRevision: DocumentoEstadoRevision;
    descripcionInterna: string;
    fechaDocumento: string;
    esConfidencial: boolean;
    archivo: File | null;
  }>({
    tipoDocumentoId: catalogo?.tiposDocumento[0]?.id ?? "",
    estadoRevision: "POR_REVISAR",
    descripcionInterna: "",
    fechaDocumento: "",
    esConfidencial: true,
    archivo: null,
  });
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const notasPorTipo = useMemo(() => {
    return (catalogo?.opciones.tiposNota ?? []).map((tipo) => ({
      tipo,
      label: notaLabels[tipo],
      items: detail?.notas.filter((nota) => nota.tipo === tipo) ?? [],
    }));
  }, [catalogo?.opciones.tiposNota, detail?.notas]);

  const documentosRevisados =
    detail?.documentos.filter((documento) => documento.estadoRevision === "REVISADO") ??
    [];
  const documentosPorRevisar =
    detail?.documentos.filter(
      (documento) => documento.estadoRevision === "POR_REVISAR",
    ) ?? [];
  const documentosObservados =
    detail?.documentos.filter((documento) => documento.estadoRevision === "OBSERVADO") ??
    [];

  if (!detail && !loading && !error) {
    return (
      <section id="crm-tour-expediente-detail">
        <article className="crm-card rounded-[1.8rem] px-6 py-12 text-center">
          <p className="crm-soft text-xs font-semibold tracking-[0.24em] uppercase">
            Ficha centralizada
          </p>
          <h3 className="crm-heading mt-4 font-display text-4xl">
            Selecciona un expediente
          </h3>
          <p className="crm-muted mx-auto mt-4 max-w-2xl text-sm leading-7">
            Cuando abras una ficha veras su resumen ejecutivo, documentos revisados y por
            revisar, conclusiones, avances, pendientes y un acceso directo para generar el
            PDF ordenado del caso.
          </p>
        </article>
      </section>
    );
  }

  if (loading) {
    return (
      <section id="crm-tour-expediente-detail">
        <article className="crm-card rounded-[1.8rem] px-6 py-12 text-center">
          <LoaderCircle className="mx-auto size-8 animate-spin text-brand-green" />
          <p className="crm-muted mt-4 text-sm">Cargando ficha del expediente...</p>
        </article>
      </section>
    );
  }

  if (error || !detail) {
    return (
      <section id="crm-tour-expediente-detail">
        <article className="crm-card rounded-[1.8rem] px-6 py-12 text-center">
          <p className="text-sm font-semibold text-brand-red">
            {error ?? "No pudimos cargar la ficha del expediente."}
          </p>
          <button
            type="button"
            onClick={onReload}
            className="crm-button-secondary mt-5 rounded-full px-5 py-3 text-sm font-semibold transition-colors"
          >
            Reintentar
          </button>
        </article>
      </section>
    );
  }

  async function handleWorkspaceSubmit() {
    setBusyKey("workspace");
    const result = await onSaveWorkspace(workspaceDraft);
    setBusyKey(null);
    setFeedback(result.mensaje ?? (result.ok ? "Ficha actualizada." : "No pudimos guardar."));
  }

  async function handleNoteSubmit() {
    setBusyKey("note");
    const result = await onCreateNote(noteDraft);
    setBusyKey(null);

    if (result.ok) {
      setNoteDraft({
        titulo: "",
        tipo: "AVANCE",
        contenido: "",
        destacado: false,
        visibilidad: "PRIVADA",
      });
    }

    setFeedback(result.mensaje ?? (result.ok ? "Nota registrada." : "No pudimos registrar la nota."));
  }

  async function handleDocumentSubmit() {
    if (!documentDraft.archivo) {
      setFeedback("Selecciona un archivo para cargar.");
      return;
    }

    const payload = new FormData();
    payload.append("archivo", documentDraft.archivo);
    payload.append("tipoDocumentoId", documentDraft.tipoDocumentoId);
    payload.append("estadoRevision", documentDraft.estadoRevision);
    payload.append("descripcionInterna", documentDraft.descripcionInterna);
    payload.append("esConfidencial", String(documentDraft.esConfidencial));

    if (documentDraft.fechaDocumento) {
      payload.append("fechaDocumento", documentDraft.fechaDocumento);
    }

    setBusyKey("document");
    const result = await onUploadDocument(payload);
    setBusyKey(null);

    if (result.ok) {
      setDocumentDraft({
        tipoDocumentoId: catalogo?.tiposDocumento[0]?.id ?? "",
        estadoRevision: "POR_REVISAR",
        descripcionInterna: "",
        fechaDocumento: "",
        esConfidencial: true,
        archivo: null,
      });
    }

    setFeedback(
      result.mensaje ?? (result.ok ? "Documento cargado correctamente." : "No pudimos cargar el documento."),
    );
  }

  async function handleDocumentStateChange(
    documentoId: string,
    estadoRevision: DocumentoEstadoRevision,
  ) {
    setBusyKey(`document-${documentoId}`);
    const result = await onUpdateDocument(documentoId, { estadoRevision });
    setBusyKey(null);
    setFeedback(
      result.mensaje ?? (result.ok ? "Documento actualizado." : "No pudimos actualizar el documento."),
    );
  }

  return (
    <section id="crm-tour-expediente-detail" className="space-y-5">
      <article className="crm-card rounded-[1.8rem] p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="crm-soft text-xs font-semibold tracking-[0.2em] uppercase">
              {detail.expediente.numero}
            </p>
            <h3 className="crm-heading mt-3 font-display text-4xl">
              {detail.expediente.titulo}
            </h3>
            <p className="crm-muted mt-3 max-w-3xl text-sm leading-7">
              Cliente: {detail.expediente.cliente} | Materia: {detail.expediente.materia} |
              Responsable: {detail.expediente.abogado}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <CrmStatusBadge estado={detail.expediente.estadoVista} />
              <span className="crm-tag inline-flex rounded-full px-3 py-1 text-xs font-semibold">
                Prioridad {detail.expediente.prioridad}
              </span>
              <span className="crm-tag inline-flex rounded-full px-3 py-1 text-xs font-semibold">
                Apertura {formatDate(detail.expediente.fechaApertura)}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onReload}
              className="crm-button-secondary rounded-full px-4 py-3 text-sm font-semibold transition-colors"
            >
              Recargar ficha
            </button>
            <a
              href={`/api/expedientes/${detail.expediente.id}/pdf`}
              className="crm-button-primary inline-flex items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition-colors"
            >
              <Download className="size-4" />
              Descargar PDF
            </a>
          </div>
        </div>

        {feedback ? (
          <div className="crm-card-soft crm-muted mt-5 rounded-[1.2rem] px-4 py-3 text-sm">
            {feedback}
          </div>
        ) : null}
      </article>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <DetailMetric
          label="Documentos revisados"
          value={detail.metricas.documentosRevisados}
          tone="green"
        />
        <DetailMetric
          label="Por revisar"
          value={detail.metricas.documentosPorRevisar}
          tone="amber"
        />
        <DetailMetric
          label="Observados"
          value={detail.metricas.documentosObservados}
          tone="red"
        />
        <DetailMetric
          label="Notas activas"
          value={detail.metricas.notasTotales}
          tone="blue"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_0.8fr]">
        <article className="crm-card rounded-[1.8rem] p-6">
          <div className="flex items-center gap-3">
            <NotebookPen className="size-5 text-brand-green" />
            <div>
              <h4 className="crm-heading text-lg font-semibold">Resumen ejecutivo y siguiente paso</h4>
              <p className="crm-muted text-sm">
                Este bloque condensa la lectura actual del caso para que cualquier abogado o socio
                pueda retomar el expediente con contexto inmediato.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <textarea
              value={workspaceDraft.resumenEjecutivo}
              onChange={(event) =>
                setWorkspaceDraft((current) => ({
                  ...current,
                  resumenEjecutivo: event.target.value,
                }))
              }
              rows={5}
              className="crm-textarea w-full rounded-[1.3rem] px-4 py-3 text-sm leading-7 outline-none transition-colors"
              placeholder="Sintesis juridica del expediente, criterio aplicado, riesgos y lectura actual."
            />
            <textarea
              value={workspaceDraft.siguientePaso}
              onChange={(event) =>
                setWorkspaceDraft((current) => ({
                  ...current,
                  siguientePaso: event.target.value,
                }))
              }
              rows={3}
              className="crm-textarea w-full rounded-[1.3rem] px-4 py-3 text-sm leading-7 outline-none transition-colors"
              placeholder="Proxima accion prioritaria, fecha y responsable sugerido."
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void handleWorkspaceSubmit()}
                disabled={busyKey === "workspace"}
                className="crm-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-70"
              >
                {busyKey === "workspace" ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Guardar ficha
              </button>
            </div>
          </div>
        </article>

        <article className="crm-card rounded-[1.8rem] p-6">
          <div className="flex items-center gap-3">
            <FileUp className="size-5 text-brand-green" />
            <div>
              <h4 className="crm-heading text-lg font-semibold">Carga documental</h4>
              <p className="crm-muted text-sm">
                Guarda archivos del expediente directamente en PostgreSQL para mantener todo el caso
                centralizado en la misma ficha.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3">
            <select
              value={documentDraft.tipoDocumentoId}
              onChange={(event) =>
                setDocumentDraft((current) => ({
                  ...current,
                  tipoDocumentoId: event.target.value,
                }))
              }
              className="crm-select rounded-[1.1rem] px-4 py-3 text-sm outline-none transition-colors"
            >
              {catalogo?.tiposDocumento.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre}
                </option>
              ))}
            </select>
            <select
              value={documentDraft.estadoRevision}
              onChange={(event) =>
                setDocumentDraft((current) => ({
                  ...current,
                  estadoRevision: event.target.value as DocumentoEstadoRevision,
                }))
              }
              className="crm-select rounded-[1.1rem] px-4 py-3 text-sm outline-none transition-colors"
            >
              {catalogo?.opciones.estadosRevisionDocumento.map((estado) => (
                <option key={estado} value={estado}>
                  {estado.replaceAll("_", " ")}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={documentDraft.fechaDocumento}
              onChange={(event) =>
                setDocumentDraft((current) => ({
                  ...current,
                  fechaDocumento: event.target.value,
                }))
              }
              className="crm-input rounded-[1.1rem] px-4 py-3 text-sm outline-none transition-colors"
            />
            <textarea
              value={documentDraft.descripcionInterna}
              onChange={(event) =>
                setDocumentDraft((current) => ({
                  ...current,
                  descripcionInterna: event.target.value,
                }))
              }
              rows={3}
              className="crm-textarea rounded-[1.1rem] px-4 py-3 text-sm outline-none transition-colors"
              placeholder="Que contiene este documento y por que es relevante."
            />
            <label className="crm-card-soft rounded-[1.2rem] px-4 py-4 text-sm">
              <span className="crm-heading font-medium">Archivo adjunto</span>
              <input
                type="file"
                className="mt-3 block w-full text-sm"
                onChange={(event) =>
                  setDocumentDraft((current) => ({
                    ...current,
                    archivo: event.target.files?.[0] ?? null,
                  }))
                }
              />
            </label>
            <label className="crm-muted inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={documentDraft.esConfidencial}
                onChange={(event) =>
                  setDocumentDraft((current) => ({
                    ...current,
                    esConfidencial: event.target.checked,
                  }))
                }
              />
              Marcar como confidencial
            </label>
            <button
              type="button"
              onClick={() => void handleDocumentSubmit()}
              disabled={busyKey === "document"}
              className="crm-button-primary inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-70"
            >
              {busyKey === "document" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <FileUp className="size-4" />
              )}
              Subir documento
            </button>
          </div>
        </article>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_0.9fr]">
        <article className="crm-card rounded-[1.8rem] p-6">
          <div className="flex items-center gap-3">
            <NotebookPen className="size-5 text-brand-green" />
            <div>
              <h4 className="crm-heading text-lg font-semibold">Notas estructuradas del caso</h4>
              <p className="crm-muted text-sm">
                Registra conclusiones, avances, pendientes y cualquier conocimiento util para que el
                expediente no dependa solo de la memoria del responsable.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <input
              value={noteDraft.titulo}
              onChange={(event) =>
                setNoteDraft((current) => ({
                  ...current,
                  titulo: event.target.value,
                }))
              }
              className="crm-input rounded-[1.1rem] px-4 py-3 text-sm outline-none transition-colors"
              placeholder="Titulo breve"
            />
            <select
              value={noteDraft.tipo}
              onChange={(event) =>
                setNoteDraft((current) => ({
                  ...current,
                  tipo: event.target.value as NotaExpedienteTipo,
                }))
              }
              className="crm-select rounded-[1.1rem] px-4 py-3 text-sm outline-none transition-colors"
            >
              {catalogo?.opciones.tiposNota.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {notaLabels[tipo]}
                </option>
              ))}
            </select>
            <textarea
              value={noteDraft.contenido}
              onChange={(event) =>
                setNoteDraft((current) => ({
                  ...current,
                  contenido: event.target.value,
                }))
              }
              rows={4}
              className="crm-textarea md:col-span-2 rounded-[1.1rem] px-4 py-3 text-sm leading-7 outline-none transition-colors"
              placeholder="Describe el avance, criterio, hallazgo o pendiente que debe quedar en la ficha."
            />
            <select
              value={noteDraft.visibilidad}
              onChange={(event) =>
                setNoteDraft((current) => ({
                  ...current,
                  visibilidad: event.target.value as NotaExpedienteVisibilidad,
                }))
              }
              className="crm-select rounded-[1.1rem] px-4 py-3 text-sm outline-none transition-colors"
            >
              {catalogo?.opciones.visibilidadesNota.map((visibilidad) => (
                <option key={visibilidad} value={visibilidad}>
                  {visibilidad}
                </option>
              ))}
            </select>
            <label className="crm-muted inline-flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={noteDraft.destacado}
                onChange={(event) =>
                  setNoteDraft((current) => ({
                    ...current,
                    destacado: event.target.checked,
                  }))
                }
              />
              Destacar en la ficha
            </label>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => void handleNoteSubmit()}
              disabled={busyKey === "note"}
              className="crm-button-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors disabled:opacity-70"
            >
              {busyKey === "note" ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              Guardar nota
            </button>
          </div>

          <div className="mt-6 space-y-5">
            {notasPorTipo.map((bloque) =>
              bloque.items.length > 0 ? (
                <div key={bloque.tipo} className="crm-card-soft rounded-[1.4rem] p-4">
                  <p className="crm-heading text-sm font-semibold">{bloque.label}</p>
                  <div className="mt-3 space-y-3">
                    {bloque.items.map((nota) => (
                      <article key={nota.id} className="rounded-[1rem] border border-[var(--crm-divider)] px-4 py-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="crm-heading text-sm font-semibold">
                            {nota.titulo ?? "Nota sin titulo"}
                          </p>
                          {nota.destacado ? (
                            <span className="bg-brand-green-bg text-brand-green inline-flex rounded-full px-2 py-1 text-[0.65rem] font-semibold uppercase">
                              Destacada
                            </span>
                          ) : null}
                        </div>
                        <p className="crm-muted mt-2 text-sm leading-7">{nota.contenido}</p>
                        <p className="crm-soft mt-3 text-xs">
                          {nota.autor.nombreCompleto} | {formatDate(nota.updatedAt)} | {nota.visibilidad}
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              ) : null,
            )}
          </div>
        </article>

        <div className="space-y-5">
          <article className="crm-card rounded-[1.8rem] p-6">
            <div className="flex items-center gap-3">
              <Clock3 className="size-5 text-brand-blue" />
              <div>
                <h4 className="crm-heading text-lg font-semibold">Documentos por estado</h4>
                <p className="crm-muted text-sm">
                  Estado documental operativo del expediente.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              {[
                {
                  titulo: "Revisados",
                  icon: CheckCircle2,
                  items: documentosRevisados,
                },
                {
                  titulo: "Por revisar",
                  icon: Clock3,
                  items: documentosPorRevisar,
                },
                {
                  titulo: "Observados",
                  icon: TriangleAlert,
                  items: documentosObservados,
                },
              ].map((grupo) => (
                <div key={grupo.titulo} className="crm-card-soft rounded-[1.3rem] p-4">
                  <p className="crm-heading text-sm font-semibold">
                    {grupo.titulo} ({grupo.items.length})
                  </p>
                  <div className="mt-3 space-y-3">
                    {grupo.items.length === 0 ? (
                      <p className="crm-soft text-sm">Sin documentos en esta categoria.</p>
                    ) : (
                      grupo.items.map((documento) => (
                        <article key={documento.id} className="rounded-[1rem] border border-[var(--crm-divider)] px-4 py-3">
                          <p className="crm-heading text-sm font-semibold">
                            {documento.nombreOriginal}
                          </p>
                          <p className="crm-muted mt-1 text-xs">
                            {documento.tipoDocumento.nombre} | {formatBytes(documento.tamanoBytes)}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <select
                              value={documento.estadoRevision}
                              onChange={(event) =>
                                void handleDocumentStateChange(
                                  documento.id,
                                  event.target.value as DocumentoEstadoRevision,
                                )
                              }
                              className="crm-select rounded-full px-3 py-2 text-xs outline-none transition-colors"
                            >
                              {catalogo?.opciones.estadosRevisionDocumento.map((estado) => (
                                <option key={estado} value={estado}>
                                  {estado.replaceAll("_", " ")}
                                </option>
                              ))}
                            </select>
                            <a
                              href={`/api/expedientes/${detail.expediente.id}/documentos/${documento.id}/descarga`}
                              className="crm-button-secondary inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold transition-colors"
                            >
                              <Download className="size-3.5" />
                              Descargar
                            </a>
                            {busyKey === `document-${documento.id}` ? (
                              <span className="crm-soft inline-flex items-center gap-2 text-xs">
                                <LoaderCircle className="size-3.5 animate-spin" />
                                Actualizando...
                              </span>
                            ) : null}
                          </div>
                        </article>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="crm-card rounded-[1.8rem] p-6">
            <h4 className="crm-heading text-lg font-semibold">Actuaciones y alertas</h4>
            <div className="mt-4 space-y-3">
              {detail.actuaciones.map((actuacion) => (
                <article key={actuacion.id} className="crm-card-soft rounded-[1.2rem] p-4">
                  <p className="crm-heading text-sm font-semibold">
                    {formatDate(actuacion.fechaEvento)} - {actuacion.tipo}
                  </p>
                  <p className="crm-muted mt-2 text-sm leading-7">{actuacion.descripcion}</p>
                </article>
              ))}
              {detail.avisos.map((aviso) => (
                <article key={aviso.id} className="crm-card-soft rounded-[1.2rem] p-4">
                  <p className="crm-heading text-sm font-semibold">{aviso.titulo}</p>
                  <p className="crm-muted mt-2 text-sm">
                    Vence {formatDate(aviso.fechaVencimiento)} | {aviso.asignadoA.nombreCompleto}
                  </p>
                </article>
              ))}
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
