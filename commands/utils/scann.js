const { execFile } = require("child_process");
const path = require("path");
const { aliases } = require("../general/ping");

module.exports = {
    nombre: "scann",
    aliases: ["phoneinfo", "phone"],
    categoria: "Utilidades",
    descripcion: "Información de un número telefónico",
    uso: "phone <+521XXXXXXXXXX>",

    ejecutar: async (sock, msg, args, { prefix }) => {
        if (!args[0]) {
            return sock.sendMessage(msg.key.remoteJid, {
                text: `Uso: *${prefix}phone <número>*\nEjemplo: *${prefix}phone +521XXXXXXXXXX*`
            });
        }

        const numero = args[0];
        const scriptPath = path.join(__dirname, "../../scripts/scann.py");

        await sock.sendMessage(msg.key.remoteJid, {
            text: `🔍 Escaneando *${numero}*...`
        });

        execFile("python3", [scriptPath, numero], (error, stdout, stderr) => {
            if (error) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Error al ejecutar el script:\n${stderr || error.message}`
                }).catch(() => {});
            }

            sock.sendMessage(msg.key.remoteJid, {
                text: stdout.trim()
            }).catch(() => {});
        });
    }
};