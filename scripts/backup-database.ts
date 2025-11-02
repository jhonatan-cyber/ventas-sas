/**
 * Script de Backup de Base de Datos
 * 
 * Crea un backup completo de la base de datos PostgreSQL
 * 
 * Uso:
 *   pnpm tsx scripts/backup-database.ts
 *   pnpm tsx scripts/backup-database.ts --output /custom/path
 *   pnpm tsx scripts/backup-database.ts --compressed
 */

import { execSync } from 'child_process'
import { writeFileSync, mkdirSync, readdirSync, statSync, unlinkSync } from 'fs'
import { join } from 'path'
import * as dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

interface BackupOptions {
  outputDir?: string
  compressed?: boolean
  retentionDays?: number
  filename?: string
}

class DatabaseBackup {
  private readonly DEFAULT_BACKUP_DIR = './backups'
  private readonly DEFAULT_RETENTION_DAYS = 30

  /**
   * Parsea la URL de la base de datos para extraer información
   */
  private parseDatabaseUrl(url: string): {
    host: string
    port: string
    database: string
    username: string
    password: string
  } {
    // Formato: postgresql://username:password@host:port/database
    const match = url.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/)
    
    if (!match) {
      throw new Error('DATABASE_URL no tiene un formato válido')
    }

    return {
      username: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5].split('?')[0], // Remover query params
    }
  }

  /**
   * Crea un backup de la base de datos
   */
  async createBackup(options: BackupOptions = {}): Promise<string> {
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      throw new Error('DATABASE_URL no está definida en las variables de entorno')
    }

    const dbInfo = this.parseDatabaseUrl(databaseUrl)
    const outputDir = options.outputDir || this.DEFAULT_BACKUP_DIR
    const retentionDays = options.retentionDays || this.DEFAULT_RETENTION_DAYS

    // Crear directorio de backups si no existe
    mkdirSync(outputDir, { recursive: true })

    // Generar nombre de archivo con timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const extension = options.compressed ? 'dump' : 'sql'
    const filename = options.filename || `backup_${timestamp}.${extension}`
    const backupPath = join(outputDir, filename)

    console.log(`\n📦 Iniciando backup de base de datos...`)
    console.log(`   Base de datos: ${dbInfo.database}`)
    console.log(`   Host: ${dbInfo.host}:${dbInfo.port}`)
    console.log(`   Destino: ${backupPath}`)

    try {
      // Configurar variables de entorno para pg_dump
      const env = {
        ...process.env,
        PGPASSWORD: dbInfo.password,
      }

      // Ejecutar pg_dump
      if (options.compressed) {
        // Backup comprimido (formato custom de PostgreSQL)
        execSync(
          `pg_dump -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.username} -d ${dbInfo.database} -F c -f "${backupPath}"`,
          { env, stdio: 'inherit' }
        )
      } else {
        // Backup SQL plano
        execSync(
          `pg_dump -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.username} -d ${dbInfo.database} -f "${backupPath}"`,
          { env, stdio: 'inherit' }
        )
      }

      // Obtener tamaño del archivo
      const stats = statSync(backupPath)
      const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2)

      console.log(`\n✅ Backup creado exitosamente!`)
      console.log(`   Archivo: ${backupPath}`)
      console.log(`   Tamaño: ${fileSizeMB} MB`)

      // Limpiar backups antiguos
      const deletedCount = this.cleanupOldBackups(outputDir, retentionDays)
      if (deletedCount > 0) {
        console.log(`   Limpieza: ${deletedCount} backup(s) antiguo(s) eliminado(s)`)
      }

      // Crear archivo de metadatos
      const metadataPath = join(outputDir, `${filename}.meta.json`)
      const metadata = {
        filename,
        database: dbInfo.database,
        host: dbInfo.host,
        timestamp: new Date().toISOString(),
        size: stats.size,
        sizeMB: parseFloat(fileSizeMB),
        compressed: options.compressed || false,
        retentionDays,
      }

      writeFileSync(metadataPath, JSON.stringify(metadata, null, 2))

      return backupPath
    } catch (error: any) {
      console.error(`\n❌ Error creando backup:`, error.message)
      throw error
    }
  }

  /**
   * Limpia backups más antiguos que el período de retención
   */
  private cleanupOldBackups(backupDir: string, retentionDays: number): number {
    try {
      const files = readdirSync(backupDir)
      const now = Date.now()
      const retentionMs = retentionDays * 24 * 60 * 60 * 1000
      let deletedCount = 0

      for (const file of files) {
        // Solo procesar archivos de backup (no metadatos)
        if (!file.match(/^backup_.+\.(sql|dump)$/)) {
          continue
        }

        const filePath = join(backupDir, file)
        const stats = statSync(filePath)
        const fileAge = now - stats.mtimeMs

        if (fileAge > retentionMs) {
          unlinkSync(filePath)
          
          // Eliminar también el archivo de metadatos si existe
          const metadataPath = join(backupDir, `${file}.meta.json`)
          try {
            unlinkSync(metadataPath)
          } catch {
            // Ignorar si no existe
          }

          deletedCount++
          console.log(`   🗑️  Eliminado: ${file} (${Math.floor(fileAge / (24 * 60 * 60 * 1000))} días)`)
        }
      }

      return deletedCount
    } catch (error) {
      console.warn(`⚠️  Advertencia: No se pudieron limpiar backups antiguos:`, error)
      return 0
    }
  }

  /**
   * Lista todos los backups disponibles
   */
  listBackups(backupDir: string = this.DEFAULT_BACKUP_DIR): Array<{
    filename: string
    path: string
    size: number
    sizeMB: number
    createdAt: Date
    metadata?: any
  }> {
    try {
      mkdirSync(backupDir, { recursive: true })
      const files = readdirSync(backupDir)
      const backups: Array<{
        filename: string
        path: string
        size: number
        sizeMB: number
        createdAt: Date
        metadata?: any
      }> = []

      for (const file of files) {
        if (!file.match(/^backup_.+\.(sql|dump)$/)) {
          continue
        }

        const filePath = join(backupDir, file)
        const stats = statSync(filePath)

        // Intentar cargar metadatos
        let metadata
        try {
          const metadataPath = join(backupDir, `${file}.meta.json`)
          const metadataContent = require(metadataPath)
          metadata = metadataContent
        } catch {
          // No hay metadatos
        }

        backups.push({
          filename: file,
          path: filePath,
          size: stats.size,
          sizeMB: parseFloat((stats.size / 1024 / 1024).toFixed(2)),
          createdAt: stats.mtime,
          metadata,
        })
      }

      // Ordenar por fecha (más reciente primero)
      return backups.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    } catch (error) {
      console.error(`Error listando backups:`, error)
      return []
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2)
  const options: BackupOptions = {}

  // Parsear argumentos
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' && args[i + 1]) {
      options.outputDir = args[i + 1]
      i++
    } else if (args[i] === '--compressed') {
      options.compressed = true
    } else if (args[i] === '--retention-days' && args[i + 1]) {
      options.retentionDays = parseInt(args[i + 1])
      i++
    } else if (args[i] === '--filename' && args[i + 1]) {
      options.filename = args[i + 1]
      i++
    } else if (args[i] === '--list') {
      const backup = new DatabaseBackup()
      const backups = backup.listBackups()
      
      console.log(`\n📋 Backups disponibles (${backups.length}):\n`)
      if (backups.length === 0) {
        console.log('   No hay backups disponibles')
      } else {
        backups.forEach((b, index) => {
          console.log(`   ${index + 1}. ${b.filename}`)
          console.log(`      Tamaño: ${b.sizeMB} MB`)
          console.log(`      Fecha: ${b.createdAt.toLocaleString()}`)
          if (b.metadata) {
            console.log(`      Base de datos: ${b.metadata.database}`)
          }
          console.log('')
        })
      }
      process.exit(0)
    }
  }

  const backup = new DatabaseBackup()
  backup
    .createBackup(options)
    .then(() => {
      console.log('\n✨ Proceso completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Error:', error.message)
      process.exit(1)
    })
}

export { DatabaseBackup }

