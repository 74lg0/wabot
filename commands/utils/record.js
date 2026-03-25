const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../../src/database/recordatorios.json");

// ── Helpers ───────────────────────────────────────────────────────────────────

function cargarDB() {
    if (!fs.existsSync(DB_PATH)) {
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
        fs.writeFileSync(DB_PATH, JSON.stringify([], null, 4));
    }
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function guardarDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 4));
}

function generarId() {
    return Date.now().toString(36).toUpperCase();
}

// ── Comando ───────────────────────────────────────────────────────────────────

module.exports = {
    nombre: "record",
    aliases: ["recordatorio", "remind"],
    categoria: "Utilidades",
    descripcion: "Crea un recordatorio",
    uso: "record DD/MM/HH/MM <mensaje>",

    ejecutar: async (sock, msg, args, { prefix }) => {
        const jid = msg.key.remoteJid;

        // ?record list — listar recordatorios
        if (args[0] === "list") {
            const db = cargarDB();
            if (db.length === 0) {
                return sock.sendMessage(jid, { text: "📭 No hay recordatorios guardados." });
            }

            const lista = db.map(r =>
                `▸ [${r.id}] ${r.day}/${r.month} a las ${r.hour}:${r.minute}\n  "${r.message}"`
            ).join("\n\n");

            return sock.sendMessage(jid, {
                text: `📋 *Recordatorios activos:*\n\n${lista}`
            });
        }

        // ?record del <ID> — eliminar recordatorio
        if (args[0] === "del") {
            const id = args[1]?.toUpperCase();
            if (!id) {
                return sock.sendMessage(jid, {
                    text: `Uso: *${prefix}record del <ID>*`
                });
            }
            const db = cargarDB();
            const idx = db.findIndex(r => r.id === id);
            if (idx === -1) {
                return sock.sendMessage(jid, { text: `❌ No existe el recordatorio *${id}*` });
            }
            db.splice(idx, 1);
            guardarDB(db);
            return sock.sendMessage(jid, { text: `🗑️ Recordatorio *${id}* eliminado.` });
        }

        // ?record DD/MM/HH/MM <mensaje>
        if (args.length < 2) {
            return sock.sendMessage(jid, {
                text: `Uso: *${prefix}record DD/MM/HH/MM <mensaje>*\n\nEjemplos:\n  *${prefix}record 25/12/09/00 Feliz Navidad!*\n  *${prefix}record list*\n  *${prefix}record del <ID>*`
            });
        }

        const fecha = args[0];
        const partes = fecha.split("/");

        if (partes.length !== 4) {
            return sock.sendMessage(jid, {
                text: `❌ Formato incorrecto. Usa: *DD/MM/HH/MM*\nEjemplo: *25/12/09/00*`
            });
        }

        const [day, month, hour, minute] = partes.map(Number);

        if (
            isNaN(day) || isNaN(month) || isNaN(hour) || isNaN(minute) ||
            day < 1 || day > 31 ||
            month < 1 || month > 12 ||
            hour < 0 || hour > 23 ||
            minute < 0 || minute > 59
        ) {
            return sock.sendMessage(jid, {
                text: `❌ Fecha inválida. Verifica:\n  Día: 1-31 | Mes: 1-12 | Hora: 0-23 | Minuto: 0-59`
            });
        }

        const mensaje = args.slice(1).join(" ");
        const id = generarId();

        const recordatorio = {
            id,
            day:    String(day).padStart(2, "0"),
            month:  String(month).padStart(2, "0"),
            hour:   String(hour).padStart(2, "0"),
            minute: String(minute).padStart(2, "0"),
            message: mensaje,
            jid,
            createdAt: new Date().toISOString()
        };

        const db = cargarDB();
        db.push(recordatorio);
        guardarDB(db);

        await sock.sendMessage(jid, {
            text: `✅ Recordatorio guardado\n\nID      : *${id}*\nFecha   : ${recordatorio.day}/${recordatorio.month}\nHora    : ${recordatorio.hour}:${recordatorio.minute}\nMensaje : ${mensaje}`
        });
    }
};