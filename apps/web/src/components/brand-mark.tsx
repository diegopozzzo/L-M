import Image from "next/image";
import Link from "next/link";
import type { ComponentProps } from "react";

type BrandMarkHref = ComponentProps<typeof Link>["href"];

type BrandMarkProps = {
  href?: BrandMarkHref | null;
  mode?: "light" | "dark";
  subtitle?: string;
  className?: string;
  variant?: "brand" | "site";
};

export function BrandMark({
  href = "/",
  mode = "dark",
  subtitle = "Gestion integral empresarial",
  className = "",
  variant = "brand",
}: BrandMarkProps) {
  const imageProps =
    variant === "site"
      ? {
          src: "/logo-clean.png",
          alt: "Atria",
          width: 186,
          height: 65,
          imageClassName:
            mode === "light"
              ? "h-auto w-[10.75rem] sm:w-[11.5rem] drop-shadow-[0_10px_24px_rgba(10,22,38,0.28)]"
              : "h-auto w-[10.75rem] sm:w-[11.5rem] drop-shadow-[0_10px_24px_rgba(10,22,38,0.16)]",
        }
      : {
          src: "/logo-mark.png",
          alt: "Atria",
          width: 56,
          height: 56,
          imageClassName:
            mode === "light"
              ? "h-14 w-14 rounded-[1rem] drop-shadow-[0_10px_24px_rgba(10,22,38,0.34)]"
              : "h-14 w-14 rounded-[1rem] drop-shadow-[0_10px_24px_rgba(10,22,38,0.22)]",
        };
  const content = (
    <span className="inline-flex items-center">
      <Image
        src={imageProps.src}
        alt={imageProps.alt}
        width={imageProps.width}
        height={imageProps.height}
        priority={variant === "site"}
        className={imageProps.imageClassName}
      />
      <span className="sr-only">{subtitle}</span>
    </span>
  );

  if (!href) {
    return (
      <div className={`inline-flex items-center ${className}`.trim()}>
        {content}
      </div>
    );
  }

  return (
    <Link
      href={href}
      className={`inline-flex items-center ${className}`.trim()}
    >
      {content}
    </Link>
  );
}
