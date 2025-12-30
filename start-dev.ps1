# Script para iniciar el servidor de desarrollo correctamente
Write-Host "🧹 Limpiando procesos node antiguos..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host "🔧 Iniciando servidor de desarrollo..." -ForegroundColor Cyan
npm run dev
