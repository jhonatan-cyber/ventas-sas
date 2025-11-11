"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface InvoiceFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
}

export function InvoiceFormDialog({
  open,
  onOpenChange,
  onSave,
}: InvoiceFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [_plans, setPlans] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    organizationId: "",
    subscriptionId: "",
    subscriptionPlanId: "",
    billingName: "",
    billingEmail: "",
    billingAddress: "",
    billingTaxId: "",
    subtotal: "",
    tax: "0",
    discount: "0",
    currency: "USD",
    dueDate: "",
    description: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      fetchOrganizations();
      fetchPlans();
    }
  }, [open]);

  useEffect(() => {
    if (formData.organizationId) {
      fetchSubscriptions(formData.organizationId);
    } else {
      setSubscriptions([]);
    }
  }, [formData.organizationId]);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch("/api/administracion/organizations");
      const data = await response.json();
      if (data.organizations) {
        setOrganizations(data.organizations);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await fetch("/api/administracion/plans");
      const data = await response.json();
      if (Array.isArray(data)) {
        setPlans(data);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    }
  };

  const fetchSubscriptions = async (organizationId: string) => {
    try {
      const response = await fetch(
        `/api/administracion/subscriptions?organizationId=${organizationId}`
      );
      const data = await response.json();
      if (data.subscriptions) {
        setSubscriptions(data.subscriptions);
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
    }
  };

  const calculateTotal = () => {
    const subtotal = parseFloat(formData.subtotal) || 0;
    const tax = parseFloat(formData.tax) || 0;
    const discount = parseFloat(formData.discount) || 0;
    return subtotal + tax - discount;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/administracion/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: formData.organizationId || undefined,
          subscriptionId: formData.subscriptionId || undefined,
          subscriptionPlanId: formData.subscriptionPlanId || undefined,
          billingName: formData.billingName,
          billingEmail: formData.billingEmail,
          billingAddress: formData.billingAddress || undefined,
          billingTaxId: formData.billingTaxId || undefined,
          subtotal: parseFloat(formData.subtotal),
          tax: parseFloat(formData.tax) || 0,
          discount: parseFloat(formData.discount) || 0,
          currency: formData.currency,
          dueDate: new Date(formData.dueDate).toISOString(),
          description: formData.description || undefined,
          notes: formData.notes || undefined,
        }),
      });

      const data = await response.json();

      if (data.success || data.invoice) {
        toast.success("Factura creada exitosamente");
        onOpenChange(false);
        resetForm();
        onSave();
      } else {
        toast.error(data.error || "Error al crear factura");
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error("Error al crear factura");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      organizationId: "",
      subscriptionId: "",
      subscriptionPlanId: "",
      billingName: "",
      billingEmail: "",
      billingAddress: "",
      billingTaxId: "",
      subtotal: "",
      tax: "0",
      discount: "0",
      currency: "USD",
      dueDate: "",
      description: "",
      notes: "",
    });
  };

  const total = calculateTotal();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nueva Factura</DialogTitle>
          <DialogDescription>
            Completa los datos para crear una nueva factura
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Organización y Suscripción */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="organizationId">Organización (opcional)</Label>
                <select
                  id="organizationId"
                  value={formData.organizationId}
                  onChange={(e) =>
                    setFormData({ ...formData, organizationId: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={isSubmitting}
                >
                  <option value="">Seleccionar...</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subscriptionId">Suscripción (opcional)</Label>
                <select
                  id="subscriptionId"
                  value={formData.subscriptionId}
                  onChange={(e) =>
                    setFormData({ ...formData, subscriptionId: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  disabled={isSubmitting || !formData.organizationId}
                >
                  <option value="">Seleccionar...</option>
                  {subscriptions.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.plan?.name} - {sub.status}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Información de Facturación */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">
                Información de Facturación
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="billingName">
                    Nombre / Razón Social{" "}
                    <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="billingName"
                    value={formData.billingName}
                    onChange={(e) =>
                      setFormData({ ...formData, billingName: e.target.value })
                    }
                    placeholder="Nombre o razón social"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billingEmail">
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="billingEmail"
                    type="email"
                    value={formData.billingEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, billingEmail: e.target.value })
                    }
                    placeholder="email@ejemplo.com"
                    required
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="billingAddress">Dirección</Label>
                  <Input
                    id="billingAddress"
                    value={formData.billingAddress}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        billingAddress: e.target.value,
                      })
                    }
                    placeholder="Dirección de facturación"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="billingTaxId">NIT / CUIT</Label>
                  <Input
                    id="billingTaxId"
                    value={formData.billingTaxId}
                    onChange={(e) =>
                      setFormData({ ...formData, billingTaxId: e.target.value })
                    }
                    placeholder="Número de identificación fiscal"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </div>

            {/* Montos */}
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-3">Montos</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="subtotal">
                    Subtotal <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subtotal"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.subtotal}
                    onChange={(e) =>
                      setFormData({ ...formData, subtotal: e.target.value })
                    }
                    placeholder="0.00"
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tax">Impuesto</Label>
                  <Input
                    id="tax"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.tax}
                    onChange={(e) =>
                      setFormData({ ...formData, tax: e.target.value })
                    }
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discount">Descuento</Label>
                  <Input
                    id="discount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.discount}
                    onChange={(e) =>
                      setFormData({ ...formData, discount: e.target.value })
                    }
                    placeholder="0.00"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="font-semibold">Total:</span>
                  <span className="text-lg font-bold">
                    {new Intl.NumberFormat("es-ES", {
                      style: "currency",
                      currency: formData.currency,
                    }).format(total)}
                  </span>
                </div>
              </div>
            </div>

            {/* Fechas y Descripción */}
            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">
                    Fecha de Vencimiento <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) =>
                      setFormData({ ...formData, dueDate: e.target.value })
                    }
                    required
                    disabled={isSubmitting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Moneda</Label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) =>
                      setFormData({ ...formData, currency: e.target.value })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    disabled={isSubmitting}
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="BOB">BOB</option>
                    <option value="ARS">ARS</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Descripción de la factura"
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2 mt-4">
                <Label htmlFor="notes">Notas</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Notas adicionales..."
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                isSubmitting ||
                !formData.billingName ||
                !formData.billingEmail ||
                !formData.subtotal ||
                !formData.dueDate
              }
            >
              {isSubmitting ? "Creando..." : "Crear Factura"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
