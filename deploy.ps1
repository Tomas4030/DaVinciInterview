$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

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
$previousNodeEnv = $env:NODE_ENV
$previousBasePath = $env:NEXT_PUBLIC_BASE_PATH

try {
  $env:NODE_ENV = "production"
  # Para deploy na raiz do dominio, nao forcar basePath.
  # Se existir NEXT_PUBLIC_BASE_PATH no ambiente, o build usa esse valor.
  if ([string]::IsNullOrWhiteSpace($env:NEXT_PUBLIC_BASE_PATH)) {
    Remove-Item Env:NEXT_PUBLIC_BASE_PATH -ErrorAction SilentlyContinue
  }

  npm run build
}
finally {
  if ([string]::IsNullOrEmpty($previousNodeEnv)) {
    Remove-Item Env:NODE_ENV -ErrorAction SilentlyContinue
  }
  else {
    $env:NODE_ENV = $previousNodeEnv
  }

  if ([string]::IsNullOrEmpty($previousBasePath)) {
    Remove-Item Env:NEXT_PUBLIC_BASE_PATH -ErrorAction SilentlyContinue
  }
  else {
    $env:NEXT_PUBLIC_BASE_PATH = $previousBasePath
  }
}

if (-not (Test-Path ".next/standalone")) {
  throw "[deploy] ERRO: .next/standalone nao foi gerado"
}

Write-Host "[deploy] Copiar standalone..."
Get-ChildItem ".next/standalone" -Force | ForEach-Object {
  Copy-Item $_.FullName "deploy" -Recurse -Force
}

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
