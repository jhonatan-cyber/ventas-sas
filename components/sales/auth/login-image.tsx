/**
 * Componente cliente para la imagen del login con manejo de errores
 */

"use client";

import { useState } from "react";

interface LoginImageProps {
  src: string;
  alt: string;
  className?: string;
}

export function LoginImage({ src, alt, className }: LoginImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  if (imageError) {
    return null;
  }

  return (
    <div className="mt-12 max-w-lg transform hover:scale-[1.02] transition-transform duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 rounded-2xl blur-xl"></div>
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 rounded-2xl animate-pulse flex items-center justify-center">
            <div className="text-gray-400 dark:text-gray-600 text-sm">
              Cargando imagen...
            </div>
          </div>
        )}
        <img
          src={src}
          alt={alt}
          className={`relative w-full h-auto rounded-2xl shadow-2xl transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          } ${className || ""}`}
          onError={() => {
            setImageError(true);
          }}
          onLoad={() => {
            setImageLoaded(true);
          }}
          loading="eager"
        />
      </div>
    </div>
  );
}
