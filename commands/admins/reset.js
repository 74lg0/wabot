module.exports = {
    nombre: "reset",
    aliases: ["restart", "hard-reset", "reinicio", "start-full"],
    categoria: "Admin",
    descripcion: "Reinicia el bot",
    uso: "reset",

    ejecutar: async (sock, msg, args, { config }) => {
        const jid = msg.key.remoteJid;
        const senderJid = msg.key.participant || msg.key.remoteJid;
        const ownerJid = config.ownerNumber + "@s.whatsapp.net";

        const esOwner = senderJid === ownerJid;
        const esBot = msg.key.fromMe;

        let esAdmin = false;
        if (!esOwner && !esBot) {
            try {
                const metadata = await sock.groupMetadata(jid);
                const participante = metadata.participants.find(p => p.id === senderJid);
                esAdmin = participante?.admin === "admin" || participante?.admin === "superadmin";
            } catch {
                esAdmin = false;
            }
        }

        if (!esOwner && !esBot && !esAdmin) {
            return sock.sendMessage(jid, {
                text: "❌ No tienes permiso para ejecutar este comando."
            });
        }

        await sock.sendMessage(jid, {
            text: "♻️ Reiniciando bot...\n *Esto puede demorar unos segundos*\n\n> By 74lg0"
        });

        setTimeout(() => process.exit(0), 1000);
    }
};