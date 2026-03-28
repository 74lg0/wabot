const { execFile } = require("child_process");
const path = require("path");
const fs = require("fs");
const https = require("https");

const AUDIO_DIR = path.join(__dirname, "../../src/aud");
const VIDEO_DIR = path.join(__dirname, "../../src/vid");
const SCRIPT    = path.join(__dirname, "../../scripts/playt.py");

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

function runScript(args) {
    return new Promise((resolve, reject) => {
        execFile("python3", [SCRIPT, ...args], (execErr, stdout, stderr) => {
            if (execErr) return reject(new Error(stderr?.trim() || execErr.message));
            try {
                const ultimaLinea = stdout.trim().split("\n").pop();
                resolve(JSON.parse(ultimaLinea));
            } catch {
                reject(new Error(`JSON inválido: ${stdout?.trim()?.slice(0, 200)}`));
            }
        });
    });
}

// Enviar info + thumbnail respondiendo al usuario
async function enviarInfo(sock, jid, msg, meta, tipo, outputDir) {
    const duracionFmt = formatDuration(meta.duration);
    const thumbPath = path.join(outputDir, "_thumb_tmp.jpg");

    try {
        await descargarThumb(meta.thumbnail, thumbPath);
    } catch (thumbErr) {
        console.warn("[PLAY] Thumbnail falló:", thumbErr.message);
    }

    const caption = [
        `Video/Título ~> *${meta.title}*`,
        `Autor ~> *${meta.uploader}*`,
        `Duración ~> *${duracionFmt}*`,
        ``,
        `_Enviando el ${tipo}… Esto puede demorar unos minutos ⌛_`
    ].join("\n");

    if (fs.existsSync(thumbPath)) {
        await sock.sendMessage(jid, {
            image: fs.readFileSync(thumbPath),
            caption
        }, { quoted: msg }).catch(() => {});
        fs.unlink(thumbPath, () => {});
    } else {
        await sock.sendMessage(jid, { text: caption }, { quoted: msg }).catch(() => {});
    }
}

// Enviar archivo respondiendo al usuario
async function enviarArchivo(sock, jid, msg, descarga, tipo, titulo) {
    if (!fs.existsSync(descarga.path)) {
        console.error("[PLAY] Archivo no encontrado:", descarga.path);
        return sock.sendMessage(jid, {
            text: `❌ No se encontró el archivo descargado.`
        }, { quoted: msg }).catch(() => {});
    }

    try {
        if (tipo === "audio") {
            await sock.sendMessage(jid, {
                audio: fs.readFileSync(descarga.path),
                mimetype: "audio/mpeg",
                ptt: false
            }, { quoted: msg });
        } else {
            await sock.sendMessage(jid, {
                video: fs.readFileSync(descarga.path),
                mimetype: "video/mp4",
                caption: `🎬 *${titulo}*`
            }, { quoted: msg });
        }
    } catch (sendErr) {
        console.error("[PLAY] Error al enviar:", sendErr.message);
        await sock.sendMessage(jid, {
            text: `❌ No se pudo enviar el archivo.\n*Motivo:* ${sendErr.message}`
        }, { quoted: msg }).catch(() => {});
    } finally {
        fs.unlink(descarga.path, (err) => {
            if (err) console.warn("[PLAY] No se pudo eliminar:", descarga.path);
        });
    }
}

module.exports = {
    nombre: "play",
    aliases: ["yt"],
    categoria: "Utilidades",
    descripcion: "Descarga audio o video de YouTube",
    uso: "play --audio <canción> | --video <video> | --dlink <url>",

    ejecutar: async (sock, msg, args, { prefix }) => {
        const jid = msg.key.remoteJid;
        const modo = args[0]?.toLowerCase();

        const MODOS_VALIDOS = ["--audio", "--video", "--dlink"];
        if (!MODOS_VALIDOS.includes(modo)) {
            return sock.sendMessage(jid, {
                text: [
                    `Uso:`,
                    `  *${prefix}play --audio <canción>*`,
                    `  *${prefix}play --video <video>*`,
                    `  *${prefix}play --dlink <url de YouTube>*`
                ].join("\n")
            }, { quoted: msg });
        }

        const query = args.slice(1).join(" ");
        if (!query) {
            return sock.sendMessage(jid, {
                text: `❌ Falta el argumento.\nEjemplo: *${prefix}play ${modo} ${modo === "--dlink" ? "https://youtu.be/..." : "Bohemian Rhapsody"}*`
            }, { quoted: msg });
        }

        // ── --dlink: descarga por URL directa como audio ──────────────────
        if (modo === "--dlink") {
            const outputDir = AUDIO_DIR;

            let meta;
            try {
                meta = await runScript(["info-url", query, outputDir]);
            } catch (err) {
                console.error("[PLAY] Error en info-url:", err.message);
                return sock.sendMessage(jid, {
                    text: `❌ No se pudo obtener info del enlace.\n*Detalle:* ${err.message}`
                }, { quoted: msg }).catch(() => {});
            }

            if (!meta.ok) return sock.sendMessage(jid, { text: `❌ ${meta.error}` }, { quoted: msg }).catch(() => {});

            if (meta.blocked_audio) {
                return sock.sendMessage(jid, {
                    text: `🚫 _Acción Bloqueada… ¡El audio debe durar menos de 15:00m_`
                }, { quoted: msg }).catch(() => {});
            }

            await enviarInfo(sock, jid, msg, meta, "audio", outputDir);

            let descarga;
            try {
                descarga = await runScript(["audio", meta.url, outputDir]);
            } catch (err) {
                return sock.sendMessage(jid, {
                    text: `❌ Error al descargar.\n*Detalle:* ${err.message}`
                }, { quoted: msg }).catch(() => {});
            }

            if (!descarga.ok) return sock.sendMessage(jid, { text: `❌ ${descarga.error}` }, { quoted: msg }).catch(() => {});
            await enviarArchivo(sock, jid, msg, descarga, "audio", meta.title);
            return;
        }

        // ── --audio / --video: búsqueda por texto ─────────────────────────
        const tipo      = modo === "--audio" ? "audio" : "video";
        const outputDir = tipo === "audio" ? AUDIO_DIR : VIDEO_DIR;

        let meta;
        try {
            meta = await runScript(["info", query, outputDir]);
        } catch (err) {
            console.error("[PLAY] Error en info:", err.message);
            return sock.sendMessage(jid, {
                text: `❌ No se pudo buscar *${query}*.\n*Detalle:* ${err.message}`
            }, { quoted: msg }).catch(() => {});
        }

        if (!meta.ok) return sock.sendMessage(jid, { text: `❌ ${meta.error}` }, { quoted: msg }).catch(() => {});

        const bloqueado = tipo === "audio" ? meta.blocked_audio : meta.blocked_video;
        const limite    = tipo === "audio" ? "15:00" : "10:00";

        if (bloqueado) {
            return sock.sendMessage(jid, {
                text: `🚫 _Acción Bloqueada… ¡El ${tipo} debe durar menos de ${limite}m_`
            }, { quoted: msg }).catch(() => {});
        }

        await enviarInfo(sock, jid, msg, meta, tipo, outputDir);

        let descarga;
        try {
            descarga = await runScript([tipo, meta.url, outputDir]);
        } catch (err) {
            console.error("[PLAY] Error en descarga:", err.message);
            return sock.sendMessage(jid, {
                text: `❌ Error al descargar.\n*Detalle:* ${err.message}`
            }, { quoted: msg }).catch(() => {});
        }

        if (!descarga.ok) return sock.sendMessage(jid, { text: `❌ ${descarga.error}` }, { quoted: msg }).catch(() => {});
        await enviarArchivo(sock, jid, msg, descarga, tipo, meta.title);
    }
};