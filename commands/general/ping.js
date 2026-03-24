module.exports = {
    nombre: "ping",
    aliases: ["p"],
    categoria: "General",
    descripcion: "Verifica que el bot está activo",
    uso: "ping",

    ejecutar: async (sock, msg, args, { prefix }) => {
        const inicio = Date.now();

        await sock.sendMessage(msg.key.remoteJid, { text: "🏓 Pong!" });

        const ms = Date.now() - inicio;

        await sock.sendMessage(msg.key.remoteJid, {
            text: `⚡ *${ms}ms*\nPrefijo: *${prefix}*`
        });
    }
};