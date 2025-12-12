# Script PowerShell para configurar tarea programada de limpieza de sesiones
# Sistema de Autenticación Empresarial

Write-Host "🚀 Configurando tarea programada para limpieza automática de sesiones..." -ForegroundColor Green

# Leer variables de entorno desde .env
$envFile = ".env"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
}

$cronSecret = $env:CRON_SECRET
$appUrl = $env:NEXT_PUBLIC_APP_URL

if (-not $cronSecret) {
    Write-Host "❌ Error: CRON_SECRET no está configurado en .env" -ForegroundColor Red
    exit 1
}

if (-not $appUrl) {
    Write-Host "❌ Error: NEXT_PUBLIC_APP_URL no está configurado en .env" -ForegroundColor Red
    exit 1
}

# Configurar tarea programada de Windows
$taskName = "SAS-SessionCleanup"
$taskDescription = "Limpieza automática de sesiones del Sistema de Autenticación Empresarial"

# Comando PowerShell para ejecutar la limpieza
$command = "powershell.exe"
$arguments = "-Command `"Invoke-RestMethod -Uri '$appUrl/api/cron/cleanup-sessions' -Headers @{'Authorization'='Bearer $cronSecret'} | Out-File -Append 'C:\temp\sas-cleanup.log'`""

Write-Host "📋 Configurando tarea programada: $taskName" -ForegroundColor Cyan

# Verificar si la tarea ya existe
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "⚠️  La tarea programada ya existe. ¿Deseas reemplazarla? (Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne "Y" -and $response -ne "y") {
        Write-Host "❌ Operación cancelada" -ForegroundColor Red
        exit 0
    }
    
    # Remover tarea existente
    Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
    Write-Host "🗑️  Tarea anterior removida" -ForegroundColor Yellow
}

# Crear nueva tarea programada
try {
    # Crear acción
    $action = New-ScheduledTaskAction -Execute $command -Argument $arguments
    
    # Crear trigger (cada hora)
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 365)
    
    # Configurar configuración de la tarea
    $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable
    
    # Registrar la tarea
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description $taskDescription -User "SYSTEM"
    
    Write-Host "✅ Tarea programada configurada exitosamente" -ForegroundColor Green
    Write-Host "📊 La tarea se ejecutará cada hora para limpiar sesiones expiradas" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Error configurando tarea programada: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Crear directorio de logs si no existe
$logDir = "C:\temp"
if (-not (Test-Path $logDir)) {
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
}

$logFile = "$logDir\sas-cleanup.log"
if (-not (Test-Path $logFile)) {
    New-Item -ItemType File -Path $logFile -Force | Out-Null
}

Write-Host ""
Write-Host "📝 Para verificar que está funcionando:" -ForegroundColor Cyan
Write-Host "   - Ver tareas programadas: Get-ScheduledTask -TaskName '$taskName'"
Write-Host "   - Revisar logs: Get-Content '$logFile'"
Write-Host "   - Ejecutar manualmente: npm run cleanup:sessions"
Write-Host "   - Ejecutar tarea: Start-ScheduledTask -TaskName '$taskName'"

Write-Host ""
Write-Host "🧹 Ejecutando limpieza inicial..." -ForegroundColor Cyan

# Ejecutar una limpieza inicial
try {
    $headers = @{
        'Authorization' = "Bearer $cronSecret"
    }
    
    $response = Invoke-RestMethod -Uri "$appUrl/api/cron/cleanup-sessions" -Headers $headers -Method Get
    
    Write-Host "✅ Limpieza inicial completada:" -ForegroundColor Green
    Write-Host "   - Sesiones expiradas limpiadas: $($response.results.expiredSessions)" -ForegroundColor White
    Write-Host "   - Tokens invalidados limpiados: $($response.results.invalidatedTokens)" -ForegroundColor White
    Write-Host "   - Sesiones activas totales: $($response.statistics.totalActiveSessions)" -ForegroundColor White
    Write-Host "   - Usuarios activos: $($response.statistics.totalActiveUsers)" -ForegroundColor White
    
} catch {
    Write-Host "⚠️  No se pudo ejecutar limpieza inicial: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "   Verifica que el servidor esté ejecutándose en $appUrl" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Configuración completada!" -ForegroundColor Green