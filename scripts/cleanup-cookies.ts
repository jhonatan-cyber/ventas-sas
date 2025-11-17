/**
 * Script para limpiar cookies de preferencias (OPCIONAL)
 * 
 * ⚠️ ADVERTENCIA: Solo ejecutar después de confirmar que:
 * 1. Todas las configuraciones están migradas a la BD
 * 2. El sistema funciona correctamente sin cookies
 * 3. Se ha probado en desarrollo y producción
 * 
 * Este script genera código JavaScript que el usuario puede ejecutar
 * en la consola del navegador para limpiar cookies de preferencias.
 * 
 * Uso:
 *   npx tsx scripts/cleanup-cookies.ts
 * 
 * Luego copia el código generado y ejecútalo en la consola del navegador.
 */

/**
 * Genera código JavaScript para limpiar cookies de preferencias
 */
function generateCleanupScript(): string {
  return `
// Script para limpiar cookies de preferencias del sistema SAS
// Ejecutar en la consola del navegador (F12 > Console)

(function() {
  console.log('🧹 Iniciando limpieza de cookies de preferencias...');
  
  let cleaned = 0;
  const cookies = document.cookie.split(';');
  
  cookies.forEach(cookie => {
    const cookieName = cookie.trim().split('=')[0];
    
    // Limpiar cookies de preferencias
    if (cookieName.startsWith('sas-prefs-')) {
      // Eliminar cookie estableciendo fecha de expiración en el pasado
      document.cookie = cookieName + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;';
      document.cookie = cookieName + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=' + window.location.hostname;
      document.cookie = cookieName + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.' + window.location.hostname;
      cleaned++;
      console.log('   ✅ Eliminada: ' + cookieName);
    }
  });
  
  console.log('✨ Limpieza completada. Cookies eliminadas: ' + cleaned);
  console.log('💡 Las preferencias ahora se cargan desde la base de datos.');
})();
`.trim()
}

/**
 * Genera instrucciones para limpiar cookies desde el servidor (si es posible)
 */
function generateServerInstructions(): string {
  return `
INSTRUCCIONES PARA LIMPIAR COOKIES DESDE EL SERVIDOR:

1. Si usas Next.js con cookies del servidor:
   - Las cookies se eliminan automáticamente cuando expiran
   - No es necesario limpiarlas manualmente del servidor

2. Si necesitas limpiar cookies de sesiones almacenadas:
   - Revisa tu sistema de gestión de sesiones
   - Las cookies del cliente se eliminan cuando el usuario las borra

3. Para limpiar cookies de todos los usuarios:
   - Esto requiere que cada usuario ejecute el script en su navegador
   - O implementar un endpoint que elimine cookies al iniciar sesión
`.trim()
}

/**
 * Función principal
 */
async function main() {
  console.log('📝 Generando script de limpieza de cookies\n')
  console.log('='.repeat(60))
  console.log('⚠️  ADVERTENCIA IMPORTANTE')
  console.log('='.repeat(60))
  console.log('Solo ejecuta este script DESPUÉS de confirmar que:')
  console.log('1. ✅ Todas las configuraciones están en la base de datos')
  console.log('2. ✅ El sistema funciona sin cookies')
  console.log('3. ✅ Se ha probado en desarrollo y producción')
  console.log('='.repeat(60))
  console.log('')

  const cleanupScript = generateCleanupScript()
  const serverInstructions = generateServerInstructions()

  console.log('📋 CÓDIGO PARA EJECUTAR EN LA CONSOLA DEL NAVEGADOR:')
  console.log('='.repeat(60))
  console.log(cleanupScript)
  console.log('='.repeat(60))
  console.log('')

  console.log('📋 INSTRUCCIONES ADICIONALES:')
  console.log('='.repeat(60))
  console.log(serverInstructions)
  console.log('='.repeat(60))
  console.log('')

  console.log('💡 CÓMO USAR:')
  console.log('1. Abre la consola del navegador (F12 > Console)')
  console.log('2. Copia y pega el código generado arriba')
  console.log('3. Presiona Enter para ejecutar')
  console.log('4. Verifica que las cookies fueron eliminadas')
  console.log('')

  // Guardar script en archivo
  const fs = await import('fs')
  const path = await import('path')
  const { fileURLToPath } = await import('url')
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
  const outputPath = path.join(__dirname, 'cleanup-cookies-browser.js')
  
  fs.writeFileSync(outputPath, cleanupScript, 'utf-8')
  console.log(`✅ Script guardado en: ${outputPath}`)
  console.log('   Puedes abrir este archivo y copiar el contenido a la consola del navegador.')
}

async function runMain() {
  if (import.meta.url === `file://${process.argv[1]}`) {
    await main()
  }
}

runMain()

export { generateCleanupScript }

