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

        execFile("python3", [SCRIPT, tipo, query, outputDir], async (error, stdout, stderr) => {
            if (error) {
                return sock.sendMessage(jid, {
                    text: `❌ Error al ejecutar el script.\n${stderr || error.message}`
                }).catch(() => {});
            }

            let resultado;
            try {
                resultado = JSON.parse(stdout.trim());
            } catch {
                return sock.sendMessage(jid, {
                    text: `❌ Respuesta inválida del script.`
                }).catch(() => {});
            }

            // Duración bloqueada
            if (resultado.blocked) {
                const limite = tipo === "audio" ? "15:00m" : "10:00m";
                return sock.sendMessage(jid, {
                    text: `🚫 _Acción Bloqueada… ¡El ${tipo} debe durar menos de ${limite}_`
                }).catch(() => {});
            }

            if (!resultado.ok) {
                return sock.sendMessage(jid, {
                    text: `❌ ${resultado.error}`
                }).catch(() => {});
            }

            const { path: filePath, title, uploader, duration, thumbnail, size } = resultado;
            const duracionFmt = formatDuration(duration);

            // Descargar thumbnail temporalmente
            const thumbPath = path.join(outputDir, "_thumb_tmp.jpg");
            try {
                await descargarThumb(thumbnail, thumbPath);
            } catch {
                // Si falla el thumb no bloqueamos el envío
            }

            const caption = [
                `Video/Título ~> *${title}*`,
                `Autor ~> *${uploader}*`,
                `Duración ~> *${duracionFmt}*`,
                `Peso ~> *${size}*`,
                ``,
                `_Enviando el ${tipo}… Esto puede demorar unos minutos ⌛_`
            ].join("\n");

            // Enviar thumbnail con info
            if (fs.existsSync(thumbPath)) {
                await sock.sendMessage(jid, {
                    image: fs.readFileSync(thumbPath),
                    caption
                }).catch(() => {});
                fs.unlink(thumbPath, () => {});
            } else {
                await sock.sendMessage(jid, { text: caption }).catch(() => {});
            }

            // Enviar archivo
            if (!fs.existsSync(filePath)) {
                return sock.sendMessage(jid, {
                    text: `❌ No se encontró el archivo descargado.`
                }).catch(() => {});
            }

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
                console.error("[PLAY] Error al enviar:", sendErr.message);
                await sock.sendMessage(jid, {
                    text: `❌ No se pudo enviar el archivo. Puede ser muy pesado.`
                }).catch(() => {});
            } finally {
                fs.unlink(filePath, () => {});
            }
        });
    }
};
