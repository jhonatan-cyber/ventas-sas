# Script para probar la limpieza de sesiones

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
    Write-Host "❌ CRON_SECRET no encontrado en .env" -ForegroundColor Red
    exit 1
}

if (-not $appUrl) {
    Write-Host "❌ NEXT_PUBLIC_APP_URL no encontrado en .env" -ForegroundColor Red
    exit 1
}

Write-Host "🧹 Probando limpieza de sesiones..." -ForegroundColor Cyan
Write-Host "URL: $appUrl/api/cron/cleanup-sessions" -ForegroundColor Gray

try {
    $headers = @{
        'Authorization' = "Bearer $cronSecret"
    }
    
    $response = Invoke-RestMethod -Uri "$appUrl/api/cron/cleanup-sessions" -Headers $headers -Method Get
    
    Write-Host "✅ Limpieza completada exitosamente:" -ForegroundColor Green
    Write-Host ($response | ConvertTo-Json -Depth 3) -ForegroundColor White
    
} catch {
    Write-Host "❌ Error en limpieza: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode
        Write-Host "Código de estado: $statusCode" -ForegroundColor Yellow
    }
}