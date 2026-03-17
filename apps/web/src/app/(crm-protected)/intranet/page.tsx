import type { Metadata } from "next";
import { CrmThemeFrame } from "@/components/crm/crm-theme-frame";
import { CrmWorkspace } from "@/components/crm/crm-workspace";

export const metadata: Metadata = {
  title: "Intranet Legal",
  description:
    "Entorno privado para la operacion juridica interna del estudio.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function IntranetPage() {
  return (
    <CrmThemeFrame>
      <CrmWorkspace />
    </CrmThemeFrame>
  );
}
