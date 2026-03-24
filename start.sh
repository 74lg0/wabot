#!/bin/bash

# ============================================
# Panel de Control - 74lg0 WaBot
# ============================================

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
RESET='\033[0m'

# Configuración
BOT_NAME="74lg0-WaBot"
SCRIPT_PATH="index.js"

# Función para limpiar pantalla
clear_screen() {
    clear
}

# Función para mostrar banner
show_banner() {
    echo -e "${GREEN}"
    cat << 'EOF'
[~~~~d88P     d8   888       /   ,88~~\     Y88b         /           888~~\             d8
    d88P     d88   888 e88~88e  d888   \     Y88b       /    /~~~8e  888   |  e88~-_  _d88__
   d88P     d888   888 888 888 88888    |     Y88b  e  /         88b 888 _/  d888   i  888
  d88P     / 888   888 "88_88" 88888    |      Y88bd8b/     e88~-888 888  \  8888   |  888
 d88P     /__888__ 888  /       Y888   /        Y88Y8Y     C888  888 888   | Y888   '  888
d88P         888   888 Cb        `88__/          Y  Y       "88_-888 888__/   "88_-~   "88_/
                         Y8""8D
EOF
    echo -e "${CYAN}                             Developed by: 74lg0"
    echo -e "                            Copyright 74lg0, 2026${RESET}"
    echo ""
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo ""
}

# Función para mostrar estado
show_status_summary() {
    if pm2 status "$BOT_NAME" 2>/dev/null | grep -q "online"; then
        echo -e "${GREEN}● Bot ONLINE${RESET} | $(pm2 show "$BOT_NAME" | grep "uptime" | awk -F': ' '{print $2}')"
    elif pm2 status "$BOT_NAME" 2>/dev/null | grep -q "stopped"; then
        echo -e "${RED}● Bot DETENIDO${RESET}"
    elif pm2 status "$BOT_NAME" 2>/dev/null | grep -q "errored"; then
        echo -e "${RED}● Bot ERROR${RESET}"
    else
        echo -e "${YELLOW}● Bot NO REGISTRADO${RESET}"
    fi
}

# Función para mostrar menú
show_menu() {
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo -e "  $(show_status_summary)"
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo ""
    echo -e "${YELLOW}  [1]${RESET} ▶  Iniciar bot"
    echo -e "${YELLOW}  [2]${RESET} ■  Detener bot"
    echo -e "${YELLOW}  [3]${RESET} ↻  Reiniciar bot"
    echo -e "${YELLOW}  [4]${RESET} 📋 Ver logs"
    echo -e "${YELLOW}  [5]${RESET} 📊 Estado detallado"
    echo -e "${YELLOW}  [6]${RESET} 🗑  Eliminar bot de pm2"
    echo -e "${YELLOW}  [7]${RESET} 🔄 Monitoreo en tiempo real (htop)"
    echo -e "${YELLOW}  [8]${RESET} 📜 Ver logs de pm2 (últimas 50 líneas)"
    echo -e "${YELLOW}  [0]${RESET} 🚪 Salir del panel"
    echo ""
    echo -e "${WHITE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo ""
}

# Función para iniciar bot
start_bot() {
    if pm2 list | grep -q "$BOT_NAME"; then
        echo -e "${YELLOW}⚠️  El bot ya está registrado. Intentando iniciar...${RESET}"
        pm2 start "$BOT_NAME"
    else
        echo -e "${GREEN}▸ Registrando e iniciando bot...${RESET}"
        pm2 start "$SCRIPT_PATH" --name "$BOT_NAME"
        pm2 save
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Bot iniciado correctamente${RESET}"
    else
        echo -e "${RED}❌ Error al iniciar el bot${RESET}"
    fi
}

# Función para detener bot
stop_bot() {
    echo -e "${RED}▸ Deteniendo bot...${RESET}"
    pm2 stop "$BOT_NAME"
    echo -e "${GREEN}✅ Bot detenido${RESET}"
}

# Función para reiniciar bot
restart_bot() {
    echo -e "${YELLOW}▸ Reiniciando bot...${RESET}"
    pm2 restart "$BOT_NAME"
    echo -e "${GREEN}✅ Bot reiniciado${RESET}"
}

# Función para mostrar logs en vivo
show_logs() {
    echo -e "${CYAN}▸ Mostrando logs en vivo... (Ctrl+C para volver al menú)${RESET}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    pm2 logs "$BOT_NAME" --lines 20
}

# Función para mostrar estado detallado
show_status() {
    echo -e "${CYAN}▸ Estado detallado del bot:${RESET}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    pm2 status "$BOT_NAME"
    echo ""
    echo -e "${CYAN}▸ Información adicional:${RESET}"
    pm2 show "$BOT_NAME" 2>/dev/null || echo -e "${RED}Bot no registrado${RESET}"
}

# Función para eliminar bot
delete_bot() {
    echo -e "${RED}⚠️  ¿Estás seguro de eliminar el bot de pm2? (y/N)${RESET}"
    read -r confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        pm2 delete "$BOT_NAME"
        pm2 save
        echo -e "${GREEN}✅ Bot eliminado de pm2${RESET}"
    else
        echo -e "${YELLOW}❌ Operación cancelada${RESET}"
    fi
}

# Función para monitoreo en tiempo real
monitor_system() {
    echo -e "${CYAN}▸ Monitoreo en tiempo real... (Ctrl+C para volver)${RESET}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    if command -v htop &> /dev/null; then
        htop
    else
        top
    fi
}

# Función para mostrar últimas líneas de logs
show_last_logs() {
    echo -e "${CYAN}▸ Últimas 50 líneas de logs:${RESET}"
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    pm2 logs "$BOT_NAME" --lines 50 --nostream
}

# Verificar si pm2 está instalado
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ pm2 no encontrado. Instálalo con: npm install -g pm2${RESET}"
    exit 1
fi

# Verificar si el archivo del bot existe
if [ ! -f "$SCRIPT_PATH" ]; then
    echo -e "${RED}❌ Archivo $SCRIPT_PATH no encontrado. Verifica la ruta.${RESET}"
    exit 1
fi

# Bucle principal del daemon
while true; do
    clear_screen
    show_banner
    show_menu
    
    read -p "$(echo -e ${CYAN}"  └─\$ Selecciona una opción > "${RESET})" opcion
    
    echo ""
    
    case $opcion in
        1)
            start_bot
            ;;
        2)
            if pm2 list | grep -q "$BOT_NAME"; then
                stop_bot
            else
                echo -e "${RED}❌ El bot no está registrado. Usa la opción 1 para iniciarlo.${RESET}"
            fi
            ;;
        3)
            if pm2 list | grep -q "$BOT_NAME"; then
                restart_bot
            else
                echo -e "${RED}❌ El bot no está registrado. Usa la opción 1 para iniciarlo.${RESET}"
            fi
            ;;
        4)
            if pm2 list | grep -q "$BOT_NAME"; then
                show_logs
                echo -e "\n${YELLOW}Presiona Enter para volver al menú...${RESET}"
                read -r
            else
                echo -e "${RED}❌ El bot no está registrado. Usa la opción 1 para iniciarlo.${RESET}"
                echo -e "\n${YELLOW}Presiona Enter para continuar...${RESET}"
                read -r
            fi
            ;;
        5)
            show_status
            echo -e "\n${YELLOW}Presiona Enter para volver al menú...${RESET}"
            read -r
            ;;
        6)
            if pm2 list | grep -q "$BOT_NAME"; then
                delete_bot
            else
                echo -e "${RED}❌ El bot no está registrado.${RESET}"
            fi
            echo -e "\n${YELLOW}Presiona Enter para continuar...${RESET}"
            read -r
            ;;
        7)
            monitor_system
            ;;
        8)
            if pm2 list | grep -q "$BOT_NAME"; then
                show_last_logs
                echo -e "\n${YELLOW}Presiona Enter para volver al menú...${RESET}"
                read -r
            else
                echo -e "${RED}❌ El bot no está registrado. Usa la opción 1 para iniciarlo.${RESET}"
                echo -e "\n${YELLOW}Presiona Enter para continuar...${RESET}"
                read -r
            fi
            ;;
        0)
            echo -e "${WHITE}▸ Saliendo del panel de control...${RESET}"
            echo -e "${GREEN}✅ El bot sigue ejecutándose en segundo plano con pm2${RESET}"
            echo -e "${YELLOW}💡 Para volver a entrar: ./$(basename "$0")${RESET}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Opción inválida. Por favor, selecciona 0-8.${RESET}"
            echo -e "\n${YELLOW}Presiona Enter para continuar...${RESET}"
            read -r
            ;;
    esac
done