"use client";


import jsPDF from "jspdf";
import { MessageCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { SalesQuotationWithRelations } from "@/components/sales/quotation/types";
import { Badge } from "@/components/ui/badge";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  formatCurrencyWithPreferences,
  formatDateWithPreferences,
  invalidateConfigCache,
} from "@/lib/utils/preferences";
import { getTranslatableText } from "@/lib/utils/translatable-text";

// Formato de fecha con hora (para mostrar en UI)
// Esta función se usa dentro del componente donde tenemos acceso a dateFormat y customerSlug
const createFormatDateTime = (dateFormat: string, customerSlug: string) => {
  return (date?: string | Date | null) => {
    if (!date) return "—";
    const d = new Date(date);
    // Usar formato de preferencia para la fecha, luego agregar hora
    const datePart = formatDateWithPreferences(d, customerSlug);
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    return `${datePart}, ${hours}:${minutes}`;
  };
};

const statusTokens: Record<string, { label: string; className: string }> = {
  active: {
    label: "Activa",
    className:
      "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-800",
  },
  expired: {
    label: "Vencida",
    className:
      "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-800",
  },
  converted: {
    label: "Convertida",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-200 dark:border-blue-800",
  },
  pending: {
    label: "Pendiente",
    className:
      "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800",
  },
  approved: {
    label: "Aprobada",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
  },
  rejected: {
    label: "Rechazada",
    className:
      "bg-gray-200 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400 border-gray-200 dark:border-gray-800",
  },
};

const DEFAULT_CURRENCY = "BOB";

interface QuotationDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quotation?: SalesQuotationWithRelations;
  customerSlug: string;
  maxBranches?: number | null;
}

export function QuotationDetailsDialog({
  open,
  onOpenChange,
  quotation,
  customerSlug,
  maxBranches,
}: QuotationDetailsDialogProps) {
  const t = useTranslations()
  const [isExporting, setIsExporting] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [companyWhatsappNumber, setCompanyWhatsappNumber] =
    useState<string>("");
  const [companyName, setCompanyName] = useState<string>("");
  const [_companyContactName, _setCompanyContactName] = useState<string>("");
  const [_companyEmail, _setCompanyEmail] = useState<string>("");
  const [companyPhone, setCompanyPhone] = useState<string>("");
  const [companyAddress, setCompanyAddress] = useState<string>("");
  const [companyWebsite, setCompanyWebsite] = useState<string>("");
  const [companyNIT, setCompanyNIT] = useState<string>("");
  const [companyLogo, setCompanyLogo] = useState<string>("");
  const [ownerName, setOwnerName] = useState<string>("");
  const [currencyCode, setCurrencyCode] = useState<string>(DEFAULT_CURRENCY);
  const [dateFormat, setDateFormat] = useState<string>("dd/MM/yyyy");
  const [themeColor, setThemeColor] = useState<string>("green");
  const [showBranchInfo, setShowBranchInfo] = useState<boolean>(true);

  // Función de formateo de fecha con hora usando las preferencias
  const formatDateTime = useMemo(
    () => createFormatDateTime(dateFormat, customerSlug),
    [dateFormat, customerSlug]
  );

  const statusToken = useMemo(() => {
    if (!quotation) return statusTokens["active"];
    return (
      statusTokens[quotation.status] ?? {
        label: quotation.status,
        className: "bg-gray-100 text-gray-700",
      }
    );
  }, [quotation]);

  const formatCurrency = useCallback(
    (value: number) => {
      // Usar la moneda cargada desde la API, o la del sistema si no está disponible
      // Invalidar caché para asegurar que use la moneda más reciente
      invalidateConfigCache(customerSlug);
      return formatCurrencyWithPreferences(value, customerSlug, currencyCode);
    },
    [currencyCode, customerSlug]
  );

  // Formatear sin símbolo de moneda (solo números)
  const formatCurrencyWithoutSymbol = useCallback((value: number) => {
    const numAmount = typeof value === "string" ? parseFloat(value) : value;
    // Formatear solo el número sin símbolo de moneda
    return new Intl.NumberFormat("es-BO", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numAmount);
  }, []);

  const customerName = useMemo(() => {
    if (!quotation) return "—";
    if (quotation.customer) {
      const fullName = `${quotation.customer.name ?? ""} ${
        quotation.customer.lastName ?? ""
      }`.trim();
      return (
        fullName ||
        quotation.customer.email ||
        quotation.customerName ||
        "Cliente sin registrar"
      );
    }
    return quotation.customerName || "Cliente sin registrar";
  }, [quotation]);

  const customerPhone = useMemo(() => {
    if (!quotation) return "";
    const base = quotation.customer?.phone || quotation.customerPhone || "";
    const digits = base.replace(/[^0-9]/g, "");
    if (!digits) return "";
    const prefixed = base.startsWith("+") ? base : `+${digits}`;
    return prefixed;
  }, [quotation]);

  const items = useMemo(() => quotation?.items ?? [], [quotation?.items]);
  const subtotal = Number(quotation?.subtotal ?? 0);
  const discount = Number(quotation?.discount ?? 0);
  const total = Number(quotation?.total ?? 0);

  useEffect(() => {
    if (!open) {
      setShareUrl(null);
    }
  }, [open]);

  useEffect(() => {
    setShareUrl(null);
  }, [quotation?.id]);

  const handleOpenShareUrl = useCallback(() => {
    if (!shareUrl) return;
    if (typeof window !== "undefined") {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  }, [shareUrl]);

  useEffect(() => {
    // Determinar si mostrar información de sucursal basado en maxBranches
    setShowBranchInfo(
      maxBranches === undefined || maxBranches === null || maxBranches > 1
    );
  }, [maxBranches]);

  useEffect(() => {
    if (typeof document === "undefined" || !open) return;

    // Cargar preferencias (moneda y formato de fecha) desde la API cuando se abre el modal
    const loadPreferences = async () => {
      try {
        const response = await fetch(
          `/api/${customerSlug}/config/preferencias`,
          {
            credentials: "include",
          }
        );
        if (response.ok) {
          const data = await response.json();
          if (data?.success && data.configuration) {
            if (data.configuration.currency) {
              setCurrencyCode(data.configuration.currency);
            } else {
              setCurrencyCode(DEFAULT_CURRENCY);
            }
            if (data.configuration.dateFormat) {
              setDateFormat(data.configuration.dateFormat);
            } else {
              setDateFormat("dd/MM/yyyy");
            }
            if (data.configuration.themeColor) {
              setThemeColor(data.configuration.themeColor);
            } else {
              setThemeColor("green");
            }
          } else {
            setCurrencyCode(DEFAULT_CURRENCY);
            setDateFormat("dd/MM/yyyy");
            setThemeColor("green");
          }
        } else {
          setCurrencyCode(DEFAULT_CURRENCY);
          setDateFormat("dd/MM/yyyy");
          setThemeColor("green");
        }
      } catch {
        setCurrencyCode(DEFAULT_CURRENCY);
        setDateFormat("dd/MM/yyyy");
        setThemeColor("green");
      }
    };

    loadPreferences();
  }, [open, customerSlug]);

  useEffect(() => {
    if (typeof document === "undefined" || !open) return;

    // Cargar información de empresa desde la API de organización
    const loadOrganizationInfo = async () => {
      try {
        const response = await fetch(`/api/${customerSlug}/organizacion`, {
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.organization) {
            const org = data.organization;
            // Usar razonSocial si existe, sino usar name
            setCompanyName(org.razonSocial || org.name || "");
            setCompanyAddress(org.address || "");
            setCompanyPhone(org.phone || "");
            setCompanyWebsite(org.website || "");
            setCompanyNIT(org.nit || "");
            setCompanyLogo(org.logoUrl || "");
            setOwnerName(org.ownerName || "");
            // Extraer número de WhatsApp del teléfono si tiene código de país
            if (org.phone) {
              const phoneDigits = org.phone.replace(/\D/g, "");
              if (phoneDigits) {
                setCompanyWhatsappNumber(
                  org.phone.startsWith("+") ? org.phone : `+${phoneDigits}`
                );
              }
            }
          }
        }
      } catch (error) {
        console.error("Error cargando información de organización:", error);
      }
    };

    loadOrganizationInfo();
  }, [customerSlug, open]);

  const fetchImageAsDataUrl = useCallback(
    async (url: string): Promise<string | null> => {
      if (!url) return null;
      try {
        const response = await fetch(url);
        if (!response.ok) return null;
        const blob = await response.blob();
        return await new Promise<string | null>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () =>
            reject(new Error("No se pudo cargar la imagen"));
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error("No se pudo cargar el logo para el PDF:", error);
        return null;
      }
    },
    []
  );

  const handleExportPdf = useCallback(async () => {
    if (!quotation) return;

    if (shareUrl) {
      handleOpenShareUrl();
      toast.success(t('quotations.form.pdf.openingExisting'));
      return;
    }

    try {
      setIsExporting(true);
      setShareUrl(null);

      // Mapeo de colores del tema a RGB
      const themeColorMap: Record<string, { r: number; g: number; b: number }> =
        {
          green: { r: 26, g: 120, b: 102 },
          blue: { r: 37, g: 99, b: 235 },
          purple: { r: 147, g: 51, b: 234 },
          orange: { r: 249, g: 115, b: 22 },
          red: { r: 220, g: 38, b: 38 },
          pink: { r: 236, g: 72, b: 153 },
          teal: { r: 20, g: 184, b: 166 },
          cyan: { r: 6, g: 182, b: 212 },
          indigo: { r: 99, g: 102, b: 241 },
          yellow: { r: 234, g: 179, b: 8 },
          emerald: { r: 16, g: 185, b: 129 },
          rose: { r: 225, g: 29, b: 72 },
        };

      // Obtener color RGB del tema configurado desde las preferencias
      const primaryColor = themeColorMap[themeColor] || themeColorMap.green;
      const doc = new jsPDF({ unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 16;

      let cursorY = margin + 6;

      const logoDataUrl = companyLogo
        ? await fetchImageAsDataUrl(companyLogo)
        : null;

      const headerTitleY = margin;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.text("Detalle de Cotización", pageWidth / 2, headerTitleY, {
        align: "center",
      });

      const maxLogoHeight = 32;
      const logoX = pageWidth - margin - maxLogoHeight;
      let contactBlockTop = headerTitleY + 8;
      if (logoDataUrl) {
        doc.addImage(
          logoDataUrl,
          "PNG",
          logoX,
          headerTitleY - 6,
          maxLogoHeight,
          maxLogoHeight,
          undefined,
          "FAST"
        );
        contactBlockTop = headerTitleY - 6 + maxLogoHeight + 6;
      }

      const headerLeftX = margin;
      let headerLeftY = headerTitleY + 8;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(30, 30, 30);
      doc.text(companyName || "Nombre de la empresa", headerLeftX, headerLeftY);
      headerLeftY += 5;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      if (companyNIT) {
        doc.text(`NIT: ${companyNIT}`, headerLeftX, headerLeftY);
        headerLeftY += 5;
      }
      if (companyAddress) {
        doc.text(companyAddress, headerLeftX, headerLeftY);
        headerLeftY += 5;
      }
      if (companyWebsite) {
        // Remover https:// o http:// para mostrar solo el dominio
        const websiteDisplay = companyWebsite.replace(/^https?:\/\//, "");
        doc.text(`Web: ${websiteDisplay}`, headerLeftX, headerLeftY);
        headerLeftY += 5;
      }
      // Email no está disponible en la organización, se omite
      const formattedNow = formatDateTime(new Date());
      doc.setFont("helvetica", "bold");
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.text("Fecha y Hora :", headerLeftX, headerLeftY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(60, 60, 60);
      doc.text(formattedNow, headerLeftX + 30, headerLeftY);
      headerLeftY += 8;

      const contactName = ownerName || companyName || "—";
      const contactPhone = companyPhone || companyWhatsappNumber || "—";
      let contactY = contactBlockTop;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.text(contactName, logoX + maxLogoHeight, contactY, {
        align: "right",
      });
      contactY += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(`Contactos: ${contactPhone}`, logoX + maxLogoHeight, contactY, {
        align: "right",
      });
      contactY += 6;

      const headerBottom =
        Math.max(headerLeftY, contactY, headerTitleY + maxLogoHeight) + 4;
      doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.setLineWidth(0.6);
      doc.line(margin, headerBottom, pageWidth - margin, headerBottom);
      cursorY = headerBottom + 6;

      const _infoLeftX = margin;
      const _infoRightX = pageWidth / 2 + 6;
      const _infoLabelColor = primaryColor;
      cursorY = headerBottom + 6;
      const rightInfoYStart = cursorY;
      let _rightCursorY = rightInfoYStart;

      const columnGap = 8;
      const leftColumnX = margin;
      const rightColumnX = pageWidth / 2 + columnGap / 2;

      const customerDetails: Array<[string, string]> = [
        ["Cliente", customerName],
        ["Teléfono", customerPhone || "—"],
        ["Correo", quotation.customer?.email || "—"],
        ["Dirección", quotation.customer?.address || "—"],
        ["Detalle de Cotización", (() => {
          const currentLanguage = (() => {
            try {
              const prefs = JSON.parse(localStorage.getItem('sas_prefs') || '{}');
              return prefs?.language || 'es';
            } catch {
              return 'es';
            }
          })();
          return getTranslatableText(quotation.notes, (quotation as any).notesTranslations, currentLanguage) || "—";
        })()],
      ];

      const quotationDetails: Array<[string, string]> = [
        ["Código", quotation.quotationNumber],
        ["Emitida", formatDateTime(quotation.createdAt)],
        ["Válido hasta", formatDateTime(quotation.expiresAt)],
      ];
      // Si el plan tiene solo una sucursal, no mostrar la sucursal pero sí la dirección de la empresa
      if (showBranchInfo) {
        quotationDetails.push(["Sucursal", quotation.branch?.name || "—"]);
      } else if (companyAddress) {
        // Si no se muestra la sucursal, mostrar la dirección de la empresa en su lugar
        quotationDetails.push(["Dirección", companyAddress]);
      }

      const drawDetailsColumn = (
        x: number,
        title: string,
        rows: Array<[string, string]>
      ) => {
        let y = cursorY;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
        doc.text(title.toUpperCase(), x, y);
        y += 6;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(45, 45, 45);

        rows.forEach(([label, value]: [string, string]) => {
          doc.text(`${label}:`, x, y);
          const isDetail = label === "Detalle de Cotización";
          const valueX = isDetail ? x + 2 : x + 32;
          const width = pageWidth / 2 - columnGap - (isDetail ? 8 : 38);
          let startY = isDetail ? y + 5 : y;
          const lines = doc.splitTextToSize(value || "—", width) as string[];
          lines.forEach((line: string, idx: number) => {
            doc.text(line, valueX, startY + idx * 5);
          });
          y = Math.max(y + 6, startY + Math.max(lines.length * 5, 6));
        });

        return y;
      };

      const leftEnd = drawDetailsColumn(
        leftColumnX,
        "Datos del cliente",
        customerDetails
      );
      const rightEnd = drawDetailsColumn(
        rightColumnX,
        "Datos de la cotización",
        quotationDetails
      );
      cursorY = Math.max(leftEnd, rightEnd) + 6;

      const tableTop = cursorY + 4;
      const tableWidth = pageWidth - margin * 2;
      const colProduct = margin + 2;
      const colPrice = margin + tableWidth * 0.55;
      const colQty = margin + tableWidth * 0.74;
      const colSubtotal = margin + tableWidth - 2;

      doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.rect(margin, tableTop, tableWidth, 9, "F");
      doc.text("Nombre", colProduct, tableTop + 6);
      doc.text(`Precio ${currencyCode}`, colPrice, tableTop + 6);
      doc.text("Cantidad (U)", colQty, tableTop + 6);
      doc.text("Subtotal", colSubtotal, tableTop + 6, { align: "right" });

      let rowY = tableTop + 11;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(45, 45, 45);

      if (items.length === 0) {
        doc.text(
          "No hay productos registrados en esta cotización.",
          margin + 4,
          rowY + 4
        );
        rowY += 14;
      } else {
        items.forEach((item, index) => {
          const displayName =
            item.product?.name || item.productName || "Producto sin nombre";
          const descriptionLines = doc.splitTextToSize(
            displayName,
            tableWidth * 0.52
          ) as string[];
          const rowHeight = Math.max(descriptionLines.length * 5, 7) + 4;

          if (rowY + rowHeight > pageHeight - 40) {
            doc.addPage();
            rowY = margin;
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10);
            doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
            doc.setTextColor(255, 255, 255);
            doc.rect(margin, rowY, tableWidth, 9, "F");
            doc.text("Nombre", colProduct, rowY + 6);
            doc.text(`Precio ${currencyCode}`, colPrice, rowY + 6);
            doc.text("Cantidad (U)", colQty, rowY + 6);
            doc.text("Subtotal", colSubtotal, rowY + 6, { align: "right" });
            rowY += 11;
            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setTextColor(45, 45, 45);
          }

          if (index % 2 === 0) {
            doc.setFillColor(248, 249, 252);
            doc.rect(margin, rowY - 3, tableWidth, rowHeight, "F");
          }

          descriptionLines.forEach((line: string, idx: number) => {
            doc.text(line, colProduct, rowY + idx * 5);
          });
          doc.text(formatCurrency(item.unitPrice), colPrice, rowY);
          doc.text(String(item.quantity), colQty, rowY);
          doc.text(formatCurrency(item.subtotal), colSubtotal, rowY, {
            align: "right",
          });

          rowY += rowHeight;
        });
      }

      doc.setDrawColor(230, 230, 230);
      const dividerY = tableTop - 4;
      doc.line(margin, dividerY, pageWidth - margin, dividerY);
      cursorY = rowY + 12;

      const summaryRows: Array<[string, string]> = [
        ["SUB TOTAL", formatCurrency(subtotal)],
        ["DESCUENTO", formatCurrency(discount)],
        ["TOTAL", formatCurrency(total)],
      ];

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.text("Resumen de Totales", pageWidth - margin, cursorY, {
        align: "right",
      });
      cursorY += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(45, 45, 45);

      summaryRows.forEach(([label, value]) => {
        doc.text(label, pageWidth - margin - 70, cursorY);
        doc.text(value, pageWidth - margin, cursorY, { align: "right" });
        cursorY += 6;
      });

      const fileBaseName = quotation.id
        ? `cotizacion-${quotation.id}`
        : `cotizacion-${quotation.quotationNumber}`;
      doc.save(`${fileBaseName}.pdf`);

      const dataUri = doc.output("datauristring");
      const base64 = dataUri.split(",")[1];

      if (base64) {
        try {
          const response = await fetch(
            `/api/${customerSlug}/cotizaciones/export`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                fileName: fileBaseName,
                pdfBase64: base64,
              }),
            }
          );

          if (response.ok) {
            const payload = await response.json();
            const relativeUrl = payload?.url as string | undefined;
            if (relativeUrl) {
              const absoluteUrl = relativeUrl.startsWith("http")
                ? relativeUrl
                : `${
                    typeof window !== "undefined" ? window.location.origin : ""
                  }${relativeUrl}`;
              setShareUrl(absoluteUrl);
              toast.success(t('quotations.form.pdf.ready'));
            } else {
              toast.success(t('quotations.form.pdf.generated'));
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            toast.error(
              errorData?.error ||
                t('quotations.form.pdf.downloadError')
            );
          }
        } catch (uploadError) {
          console.error("Error subiendo PDF de cotización:", uploadError);
          toast.error(t('quotations.form.pdf.downloadError'));
        }
      }
    } catch (error) {
      console.error("Error al exportar la cotización:", error);
      toast.error(t('quotations.form.pdf.generateError'));
    } finally {
      setIsExporting(false);
    }
  }, [
    quotation,
    shareUrl,
    handleOpenShareUrl,
    companyLogo,
    customerSlug,
    currencyCode,
    customerName,
    customerPhone,
    items,
    subtotal,
    discount,
    total,
    formatCurrency,
    fetchImageAsDataUrl,
    companyName,
    companyAddress,
    formatDateTime,
    t,
    companyPhone,
    companyWhatsappNumber,
    companyWebsite,
    companyNIT,
    ownerName,
    showBranchInfo,
    themeColor,
  ]);

  useEffect(() => {
    if (!open || !quotation || shareUrl || typeof window === "undefined")
      return;
    const candidates = [
      quotation.id
        ? `/uploads/quotations/${customerSlug}/cotizacion-${quotation.id}.pdf`
        : null,
      quotation.quotationNumber
        ? `/uploads/quotations/${customerSlug}/cotizacion-${quotation.quotationNumber}.pdf`
        : null,
    ].filter(Boolean) as string[];

    const checkExisting = async () => {
      for (const relativeUrl of candidates) {
        try {
          const res = await fetch(relativeUrl, { method: "HEAD" });
          if (res.ok) {
            const absolute = new URL(
              relativeUrl,
              window.location.origin
            ).toString();
            setShareUrl(absolute);
            break;
          }
        } catch {
          // ignore
        }
      }
    };

    checkExisting();
  }, [open, quotation, customerSlug, shareUrl]);

  const sanitizedCompanyWhatsapp = useMemo(
    () => companyWhatsappNumber.replace(/[^0-9]/g, ""),
    [companyWhatsappNumber]
  );

  const customerWhatsapp = useMemo(() => {
    return customerPhone.replace(/[^0-9]/g, "");
  }, [customerPhone]);

  const customerWhatsappLink = useMemo(() => {
    if (!shareUrl || !customerWhatsapp) return null;
    // Formatear el mensaje con la URL en una línea separada para que WhatsApp la reconozca como enlace
    // WhatsApp reconoce URLs automáticamente cuando están en su propia línea o con espacios
    let message = `Hola ${customerName || ""}, te comparto la cotización ${
      quotation?.quotationNumber ?? ""
    }.\n\n${shareUrl}`;
    if (sanitizedCompanyWhatsapp) {
      message += `\n\nPuedes responder a este número: +${sanitizedCompanyWhatsapp}`;
    }
    // Codificar el mensaje completo
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${customerWhatsapp}?text=${encodedMessage}`;
  }, [
    shareUrl,
    customerWhatsapp,
    sanitizedCompanyWhatsapp,
    quotation?.quotationNumber,
    customerName,
  ]);

  const handleSendWhatsapp = useCallback(() => {
    if (!customerWhatsappLink) {
      if (!customerWhatsapp) {
        toast.error(t('quotations.form.whatsapp.noPhone'));
      } else {
        toast.error(t('quotations.form.whatsapp.noWhatsappConfig'));
      }
      return;
    }
    if (typeof window !== "undefined") {
      window.open(customerWhatsappLink, "_blank", "noopener,noreferrer");
    }
  }, [customerWhatsapp, customerWhatsappLink, t]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-[#2a2a2a] bg-white/90 dark:bg-[#111111]/90 backdrop-blur">
          <DialogHeader className="p-0">
            <DialogTitle>Detalles de la cotización</DialogTitle>
            <DialogDescription>
              Visualiza toda la información relacionada a la cotización
              seleccionada.
            </DialogDescription>
          </DialogHeader>
        </div>

        {quotation ? (
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <div className="flex flex-row items-center justify-between gap-4">
              <div className="space-y-1 flex-1 min-w-0">
                <p className="text-sm text-gray-500 dark:text-gray-400 uppercase">
                  Número
                </p>
                <p className="text-xl font-semibold text-gray-900 dark:text-white truncate">
                  {quotation.quotationNumber}
                </p>
              </div>
              <Badge
                className={`${statusToken.className} rounded-full px-4 py-1.5 text-xs font-semibold flex-shrink-0`}
              >
                {statusToken.label}
              </Badge>
            </div>

            <div className="space-y-4">
              <div
                className={cn(
                  "grid gap-2 md:gap-4",
                  showBranchInfo && quotation.branch
                    ? "grid-cols-2"
                    : "grid-cols-1"
                )}
              >
                <div className="space-y-2 rounded-2xl border border-gray-200 dark:border-[#2a2a2a] bg-gray-50/70 dark:bg-[#151515] p-2 md:p-3">
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                    Cliente
                  </p>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {customerName}
                  </p>
                  {(quotation.customer?.email || quotation.customer?.ruc) && (
                    <div className="flex flex-col text-xs text-gray-500 dark:text-gray-400">
                      {quotation.customer?.email && (
                        <span>{quotation.customer.email}</span>
                      )}
                      {quotation.customer?.ruc && (
                        <span>CI: {quotation.customer.ruc}</span>
                      )}
                    </div>
                  )}
                  <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400">
                    {customerPhone && <span>Tel: {customerPhone}</span>}
                    {quotation.customer?.address && (
                      <span>Dir: {quotation.customer.address}</span>
                    )}
                  </div>
                </div>
                {showBranchInfo && quotation.branch && (
                  <div className="rounded-2xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#151515] p-2 md:p-3 text-sm text-gray-700 dark:text-gray-300">
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      Sucursal
                    </p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {quotation.branch.name ?? t('common.noBranch')}
                    </p>
                    {quotation.branch.address ? (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {quotation.branch.address}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Sin dirección registrada
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="grid gap-3 p-4 rounded-2xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#151515] text-sm text-gray-700 dark:text-gray-300">
                <div className="flex items-center justify-between">
                  <span>Creada:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDateTime(quotation.createdAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Vencimiento:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDateTime(quotation.expiresAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Actualizada:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatDateTime(quotation.updatedAt)}
                  </span>
                </div>
              </div>
            </div>

            {/* Vista de cards para móvil */}
            <div className="md:hidden space-y-3">
              {items.length === 0 ? (
                <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                  No hay productos registrados en esta cotización.
                </div>
              ) : (
                items.map((item) => {
                  const displayName =
                    item.product?.name ||
                    item.productName ||
                    "Producto sin nombre";
                  return (
                    <div
                      key={item.id || item.productId || displayName}
                      className="rounded-2xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#0d0d0d] p-4 space-y-3"
                    >
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {displayName}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-gray-200 dark:border-[#2a2a2a]">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Cantidad
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {item.quantity}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Precio Unit.
                            </p>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {formatCurrencyWithoutSymbol(
                                Number(item.unitPrice)
                              )}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                              Subtotal
                            </p>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                              {formatCurrencyWithoutSymbol(
                                Number(item.subtotal)
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Vista de tabla para desktop */}
            <div className="hidden md:block overflow-x-auto rounded-2xl border border-gray-200 dark:border-[#2a2a2a]">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50 dark:bg-[#1f1f1f]">
                    <TableHead className="text-gray-700 dark:text-gray-300">
                      Producto
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300 w-[90px]">
                      Cant.
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300 w-[120px]">
                      Precio
                    </TableHead>
                    <TableHead className="text-gray-700 dark:text-gray-300 w-[120px] text-right">
                      Subtotal
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center py-6 text-gray-500 dark:text-gray-400"
                      >
                        No hay productos registrados en esta cotización.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => {
                      const displayName =
                        item.product?.name ||
                        item.productName ||
                        "Producto sin nombre";
                      return (
                        <TableRow
                          key={item.id || item.productId || displayName}
                        >
                          <TableCell>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {displayName}
                            </span>
                          </TableCell>
                          <TableCell>{item.quantity}</TableCell>
                          <TableCell>
                            {formatCurrencyWithoutSymbol(
                              Number(item.unitPrice)
                            )}
                          </TableCell>
                          <TableCell className="text-right font-semibold text-gray-900 dark:text-white">
                            {formatCurrencyWithoutSymbol(Number(item.subtotal))}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {/* Subtotal y Descuento: combinados en móvil, separados en desktop */}
              <div className="sm:hidden rounded-2xl bg-gray-100 dark:bg-[#252525] px-4 py-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Subtotal
                    </p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {formatCurrencyWithoutSymbol(subtotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                      Descuento
                    </p>
                    <p className="text-base font-semibold text-gray-900 dark:text-white">
                      {formatCurrencyWithoutSymbol(discount)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="hidden sm:block space-y-1 rounded-2xl bg-gray-100 dark:bg-[#252525] px-4 py-3">
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                  Subtotal
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrencyWithoutSymbol(subtotal)}
                </p>
              </div>
              <div className="hidden sm:block space-y-1 rounded-2xl bg-gray-100 dark:bg-[#252525] px-4 py-3">
                <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                  Descuento
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {formatCurrencyWithoutSymbol(discount)}
                </p>
              </div>
              <div className="space-y-1 rounded-2xl bg-black text-white dark:bg-white dark:text-black px-4 py-3">
                <p className="text-xs uppercase text-white/70 dark:text-gray-600">
                  Total
                </p>
                <p className="text-lg font-semibold">{formatCurrency(total)}</p>
              </div>
            </div>

            {(() => {
              const currentLanguage = (() => {
                try {
                  const prefs = JSON.parse(localStorage.getItem('sas_prefs') || '{}');
                  return prefs?.language || 'es';
                } catch {
                  return 'es';
                }
              })();
              const notes = getTranslatableText(quotation.notes, (quotation as any).notesTranslations, currentLanguage);
              return notes && (
                <div className="space-y-2">
                  <p className="text-xs uppercase text-gray-500 dark:text-gray-400">
                    Notas
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-[#151515] rounded-2xl border border-gray-200 dark:border-[#2a2a2a] px-4 py-3">
                    {notes}
                  </p>
                </div>
              );
            })()}

            {shareUrl && (
              <div className="space-y-3 rounded-2xl border border-gray-200 dark:border-[#2a2a2a] bg-white dark:bg-[#151515] p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  Enlace para compartir
                </p>
                <div className="space-y-3">
                  <div className="relative">
                    <Input
                      value={shareUrl}
                      readOnly
                      className="rounded-full text-xs sm:text-sm pr-20"
                      title={shareUrl}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-3 rounded-full text-xs"
                      onClick={() => {
                        navigator.clipboard.writeText(shareUrl);
                        toast.success(t('quotations.form.linkCopied'));
                      }}
                    >
                      {t('quotations.form.copyLink')}
                    </Button>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      type="button"
                      variant="new"
                      className="rounded-full w-full sm:w-auto sm:flex-1"
                      onClick={handleSendWhatsapp}
                      disabled={!customerWhatsappLink}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" /> Enviar WhatsApp
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full w-full sm:w-auto sm:flex-1"
                      onClick={handleOpenShareUrl}
                    >
                      Abrir PDF
                    </Button>
                  </div>
                </div>
                {!customerWhatsappLink && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Agrega un número de teléfono al cliente para habilitar el
                    envío por WhatsApp.
                  </p>
                )}
                {customerWhatsappLink && !sanitizedCompanyWhatsapp && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Tip: define el número de la empresa en Configuración para
                    incluirlo en el mensaje.
                  </p>
                )}
              </div>
            )}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            Selecciona una cotización para ver sus detalles.
          </p>
        )}

        <DialogFooter className="border-t border-gray-200 dark:border-[#2a2a2a] bg-white/90 dark:bg-[#111111]/90 backdrop-blur px-6 py-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-start sm:justify-center gap-3 sm:space-x-3 sm:space-y-0 space-y-2">
          <Button
            variant="new"
            className="rounded-full w-full sm:w-auto"
            onClick={handleExportPdf}
            disabled={!quotation || isExporting}
          >
            {shareUrl
              ? "Ver PDF"
              : isExporting
              ? "Generando..."
              : "Exportar PDF"}
          </Button>
          <Button
            variant="outline"
            className="rounded-full w-full sm:w-auto"
            onClick={() => onOpenChange(false)}
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
