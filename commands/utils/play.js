const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const https = require("https");

const AUDIO_DIR = path.join(__dirname, "../../src/aud");
const VIDEO_DIR = path.join(__dirname, "../../src/vid");
const SCRIPT    = path.join(__dirname, "../../scripts/playt.py");

// Descarga thumbnail a un archivo temporal
function descargarThumb(url, destino) {
    return new Promise((res, rej) => {
        const file = fs.createWriteStream(destino);
        https.get(url, (response) => {
            response.pipe(file);
            file.on("finish", () => file.close(res));
        }).on("error", rej);
    });
}

function formatDuration(seconds) {
    const m = Math.floor(seconds / 60);
    const s = String(seconds % 60).padStart(2, "0");
    return `${m}:${s}`;
}

module.exports = {
    nombre: "play",
    aliases: ["yt"],
    categoria: "Utilidades",
    descripcion: "Descarga audio o video de YouTube",
    uso: "play --audio <canción> | play --video <canción>",

    ejecutar: async (sock, msg, args, { prefix }) => {
        const jid = msg.key.remoteJid;

        const modo = args[0]?.toLowerCase();
        if (modo !== "--audio" && modo !== "--video") {
            return sock.sendMessage(jid, {
                text: `Uso:\n  *${prefix}play --audio <canción>*\n  *${prefix}play --video <video>*`
            });
        }

        const query = args.slice(1).join(" ");
        if (!query) {
            return sock.sendMessage(jid, {
                text: `❌ Escribe el nombre de la canción o video.\nEjemplo: *${prefix}play --audio Bohemian Rhapsody*`
            });
        }

        const tipo      = modo === "--audio" ? "audio" : "video";
        const outputDir = tipo === "audio" ? AUDIO_DIR : VIDEO_DIR;

        await sock.sendMessage(jid, {
            text: `🔍 Buscando *${query}*...`
        });

        execFile("python3", [SCRIPT, tipo, query, outputDir], async (execErr, stdout, stderr) => {

            // ── Error de ejecución del proceso ────────────────────────────
            if (execErr) {
                console.error("[PLAY] execFile error:", execErr.message);
                console.error("[PLAY] stderr:", stderr);
                return sock.sendMessage(jid, {
                    text: `❌ Error al ejecutar el script.\n\n*Detalle:* ${stderr?.trim() || execErr.message}`
                }).catch(() => {});
            }

            // ── Parsear JSON del script ───────────────────────────────────
            let resultado;
            try {
                resultado = JSON.parse(stdout.trim());
            } catch (parseErr) {
                console.error("[PLAY] JSON parse error:", parseErr.message);
                console.error("[PLAY] stdout raw:", stdout);
                return sock.sendMessage(jid, {
                    text: `❌ Respuesta inesperada del script.\n\n*Raw:* ${stdout?.trim()?.slice(0, 300)}`
                }).catch(() => {});
            }

            // ── Duración bloqueada ────────────────────────────────────────
            if (resultado.blocked) {
                const limite = tipo === "audio" ? "15:00m" : "10:00m";
                return sock.sendMessage(jid, {
                    text: `🚫 _Acción Bloqueada… ¡El ${tipo} debe durar menos de ${limite}_`
                }).catch(() => {});
            }

            // ── Error devuelto por el script ──────────────────────────────
            if (!resultado.ok) {
                console.error("[PLAY] Script error:", resultado.error);
                return sock.sendMessage(jid, {
                    text: `❌ ${resultado.error}`
                }).catch(() => {});
            }

            const { path: filePath, title, uploader, duration, thumbnail, size } = resultado;
            const duracionFmt = formatDuration(duration);

            // ── Descargar thumbnail ───────────────────────────────────────
            const thumbPath = path.join(outputDir, "_thumb_tmp.jpg");
            try {
                await descargarThumb(thumbnail, thumbPath);
            } catch (thumbErr) {
                console.warn("[PLAY] Thumbnail falló:", thumbErr.message);
            }

            const caption = [
                `Video/Título ~> *${title}*`,
                `Autor ~> *${uploader}*`,
                `Duración ~> *${duracionFmt}*`,
                `Peso ~> *${size}*`,
                ``,
                `_Enviando el ${tipo}… Esto puede demorar unos minutos ⌛_`
            ].join("\n");

            // ── Enviar thumbnail + info ───────────────────────────────────
            if (fs.existsSync(thumbPath)) {
                await sock.sendMessage(jid, {
                    image: fs.readFileSync(thumbPath),
                    caption
                }).catch(() => {});
                fs.unlink(thumbPath, () => {});
            } else {
                await sock.sendMessage(jid, { text: caption }).catch(() => {});
            }

            // ── Verificar archivo descargado ──────────────────────────────
            if (!fs.existsSync(filePath)) {
                console.error("[PLAY] Archivo no encontrado:", filePath);
                return sock.sendMessage(jid, {
                    text: `❌ No se encontró el archivo descargado.\n*Ruta esperada:* ${filePath}`
                }).catch(() => {});
            }

            // ── Enviar archivo ────────────────────────────────────────────
            try {
                if (tipo === "audio") {
                    await sock.sendMessage(jid, {
                        audio: fs.readFileSync(filePath),
                        mimetype: "audio/mpeg",
                        ptt: false
                    });
                } else {
                    await sock.sendMessage(jid, {
                        video: fs.readFileSync(filePath),
                        mimetype: "video/mp4",
                        caption: `🎬 *${title}*`
                    });
                }
            } catch (sendErr) {
                console.error("[PLAY] Error al enviar archivo:", sendErr.message);
                await sock.sendMessage(jid, {
                    text: `❌ No se pudo enviar el archivo.\n*Motivo:* ${sendErr.message}`
                }).catch(() => {});
            } finally {
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) console.warn("[PLAY] No se pudo eliminar:", filePath);
                });
            }
        });
    }
};
