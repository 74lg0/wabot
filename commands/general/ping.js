module.exports = {
    nombre: "ping",
    aliases: ["p"],
    categoria: "General",
    descripcion: "Verifica que el bot está activo",
    uso: "ping",

    ejecutar: async (sock, msg, args, { prefix }) => {
        const inicio = Date.now();
        await sock.sendMessage(msg.key.remoteJid, {
            text: `🏓 Pong! *${Date.now() - inicio}ms*\nPrefijo: *${prefix}*`
        });
    }
};