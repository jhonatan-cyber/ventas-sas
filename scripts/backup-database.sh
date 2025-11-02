#!/bin/bash

#
# Script de Backup Automático de Base de Datos
# Para uso con cron o programadores de tareas
#
# Configurar en cron:
#   0 2 * * * /ruta/al/script/backup-database.sh
#   (Ejecuta diariamente a las 2 AM)
#

# Directorio del script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/.."

# Cargar variables de entorno
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Verificar que DATABASE_URL esté definida
if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL no está definida"
    exit 1
fi

# Ejecutar backup usando Node.js/tsx
if command -v pnpm &> /dev/null; then
    pnpm tsx scripts/backup-database.ts --compressed
elif command -v node &> /dev/null; then
    npx tsx scripts/backup-database.ts --compressed
else
    echo "❌ Error: No se encontró pnpm o node"
    exit 1
fi

