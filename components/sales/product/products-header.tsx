"use client";

import { Plus, ArrowLeft, Download } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

interface ProductsHeaderProps {
  title: string;
  description: string;
  newButtonText?: string;
  onNewClick: () => void;
  showButton?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
  onExportImportClick?: () => void;
}

export function ProductsHeader({
  title,
  description,
  newButtonText,
  onNewClick,
  showButton = true,
  showBackButton = false,
  onBackClick,
  onExportImportClick,
}: ProductsHeaderProps) {
  const t = useTranslations()
  const defaultNewText = newButtonText || t('action.new')
  
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
        {showBackButton && onBackClick && (
          <Button
            variant="outline"
            className="rounded-full w-full sm:w-auto"
            onClick={onBackClick}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span>{t('action.back')}</span>
          </Button>
        )}
        {onExportImportClick && (
          <Button
            variant="outline"
            className="rounded-full w-full sm:w-auto"
            onClick={onExportImportClick}
          >
            <Download className="h-4 w-4 mr-2" />
            <span>{t('products.exportImport.title') || 'Exportar/Importar'}</span>
          </Button>
        )}
        {showButton && (
          <Button variant="new" className="rounded-full w-full sm:w-auto" onClick={onNewClick}>
            <Plus className="h-4 w-4 mr-2" />
            <span>{defaultNewText}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
