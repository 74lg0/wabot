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

        // ── PASO 1: obtener info sin descargar ────────────────────────────
        let meta;
        try {
            meta = await runScript(["info", query, outputDir]);
        } catch (err) {
            console.error("[PLAY] Error en info:", err.message);
            return sock.sendMessage(jid, {
                text: `❌ No se pudo buscar *${query}*.\n*Detalle:* ${err.message}`
            }).catch(() => {});
        }

        if (!meta.ok) {
            return sock.sendMessage(jid, { text: `❌ ${meta.error}` }).catch(() => {});
        }

        // ── Validar duración ──────────────────────────────────────────────
        const bloqueado = tipo === "audio" ? meta.blocked_audio : meta.blocked_video;
        const limite    = tipo === "audio" ? "15:00" : "10:00";

        if (bloqueado) {
            return sock.sendMessage(jid, {
                text: `🚫 _Acción Bloqueada… ¡El ${tipo} debe durar menos de ${limite}m_`
            }).catch(() => {});
        }

        const duracionFmt = formatDuration(meta.duration);

        // ── PASO 2: descargar thumbnail y mandar info AL TIRO ─────────────
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
            }).catch(() => {});
            fs.unlink(thumbPath, () => {});
        } else {
            await sock.sendMessage(jid, { text: caption }).catch(() => {});
        }

        // ── PASO 3: descargar archivo ─────────────────────────────────────
        let descarga;
        try {
            descarga = await runScript([tipo, meta.url, outputDir]);
        } catch (err) {
            console.error("[PLAY] Error en descarga:", err.message);
            return sock.sendMessage(jid, {
                text: `❌ Error al descargar.\n*Detalle:* ${err.message}`
            }).catch(() => {});
        }

        if (!descarga.ok) {
            return sock.sendMessage(jid, { text: `❌ ${descarga.error}` }).catch(() => {});
        }

        if (!fs.existsSync(descarga.path)) {
            console.error("[PLAY] Archivo no encontrado:", descarga.path);
            return sock.sendMessage(jid, {
                text: `❌ No se encontró el archivo descargado.`
            }).catch(() => {});
        }

        // ── PASO 4: enviar archivo ────────────────────────────────────────
        try {
            if (tipo === "audio") {
                await sock.sendMessage(jid, {
                    audio: fs.readFileSync(descarga.path),
                    mimetype: "audio/mpeg",
                    ptt: false
                });
            } else {
                await sock.sendMessage(jid, {
                    video: fs.readFileSync(descarga.path),
                    mimetype: "video/mp4",
                    caption: `🎬 *${meta.title}*`
                });
            }
        } catch (sendErr) {
            console.error("[PLAY] Error al enviar:", sendErr.message);
            await sock.sendMessage(jid, {
                text: `❌ No se pudo enviar el archivo.\n*Motivo:* ${sendErr.message}`
            }).catch(() => {});
        } finally {
            fs.unlink(descarga.path, (err) => {
                if (err) console.warn("[PLAY] No se pudo eliminar:", descarga.path);
            });
        }
    }
};
