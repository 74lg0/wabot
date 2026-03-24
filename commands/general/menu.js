const path = require("path");
const fs = require("fs");

module.exports = {
    nombre: "menu",
    aliases: ["help", "ayuda"],
    categoria: "General",
    descripcion: "Muestra todos los comandos disponibles",
    uso: "menu",

    ejecutar: async (sock, msg, args, { prefix, comandos, config }) => {

        // ── Deduplicar y agrupar por categoría ────────────────────────────
        const unicos = new Set(comandos.values());
        const categorias = new Map();

        for (const cmd of unicos) {
            const cat = cmd.categoria || "Sin categoría";
            if (!categorias.has(cat)) categorias.set(cat, []);
            categorias.get(cat).push(cmd);
        }

        // ── Construir secciones dinámicamente ─────────────────────────────
        const DIV = `-----------------------------------`;
        let secciones = "";

        for (const [cat, cmds] of categorias) {
            secciones += `${DIV}\n`;
            secciones += `◈ ${cat.toUpperCase()}\n`;
            secciones += `${DIV}\n`;
            for (const cmd of cmds) {
                const nombre = `${prefix}${cmd.nombre}`.padEnd(8);
                secciones += `▸ ${nombre} ⟶  ${cmd.descripcion}\n`;
            }
        }

        // ── Armar mensaje final ───────────────────────────────────────────
        const totalCmds = unicos.size;
        const totalCats = categorias.size;

        const menu = [
            `┌──(z4lg0㉿kali)-[~/${config.botName}]`,
            `└─$ run --menu`,
            `[ SYSTEM MENU ]`,
            ` ═════════════════`,
            `⚠️ [PREFIX]  ${prefix}`,
            `🟢 [STATUS]  ONLINE`,
            ` ═══════════════════`,
            `[CMDS] ${totalCmds} loaded 💾`,
            `[CATS] ${totalCats} modules 🗂️`,
            secciones.trimEnd(),
            `\n~ use *${prefix}<command>* to execute.`
        ].join("\n");

        // ── Enviar imagen + caption ───────────────────────────────────────
        const imgPath = path.join(__dirname, "../../src/images/menu_lain.png");

        await sock.sendMessage(msg.key.remoteJid, {
            image: fs.readFileSync(imgPath),
            caption: menu
        });
    }
};