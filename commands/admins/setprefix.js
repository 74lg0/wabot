const fs = require("fs");
const path = require("path");

module.exports = {
    nombre: "setprefix",
    aliases: ["prefix", "changeprefix"],
    categoria: "Admin",
    descripcion: "Cambia el prefijo del bot",
    uso: "setprefix <nuevo_prefijo>",

    ejecutar: async (sock, msg, args, { prefix, config }) => {
        const jid = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const ownerJid = config.ownerNumber + "@s.whatsapp.net";

        // ── Verificar permisos: owner o admin del grupo ───────────────────
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

        // ── Guardar en config.json ────────────────────────────────────────
        const CONFIG_PATH = path.join(__dirname, "../../config.json");
        config.prefix = nuevoPrefix;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 4));

        await sock.sendMessage(jid, {
            text: `✅ Prefijo cambiado: *${prefix}* → *${nuevoPrefix}*\n\nReinicia el bot para aplicar el cambio.\n*${nuevoPrefix}reset*`
        });
    }
};