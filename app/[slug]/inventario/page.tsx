import { redirect } from "next/navigation";

import { InventoryPageClient } from "@/components/sales/inventory/inventory-page-client";
import {
  getOrganizationIdByCustomerSlug,
  getMaxBranchesBySlug,
} from "@/lib/utils/organization";

export default async function InventoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Obtener organizationId desde el slug
  const organizationId = await getOrganizationIdByCustomerSlug(slug);
  if (!organizationId) {
    redirect(`/${slug}/dashboard`);
  }

  // Proteger ruta: Inventario solo disponible si el plan permite > 1 sucursal
  const maxBranches = await getMaxBranchesBySlug(slug);
  if (!maxBranches || maxBranches <= 1) {
    redirect(`/${slug}/dashboard`);
  }

  return <InventoryPageClient customerSlug={slug} />;
}
