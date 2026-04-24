$ErrorActionPreference = "Stop"

Write-Host "[deploy] Limpar builds antigos..."

if (Test-Path ".next") {
    Remove-Item ".next" -Recurse -Force
    Write-Host "[deploy] .next apagado"
}

if (Test-Path ".next-dev") {
    Remove-Item ".next-dev" -Recurse -Force
    Write-Host "[deploy] .next-dev apagado"
}

if (Test-Path "deploy") {
    Remove-Item "deploy" -Recurse -Force
    Write-Host "[deploy] deploy antigo apagado"
}

Write-Host "[deploy] Criar pasta deploy..."
New-Item -ItemType Directory -Path "deploy" | Out-Null

Write-Host "[deploy] Build production (standalone)..."
$env:NEXT_PUBLIC_BASE_PATH = "/tomas"
$env:NODE_ENV = "production"

npm run build

if (-not (Test-Path ".next/standalone")) {
    Write-Host "[deploy] ERRO: .next/standalone nao foi gerado"
    exit 1
}

Write-Host "[deploy] Copiar standalone..."
Copy-Item ".next/standalone/*" "deploy/" -Recurse -Force

if (Test-Path ".next/static") {
    Write-Host "[deploy] Copiar static files..."
    New-Item -ItemType Directory -Path "deploy/.next/static" -Force | Out-Null
    Copy-Item ".next/static/*" "deploy/.next/static/" -Recurse -Force
}

if (Test-Path "public") {
    Write-Host "[deploy] Copiar public..."
    Copy-Item "public" "deploy/" -Recurse -Force
}

Write-Host "[deploy] Criar app.js para cPanel..."
Copy-Item "deploy/server.js" "deploy/app.js" -Force

Write-Host "[deploy] OK: deploy pronto em ./deploy"