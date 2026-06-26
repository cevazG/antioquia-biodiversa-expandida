#!/bin/bash
# Servidor de desarrollo — reemplaza python3 -m http.server
# Elimina el problema de conexiones TCP "stale" que causaban 29s de espera en Safari
cd "$(dirname "$0")"
echo "Servidor iniciado en http://localhost:8080"
npx serve -p 8080 --no-clipboard
