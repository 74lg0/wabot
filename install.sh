#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────
#  Colores
# ─────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info()  { echo -e "${CYAN}[i]${NC} $1"; }

# ─────────────────────────────────────────
#  Detectar entorno
# ─────────────────────────────────────────
detect_env() {
  if [[ -d /data/data/com.termux ]] || command -v termux-info &>/dev/null; then
    echo "termux"
  else
    echo "linux"
  fi
}

# ─────────────────────────────────────────
#  Banner
# ─────────────────────────────────────────
select_env() {
  local auto
  auto=$(detect_env)

  clear
  echo -e "${BOLD}${CYAN}"
  echo "  ╔══════════════════════════════╗"
  echo "  ║       Instalador del Bot     ║"
  echo "  ╚══════════════════════════════╝"
  echo -e "${NC}"
  echo -e "  ${CYAN}Auto-detectado:${NC} ${BOLD}${auto}${NC}"
  echo ""
  echo -e "  ${BOLD}1.${NC} Linux  (apt / dnf / pacman)"
  echo -e "  ${BOLD}2.${NC} Termux (pkg)"
  echo -e "  ${BOLD}3.${NC} Auto   [usar detección: ${auto}]"
  echo ""
  read -rp "  Selecciona [1/2/3] (default: 3): " choice

  case "${choice:-3}" in
    1) ENV="linux"  ;;
    2) ENV="termux" ;;
    3) ENV="$auto"  ;;
    *) warn "Opción inválida, usando auto-detección"; ENV="$auto" ;;
  esac

  log "Entorno seleccionado: ${BOLD}${ENV}${NC}"
}

# ─────────────────────────────────────────
#  Instalar Node.js
# ─────────────────────────────────────────
install_node() {
  if command -v node &>/dev/null; then
    log "Node.js ya instalado: $(node -v)"
    return
  fi

  info "Instalando Node.js..."

  if [[ "$ENV" == "termux" ]]; then
    pkg update -y && pkg install -y nodejs
  else
    if command -v apt &>/dev/null; then
      sudo apt update -qq && sudo apt install -y nodejs npm
    elif command -v dnf &>/dev/null; then
      sudo dnf install -y nodejs npm
    elif command -v pacman &>/dev/null; then
      sudo pacman -Sy --noconfirm nodejs npm
    elif command -v brew &>/dev/null; then
      brew install node
    else
      error "No se encontró gestor de paquetes compatible."
    fi
  fi

  log "Node.js instalado: $(node -v)"
}

# ─────────────────────────────────────────
#  Instalar dependencias
# ─────────────────────────────────────────
install_deps() {
  [[ -f package.json ]] || error "No se encontró package.json"
  info "Instalando dependencias npm..."
  npm install --omit=dev 2>&1 | tail -3
  log "Dependencias listas"
}

# ─────────────────────────────────────────
#  Verificar archivos y permisos
# ─────────────────────────────────────────
check_files() {
  for f in "login.js" "start.sh"; do
    [[ -f "$f" ]] || error "Archivo requerido no encontrado: $f"
  done
  chmod +x start.sh
  log "Permisos configurados"
}

# ─────────────────────────────────────────
#  Main
# ─────────────────────────────────────────
main() {
  select_env
  install_node
  install_deps
  check_files

  echo ""
  log "¡Instalación completa!"
  echo ""
  read -rp "  ¿Iniciar el bot ahora? [s/N]: " launch
  if [[ "${launch,,}" == "s" ]]; then
    node login.js && ./start.sh
  else
    warn "Ejecuta manualmente: node login.js && ./start.sh"
  fi

  rm -f -- "$0"
}

main