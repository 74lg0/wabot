const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion
} = require("@whiskeysockets/baileys");

const pino = require("pino");
const fs = require("fs");

const { cargarComandos } = require("./commands/loader");
const { manejarMensajes } = require("./handlers/messageHandler");
const { manejarConexion } = require("./handlers/connectionHandler");
const { iniciarScheduler } = require("./handlers/scheduler");

// ── Cargar config ─────────────────────────────────────────────────────────────
const CONFIG_PATH = "./config.json";
if (!fs.existsSync(CONFIG_PATH)) {
    console.error("❌ No se encontró config.json en la raíz del proyecto");
    process.exit(1);
}
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));

// ── Cargar comandos ───────────────────────────────────────────────────────────
const comandos = cargarComandos();
console.log(`[!] ${comandos.size} entradas de comandos cargadas\n`);

// ── Arranque del bot ──────────────────────────────────────────────────────────
async function iniciarBot() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: "silent" }),
        browser: ["Debian", "Firefox", "120.0.0"]
    });

    sock.ev.on("creds.update", saveCreds);

    manejarConexion(sock, iniciarBot);
    manejarMensajes(sock, comandos, config);
    iniciarScheduler(sock); // ← dentro de iniciarBot, donde sock ya existe

    console.log(`[!] Bot iniciado | Prefijo: "${config.prefix}" | v${version.join(".")}`);
}

iniciarBot();