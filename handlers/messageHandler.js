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
    // ── El prefix ahora es dinámico por grupo ─────────────────────────────
    function getPrefix(jid) {
        return config.prefixes?.[jid] || config.defaultPrefix || "?";
    }

    sock.ev.on("messages.upsert", async ({ messages }) => {
        const msg = messages[0];
        if (!msg?.message) return;
        if (!msg.key.remoteJid.endsWith("@g.us")) return;

        const jid = msg.key.remoteJid;
        const prefix = getPrefix(jid);

        const prefixEscapado = prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const regexPrefix = new RegExp(`^${prefixEscapado}`);

        const texto = extraerTexto(msg);
        if (!texto || !regexPrefix.test(texto)) return;

        const cuerpo = texto.slice(prefix.length).trim();
        const partes = cuerpo.split(/ +/);
        const nombreCmd = partes.shift()?.toLowerCase();

        if (!nombreCmd) return;

        const cmd = comandos.get(nombreCmd);
        if (!cmd) return;

        try {
            console.log(`[CMD] ${prefix}${nombreCmd} | Args: ${partes.join(" ")} | JID: ${jid}`);
            await cmd.ejecutar(sock, msg, partes, { prefix, comandos, config });
        } catch (err) {
            console.error(`[ERROR] Comando "${nombreCmd}":`, err);
            await sock.sendMessage(jid, {
                text: `❌ Error al ejecutar *${nombreCmd}*`
            }).catch(() => {});
        }
    });
}

module.exports = { manejarMensajes };