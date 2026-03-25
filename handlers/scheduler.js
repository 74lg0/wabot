const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "../src/database/recordatorios.json");

function cargarDB() {
    if (!fs.existsSync(DB_PATH)) return [];
    return JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
}

function guardarDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 4));
}

function iniciarScheduler(sock) {
    // Revisar cada minuto
    setInterval(async () => {
        const ahora = new Date();
        const dia    = String(ahora.getDate()).padStart(2, "0");
        const mes    = String(ahora.getMonth() + 1).padStart(2, "0");
        const hora   = String(ahora.getHours()).padStart(2, "0");
        const minuto = String(ahora.getMinutes()).padStart(2, "0");

        const db = cargarDB();
        const pendientes = [];
        const disparados = [];

        for (const r of db) {
            if (r.day === dia && r.month === mes && r.hour === hora && r.minute === minuto) {
                disparados.push(r);
            } else {
                pendientes.push(r);
            }
        }

        for (const r of disparados) {
            try {
                await sock.sendMessage(r.jid, {
                    text: `⏰ *Recordatorio [${r.id}]*\n\n${r.message}`
                });
                console.log(`[SCHEDULER] Recordatorio ${r.id} enviado a ${r.jid}`);
            } catch (err) {
                console.error(`[SCHEDULER] Error al enviar ${r.id}:`, err.message);
            }
        }

        // Guardar solo los que no se dispararon
        if (disparados.length > 0) guardarDB(pendientes);

    }, 60 * 1000); // cada 60 segundos

    console.log("⏱️  Scheduler de recordatorios activo");
}

module.exports = { iniciarScheduler };