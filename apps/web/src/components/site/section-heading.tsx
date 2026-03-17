type SectionHeadingProps = {
  kicker: string;
  titulo: string;
  descripcion: string;
  invertido?: boolean;
};

export function SectionHeading({
  kicker,
  titulo,
  descripcion,
  invertido = false,
}: SectionHeadingProps) {
  return (
    <div className="max-w-3xl space-y-4">
      <p
        className={`site-kicker text-xs font-semibold ${
          invertido ? "site-text-kicker-strong" : "site-text-kicker"
        }`}
      >
        {kicker}
      </p>
      <h2
        className={`font-display text-4xl leading-tight sm:text-5xl ${
          invertido ? "text-white" : "site-text-strong"
        }`}
      >
        {titulo}
      </h2>
      <p
        className={`max-w-2xl text-sm leading-7 sm:text-base ${
          invertido ? "site-text-inverse-muted" : "site-text-muted"
        }`}
      >
        {descripcion}
      </p>
    </div>
  );
}
