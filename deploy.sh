#!/bin/bash

echo "🧹 A limpar builds antigos..."

# Apagar .next (build anterior)
if [ -d ".next" ]; then
  rm -rf .next
  echo "✔️ .next apagado"
fi

# Apagar deploy antigo
if [ -d "deploy" ]; then
  rm -rf deploy
  echo "✔️ deploy apagado"
fi

echo "📁 A criar pasta deploy..."
mkdir deploy

echo "🏗️ A fazer build do projeto..."
npm run build

echo "📦 A copiar standalone..."
cp -r .next/standalone/* deploy/

echo "📁 A copiar static files..."
mkdir -p deploy/.next/static
cp -r .next/static/* deploy/.next/static/

echo "📁 A copiar public (se existir)..."
if [ -d "public" ]; then
  cp -r public deploy/
else
  echo "⚠️ Pasta public não existe, a ignorar..."
fi

echo "✅ Deploy preparado com sucesso!"