/**
 * Script de Restauración de Base de Datos
 * 
 * Restaura un backup de PostgreSQL
 * 
 * Uso:
 *   pnpm tsx scripts/restore-database.ts <backup-file>
 *   pnpm tsx scripts/restore-database.ts backup_2025-01-15T10-30-00.sql
 *   pnpm tsx scripts/restore-database.ts backup_2025-01-15T10-30-00.dump
 */

import { execSync } from 'child_process'
import { existsSync, statSync } from 'fs'
import { join } from 'path'
import * as dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config()

interface RestoreOptions {
  backupFile: string
  backupDir?: string
  dropDatabase?: boolean
  createDatabase?: boolean
}

class DatabaseRestore {
  private readonly DEFAULT_BACKUP_DIR = './backups'

  /**
   * Parsea la URL de la base de datos
   */
  private parseDatabaseUrl(url: string): {
    host: string
    port: string
    database: string
    username: string
    password: string
  } {
    const match = url.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/)

    if (!match) {
      throw new Error('DATABASE_URL no tiene un formato válido')
    }

    return {
      username: match[1],
      password: match[2],
      host: match[3],
      port: match[4],
      database: match[5].split('?')[0],
    }
  }

  /**
   * Restaura un backup de la base de datos
   */
  async restoreBackup(options: RestoreOptions): Promise<void> {
    const databaseUrl = process.env.DATABASE_URL

    if (!databaseUrl) {
      throw new Error('DATABASE_URL no está definida en las variables de entorno')
    }

    const dbInfo = this.parseDatabaseUrl(databaseUrl)
    const backupDir = options.backupDir || this.DEFAULT_BACKUP_DIR

    // Resolver ruta del backup
    let backupPath: string
    if (existsSync(options.backupFile)) {
      // Ruta absoluta o relativa completa
      backupPath = options.backupFile
    } else {
      // Buscar en directorio de backups
      backupPath = join(backupDir, options.backupFile)
    }

    if (!existsSync(backupPath)) {
      throw new Error(`Backup no encontrado: ${backupPath}`)
    }

    const stats = statSync(backupPath)
    const fileSizeMB = (stats.size / 1024 / 1024).toFixed(2)
    const isCompressed = backupPath.endsWith('.dump')

    console.log(`\n🔄 Iniciando restauración de base de datos...`)
    console.log(`   Backup: ${backupPath}`)
    console.log(`   Tamaño: ${fileSizeMB} MB`)
    console.log(`   Formato: ${isCompressed ? 'Comprimido (custom)' : 'SQL plano'}`)
    console.log(`   Base de datos destino: ${dbInfo.database}`)
    console.log(`   Host: ${dbInfo.host}:${dbInfo.port}`)

    // Confirmación de seguridad
    if (!process.env.SKIP_CONFIRMATION) {
      console.log(`\n⚠️  ADVERTENCIA: Esta operación SOBRESCRIBIRÁ la base de datos actual!`)
      console.log(`   Presiona Ctrl+C para cancelar, o espera 5 segundos...`)
      await new Promise((resolve) => setTimeout(resolve, 5000))
    }

    try {
      const env = {
        ...process.env,
        PGPASSWORD: dbInfo.password,
      }

      if (isCompressed) {
        // Restaurar desde formato custom comprimido
        console.log(`\n📥 Restaurando desde formato comprimido...`)
        execSync(
          `pg_restore -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.username} -d ${dbInfo.database} --clean --if-exists "${backupPath}"`,
          { env, stdio: 'inherit' }
        )
      } else {
        // Restaurar desde SQL plano
        console.log(`\n📥 Restaurando desde SQL...`)
        
        if (options.dropDatabase && options.createDatabase) {
          // Desconectar usuarios y recrear base de datos
          execSync(
            `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.username} -d postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbInfo.database}' AND pid <> pg_backend_pid();"`,
            { env }
          )
          
          execSync(
            `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.username} -d postgres -c "DROP DATABASE IF EXISTS \\"${dbInfo.database}\\";"`,
            { env }
          )
          
          execSync(
            `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.username} -d postgres -c "CREATE DATABASE \\"${dbInfo.database}\\";"`,
            { env }
          )
        }

        execSync(
          `psql -h ${dbInfo.host} -p ${dbInfo.port} -U ${dbInfo.username} -d ${dbInfo.database} -f "${backupPath}"`,
          { env, stdio: 'inherit' }
        )
      }

      console.log(`\n✅ Restauración completada exitosamente!`)
    } catch (error: any) {
      console.error(`\n❌ Error restaurando backup:`, error.message)
      throw error
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const args = process.argv.slice(2)

  if (args.length === 0) {
    console.error('\n❌ Error: Debes especificar el archivo de backup a restaurar')
    console.error('\nUso:')
    console.error('  pnpm tsx scripts/restore-database.ts <backup-file>')
    console.error('  pnpm tsx scripts/restore-database.ts backup_2025-01-15T10-30-00.sql')
    console.error('\nOpciones:')
    console.error('  --drop-db     Elimina y recrea la base de datos antes de restaurar')
    console.error('  --skip-confirmation  No pide confirmación (útil para scripts)')
    process.exit(1)
  }

  const options: RestoreOptions = {
    backupFile: args[0],
    dropDatabase: args.includes('--drop-db'),
    createDatabase: args.includes('--drop-db'),
  }

  // Permitir saltar confirmación con variable de entorno o flag
  if (args.includes('--skip-confirmation')) {
    process.env.SKIP_CONFIRMATION = 'true'
  }

  const restore = new DatabaseRestore()
  restore
    .restoreBackup(options)
    .then(() => {
      console.log('\n✨ Proceso completado')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n💥 Error:', error.message)
      process.exit(1)
    })
}

export { DatabaseRestore }

