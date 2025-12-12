#!/bin/bash

# Script para configurar cron job de limpieza de sesiones
# Sistema de Autenticación Empresarial

echo "🚀 Configurando cron job para limpieza automática de sesiones..."

# Verificar que las variables de entorno estén configuradas
if [ -z "$CRON_SECRET" ]; then
    echo "❌ Error: CRON_SECRET no está configurado en .env"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
    echo "❌ Error: NEXT_PUBLIC_APP_URL no está configurado en .env"
    exit 1
fi

# Crear el comando del cron job
CRON_COMMAND="0 * * * * curl -H \"Authorization: Bearer $CRON_SECRET\" \"$NEXT_PUBLIC_APP_URL/api/cron/cleanup-sessions\" >> /var/log/sas-cleanup.log 2>&1"

echo "📋 Comando del cron job:"
echo "$CRON_COMMAND"

# Verificar si el cron job ya existe
if crontab -l 2>/dev/null | grep -q "cleanup-sessions"; then
    echo "⚠️  Cron job ya existe. ¿Deseas reemplazarlo? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Operación cancelada"
        exit 0
    fi
    
    # Remover cron job existente
    crontab -l 2>/dev/null | grep -v "cleanup-sessions" | crontab -
    echo "🗑️  Cron job anterior removido"
fi

# Agregar nuevo cron job
(crontab -l 2>/dev/null; echo "$CRON_COMMAND") | crontab -

if [ $? -eq 0 ]; then
    echo "✅ Cron job configurado exitosamente"
    echo "📊 El cron job se ejecutará cada hora para limpiar sesiones expiradas"
    echo ""
    echo "📝 Para verificar que está funcionando:"
    echo "   - Revisar logs: tail -f /var/log/sas-cleanup.log"
    echo "   - Listar cron jobs: crontab -l"
    echo "   - Ejecutar manualmente: npm run cleanup:sessions"
else
    echo "❌ Error configurando cron job"
    exit 1
fi

# Crear directorio de logs si no existe
sudo mkdir -p /var/log
sudo touch /var/log/sas-cleanup.log
sudo chmod 666 /var/log/sas-cleanup.log

echo ""
echo "🎉 Configuración completada!"
echo "📈 Estadísticas del sistema:"

# Ejecutar una limpieza inicial para mostrar estadísticas
echo "🧹 Ejecutando limpieza inicial..."
curl -H "Authorization: Bearer $CRON_SECRET" "$NEXT_PUBLIC_APP_URL/api/cron/cleanup-sessions" 2>/dev/null | jq '.' || echo "Respuesta recibida (instalar jq para formato JSON)"