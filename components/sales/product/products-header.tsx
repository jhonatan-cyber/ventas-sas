"use client";

import { Plus, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ProductsHeaderProps {
  title: string;
  description: string;
  newButtonText?: string;
  onNewClick: () => void;
  showButton?: boolean;
  showBackButton?: boolean;
  onBackClick?: () => void;
}

export function ProductsHeader({
  title,
  description,
  newButtonText = "Nuevo",
  onNewClick,
  showButton = true,
  showBackButton = false,
  onBackClick,
}: ProductsHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 md:mb-8">
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
        {showBackButton && onBackClick && (
          <Button
            variant="outline"
            className="rounded-full flex-1 sm:flex-initial"
            onClick={onBackClick}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Atras</span>
          </Button>
        )}
        {showButton && (
          <Button variant="new" className="rounded-full flex-1 sm:flex-initial" onClick={onNewClick}>
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{newButtonText}</span>
            <span className="sm:hidden">Nuevo</span>
          </Button>
        )}
      </div>
    </div>
  );
}
