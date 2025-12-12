"use client";

import { useEffect } from "react";

export function DashboardTransition() {
  useEffect(() => {
    // Verificar si viene del login
    const fromLogin = sessionStorage.getItem('sas-from-login');
    
    if (fromLogin === 'true') {
      // Detectado login transition
      
      // Aplicar animación de zoom desde el centro al dashboard
      const dashboardPage = document.querySelector('[data-dashboard-page]');
      if (dashboardPage) {
        // Aplicando animación de zoom
        dashboardPage.classList.add('animate-zoom-in-center');
        // Fallback con estilos inline
        (dashboardPage as HTMLElement).style.animation = 'zoomInFromCenter 1s ease-out forwards';
      }
      
      // Limpiar el flag después de la animación
      setTimeout(() => {
        sessionStorage.removeItem('sas-from-login');
        if (dashboardPage) {
          dashboardPage.classList.remove('animate-zoom-in-center');
        }
      }, 1200);
    }
    
    // Limpiar cualquier clase de transición de login que pueda quedar
    document.body.classList.remove('login-transition-active');
  }, []);

  return null;
}