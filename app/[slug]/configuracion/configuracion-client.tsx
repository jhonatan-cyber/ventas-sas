"use client";

import { Settings, Building2, CreditCard, ExternalLink } from "lucide-react";
;
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { toast } from "sonner";

import ClientPersistence from "./client-persistence";
import { RenewalDialogClient } from "./renewal-dialog-client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useConfiguration } from "@/hooks/sales/use-configuration";

// Constantes


type PhonePattern = {
  prefix: string;
  code: string;
  slice: number;
  minLength?: number;
};

const PHONE_COUNTRY_CODE_PATTERNS: PhonePattern[] = [
  { prefix: "591", code: "+591", slice: 3 },
  { prefix: "1", code: "+1", slice: 1, minLength: 11 },
  { prefix: "52", code: "+52", slice: 2 },
  { prefix: "54", code: "+54", slice: 2 },
  { prefix: "55", code: "+55", slice: 2 },
  { prefix: "56", code: "+56", slice: 2 },
  { prefix: "57", code: "+57", slice: 2 },
  { prefix: "51", code: "+51", slice: 2 },
  { prefix: "58", code: "+58", slice: 2 },
  { prefix: "593", code: "+593", slice: 3 },
  { prefix: "595", code: "+595", slice: 3 },
  { prefix: "598", code: "+598", slice: 3 },
];

// Funciones de utilidad
const parsePhoneNumber = (phone: string | null | undefined): { code: string; number: string } => {
  if (!phone) return { code: "+591", number: "" };

  const digits = phone.replace(/\D/g, "");

  for (const pattern of PHONE_COUNTRY_CODE_PATTERNS) {
    if (pattern.minLength && digits.length < pattern.minLength) continue;
    if (digits.startsWith(pattern.prefix)) {
      return {
        code: pattern.code,
        number: digits.slice(pattern.slice),
      };
    }
  }

  return { code: "+591", number: digits };
};

const normalizeWebsite = (website: string | null | undefined): string => {
  if (!website) return "";
  if (website.startsWith("https://")) return website.replace("https://", "");
  if (website.startsWith("http://")) return website.replace("http://", "");
  return website;
};

const ensureHttps = (url: string): string => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `https://${url}`;
};

const updateLogoPreview = (previewId: string, imageUrl: string) => {
  const preview = document.getElementById(previewId);
  if (!preview) return;

  preview.innerHTML = "";
  const img = document.createElement("img");
  img.src = imageUrl;
  img.alt = "Logo empresa";
  img.className = "w-full h-full object-contain";
  preview.appendChild(img);
};

// Constantes de colores del tema
const THEME_COLORS = [
  { value: "green", label: "Verde", bg: "oklch(0.69 0.16 148)", textColor: "text-white" },
  { value: "blue", label: "Azul", bg: "oklch(0.69 0.13 264)", textColor: "text-white" },
  { value: "purple", label: "Púrpura", bg: "oklch(0.67 0.14 313)", textColor: "text-white" },
  { value: "orange", label: "Naranja", bg: "oklch(0.77 0.16 70)", textColor: "text-white" },
  { value: "red", label: "Rojo", bg: "oklch(0.577 0.245 27.325)", textColor: "text-white" },
  { value: "pink", label: "Rosa", bg: "oklch(0.7 0.15 340)", textColor: "text-white" },
  { value: "teal", label: "Teal", bg: "oklch(0.65 0.14 200)", textColor: "text-white" },
  { value: "cyan", label: "Cian", bg: "oklch(0.7 0.15 220)", textColor: "text-black" },
  { value: "indigo", label: "Índigo", bg: "oklch(0.6 0.15 280)", textColor: "text-white" },
  { value: "yellow", label: "Amarillo", bg: "oklch(0.85 0.18 95)", textColor: "text-black" },
  { value: "emerald", label: "Esmeralda", bg: "oklch(0.7 0.16 160)", textColor: "text-white" },
  { value: "rose", label: "Rose", bg: "oklch(0.65 0.2 15)", textColor: "text-white" },
] as const;

const DEBOUNCE_DELAY = 500;
const COOKIE_EXPIRY_YEARS = 1;

interface ConfiguracionClientProps {
  customerSlug: string;
  customer: {
    ci?: string | null;
    nombre?: string | null;
    apellido?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    primaryOrganization?: {
      id?: string | null;
      razonSocial?: string | null;
      name?: string | null;
      slug?: string | null;
      nit?: string | null;
      address?: string | null;
      phone?: string | null;
      website?: string | null;
      logoUrl?: string | null;
    } | null;
  };
  activeSubscription: {
    status: string;
    endDate: Date | null;
    billingPeriod: string;
    plan: {
      name: string | null;
    } | null;
  } | null;
  planPrice: string;
}

export function ConfiguracionClient({
  customerSlug,
  customer,
  activeSubscription,
  planPrice,
}: ConfiguracionClientProps) {const [activeTab, setActiveTab] = useState("empresa");
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [currentWebsite, setCurrentWebsite] = useState<string | null>(
    customer.primaryOrganization?.website || null
  );

  // Estado local para los valores de los selects (para actualización inmediata)
  const [localConfig, setLocalConfig] = useState<{
    currency?: string | null;
    dateFormat?: string | null;
    whatsappCountryCode?: string | null;
    language?: string | null;
  }>({});

  // Usar el hook personalizado para gestionar configuraciones
  const {
    configuration,
    isLoading: isLoadingConfig,
    updateConfiguration: updateConfig,
    getValue,
    reload,
  } = useConfiguration(customerSlug, {
    autoLoad: true,
    onError: (error) => {
      console.error("Error en configuración:", error);
      toast.error("Error");
    },
  });

  // Sincronizar estado local cuando se carga la configuración
  useEffect(() => {
    if (!configuration) return;

    const newConfig = {
      currency: configuration.currency,
      dateFormat: configuration.dateFormat,
      whatsappCountryCode: configuration.whatsappCountryCode,
      language: configuration.language,
    };

    setLocalConfig((prev) => {
      // Comparación eficiente sin JSON.stringify
      if (
        prev.currency === newConfig.currency &&
        prev.dateFormat === newConfig.dateFormat &&
        prev.whatsappCountryCode === newConfig.whatsappCountryCode &&
        prev.language === newConfig.language
      ) {
        return prev;
      }
      return newConfig;
    });
  }, [configuration]);

  // Guardar el plan en cookies para que el sidebar lo pueda leer (temporal, hasta migrar sidebar)
  useEffect(() => {
    if (!activeSubscription?.plan?.name) return;

    const planName = activeSubscription.plan.name;
    const expires = new Date(
      Date.now() + COOKIE_EXPIRY_YEARS * 365 * 24 * 60 * 60 * 1000
    ).toUTCString();
    const isProduction =
      typeof window !== "undefined" && window.location.protocol === "https:";
    document.cookie = `sas-plan-${customerSlug}=${encodeURIComponent(
      planName
    )}; Path=/; SameSite=Lax; Expires=${expires}${isProduction ? "; Secure" : ""
      }`;
  }, [activeSubscription?.plan?.name, customerSlug]);

  // Función para guardar configuración con debounce
  const saveConfiguration = useCallback(
    async (updates: Partial<typeof configuration>) => {
      if (!configuration || !updates) return;

      // Filtrar valores null/undefined
      const cleanUpdates = Object.fromEntries(
        Object.entries(updates).filter(
          ([_, value]) => value !== null && value !== undefined
        )
      );

      // Actualizar estado local inmediatamente para feedback visual
      setLocalConfig((prev) => ({ ...prev, ...cleanUpdates }));

      // Limpiar timeout anterior
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Crear nuevo timeout
      saveTimeoutRef.current = setTimeout(async () => {
        const success = await updateConfig(
          cleanUpdates as Partial<typeof configuration>
        );
        if (!success) {
          toast.error("Error");
          setTimeout(() => {
            reload();
          }, 1000);
        }
        saveTimeoutRef.current = null;
      }, DEBOUNCE_DELAY);
    },
    [configuration, updateConfig, reload]
  );

  // Cleanup del timeout al desmontar
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSaveCompany = useCallback(async () => {
    setIsSaving(true);
    try {
      const form = document.querySelector(
        'form[data-form="empresa"]'
      ) as HTMLFormElement;
      if (!form) {
        toast.error("No se encontró el formulario");
        return;
      }

      // Obtener valores del formulario
      const getFormValue = (name: string) =>
        (form.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLSelectElement)
          ?.value?.trim() || "";

      // Usar el código de país de preferencias
      const whatsappCountryCode = localConfig.whatsappCountryCode !== undefined
        ? localConfig.whatsappCountryCode || "+591"
        : getValue("whatsappCountryCode") || "+591";
      const companyPhone = getFormValue("companyPhone");
      const fullPhone = companyPhone
        ? `${whatsappCountryCode}${companyPhone.replace(/\D/g, "")}`
        : "";

      // Subir logo si existe
      const logoInput = form.querySelector(
        '[name="companyLogo"]'
      ) as HTMLInputElement;
      const logoFile = logoInput?.files?.[0];
      let logoUrl: string | null = null;

      if (logoFile) {
        const logoFormData = new FormData();
        logoFormData.append("logo", logoFile);

        const logoResponse = await fetch(`/api/${customerSlug}/config/logo`, {
          method: "POST",
          body: logoFormData,
        });

        if (!logoResponse.ok) {
          const error = await logoResponse
            .json()
            .catch(() => ({ error: "Error al subir el logo" }));
          throw new Error(error.error || "Error al subir el logo");
        }

        const logoData = await logoResponse.json();
        logoUrl = logoData.logoUrl || logoData.url || null;
      }

      // Normalizar sitio web
      const websiteInput = getFormValue("companyWebsite");
      const website = websiteInput ? ensureHttps(websiteInput) : null;

      // Preparar datos
      const data: Record<string, any> = {
        nit: getFormValue("companyNIT") || null,
        phone: fullPhone || null,
        address: getFormValue("companyAddress") || null,
        website,
      };

      if (logoUrl) {
        data.logoUrl = logoUrl;
      }

      // Guardar en API
      const response = await fetch(`/api/${customerSlug}/config/empresa`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: "Error al guardar" }));
        throw new Error(
          errorData.error || errorData.message || "Error al guardar los cambios"
        );
      }

      // Actualizar estado y UI
      if (website) setCurrentWebsite(website);
      window.dispatchEvent(new CustomEvent("Organization-updated"));
      toast.success("Información de la empresa guardada correctamente");

      // Actualizar preview del logo
      if (logoUrl && customer.primaryOrganization?.slug) {
        const orgResponse = await fetch(`/api/${customerSlug}/organizacion`, {
          credentials: "include",
        });
        if (orgResponse.ok) {
          const orgData = await orgResponse.json();
          if (orgData.success && orgData.organization?.logoUrl) {
            updateLogoPreview("companyLogoPreview", orgData.organization.logoUrl);
          }
        }
      }
    } catch (error) {
      console.error("Error guardando información de la empresa:", error);
      toast.error(
        error instanceof Error ? error.message : "Error al guardar los cambios"
      );
    } finally {
      setIsSaving(false);
    }
  }, [customerSlug, customer.primaryOrganization?.slug, getValue, localConfig.whatsappCountryCode]);

  // Cargar logo inicial
  useEffect(() => {
    if (activeTab !== "empresa") return;

    const logoUrl = customer.primaryOrganization?.logoUrl;
    if (!logoUrl) return;

    const img = new Image();
    img.onload = () => updateLogoPreview("companyLogoPreview", logoUrl);
    img.onerror = () => console.warn("No se pudo cargar el logo desde:", logoUrl);
    img.src = logoUrl;
  }, [activeTab, customer.primaryOrganization?.logoUrl]);

  // Configurar preview para nuevos archivos
  useEffect(() => {
    if (activeTab !== "empresa") return;

    const logoInput = document.querySelector(
      'input[name="companyLogo"]'
    ) as HTMLInputElement;
    if (!logoInput) return;

    const handleFileChange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) updateLogoPreview("companyLogoPreview", result);
      };
      reader.readAsDataURL(file);
    };

    logoInput.addEventListener("change", handleFileChange);
    return () => logoInput.removeEventListener("change", handleFileChange);
  }, [activeTab]);

  // Valores memoizados
  const phoneData = useMemo(
    () => parsePhoneNumber(customer.primaryOrganization?.phone),
    [customer.primaryOrganization?.phone]
  );

  const websiteDisplay = useMemo(
    () => normalizeWebsite(currentWebsite || customer.primaryOrganization?.website),
    [currentWebsite, customer.primaryOrganization?.website]
  );

  const handleWebsiteClick = useCallback(() => {
    const website = currentWebsite || customer.primaryOrganization?.website || "";
    if (website) {
      window.open(ensureHttps(website), "_blank", "noopener,noreferrer");
    }
  }, [currentWebsite, customer.primaryOrganization?.website]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {"Title"}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          {"Preferences"}
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto h-auto p-1 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg">
          <TabsTrigger
            value="plan"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#0d0d0d] rounded-md px-4 py-2"
          >
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">{"Configuration"}</span>
          </TabsTrigger>
          <TabsTrigger
            value="preferencias"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#0d0d0d] rounded-md px-4 py-2"
          >
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">{"Preferences"}</span>
          </TabsTrigger>
          <TabsTrigger
            value="empresa"
            className="flex items-center gap-2 data-[state=active]:bg-white dark:data-[state=active]:bg-[#0d0d0d] rounded-md px-4 py-2"
          >
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">{"Company"}</span>
          </TabsTrigger>
        </TabsList>

        {/* Sección: Plan de suscripción */}
        <TabsContent value="plan" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                {"Title"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeSubscription ? (
                <div className="text-sm text-gray-800 dark:text-gray-200 space-y-2">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-semibold">{"Plan"}:</span>
                    <span>{activeSubscription.plan?.name ?? "—"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-semibold">{"Status"}:</span>
                    <span className="capitalize">
                      {activeSubscription.status}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                    <span className="font-semibold">{"Expires"}:</span>
                    <span>
                      {activeSubscription.endDate
                        ? new Date(
                          activeSubscription.endDate
                        ).toLocaleDateString()
                        : "No Date"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="font-semibold">{"Period"}:</span>
                    <span>
                      {activeSubscription.billingPeriod === "yearly"
                        ? "Yearly"
                        : "Monthly"}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {"No Active Plan"}
                </p>
              )}
              <div className="pt-4">
                <RenewalDialogClient
                  customerSlug={customerSlug}
                  initialAmount={planPrice}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sección: Preferencias */}
        <TabsContent value="preferencias" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                {"Preferences"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form data-form="preferencias" className="space-y-6">
                {/* Fila de 3 selects en modo PC */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="currency">{"Currency"}</Label>
                    <select
                      id="currency"
                      name="currency"
                      value={
                        localConfig.currency !== undefined
                          ? localConfig.currency || ""
                          : getValue("currency") || ""
                      }
                      onChange={(e) => {
                        saveConfiguration({ currency: e.target.value || null });
                      }}
                      disabled={isLoadingConfig}
                      className="w-full border rounded-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Selecciona una moneda</option>
                      <option value="BOB">BOB - Boliviano</option>
                      <option value="USD">USD - Dólar estadounidense</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="ARS">ARS - Peso argentino</option>
                      <option value="BRL">BRL - Real brasileño</option>
                      <option value="CLP">CLP - Peso chileno</option>
                      <option value="COP">COP - Peso colombiano</option>
                      <option value="MXN">MXN - Peso mexicano</option>
                      <option value="PEN">PEN - Sol peruano</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {"Currency Note"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">{"Date Format"}</Label>
                    <select
                      id="dateFormat"
                      name="dateFormat"
                      value={
                        localConfig.dateFormat !== undefined
                          ? localConfig.dateFormat || ""
                          : getValue("dateFormat") || ""
                      }
                      onChange={(e) => {
                        saveConfiguration({
                          dateFormat: e.target.value || null,
                        });
                      }}
                      disabled={isLoadingConfig}
                      className="w-full border rounded-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Selecciona un formato</option>
                      <option value="dd/MM/yyyy">
                        dd/MM/yyyy (Ej: 25/12/2024)
                      </option>
                      <option value="MM/dd/yyyy">
                        MM/dd/yyyy (Ej: 12/25/2024)
                      </option>
                      <option value="yyyy-MM-dd">
                        yyyy-MM-dd (Ej: 2024-12-25)
                      </option>
                      <option value="dd-MM-yyyy">
                        dd-MM-yyyy (Ej: 25-12-2024)
                      </option>
                      <option value="dd/MM/yy">dd/MM/yy (Ej: 25/12/24)</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {"Date Format Note"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="whatsappCountryCode">
                      {"Phone Country Code"}
                    </Label>
                    <select
                      id="whatsappCountryCode"
                      name="whatsappCountryCode"
                      value={
                        localConfig.whatsappCountryCode !== undefined
                          ? localConfig.whatsappCountryCode || "+591"
                          : getValue("whatsappCountryCode") || "+591"
                      }
                      onChange={(e) => {
                        saveConfiguration({
                          whatsappCountryCode: e.target.value || "+591",
                        });
                      }}
                      disabled={isLoadingConfig}
                      className="w-full border rounded-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100"
                    >
                      <option value="+591">+591 BO - Bolivia</option>
                      <option value="+1">
                        +1 US/CA - Estados Unidos/Canadá
                      </option>
                      <option value="+52">+52 MX - México</option>
                      <option value="+54">+54 AR - Argentina</option>
                      <option value="+55">+55 BR - Brasil</option>
                      <option value="+56">+56 CL - Chile</option>
                      <option value="+57">+57 CO - Colombia</option>
                      <option value="+51">+51 PE - Perú</option>
                      <option value="+58">+58 VE - Venezuela</option>
                      <option value="+593">+593 EC - Ecuador</option>
                      <option value="+595">+595 PY - Paraguay</option>
                      <option value="+598">+598 UY - Uruguay</option>
                      <option value="+34">+34 ES - España</option>
                      <option value="+44">+44 GB - Reino Unido</option>
                      <option value="+49">+49 DE - Alemania</option>
                      <option value="+33">+33 FR - Francia</option>
                      <option value="+39">+39 IT - Italia</option>
                      <option value="+86">+86 CN - China</option>
                      <option value="+81">+81 JP - Japón</option>
                      <option value="+82">+82 KR - Corea del Sur</option>
                      <option value="+91">+91 IN - India</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {"Phone Code Note"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="language">{"Language"}</Label>
                    <select
                      id="language"
                      name="language"
                      value={
                        localConfig.language !== undefined
                          ? localConfig.language || "es"
                          : getValue("language") || "es"
                      }
                      onChange={(e) => {
                        const newLanguage = e.target.value || "es";
                        saveConfiguration({
                          language: newLanguage,
                        });
                        // Disparar evento para que el I18nProvider actualice el idioma
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('language-updated', {
                            detail: { slug: customerSlug, language: newLanguage }
                          }));
                        }
                      }}
                      disabled={isLoadingConfig}
                      className="w-full border rounded-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] text-gray-900 dark:text-gray-100"
                    >
                      <option value="es">{"Es"}</option>
                      <option value="en">{"En"}</option>
                      <option value="pt">{"Pt"}</option>
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {"Language Note"}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{"Theme Color"}</Label>
                  <select
                    name="themeColor"
                    value={getValue("themeColor") || "green"}
                    onChange={(e) => {
                      saveConfiguration({ themeColor: e.target.value || null });
                    }}
                    disabled={isLoadingConfig}
                    className="w-full border rounded-full px-3 py-2 bg-gray-50 dark:bg-[#2a2a2a] hidden"
                  >
                    {THEME_COLORS.map((color) => (
                      <option key={color.value} value={color.value}>
                        {color.label}
                      </option>
                    ))}
                  </select>
                  <div className="grid grid-cols-4 gap-3">
                    {THEME_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        data-color={color.value}
                        onClick={() => saveConfiguration({ themeColor: color.value })}
                        className="color-swatch h-12 rounded-lg border-2 border-gray-200 dark:border-[#2a2a2a] hover:scale-105 transition-transform relative"
                        style={{ background: color.bg } as React.CSSProperties}
                        title={color.label}
                      >
                        <span className={`text-xs font-semibold drop-shadow ${color.textColor}`}>
                          {color.label}
                        </span>
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {"Theme Color Note"}
                  </p>
                  <div className="mt-2 space-y-1">
                    <Label>Vista previa</Label>
                    <div
                      id="themeColorPreview"
                      className="h-10 rounded-lg border border-gray-200 dark:border-[#2a2a2a] flex items-center justify-center"
                      style={
                        { background: "var(--primary)" } as React.CSSProperties
                      }
                    >
                      <span className="text-xs text-white font-medium drop-shadow">
                        Color principal
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                    {"Auto Save"}
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Sección: Empresa */}
        <TabsContent value="empresa" className="mt-6 space-y-6">
          <form data-form="empresa" className="space-y-6">
            {/* Información de la empresa */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  {"Company"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{"Name"}</Label>
                    <Input
                      name="companyName"
                      className="rounded-full bg-gray-50 dark:bg-[#2a2a2a] cursor-not-allowed"
                      value={
                        customer.primaryOrganization?.razonSocial ||
                        customer.primaryOrganization?.name ||
                        ""
                      }
                      readOnly
                      disabled
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {"Not Editable"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>{"Tax Id"}</Label>
                    <Input
                      name="companyNIT"
                      className="rounded-full"
                      placeholder="NIT o CI del dueño"
                      defaultValue={
                        customer.primaryOrganization?.nit || customer.ci || ""
                      }
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {customer.primaryOrganization?.nit
                        ? "NIT de la empresa"
                        : "CI del propietario (no hay NIT registrado)"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Slug</Label>
                    <Input
                      name="companySlug"
                      className="rounded-full bg-gray-50 dark:bg-[#2a2a2a] cursor-not-allowed"
                      value={customer.primaryOrganization?.slug || ""}
                      readOnly
                      disabled
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Identificador único de la empresa (no editable)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>{"Phone"}</Label>
                    <Input
                      name="companyPhone"
                      className="rounded-full"
                      placeholder="Ej: 70000000"
                      defaultValue={phoneData.number}
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {"Phone Note"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{"Address"}</Label>
                    <Input
                      name="companyAddress"
                      className="rounded-full"
                      placeholder="Calle, ciudad, país"
                      defaultValue={customer.primaryOrganization?.address || ""}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{"Website"}</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center flex-1 border rounded-full overflow-hidden bg-gray-50 dark:bg-[#2a2a2a]">
                        <span className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400 border-r border-gray-200 dark:border-[#2a2a2a]">
                          https://
                        </span>
                        <Input
                          name="companyWebsite"
                          className="rounded-full border-0 flex-1 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                          placeholder="empresa.com"
                          defaultValue={websiteDisplay}
                        />
                      </div>
                      {(currentWebsite || customer.primaryOrganization?.website) && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="rounded-full shrink-0"
                          onClick={handleWebsiteClick}
                          title="Abrir sitio web en nueva ventana"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Solo ingresa el dominio (ej: empresa.com)
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{"Logo"}</Label>
                  <div className="flex items-center gap-4 p-4 border border-gray-200 dark:border-[#2a2a2a] rounded-lg bg-gray-50 dark:bg-[#151515]">
                    <div
                      id="companyLogoPreview"
                      className="w-20 h-20 rounded-lg bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#2a2a2a] flex items-center justify-center overflow-hidden shrink-0 relative"
                    >
                      <span className="text-xs text-gray-400">Sin logo</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <input
                        type="file"
                        name="companyLogo"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 dark:file:bg-emerald-900/20 dark:file:text-emerald-400 dark:hover:file:bg-emerald-900/30 cursor-pointer"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Formatos: PNG, JPG, WEBP. Tamaño recomendado: 400x400.
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {"Save In Browser"}
                </p>

                <div className="flex justify-center pt-4 border-t border-gray-200 dark:border-[#2a2a2a]">
                  <Button
                    onClick={handleSaveCompany}
                    disabled={isSaving}
                    className="rounded-full px-6"
                  >
                    {isSaving ? "Updating" : "Update Info"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Información del dueño */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  {"Owner"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{"Owner Name"}</Label>
                    <Input
                      name="ownerName"
                      className="rounded-full bg-gray-50 dark:bg-[#2a2a2a] cursor-not-allowed"
                      value={customer.nombre || ""}
                      readOnly
                      disabled
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {"Not Editable"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>{"Last Name"}</Label>
                    <Input
                      name="ownerLastName"
                      className="rounded-full bg-gray-50 dark:bg-[#2a2a2a] cursor-not-allowed"
                      value={customer.apellido || ""}
                      readOnly
                      disabled
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {"Not Editable"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>CI / Documento de identidad</Label>
                    <Input
                      name="ownerCI"
                      className="rounded-full bg-gray-50 dark:bg-[#2a2a2a] cursor-not-allowed"
                      value={customer.ci || ""}
                      readOnly
                      disabled
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {"Not Editable"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>{"Owner Email"}</Label>
                    <Input
                      name="ownerEmail"
                      className="rounded-full bg-gray-50 dark:bg-[#2a2a2a] cursor-not-allowed"
                      value={customer.email || ""}
                      readOnly
                      disabled
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {"Not Editable"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono</Label>
                    <Input
                      name="ownerPhone"
                      className="rounded-full bg-gray-50 dark:bg-[#2a2a2a] cursor-not-allowed"
                      value={customer.phone || ""}
                      readOnly
                      disabled
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {"Not Editable"}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Dirección</Label>
                    <Input
                      name="ownerAddress"
                      className="rounded-full bg-gray-50 dark:bg-[#2a2a2a] cursor-not-allowed"
                      value={customer.address || ""}
                      readOnly
                      disabled
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {"Not Editable"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </form>
        </TabsContent>
      </Tabs>

      <ClientPersistence slug={customerSlug} />
    </div>
  );
}
