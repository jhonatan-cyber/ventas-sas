#!/usr/bin/env node

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function cleanupDevLogs() {
  console.log('🧹 Limpiando logs de desarrollo...')
  
  try {
    // Limpiar archivos temporales de Windows
    const tempPaths = [
      'C:\\temp\\sas-cleanup.log',
    ]
    
    for (const tempPath of tempPaths) {
      try {
        if (fs.existsSync(tempPath)) {
          fs.unlinkSync(tempPath)
          console.log(`   ✅ Eliminado: ${tempPath}`)
        }
      } catch (error) {
        // Ignorar errores de permisos
      }
    }
    
    // Limpiar logs de sistema Unix/Linux (si existen)
    const unixLogPaths = [
      '/var/log/sas-cleanup.log',
    ]
    
    for (const logPath of unixLogPaths) {
      try {
        if (fs.existsSync(logPath)) {
          fs.unlinkSync(logPath)
          console.log(`   ✅ Eliminado: ${logPath}`)
        }
      } catch (error) {
        // Ignorar errores de permisos o rutas no existentes
      }
    }
    
    // Limpiar archivos de log específicos del proyecto
    const projectRoot = path.join(__dirname, '..')
    const specificLogFiles = [
      path.join(projectRoot, 'npm-debug.log'),
      path.join(projectRoot, 'yarn-debug.log'),
      path.join(projectRoot, 'yarn-error.log'),
      path.join(projectRoot, 'pnpm-debug.log'),
      path.join(projectRoot, 'lerna-debug.log'),
      path.join(projectRoot, 'debug.log'),
      path.join(projectRoot, 'error.log'),
      path.join(projectRoot, 'access.log')
    ]
    
    for (const logFile of specificLogFiles) {
      try {
        if (fs.existsSync(logFile)) {
          fs.unlinkSync(logFile)
          console.log(`   ✅ Eliminado: ${logFile}`)
        }
      } catch (error) {
        console.log(`   ⚠️  No se pudo eliminar: ${logFile}`)
      }
    }
    
    console.log('✨ Limpieza de logs de desarrollo completada')
    
  } catch (error) {
    console.error('❌ Error durante la limpieza de logs de desarrollo:', error)
  }
}

// Ejecutar siempre
cleanupDevLogs()

export { cleanupDevLogs }