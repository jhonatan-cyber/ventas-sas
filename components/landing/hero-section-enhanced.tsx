"use client"

import { useState } from "react"

interface HeroSectionProps {
	mounted: boolean
	activeUsers: number
	viewingPage: number
	onContactClick: () => void
	trackEvent: (eventName: string, eventData?: Record<string, any>) => void
}

export function HeroSectionEnhanced({ mounted: _mounted, activeUsers: _activeUsers, onContactClick, trackEvent }: HeroSectionProps) {
	const [message, setMessage] = useState<string | null>(null)

	function handleCta(e?: React.MouseEvent) {
		e?.preventDefault()
		setMessage('¡Excelente decisión! Un asesor se pondrá en contacto pronto. (Acción de CTA simulada).')
		onContactClick && onContactClick()
		trackEvent && trackEvent("Hero_cta_clicked")
		setTimeout(() => setMessage(null), 5000)
	}

	return (
		<section className="bg-sky-600 overflow-hidden relative">
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

						<p className="mt-3 text-base text-sky-200 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl max-w-xl">
							Deja de adivinar y empieza a dominar tu pipeline. Velocity te da la actitud, la data y la seguridad para convertir cada oportunidad en una venta. Es momento de un crecimiento imparable.
						</p>

						<div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
							<button onClick={handleCta} aria-label="Pide tu Demo Élite" className="w-full sm:w-auto flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-sky-600 bg-white hover:bg-gray-200 shadow-xl transition duration-300 transform hover:scale-105 focus:outline-none">
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
	)
}


