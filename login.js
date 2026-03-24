const {
    default: makeWASocket,
    useMultiFileAuthState,
    delay,
    fetchLatestBaileysVersion,
    DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const readline = require("readline");
const fs = require("fs");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const preguntar = (texto) => new Promise((res) => rl.question(texto, res));

async function loginWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Ubuntu", "Chrome", "20.0.04"]
    });

    if (!sock.authState.creds.registered) {
        const numero = await preguntar("Número de teléfono (ej: 521XXXXXXXXXX): ");
        const numeroLimpio = numero.replace(/[^0-9]/g, "");

        // Guardar ownerNumber en config.json
        const configPath = "./config.json";
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
        config.ownerNumber = numeroLimpio;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
        console.log(`👤 Owner guardado: ${numeroLimpio}`);

        await delay(3000);
        const codigo = await sock.requestPairingCode(numeroLimpio, "ZALGOHAK");
        console.log(`\n🔑 Código de emparejamiento: ${codigo}\n`);
    }

    // Cerrar readline
    rl.close();
    sock.ev.on("creds.update", saveCreds);
    sock.ev.on("connection.update", ({ connection, lastDisconnect }) => {
        const codigo = lastDisconnect?.error?.output?.statusCode;

        if (connection === "close") {
            // 401 = Sesión revocada
            if (codigo === DisconnectReason.loggedOut) {
                console.log("❌ Sesión cerrada por WhatsApp. Elimina auth/ y vuelve a correr login.js");
                process.exit(1);
            }
            console.log("🔄 Reconectando...");
            loginWhatsApp();

        } else if (connection === "open") {
            console.log("✅ Login guardado. Ahora puedes correr: node index.js");
            process.exit(0);
        }
    });
}

loginWhatsApp();