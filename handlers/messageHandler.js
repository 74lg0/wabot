/**
 * Extrae texto plano del mensaje independientemente del tipo.
 */
function extraerTexto(msg) {
    const m = msg.message;
    return (
        m?.conversation ||
        m?.extendedTextMessage?.text ||
        m?.imageMessage?.caption ||
        m?.videoMessage?.caption ||
        ""
    ).trim();
}

/**
 * Registra el listener de mensajes en el socket.
 */
function manejarMensajes(sock, comandos, config) {
    const prefix = config.prefix || "?";
    const prefixEscapado = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regexPrefix = new RegExp(`^${prefixEscapado}`);
    // const ownerJid = config.ownerNumber + "@s.whatsapp.net";

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg?.message) return;

        // Ignorar mensajes del bot, pero permitir al owner
        // (Descomenta si el bot y tu número son distintos)
        // const senderJid = msg.key.participant || msg.key.remoteJid;
        // if (msg.key.fromMe && senderJid !== ownerJid) return;

        // Filtro de contexto: solo grupos (elimina la condición para privados también)
        if (!msg.key.remoteJid.endsWith("@g.us")) return;

        const texto = extraerTexto(msg);
        if (!texto || !regexPrefix.test(texto)) return;

        const cuerpo = texto.slice(prefix.length).trim();
        const partes = cuerpo.split(/ +/);
        const nombreCmd = partes.shift()?.toLowerCase();

        if (!nombreCmd) return;

        const cmd = comandos.get(nombreCmd);
        if (!cmd) return;

        try {
            console.log(`[CMD] ${prefix}${nombreCmd} | Args: ${partes.join(" ")} | JID: ${msg.key.remoteJid}`);
            await cmd.ejecutar(sock, msg, partes, { prefix, comandos, config });
        } catch (err) {
            console.error(`[ERROR] Comando "${nombreCmd}":`, err);
            await sock.sendMessage(msg.key.remoteJid, {
                text: `❌ Error al ejecutar *${nombreCmd}*`
            }).catch(() => {});
        }
    });
}

module.exports = { manejarMensajes };