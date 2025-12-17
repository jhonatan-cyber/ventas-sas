"use client"

import { useState } from "react"

export default function VelocityLanding() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  function handleCtaClick(e?: React.MouseEvent) {
    e?.preventDefault()
    setMessage('¡Excelente decisión! Un asesor se pondrá en contacto pronto. (Acción de CTA simulada).')
    setTimeout(() => setMessage(null), 5000)
  }

  return (
    <main>
      <header className="bg-white shadow-md sticky top-0 z-20">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="#" className="flex items-center space-x-2">
              <svg className="h-8 w-8 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8A5 5 0 008 3v1a3 3 0 013-3h1"/></svg>
              <span className="text-xl font-extrabold text-gray-900">Velocity</span>
            </a>

            <div className="hidden md:flex space-x-8">
              <a href="#features" className="text-gray-600 hover:text-sky-600 transition duration-150">Funcionalidades</a>
              <a href="#security" className="text-gray-600 hover:text-primary-bold transition duration-150">Seguridad</a>
              <a href="#pricing" className="text-gray-600 hover:text-primary-bold transition duration-150">Precios</a>
              <a href="#contact" className="text-gray-600 hover:text-primary-bold transition duration-150">Contacto</a>
            </div>

              <a onClick={handleCtaClick} aria-label="Comenzar prueba gratuita" className="hidden md:block px-4 py-2 border border-transparent text-sm font-medium rounded-full text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg transition duration-300 transform hover:scale-105 cursor-pointer">
              Empieza Gratis Hoy
            </a>

            <button type="button" className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none" onClick={() => setMobileOpen(!mobileOpen)} aria-controls="mobile-menu" aria-expanded={mobileOpen}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
          </div>
        </nav>

        <div className={`md:hidden ${mobileOpen ? '' : 'hidden'}`} id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <a href="#features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Funcionalidades</a>
            <a href="#security" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Seguridad</a>
            <a href="#pricing" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Precios</a>
            <a href="#contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Contacto</a>
            <a onClick={handleCtaClick} className="block w-full text-center mt-4 px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-emerald-500 hover:bg-emerald-600 transition duration-150 cursor-pointer">
              Empieza Gratis Hoy
            </a>
          </div>
        </div>
      </header>

      <section className="bg-sky-600 overflow-hidden">
        <div className="max-w-7xl mx-auto pt-16 pb-20 px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <div id="message-box" className={`rounded-lg ${message ? 'bg-emerald-500 p-4' : ''}`}>{message ? <p className="text-white font-semibold">{message}</p> : null}</div>

              <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-500 text-white shadow-md mb-4">
                SaaS #1 para Cierre Imparable
              </span>

              <h1 className="mt-4 text-4xl tracking-tight font-extrabold text-white sm:mt-5 sm:text-6xl lg:mt-6 xl:text-7xl">
                <span className="block">Cierra Más.</span>
                <span className="block text-emerald-500">Más Rápido.</span>
                <span className="block">Con Total Certeza.</span>
              </h1>
              <p className="mt-3 text-base text-sky-200 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Deja de adivinar y empieza a dominar tu pipeline. Velocity te da la actitud, la data y la seguridad para convertir cada oportunidad en una venta.
              </p>

              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <button onClick={handleCtaClick} aria-label="Pide tu Demo Élite" className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-sky-600 bg-white hover:bg-gray-200 shadow-xl transition duration-300 transform hover:scale-105 focus:outline-none">
                  <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  Pide tu Demo Élite
                </button>
                <p className="mt-3 text-sm text-sky-200">No requiere tarjeta de crédito. Implementación en 15 minutos.</p>
              </div>
            </div>

            <div className="mt-12 lg:mt-0 lg:col-span-6">
              <div className="bg-gradient-to-br from-white to-gray-200 rounded-xl p-6 shadow-2xl transform rotate-3 hover:rotate-0 transition duration-500 border border-gray-100">
                <div className="aspect-w-16 aspect-h-9 overflow-hidden rounded-lg">
                  <img src="https://placehold.co/800x500/4F46E5/FFFFFF?text=Dashboard+Inteligente+de+Ventas" alt="" className="w-full h-auto object-cover border border-sky-300 shadow-inner" />
                </div>
                <p className="mt-4 text-center text-sm font-medium text-gray-600">Interfaz de ventas clara y potente. Predicciones en tiempo real.</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-sky-600 opacity-10" aria-hidden />
      </section>

      <section className="py-12 bg-white sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm font-semibold uppercase text-gray-500 tracking-wider">Más de 500 equipos de ventas confían en Velocity</p>
          <div className="mt-6 grid grid-cols-2 gap-8 md:grid-cols-6 lg:grid-cols-5 items-center">
            <div className="col-span-1 flex justify-center py-4 px-4 bg-gray-50 rounded-lg shadow-inner">
              <img className="max-h-8 sm:max-h-10 opacity-70" src="/uploads/logo1.svg" alt="Empresa A" />
            </div>
            <div className="col-span-1 flex justify-center py-4 px-4 bg-gray-50 rounded-lg shadow-inner">
              <img className="max-h-8 sm:max-h-10 opacity-70" src="/uploads/logo2.svg" alt="Fintech B" />
            </div>
            <div className="col-span-1 flex justify-center py-4 px-4 bg-gray-50 rounded-lg shadow-inner">
              <img className="max-h-8 sm:max-h-10 opacity-70" src="/uploads/logo3.svg" alt="Agencia C" />
            </div>
            <div className="col-span-1 hidden md:block flex justify-center py-4 px-4 bg-gray-50 rounded-lg shadow-inner">
              <img className="max-h-8 sm:max-h-10 opacity-70" src="https://placehold.co/150x50/F8F8F8/4F46E5?text=TECH+D" alt="Tech D" />
            </div>
            <div className="col-span-2 md:col-span-2 lg:col-span-1 flex justify-center py-4 px-4 bg-gray-50 rounded-lg shadow-inner">
              <img className="max-h-8 sm:max-h-10 opacity-70" src="https://placehold.co/150x50/F8F8F8/4F46E5?text=GLOBAL+E" alt="Global E" />
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-base text-sky-600 font-semibold tracking-wide uppercase">CERO RIESGO</h2>
          <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">La Seguridad y Confianza que tus Datos Merecen.</p>
          <p className="mt-4 max-w-2xl text-xl text-gray-500 mx-auto">Hemos construido Velocity con los estándares más estrictos para que tú solo te concentres en vender.</p>

          <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition duration-300 border-t-4 border-emerald-500">
              <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>
              <h3 className="mt-5 text-lg font-medium text-gray-900">Cifrado de Nivel Bancario</h3>
              <p className="mt-2 text-base text-gray-500">Toda tu información está protegida con cifrado SSL de 256 bits.</p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition duration-300 border-t-4 border-sky-600">
              <svg className="h-10 w-10 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <h3 className="mt-5 text-lg font-medium text-gray-900">Garantía de Uptime 99.9%</h3>
              <p className="mt-2 text-base text-gray-500">Nuestra infraestructura garantiza alta disponibilidad para que cierres ventas 24/7.</p>
            </div>

            <div className="p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl transition duration-300 border-t-4 border-emerald-500">
              <svg className="h-10 w-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>
              <h3 className="mt-5 text-lg font-medium text-gray-900">Cumplimiento Global (GDPR, CCPA)</h3>
              <p className="mt-2 text-base text-gray-500">Manejamos tus datos con apego a las regulaciones internacionales.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="relative bg-white py-16 sm:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-sky-600 font-semibold tracking-wide uppercase">RESULTADOS INMEDIATOS</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">Las 3 Palancas que Multiplicarán tus Ventas.</p>
          </div>

          <div className="mt-20">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-xl bg-sky-600 text-white shadow-lg">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
                  </div>
                  <p className="ml-16 text-xl leading-6 font-bold text-gray-900">Aumenta la Tasa de Conversión</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">Identifica los leads de mayor valor con IA predictiva. Deja de perseguir contactos fríos.</dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-xl bg-sky-600 text-white shadow-lg">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v14L9 19zm0 0l-4 3m4-3h12"/></svg>
                  </div>
                  <p className="ml-16 text-xl leading-6 font-bold text-gray-900">Control Total del Pipeline</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">Visualiza cada etapa de la venta en tiempo real. Métricas claras y alertas.</dd>
              </div>

              <div className="relative">
                <dt>
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-xl bg-sky-600 text-white shadow-lg">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10M19 7v10M15 5h-4l-1 2H5V3h14v2z"/></svg>
                  </div>
                  <p className="ml-16 text-xl leading-6 font-bold text-gray-900">Automatiza las Tareas tediosas</p>
                </dt>
                <dd className="mt-2 ml-16 text-base text-gray-500">Velocity toma el control del 60% de tus tareas administrativas para que vendas más.</dd>
              </div>
            </dl>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-16 sm:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-sky-600 font-semibold tracking-wide uppercase">INVERSIÓN INTELIGENTE</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">Planes diseñados para tu ambición.</p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">Sin costos ocultos. Solo el poder de venta que necesitas.</p>
          </div>

          <div className="mt-16 space-y-8 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-8">
            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 transform hover:scale-[1.02] transition duration-300">
              <h3 className="text-xl font-semibold text-gray-900">Plan Starter</h3>
              <p className="mt-4 text-gray-500">Ideal para equipos pequeños.</p>
              <p className="mt-6"><span className="text-4xl font-extrabold text-gray-900">$29</span><span className="text-base font-medium text-gray-500">/usuario/mes</span></p>
              <button onClick={handleCtaClick} className="mt-8 block w-full py-3 px-6 border border-gray-300 rounded-full text-center text-sm font-medium text-sky-600 bg-white hover:bg-gray-100 transition duration-150 shadow-md">Prueba Starter Gratis</button>
            </div>

            <div className="bg-sky-600 rounded-xl shadow-2xl p-8 transform scale-105 border-4 border-emerald-500 z-10">
              <h3 className="text-xl font-semibold text-white">Plan Pro (Recomendado)</h3>
              <p className="mt-4 text-sky-200">Para equipos que buscan optimización total.</p>
              <p className="mt-6"><span className="text-4xl font-extrabold text-white">$79</span><span className="text-base font-medium text-indigo-200">/usuario/mes</span></p>
              <button onClick={handleCtaClick} className="mt-8 block w-full py-3 px-6 border border-transparent rounded-full text-center text-sm font-medium text-sky-600 bg-emerald-500 hover:bg-emerald-600 shadow-xl transition duration-150 transform hover:scale-105">Comenzar con el Plan Pro</button>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-8 transform hover:scale-[1.02] transition duration-300">
              <h3 className="text-xl font-semibold text-gray-900">Plan Enterprise</h3>
              <p className="mt-4 text-gray-500">Para grandes corporaciones.</p>
              <p className="mt-6"><span className="text-4xl font-extrabold text-gray-900">A Medida</span></p>
              <button onClick={handleCtaClick} className="mt-8 block w-full py-3 px-6 border border-gray-300 rounded-full text-center text-sm font-medium text-sky-600 bg-white hover:bg-gray-100 transition duration-150 shadow-md">Contactar a Ventas</button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-sky-600 mt-12 sm:mt-20">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Tu Competencia ya está mejorando.</span>
            <span className="block text-emerald-500">Es hora de superarlos con Velocity.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-full shadow-lg">
              <button onClick={handleCtaClick} className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-primary-bold bg-white hover:bg-gray-200 transition duration-300 transform hover:scale-105">Empieza tu Prueba Gratuita (30 Días)</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
