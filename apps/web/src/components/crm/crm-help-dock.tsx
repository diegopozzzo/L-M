"use client";

import {
  ChevronDown,
  ChevronUp,
  CircleHelp,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { CrmViewId } from "@/data/crm-content";
import type { SessionUser } from "@/lib/auth";

type CrmHelpDockProps = {
  usuario: SessionUser;
  activeView: CrmViewId;
  onNavigate: (view: CrmViewId) => void;
};

type TourPosition = "top" | "right" | "bottom" | "left";

type TourStep = {
  id: string;
  el: string;
  view: CrmViewId;
  pos: TourPosition;
  title: string;
  body: string;
};

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
};

type TooltipState = {
  top: number;
  left: number;
  side: TourPosition;
  arrowOffset: number;
};

const TOUR_ACCENT = "#16A86A";
const VIEWPORT_PADDING = 16;
const SPOTLIGHT_PADDING = 12;
const GAP = 18;
const STORAGE_KEY = "atria-crm-tour-dock-open";

function isLeadershipRole(usuario: SessionUser) {
  return usuario.rol.nombre === "ADMIN" || usuario.rol.nombre === "SOCIO";
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function uniquePositions(preferred: TourPosition) {
  const list: TourPosition[] = [preferred, "right", "left", "top", "bottom"];
  return list.filter((value, index) => list.indexOf(value) === index);
}

function getSideScore(targetRect: SpotlightRect, side: TourPosition) {
  if (side === "right") {
    return window.innerWidth - (targetRect.left + targetRect.width);
  }

  if (side === "left") {
    return targetRect.left;
  }

  if (side === "top") {
    return targetRect.top;
  }

  return window.innerHeight - (targetRect.top + targetRect.height);
}

function fitsPlacement(
  targetRect: SpotlightRect,
  tooltipRect: DOMRect,
  side: TourPosition,
) {
  if (side === "right") {
    return (
      window.innerWidth - (targetRect.left + targetRect.width) >=
      tooltipRect.width + GAP + VIEWPORT_PADDING
    );
  }

  if (side === "left") {
    return targetRect.left >= tooltipRect.width + GAP + VIEWPORT_PADDING;
  }

  if (side === "top") {
    return targetRect.top >= tooltipRect.height + GAP + VIEWPORT_PADDING;
  }

  return (
    window.innerHeight - (targetRect.top + targetRect.height) >=
    tooltipRect.height + GAP + VIEWPORT_PADDING
  );
}

function chooseSide(
  targetRect: SpotlightRect,
  tooltipRect: DOMRect,
  preferred: TourPosition,
) {
  const candidates = uniquePositions(preferred);
  const fit = candidates.find((side) => fitsPlacement(targetRect, tooltipRect, side));

  if (fit) {
    return fit;
  }

  return candidates.sort(
    (left, right) =>
      getSideScore(targetRect, right) - getSideScore(targetRect, left),
  )[0];
}

function buildTourSteps(usuario: SessionUser) {
  const leadership = isLeadershipRole(usuario);
  const canReadClientes = usuario.permisos.includes("clientes.read");
  const canReadExpedientes = usuario.permisos.includes("expedientes.read");
  const canReadAvisos = usuario.permisos.includes("avisos.read");

  return [
    {
      id: "sidebar",
      el: "crm-tour-sidebar-nav",
      view: "dashboard" as const,
      pos: "bottom" as const,
      title: "Ubica la navegacion principal",
      body:
        "Desde aqui entras a dashboard, clientes, expedientes, documentos y avisos. Si necesitas mas espacio, puedes plegar este panel desde el encabezado y volver a expandirlo cuando quieras.",
    },
    {
      id: "overview",
      el: "crm-tour-dashboard-overview",
      view: "dashboard" as const,
      pos: "bottom" as const,
      title: leadership
        ? "Lee la operacion completa"
        : "Lee tu panorama de trabajo",
      body: leadership
        ? "Como administrador o socio, este bloque consolida la operacion visible del estudio para supervisar carga, clientes, documentos y leads."
        : "Como trabajador, este bloque resume tus asuntos propios y lo que te hayan compartido o asignado.",
    },
    canReadAvisos
      ? {
          id: "alerts",
          el: "crm-tour-alerts-button",
          view: "dashboard" as const,
          pos: "left" as const,
          title: "Monitorea avisos y vencimientos",
          body:
            "Usa esta entrada para revisar plazos, urgencias y recordatorios. Es la via rapida para no perder fechas criticas.",
        }
      : null,
    canReadClientes
      ? {
          id: "nav-clientes",
          el: "crm-tour-nav-clientes",
          view: "dashboard" as const,
          pos: "right" as const,
          title: "Continua con clientes y captacion",
          body:
            "Aqui pasas de un contacto o lead a una cartera juridica ordenada. El siguiente paso del tour te llevara ahi.",
        }
      : null,
    canReadClientes
      ? {
          id: "client-actions",
          el: "crm-tour-client-actions",
          view: "clientes" as const,
          pos: "bottom" as const,
          title: "Registra leads y clientes",
          body:
            "Primero crea el lead o cliente con visibilidad privada o compartida. Ese origen define quien podra ver la informacion despues.",
        }
      : null,
    canReadExpedientes
      ? {
          id: "nav-expedientes",
          el: "crm-tour-nav-expedientes",
          view: canReadClientes ? "clientes" : "dashboard",
          pos: "right" as const,
          title: "Abre el caso en expedientes",
          body:
            "Cuando el contacto ya esta claro, pasas a expedientes para abrir el caso, asignar responsable y consolidar la trazabilidad.",
        }
      : null,
    canReadExpedientes
      ? {
          id: "expediente-actions",
          el: "crm-tour-expediente-actions",
          view: "expedientes" as const,
          pos: "bottom" as const,
          title: "Crea o busca un expediente",
          body:
            "Desde esta zona puedes filtrar, buscar, recargar la vista y abrir el formulario para crear un expediente nuevo.",
        }
      : null,
    canReadExpedientes
      ? {
          id: "expediente-detail",
          el: "crm-tour-expediente-detail",
          view: "expedientes" as const,
          pos: "top" as const,
          title: "Centraliza criterio, documentos y PDF",
          body:
            "La ficha del expediente concentra resumen ejecutivo, siguiente paso, notas, documentos y la descarga ordenada del PDF del caso.",
        }
      : null,
  ].filter(Boolean) as TourStep[];
}

export function CrmHelpDock({
  usuario,
  activeView,
  onNavigate,
}: CrmHelpDockProps) {
  const activeTargetRef = useRef<HTMLElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const positionCurrentStepRef = useRef<(attempt?: number) => void>(() => undefined);
  const resizeTimerRef = useRef<number | null>(null);
  const measureTimerRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const confettiFrameRef = useRef<number | null>(null);
  const confettiStartRef = useRef<number>(0);
  const confettiParticlesRef = useRef<
    Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      color: string;
      rotation: number;
      speedX: number;
      speedY: number;
      spin: number;
      alpha: number;
    }>
  >([]);
  const [dockOpen, setDockOpen] = useState(true);
  const [tourOpen, setTourOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotlightRect>({
    top: 0,
    left: 0,
    width: 0,
    height: 0,
  });
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    top: VIEWPORT_PADDING,
    left: VIEWPORT_PADDING,
    side: "right",
    arrowOffset: 28,
  });
  const [confettiVisible, setConfettiVisible] = useState(false);

  const steps = useMemo(() => buildTourSteps(usuario), [usuario]);
  const currentStep = steps[stepIndex] ?? null;

  const clearActiveHighlight = useCallback(() => {
    if (activeTargetRef.current) {
      activeTargetRef.current.classList.remove("crm-tour-target-active");
      activeTargetRef.current = null;
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);

      if (stored === "true" || stored === "false") {
        setDockOpen(stored === "true");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, String(dockOpen));
  }, [dockOpen]);

  const stopConfetti = useCallback(() => {
    if (confettiFrameRef.current) {
      window.cancelAnimationFrame(confettiFrameRef.current);
      confettiFrameRef.current = null;
    }

    setConfettiVisible(false);
  }, []);

  const resizeConfettiCanvas = useCallback(() => {
    const canvas = confettiCanvasRef.current;

    if (!canvas) {
      return;
    }

    canvas.width = window.innerWidth * window.devicePixelRatio;
    canvas.height = window.innerHeight * window.devicePixelRatio;
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;

    const context = canvas.getContext("2d");
    context?.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
  }, []);

  const runConfetti = useCallback(() => {
    const canvas = confettiCanvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    resizeConfettiCanvas();
    setConfettiVisible(true);
    confettiParticlesRef.current = [];

    const colors = [TOUR_ACCENT, "#0F1724", "#D9A066", "#4A90D9", "#FFFFFF"];

    for (let index = 0; index < 180; index += 1) {
      confettiParticlesRef.current.push({
        x: Math.random() * window.innerWidth,
        y: -20 - Math.random() * window.innerHeight * 0.4,
        width: 6 + Math.random() * 8,
        height: 10 + Math.random() * 10,
        color: colors[index % colors.length],
        rotation: Math.random() * Math.PI * 2,
        speedX: -2 + Math.random() * 4,
        speedY: 3 + Math.random() * 5,
        spin: -0.2 + Math.random() * 0.4,
        alpha: 0.75 + Math.random() * 0.25,
      });
    }

    confettiStartRef.current = performance.now();

    const frame = (now: number) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      confettiParticlesRef.current.forEach((particle) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        particle.rotation += particle.spin;
        particle.speedY += 0.02;

        context.save();
        context.globalAlpha = particle.alpha;
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.fillStyle = particle.color;
        context.fillRect(
          -particle.width / 2,
          -particle.height / 2,
          particle.width,
          particle.height,
        );
        context.restore();
      });

      if (now - confettiStartRef.current < 2200) {
        confettiFrameRef.current = window.requestAnimationFrame(frame);
        return;
      }

      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      stopConfetti();
    };

    if (confettiFrameRef.current) {
      window.cancelAnimationFrame(confettiFrameRef.current);
    }

    confettiFrameRef.current = window.requestAnimationFrame(frame);
  }, [resizeConfettiCanvas, stopConfetti]);

  const finishTour = useCallback(() => {
    clearActiveHighlight();
    setTourOpen(false);
    setStepIndex(0);
    runConfetti();
  }, [clearActiveHighlight, runConfetti]);

  const closeTour = useCallback(() => {
    clearActiveHighlight();
    setTourOpen(false);
    setStepIndex(0);
  }, [clearActiveHighlight]);

  const positionTooltip = useCallback(
    (targetRect: SpotlightRect, preferred: TourPosition) => {
      const tooltipNode = tooltipRef.current;

      if (!tooltipNode) {
        return;
      }

      const tooltipRect = tooltipNode.getBoundingClientRect();
      const side = chooseSide(targetRect, tooltipRect, preferred);
      let top = VIEWPORT_PADDING;
      let left = VIEWPORT_PADDING;
      let arrowOffset = 24;

      if (side === "right") {
        left = targetRect.left + targetRect.width + GAP;
        top = clamp(
          targetRect.top + targetRect.height / 2 - tooltipRect.height / 2,
          VIEWPORT_PADDING,
          window.innerHeight - tooltipRect.height - VIEWPORT_PADDING,
        );
        arrowOffset = clamp(
          targetRect.top + targetRect.height / 2 - top - 8,
          18,
          tooltipRect.height - 30,
        );
      } else if (side === "left") {
        left = targetRect.left - tooltipRect.width - GAP;
        top = clamp(
          targetRect.top + targetRect.height / 2 - tooltipRect.height / 2,
          VIEWPORT_PADDING,
          window.innerHeight - tooltipRect.height - VIEWPORT_PADDING,
        );
        arrowOffset = clamp(
          targetRect.top + targetRect.height / 2 - top - 8,
          18,
          tooltipRect.height - 30,
        );
      } else if (side === "top") {
        top = targetRect.top - tooltipRect.height - GAP;
        left = clamp(
          targetRect.left + targetRect.width / 2 - tooltipRect.width / 2,
          VIEWPORT_PADDING,
          window.innerWidth - tooltipRect.width - VIEWPORT_PADDING,
        );
        arrowOffset = clamp(
          targetRect.left + targetRect.width / 2 - left - 8,
          18,
          tooltipRect.width - 30,
        );
      } else {
        top = targetRect.top + targetRect.height + GAP;
        left = clamp(
          targetRect.left + targetRect.width / 2 - tooltipRect.width / 2,
          VIEWPORT_PADDING,
          window.innerWidth - tooltipRect.width - VIEWPORT_PADDING,
        );
        arrowOffset = clamp(
          targetRect.left + targetRect.width / 2 - left - 8,
          18,
          tooltipRect.width - 30,
        );
      }

      setTooltipState({
        top: Math.round(top),
        left: Math.round(left),
        side,
        arrowOffset: Math.round(arrowOffset),
      });
    },
    [],
  );

  const positionCurrentStep = useCallback(
    (attempt = 0) => {
      const step = steps[stepIndex];

      if (!tourOpen || !step) {
        clearActiveHighlight();
        return;
      }

      if (step.view !== activeView) {
        clearActiveHighlight();
        onNavigate(step.view);

        if (attempt < 10) {
          measureTimerRef.current = window.setTimeout(() => {
            positionCurrentStepRef.current(attempt + 1);
          }, 180);
        }

        return;
      }

      const target = document.getElementById(step.el);

      if (!target) {
        clearActiveHighlight();
        if (attempt < 10) {
          measureTimerRef.current = window.setTimeout(() => {
            positionCurrentStepRef.current(attempt + 1);
          }, 140);
          return;
        }

        if (stepIndex < steps.length - 1) {
          setStepIndex((current) => current + 1);
        } else {
          closeTour();
        }

        return;
      }

      if (activeTargetRef.current !== target) {
        clearActiveHighlight();
        target.classList.add("crm-tour-target-active");
        activeTargetRef.current = target;
      }

      target.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });

      animationFrameRef.current = window.requestAnimationFrame(() => {
        animationFrameRef.current = window.requestAnimationFrame(() => {
          const rect = target.getBoundingClientRect();

          if (rect.width === 0 || rect.height === 0) {
            if (attempt < 10) {
              measureTimerRef.current = window.setTimeout(() => {
                positionCurrentStepRef.current(attempt + 1);
              }, 120);
            }

            return;
          }

          const spotlightRect = {
            top: Math.max(VIEWPORT_PADDING, rect.top - SPOTLIGHT_PADDING),
            left: Math.max(VIEWPORT_PADDING, rect.left - SPOTLIGHT_PADDING),
            width: Math.min(
              rect.width + SPOTLIGHT_PADDING * 2,
              window.innerWidth - VIEWPORT_PADDING * 2,
            ),
            height: Math.min(
              rect.height + SPOTLIGHT_PADDING * 2,
              window.innerHeight - VIEWPORT_PADDING * 2,
            ),
          };

          setSpotlight(spotlightRect);
          positionTooltip(spotlightRect, step.pos);
        });
      });
    },
    [
      activeView,
      clearActiveHighlight,
      closeTour,
      onNavigate,
      positionTooltip,
      stepIndex,
      steps,
      tourOpen,
    ],
  );

  useEffect(() => {
    positionCurrentStepRef.current = positionCurrentStep;
  }, [positionCurrentStep]);

  useEffect(() => {
    if (!tourOpen) {
      return;
    }

    const timer = window.setTimeout(() => {
      positionCurrentStepRef.current();
    }, 0);

    return () => {
      window.clearTimeout(timer);

      if (measureTimerRef.current) {
        window.clearTimeout(measureTimerRef.current);
        measureTimerRef.current = null;
      }

      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [positionCurrentStep, tourOpen]);

  useEffect(() => {
    if (!tourOpen) {
      return;
    }

    const handleViewportChange = () => {
      if (resizeTimerRef.current) {
        window.clearTimeout(resizeTimerRef.current);
      }

      resizeTimerRef.current = window.setTimeout(() => {
        positionCurrentStep();
      }, 40);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeTour();
        return;
      }

      if (event.key === "ArrowRight" || event.key === "Enter") {
        if (stepIndex >= steps.length - 1) {
          finishTour();
          return;
        }

        setStepIndex((current) => current + 1);
        return;
      }

      if (event.key === "ArrowLeft") {
        setStepIndex((current) => Math.max(0, current - 1));
      }
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, { passive: true });
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange);
      window.removeEventListener("keydown", handleKeyDown);

      if (resizeTimerRef.current) {
        window.clearTimeout(resizeTimerRef.current);
        resizeTimerRef.current = null;
      }
    };
  }, [closeTour, finishTour, positionCurrentStep, stepIndex, steps.length, tourOpen]);

  useEffect(() => {
    return () => {
      clearActiveHighlight();
      stopConfetti();

      if (measureTimerRef.current) {
        window.clearTimeout(measureTimerRef.current);
      }

      if (resizeTimerRef.current) {
        window.clearTimeout(resizeTimerRef.current);
      }

      if (animationFrameRef.current) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [clearActiveHighlight, stopConfetti]);

  const handleStartTour = useCallback(() => {
    setDockOpen(false);
    onNavigate("dashboard");
    setTourOpen(true);
    setStepIndex(0);
  }, [onNavigate]);

  const progressDots = useMemo(
    () =>
      steps.map((step, index) => (
        <span
          key={step.id}
          className={`h-2.5 w-2.5 rounded-full transition-all ${
            index === stepIndex ? "scale-110 bg-brand-green" : "bg-brand-navy/12"
          }`}
        />
      )),
    [stepIndex, steps],
  );

  return (
    <>
      <style jsx global>{`
        .crm-tour-target-active {
          position: relative !important;
          z-index: 10000 !important;
          border-radius: 1.5rem;
          box-shadow:
            0 0 0 3px rgba(255, 255, 255, 0.98),
            0 0 0 10px rgba(22, 168, 106, 0.32),
            0 28px 60px rgba(4, 10, 18, 0.36) !important;
          transform: translateY(-2px) scale(1.01);
          filter: saturate(1.04) brightness(1.04);
          transition:
            box-shadow 0.22s ease,
            transform 0.22s ease,
            filter 0.22s ease;
        }
      `}</style>
      <aside className="pointer-events-none fixed bottom-4 left-4 z-50 w-[22.5rem] max-w-[calc(100vw-2rem)]">
        <div className="pointer-events-auto crm-card overflow-hidden rounded-[1.6rem] border shadow-2xl">
          <button
            type="button"
            onClick={() => setDockOpen((current) => !current)}
            className="flex w-full items-center gap-3 px-4 py-4 text-left"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue-bg text-brand-blue">
              <CircleHelp className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="crm-heading text-sm font-semibold">
                Tour guiado del CRM
              </p>
              <p className="crm-muted text-xs">
                Recorre el flujo real de trabajo dentro de la intranet.
              </p>
            </div>
            {dockOpen ? (
              <ChevronDown className="size-4 text-brand-slate" />
            ) : (
              <ChevronUp className="size-4 text-brand-slate" />
            )}
          </button>

          {dockOpen ? (
            <div className="border-t border-[var(--crm-divider)] bg-[var(--crm-panel-bg-soft)] px-4 py-4">
              <div className="crm-card-soft rounded-[1.3rem] px-4 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green-bg text-brand-green">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <p className="crm-heading text-sm font-semibold">
                      {steps.length} pasos preparados
                    </p>
                    <p className="crm-muted mt-2 text-xs leading-6">
                      Veras navegacion, captacion, expedientes, ficha centralizada y la
                      forma correcta de registrar criterio juridico dentro del caso.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartTour}
                  className="crm-button-primary inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-semibold"
                >
                  <Sparkles className="size-4" />
                  Iniciar tour
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onNavigate("dashboard");
                    setStepIndex(0);
                  }}
                  className="crm-button-secondary inline-flex items-center justify-center gap-2 rounded-full px-4 py-3 text-sm font-medium"
                >
                  <RotateCcw className="size-4" />
                  Reiniciar
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </aside>

      {tourOpen && currentStep ? (
        <>
          <div
            className="fixed inset-0 z-[9998] bg-[rgba(4,10,18,0.38)] backdrop-blur-[1px]"
            onClick={closeTour}
            aria-hidden="true"
          />
          <div
            className="pointer-events-none fixed z-[9999] rounded-[22px] transition-all duration-300 ease-out"
            style={{
              top: `${spotlight.top}px`,
              left: `${spotlight.left}px`,
              width: `${spotlight.width}px`,
              height: `${spotlight.height}px`,
              boxShadow:
                "0 0 0 2px rgba(255,255,255,0.98), 0 0 0 8px rgba(22,168,106,0.34), 0 24px 54px rgba(4,10,18,0.28)",
            }}
          />
          <aside
            ref={tooltipRef}
            className="fixed z-[10001] w-[min(360px,calc(100vw-24px))] rounded-[1.4rem] bg-white p-5 text-brand-ink shadow-[0_24px_60px_rgba(4,10,18,0.32)] transition-all duration-200 ease-out"
            style={{
              top: `${tooltipState.top}px`,
              left: `${tooltipState.left}px`,
            }}
            data-side={tooltipState.side}
          >
            <span
              aria-hidden="true"
              className="absolute h-4 w-4 rotate-45 bg-white"
              style={
                tooltipState.side === "right"
                  ? {
                      left: "-8px",
                      top: `${tooltipState.arrowOffset}px`,
                    }
                  : tooltipState.side === "left"
                    ? {
                        right: "-8px",
                        top: `${tooltipState.arrowOffset}px`,
                      }
                    : tooltipState.side === "top"
                      ? {
                          left: `${tooltipState.arrowOffset}px`,
                          bottom: "-8px",
                        }
                      : {
                          left: `${tooltipState.arrowOffset}px`,
                          top: "-8px",
                        }
              }
            />

            <div className="flex items-center justify-between gap-4">
              <span className="inline-flex items-center rounded-full bg-brand-green-bg px-3 py-1 text-[0.68rem] font-semibold tracking-[0.12em] text-brand-green uppercase">
                Paso {stepIndex + 1} de {steps.length}
              </span>
              <button
                type="button"
                onClick={closeTour}
                className="text-xs font-semibold text-brand-slate transition-colors hover:text-brand-navy"
              >
                Saltar
              </button>
            </div>

            <h3 className="mt-4 font-display text-3xl leading-tight text-brand-navy">
              {currentStep.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-brand-slate">
              {currentStep.body}
            </p>

            <div className="mt-5 flex items-center gap-2">{progressDots}</div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={closeTour}
                className="rounded-full px-3 py-2 text-sm font-medium text-brand-slate transition-colors hover:bg-brand-surface hover:text-brand-navy"
              >
                Saltar
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
                  disabled={stepIndex === 0}
                  className="crm-button-secondary rounded-full px-4 py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (stepIndex >= steps.length - 1) {
                      finishTour();
                      return;
                    }

                    setStepIndex((current) => current + 1);
                  }}
                  className="rounded-full px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
                  style={{ backgroundColor: TOUR_ACCENT }}
                >
                  {stepIndex >= steps.length - 1 ? "Finalizar" : "Siguiente"}
                </button>
              </div>
            </div>
          </aside>
        </>
      ) : null}

      <canvas
        ref={confettiCanvasRef}
        className={`pointer-events-none fixed inset-0 z-[10002] ${
          confettiVisible ? "block" : "hidden"
        }`}
      />
    </>
  );
}
