@echo off
REM Script de Backup Automático de Base de Datos para Windows
REM Para uso con Task Scheduler

REM Cambiar al directorio del proyecto
cd /d "%~dp0\.."

REM Ejecutar backup
pnpm backup:compressed

REM Verificar resultado
if %ERRORLEVEL% EQU 0 (
    echo Backup completado exitosamente
    exit /b 0
) else (
    echo Error durante el backup
    exit /b 1
)

