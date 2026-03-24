module.exports = {
    nombre: "reset",
    aliases: ["restart", "hard-reset", "reinicio", "start-full"],
    categoria: "Admin",
    descripcion: "Reinicia el bot",
    uso: "reset",

    ejecutar: async (sock, msg, args, { config }) => {
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const ownerJid = config.ownerNumber + "@s.whatsapp.net";

        // Solo el owner o el propio bot pueden resetear
        const esOwner = senderJid === ownerJid;
        const esBot = msg.key.fromMe;

        if (!esOwner && !esBot) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: "❌ No tienes permiso para ejecutar este comando."
            });
        }

        await sock.sendMessage(msg.key.remoteJid, {
            text: "♻️ Reiniciando bot...\n *Esto puede demorar unos segundos*\n\n> By 74lg0"
        });

        setTimeout(() => process.exit(0), 1000);
    }
};