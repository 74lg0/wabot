const fs = require("fs");
const path = require("path");

const CONFIG_PATH = path.join(__dirname, "../../config.json");

module.exports = {
    nombre: "setprefix",
    aliases: ["prefix", "changeprefix"],
    categoria: "Admin",
    descripcion: "Cambia el prefijo del bot en este grupo",
    uso: "setprefix <nuevo_prefijo>",

    ejecutar: async (sock, msg, args, { prefix, config }) => {
        const jid = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const ownerJid = config.ownerNumber + "@s.whatsapp.net";

        // ── Verificar permisos ────────────────────────────────────────────
        const esOwner = senderJid === ownerJid || msg.key.fromMe;
        let esAdmin = false;

        if (!esOwner) {
            try {
                const metadata = await sock.groupMetadata(jid);
                const participante = metadata.participants.find(p => p.id === senderJid);
                esAdmin = participante?.admin === "admin" || participante?.admin === "superadmin";
            } catch {
                esAdmin = false;
            }
        }

        if (!esOwner && !esAdmin) {
            return sock.sendMessage(jid, {
                text: "❌ Solo el owner o admins del grupo pueden cambiar el prefijo."
            });
        }

        // ── Validar argumento ─────────────────────────────────────────────
        const nuevoPrefix = args[0];

        if (!nuevoPrefix) {
            return sock.sendMessage(jid, {
                text: `Uso: *${prefix}setprefix <nuevo_prefijo>*\nEjemplo: *${prefix}setprefix !*`
            });
        }

        if (nuevoPrefix.length > 3) {
            return sock.sendMessage(jid, {
                text: "❌ El prefijo no puede tener más de 3 caracteres."
            });
        }

        if (nuevoPrefix === prefix) {
            return sock.sendMessage(jid, {
                text: `❌ El prefijo ya es *${prefix}*`
            });
        }

        // ── Guardar prefix por grupo ──────────────────────────────────────
        if (!config.prefixes) config.prefixes = {};
        config.prefixes[jid] = nuevoPrefix;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4));

        // ── Aviso + reinicio ──────────────────────────────────────────────
        await sock.sendMessage(jid, {
            text: `⚠️ *¡Se ha cambiado el prefijo del bot de ${prefix} a ${nuevoPrefix}!* ⚠️\n_Reiniciando Bot… Esto puede demorar unos segundos_`
        });

        setTimeout(() => process.exit(0), 1500);
    }
};