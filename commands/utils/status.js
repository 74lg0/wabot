const { execFile } = require("child_process");

module.exports = {
    nombre: "status",
    categoria: "Utilidades",
    descripcion: "Muestra el estado actual del bot",
    uso: "status",

    ejecutar: async (sock, msg, args, { config }) => {
        execFile("pm2", ["jlist"], (error, stdout) => {
            if (error) {
                return sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ No se pudo obtener el estado.\n${error.message}`
                }).catch(() => {});
            }

            try {
                const lista = JSON.parse(stdout);
                const bot = lista.find(p => p.name === "74lg0-WaBot") || lista[0];

                if (!bot) {
                    return sock.sendMessage(msg.key.remoteJid, {
                        text: "❌ No se encontró ningún proceso pm2 activo."
                    }).catch(() => {});
                }

                const mem = (bot.monit.memory / 1024 / 1024).toFixed(1) + "mb";
                const cpu = bot.monit.cpu + "%";
                const uptime = formatUptime(bot.pm2_env.pm_uptime);

                const texto = [
                    `▸ *${bot.name}*`,
                    ``,
                    `ID       : ${bot.pm_id}`,
                    `Status   : ${bot.pm2_env.status}`,
                    `Mode     : ${bot.pm2_env.exec_mode}`,
                    `Restarts : ${bot.pm2_env.restart_time}`,
                    `Uptime   : ${uptime}`,
                    `CPU      : ${cpu}`,
                    `Memory   : ${mem}`,
                ].join("\n");

                sock.sendMessage(msg.key.remoteJid, { text: texto }).catch(() => {});

            } catch (e) {
                sock.sendMessage(msg.key.remoteJid, {
                    text: `❌ Error al parsear respuesta de pm2.`
                }).catch(() => {});
            }
        });
    }
};

function formatUptime(timestamp) {
    const ms = Date.now() - timestamp;
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);

    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}
