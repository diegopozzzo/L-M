import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CrmLoginForm } from "@/components/crm/crm-login-form";
import { CrmThemeFrame } from "@/components/crm/crm-theme-frame";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Acceso Privado",
  description:
    "Ingreso autenticado al area privada del estudio para el equipo interno.",
  robots: {
    index: false,
    follow: false,
  },
};

export default async function AccessPage() {
  const cookieStore = await cookies();
  const hasSession =
    cookieStore.has(ACCESS_TOKEN_COOKIE) || cookieStore.has(REFRESH_TOKEN_COOKIE);

  if (hasSession) {
    redirect("/intranet");
  }

  return (
    <CrmThemeFrame>
      <CrmLoginForm />
    </CrmThemeFrame>
  );
}
