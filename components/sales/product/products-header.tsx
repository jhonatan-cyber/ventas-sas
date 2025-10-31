"use client";

import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";

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
    <div className="flex items-center justify-between mb-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          {title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <div className="flex items-center gap-3">
        {showBackButton && onBackClick && (
          <Button
            variant="outline"
            className="rounded-full"
            onClick={onBackClick}
          >
            <ArrowLeft className="h-4 w-4" />
            Atras
          </Button>
        )}
        {showButton && (
          <Button variant="new" className="rounded-full" onClick={onNewClick}>
            <Plus className="h-4 w-4" />
            {newButtonText}
          </Button>
        )}
      </div>
    </div>
  );
}
