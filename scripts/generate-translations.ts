/**
 * Script para generar traducciones automáticamente
 * Lee messages/es.json y genera messages/en.json y messages/pt.json
 */

import { config } from 'dotenv'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import { translateObject } from '../lib/services/translation/auto-translate-service'

// Cargar variables de entorno
config()

async function generateTranslations() {
  const messagesDir = join(process.cwd(), 'messages')
  const sourceFile = join(messagesDir, 'es.json')
  
  // Leer archivo fuente en español
  const sourceContent = JSON.parse(readFileSync(sourceFile, 'utf-8'))

  // Idiomas a generar
  const targetLanguages = [
    { code: 'en', name: 'English' },
    { code: 'pt', name: 'Português' }
  ]

  console.log('🌍 Generando traducciones automáticas...\n')

  for (const { code, name } of targetLanguages) {
    try {
      console.log(`📝 Traduciendo a ${name} (${code})...`)
      console.log('⏳ Esto puede tomar varios minutos debido a los límites de la API...\n')
      
      let translatedCount = 0
      const totalStrings = Object.values(sourceContent).reduce((count, value) => {
        const countStrings = (obj: any): number => {
          if (typeof obj === 'string') return 1
          if (typeof obj === 'object' && obj !== null) {
            return Object.values(obj).reduce((sum, v) => sum + countStrings(v), 0)
          }
          return 0
        }
        return count + countStrings(value)
      }, 0)
      
      const translated = await translateObject(sourceContent, 'es', code, {
        delayBetweenRequests: 7000, // 7 segundos entre solicitudes (respetar 10/min)
        onProgress: (current, total) => {
          translatedCount = current
          const percentage = Math.round((current / total) * 100)
          process.stdout.write(`\r   Progreso: ${current}/${total} (${percentage}%)`)
        }
      })
      
      console.log('\n') // Nueva línea después del progreso
      
      const outputFile = join(messagesDir, `${code}.json`)
      writeFileSync(outputFile, JSON.stringify(translated, null, 2), 'utf-8')
      
      console.log(`✅ Traducción a ${name} completada: ${outputFile}\n`)
    } catch (error) {
      console.error(`\n❌ Error traduciendo a ${name}:`, error)
    }
  }

  console.log('✨ Proceso completado!')
}

// Ejecutar si se llama directamente
generateTranslations().catch(console.error)

export { generateTranslations }


