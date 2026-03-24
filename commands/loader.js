const fs = require("fs");
const path = require("path");

/**
 * Carga dinámicamente todos los archivos .js dentro de /commands/
 * y sus subcarpetas. Retorna un Map: nombreComando -> módulo
 */
function cargarComandos() {
    const comandos = new Map();
    const carpetaBase = __dirname;

    function leerRecursivo(directorio) {
        const entradas = fs.readdirSync(directorio, { withFileTypes: true });

        for (const entrada of entradas) {
            const rutaCompleta = path.join(directorio, entrada.name);

            if (entrada.isDirectory()) {
                leerRecursivo(rutaCompleta); // baja a subcarpetas
            } else if (
                entrada.isFile() &&
                entrada.name.endsWith(".js") &&
                entrada.name !== "loader.js" // excluirse a sí mismo
            ) {
                try {
                    const cmd = require(rutaCompleta);

                    // Validar que el módulo tenga la forma correcta
                    if (!cmd.nombre || typeof cmd.ejecutar !== "function") {
                        console.warn(`⚠️  Comando ignorado (estructura inválida): ${rutaCompleta}`);
                        continue;
                    }

                    comandos.set(cmd.nombre.toLowerCase(), cmd);

                    // Registrar aliases si existen
                    if (Array.isArray(cmd.aliases)) {
                        for (const alias of cmd.aliases) {
                            comandos.set(alias.toLowerCase(), cmd);
                        }
                    }

                    console.log(`✅ Comando cargado: ${cmd.nombre}`);
                } catch (err) {
                    console.error(`❌ Error al cargar ${rutaCompleta}:`, err.message);
                }
            }
        }
    }

    leerRecursivo(carpetaBase);
    return comandos;
}

module.exports = { cargarComandos };