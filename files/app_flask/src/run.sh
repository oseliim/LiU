#!/bin/bash
set -e

RUN_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTORUN_DIR="$(cd "$RUN_DIR/../../../" && pwd)"

# Caminho do venv criado pelo autorun.sh
VENV_PATH="$AUTORUN_DIR/.venv"
PYTHON_VENV="$VENV_PATH/bin/python"

if [ ! -x "$PYTHON_VENV" ]; then
    echo "[ERRO] Ambiente virtual não encontrado em $VENV_PATH"
    exit 1
fi

echo "[INFO] Iniciando aplicação Flask com $PYTHON_VENV ..."
sudo "$PYTHON_VENV" "$RUN_DIR/main.py"