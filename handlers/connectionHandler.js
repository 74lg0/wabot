const { DisconnectReason } = require("@whiskeysockets/baileys");

function manejarConexion(sock, reiniciar) {
    sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
        if (connection === "open") {
            console.log("✅ Bot conectado exitosamente");
        }

        if (connection === "close") {
            const codigo = lastDisconnect?.error?.output?.statusCode;

            if (codigo === DisconnectReason.loggedOut) {
                console.log("❌ Sesión expirada. Corre login.js nuevamente.");
                process.exit(1); // no intentar reconectar sin credenciales válidas
            }

            console.log(`🔴 Conexión cerrada (${codigo ?? "desconocido"}). Reconectando en 5s...`);
            sock.ev.removeAllListeners();
            setTimeout(reiniciar, 5000);
        }
    });
}

module.exports = { manejarConexion };