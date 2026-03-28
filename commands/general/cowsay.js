module.exports = {
    nombre: "cowsay",
    aliases: ["cow"],
    categoria: "Utilidades",
    descripcion: "Genera un cowsay como el programa original",
    uso: "cowsay [-e ojos] [-T lengua] [-l] <mensaje>",

    ejecutar: async (sock, msg, args, { prefix }) => {
        const jid = msg.key.remoteJid;

        // ── Vacas disponibles ─────────────────────────────────────────────
        const vacas = {
            default: (ojos, lengua) => [
                `        \\   ^__^`,
                `         \\  (${ojos})\\_______`,
                `            (__)\\       )\\/\\`,
                `             ${lengua}  ||----w |`,
                `                ||     ||`,
            ].join("\n"),

            tux: (ojos, lengua) => [
                `   \\`,
                `    \\`,
                `        .--.`,
                `       |o_o |`,
                `       |:_/ |`,
                `      //   \\ \\`,
                `     (|     | )`,
                `    /'\\_   _/\`\\`,
                `    \\___)=(___/`,
            ].join("\n"),

            bunny: (ojos, lengua) => [
                `  \\`,
                `   \\   /\\  /\\`,
                `      (  ${ojos}  )`,
                `      =( ${lengua} )=`,
                `        )   (`,
                `       (_,-._)`,
                `       /-( )-\\`,
                `      / /\`-'\\ \\`,
            ].join("\n"),

            dragon: (ojos, lengua) => [
                `      \\                    / /`,
                `       \\                  / /`,
                `        \\                //`,
                `         \\      _       //`,
                `          \\    | |     //`,
                `          (${ojos}) | |___ //`,
                `          (__)  \\___/`,
                `           ${lengua}`,
            ].join("\n"),

            elephant: (ojos, lengua) => [
                `  \\    /\\  ___  /\\`,
                `   \\  // \\/   \\/ \\\\`,
                `     ((    ${ojos}    ))`,
                `      \\\\ /  ${lengua}  \\ //`,
                `       \\\\|       |//`,
                `        \\|  (|)  |/`,
                `         |  (_)  |`,
                `         |       |`,
            ].join("\n"),
        };

        // ── -l : listar vacas ─────────────────────────────────────────────
        if (args[0] === "-l") {
            return sock.sendMessage(jid, {
                text: `🐄 *Vacas disponibles:*\n\n${Object.keys(vacas).map(v => `  • ${v}`).join("\n")}\n\nUso: *${prefix}cowsay -f <vaca> <mensaje>*`
            }, { quoted: msg });
        }

        // ── Parsear argumentos ────────────────────────────────────────────
        let ojos   = "oo";
        let lengua = "  ";
        let vaca   = "default";
        let textoArgs = [...args];

        while (textoArgs.length > 0) {
            const flag = textoArgs[0];

            if (flag === "-e" && textoArgs[1]) {
                ojos = textoArgs[1].slice(0, 2).padEnd(2);
                textoArgs.splice(0, 2);
            } else if (flag === "-T" && textoArgs[1]) {
                lengua = textoArgs[1].slice(0, 2).padEnd(2);
                textoArgs.splice(0, 2);
            } else if (flag === "-f" && textoArgs[1]) {
                vaca = textoArgs[1].toLowerCase();
                textoArgs.splice(0, 2);
            } else if (flag === "-d") {
                // dead cow
                ojos   = "xx";
                lengua = "U ";
                textoArgs.splice(0, 1);
            } else if (flag === "-g") {
                // greedy
                ojos   = "$$";
                textoArgs.splice(0, 1);
            } else if (flag === "-p") {
                // paranoid
                ojos   = "@@";
                textoArgs.splice(0, 1);
            } else if (flag === "-s") {
                // stoned
                ojos   = "**";
                lengua = "U ";
                textoArgs.splice(0, 1);
            } else if (flag === "-t") {
                // tired
                ojos   = "--";
                textoArgs.splice(0, 1);
            } else if (flag === "-w") {
                // wired
                ojos   = "OO";
                textoArgs.splice(0, 1);
            } else if (flag === "-y") {
                // young
                ojos   = "..";
                textoArgs.splice(0, 1);
            } else {
                break;
            }
        }

        const texto = textoArgs.join(" ").trim();

        if (!texto) {
            return sock.sendMessage(jid, {
                text: [
                    `Uso: *${prefix}cowsay [-opciones] <mensaje>*`,
                    ``,
                    `*Flags:*`,
                    `  -e XX   → ojos personalizados`,
                    `  -T XX   → lengua personalizada`,
                    `  -f nom  → elegir vaca (-l para listar)`,
                    `  -d      → muerta`,
                    `  -g      → codiciosa`,
                    `  -p      → paranoica`,
                    `  -s      → drogada`,
                    `  -t      → cansada`,
                    `  -w      → hiperactiva`,
                    `  -y      → joven`,
                    `  -l      → listar vacas`,
                ].join("\n")
            }, { quoted: msg });
        }

        // ── Construir bocadillo ───────────────────────────────────────────
        const lineas = texto.match(/.{1,40}/g) || [texto];
        const maxLen = Math.max(...lineas.map(l => l.length));
        const borde  = "-".repeat(maxLen + 2);

        let bocadillo;
        if (lineas.length === 1) {
            bocadillo = [
                ` ${borde}`,
                `< ${lineas[0].padEnd(maxLen)} >`,
                ` ${borde}`,
            ].join("\n");
        } else {
            bocadillo = [
                ` ${borde}`,
                `/ ${lineas[0].padEnd(maxLen)} \\`,
                ...lineas.slice(1, -1).map(l => `| ${l.padEnd(maxLen)} |`),
                `\\ ${lineas[lineas.length - 1].padEnd(maxLen)} /`,
                ` ${borde}`,
            ].join("\n");
        }

        // ── Elegir vaca ───────────────────────────────────────────────────
        const generarVaca = vacas[vaca] || vacas.default;
        const resultado = `\`\`\`\n${bocadillo}\n${generarVaca(ojos, lengua)}\n\`\`\``;

        await sock.sendMessage(jid, { text: resultado }, { quoted: msg });
    }
};